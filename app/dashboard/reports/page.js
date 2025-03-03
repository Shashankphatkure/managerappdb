"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function DeliveredOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [fromLocations, setFromLocations] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedFrom, setSelectedFrom] = useState("all");
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
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

    // Fetch unique from locations for filter dropdown
    async function fetchFromLocations() {
      const { data } = await supabase
        .from("orders")
        .select("start")
        .order("start");
      
      // Extract unique from locations
      const uniqueLocations = [...new Set(data?.map(order => order.start).filter(Boolean))];
      setFromLocations(uniqueLocations || []);
    }

    fetchDrivers();
    fetchFromLocations();
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

        if (selectedFrom !== "all") {
          query = query.eq("start", selectedFrom);
        }

        if (dateRange.from && dateRange.to) {
          query = query
            .gte("created_at", dateRange.from)
            .lte("created_at", dateRange.to);
        }

        const { data, error } = await query;
        if (error) throw error;
        setOrders(data || []);
        setCurrentPage(1); // Reset to first page when filters change
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [selectedDriver, selectedStatus, selectedFrom, dateRange]);

  // Calculate totals
  const totalAmount = orders.reduce(
    (sum, order) => sum + (Number(order.total_amount) || 0),
    0
  );
  const totalOrders = orders.length;

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

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

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Orders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* From Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
            <select
              className="w-full border rounded-lg px-4 py-2 bg-white"
              value={selectedFrom}
              onChange={(e) => setSelectedFrom(e.target.value)}
            >
              <option value="all">All Locations</option>
              {fromLocations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded-lg px-4 py-2 bg-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {/* Driver Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Driver</label>
            <select
              className="w-full border rounded-lg px-4 py-2 bg-white"
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
          </div>

          {/* Date Range Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              className="w-full border rounded-lg px-4 py-2"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              className="w-full border rounded-lg px-4 py-2"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
            />
          </div>
        </div>
      </div>

      {/* Orders Table Section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {indexOfFirstOrder + 1}-{Math.min(indexOfLastOrder, orders.length)} of {orders.length} orders
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Order ID</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Driver</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Customer</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>From</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>To</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Distance</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Amount</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Status</span>
                  </div>
                </th>
                <th className="group px-6 py-4 text-left">
                  <div className="flex items-center space-x-1 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <span>Completion Time</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-10 text-center text-gray-500 text-sm"
                  >
                    No orders found for the selected criteria
                  </td>
                </tr>
              ) : (
                currentOrders.map((order, index) => (
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
                      {order.users?.full_name || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.customername || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.start || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {order.destination || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.distance || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ₹{Number(order.total_amount || 0).toFixed(2)}
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
                        {order.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.completiontime || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {orders.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => paginate(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm rounded-md ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 text-sm rounded-md ${
                    currentPage === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
