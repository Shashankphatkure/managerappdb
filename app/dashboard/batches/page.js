"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import {
  UserIcon,
  TruckIcon,
  MapPinIcon,
  DocumentDuplicateIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";

export default function BatchesPage() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      // First, get unique batch_ids
      const { data: batchData, error: batchError } = await supabase
        .from("orders")
        .select("batch_id, created_at")
        .not("batch_id", "is", null)
        .order("created_at", { ascending: false });

      if (batchError) throw batchError;

      // Get unique batch IDs (some might be duplicated in the result)
      const uniqueBatchIds = [...new Set(batchData.map(item => item.batch_id))];
      
      // For each batch, get details
      const batchesWithDetails = await Promise.all(
        uniqueBatchIds.map(async (batchId) => {
          // Get all orders in this batch
          const { data: batchOrders, error: ordersError } = await supabase
            .from("orders")
            .select(`
              id, 
              driverid, 
              drivername, 
              customerid, 
              customername, 
              status, 
              storeid, 
              store_name, 
              delivery_sequence,
              created_at,
              batch_id
            `)
            .eq("batch_id", batchId)
            .order("delivery_sequence");

          if (ordersError) throw ordersError;

          if (batchOrders.length === 0) return null;

          // Get driver details
          const { data: driverData, error: driverError } = await supabase
            .from("users")
            .select("full_name, phone, vehicle_number")
            .eq("id", batchOrders[0].driverid)
            .single();

          // Calculate batch completion status
          const orderStatuses = batchOrders.map(order => order.status);
          const completedCount = orderStatuses.filter(status => 
            ["delivered", "reached"].includes(status)
          ).length;
          
          const inProgressCount = orderStatuses.filter(status => 
            ["accepted", "picked_up", "on_way"].includes(status)
          ).length;
          
          let batchStatus = "pending";
          if (completedCount === batchOrders.length) {
            batchStatus = "completed";
          } else if (inProgressCount > 0 || completedCount > 0) {
            batchStatus = "in_progress";
          } else if (orderStatuses.every(status => status === "confirmed")) {
            batchStatus = "confirmed";
          }

          return {
            batch_id: batchId,
            created_at: batchOrders[0].created_at,
            orders_count: batchOrders.length,
            driver: driverData || { full_name: batchOrders[0].drivername },
            orders: batchOrders,
            status: batchStatus,
            store_name: batchOrders[0].store_name,
            completion_percentage: Math.round((completedCount / batchOrders.length) * 100)
          };
        })
      );

      // Filter out any null batches
      const validBatches = batchesWithDetails.filter(batch => batch !== null);
      
      setBatches(validBatches);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching batches:", error);
      setLoading(false);
    }
  }

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-indigo-100 text-indigo-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Helper function to get status label
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout 
      title="Order Batches" 
      actions={
        <Link
          href="/dashboard/orders/multiorder"
          className="dashboard-button-primary flex items-center gap-2"
        >
          <DocumentDuplicateIcon className="w-5 h-5" /> Create New Batch
        </Link>
      }
    >
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-8">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 bg-[#f3f2f1] rounded-lg"
                />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#edebe9]">
                <thead>
                  <tr className="bg-[#f8f8f8]">
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Batch ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Created
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {batches.map((batch) => (
                    <tr key={batch.batch_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {batch.batch_id.split('_')[1]}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {batch.created_at && new Date(batch.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <BuildingStorefrontIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{batch.store_name || "Unknown Store"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {batch.driver.full_name}
                            </p>
                            {batch.driver.phone && (
                              <p className="text-sm text-gray-500">
                                {batch.driver.phone}
                                {batch.driver.vehicle_number &&
                                  ` • ${batch.driver.vehicle_number}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                          {batch.orders_count} Orders
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-48">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-500">
                              {batch.completion_percentage}% Complete
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${batch.completion_percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            batch.status
                          )}`}
                        >
                          {getStatusLabel(batch.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/batches/${batch.batch_id}`}
                            className="text-blue-600 hover:text-blue-900 font-medium flex items-center"
                          >
                            <EyeIcon className="h-4 w-4 mr-1" />
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {batches.length === 0 && !loading && (
            <div className="text-center py-12">
              <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No order batches
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No batch orders have been created yet.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/orders/multiorder"
                  className="dashboard-button-primary inline-flex items-center gap-2"
                >
                  <DocumentDuplicateIcon className="w-5 h-5" /> Create New Batch
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 