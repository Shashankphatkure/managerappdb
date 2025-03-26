"use client";
import { useState, useEffect, use } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  BanknotesIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  TruckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function PaymentDetailsPage({ params }) {
  const router = useRouter();
  const paymentId = use(params).id;
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processedOrders, setProcessedOrders] = useState([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  async function fetchPaymentDetails() {
    try {
      // Fetch payment data
      const { data: paymentData, error: paymentError } = await supabase
        .from("driver_payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (paymentError) throw paymentError;

      // Fetch driver details
      const { data: driverData, error: driverError } = await supabase
        .from("users")
        .select(
          `
          id,
          full_name,
          email,
          phone,
          bank_account_no,
          bank_ifsc_code,
          vehicle_type,
          vehicle_number
        `
        )
        .eq("id", paymentData.driverid)
        .single();

      if (driverError) {
        console.error("Error fetching driver details:", driverError);
      }

      // Fetch processed orders if available
      if (paymentData.processed_orders && paymentData.processed_orders.length > 0) {
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select("*")
          .in("id", paymentData.processed_orders);

        if (!ordersError) {
          setProcessedOrders(ordersData);
        }
      }

      // Combine the data
      setPayment({
        ...paymentData,
        delivery_personnel: driverData || null
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusUpdate(newStatus) {
    try {
      const { error } = await supabase
        .from("driver_payments")
        .update({ paymentstatus: newStatus })
        .eq("id", paymentId);

      if (error) throw error;

      // Refresh payment details
      fetchPaymentDetails();

      // Send notification
      if (payment.delivery_personnel?.id) {
        await supabase.from("notifications").insert([
          {
            recipient_type: "driver",
            recipient_id: payment.delivery_personnel.id,
            title: "Payment Status Updated",
            message: `Your payment status has been updated to ${newStatus}`,
            type: "payment",
          },
        ]);
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("Error updating payment status. Please try again.");
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircleIcon,
      },
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: ExclamationCircleIcon,
      },
      failed: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircleIcon,
      },
    };

    const badge = badges[status] || badges.pending;

    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text} gap-1`}
      >
        <badge.icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <DashboardLayout title="Payment Details">
        <div className="max-w-[1600px] mx-auto p-6">
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-gray-100 rounded-xl h-40"
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Payment Details"
      subtitle={`Payment #${paymentId}`}
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
        <div className="space-y-6">
          {/* Payment Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Summary
              </h3>
              {getStatusBadge(payment.paymentstatus)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">
                  Total Orders
                </p>
                <p className="text-2xl font-bold text-blue-700">
                  {payment.totalorders}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">
                  Total Distance
                </p>
                <p className="text-2xl font-bold text-green-700">
                  {payment.totalkm} km
                </p>
              </div>
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">Penalties</p>
                <p className="text-2xl font-bold text-red-700">
                  ${payment.penalty || 0}
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">
                  Final Amount
                </p>
                <p className="text-2xl font-bold text-purple-700">
                  ${payment.finalamount}
                </p>
              </div>
            </div>
          </div>

          {/* Driver Information */}
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
                    <p className="text-sm text-gray-500 mb-1">Full Name</p>
                    <p className="text-base font-semibold text-gray-900">
                      {payment.delivery_personnel?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Phone</p>
                    <p className="text-base font-semibold text-gray-900">
                      {payment.delivery_personnel?.phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Bank Account</p>
                    <p className="text-base font-semibold text-gray-900">
                      {payment.delivery_personnel?.bank_account_no}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">IFSC Code</p>
                    <p className="text-base font-semibold text-gray-900">
                      {payment.delivery_personnel?.bank_ifsc_code}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Vehicle Details
                    </p>
                    <p className="text-base font-semibold text-gray-900">
                      {payment.delivery_personnel?.vehicle_type} -{" "}
                      {payment.delivery_personnel?.vehicle_number}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Created At</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Processed Orders */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Processed Orders
                </h3>
                <span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                  {processedOrders.length} Orders
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.distance} km
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${order.total_amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Status Update Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Payment Status
                  </h3>
                  <p className="text-sm text-gray-500">
                    Update the payment status if needed
                  </p>
                </div>
                <div className="flex gap-3">
                  {payment.paymentstatus !== "completed" && (
                    <button
                      onClick={() => handleStatusUpdate("completed")}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                      <CheckCircleIcon className="w-5 h-5 mr-2" />
                      Mark as Completed
                    </button>
                  )}
                  {payment.paymentstatus !== "failed" && (
                    <button
                      onClick={() => handleStatusUpdate("failed")}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                      <XCircleIcon className="w-5 h-5 mr-2" />
                      Mark as Failed
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
