"use client";
import { useState, useEffect } from "react";
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

export default function NewCustomerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id");
  const isEditMode = !!customerId;
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
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white border border-[#edebe9] rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-semibold text-[#323130]">
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
                      className={`block w-full rounded-md border border-[#8a8886] ${
                        field.icon ? "pl-10" : "pl-3"
                      } py-2 text-sm focus:border-[#0078d4] focus:ring-[#0078d4]`}
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
                      className={`block w-full rounded-md border border-[#8a8886] ${
                        field.icon ? "pl-10" : "pl-3"
                      } py-2 text-sm focus:border-[#0078d4] focus:ring-[#0078d4]`}
                      rows={3}
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className={`block w-full rounded-md border border-[#8a8886] ${
                        field.icon ? "pl-10" : "pl-3"
                      } py-2 text-sm focus:border-[#0078d4] focus:ring-[#0078d4]`}
                      required={field.required}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-[#edebe9]">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/customers")}
                  className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-[#8a8886] rounded-md hover:bg-[#f3f2f1] focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] border border-transparent rounded-md hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-[#0078d4] flex items-center gap-2"
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
    </DashboardLayout>
  );
}
