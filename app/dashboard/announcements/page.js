"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function SendNotification() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState(null);
  const [announcements, setAnnouncements] = useState([]);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error) {
        setAnnouncements(data);
      }
    };

    fetchAnnouncements();
  }, []);

  const sendNotification = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch("/api/send-notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await response.json();
      console.log("API response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to send notification");
      }

      setResult("Notification sent successfully!");

      const { data: updatedAnnouncements } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      setAnnouncements(updatedAnnouncements);
    } catch (error) {
      console.error("Error sending notification:", error);
      setResult(`Failed to send notification. Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6 text-center">
            Send Push Notification
          </h1>
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
            <div>
              <button
                onClick={sendNotification}
                disabled={isSending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : null}
                {isSending ? "Sending..." : "Send Notification"}
              </button>
            </div>
          </div>
          {result && (
            <div
              className={`mt-6 text-sm ${
                result.includes("Error") ? "text-red-600" : "text-green-600"
              }`}
            >
              {result}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4">Recent Announcements</h2>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="border-b pb-4">
                <h3 className="font-semibold">{announcement.title}</h3>
                <p className="text-gray-600">{announcement.message}</p>
                <div className="mt-2 text-sm">
                  <span
                    className={`px-2 py-1 rounded ${
                      announcement.status === "sent"
                        ? "bg-green-100 text-green-800"
                        : announcement.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {announcement.status}
                  </span>
                  <span className="ml-2 text-gray-500">
                    {new Date(announcement.sent_at).toLocaleString()}
                  </span>
                  {announcement.sent_count && (
                    <span className="ml-2 text-gray-500">
                      Sent to {announcement.sent_count} recipients
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
