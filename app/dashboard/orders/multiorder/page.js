"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserIcon,
  UsersIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function MultiOrderPage() {
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverSearch, setDriverSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDrivers();
    fetchCustomers();
  }, []);

  async function fetchDrivers() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      setDrivers(data || []);
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
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">
                          {driver.full_name}
                        </p>
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
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {driver.location && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span>{" "}
                            <span className="line-clamp-2">
                              {driver.location}
                            </span>
                          </p>
                        )}
                      </div>
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
                          {customer.homeaddress && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">From:</span>{" "}
                              <span className="line-clamp-2">
                                {customer.homeaddress}
                              </span>
                            </p>
                          )}
                          {customer.workaddress && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">To:</span>{" "}
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
    </DashboardLayout>
  );
}
