"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  BanknotesIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  CalculatorIcon,
  TruckIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NewPaymentPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("orders");
  const [driverPayments, setDriverPayments] = useState([]);
  const [payment, setPayment] = useState({
    driverid: "",
    finalamount: "",
    totalkm: "",
    totalorders: "",
    advance: "",
    penalty: "",
    paymentstatus: "pending",
  });
  const [selectedDriverDetails, setSelectedDriverDetails] = useState(null);
  const [unprocessedOrders, setUnprocessedOrders] = useState([]);
  const [driverPenalties, setDriverPenalties] = useState([]);

  useEffect(() => {
    fetchDrivers();
  }, []);

  async function fetchDrivers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          id,
          email, 
          full_name, 
          phone,
          bank_account_no,
          bank_ifsc_code,
          vehicle_type,
          vehicle_number
        `
        )
        .eq("is_active", true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDriverDetails(driverId) {
    setLoading(true);
    try {
      // Fetch driver details
      const { data: driverData, error: driverError } = await supabase
        .from("users")
        .select("*")
        .eq("id", driverId)
        .single();

      if (driverError) throw driverError;

      // Fetch unpaid completed orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select(
          `
          id,
          created_at,
          start,
          destination,
          distance,
          status,
          total_amount
        `
        )
        .eq("driverid", driverId)
        .eq("status", "delivered")
        .is("payment_processed", null);

      if (ordersError) throw ordersError;

      // Fetch unpaid penalties
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from("penalties")
        .select("*")
        .eq("driver_id", driverData.id)
        .eq("status", "pending");

      if (penaltiesError) throw penaltiesError;

      // Fetch past payments for this driver
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("driver_payments")
        .select("*")
        .eq("driverid", driverId)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;
      
      setDriverPayments(paymentsData || []);
      setSelectedDriverDetails(driverData);
      setUnprocessedOrders(ordersData || []);
      setDriverPenalties(penaltiesData || []);

      // Calculate totals
      const totalDistance = ordersData.reduce(
        (sum, order) => sum + (parseFloat(order.distance) || 0),
        0
      );
      const totalAmount = (totalDistance * 7) + (ordersData.length * 2);
      const totalPenalties = penaltiesData.reduce(
        (sum, penalty) => sum + (penalty.amount || 0),
        0
      );
      
      // Get last payment's advance if it exists
      const lastPaymentAdvance = paymentsData.length > 0 ? (paymentsData[0].advance || 0) : 0;

      setPayment({
        ...payment,
        driverid: driverId,
        totalkm: totalDistance.toFixed(2),
        totalorders: ordersData.length,
        finalamount: (totalAmount - totalPenalties - lastPaymentAdvance).toFixed(2),
        penalty: totalPenalties,
      });
    } catch (error) {
      console.error("Error fetching driver details:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (payment.driverid) {
      fetchDriverDetails(payment.driverid);
    }
  }, [payment.driverid]);

  async function handleSubmit(e) {
    e.preventDefault();
    setProcessing(true);

    try {
      // First, create the payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from("driver_payments")
        .insert([
          {
            ...payment,
            finalamount: Number(payment.finalamount),
            totalorders: Number(payment.totalorders),
            advance: Number(payment.advance) || 0,
            penalty: Number(payment.penalty) || 0,
            processed_orders: unprocessedOrders.map((order) => order.id), // Store processed order IDs
          },
        ])
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Update all processed orders
      const { error: ordersError } = await supabase
        .from("orders")
        .update({ payment_processed: new Date().toISOString() })
        .in(
          "id",
          unprocessedOrders.map((order) => order.id)
        );

      if (ordersError) throw ordersError;

      // Update penalties to processed
      if (driverPenalties.length > 0) {
        const { error: penaltiesError } = await supabase
          .from("penalties")
          .update({ status: "processed" })
          .in(
            "id",
            driverPenalties.map((penalty) => penalty.id)
          );

        if (penaltiesError) throw penaltiesError;
      }

      // Create notification
      await supabase.from("notifications").insert([
        {
          recipient_type: "driver",
          recipient_id: selectedDriverDetails.id,
          title: "New Payment Processed",
          message: `A payment of ₹${payment.finalamount} has been processed for ${unprocessedOrders.length} orders (${payment.totalkm} km)`,
          type: "payment",
        },
      ]);

      router.push("/dashboard/payments");
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Error processing payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <DashboardLayout
      title="Process New Payment"
      subtitle="Create a new payment record for a driver"
      actions={
        <button
          onClick={() => router.push("/dashboard/payments")}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Payments
        </button>
      }
    >
      <div className="max-w-[1600px] mx-auto p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-100 rounded-xl h-32"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Section - Driver Selection and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Driver Selection */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Driver
                  </h3>
                  <select
                    value={payment.driverid}
                    onChange={(e) =>
                      setPayment({ ...payment, driverid: e.target.value })
                    }
                    className="block w-full rounded-lg border-gray-200 py-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  >
                    <option value="">Select a driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} ({driver.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payment Summary */}
              {selectedDriverDetails && (
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Payment Summary
                    </h3>
                    <div className="grid grid-cols-6 gap-6 mb-6">
                      <div className="col-span-3 bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-purple-600 font-medium">
                          Final Amount
                        </p>
                        <p className="text-3xl font-bold text-purple-700">
                          ₹{payment.finalamount}
                        </p>
                      </div>
                      <div className="col-span-3 bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-green-600 font-medium">
                          Total Distance
                        </p>
                        <p className="text-3xl font-bold text-green-700">
                          {payment.totalkm} km
                        </p>
                      </div>
                      <div className="col-span-2 bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-blue-600 font-medium">
                          Total Orders
                        </p>
                        <p className="text-2xl font-bold text-blue-700">
                          {payment.totalorders}
                        </p>
                      </div>
                      <div className="col-span-2 bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-red-600 font-medium">
                          Penalties
                        </p>
                        <p className="text-2xl font-bold text-red-700">
                          ₹{payment.penalty}
                        </p>
                      </div>
                      {driverPayments.length > 0 && (
                        <div className="col-span-2 bg-amber-50 rounded-lg p-4">
                          <p className="text-sm text-amber-600 font-medium">
                            Last Advance
                          </p>
                          <p className="text-2xl font-bold text-amber-700">
                            ₹{driverPayments[0].advance || 0}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {selectedDriverDetails && (
              <>
                {/* Middle Section - Driver Details */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Driver Information
                      </h3>
                      <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                        Active Driver
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Full Name
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {selectedDriverDetails.full_name}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Phone</p>
                          <p className="text-base font-semibold text-gray-900">
                            {selectedDriverDetails.phone}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Bank Account
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {selectedDriverDetails.bank_account_no}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            IFSC Code
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {selectedDriverDetails.bank_ifsc_code}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Vehicle Details
                          </p>
                          <p className="text-base font-semibold text-gray-900">
                            {selectedDriverDetails.vehicle_type} -{" "}
                            {selectedDriverDetails.vehicle_number}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-500 mb-1 block">
                            Advance Payment
                          </label>
                          <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 sm:text-sm">₹</span>
                            </div>
                            <input
                              type="number"
                              value={payment.advance}
                              onChange={(e) =>
                                setPayment({
                                  ...payment,
                                  advance: e.target.value,
                                })
                              }
                              className="block w-full rounded-lg border border-gray-300 pl-7 py-3 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                              placeholder="Enter advance amount"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Section - Orders and Penalties */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                  <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                      <button
                        onClick={() => setActiveTab("orders")}
                        className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "orders"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <DocumentTextIcon className="w-5 h-5 inline mr-2" />
                        Unprocessed Orders
                      </button>
                      <button
                        onClick={() => setActiveTab("penalties")}
                        className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "penalties"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <XCircleIcon className="w-5 h-5 inline mr-2" />
                        Pending Penalties
                      </button>
                      <button
                        onClick={() => setActiveTab("payments")}
                        className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                          activeTab === "payments"
                            ? "border-blue-500 text-blue-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                      >
                        <BanknotesIcon className="w-5 h-5 inline mr-2" />
                        Past Payments
                      </button>
                    </nav>
                  </div>

                  {activeTab === "orders" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Unprocessed Orders
                        </h3>
                        <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                          {unprocessedOrders.length} Orders
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Order ID
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Distance
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {unprocessedOrders.map((order) => (
                              <tr
                                key={order.id}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  #{order.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {new Date(
                                    order.created_at
                                  ).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  {order.distance} km
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  ₹{order.total_amount}
                                </td>
                              </tr>
                            ))}
                            {unprocessedOrders.length === 0 && (
                              <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                                  No unprocessed orders found
                                </td>
                              </tr>
                            )}
                            {unprocessedOrders.length > 0 && (
                              <tr className="bg-gray-100 font-medium">
                                <td className="px-6 py-4 text-sm text-gray-700" colSpan="2">
                                  Total
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {payment.totalkm} km
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-blue-600">
                                  ₹{(parseFloat(payment.totalkm) * 7 + unprocessedOrders.length * 2).toFixed(2)}
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {activeTab === "penalties" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Pending Penalties
                        </h3>
                        <span className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full">
                          {driverPenalties.length} Penalties
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        {driverPenalties.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {driverPenalties.map((penalty) => (
                                <tr
                                  key={penalty.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(
                                      penalty.created_at
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {penalty.reason}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                    -₹{penalty.amount}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-center text-gray-500 py-4">
                            No pending penalties
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "payments" && (
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Past Payments
                        </h3>
                        <span className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                          {driverPayments.length} Payments
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        {driverPayments.length > 0 ? (
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Orders
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {driverPayments.map((payment) => (
                                <tr
                                  key={payment.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(
                                      payment.created_at
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ₹{payment.finalamount}
                                    {payment.advance > 0 && (
                                      <div className="text-xs text-gray-500">
                                        Advance: ₹{payment.advance}
                                      </div>
                                    )}
                                    {payment.penalty > 0 && (
                                      <div className="text-xs text-red-500">
                                        Penalty: ₹{payment.penalty}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {payment.totalorders} orders ({payment.totalkm} km)
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        payment.paymentstatus === "completed"
                                          ? "bg-green-100 text-green-800"
                                          : payment.paymentstatus === "pending"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                      }`}
                                    >
                                      {payment.paymentstatus}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <Link
                                      href={`/dashboard/payments/${payment.id}`}
                                      className="text-blue-600 hover:text-blue-900"
                                    >
                                      View
                                    </Link>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-center text-gray-500 py-4">
                            No payment history found
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Process Payment Button */}
                <div className="flex justify-end mt-6">
                  {parseFloat(payment.finalamount) < 0 && (
                    <div className="mr-4 flex items-center text-red-600">
                      <XCircleIcon className="w-5 h-5 mr-2" />
                      <span>Cannot process negative payment amount</span>
                    </div>
                  )}
                  <button
                    onClick={handleSubmit}
                    disabled={processing || parseFloat(payment.finalamount) < 0}
                    className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <BanknotesIcon className="w-5 h-5 mr-2" />
                    {processing ? "Processing Payment..." : "Process Payment"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
