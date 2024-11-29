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

  const [formData, setFormData] = useState({
    customerid: "",
    storeid: "",
    start: "", // This will be store address
    destination: "", // This will be customer address
    delivery_notes: "",
    total_amount: "",
    payment_method: "",
    managernumber: "",
  });

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchStores()]);
  }, []);

  async function fetchCustomers() {
    try {
      const { data, error } = await supabase
        .from("users")
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

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get customer details
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
        status: "pending",
        delivery_notes: formData.delivery_notes || "",
        managernumber: formData.managernumber || "",
        distance: "", // You might want to calculate this
        time: "", // You might want to calculate this
      };

      // Insert the order
      const { data, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error("Supabase error:", orderError);
        throw orderError;
      }

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
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Customer
              </label>
              <select
                value={formData.customerid}
                onChange={handleCustomerChange}
                className="dashboard-input"
                required
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.full_name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {/* Store Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Store
              </label>
              <select
                value={formData.storeid}
                onChange={handleStoreChange}
                className="dashboard-input"
                required
              >
                <option value="">Select Store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pickup Location (Store Address) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Pickup Location (Store Address)
              </label>
              <input
                type="text"
                value={formData.start}
                className="dashboard-input bg-gray-50"
                disabled
              />
            </div>

            {/* Delivery Address Selection */}
            {selectedCustomer && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Address Type
                </label>
                <select
                  onChange={handleAddressTypeChange}
                  className="dashboard-input"
                  required
                >
                  <option value="homeaddress">Home Address</option>
                  <option value="workaddress">Work Address</option>
                </select>
              </div>
            )}

            {/* Delivery Address (Customer Address) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Delivery Address
              </label>
              <input
                type="text"
                value={formData.destination}
                className="dashboard-input bg-gray-50"
                disabled
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount
              </label>
              <input
                type="number"
                name="total_amount"
                value={formData.total_amount}
                onChange={handleInputChange}
                className="dashboard-input"
                step="0.01"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleInputChange}
                className="dashboard-input"
                required
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
              </select>
            </div>

            {/* Delivery Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Delivery Notes
              </label>
              <textarea
                name="delivery_notes"
                value={formData.delivery_notes}
                onChange={handleInputChange}
                className="dashboard-input"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard/orders")}
                className="dashboard-button-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="dashboard-button-primary"
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
