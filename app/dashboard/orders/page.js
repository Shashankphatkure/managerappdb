"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import {
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  BanknotesIcon,
  PlusIcon,
  DocumentDuplicateIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

const getPaymentStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    accepted: "bg-purple-100 text-purple-800",
    picked_up: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [stats, setStats] = useState({
    pendingOrders: 0,
    activeDeliveries: 0,
    completedToday: 0,
    todayRevenue: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, [activeTab]);

  async function fetchStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get pending orders count
      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("status", "pending");

      // Get active deliveries count (picked_up status)
      const { count: activeCount } = await supabase
        .from("orders")
        .select("*", { count: "exact" })
        .eq("status", "picked_up");

      // Get today's completed orders and revenue
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("status", "delivered")
        .gte("created_at", today.toISOString());

      const completedToday = todayOrders?.length || 0;
      const todayRevenue =
        todayOrders?.reduce(
          (sum, order) => sum + (parseFloat(order.total_amount) || 0),
          0
        ) || 0;

      setStats({
        pendingOrders: pendingCount || 0,
        activeDeliveries: activeCount || 0,
        completedToday,
        todayRevenue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchOrders() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers (full_name, phone),
          users:driverid (full_name, phone, vehicle_number)
        `
        )
        .eq("status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  }

  const statsCards = [
    {
      title: "Pending Orders",
      value: stats.pendingOrders,
      icon: ClockIcon,
      color: "yellow",
    },
    {
      title: "Active Deliveries",
      value: stats.activeDeliveries,
      icon: TruckIcon,
      color: "blue",
    },
    {
      title: "Today's Completed",
      value: stats.completedToday,
      icon: CheckCircleIcon,
      color: "green",
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toFixed(2)}`,
      icon: BanknotesIcon,
      color: "purple",
    },
  ];

  return (
    <DashboardLayout
      title="Orders"
      actions={
        <div className="flex gap-3">
          <Link
            href="/dashboard/orders/map"
            className="dashboard-button-secondary flex items-center gap-2"
          >
            <MapIcon className="w-5 h-5" />
            View Map
          </Link>
          <Link
            href="/dashboard/orders/new"
            className="dashboard-button-primary flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" /> Create New Order
          </Link>
          <Link
            href="/dashboard/orders/multiorder"
            className="dashboard-button-secondary flex items-center gap-2"
          >
            <DocumentDuplicateIcon className="w-5 h-5" /> Create Multi-Order
          </Link>
        </div>
      }
    >
      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {statsCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#605e5c]">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold mt-2 text-[#323130]">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl bg-${card.color}-50`}>
                  <card.icon className={`w-6 h-6 text-${card.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex mb-6 bg-[#f3f2f1] rounded-xl p-1.5">
          {[
            "pending",
            "confirmed",
            "accepted",
            "picked_up",
            "delivered",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex-1 py-2.5 px-4 rounded-lg capitalize transition-all duration-200 text-sm font-medium ${
                activeTab === status
                  ? "bg-white shadow-sm text-[#323130]"
                  : "text-[#605e5c] hover:bg-white/50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-[#f3f2f1] rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#edebe9]">
                <thead>
                  <tr className="bg-[#f8f8f8]">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pickup
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timing
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.customers?.full_name || order.customername}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.customers?.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.users?.full_name || "Unassigned"}
                          </p>
                          {order.users?.phone && (
                            <p className="text-sm text-gray-500">
                              {order.users.phone}
                              {order.users.vehicle_number &&
                                ` • ${order.users.vehicle_number}`}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {order.start}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {order.destination}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.created_at && new Date(order.created_at).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                          {order.time && (
                            <p className="text-sm text-gray-500">
                              Est. Time: {order.time}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{parseFloat(order.total_amount || 0).toFixed(2)}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            order.payment_status
                          )}`}
                        >
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/orders/${order.id}/view`}
                            className="text-blue-600 hover:text-blue-900 font-medium"
                          >
                            View
                          </Link>
                          {order.status === "pending" && !order.driverid && (
                            <Link
                              href={`/dashboard/orders/${order.id}/assign`}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Assign
                            </Link>
                          )}
                          {order.status === "accepted" && order.driverid && (
                            <Link
                              href={`/dashboard/orders/${order.id}/transfer`}
                              className="text-orange-600 hover:text-orange-900 font-medium"
                            >
                              Transfer
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No {activeTab} orders
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                There are no orders with {activeTab} status at the moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
