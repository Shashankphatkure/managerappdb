"use client";
import { useState, useEffect, Suspense } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  ArrowLeftIcon,
  UserIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

// Component that uses useSearchParams
function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const driverId = searchParams.get('driverId');
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
  const [calculatedCreatedAt, setCalculatedCreatedAt] = useState(null);
  const [isCheckingDriverOrders, setIsCheckingDriverOrders] = useState(false);

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
    estimated_delivery_time: null, // Add new field for estimated delivery timestamp
  });

  useEffect(() => {
    Promise.all([fetchCustomers(), fetchStores(), fetchDrivers()]).then(() => {
      console.log("Initial data loaded: Customers, Stores, and Drivers");
    });
  }, []);

  // Pre-select driver from URL parameter if available
  useEffect(() => {
    if (driverId && drivers.length > 0) {
      const driver = drivers.find(d => d.id === driverId);
      if (driver) {
        console.log("Pre-selecting driver from URL parameter:", driver);
        selectDriver(driver);
      }
    }
  }, [driverId, drivers]);

  // Check for cached store after stores are loaded
  useEffect(() => {
    if (stores.length > 0) {
      // Get cached store from localStorage
      const cachedStoreId = localStorage.getItem('lastSelectedStore');
      if (cachedStoreId) {
        const store = stores.find(s => s.id === cachedStoreId);
        if (store) {
          console.log("Selecting cached store:", store.name);
          setFormData(prev => ({
            ...prev,
            storeid: store.id,
            start: store.address || ""
          }));
        }
      }
    }
  }, [stores]);

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

  const selectDriver = async (driver) => {
    setSelectedDriver(driver);
    setDriverSearch("");
    setIsCheckingDriverOrders(true);

    setFormData((prev) => ({
      ...prev,
      driverid: driver.id,
      drivername: driver?.full_name || "",
      driveremail: driver?.email || "",
    }));
    
    // Check if driver has previous orders and calculate potential created_at time
    try {
      const createdAt = await calculateOrderCreatedAt(driver.id);
      setCalculatedCreatedAt(createdAt);
      console.log(`Potential created_at time for new order: ${createdAt.toISOString()}`);
      
      // Recalculate estimated delivery time based on this new created_at time if we have a time estimate
      if (formData.time) {
        const newEstimatedDeliveryTime = calculateEstimatedDeliveryTime(formData.time, createdAt);
        console.log(`Recalculated estimated delivery time based on driver's timing: ${newEstimatedDeliveryTime}`);
        
        // Update the form data with the new estimated delivery time
        setFormData(prev => ({
          ...prev,
          estimated_delivery_time: newEstimatedDeliveryTime
        }));
      }
    } catch (error) {
      console.error("Error calculating potential created_at time:", error);
      setCalculatedCreatedAt(null);
    } finally {
      setIsCheckingDriverOrders(false);
    }
  };

  const handleStoreChange = (e) => {
    const storeId = e.target.value;
    const store = stores.find((s) => s.id === storeId);
    console.log("Store selected:", store);

    // Cache the selected store in localStorage
    if (storeId) {
      localStorage.setItem('lastSelectedStore', storeId);
    }

    setFormData((prev) => ({
      ...prev,
      storeid: storeId,
      start: store?.address || "", // Auto-fill start with store's address
    }));
    console.log("Store address set as starting point:", store?.address);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };
      
      // If time is being manually updated, recalculate estimated delivery time
      if (name === 'time' && value) {
        // Use calculatedCreatedAt as base time if available and a driver is selected
        const baseTime = calculatedCreatedAt && formData.driverid ? calculatedCreatedAt : null;
        updated.estimated_delivery_time = calculateEstimatedDeliveryTime(value, baseTime);
      }
      
      return updated;
    });
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

  // Helper function to parse time string (e.g. "30 mins") to minutes
  function parseTimeToMinutes(timeString) {
    if (!timeString || typeof timeString !== 'string') return 0;
    
    // Try to extract numerical value and time unit
    const match = timeString.match(/(\d+)(?:\s*)(\w+)/);
    if (!match) return 0;
    
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    
    if (unit.includes('min')) return value;
    if (unit.includes('hour')) return value * 60;
    if (unit.includes('day')) return value * 24 * 60;
    
    return value; // Default assuming minutes
  }

  // Calculates and sets the estimated delivery timestamp
  function calculateEstimatedDeliveryTime(timeString, baseTime = null) {
    // If no time provided, don't calculate
    if (!timeString || timeString === "Could not calculate") {
      return null;
    }

    try {
      // Parse the time string to minutes
      const minutesToAdd = parseTimeToMinutes(timeString);
      
      // Create a timestamp for baseTime (or now) + estimated delivery time
      const base = baseTime ? new Date(baseTime) : new Date();
      const estimatedDeliveryTime = new Date(base);
      estimatedDeliveryTime.setMinutes(estimatedDeliveryTime.getMinutes() + minutesToAdd);
      
      console.log(`Calculated estimated delivery time: ${estimatedDeliveryTime.toISOString()} (based on ${base.toISOString()})`);
      return estimatedDeliveryTime.toISOString();
    } catch (error) {
      console.error("Error calculating delivery timestamp:", error);
      return null;
    }
  }

  // Fetch the driver's most recent order
  async function fetchLastDriverOrder(driverId) {
    if (!driverId) return null;
    
    console.log(`Fetching last order for driver: ${driverId}`);
    
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("driverid", driverId)
        .order("created_at", { ascending: false })
        .limit(1);
        
      if (error) {
        console.error("Error fetching driver's last order:", error);
        return null;
      }
      
      if (data && data.length > 0) {
        console.log("Found driver's last order:", data[0]);
        return data[0];
      } else {
        console.log("No previous orders found for this driver");
        return null;
      }
    } catch (error) {
      console.error("Exception fetching driver's last order:", error);
      return null;
    }
  }
  
  // Calculate appropriate created_at timestamp for new order
  async function calculateOrderCreatedAt(driverId) {
    if (!driverId) {
      console.log("No driver selected, using current timestamp");
      return new Date();
    }
    
    // Get driver's last order
    const lastOrder = await fetchLastDriverOrder(driverId);
    
    if (!lastOrder) {
      console.log("No previous orders for driver, using current timestamp");
      return new Date();
    }
    
    let calculatedTime = null;
    const now = new Date();
    
    // Case 1: If last order has a completion time, use that as the base
    if (lastOrder.completiontime) {
      try {
        console.log("Using last order completion time as base:", lastOrder.completiontime);
        
        // Check if completiontime is a timestamp or a string
        if (typeof lastOrder.completiontime === 'string') {
          // Try to parse as ISO date
          if (lastOrder.completiontime.includes('Z') || lastOrder.completiontime.includes('T')) {
            calculatedTime = new Date(lastOrder.completiontime);
            console.log(`Parsed completion time: ${calculatedTime.toISOString()}`);
          } else {
            // Handle case where completiontime might be a text description, not a timestamp
            console.log("Last order has text completion time, using current timestamp");
            calculatedTime = now;
          }
        } else if (lastOrder.completiontime instanceof Date) {
          calculatedTime = lastOrder.completiontime;
        } else {
          console.log("Unrecognized completiontime format, using current timestamp");
          calculatedTime = now;
        }
      } catch (error) {
        console.error("Error parsing completion time:", error);
        calculatedTime = now;
      }
    }
    
    // Case 2: If we couldn't use completiontime but have estimated_delivery_time, use that
    if (!calculatedTime && lastOrder.estimated_delivery_time) {
      try {
        console.log("Using last order's estimated delivery time as base:", lastOrder.estimated_delivery_time);
        calculatedTime = new Date(lastOrder.estimated_delivery_time);
      } catch (error) {
        console.error("Error parsing estimated delivery time:", error);
        calculatedTime = now;
      }
    }
    
    // Case 3: Default to current time if we couldn't determine a time
    if (!calculatedTime) {
      console.log("No relevant timestamps found in last order, using current timestamp");
      calculatedTime = now;
    }
    
    // Make sure the calculated time is not in the past
    // If it is > 5 minutes in the past, use current time instead
    if (calculatedTime < new Date(now.getTime() - 5 * 60 * 1000)) {
      console.log("Calculated time is more than 5 minutes in the past, using current time instead");
      console.log(`Past time: ${calculatedTime.toISOString()}, Current time: ${now.toISOString()}`);
      return now;
    }
    
    // Add a small buffer (10 seconds) if we're using a time from another order
    // This ensures consecutive orders for the same driver are properly sequenced
    if (calculatedTime.getTime() !== now.getTime()) {
      calculatedTime = new Date(calculatedTime.getTime() + 10 * 1000);
      console.log(`Added 10-second buffer to calculated time: ${calculatedTime.toISOString()}`);
    }
    
    return calculatedTime;
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
        estimated_delivery_time: null,
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
          estimated_delivery_time: null,
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

      // Get base time for estimating delivery (use calculatedCreatedAt if available)
      const baseTime = calculatedCreatedAt && formData.driverid ? calculatedCreatedAt : null;
      
      // Calculate estimated delivery time
      const estimatedDeliveryTime = calculateEstimatedDeliveryTime(data.legs[0].duration, baseTime);

      setFormData((prev) => ({
        ...prev,
        distance: data.legs[0].distance,
        time: data.legs[0].duration,
        estimated: data.estimated || data.legs[0].estimated,
        estimated_delivery_time: estimatedDeliveryTime,
      }));
      
      setRouteCalculationFailed(false);
      
      console.log("Route calculated successfully:", {
        distance: data.legs[0].distance,
        duration: data.legs[0].duration,
        estimated: data.estimated || data.legs[0].estimated,
        baseTime: baseTime ? baseTime.toISOString() : 'current time',
        estimated_delivery_time: estimatedDeliveryTime
      });
    } catch (error) {
      console.error("Error calculating route:", error);
      
      // Set fallback values for distance and time
      setFormData((prev) => ({
        ...prev,
        distance: "Could not calculate",
        time: "Could not calculate",
        estimated_delivery_time: null,
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
      
      // Calculate appropriate created_at timestamp if driver is assigned
      let createdAt = null;
      if (formData.driverid) {
        createdAt = await calculateOrderCreatedAt(formData.driverid);
        console.log(`Calculated created_at time for new order: ${createdAt.toISOString()}`);
      }

      // Prepare order data
      const orderData = {
        customerid: formData.customerid,
        customername: customer?.full_name || "",
        storeid: formData.storeid,
        store_name: store?.name || "",
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
      
      // Add created_at only if we calculated a custom timestamp
      if (createdAt) {
        orderData.created_at = createdAt.toISOString();
        
        // Recalculate estimated_delivery_time based on custom created_at
        if (formData.time) {
          orderData.estimated_delivery_time = calculateEstimatedDeliveryTime(formData.time, createdAt);
          console.log(`Adjusted estimated_delivery_time to be based on created_at: ${orderData.estimated_delivery_time}`);
        } else {
          orderData.estimated_delivery_time = formData.estimated_delivery_time;
        }
      } else {
        // Use the originally calculated estimated_delivery_time
        orderData.estimated_delivery_time = formData.estimated_delivery_time;
      }
      
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
                
                {isCheckingDriverOrders && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <svg className="animate-spin h-4 w-4 mr-2 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Checking driver's previous orders...
                  </div>
                )}
                
                {calculatedCreatedAt && calculatedCreatedAt.getTime() > new Date().getTime() - 1000 * 60 && calculatedCreatedAt.getTime() < new Date().getTime() + 1000 * 60 ? (
                  <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-600">
                      This order will be created with the current time.
                    </p>
                  </div>
                ) : calculatedCreatedAt && (
                  <div className="mt-2 p-3 border border-orange-200 rounded-md bg-orange-50">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-sm text-orange-800">
                        Scheduled Order Creation
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      Based on this driver's previous orders, this order will be created with a timestamp of:
                    </p>
                    <p className="font-medium text-sm mt-1">
                      {calculatedCreatedAt.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      This helps maintain proper sequencing of orders for the driver.
                    </p>
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
                        onBlur={(e) => {
                          if (e.target.value) {
                            // Calculate estimated delivery time when manually entered
                            // Use calculatedCreatedAt as base time if available and a driver is selected
                            const baseTime = calculatedCreatedAt && formData.driverid ? calculatedCreatedAt : null;
                            const estimatedDeliveryTime = calculateEstimatedDeliveryTime(e.target.value, baseTime);
                            setFormData(prev => ({
                              ...prev,
                              estimated_delivery_time: estimatedDeliveryTime
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {formData.estimated_delivery_time && (
                    <div className="mt-4 p-3 border border-blue-200 rounded-md bg-blue-50">
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium text-sm">
                          Calculated Delivery Time: {new Date(formData.estimated_delivery_time).toLocaleString()}
                        </span>
                      </div>
                      {calculatedCreatedAt && formData.driverid && (
                        <p className="text-xs text-blue-700 mt-1 ml-7">
                          Based on driver's scheduled start time: {calculatedCreatedAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
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
                  
                  {formData.estimated_delivery_time && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Estimated Delivery Time
                      </label>
                      <div className="dashboard-input mt-1 bg-blue-50 border-blue-200 p-3">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {new Date(formData.estimated_delivery_time).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-blue-700 mt-1">
                          {calculatedCreatedAt && formData.driverid && calculatedCreatedAt.getTime() > new Date().getTime() + 60000 ? 
                            `Based on driver's scheduled start time: ${calculatedCreatedAt.toLocaleString()}` : 
                            "The order's estimated delivery time will be saved for future reference."}
                        </p>
                      </div>
                    </div>
                  )}
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

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <DashboardLayout title="Create New Order">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p>Loading order form...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewOrderContent />
    </Suspense>
  );
}
