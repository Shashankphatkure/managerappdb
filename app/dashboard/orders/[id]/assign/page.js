"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { use } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  TruckIcon,
  UserGroupIcon,
  BellAlertIcon,
  ArrowLeftIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

export default function AssignOrderPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [driverSearch, setDriverSearch] = useState("");
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [selectedDriverInfo, setSelectedDriverInfo] = useState(null);
  const [driverActiveOrders, setDriverActiveOrders] = useState([]);

  useEffect(() => {
    Promise.all([fetchDrivers(), fetchOrderDetails()]);
  }, []);

  async function fetchOrderDetails() {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (
            id,
            full_name,
            phone,
            email
          ),
          stores (
            id,
            name,
            address,
            phone,
            opening_time,
            closing_time
          )
        `
        )
        .eq("id", id)
        .single();

      if (orderError) throw orderError;
      setOrderDetails(orderData);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function fetchDrivers() {
    try {
      const { data: driversData, error: driversError } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (driversError) throw driversError;

      const driversWithCounts = await Promise.all(
        driversData.map(async (driver) => {
          const { count, error: countError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("driverid", driver.id)
            .eq("status", "confirmed");

          return {
            ...driver,
            active_orders: { count: count || 0 },
          };
        })
      );

      const sortedDrivers = driversWithCounts.sort(
        (a, b) => (a.active_orders?.count || 0) - (b.active_orders?.count || 0)
      );

      setDrivers(sortedDrivers || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDriverActiveOrders(driverId) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("driverid", driverId)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDriverActiveOrders(data || []);
    } catch (error) {
      console.error("Error fetching driver orders:", error);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setAssigning(true);

    try {
      const { data: driverData } = await supabase
        .from("users")
        .select("full_name, email, phone, vehicle_number")
        .eq("id", selectedDriver)
        .single();

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          driverid: selectedDriver,
          drivername: driverData.full_name,
          driveremail: driverData.email,
          status: "confirmed",
        })
        .eq("id", id);

      if (updateError) throw updateError;

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            recipient_type: "driver",
            recipient_id: selectedDriver,
            title: "New Order Assigned",
            message: `Order #${id} has been assigned to you`,
            type: "order",
          },
        ]);

      if (notificationError) throw notificationError;

      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error assigning order:", error);
      alert("Error assigning order. Please try again.");
    } finally {
      setAssigning(false);
    }
  }

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.full_name?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      driver.phone?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      driver.location?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  return (
    <DashboardLayout
      title={`Assign Order #${id}`}
      actions={
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Orders
        </button>
      }
    >
      <div className="p-6">
        {/* Updated Order Details Card */}
        {orderDetails && (
          <div className="dashboard-card mb-6">
            <div className="flex items-center gap-2 mb-6">
              <TruckIcon className="w-6 h-6 text-gray-400" />
              <h2 className="text-lg font-semibold">Order Details</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Customer & Payment Information */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Customer Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">
                        {orderDetails.customers?.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">
                        {orderDetails.customers?.phone}
                      </p>
                    </div>
                    {orderDetails.customers?.email && (
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {orderDetails.customers?.email}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Payment Details
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Amount</p>
                      <p className="font-medium">
                        ${parseFloat(orderDetails.total_amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Payment Status</p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          orderDetails.payment_status === "completed"
                            ? "bg-green-100 text-green-800"
                            : orderDetails.payment_status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {orderDetails.payment_status?.toUpperCase()}
                      </span>
                    </div>
                    {orderDetails.payment_method && (
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-medium">
                          {orderDetails.payment_method}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Store & Delivery Information */}
              <div className="space-y-6">
                {orderDetails.stores && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-4">
                      Store Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Store Name</p>
                        <p className="font-medium">
                          {orderDetails.stores.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Address</p>
                        <p className="font-medium">
                          {orderDetails.stores.address}
                        </p>
                      </div>
                      {orderDetails.stores.phone && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">
                            {orderDetails.stores.phone}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Operating Hours</p>
                        <p className="font-medium">
                          {orderDetails.stores.opening_time?.slice(0, 5)} -{" "}
                          {orderDetails.stores.closing_time?.slice(0, 5)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Delivery Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Pickup Location</p>
                      <p className="font-medium">
                        {orderDetails.start || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Delivery Address</p>
                      <p className="font-medium">
                        {orderDetails.destination || "Not specified"}
                      </p>
                    </div>
                    {orderDetails.delivery_notes && (
                      <div>
                        <p className="text-sm text-gray-500">Delivery Notes</p>
                        <p className="font-medium">
                          {orderDetails.delivery_notes}
                        </p>
                      </div>
                    )}
                    {orderDetails.distance && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Estimated Distance
                        </p>
                        <p className="font-medium">{orderDetails.distance}</p>
                      </div>
                    )}
                    {orderDetails.time && (
                      <div>
                        <p className="text-sm text-gray-500">Estimated Time</p>
                        <p className="font-medium">{orderDetails.time}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Updated Driver Selection Form */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <UserGroupIcon className="w-6 h-6 text-[#605e5c]" />
              <h2 className="text-lg font-semibold">Select Driver</h2>
            </div>
            <button
              onClick={handleAssign}
              disabled={!selectedDriver || assigning}
              className="dashboard-button-primary flex items-center gap-2 disabled:opacity-50"
            >
              <BellAlertIcon className="w-5 h-5" />
              {assigning ? "Assigning..." : "Assign Order"}
            </button>
          </div>

          {/* Driver Search */}
          <div className="mb-4 relative">
            <div className="relative">
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search drivers by name, phone, or location..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-[#f3f2f1] rounded"></div>
              <div className="h-32 bg-[#f3f2f1] rounded"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDrivers.map((driver) => (
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver.id)}
                  className={`p-4 rounded-lg border text-left hover:border-blue-500 transition-colors cursor-pointer ${
                    selectedDriver === driver.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <UserGroupIcon className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold">
                      {driver.full_name}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-500">{driver.phone}</p>
                  <p className="text-sm text-gray-500">{driver.location}</p>
                  <p className="text-sm text-gray-500">
                    Active Orders: {driver.active_orders?.count}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Driver Info Modal */}
      {showDriverInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedDriverInfo?.full_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Driver Information</p>
              </div>
              <button
                onClick={() => setShowDriverInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {selectedDriverInfo && (
              <div className="space-y-6">
                {/* Driver Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedDriverInfo.phone}
                      </p>
                    </div>
                    {selectedDriverInfo.alternate_phone && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Alternative Phone
                        </p>
                        <p className="text-base font-medium text-gray-900">
                          {selectedDriverInfo.alternate_phone}
                        </p>
                      </div>
                    )}
                    {selectedDriverInfo.location && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-base font-medium text-gray-900">
                          {selectedDriverInfo.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Orders Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Active Orders
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {driverActiveOrders.length} Orders
                    </span>
                  </div>

                  <div className="space-y-4">
                    {driverActiveOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 rounded-full p-2">
                              <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {order.customername}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Created:{" "}
                                {new Date(
                                  order.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Pickup Location
                            </p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {order.start || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Drop Location
                            </p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {order.destination || "Not specified"}
                            </p>
                          </div>
                        </div>

                        {order.delivery_notes && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">
                              Delivery Notes
                            </p>
                            <p className="text-sm text-gray-900">
                              {order.delivery_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {driverActiveOrders.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-base">
                          No active orders found for this driver
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
