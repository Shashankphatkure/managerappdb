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
} from "@heroicons/react/24/outline";

export default function AssignOrderPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    Promise.all([fetchDrivers(), fetchOrderDetails()]);
  }, []);

  async function fetchOrderDetails() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          stores (name, address),
          users (full_name, phone)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrderDetails(data);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function fetchDrivers() {
    try {
      const { data, error } = await supabase
        .from("delivery_personnel")
        .select("id, full_name, phone, is_active")
        .eq("is_active", true);

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e) {
    e.preventDefault();
    setAssigning(true);

    try {
      const { data: driverData } = await supabase
        .from("delivery_personnel")
        .select("full_name, email")
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

  return (
    <DashboardLayout
      title={`Assign Order #${id.slice(0, 8)}`}
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
        <div className="max-w-3xl mx-auto">
          {/* Order Details Card */}
          {orderDetails && (
            <div className="dashboard-card mb-6">
              <div className="flex items-center gap-2 mb-4">
                <TruckIcon className="w-6 h-6 text-gray-400" />
                <h2 className="text-lg font-semibold">Order Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{orderDetails.users?.full_name}</p>
                  <p className="text-gray-600">{orderDetails.users?.phone}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Store</p>
                  <p className="font-medium">{orderDetails.stores?.name}</p>
                  <p className="text-gray-600">
                    {orderDetails.stores?.address}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Delivery Address</p>
                  <p className="text-gray-600">
                    {orderDetails.delivery_address}
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">
                    ${parseFloat(orderDetails.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Driver Selection Form */}
          <div className="dashboard-card">
            <div className="flex items-center gap-2 mb-6">
              <UserGroupIcon className="w-6 h-6 text-[#605e5c]" />
              <h2 className="text-lg font-semibold">Select Driver</h2>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-[#f3f2f1] rounded"></div>
                <div className="h-10 bg-[#f3f2f1] rounded w-1/2"></div>
              </div>
            ) : (
              <form onSubmit={handleAssign} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Drivers
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="dashboard-input"
                    required
                  >
                    <option value="">Choose a driver</option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.full_name} - {driver.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={assigning}
                    className="dashboard-button-primary flex items-center gap-2"
                  >
                    <BellAlertIcon className="w-5 h-5" />
                    {assigning ? "Assigning..." : "Assign Order"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
