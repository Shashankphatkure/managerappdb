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
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [stores, setStores] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerAddresses, setCustomerAddresses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [driverSearch, setDriverSearch] = useState("");
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [calculatingRoute, setCalculatingRoute] = useState(false);
  const [routeCalculationFailed, setRouteCalculationFailed] = useState(false);

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
    change_amount: "",
    estimated: false,
  });

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchStores(), fetchDrivers()]).then(() => {
      console.log("Initial data loaded: Customers, Stores, and Drivers");
    });
  }, []);

  useEffect(() => {
    // Filter customers based on search
    if (customerSearch.trim() === "") {
      setFilteredCustomers([]);
    } else {
      console.log("Filtering customers with search term:", customerSearch);
      const filtered = customers.filter(customer => 
        customer.full_name.toLowerCase().includes(customerSearch.toLowerCase()) || 
        customer.phone?.includes(customerSearch)
      );
      console.log(`Found ${filtered.length} matching customers`);
      setFilteredCustomers(filtered);
    }
  }, [customerSearch, customers]);

  useEffect(() => {
    // Filter drivers based on search
    if (driverSearch.trim() === "") {
      setFilteredDrivers([]);
    } else {
      const filtered = drivers.filter(driver => 
        driver.full_name.toLowerCase().includes(driverSearch.toLowerCase()) || 
        driver.phone?.includes(driverSearch)
      );
      setFilteredDrivers(filtered);
    }
  }, [driverSearch, drivers]);

  async function fetchCustomers() {
    try {
      console.log("Fetching customers from database...");
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, homeaddress, workaddress, addresses")
        .order("full_name");

      if (error) throw error;
      console.log(`Fetched ${data?.length || 0} customers from database`);
      console.log("Sample customer data structure:", data?.[0]);
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStores() {
    try {
      console.log("Fetching stores from database...");
      const { data, error } = await supabase
        .from("stores")
        .select("id, name, address, icon")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      console.log(`Fetched ${data?.length || 0} stores from database`);
      console.log("Sample store data structure:", data?.[0]);
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  }

  async function fetchDrivers() {
    try {
      console.log("Fetching drivers from database...");
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      console.log(`Fetched ${data?.length || 0} drivers from database`);
      console.log("Sample driver data structure:", data?.[0]);
      setDrivers(data || []);
    } catch (error) {
      console.error("Error fetching drivers:", error);
    }
  }

  const handleCustomerSearch = (e) => {
    setCustomerSearch(e.target.value);
  };

  const handleDriverSearch = (e) => {
    setDriverSearch(e.target.value);
  };

  const selectCustomer = (customer) => {
    console.log("Customer selected:", customer);
    setSelectedCustomer(customer);
    setCustomerSearch("");
    
    // Prepare customer addresses array
    let addresses = [];
    
    // If customer has the new addresses array format
    if (customer?.addresses && Array.isArray(customer.addresses)) {
      console.log("Customer has 'addresses' array format:", customer.addresses);
      addresses = customer.addresses;
    } 
    // If customer has the old format, convert it
    else {
      console.log("Customer has old address format. Home:", customer?.homeaddress, "Work:", customer?.workaddress);
      if (customer?.homeaddress) {
        addresses.push({ label: "Home", address: customer.homeaddress });
      }
      if (customer?.workaddress) {
        addresses.push({ label: "Work", address: customer.workaddress });
      }
    }
    
    console.log("Processed customer addresses:", addresses);
    setCustomerAddresses(addresses);
    
    // Set the first address as default if available
    const defaultAddress = addresses.length > 0 ? addresses[0].address : "";
    console.log("Setting default destination address:", defaultAddress);
    
    setFormData((prev) => ({
      ...prev,
      customerid: customer.id,
      customername: customer?.full_name || "",
      destination: defaultAddress
    }));
  };

  const selectDriver = (driver) => {
    setSelectedDriver(driver);
    setDriverSearch("");

    setFormData((prev) => ({
      ...prev,
      driverid: driver.id,
      drivername: driver?.full_name || "",
      driveremail: driver?.email || "",
    }));
  };

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const store = stores.find((s) => s.id === storeId);
    console.log("Store selected:", store);

    setFormData((prev) => ({
      ...prev,
      storeid: storeId,
      start: store?.address || "", // Auto-fill start with store's address
    }));
    console.log("Store address set as starting point:", store?.address);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const addressIndex = parseInt(e.target.value);
    const selectedAddress = customerAddresses[addressIndex]?.address || "";
    console.log("Customer address changed to index:", addressIndex, "Address:", selectedAddress);
    
    setFormData((prev) => ({
      ...prev,
      destination: selectedAddress,
    }));
  };

  // Helper function to validate addresses
  function isValidAddress(address) {
    if (!address) return false;
    
    // Check if address is too short (likely incomplete)
    if (address.length < 10) return false;
    
    // Check if it has at least a number or recognizable address component
    const hasAddressComponents = /\d+/.test(address) || 
      /street|road|avenue|lane|drive|circle|boulevard|highway|plaza|sector|colony|apartments|flats|towers|building|complex/i.test(address);
      
    return hasAddressComponents;
  }

  async function calculateRoute() {
    if (!formData.start || !formData.destination) {
      console.log("Cannot calculate route: Missing start or destination", {
        start: formData.start,
        destination: formData.destination
      });
      return;
    }
    
    // Validate addresses
    if (!isValidAddress(formData.start) || !isValidAddress(formData.destination)) {
      console.log("Cannot calculate route: Invalid address format", {
        start: formData.start,
        destination: formData.destination
      });
      
      setFormData((prev) => ({
        ...prev,
        distance: "Need valid address",
        time: "Need valid address",
      }));
      
      setRouteCalculationFailed(true);
      return;
    }

    console.log("Calculating route between:", {
      start: formData.start,
      destination: formData.destination
    });
    
    setCalculatingRoute(true);
    setRouteCalculationFailed(false);
    
    try {
      console.log("Sending route calculation request to API");
      const response = await fetch("/api/calculate-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origins: [formData.start],
          destinations: [formData.destination],
        }),
      });

      const data = await response.json();
      console.log("Route calculation API response:", data);
      
      if (!data.success) {
        console.error("Route calculation failed:", data.error);
        
        // Set fallback values for distance and time
        setFormData((prev) => ({
          ...prev,
          distance: "Could not calculate",
          time: "Could not calculate",
        }));
        
        setRouteCalculationFailed(true);
        
        // Show user-friendly error message
        alert(`Could not calculate route: ${data.error || "Unknown error"}. You can enter estimated distance and time manually.`);
        return;
      }

      // Check if result is an estimate
      if (data.estimated) {
        console.log("Route calculation returned an estimated result");
      }

      setFormData((prev) => ({
        ...prev,
        distance: data.legs[0].distance,
        time: data.legs[0].duration,
        estimated: data.estimated || data.legs[0].estimated,
      }));
      
      setRouteCalculationFailed(false);
      
      console.log("Route calculated successfully:", {
        distance: data.legs[0].distance,
        duration: data.legs[0].duration,
        estimated: data.estimated || data.legs[0].estimated
      });
    } catch (error) {
      console.error("Error calculating route:", error);
      
      // Set fallback values for distance and time
      setFormData((prev) => ({
        ...prev,
        distance: "Could not calculate",
        time: "Could not calculate",
      }));
      
      setRouteCalculationFailed(true);
      
      // Show user-friendly error message
      alert(`Could not calculate route: ${error.message}. You can enter estimated distance and time manually.`);
    } finally {
      setCalculatingRoute(false);
    }
  }

  useEffect(() => {
    if (formData.start && formData.destination) {
      console.log("Start or destination changed, recalculating route");
      calculateRoute();
    }
  }, [formData.start, formData.destination]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get customer details from customers table
      const customer = customers.find((c) => c.id === formData.customerid);
      console.log("Submitting order with customer:", customer);

      // Get store details
      const store = stores.find((s) => s.id === formData.storeid);
      console.log("Store for order:", store);

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
        change_amount: parseFloat(formData.change_amount) || null,
      };
      
      console.log("Order data being submitted:", orderData);

      const { data, error: orderError } = await supabase
        .from("orders")
        .insert([orderData])
        .select()
        .single();

      if (orderError) throw orderError;
      
      console.log("Order created successfully:", data);

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
                    Search Customer *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={customerSearch}
                      onChange={handleCustomerSearch}
                      className="dashboard-input mt-1 w-full"
                      placeholder="Search by name or phone number"
                      onFocus={() => console.log("Customer search focused, current customers:", customers)}
                    />
                    {filteredCustomers.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                        {filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            onClick={() => selectCustomer(customer)}
                            className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                          >
                            <div className="font-medium">{customer.full_name}</div>
                            <div className="text-sm text-gray-600">{customer.phone}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {selectedCustomer && (
                    <div className="mt-2 p-3 border border-gray-200 rounded-md bg-blue-50">
                      <div className="font-medium">{selectedCustomer.full_name}</div>
                      <div className="text-sm text-gray-600">{selectedCustomer.phone}</div>
                    </div>
                  )}
                </div>

                {selectedCustomer && customerAddresses.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Delivery Address *
                    </label>
                    <select
                      onChange={handleAddressChange}
                      className="dashboard-input mt-1"
                      required
                      onClick={() => console.log("Current customer addresses:", customerAddresses)}
                    >
                      {customerAddresses.map((addr, index) => (
                        <option key={index} value={index}>
                          {addr.label || `Address #${index + 1}`}: {addr.address.substring(0, 40)}...
                        </option>
                      ))}
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
                    onClick={() => console.log("Available stores:", stores)}
                  >
                    <option value="">Choose a store...</option>
                    {stores.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.icon ? `${store.icon} ` : "🏪 "}{store.name}
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
                      onClick={() => console.log("Current start location:", formData.start)}
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
                      onClick={() => console.log("Current destination:", formData.destination)}
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
                  Search Driver
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={driverSearch}
                    onChange={handleDriverSearch}
                    className="dashboard-input mt-1 w-full"
                    placeholder="Search by name or phone number"
                  />
                  {filteredDrivers.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                      {filteredDrivers.map((driver) => (
                        <div
                          key={driver.id}
                          onClick={() => selectDriver(driver)}
                          className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                        >
                          <div className="font-medium">{driver.full_name}</div>
                          <div className="text-sm text-gray-600">{driver.phone || 'No phone'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedDriver && (
                  <div className="mt-2 p-3 border border-gray-200 rounded-md bg-blue-50">
                    <div className="font-medium">{selectedDriver.full_name}</div>
                    <div className="text-sm text-gray-600">{selectedDriver.phone || 'No phone'}</div>
                  </div>
                )}
              </div>

              {/* Add manual distance/time entry if calculation failed */}
              {routeCalculationFailed && (
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200 mb-4">
                  <h3 className="text-sm font-medium text-yellow-800 mb-2">
                    Route calculation failed. Please enter estimated values:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Estimated Distance (e.g., "10 km")
                      </label>
                      <input
                        type="text"
                        name="distance"
                        value={formData.distance === "Could not calculate" ? "" : formData.distance}
                        onChange={handleInputChange}
                        className="dashboard-input mt-1"
                        placeholder="Enter estimated distance"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Estimated Time (e.g., "30 mins")
                      </label>
                      <input
                        type="text"
                        name="time"
                        value={formData.time === "Could not calculate" ? "" : formData.time}
                        onChange={handleInputChange}
                        className="dashboard-input mt-1"
                        placeholder="Enter estimated time"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.distance && formData.time && !routeCalculationFailed && (
                <div>
                  {formData.estimated && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-700">
                        Note: This is an estimated distance and time based on the locations provided.
                      </p>
                    </div>
                  )}
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
                        onClick={() => console.log("Current distance calculation:", formData.distance)}
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
                        onClick={() => console.log("Current time calculation:", formData.time)}
                      />
                    </div>
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
                    <option value="prepaid">Prepaid</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Change to be given
                </label>
                <input
                  type="number"
                  name="change_amount"
                  value={formData.change_amount || ""}
                  onChange={handleInputChange}
                  className="dashboard-input"
                  step="0.01"
                />
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
