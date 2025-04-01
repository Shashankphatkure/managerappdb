"use client";
import { useState, useEffect, useMemo } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../../components/DashboardLayout";
import {
  MapPinIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  MapIcon,
  TruckIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

const getStatusStyle = (status) => {
  const styles = {
    confirmed: {
      bg: "bg-indigo-100",
      text: "text-indigo-800",
      label: "Confirmed",
    },
    accepted: {
      bg: "bg-blue-100",
      text: "text-blue-800",
      label: "Accepted",
    },
    picked_up: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Picked Up",
    },
    on_way: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      label: "On The Way",
    },
    reached: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Reached",
    },
    delivered: {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "Delivered",
    },
    cancelled: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Cancelled",
    },
    pending: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Pending",
    },
  };
  return styles[status] || styles.pending;
};

export default function DriversTrackingPage() {
  const [drivers, setDrivers] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [previousInactiveDriverIds, setPreviousInactiveDriverIds] = useState([]);
  const supabase = createClientComponentClient();

  // Define status filters for orders
  const statusFilters = [
    { value: "all", label: "All Statuses" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "accepted", label: "Accepted" },
    { value: "picked_up", label: "Picked Up" },
    { value: "on_way", label: "On Way" },
    { value: "reached", label: "Reached" },
    { value: "delivered", label: "Delivered" },
  ];

  // Function to fetch all active drivers and their current orders
  const fetchDriversWithOrders = async () => {
    setLoading(true);
    try {
      // Fetch all active drivers
      const { data: activeDrivers, error: driversError } = await supabase
        .from("users")
        .select("id, full_name, phone, vehicle_number, vehicle_type, location, email, status")
        .eq("is_active", true)

      if (driversError) throw driversError;

      // Fetch all active orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          id, 
          destination, 
          status, 
          created_at, 
          driverid, 
          customername, 
          start,
          completiontime
        `)
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;

      // Group orders by driver
      const driverOrderMap = {};
      orders.forEach(order => {
        if (order.driverid) {
          if (!driverOrderMap[order.driverid]) {
            driverOrderMap[order.driverid] = [];
          }
          driverOrderMap[order.driverid].push(order);
        }
      });

      // Add orders to drivers
      const driversWithOrders = activeDrivers.map(driver => ({
        ...driver,
        orders: driverOrderMap[driver.id] || [],
        // Calculate latest order status for quick reference
        latestOrder: (driverOrderMap[driver.id] || []).sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        )[0]
      }));

      setDrivers(driversWithOrders);
      setActiveOrders(orders);
      
      // Check for inactive drivers
      checkDriverInactivity(driversWithOrders);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check for driver inactivity (no activity in the last 10 minutes)
  const checkDriverInactivity = (drivers) => {
    const threeMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    // Identify inactive drivers
    const inactiveDrivers = drivers.filter(driver => {
      const lastActivity = driver.latestOrder 
        ? driver.latestOrder.completiontime 
          ? new Date(driver.latestOrder.completiontime) 
          : new Date(driver.latestOrder.created_at)
        : null;
      
      // If driver has no activity or last activity is older than 3 minutes
      return !lastActivity || lastActivity < threeMinutesAgo;
    });
    
    // Get the IDs of inactive drivers
    const inactiveDriverIds = inactiveDrivers.map(driver => driver.id);
    
    // Check if the inactive drivers list has changed since last notification
    const sameDrivers = 
      previousInactiveDriverIds.length === inactiveDriverIds.length && 
      previousInactiveDriverIds.every(id => inactiveDriverIds.includes(id));
    
    // Only show notification if there are inactive drivers and the list has changed
    if (inactiveDrivers.length > 0 && !sameDrivers) {
      const driverNames = inactiveDrivers.map(d => d.full_name).join(', ');
      const message = inactiveDrivers.length === 1
        ? `Driver ${driverNames} has been inactive for more than 10 minutes`
        : `${inactiveDrivers.length} drivers (${driverNames}) have been inactive for more than 10 minutes`;
      
      toast.warning(message, {
        position: "bottom-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      
      // Update the list of previously notified inactive drivers
      setPreviousInactiveDriverIds(inactiveDriverIds);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchDriversWithOrders();
    // Set up an interval to refresh data every 30 seconds
    const interval = setInterval(fetchDriversWithOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter drivers based on search term and status filter
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.vehicle_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.includes(searchTerm);
        
      const matchesStatus = 
        filterStatus === "all" || 
        (driver.latestOrder && driver.latestOrder.status === filterStatus) ||
        (!driver.latestOrder && filterStatus === "available");
        
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchTerm, filterStatus]);

  // Convert location string to Google Maps link
  const getGoogleMapsLink = (locationString) => {
    if (!locationString) return "#";
    const [lat, lng] = locationString.split(',').map(coord => coord.trim());
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  // Get time since last order
  const getTimeSinceLastActivity = (latestOrder) => {
    if (!latestOrder) return { text: "No recent activity", isInactive: true, isUrgent: true };
    
    const lastOrderTime = latestOrder.completiontime 
      ? new Date(latestOrder.completiontime) 
      : new Date(latestOrder.created_at);
    
    const now = new Date();
    const diffMs = now - lastOrderTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    // Check if inactive (more than 10 minutes) or urgently inactive (more than 10 minutes)
    const isInactive = diffMins >= 3;
    const isUrgent = diffMins >= 15;
    
    let text = "";
    if (diffMins < 60) {
      text = `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) {
        text = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else {
        const diffDays = Math.floor(diffHours / 24);
        text = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      }
    }
    
    return { text, isInactive, isUrgent };
  };

  return (
    <DashboardLayout
      title="Driver Tracking"
      subtitle="Monitor all drivers and their current orders"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDriversWithOrders}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>
          <Link
            href="/dashboard/orders/map"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <MapIcon className="w-5 h-5" />
            View Map
          </Link>
        </div>
      }
    >
      <div className="p-6">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#605e5c]">
                  Total Active Drivers
                </p>
                <p className="text-2xl font-bold mt-2 text-[#323130]">
                  {drivers.length}
                </p>
              </div>
              <div className="bg-indigo-100 p-3 rounded-lg">
                <TruckIcon className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#605e5c]">
                  Active Orders
                </p>
                <p className="text-2xl font-bold mt-2 text-[#323130]">
                  {activeOrders.filter(o => 
                    o.status !== 'delivered' && 
                    o.status !== 'cancelled'
                  ).length}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <ClockIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#605e5c]">
                  Delivered Today
                </p>
                <p className="text-2xl font-bold mt-2 text-[#323130]">
                  {activeOrders.filter(o => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return o.status === 'delivered' && 
                      new Date(o.completiontime || o.created_at) >= today;
                  }).length}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#605e5c]">
                  Available Drivers
                </p>
                <p className="text-2xl font-bold mt-2 text-[#323130]">
                  {drivers.filter(d => 
                    !d.orders.some(o => 
                      o.status !== 'delivered' && 
                      o.status !== 'cancelled'
                    )
                  ).length}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <TruckIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search drivers by name, phone or vehicle number..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
              <option value="available">Available (No Active Orders)</option>
            </select>
          </div>
        </div>

        {/* Drivers Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-80">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Driver
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Latest Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                        No drivers match your filters
                      </td>
                    </tr>
                  ) : (
                    filteredDrivers.map((driver) => {
                      const activeOrder = driver.orders.find(o => 
                        o.status !== 'delivered' && 
                        o.status !== 'cancelled'
                      );
                      
                      // Check for urgent inactivity status
                      const activity = getTimeSinceLastActivity(driver.latestOrder);
                      const rowClass = activity.isUrgent 
                        ? "hover:bg-red-50 bg-red-50/50" 
                        : "hover:bg-gray-50";

                      return (
                        <tr key={driver.id} className={rowClass}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {driver.full_name?.charAt(0).toUpperCase() || "?"}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{driver.full_name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                  <PhoneIcon className="w-3 h-3" />
                                  {driver.phone ? (
                                    <a 
                                      href={`tel:${driver.phone}`} 
                                      className="inline-flex items-center gap-1 hover:text-indigo-600 hover:underline transition-colors relative group"
                                      title="Click to call"
                                    >
                                      {driver.phone}
                                      
                                    </a>
                                  ) : (
                                    "No phone"
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{driver.vehicle_number || "Not specified"}</div>
                            <div className="text-xs text-gray-500">{driver.vehicle_type || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activeOrder ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  <Link href={`/dashboard/orders/${activeOrder.id}`} className="hover:text-indigo-600">
                                    Order #{activeOrder.id}
                                  </Link>
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-xs">
                                  {activeOrder.destination}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No active orders</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {activeOrder ? (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(activeOrder.status).bg} ${getStatusStyle(activeOrder.status).text}`}>
                                {getStatusStyle(activeOrder.status).label}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Available
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {driver.location ? (
                              <a 
                                href={getGoogleMapsLink(driver.location)} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                              >
                                <MapPinIcon className="h-4 w-4 mr-1" /> View Map
                              </a>
                            ) : (
                              <span className="text-sm text-gray-500 inline-flex items-center">
                                <ExclamationTriangleIcon className="h-4 w-4 mr-1 text-yellow-500" /> 
                                No location
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {(() => {
                              const activity = getTimeSinceLastActivity(driver.latestOrder);
                              return (
                                <span className={`${activity.isInactive ? (activity.isUrgent ? "text-red-700 font-semibold" : "text-red-600 font-medium") : "text-gray-500"} flex items-center`}>
                                  {activity.text}
                                  {activity.isInactive && (
                                    <span className={`ml-1 inline-flex h-2 w-2 rounded-full ${activity.isUrgent ? "bg-red-600 animate-ping" : "bg-red-400 animate-pulse"}`}></span>
                                  )}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/dashboard/orders/drivers/${driver.id}`}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Details
                              </Link>
                              {activeOrder && (
                                <Link
                                  href={`/dashboard/orders/${activeOrder.id}`}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 