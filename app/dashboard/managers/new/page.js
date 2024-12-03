"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  ExclamationCircleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

export default function NewManagerPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "supervisor",
    is_active: true,
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.length < 3) {
      newErrors.full_name = "Name must be at least 3 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (formData.phone && !phoneRegex.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Insert into managers table
      const { data: manager, error: insertError } = await supabase
        .from("managers")
        .insert([formData])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send notification about new manager creation
      await supabase.from("notifications").insert([
        {
          title: "New Manager Added",
          message: `${formData.full_name} has been added as a ${formData.role}`,
          type: "manager_created",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);

      // Show success message and redirect
      router.push("/dashboard/managers");
    } catch (error) {
      console.error("Error creating manager:", error);
      setSubmitError(
        error.message === "duplicate key value violates unique constraint"
          ? "A manager with this email already exists"
          : error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ label, name, type = "text", icon: Icon, ...props }) => (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
      </label>
      <div className="relative rounded-md shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type={type}
          id={name}
          name={name}
          className={`block w-full rounded-lg pl-10 pr-3 py-2.5 text-sm
            ${
              errors[name]
                ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                : "border-gray-300 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400"
            }
            shadow-sm transition-colors duration-200`}
          {...props}
        />
        {errors[name] && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <ExclamationCircleIcon
              className="h-5 w-5 text-red-500"
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      {errors[name] && (
        <p className="mt-2 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout
      title="Add New Manager"
      subtitle="Create a new manager account"
      breadcrumbs={[
        { label: "Managers", href: "/dashboard/managers" },
        { label: "Add New", href: "/dashboard/managers/new" },
      ]}
    >
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/managers")}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-1" />
            Back to Managers
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-2 border-gray-100">
                <UserGroupIcon className="h-10 w-10 text-blue-500" />
              </div>
            </div>

            {submitError && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <InputField
                  label="Full Name"
                  name="full_name"
                  icon={UserIcon}
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                />

                <InputField
                  label="Email Address"
                  name="email"
                  type="email"
                  icon={EnvelopeIcon}
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />

                <InputField
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  icon={PhoneIcon}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                />

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full rounded-lg border-gray-300 pl-3 pr-10 py-2.5 text-sm
                      focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors duration-200"
                  >
                    <option value="supervisor">Supervisor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center mt-4">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 
                      focus:ring-blue-500 transition-colors duration-200"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Active Account
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/managers")}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Manager"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
