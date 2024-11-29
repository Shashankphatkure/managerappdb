"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { use } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  ArrowPathIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  TruckIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function TransferOrderPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [drivers, setDrivers] = useState([]);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [transferring, setTransferring] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);

  useEffect(() => {
    Promise.all([fetchOrderAndDrivers(), fetchOrderDetails()]);
  }, []);

  async function fetchOrderDetails() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          stores (name, address),
          users (full_name, phone),
          delivery_assignments (
            delivery_personnel (full_name, phone)
          )
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

  async function fetchOrderAndDrivers() {
    try {
      // Fetch current assignment
      const { data: assignment } = await supabase
        .from("delivery_assignments")
        .select("delivery_personnel_id, delivery_personnel (full_name)")
        .eq("order_id", id)
        .single();

      if (assignment) {
        setCurrentDriver({
          id: assignment.delivery_personnel_id,
          name: assignment.delivery_personnel.full_name,
        });
      }

      // Fetch available drivers
      const { data: availableDrivers } = await supabase
        .from("delivery_personnel")
        .select("id, full_name, phone")
        .eq("is_active", true);

      setDrivers(availableDrivers || []);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleTransfer(e) {
    e.preventDefault();
    setTransferring(true);

    try {
      // Create transfer record
      const { error: transferError } = await supabase
        .from("order_transfers")
        .insert([
          {
            order_id: id,
            from_driver_id: currentDriver.id,
            to_driver_id: selectedDriver,
            reason,
          },
        ]);

      if (transferError) throw transferError;

      // Update delivery assignment
      const { error: assignmentError } = await supabase
        .from("delivery_assignments")
        .update({ delivery_personnel_id: selectedDriver })
        .eq("order_id", id);

      if (assignmentError) throw assignmentError;

      // Create notifications for both drivers
      await Promise.all([
        supabase.from("notifications").insert([
          {
            recipient_type: "driver",
            recipient_id: currentDriver.id,
            title: "Order Transferred",
            message: `Order #${id} has been reassigned to another driver`,
            type: "order",
          },
          {
            recipient_type: "driver",
            recipient_id: selectedDriver,
            title: "New Order Assigned",
            message: `Order #${id} has been assigned to you`,
            type: "order",
          },
        ]),
      ]);

      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error transferring order:", error);
      alert("Error transferring order. Please try again.");
    } finally {
      setTransferring(false);
    }
  }

  return (
    <DashboardLayout
      title={`Transfer Order #${id.slice(0, 8)}`}
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
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">
                      {orderDetails.users?.full_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5 text-gray-400" />
                    <span>{orderDetails.users?.phone}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Store</p>
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">
                      {orderDetails.stores?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-5 h-5 text-gray-400" />
                    <span>{orderDetails.stores?.address}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">Current Driver</p>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium">
                      {orderDetails.delivery_assignments?.[0]
                        ?.delivery_personnel?.full_name || "No driver assigned"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Form */}
          <div className="dashboard-card">
            <div className="flex items-center gap-2 mb-6">
              <ArrowPathIcon className="w-6 h-6 text-[#605e5c]" />
              <h2 className="text-lg font-semibold">Transfer Order</h2>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-[#f3f2f1] rounded"></div>
                <div className="h-32 bg-[#f3f2f1] rounded"></div>
              </div>
            ) : (
              <form onSubmit={handleTransfer} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Driver
                  </label>
                  <select
                    value={selectedDriver}
                    onChange={(e) => setSelectedDriver(e.target.value)}
                    className="dashboard-input"
                    required
                  >
                    <option value="">Select Driver</option>
                    {drivers
                      .filter((driver) => driver.id !== currentDriver?.id)
                      .map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name} - {driver.phone}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Transfer Reason
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DocumentTextIcon
                        className="h-5 w-5 text-gray-400"
                        aria-hidden="true"
                      />
                    </div>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="dashboard-input pl-10"
                      rows={4}
                      required
                      placeholder="Enter reason for transfer..."
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={transferring}
                    className="dashboard-button-primary flex items-center gap-2"
                  >
                    <ArrowPathIcon className="w-5 h-5" />
                    {transferring ? "Transferring..." : "Transfer Order"}
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
