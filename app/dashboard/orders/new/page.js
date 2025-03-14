"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  ArrowLeftIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);

  const [formData, setFormData] = useState({
    customerid: "",
    storeid: "",
    start: "", // This will be store address
    destination: "", // This will be customer address
    delivery_notes: "",
    total_amount: "",
    payment_method: "",
    managernumber: "",
    driverid: "",
    drivername: "",
    driveremail: "",
    distance: "",
    time: "",
  });

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchStores(), fetchDrivers()]);
  }, []);

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, homeaddress, workaddress")
        .order("full_name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStores() {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, address")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  }

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

  const handleCustomerChange = (e) => {
    const customerId = e.target.value;
    const customer = customers.find((c) => c.id === customerId);
    setSelectedCustomer(customer);

    setFormData((prev) => ({
      ...prev,
      customerid: customerId,
      customername: customer?.full_name || "",
      destination: customer?.homeaddress || "", // Auto-fill destination with customer's home address
    }));
  };

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const store = stores.find((s) => s.id === storeId);

    setFormData((prev) => ({
      ...prev,
      storeid: storeId,
      start: store?.address || "", // Auto-fill start with store's address
    }));
  };

  const handleDriverChange = (e) => {
    const driverId = e.target.value;
    const driver = drivers.find((d) => d.id === driverId);
    setSelectedDriver(driver);

    setFormData((prev) => ({
      ...prev,
      driverid: driverId,
      drivername: driver?.full_name || "",
      driveremail: driver?.email || "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressTypeChange = (e) => {
    const addressType = e.target.value;
    setFormData((prev) => ({
      ...prev,
      destination: selectedCustomer?.[addressType] || "",
    }));
  };

  async function calculateRoute() {
    if (!formData.start || !formData.destination) return;

    setCalculatingRoute(true);
    try {
      const response = await fetch("/api/calculate-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origins: [formData.start],
          destinations: [formData.destination],
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      setFormData((prev) => ({
        ...prev,
        distance: data.legs[0].distance,
        time: data.legs[0].duration,
      }));
    } catch (error) {
      console.error("Error calculating route:", error);
    } finally {
      setCalculatingRoute(false);
    }
  }

  useEffect(() => {
    if (formData.start && formData.destination) {
      calculateRoute();
    }
  }, [formData.start, formData.destination]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get customer details from customers table
      const customer = customers.find((c) => c.id === formData.customerid);

      // Get store details
      const store = stores.find((s) => s.id === formData.storeid);

      // Prepare order data
      const orderData = {
        customerid: formData.customerid,
        customername: customer?.full_name || "",
        start: formData.start,
        destination: formData.destination,
        total_amount: parseFloat(formData.total_amount),
        payment_method: formData.payment_method,
        payment_status: "pending",
        status: formData.driverid ? "confirmed" : "pending",
        delivery_notes: formData.delivery_notes || "",
        managernumber: formData.managernumber || "",
        driverid: formData.driverid || null,
        drivername: formData.drivername || "",
        driveremail: formData.driveremail || "",
        distance: formData.distance || "",
        time: formData.time || "",
      };

      const { data, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;

      router.push("/dashboard/orders");
    } catch (error) {
      console.error("Error creating order:", error.message);
      alert(error.message || "Error creating order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      title="Create New Order"
      actions={
        <button
          onClick={() => router.push("/dashboard/orders")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Orders
        </button>
      }
    >
      <div className="">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-10">
            {/* Customer Information Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <UserIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Customer Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Customer *
                  </label>
                  <select
                    value={formData.customerid}
                    onChange={handleCustomerChange}
                    className="dashboard-input mt-1"
                    required
                  >
                    <option value="">Choose a customer...</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.full_name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCustomer && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Address Type *
                    </label>
                    <select
                      onChange={handleAddressTypeChange}
                      className="dashboard-input mt-1"
                      required
                    >
                      <option value="homeaddress">Home Address</option>
                      <option value="workaddress">Work Address</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Store & Delivery Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Store & Delivery Details
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Select Store *
                  </label>
                  <select
                    value={formData.storeid}
                    onChange={handleStoreChange}
                    className="dashboard-input mt-1"
                    required
                  >
                    <option value="">Choose a store...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      value={formData.start}
                      className="dashboard-input bg-gray-50"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Address
                    </label>
                    <input
                      type="text"
                      value={formData.destination}
                      className="dashboard-input bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Driver Assignment Section (after Store & Delivery Details) */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <UserIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Driver Assignment (Optional)
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign Driver
                </label>
                <select
                  value={formData.driverid}
                  onChange={handleDriverChange}
                  className="dashboard-input mt-1"
                >
                  <option value="">Select a driver...</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.full_name} - {driver.phone}
                    </option>
                  ))}
                </select>
              </div>

              {formData.distance && formData.time && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Distance
                    </label>
                    <input
                      type="text"
                      value={formData.distance}
                      className="dashboard-input mt-1 bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Time
                    </label>
                    <input
                      type="text"
                      value={formData.time}
                      className="dashboard-input mt-1 bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Payment Details
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Cash to be collected
                  </label>
                  <input
                    type="number"
                    name="total_amount"
                    value={formData.total_amount}
                    onChange={handleInputChange}
                    className="dashboard-input"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Payment Method *
                  </label>
                  <select
                    name="payment_method"
                    value={formData.payment_method || "cash"}
                    onChange={handleInputChange}
                    className="dashboard-input mt-1"
                    required
                  >
                    <option value="cash">Cash</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Additional Notes
                </h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Instructions
                </label>
                <textarea
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleInputChange}
                  className="dashboard-input mt-1"
                  rows={3}
                  placeholder="Add any special instructions for the delivery..."
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push("/dashboard/orders")}
                className="dashboard-button-secondary px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="dashboard-button-primary px-6"
              >
                {submitting ? "Creating..." : "Create Order"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
