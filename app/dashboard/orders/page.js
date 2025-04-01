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
  DocumentCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const getPaymentStatusColor = (status) => {
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    prepaid: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

const getStatusStyle = (status) => {
  const styles = {
    confirmed: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      label: "Confirmed",
    },
    accepted: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Accepted",
    },
    picked_up: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Picked Up",
    },
    on_way: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "On The Way",
    },
    reached: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Reached",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Delivered",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Cancelled",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending",
    },
  };
  return styles[status] || styles.pending;
};

const getStatusColor = (status) => {
  const styles = getStatusStyle(status);
  return `${styles.bg} ${styles.text}`;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    accepted: 0,
    on_way: 0,
    reached: 0,
    delivered: 0,
    cancelled: 0,
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

      // Get counts for all statuses
      const statuses = ["pending", "confirmed", "accepted", "on_way", "reached", "delivered", "cancelled"];
      const statusCounts = {};

      // Fetch counts for each status
      for (const status of statuses) {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact" })
          .eq("status", status);
        
        statusCounts[status] = count || 0;
      }

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
        ...statusCounts,
        pendingOrders: statusCounts.pending || 0,
        activeDeliveries: statusCounts.on_way || 0,
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
          users:driverid (full_name, phone, vehicle_number),
          stores (name, icon)
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
      value: stats.pending,
      icon: ClockIcon,
      style: getStatusStyle("pending"),
      status: "pending"
    },
    {
      title: "Confirmed Orders",
      value: stats.confirmed,
      icon: DocumentCheckIcon,
      style: getStatusStyle("confirmed"),
      status: "confirmed"
    },
    {
      title: "On The Way",
      value: stats.on_way,
      icon: TruckIcon,
      style: getStatusStyle("on_way"),
      status: "on_way"
    },
    {
      title: "Delivered Orders",
      value: stats.delivered,
      icon: CheckCircleIcon,
      style: getStatusStyle("delivered"),
      status: "delivered"
    },
    // {
    //   title: "Today's Revenue",
    //   value: `₹${stats.todayRevenue.toFixed(2)}`,
    //   icon: BanknotesIcon,
    //   color: "purple",
    // },
  ];

  return (
    <DashboardLayout
      title="Orders"
      actions={
        <div className="flex gap-3">
          <Link
            href="/dashboard/orders/drivers"
            className="dashboard-button-secondary flex items-center gap-2"
          >
            <UserGroupIcon className="w-5 h-5" />
            Track Drivers
          </Link>
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
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setActiveTab(card.status)}
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
                <div className={`p-3 rounded-xl ${card.style ? card.style.bg : `bg-${card.color}-50`}`}>
                  <card.icon className={`w-6 h-6 ${card.style ? card.style.text : `text-${card.color}-600`}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["pending", "confirmed", "accepted", "on_way", "reached", "delivered", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`flex items-center py-2.5 px-4 rounded-lg capitalize transition-all duration-200 text-sm font-medium ${
                activeTab === status
                  ? `${getStatusStyle(status).bg} ${getStatusStyle(status).text} shadow-sm`
                  : "bg-white/50 text-[#605e5c] hover:bg-white"
              }`}
            >
              {getStatusStyle(status).label}
              {stats[status] > 0 && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === status 
                    ? "bg-white/20" 
                    : getStatusStyle(status).bg
                }`}>
                  {stats[status]}
                </span>
              )}
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
                    <th className="px-3 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      🏪
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
                      Batch
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
                      <td className="px-3 py-4 text-center text-lg">
                        {order.stores?.icon || "❌"}
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
                        {order.batch_id ? (
                          <Link 
                            href={`/dashboard/batches/${order.batch_id}`}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            <DocumentDuplicateIcon className="w-4 h-4 mr-1" />
                            {order.is_return_to_store ? 'Return' : (order.delivery_sequence || '-')}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
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
                            order.payment_status === "pending" && (!order.total_amount || parseFloat(order.total_amount) === 0) ? "prepaid" : order.payment_status
                          )}`}
                        >
                          {order.payment_status === "pending" && (!order.total_amount || parseFloat(order.total_amount) === 0) ? "Prepaid" : order.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusStyle(order.status)?.label || order.status}
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
                          {(order.status === "confirmed" || order.status === "accepted" || order.status === "on_way" || order.status === "reached") && order.driverid && (
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
