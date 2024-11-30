"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  ExclamationTriangleIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ArrowLeftIcon,
  ShoppingBagIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

// Add this new component for better dropdowns
function SelectInput({
  icon: Icon,
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full pl-10 pr-10 py-3 text-base border-gray-300 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
        sm:text-sm rounded-lg shadow-sm transition-all
        hover:border-gray-400 bg-white
        appearance-none cursor-pointer
        ${className}`}
      >
        <option value="">{placeholder}</option>
        {options}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
        <svg
          className="h-5 w-5 text-gray-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
  );
}

export default function NewPenaltyPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [predefinedReasons, setPredefinedReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [penalty, setPenalty] = useState({
    driver_id: "",
    order_id: "",
    amount: "",
    reason_type: "predefined",
    predefined_reason_id: "",
    reason: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      const [driversResponse, reasonsResponse] = await Promise.all([
        supabase
          .from("users")
          .select("id, full_name, email")
          .eq("is_active", true),
        supabase.from("penalty_reasons").select("*").eq("is_active", true),
      ]);

      if (driversResponse.error) throw driversResponse.error;

      setDrivers(driversResponse.data || []);
      setPredefinedReasons(reasonsResponse.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      alert("Error loading data: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function fetchDriverOrders() {
      if (!penalty.driver_id) {
        setOrders([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("orders")
          .select("id, created_at, status, customername")
          .eq("driverid", penalty.driver_id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching driver orders:", error);
        alert("Error loading orders: " + error.message);
      }
    }

    fetchDriverOrders();
  }, [penalty.driver_id, supabase]);

  useEffect(() => {
    if (penalty.predefined_reason_id && penalty.reason_type === "predefined") {
      const selectedReason = predefinedReasons.find(
        (r) => r.id === penalty.predefined_reason_id
      );
      if (selectedReason) {
        setPenalty((prev) => ({
          ...prev,
          amount: selectedReason.default_amount,
          reason: selectedReason.reason,
        }));
      }
    }
  }, [penalty.predefined_reason_id, penalty.reason_type]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error: penaltyError } = await supabase.from("penalties").insert([
        {
          driver_id: penalty.driver_id,
          order_id: penalty.order_id || null,
          amount: penalty.amount,
          reason_type: penalty.reason_type,
          predefined_reason_id:
            penalty.reason_type === "predefined"
              ? penalty.predefined_reason_id
              : null,
          reason: penalty.reason,
          status: "pending",
        },
      ]);

      if (penaltyError) throw penaltyError;

      // Send notification to driver
      await supabase.from("notifications").insert([
        {
          recipient_type: "driver",
          recipient_id: penalty.driver_id,
          title: "New Penalty Added",
          message: `A penalty of $${penalty.amount} has been added. Reason: ${penalty.reason}`,
          type: "penalty",
        },
      ]);

      router.push("/dashboard/penalties");
    } catch (error) {
      console.error("Error creating penalty:", error);
      alert("Error creating penalty. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Add New Penalty">
        <div className="max-w-3xl mx-auto p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Add New Penalty"
      subtitle="Create a new penalty record for a driver"
      actions={
        <button
          onClick={() => router.push("/dashboard/penalties")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Penalties
        </button>
      }
    >
      <div className="">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* Driver Selection */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-blue-500" />
                Driver Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Driver
                  </label>
                  <SelectInput
                    icon={UserGroupIcon}
                    value={penalty.driver_id}
                    onChange={(e) =>
                      setPenalty({ ...penalty, driver_id: e.target.value })
                    }
                    placeholder="Select a driver"
                    required
                    options={drivers.map((driver) => (
                      <option
                        key={driver.id}
                        value={driver.id}
                        className="py-2"
                      >
                        {driver.full_name}
                      </option>
                    ))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Order (Optional)
                  </label>
                  <SelectInput
                    icon={ShoppingBagIcon}
                    value={penalty.order_id}
                    onChange={(e) =>
                      setPenalty({ ...penalty, order_id: e.target.value })
                    }
                    placeholder="Select an order"
                    options={orders.map((order) => (
                      <option key={order.id} value={order.id} className="py-2">
                        Order #{order.id} - {order.customername}
                      </option>
                    ))}
                  />
                </div>
              </div>
            </div>

            {/* Penalty Details */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                Penalty Details
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason Type
                    </label>
                    <SelectInput
                      icon={ListBulletIcon}
                      value={penalty.reason_type}
                      onChange={(e) =>
                        setPenalty({
                          ...penalty,
                          reason_type: e.target.value,
                          reason: "",
                          predefined_reason_id: "",
                          amount: "",
                        })
                      }
                      placeholder="Select reason type"
                      required
                      options={[
                        <option key="predefined" value="predefined">
                          Predefined Reason
                        </option>,
                        <option key="custom" value="custom">
                          Custom Reason
                        </option>,
                      ]}
                    />
                  </div>

                  {penalty.reason_type === "predefined" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Reason
                      </label>
                      <SelectInput
                        icon={DocumentTextIcon}
                        value={penalty.predefined_reason_id}
                        onChange={(e) =>
                          setPenalty({
                            ...penalty,
                            predefined_reason_id: e.target.value,
                          })
                        }
                        placeholder="Select a reason"
                        required
                        options={predefinedReasons.map((reason) => (
                          <option key={reason.id} value={reason.id}>
                            {reason.reason} (₹{reason.default_amount})
                          </option>
                        ))}
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Reason
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <textarea
                          value={penalty.reason}
                          onChange={(e) =>
                            setPenalty({ ...penalty, reason: e.target.value })
                          }
                          className="block w-full pl-10 pr-4 py-2.5 text-base border-gray-300 
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                            sm:text-sm rounded-lg shadow-sm transition-all hover:border-gray-400
                            min-h-[80px] resize-y"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-1/2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penalty Amount
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      value={penalty.amount}
                      onChange={(e) =>
                        setPenalty({ ...penalty, amount: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-3 text-base border-gray-300 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        sm:text-sm rounded-lg shadow-sm transition-all hover:border-gray-400"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-8 py-6 bg-gray-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/penalties")}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
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
                    Processing...
                  </>
                ) : (
                  <>
                    <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                    Add Penalty
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
