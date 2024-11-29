"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  BuildingStorefrontIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  UserIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function DriverAssignmentsPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [driver, setDriver] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDriverAndOrders();
  }, []);

  async function fetchDriverAndOrders() {
    try {
      // Fetch driver details
      const { data: driverData, error: driverError } = await supabase
        .from("delivery_personnel")
        .select("*")
        .eq("id", id)
        .single();

      if (driverError) throw driverError;
      setDriver(driverData);

      // Fetch all orders for this driver
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("driverid", id)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Error fetching data:", error.message);
      alert("Error fetching driver assignments");
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      picked_up: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <DashboardLayout
      title="Driver Assignments"
      subtitle={
        driver
          ? `${driver.full_name} (${driver.phone})`
          : "Loading driver details..."
      }
      actions={
        <button
          onClick={() => router.push("/dashboard/drivers")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Drivers
        </button>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[#f3f2f1] rounded h-48"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-[#605e5c]" />
                    <span className="font-medium">Order #{order.id}</span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-5 h-5 text-[#605e5c] shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p>{order.start}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="w-5 h-5 text-[#605e5c] shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Delivery</p>
                      <p>{order.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-[#605e5c]" />
                    <span>{order.customername}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-[#605e5c]" />
                    <span>{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                  {order.total_amount && (
                    <div className="flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-[#605e5c]" />
                      <span>${parseFloat(order.total_amount).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#edebe9]">
                  <Link
                    href={`/dashboard/orders/${order.id}/view`}
                    className="text-[#0078d4] hover:text-[#106ebe] flex items-center gap-1"
                  >
                    View Details
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}

            {orders.length === 0 && (
              <div className="col-span-full text-center py-12">
                <TruckIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No assignments found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This driver hasn't been assigned any orders yet.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
