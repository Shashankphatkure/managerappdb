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
      const [driversResponse, reasonsResponse, ordersResponse] =
        await Promise.all([
          supabase
            .from("users")
            .select("id, full_name, email")
            .eq("is_active", true),
          supabase.from("penalty_reasons").select("*").eq("is_active", true),
          supabase
            .from("orders")
            .select("id, created_at, status, customername")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);

      console.log("All Users:", driversResponse.data);

      if (driversResponse.error) {
        throw driversResponse.error;
      }

      setDrivers(driversResponse.data || []);
      setPredefinedReasons(reasonsResponse.data || []);
      setOrders(ordersResponse.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      alert("Error loading drivers: " + error.message);
    } finally {
      setLoading(false);
    }
  }

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
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Penalties
        </button>
      }
    >
      <div className="max-w-3xl mx-auto p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* Driver Selection */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Driver Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Driver
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserGroupIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={penalty.driver_id}
                      onChange={(e) =>
                        setPenalty({ ...penalty, driver_id: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      required
                    >
                      <option value="">Select a driver</option>
                      {drivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Related Order (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShoppingBagIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={penalty.order_id}
                      onChange={(e) =>
                        setPenalty({ ...penalty, order_id: e.target.value })
                      }
                      className="block w-full pl-10 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">Select an order</option>
                      {orders.map((order) => (
                        <option key={order.id} value={order.id}>
                          Order #{order.id} - {order.customername}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Penalty Details */}
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Penalty Details
              </h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason Type
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <ListBulletIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
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
                        className="block w-full pl-10 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        required
                      >
                        <option value="predefined">Predefined Reason</option>
                        <option value="custom">Custom Reason</option>
                      </select>
                    </div>
                  </div>

                  {penalty.reason_type === "predefined" ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Reason
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                          value={penalty.predefined_reason_id}
                          onChange={(e) =>
                            setPenalty({
                              ...penalty,
                              predefined_reason_id: e.target.value,
                            })
                          }
                          className="block w-full pl-10 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          required
                        >
                          <option value="">Select a reason</option>
                          {predefinedReasons.map((reason) => (
                            <option key={reason.id} value={reason.id}>
                              {reason.reason} (${reason.default_amount})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Reason
                      </label>
                      <textarea
                        value={penalty.reason}
                        onChange={(e) =>
                          setPenalty({ ...penalty, reason: e.target.value })
                        }
                        className="block w-full px-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        rows={3}
                        required
                      />
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
                      className="block w-full pl-10 pr-4 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => router.push("/dashboard/penalties")}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
