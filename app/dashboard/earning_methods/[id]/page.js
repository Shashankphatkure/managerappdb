"use client";
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import { 
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

export default function EarningMethodDetailPage({ params }) {
  const { id } = params;
  const [earningMethod, setEarningMethod] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    description: "",
    icon_name: "",
    icon_bg_color: "",
    icon_color: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchEarningMethod = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("earning_methods")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;
        setEarningMethod(data);
        setFormData(data);
      } catch (error) {
        console.error("Error fetching earning method:", error);
        setError("Could not load earning method details");
      } finally {
        setLoading(false);
      }
    };

    fetchEarningMethod();
  }, [id, supabase]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const { error } = await supabase
        .from("earning_methods")
        .update(formData)
        .eq("id", id);

      if (error) throw error;
      setEarningMethod(formData);
      setIsEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this earning method?")) {
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("earning_methods")
        .delete()
        .eq("id", id);

      if (error) throw error;
      router.push("/dashboard/earning_methods");
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Map icon names to Heroicons components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'flash-outline': BoltIcon,
      'time-outline': ClockIcon,
      'checkmark-circle-outline': CheckCircleIcon,
      'people-outline': UserGroupIcon,
    };

    const IconComponent = iconMap[iconName] || CurrencyDollarIcon;
    return IconComponent;
  };

  const iconOptions = [
    { value: "flash-outline", label: "Flash (Deliveries)" },
    { value: "time-outline", label: "Clock (Peak Hours)" },
    { value: "checkmark-circle-outline", label: "Checkmark (Targets)" },
    { value: "people-outline", label: "People (Referrals)" },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Earning Method Details">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/4"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const IconComponent = earningMethod ? getIconComponent(earningMethod.icon_name) : CurrencyDollarIcon;

  return (
    <DashboardLayout
      title={isEditing ? "Edit Earning Method" : "Earning Method Details"}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/dashboard/earning_methods")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back
          </button>
          
          {!isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <PencilIcon className="w-5 h-5" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                <TrashIcon className="w-5 h-5" />
                Delete
              </button>
            </>
          )}
        </div>
      }
    >
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
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
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div 
                    className="p-4 rounded-lg" 
                    style={{ 
                      backgroundColor: earningMethod?.icon_bg_color || '#f3f2f1' 
                    }}
                  >
                    <IconComponent 
                      className="w-8 h-8" 
                      style={{ 
                        color: earningMethod?.icon_color || '#0078d4' 
                      }} 
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-900">{earningMethod?.title}</h3>
                      <div className="text-xl font-medium text-green-600">{earningMethod?.amount}</div>
                    </div>
                    <p className="mt-3 text-gray-600">{earningMethod?.description}</p>
                    
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="block text-gray-500">Icon Type</span>
                          <span className="font-medium">{iconOptions.find(opt => opt.value === earningMethod?.icon_name)?.label || earningMethod?.icon_name}</span>
                        </div>
                        <div>
                          <span className="block text-gray-500">Created</span>
                          <span className="font-medium">{new Date(earningMethod?.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 