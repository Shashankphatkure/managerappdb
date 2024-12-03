"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function DeliveredOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const supabase = createClientComponentClient();

  // Status options for the filter
  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "confirmed", label: "Confirmed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "pending", label: "Pending" },
    { value: "delivered", label: "Delivered" },
  ];

  useEffect(() => {
    // Fetch drivers for filter dropdown
    async function fetchDrivers() {
      const { data } = await supabase
        .from("users")
        .select("id, full_name")
        .eq("is_active", true);
      setDrivers(data || []);
    }

    fetchDrivers();
  }, []);

  useEffect(() => {
    async function fetchOrders() {
      try {
        let query = supabase
          .from("orders")
          .select(
            `
            *,
            users:driverid (
              full_name,
              email,
              phone,
              vehicle_number,
              vehicle_type
            )
          `
          )
          .order("created_at", { ascending: false });

        // Apply filters
        if (selectedDriver !== "all") {
          query = query.eq("driverid", selectedDriver);
        }

        if (selectedStatus !== "all") {
          query = query.eq("status", selectedStatus);
        }

        if (dateRange.from && dateRange.to) {
          query = query
            .gte("created_at", dateRange.from)
            .lte("created_at", dateRange.to);
        }

        const { data, error } = await query;
        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [selectedDriver, selectedStatus, dateRange]);

  // Calculate totals
  const totalAmount = orders.reduce(
    (sum, order) => sum + (Number(order.total_amount) || 0),
    0
  );
  const totalOrders = orders.length;

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Orders Report</h1>
        <div className="flex gap-4">
          {/* Status Filter */}
          <select
            className="border rounded-lg px-4 py-2 bg-white"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            {statusOptions.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>

          {/* Existing Filters */}
          <select
            className="border rounded-lg px-4 py-2 bg-white"
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
          >
            <option value="all">All Drivers</option>
            {drivers.map((driver) => (
              <option key={driver.id} value={driver.id}>
                {driver.full_name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="border rounded-lg px-4 py-2"
            value={dateRange.from}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, from: e.target.value }))
            }
          />
          <input
            type="date"
            className="border rounded-lg px-4 py-2"
            value={dateRange.to}
            onChange={(e) =>
              setDateRange((prev) => ({ ...prev, to: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Total Orders</h3>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Total Amount</h3>
          <p className="text-2xl font-bold">₹{totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-gray-500 text-sm">Average Order Value</h3>
          <p className="text-2xl font-bold">
            ₹{totalOrders ? (totalAmount / totalOrders).toFixed(2) : "0.00"}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Driver Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Distance
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Completion Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-10 text-center text-gray-500 text-sm"
                  >
                    No orders found for the selected criteria
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ease-in-out ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.users?.full_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customername}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.start}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.destination}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.distance}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{Number(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.completiontime}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
