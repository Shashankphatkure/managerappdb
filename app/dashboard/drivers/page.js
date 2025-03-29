"use client";
import React from "react";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import Image from "next/image";
import DashboardLayout from "../components/DashboardLayout";
import {
  UserGroupIcon,
  MapIcon,
  PlusIcon,
  TruckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  MapPinIcon,
  ClockIcon,
  UserIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  HashtagIcon,
  SwatchIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";
import { useRouter, useSearchParams } from "next/navigation";

export default function DriversPage() {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [driverOrders, setDriverOrders] = useState({});
  const [statusFilter, setStatusFilter] = useState(statusParam || "all");
  const [imageErrors, setImageErrors] = useState({});
  const supabase = createClientComponentClient();
  const router = useRouter();

  const handleImageError = (driverId) => {
    setImageErrors((prev) => ({
      ...prev,
      [driverId]: true
    }));
  };

  useEffect(() => {
    // Update filter when URL parameter changes
    setStatusFilter(statusParam || "all");
  }, [statusParam]);

  useEffect(() => {
    const loadDrivers = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("users")
          .select(
            `
            id,
            email,
            phone,
            full_name,
            city,
            is_active,
            status,
            created_at,
            photo
          `
          );
          
        if (statusFilter !== "all") {
          const isActive = statusFilter === "active";
          query = query.eq("is_active", isActive);
        }
        
        const { data: usersData, error: usersError } = await query.order("created_at", { ascending: false });

        if (usersError) throw usersError;

        setDrivers(usersData || []);
      } catch (error) {
        console.error("Error fetching drivers:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDrivers();
  }, [supabase, statusFilter]);

  useEffect(() => {
    if (expandedDriver && !driverOrders[expandedDriver]) {
      fetchDriverOrders(expandedDriver);
    }
  }, [expandedDriver, driverOrders]);

  async function fetchDriverOrders(driverId) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("driverid", driverId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setDriverOrders((prev) => ({
        ...prev,
        [driverId]: data || [],
      }));
    } catch (error) {
      console.error("Error fetching driver orders:", error);
    }
  }

  const handleExpandDriver = (driverId) => {
    setExpandedDriver((current) => (current === driverId ? null : driverId));
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      picked_up: "bg-indigo-100 text-indigo-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getAvailabilityColor = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "unavailable":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  function handleShowActiveDriversOnMap() {
    router.push("/dashboard/drivers/map");
  }

  const handleFilterChange = (value) => {
    setStatusFilter(value);
    
    // Update URL to reflect selected filter
    const params = new URLSearchParams();
    if (value !== "all") {
      params.set("status", value);
      router.push(`/dashboard/drivers?${params.toString()}`);
    } else {
      router.push("/dashboard/drivers");
    }
  };

  const handleCreateOrder = (driver) => {
    router.push(`/dashboard/orders/new?driverId=${driver.id}`);
  };

  return (
    <DashboardLayout
      title="Delivery Drivers"
      subtitle={`Total Drivers: ${drivers.length}`}
      actions={
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none pr-8"
            >
              <option value="all">All Drivers</option>
              <option value="active">Active Drivers</option>
              <option value="inactive">Inactive Drivers</option>
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={handleShowActiveDriversOnMap}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <MapIcon className="w-5 h-5" />
            Active Drivers
          </button>
          <Link
            href="/dashboard/drivers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Driver
          </Link>
        </div>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-2 border-gray-100 overflow-hidden">
                          {driver.photo && !imageErrors[driver.id] ? (
                            <Image 
                              src={driver.photo} 
                              alt={driver.full_name || "Driver"}
                              width={64}
                              height={64}
                              className="h-full w-full object-cover"
                              priority
                              onError={() => handleImageError(driver.id)}
                            />
                          ) : (
                            <UserIcon className="h-8 w-8 text-blue-500" />
                          )}
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                            driver.is_active ? "bg-green-400" : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {driver.full_name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            ID: {driver.id.slice(0, 8)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              driver.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {driver.is_active ? "Active" : "Inactive"}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(
                              driver.status
                            )}`}
                          >
                            {driver.status || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/drivers/${driver.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                      >
                        Edit Profile
                      </Link>
                      <Link
                        href={`/dashboard/drivers/${driver.id}/assignments`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-800 border border-green-200 rounded-lg hover:bg-green-50 transition-colors duration-200"
                      >
                        View Assignments
                      </Link>
                      {driver.is_active && (
                        <button
                          onClick={() => handleCreateOrder(driver)}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-800 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors duration-200"
                        >
                          Create Order
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <PhoneIcon className="w-4 h-4" />
                          <span className="text-sm">{driver.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span className="text-sm">{driver.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPinIcon className="w-4 h-4" />
                          <span className="text-sm">{driver.city}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100">
                  <button
                    onClick={() => handleExpandDriver(driver.id)}
                    className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <span className="text-sm font-medium text-gray-600">
                      Recent Orders
                    </span>
                    {expandedDriver === driver.id ? (
                      <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedDriver === driver.id && (
                    <div className="p-6 bg-gray-50">
                      {driverOrders[driver.id]?.length > 0 ? (
                        <div className="space-y-4">
                          {driverOrders[driver.id].map((order) => (
                            <div
                              key={order.id}
                              className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-all duration-200"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <TruckIcon className="w-4 h-4 text-gray-400" />
                                    <span className="font-medium">
                                      Order #{order.id}
                                    </span>
                                    <span
                                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                                        order.status
                                      )}`}
                                    >
                                      {order.status}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {new Date(
                                      order.created_at
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <Link
                                  href={`/dashboard/orders/${order.id}/view`}
                                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                  View Details
                                </Link>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-1" />
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        From
                                      </p>
                                      <p className="text-sm">{order.start}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <MapPinIcon className="w-4 h-4 text-gray-400 mt-1" />
                                    <div>
                                      <p className="text-xs text-gray-500">
                                        To
                                      </p>
                                      <p className="text-sm">
                                        {order.destination}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">
                                      {order.customername}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CurrencyDollarIcon className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm">
                                      $
                                      {parseFloat(
                                        order.total_amount || 0
                                      ).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <TruckIcon className="mx-auto h-12 w-12 text-gray-300" />
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            No recent orders
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            This driver hasn't been assigned any orders yet.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {drivers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No drivers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first driver.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/drivers/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Driver
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
