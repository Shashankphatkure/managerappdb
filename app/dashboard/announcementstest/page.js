"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../components/DashboardLayout";
import {
  MegaphoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const getStatusColor = (status) => {
  const colors = {
    sent: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    processing: "bg-yellow-100 text-yellow-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export default function SendNotification() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalFailed: 0,
    totalRecipients: 0,
    todaysSent: 0,
  });

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchAnnouncements();
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get total sent count
      const { count: sentCount } = await supabase
        .from("announcements")
        .select("*", { count: "exact" })
        .eq("status", "sent");

      // Get total failed count
      const { count: failedCount } = await supabase
        .from("announcements")
        .select("*", { count: "exact" })
        .eq("status", "failed");

      // Get today's sent announcements
      const { data: todayAnnouncements } = await supabase
        .from("announcements")
        .select("sent_count")
        .eq("status", "sent")
        .gte("created_at", today.toISOString());

      const todaysSent = todayAnnouncements?.length || 0;
      const totalRecipients =
        todayAnnouncements?.reduce(
          (sum, ann) => sum + (ann.sent_count || 0),
          0
        ) || 0;

      setStats({
        totalSent: sentCount || 0,
        totalFailed: failedCount || 0,
        totalRecipients,
        todaysSent,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchAnnouncements() {
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  }

  const sendNotification = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      setResult("Notification sent successfully!");
      setTitle("");
      setDescription("");
      fetchAnnouncements();
      fetchStats();
    } catch (error) {
      console.error("Error sending notification:", error);
      setResult(`Failed to send notification. Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const statsCards = [
    {
      title: "Total Sent",
      value: stats.totalSent,
      icon: CheckCircleIcon,
      color: "green",
    },
    {
      title: "Total Failed",
      value: stats.totalFailed,
      icon: XCircleIcon,
      color: "red",
    },
    {
      title: "Today's Sent",
      value: stats.todaysSent,
      icon: ClockIcon,
      color: "blue",
    },
    {
      title: "Total Recipients",
      value: stats.totalRecipients,
      icon: UserGroupIcon,
      color: "purple",
    },
  ];

  return (
    <DashboardLayout title="Announcements">
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

        {/* Notification Form */}
        <div className="bg-white rounded-xl shadow-sm mb-8 p-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Notification Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter notification title"
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Notification Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Enter notification description"
              ></textarea>
            </div>
            <div className="mt-6">
              <button
                onClick={sendNotification}
                disabled={isSending || !title || !description}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MegaphoneIcon className="w-5 h-5 mr-2" />
                {isSending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
          {result && (
            <div
              className={`mt-4 p-4 rounded-md ${
                result.includes("Error")
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {result}
            </div>
          )}
        </div>

        {/* Announcements Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Announcements
            </h2>
          </div>
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
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recipients
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {announcements.map((announcement) => (
                    <tr key={announcement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {announcement.title}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-900 line-clamp-2">
                          {announcement.message}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-500">
                          {new Date(announcement.sent_at).toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">
                          {announcement.sent_count || 0}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            announcement.status
                          )}`}
                        >
                          {announcement.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {announcements.length === 0 && !loading && (
            <div className="text-center py-12">
              <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No announcements
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Start by creating a new announcement.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
