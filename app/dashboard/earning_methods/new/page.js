"use client";
import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function NewEarningMethodPage() {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    icon_name: "flash-outline",
    icon_bg_color: "#dbeafe",
    icon_color: "#2563eb",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("earning_methods")
        .insert([formData])
        .select();

      if (error) throw error;
      router.push("/dashboard/earning_methods");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const iconOptions = [
    { value: "flash-outline", label: "Flash (Deliveries)" },
    { value: "time-outline", label: "Clock (Peak Hours)" },
    { value: "checkmark-circle-outline", label: "Checkmark (Targets)" },
    { value: "people-outline", label: "People (Referrals)" },
  ];

  return (
    <DashboardLayout
      title="Add New Earning Method"
      actions={
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back
        </button>
      }
    >
      <div className="p-6 max-w-3xl mx-auto">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g. Regular Deliveries"
              />
            </div>

            <div>
              <label
                htmlFor="amount"
                className="block text-sm font-medium text-gray-700"
              >
                Amount
              </label>
              <input
                type="text"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g. ₹50-150 per delivery"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Describe how drivers can earn through this method"
              />
            </div>

            <div>
              <label
                htmlFor="icon_name"
                className="block text-sm font-medium text-gray-700"
              >
                Icon
              </label>
              <select
                id="icon_name"
                name="icon_name"
                value={formData.icon_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {iconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="icon_bg_color"
                  className="block text-sm font-medium text-gray-700"
                >
                  Icon Background Color
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    id="icon_bg_color"
                    name="icon_bg_color"
                    value={formData.icon_bg_color}
                    onChange={handleChange}
                    className="h-10 w-10 rounded-md border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="icon_bg_color"
                    value={formData.icon_bg_color}
                    onChange={handleChange}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="#dbeafe"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="icon_color"
                  className="block text-sm font-medium text-gray-700"
                >
                  Icon Color
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    id="icon_color"
                    name="icon_color"
                    value={formData.icon_color}
                    onChange={handleChange}
                    className="h-10 w-10 rounded-md border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    name="icon_color"
                    value={formData.icon_color}
                    onChange={handleChange}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="#2563eb"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Earning Method"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
} 