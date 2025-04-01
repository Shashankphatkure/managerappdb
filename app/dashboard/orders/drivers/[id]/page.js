"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import React from 'react';
import DashboardLayout from "../../../components/DashboardLayout";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MapPinIcon,
  CalendarIcon,
  TruckIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  IdentificationIcon,
  CreditCardIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

// Status styles function copied from other pages for consistency
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

export default function DriverDetailsPage({ params }) {
  // Unwrap the params object using React.use()
  const unwrappedParams = React.use(params);
  const driverId = unwrappedParams.id;
  
  const router = useRouter();
  const [driver, setDriver] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    ongoingOrders: 0,
    totalDistance: 0,
    todayDeliveries: 0,
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDriverDetails();
    fetchDriverOrders();
  }, [driverId]);

  const fetchDriverDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", driverId)
        .single();

      if (error) throw error;
      setDriver(data);
    } catch (error) {
      console.error("Error fetching driver details:", error);
    }
  };

  const fetchDriverOrders = async () => {
    try {
      // Fetch all orders for this driver
      const { data, error } = await supabase
        .from("orders")
        .select("*, stores (name, icon)")
        .eq("driverid", driverId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders(data || []);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completedOrders = data.filter(o => o.status === "delivered").length;
      const cancelledOrders = data.filter(o => o.status === "cancelled").length;
      const ongoingOrders = data.filter(o => 
        o.status !== "delivered" && o.status !== "cancelled"
      ).length;
      
      const todayDeliveries = data.filter(o => 
        o.status === "delivered" && 
        new Date(o.completiontime || o.created_at) >= today
      ).length;

      // Calculate total distance (assuming distance is stored as a string like "5.2 km")
      const totalDistance = data.reduce((sum, order) => {
        if (order.distance) {
          const distanceValue = parseFloat(order.distance.replace(/[^0-9.]/g, ''));
          return isNaN(distanceValue) ? sum : sum + distanceValue;
        }
        return sum;
      }, 0);

      setStats({
        totalOrders: data.length,
        completedOrders,
        cancelledOrders,
        ongoingOrders,
        totalDistance: totalDistance.toFixed(1),
        todayDeliveries
      });

    } catch (error) {
      console.error("Error fetching driver orders:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert location string to Google Maps link
  const getGoogleMapsLink = (locationString) => {
    if (!locationString) return "#";
    const [lat, lng] = locationString.split(',').map(coord => coord.trim());
    return `https://www.google.com/maps?q=${lat},${lng}`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout
      title="Driver Details"
      subtitle={driver ? driver.full_name : "Loading..."}
      actions={
        <Link
          href="/dashboard/orders/drivers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Drivers
        </Link>
      }
    >
      {loading ? (
        <div className="p-6 flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="p-6">
          {/* Driver Profile Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Main Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-1">
              <div className="flex flex-col items-center">
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  {driver?.photo ? (
                    <img 
                      src={driver.photo} 
                      alt={driver.full_name} 
                      className="h-24 w-24 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-medium text-gray-600">
                      {driver?.full_name?.charAt(0).toUpperCase() || "?"}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900">{driver?.full_name}</h2>
                <p className="text-sm text-gray-500 mb-4">{driver?.email}</p>
                
                <div className="flex gap-2 mb-6">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${driver?.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {driver?.is_active ? "Active" : "Inactive"}
                  </span>
                  {driver?.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}>
                      {driver.status}
                    </span>
                  )}
                </div>

                <div className="w-full space-y-3">
                  <div className="flex items-start">
                    <PhoneIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{driver?.phone || "No phone"}</p>
                      {driver?.alternate_phone && (
                        <p className="text-xs text-gray-500">Alt: {driver.alternate_phone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <MapPinIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {driver?.address || "No address recorded"}
                      </p>
                      {driver?.city && (
                        <p className="text-xs text-gray-500">{driver.city}</p>
                      )}
                    </div>
                  </div>

                  {driver?.location && (
                    <div className="flex items-center">
                      <div className="w-5 h-5 mr-3" />
                      <a 
                        href={getGoogleMapsLink(driver.location)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:text-indigo-800"
                      >
                        View Current Location
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-start">
                    <TruckIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {driver?.vehicle_number || "No vehicle info"}
                      </p>
                      {(driver?.vehicle_model || driver?.vehicle_type) && (
                        <p className="text-xs text-gray-500">
                          {[driver.vehicle_model, driver.vehicle_type, driver.vehicle_color].filter(Boolean).join(" • ")}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <IdentificationIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        License: {driver?.driving_license || "Not provided"}
                      </p>
                      {driver?.license_expiry && (
                        <p className="text-xs text-gray-500">
                          Expires: {formatDate(driver.license_expiry)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {driver?.upi_id || driver?.bank_account_no || "No payment info"}
                      </p>
                      {driver?.bank_name && (
                        <p className="text-xs text-gray-500">
                          {driver.bank_name} {driver?.bank_ifsc_code ? `• ${driver.bank_ifsc_code}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
                  <DocumentTextIcon className="w-6 h-6 text-indigo-500" />
                </div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-gray-500 mt-1">All time orders</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Completed</h3>
                  <CheckCircleIcon className="w-6 h-6 text-green-500" />
                </div>
                <p className="text-2xl font-bold">{stats.completedOrders}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.totalOrders > 0 
                    ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}% completion rate` 
                    : "No orders yet"}
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Today's Deliveries</h3>
                  <CalendarIcon className="w-6 h-6 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{stats.todayDeliveries}</p>
                <p className="text-sm text-gray-500 mt-1">Orders delivered today</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
                  <ClockIcon className="w-6 h-6 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{stats.ongoingOrders}</p>
                <p className="text-sm text-gray-500 mt-1">Currently in progress</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Distance Covered</h3>
                  <MapPinIcon className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{stats.totalDistance} km</p>
                <p className="text-sm text-gray-500 mt-1">Total distance traveled</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">Cancellations</h3>
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-2xl font-bold">{stats.cancelledOrders}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {stats.totalOrders > 0 
                    ? `${Math.round((stats.cancelledOrders / stats.totalOrders) * 100)}% cancellation rate` 
                    : "No orders yet"}
                </p>
              </div>
            </div>
          </div>

          {/* Current and Recent Orders */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Current and Recent Orders</h2>
            
            {orders.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No orders found</h3>
                <p className="text-gray-500">This driver hasn't completed any orders yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Store
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Destination
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orders.slice(0, 10).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                            <br />
                            {formatTime(order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">{order.stores?.icon || "🏪"}</span>
                              <span className="text-sm text-gray-900">{order.stores?.name || order.store_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {order.customername || "Unknown"}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-900 truncate max-w-xs">
                              {order.destination || "Not specified"}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(order.status).bg} ${getStatusStyle(order.status).text}`}>
                              {getStatusStyle(order.status).label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Link
                              href={`/dashboard/orders/${order.id}/view`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View Order
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {orders.length > 10 && (
                  <div className="px-6 py-3 bg-gray-50 text-right">
                    <Link
                      href={`/dashboard/drivers/${driverId}/assignments`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                    >
                      View all {orders.length} orders →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Driver Notes */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Driver Notes</h2>
              <p className="text-gray-700">
                {driver?.about_driver || "No additional notes about this driver."}
              </p>
            </div>
            
            {/* Account Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Account Information</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Account Created:</span>
                  <span className="text-sm font-medium">{formatDate(driver?.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Last Updated:</span>
                  <span className="text-sm font-medium">{formatDate(driver?.updated_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Driver ID:</span>
                  <span className="text-sm font-medium">{driver?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Active Status:</span>
                  <span className={`text-sm font-medium ${driver?.is_active ? "text-green-600" : "text-red-600"}`}>
                    {driver?.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                {driver?.external_device_id && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Device ID:</span>
                    <span className="text-sm font-medium">{driver.external_device_id}</span>
                  </div>
                )}
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <Link
                    href={`/dashboard/drivers/${driver?.id}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    View Full Driver Profile →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
} 