"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  MegaphoneIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function AnnouncementsPage() {
  const [announcement, setAnnouncement] = useState({
    title: "",
    message: "",
    url: "",
    imageUrl: "",
  });
  const [isSending, setIsSending] = useState(false);
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRecentAnnouncements();
  }, []);

  async function fetchRecentAnnouncements() {
    try {
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      setRecentAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const response = await fetch("/api/send-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: announcement.title,
          message: announcement.message,
          url: announcement.url,
          imageUrl: announcement.imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send announcement");
      }

      console.log("OneSignal Response:", data);

      const { error: supabaseError } = await supabase
        .from("announcements")
        .insert([
          {
            title: announcement.title,
            message: announcement.message,
            sent_at: new Date().toISOString(),
            url: announcement.url,
            image_url: announcement.imageUrl,
          },
        ]);

      if (supabaseError) {
        console.error("Supabase Error:", supabaseError);
        throw new Error("Failed to save announcement to database");
      }

      setAnnouncement({
        title: "",
        message: "",
        url: "",
        imageUrl: "",
      });

      alert("Announcement sent successfully!");
      fetchRecentAnnouncements();
    } catch (error) {
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        error,
      });
      alert(`Failed to send announcement: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcement Form */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">
            Send Push Notification to All Users
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notification Title *
              </label>
              <input
                type="text"
                id="title"
                value={announcement.title}
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter notification title"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Message *
              </label>
              <textarea
                id="message"
                value={announcement.message}
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter notification message"
              />
            </div>

            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                URL (Optional)
              </label>
              <input
                type="url"
                id="url"
                value={announcement.url}
                onChange={(e) =>
                  setAnnouncement((prev) => ({ ...prev, url: e.target.value }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label
                htmlFor="imageUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="imageUrl"
                value={announcement.imageUrl}
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    imageUrl: e.target.value,
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <button
              type="submit"
              disabled={isSending}
              className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSending ? "opacity-75 cursor-not-allowed" : ""
              }`}
            >
              {isSending ? "Sending..." : "Send Push Notification"}
            </button>
          </form>
        </div>

        {/* Recent Announcements */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-6">Recent Notifications</h2>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-24 bg-gray-100 rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <h3 className="font-medium text-gray-900">{ann.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{ann.message}</p>
                  {ann.url && (
                    <a
                      href={ann.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 mt-1 block"
                    >
                      {ann.url}
                    </a>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(ann.sent_at).toLocaleString()}
                  </p>
                </div>
              ))}
              {recentAnnouncements.length === 0 && (
                <div className="text-center py-8">
                  <MegaphoneIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No notifications sent yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start sending push notifications to your users.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
