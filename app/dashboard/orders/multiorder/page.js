"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function MultiOrderPage() {
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverSearch, setDriverSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [selectedDriverInfo, setSelectedDriverInfo] = useState(null);
  const [driverActiveOrders, setDriverActiveOrders] = useState([]);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDrivers();
    fetchCustomers();
  }, []);

  async function fetchDrivers() {
    try {
      // First get all active drivers
      const { data: driversData, error: driversError } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (driversError) throw driversError;

      // Then get the order counts for each driver
      const driversWithCounts = await Promise.all(
        driversData.map(async (driver) => {
          const { count, error: countError } = await supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("driverid", driver.id)
            .eq("status", "confirmed");

          if (countError) {
            console.error(
              "Error counting orders for driver:",
              driver.id,
              countError
            );
            return { ...driver, active_orders: { count: 0 } };
          }

          return {
            ...driver,
            active_orders: { count: count || 0 },
          };
        })
      );

      console.log("Drivers with counts:", driversWithCounts);
      setDrivers(driversWithCounts || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setCustomers(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setLoading(false);
    }
  }

  async function handleCreateOrders() {
    if (!selectedDriver || selectedCustomers.length === 0) {
      alert("Please select a driver and at least one customer");
      return;
    }

    try {
      const orders = selectedCustomers.map((customer) => ({
        driverid: selectedDriver.id,
        drivername: selectedDriver.full_name,
        driveremail: selectedDriver.email,
        customerid: customer.id,
        customername: customer.full_name,
        status: "pending",
        payment_status: "pending",
        start: customer.homeaddress || "",
        destination: customer.workaddress || "",
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert(orders)
        .select();

      if (error) throw error;

      alert(`Successfully created ${orders.length} orders!`);
      // Reset selections
      setSelectedDriver(null);
      setSelectedCustomers([]);
    } catch (error) {
      console.error("Error creating orders:", error);
      alert("Error creating orders. Please try again.");
    }
  }

  async function fetchDriverActiveOrders(driverId) {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("driverid", driverId)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDriverActiveOrders(data || []);
    } catch (error) {
      console.error("Error fetching driver orders:", error);
    }
  }

  // Filter drivers based on search
  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.full_name?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      driver.phone?.toLowerCase().includes(driverSearch.toLowerCase()) ||
      driver.location?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  // Filter customers based on search
  const filteredCustomers = customers.filter(
    (customer) =>
      customer.full_name
        ?.toLowerCase()
        .includes(customerSearch.toLowerCase()) ||
      customer.phone?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.homeaddress
        ?.toLowerCase()
        .includes(customerSearch.toLowerCase()) ||
      customer.workaddress?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <DashboardLayout title="Create Multi-Order">
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Driver Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" /> Select Driver
            </h2>

            {/* Driver Search */}
            <div className="mb-4 relative">
              <div className="relative">
                <input
                  type="text"
                  value={driverSearch}
                  onChange={(e) => setDriverSearch(e.target.value)}
                  placeholder="Search drivers by name, phone, or location..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDrivers.map((driver) => (
                <button
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-4 rounded-lg border text-left hover:border-blue-500 transition-colors ${
                    selectedDriver?.id === driver.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-gray-900 mb-2">
                          {driver.full_name}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriverInfo(driver);
                            setShowDriverInfo(true);
                            fetchDriverActiveOrders(driver.id);
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <InformationCircleIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex gap-2 items-center mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {driver.active_orders?.count || 0} Orders
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
                      </div>
                      <div className="mt-1 space-y-1">
                        {driver.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <span className="font-medium">Phone:</span>{" "}
                            {driver.phone}
                          </p>
                        )}
                        {driver.alternate_phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <span className="font-medium">Alt Phone:</span>{" "}
                            {driver.alternate_phone}
                          </p>
                        )}
                      </div>
                      {driver.location && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span>{" "}
                            <span className="line-clamp-2">
                              {driver.location}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredDrivers.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-4">
                  No drivers found matching your search.
                </p>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <UsersIcon className="w-5 h-5" /> Select Customers
            </h2>

            {/* Customer Search */}
            <div className="mb-4 relative">
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, phone, or address..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomers((prev) =>
                      prev.find((c) => c.id === customer.id)
                        ? prev.filter((c) => c.id !== customer.id)
                        : [...prev, customer]
                    );
                  }}
                  className={`p-4 rounded-lg border text-left hover:border-blue-500 transition-colors ${
                    selectedCustomers.find((c) => c.id === customer.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {customer.full_name}
                        </p>
                      </div>
                      <div className="mt-1 space-y-1">
                        {customer.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <span className="font-medium">Phone:</span>{" "}
                            {customer.phone}
                          </p>
                        )}
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="mt-1 space-y-1">
                          {customer.address && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Address:</span>{" "}
                              <span className="line-clamp-2">
                                {customer.address}
                              </span>
                            </p>
                          )}
                          {customer.homeaddress && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Home Address:</span>{" "}
                              <span className="line-clamp-2">
                                {customer.homeaddress}
                              </span>
                            </p>
                          )}
                          {customer.workaddress && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Work Address:</span>{" "}
                              <span className="line-clamp-2">
                                {customer.workaddress}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                      {customer.ordernote && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Note:</span>{" "}
                            <span className="line-clamp-2">
                              {customer.ordernote}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-4">
                  No customers found matching your search.
                </p>
              )}
            </div>
          </div>

          {/* Create Orders Button */}
          <div className="flex justify-end">
            <button
              onClick={handleCreateOrders}
              disabled={!selectedDriver || selectedCustomers.length === 0}
              className="dashboard-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create {selectedCustomers.length} Orders
            </button>
          </div>
        </div>
      </div>
      {showDriverInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {selectedDriverInfo?.full_name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Driver Information</p>
              </div>
              <button
                onClick={() => setShowDriverInfo(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            {selectedDriverInfo && (
              <div className="space-y-6">
                {/* Driver Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Phone Number</p>
                      <p className="text-base font-medium text-gray-900">
                        {selectedDriverInfo.phone}
                      </p>
                    </div>
                    {selectedDriverInfo.alternate_phone && (
                      <div>
                        <p className="text-sm text-gray-500">
                          Alternative Phone
                        </p>
                        <p className="text-base font-medium text-gray-900">
                          {selectedDriverInfo.alternate_phone}
                        </p>
                      </div>
                    )}
                    {selectedDriverInfo.location && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-base font-medium text-gray-900">
                          {selectedDriverInfo.location}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Orders Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Active Orders
                    </h3>
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                      {driverActiveOrders.length} Orders
                    </span>
                  </div>

                  <div className="space-y-4">
                    {driverActiveOrders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-500 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 rounded-full p-2">
                              <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {order.customername}
                              </h4>
                              <p className="text-sm text-gray-500">
                                Created:{" "}
                                {new Date(
                                  order.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {order.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Pickup Location
                            </p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {order.start || "Not specified"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">
                              Drop Location
                            </p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {order.destination || "Not specified"}
                            </p>
                          </div>
                        </div>

                        {order.delivery_notes && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm text-gray-500 mb-1">
                              Delivery Notes
                            </p>
                            <p className="text-sm text-gray-900">
                              {order.delivery_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}

                    {driverActiveOrders.length === 0 && (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <p className="text-gray-500 text-base">
                          No active orders found for this driver
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
