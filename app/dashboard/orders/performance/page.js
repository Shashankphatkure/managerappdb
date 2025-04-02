"use client";
import React, { useState, useEffect, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowPathIcon,
  ChartBarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function DriverPerformancePage() {
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("today"); // today, week, month
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDriverId, setExpandedDriverId] = useState(null);
  const supabase = createClientComponentClient();

  // Date filter options
  const dateFilterOptions = [
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  // Function to get date range based on filter
  const getDateRange = (filter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filter) {
      case "today":
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          label: "Today",
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday.toISOString(),
          end: today.toISOString(),
          label: "Yesterday",
        };
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
        return {
          start: startOfWeek.toISOString(),
          end: new Date().toISOString(),
          label: "This Week",
        };
      case "month":
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: startOfMonth.toISOString(),
          end: new Date().toISOString(),
          label: "This Month",
        };
      default:
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          label: "Today",
        };
    }
  };

  // Load performance data when component mounts or filters change
  useEffect(() => {
    loadPerformanceData();
  }, [dateFilter]);

  // Function to load driver performance data
  const loadPerformanceData = async () => {
    setLoading(true);
    try {
      const dateRange = getDateRange(dateFilter);
      
      // Fetch completed/cancelled orders in the date range
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(`
          id,
          driverid,
          drivername,
          status,
          created_at,
          completiontime,
          estimated_delivery_time,
          start,
          destination,
          distance,
          time,
          total_amount,
          payment_status,
          customers (full_name, phone)
        `)
        .or(`status.eq.delivered,status.eq.cancelled`)
        .gte("created_at", dateRange.start)
        .lte("created_at", dateRange.end);

      if (orderError) throw orderError;
      
      // Fetch all active drivers
      const { data: driverData, error: driverError } = await supabase
        .from("users")
        .select(`
          id,
          full_name,
          phone,
          vehicle_number,
          vehicle_type,
          email
        `)
        .eq("is_active", true);

      if (driverError) throw driverError;
      
      setOrders(orderData || []);
      setDrivers(driverData || []);
    } catch (error) {
      console.error("Error loading performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate performance metrics for each driver
  const driverPerformance = useMemo(() => {
    // Create a map of driver IDs to their performance metrics
    const performanceMap = {};
    
    // Initialize performance metrics for each driver
    drivers.forEach(driver => {
      performanceMap[driver.id] = {
        driver,
        totalOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        onTimeDeliveries: 0,
        lateDeliveries: 0,
        percentOnTime: 0,
        avgDeliveryTime: 0, // in minutes
        totalDeliveryTime: 0, // in minutes
      };
    });
    
    // Process each order to calculate metrics
    orders.forEach(order => {
      // Skip if no driver assigned
      if (!order.driverid) return;
      
      // Initialize driver data if not already present (handles inactive drivers)
      if (!performanceMap[order.driverid]) {
        performanceMap[order.driverid] = {
          driver: { id: order.driverid, full_name: order.drivername || "Unknown Driver" },
          totalOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          onTimeDeliveries: 0,
          lateDeliveries: 0,
          percentOnTime: 0,
          avgDeliveryTime: 0,
          totalDeliveryTime: 0,
        };
      }
      
      // Increment order counts
      performanceMap[order.driverid].totalOrders++;
      
      if (order.status === "delivered") {
        performanceMap[order.driverid].completedOrders++;
        
        // Calculate if delivery was on time
        if (order.estimated_delivery_time && order.completiontime) {
          const estimatedTime = new Date(order.estimated_delivery_time);
          const completionTime = new Date(order.completiontime);
          
          // Calculate delivery time in minutes
          const deliveryTimeMinutes = Math.round((completionTime - new Date(order.created_at)) / (1000 * 60));
          performanceMap[order.driverid].totalDeliveryTime += deliveryTimeMinutes;
          
          // Check if delivery was on time
          if (completionTime <= estimatedTime) {
            performanceMap[order.driverid].onTimeDeliveries++;
          } else {
            performanceMap[order.driverid].lateDeliveries++;
          }
        }
      } else if (order.status === "cancelled") {
        performanceMap[order.driverid].cancelledOrders++;
      }
    });
    
    // Calculate percentages and averages
    Object.values(performanceMap).forEach(perf => {
      // Calculate percent on time (avoid division by zero)
      const deliveredOrders = perf.onTimeDeliveries + perf.lateDeliveries;
      perf.percentOnTime = deliveredOrders > 0 
        ? Math.round((perf.onTimeDeliveries / deliveredOrders) * 100) 
        : 0;
      
      // Calculate average delivery time
      perf.avgDeliveryTime = perf.completedOrders > 0 
        ? Math.round(perf.totalDeliveryTime / perf.completedOrders) 
        : 0;
    });
    
    // Convert map to array and sort by total orders desc
    return Object.values(performanceMap)
      .filter(perf => perf.totalOrders > 0) // Only include drivers with orders
      .sort((a, b) => b.totalOrders - a.totalOrders);
  }, [drivers, orders]);

  // Filter drivers by search term
  const filteredDrivers = useMemo(() => {
    if (!searchTerm.trim()) return driverPerformance;
    
    const lowercasedSearch = searchTerm.toLowerCase();
    return driverPerformance.filter(perf => 
      perf.driver.full_name?.toLowerCase().includes(lowercasedSearch) ||
      perf.driver.phone?.includes(searchTerm) ||
      perf.driver.vehicle_number?.toLowerCase().includes(lowercasedSearch)
    );
  }, [driverPerformance, searchTerm]);

  // Calculate overall metrics
  const overallMetrics = useMemo(() => {
    const totals = {
      totalOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
      onTimeDeliveries: 0,
      lateDeliveries: 0,
      percentOnTime: 0,
    };
    
    driverPerformance.forEach(perf => {
      totals.totalOrders += perf.totalOrders;
      totals.completedOrders += perf.completedOrders;
      totals.cancelledOrders += perf.cancelledOrders;
      totals.onTimeDeliveries += perf.onTimeDeliveries;
      totals.lateDeliveries += perf.lateDeliveries;
    });
    
    // Calculate percentage
    const deliveredOrders = totals.onTimeDeliveries + totals.lateDeliveries;
    totals.percentOnTime = deliveredOrders > 0 
      ? Math.round((totals.onTimeDeliveries / deliveredOrders) * 100) 
      : 0;
    
    return totals;
  }, [driverPerformance]);

  // Format minutes to human-readable time
  const formatMinutes = (minutes) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // UI rendering for summary metrics
  const renderMetricCards = () => {
    const metrics = [
      {
        title: "Total Orders",
        value: overallMetrics.totalOrders,
        icon: ClockIcon,
        color: "bg-indigo-100 text-indigo-800",
      },
      {
        title: "Completed Orders",
        value: overallMetrics.completedOrders,
        icon: CheckCircleIcon,
        color: "bg-green-100 text-green-800",
      },
      {
        title: "On-Time Deliveries",
        value: `${overallMetrics.percentOnTime}%`,
        icon: TruckIcon,
        color: "bg-blue-100 text-blue-800",
      },
      {
        title: "Late Deliveries",
        value: overallMetrics.lateDeliveries,
        icon: ExclamationTriangleIcon,
        color: "bg-yellow-100 text-yellow-800",
      },
      {
        title: "Cancelled Orders",
        value: overallMetrics.cancelledOrders,
        icon: XCircleIcon,
        color: "bg-red-100 text-red-800",
      }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
            <div className={`w-12 h-12 rounded-lg ${metric.color} flex items-center justify-center mr-4`}>
              <metric.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{metric.title}</p>
              <p className="text-xl font-semibold">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to check if order was delivered on time
  const isOnTime = (order) => {
    if (order.status !== "delivered" || !order.estimated_delivery_time || !order.completiontime) {
      return false;
    }
    return new Date(order.completiontime) <= new Date(order.estimated_delivery_time);
  };

  // Get delivery status with color
  const getDeliveryStatus = (order) => {
    if (order.status === "cancelled") {
      return {
        label: "Cancelled",
        color: "bg-red-100 text-red-800"
      };
    }

    if (order.status !== "delivered") {
      return {
        label: order.status,
        color: "bg-gray-100 text-gray-800"
      };
    }

    if (!order.estimated_delivery_time || !order.completiontime) {
      return {
        label: "Completed",
        color: "bg-blue-100 text-blue-800"
      };
    }

    if (isOnTime(order)) {
      return {
        label: "On-Time",
        color: "bg-green-100 text-green-800"
      };
    } else {
      return {
        label: "Late",
        color: "bg-yellow-100 text-yellow-800"
      };
    }
  };

  // Get time difference in minutes
  const getTimeDiff = (order) => {
    if (!order.estimated_delivery_time || !order.completiontime) return null;
    
    const estimated = new Date(order.estimated_delivery_time);
    const actual = new Date(order.completiontime);
    
    const diffMs = actual - estimated;
    const diffMins = Math.round(diffMs / 60000);
    
    return diffMins;
  };

  // Get formatted time difference
  const getFormattedTimeDiff = (order) => {
    const diffMins = getTimeDiff(order);
    if (diffMins === null) return "N/A";
    
    if (diffMins <= 0) {
      return `${Math.abs(diffMins)} mins early`;
    } else {
      return `${diffMins} mins late`;
    }
  };

  // Get estimated vs actual time
  const getTimeComparison = (order) => {
    if (!order.estimated_delivery_time || !order.completiontime) {
      return "Missing data";
    }
    
    return `Est: ${formatDate(order.estimated_delivery_time)} | 
            Act: ${formatDate(order.completiontime)}`;
  };

  return (
    <DashboardLayout 
      title="Driver Performance" 
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={loadPerformanceData}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
            title="Refresh data"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
          <select
            className="border border-gray-300 rounded-md p-2 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            {dateFilterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="p-6">
        {/* Summary Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-600" />
            Performance Summary for {getDateRange(dateFilter).label}
          </h2>
          {renderMetricCards()}
        </div>
        
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search drivers by name, phone, or vehicle"
              className="w-full border border-gray-300 rounded-md p-2 pl-8 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <UserIcon className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
          </div>
        </div>
        
        {/* Drivers Performance Table */}
        <div className="bg-white rounded-lg overflow-hidden shadow">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Late
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On-Time %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Delivery Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cancelled
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading performance data...
                  </td>
                </tr>
              ) : filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    No driver performance data available for the selected period.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((perf) => (
                  <React.Fragment key={perf.driver.id}>
                    <tr 
                      className={`hover:bg-gray-50 cursor-pointer ${expandedDriverId === perf.driver.id ? 'bg-indigo-50' : ''}`}
                      onClick={() => setExpandedDriverId(expandedDriverId === perf.driver.id ? null : perf.driver.id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {perf.driver.full_name || "Unknown Driver"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {perf.driver.phone || "No phone"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {perf.totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {perf.completedOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {perf.onTimeDeliveries}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          {perf.lateDeliveries}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative pt-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xs font-semibold inline-block text-indigo-600">
                                {perf.percentOnTime}%
                              </span>
                            </div>
                          </div>
                          <div className="overflow-hidden h-2 mb-1 text-xs flex rounded bg-gray-200">
                            <div
                              style={{ width: `${perf.percentOnTime}%` }}
                              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                                perf.percentOnTime >= 80
                                  ? "bg-green-500"
                                  : perf.percentOnTime >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatMinutes(perf.avgDeliveryTime)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          {perf.cancelledOrders}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Expanded order details */}
                    {expandedDriverId === perf.driver.id && (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 bg-gray-50">
                          <div className="mb-3 border-b border-gray-200 pb-2">
                            <h3 className="text-md font-semibold text-gray-700">
                              Orders for {perf.driver.full_name || "Unknown Driver"}
                            </h3>
                          </div>
                          
                          {/* Driver orders table */}
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                              <thead className="bg-gray-100">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Order
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    From → To
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Distance
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Comparison
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Difference
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {orders
                                  .filter(order => order.driverid === perf.driver.id)
                                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                                  .map(order => {
                                    const deliveryStatus = getDeliveryStatus(order);
                                    return (
                                      <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                                          #{order.id}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {formatDate(order.created_at)}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {order.customers?.full_name || "N/A"}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          <div className="line-clamp-1">{order.start}</div>
                                          <div className="line-clamp-1">{order.destination}</div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                          {order.distance || "N/A"}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          <div className="text-xs">
                                            {order.estimated_delivery_time && (
                                              <div>Est: {formatDate(order.estimated_delivery_time)}</div>
                                            )}
                                            {order.completiontime && (
                                              <div>Act: {formatDate(order.completiontime)}</div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm">
                                          {order.status === "delivered" ? (
                                            <span className={`text-sm ${isOnTime(order) ? 'text-green-600' : 'text-yellow-600'}`}>
                                              {getFormattedTimeDiff(order)}
                                            </span>
                                          ) : (
                                            <span className="text-sm text-gray-500">N/A</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${deliveryStatus.color}`}>
                                            {deliveryStatus.label}
                                          </span>
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-600">
                                          <Link href={`/dashboard/orders/${order.id}/view`}>
                                            View
                                          </Link>
                                        </td>
                                      </tr>
                                    );
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
} 