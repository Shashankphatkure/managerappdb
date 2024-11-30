"use client";
import { useState, useEffect, Suspense } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ArrowLeftIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

// Create a wrapper component for the form
function CustomerForm({ customerId, isEditMode }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState({
    full_name: "",
    email: "",
    phone: "",
    homeaddress: "",
    workaddress: "",
    city: "",
    status: "active",
    ordernote: "",
    subscriptiondays: "",
    subscriptionstart: "",
  });

  useEffect(() => {
    if (isEditMode) {
      fetchCustomer();
    }
  }, [customerId]);

  async function fetchCustomer() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) throw error;
      if (data) {
        setCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      alert("Error fetching customer details. Please try again.");
    }
  }

  const formFields = [
    {
      label: "Full Name",
      type: "text",
      value: customer.full_name,
      onChange: (value) => setCustomer({ ...customer, full_name: value }),
      icon: UserGroupIcon,
      required: true,
    },
    {
      label: "Email",
      type: "email",
      value: customer.email,
      onChange: (value) => setCustomer({ ...customer, email: value }),
      icon: EnvelopeIcon,
      required: true,
    },
    {
      label: "Phone",
      type: "tel",
      value: customer.phone,
      onChange: (value) => setCustomer({ ...customer, phone: value }),
      icon: PhoneIcon,
    },
    {
      label: "Home Address",
      type: "textarea",
      value: customer.homeaddress,
      onChange: (value) => setCustomer({ ...customer, homeaddress: value }),
      icon: MapPinIcon,
    },
    {
      label: "Work Address",
      type: "textarea",
      value: customer.workaddress,
      onChange: (value) => setCustomer({ ...customer, workaddress: value }),
      icon: MapPinIcon,
    },
    {
      label: "City",
      type: "text",
      value: customer.city,
      onChange: (value) => setCustomer({ ...customer, city: value }),
      icon: MapPinIcon,
    },
    {
      label: "Status",
      type: "select",
      value: customer.status,
      onChange: (value) => setCustomer({ ...customer, status: value }),
      icon: UserCircleIcon,
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
        { value: "pending", label: "Pending" },
      ],
    },
    {
      label: "Order Notes",
      type: "textarea",
      value: customer.ordernote,
      onChange: (value) => setCustomer({ ...customer, ordernote: value }),
      icon: DocumentTextIcon,
    },
    {
      label: "Subscription Days",
      type: "number",
      value: customer.subscriptiondays,
      onChange: (value) =>
        setCustomer({ ...customer, subscriptiondays: value }),
      icon: CalendarIcon,
    },
    {
      label: "Subscription Start",
      type: "date",
      value: customer.subscriptionstart,
      onChange: (value) =>
        setCustomer({ ...customer, subscriptionstart: value }),
      icon: CalendarIcon,
    },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const cleanedCustomer = {
      ...customer,
      subscriptiondays:
        customer.subscriptiondays === ""
          ? null
          : parseInt(customer.subscriptiondays),
      subscriptionstart:
        customer.subscriptionstart === "" ? null : customer.subscriptionstart,
    };

    try {
      let error;
      if (isEditMode) {
        const { error: updateError } = await supabase
          .from("customers")
          .update(cleanedCustomer)
          .eq("id", customerId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("customers")
          .insert([cleanedCustomer]);
        error = insertError;
      }

      if (error) throw error;
      router.push("/dashboard/customers");
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "creating"} customer:`,
        error
      );
      alert(
        `Error ${
          isEditMode ? "updating" : "creating"
        } customer. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="">
      <div className="bg-white border border-[#edebe9] rounded-xl shadow-sm">
        <div className="p-6 border-b border-[#edebe9]">
          <h2 className="text-lg font-semibold text-[#323130]">
            Customer Information
          </h2>
          <p className="text-sm text-[#605e5c] mt-1">
            Fill in the information below to {isEditMode ? "update" : "create"}{" "}
            a customer profile
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-[#323130] uppercase tracking-wider">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.slice(0, 3).map((field) => (
                  <FormField key={field.label} field={field} />
                ))}
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-6 pt-6 border-t border-[#edebe9]">
              <h3 className="text-sm font-semibold text-[#323130] uppercase tracking-wider">
                Address Information
              </h3>
              <div className="grid grid-cols-1 gap-6">
                {formFields.slice(3, 6).map((field) => (
                  <FormField key={field.label} field={field} />
                ))}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6 pt-6 border-t border-[#edebe9]">
              <h3 className="text-sm font-semibold text-[#323130] uppercase tracking-wider">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.slice(6).map((field) => (
                  <FormField key={field.label} field={field} />
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-[#edebe9]">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/customers")}
                  className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-[#8a8886] rounded-lg hover:bg-[#f3f2f1] focus:outline-none focus:ring-2 focus:ring-[#0078d4] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] border border-transparent rounded-lg hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-[#0078d4] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserGroupIcon className="w-5 h-5" />
                  {loading
                    ? isEditMode
                      ? "Updating..."
                      : "Adding..."
                    : isEditMode
                    ? "Update Customer"
                    : "Add Customer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Main page component
export default function NewCustomerPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id");
  const isEditMode = !!customerId;

  return (
    <DashboardLayout
      title={isEditMode ? "Edit Customer" : "Add New Customer"}
      subtitle={
        isEditMode ? "Update customer profile" : "Create a new customer profile"
      }
      actions={
        <button
          onClick={() => router.push("/dashboard/customers")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Customers
        </button>
      }
    >
      <Suspense
        fallback={
          <div className="max-w-4xl mx-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          </div>
        }
      >
        <CustomerForm customerId={customerId} isEditMode={isEditMode} />
      </Suspense>
    </DashboardLayout>
  );
}

// New FormField component for better organization
function FormField({ field }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[#323130] flex items-center gap-1">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {field.icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <field.icon className="h-5 w-5 text-[#605e5c]" />
          </div>
        )}
        {field.type === "select" ? (
          <select
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            className={`block w-full rounded-lg border border-[#8a8886] ${
              field.icon ? "pl-10" : "pl-3"
            } py-2.5 text-sm focus:border-[#0078d4] focus:ring-[#0078d4] bg-white transition-colors`}
            required={field.required}
          >
            {field.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "textarea" ? (
          <textarea
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            className={`block w-full rounded-lg border border-[#8a8886] ${
              field.icon ? "pl-10" : "pl-3"
            } py-2.5 text-sm focus:border-[#0078d4] focus:ring-[#0078d4] transition-colors`}
            rows={3}
            required={field.required}
          />
        ) : (
          <input
            type={field.type}
            value={field.value}
            onChange={(e) => field.onChange(e.target.value)}
            className={`block w-full rounded-lg border border-[#8a8886] ${
              field.icon ? "pl-10" : "pl-3"
            } py-2.5 text-sm focus:border-[#0078d4] focus:ring-[#0078d4] transition-colors`}
            required={field.required}
          />
        )}
      </div>
    </div>
  );
}
