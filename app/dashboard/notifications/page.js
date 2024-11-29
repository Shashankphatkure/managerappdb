"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../components/DashboardLayout";
import {
  BellIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  TruckIcon,
  BanknotesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalNotifications: 0,
    unreadCount: 0,
    orderNotifications: 0,
    paymentNotifications: 0,
    penaltyNotifications: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);

      // Calculate stats
      const unread = data?.filter((n) => !n.is_read).length || 0;
      const orders = data?.filter((n) => n.type === "order").length || 0;
      const payments = data?.filter((n) => n.type === "payment").length || 0;
      const penalties = data?.filter((n) => n.type === "penalty").length || 0;

      setStats({
        totalNotifications: data?.length || 0,
        unreadCount: unread,
        orderNotifications: orders,
        paymentNotifications: payments,
        penaltyNotifications: penalties,
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications(
        notifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );

      // Update unread count in stats
      setStats({
        ...stats,
        unreadCount: stats.unreadCount - 1,
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order":
        return TruckIcon;
      case "payment":
        return BanknotesIcon;
      case "penalty":
        return ExclamationTriangleIcon;
      default:
        return BellIcon;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "order":
        return "blue";
      case "payment":
        return "green";
      case "penalty":
        return "red";
      default:
        return "gray";
    }
  };

  return (
    <DashboardLayout title="Notifications">
      <div className="p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#605e5c]">TOTAL</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.totalNotifications}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#f3f2f1]">
                <BellIcon className="w-6 h-6 text-[#605e5c]" />
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">UNREAD</p>
                <p className="text-2xl font-bold mt-1">{stats.unreadCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">ORDERS</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.orderNotifications}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <TruckIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">PAYMENTS</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.paymentNotifications}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <BanknotesIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="dashboard-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">PENALTIES</p>
                <p className="text-2xl font-bold mt-1">
                  {stats.penaltyNotifications}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {loading
            ? [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-xl h-24"
                />
              ))
            : notifications.map((notification) => {
                const NotificationIcon = getNotificationIcon(notification.type);
                const color = getNotificationColor(notification.type);

                return (
                  <div
                    key={notification.id}
                    className={`dashboard-card hover:shadow-lg transition-all duration-300 ${
                      !notification.is_read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`p-3 rounded-lg bg-${color}-50 hover:bg-${color}-100`}
                        >
                          <NotificationIcon
                            className={`w-6 h-6 text-${color}-600`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#323130]">
                            {notification.title}
                          </h3>
                          <p className="text-[#605e5c] mt-1">
                            {notification.message}
                          </p>
                          <p className="text-sm text-[#605e5c] mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-[#0078d4] hover:text-[#106ebe] p-2"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

          {notifications.length === 0 && !loading && (
            <div className="text-center py-12">
              <BellIcon className="mx-auto h-12 w-12 text-[#605e5c]" />
              <h3 className="mt-2 text-sm font-medium text-[#323130]">
                No notifications
              </h3>
              <p className="mt-1 text-sm text-[#605e5c]">
                You're all caught up!
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
