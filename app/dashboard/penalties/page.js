"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import {
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function PenaltiesPage() {
  const [penalties, setPenalties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPenalties: 0,
    pendingAmount: 0,
    processedAmount: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchPenalties();
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const { data, error } = await supabase
        .from("penalties")
        .select("amount, status");

      if (error) throw error;

      const totalPenalties = data?.length || 0;
      const pendingAmount =
        data
          ?.filter((p) => p.status === "pending")
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
      const processedAmount =
        data
          ?.filter((p) => p.status === "processed")
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;

      setStats({ totalPenalties, pendingAmount, processedAmount });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }

  async function fetchPenalties() {
    try {
      // First, get all penalties
      const { data: penaltiesData, error: penaltiesError } = await supabase
        .from("penalties")
        .select(
          `
          id,
          driver_id,
          order_id,
          amount,
          reason,
          status,
          created_at
        `
        )
        .order("created_at", { ascending: false });

      if (penaltiesError) throw penaltiesError;

      // Then, get all drivers involved in these penalties
      const driverIds = [...new Set(penaltiesData.map((p) => p.driver_id))];
      const { data: driversData, error: driversError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", driverIds);

      if (driversError) throw driversError;

      // Combine the data
      const penaltiesWithDrivers = penaltiesData.map((penalty) => ({
        ...penalty,
        driver: driversData.find((d) => d.id === penalty.driver_id) || null,
      }));

      setPenalties(penaltiesWithDrivers);
    } catch (error) {
      console.error("Error fetching penalties:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessPenalty(penaltyId) {
    try {
      const { error } = await supabase
        .from("penalties")
        .update({ status: "processed" })
        .eq("id", penaltyId);

      if (error) throw error;

      // Refresh data
      fetchPenalties();
      fetchStats();

      // Get the penalty details for notification
      const penalty = penalties.find((p) => p.id === penaltyId);

      // Send notification to driver
      if (penalty) {
        await supabase.from("notifications").insert([
          {
            recipient_type: "driver",
            recipient_id: penalty.driver_id,
            title: "Penalty Processed",
            message: `Your penalty of $${penalty.amount} has been processed.`,
            type: "penalty",
          },
        ]);
      }
    } catch (error) {
      console.error("Error processing penalty:", error);
      alert("Error processing penalty. Please try again.");
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: ClockIcon,
      },
      processed: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: CheckCircleIcon,
      },
      cancelled: {
        bg: "bg-red-100",
        text: "text-red-800",
        icon: XCircleIcon,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <DashboardLayout
      title="Penalties"
      actions={
        <Link
          href="/dashboard/penalties/new"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <ExclamationTriangleIcon className="w-5 h-5" />
          Add New Penalty
        </Link>
      }
    >
      <div className="p-6">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Penalties
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.totalPenalties}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${stats.pendingAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Processed Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  ${stats.processedAmount.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Penalties List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reason
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {penalties.map((penalty) => (
                  <tr key={penalty.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {penalty.driver?.full_name || "Unknown Driver"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {penalty.driver?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {penalty.reason}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {penalty.order_id ? `#${penalty.order_id}` : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${Number(penalty.amount).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(penalty.status || "pending")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(penalty.created_at).toLocaleDateString(
                          "en-US",
                          {
                            month: "numeric",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {(penalty.status === "pending" || !penalty.status) && (
                        <button
                          onClick={() => handleProcessPenalty(penalty.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {penalties.length === 0 && !loading && (
            <div className="text-center py-12">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No penalties
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new penalty.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
