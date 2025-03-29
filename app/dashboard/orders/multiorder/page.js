"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon,
  XMarkIcon,
  BuildingStorefrontIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

export default function MultiOrderPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const driverIdParam = searchParams.get('driverId');
  
  const [drivers, setDrivers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [selectedCustomerAddresses, setSelectedCustomerAddresses] = useState({});
  const [loading, setLoading] = useState(true);
  const [driverSearch, setDriverSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [selectedDriverInfo, setSelectedDriverInfo] = useState(null);
  const [driverActiveOrders, setDriverActiveOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [showRouteConfirmation, setShowRouteConfirmation] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState([]);
  const [isCalculatingRoutes, setIsCalculatingRoutes] = useState(false);
  const [returnToStore, setReturnToStore] = useState(false);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDrivers();
    fetchCustomers();
    fetchStores();
  }, []);

  // Set selected driver when driverId param is present
  useEffect(() => {
    if (driverIdParam && drivers.length > 0) {
      const driver = drivers.find(d => d.id === driverIdParam);
      if (driver) {
        console.log("Preselecting driver from URL:", driver.full_name);
        setSelectedDriver(driver);
        
        // Scroll to customer selection section after a short delay
        setTimeout(() => {
          const customerSection = document.getElementById('customer-selection-section');
          if (customerSection) {
            customerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [driverIdParam, drivers]);

  // Check for cached store after stores are loaded
  useEffect(() => {
    if (stores.length > 0) {
      // Get cached store from localStorage
      const cachedStoreId = localStorage.getItem('lastSelectedStore');
      if (cachedStoreId) {
        const store = stores.find(s => s.id === cachedStoreId);
        if (store) {
          console.log("Selecting cached store:", store.name);
          setSelectedStore(store);
        }
      }
    }
  }, [stores]);

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

      // Sort drivers by order count (ascending)
      const sortedDrivers = driversWithCounts.sort(
        (a, b) => (a.active_orders?.count || 0) - (b.active_orders?.count || 0)
      );

      console.log("Drivers with counts:", sortedDrivers);
      setDrivers(sortedDrivers || []);
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
      
      // Initialize selected addresses for each customer (first address by default)
      const addressMap = {};
      data.forEach(customer => {
        // Handle different address formats
        if (customer.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
          // New format
          addressMap[customer.id] = { 
            address: customer.addresses[0].address,
            label: customer.addresses[0].label || 'Address #1'
          };
        } else if (customer.homeaddress) {
          // Old format - prioritize home address
          addressMap[customer.id] = {
            address: customer.homeaddress,
            label: 'Home'
          };
        } else if (customer.workaddress) {
          // Old format - use work address as fallback
          addressMap[customer.id] = {
            address: customer.workaddress,
            label: 'Work'
          };
        } else {
          // No address available
          addressMap[customer.id] = {
            address: '',
            label: 'No Address'
          };
        }
      });
      
      setSelectedCustomerAddresses(addressMap);
      setCustomers(data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customers:", error);
      setLoading(false);
    }
  }

  async function fetchStores() {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  }

  async function calculateRoutes(store, customers) {
    const origins = [store.address];
    const destinations = customers.map((customer) => 
      selectedCustomerAddresses[customer.id]?.address || customer.homeaddress || ''
    );

    try {
      console.log("Calculating routes for:", { origins, destinations });

      const response = await fetch("/api/calculate-routes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          origins,
          destinations,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Match customers with their optimized route legs
      const routeDetails = data.legs.map((leg, index) => {
        const customer = customers[index]; // Use index to keep customer order consistent
        return {
          customer,
          distance: leg.distance,
          duration: leg.duration,
          origin: leg.origin,
          destination: leg.destination,
          durationValue: leg.durationValue,
          orderIndex: index + 1,
          addressLabel: selectedCustomerAddresses[customer.id]?.label || 'Home'
        };
      });

      // If returnToStore is enabled, calculate the route from the last customer back to the store
      if (returnToStore && routeDetails.length > 0) {
        const lastDestination = routeDetails[routeDetails.length - 1].destination;
        
        const returnResponse = await fetch("/api/calculate-routes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            origins: [lastDestination],
            destinations: [store.address],
          }),
        });
        
        const returnData = await returnResponse.json();
        if (returnData.success && returnData.legs && returnData.legs.length > 0) {
          routeDetails.push({
            isReturnToStore: true,
            distance: returnData.legs[0].distance,
            duration: returnData.legs[0].duration,
            origin: lastDestination,
            destination: store.address,
            durationValue: returnData.legs[0].durationValue,
            orderIndex: routeDetails.length + 1,
            addressLabel: "Store Return"
          });
        }
      }

      return routeDetails;
    } catch (error) {
      console.error("Error calculating routes:", error);
      throw error;
    }
  }

  async function handleCreateOrders() {
    if (!selectedDriver || !selectedStore || selectedCustomers.length === 0) {
      alert("Please select a driver, store, and at least one customer");
      return;
    }

    try {
      setIsCalculatingRoutes(true);
      const optimizedRoutes = await calculateRoutes(
        selectedStore,
        selectedCustomers
      );
      setOptimizedRoutes(optimizedRoutes);
      setShowRouteConfirmation(true);
    } catch (error) {
      console.error("Error calculating routes:", error);
      alert("Error calculating delivery routes. Please try again.");
    } finally {
      setIsCalculatingRoutes(false);
    }
  }

  async function handleConfirmOrders() {
    try {
      // Generate a unique batch ID
      const batchId = `batch_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Filter out the return to store leg for actual order creation
      const orderRoutes = optimizedRoutes.filter(route => !route.isReturnToStore);
      
      const orders = orderRoutes.map((route, index) => {
        const start =
          index === 0
            ? selectedStore.address
            : orderRoutes[index - 1].destination;

        return {
          driverid: selectedDriver.id,
          drivername: selectedDriver.full_name,
          driveremail: selectedDriver.email,
          customerid: route.customer.id,
          customername: route.customer.full_name,
          status: "confirmed",
          payment_status: "completed",
          payment_method: "monthly subscription",
          start: start,
          storeid: selectedStore.id,
          destination: route.destination,
          distance: route.distance,
          time: route.duration,
          delivery_sequence: index + 1,
          total_amount: 20.0,
          batch_id: batchId,  // Add the batch ID to each order
          store_name: selectedStore.name
        };
      });
      
      // Add the return to store leg if enabled
      if (returnToStore && optimizedRoutes.some(route => route.isReturnToStore)) {
        const returnLeg = optimizedRoutes.find(route => route.isReturnToStore);
        const lastOrder = orderRoutes[orderRoutes.length - 1];
        
        const returnOrder = {
          driverid: selectedDriver.id,
          drivername: selectedDriver.full_name,
          driveremail: selectedDriver.email,
          customerid: null,
          customername: "Return to Store",
          status: "confirmed",
          payment_status: "completed",
          payment_method: "monthly subscription",
          start: lastOrder.destination,
          storeid: selectedStore.id,
          destination: selectedStore.address,
          distance: returnLeg.distance,
          time: returnLeg.duration,
          delivery_sequence: orders.length + 1,
          total_amount: 0,
          batch_id: batchId,
          store_name: selectedStore.name,
          is_return_to_store: true
        };
        
        orders.push(returnOrder);
      }

      const { data, error } = await supabase
        .from("orders")
        .insert(orders)
        .select();

      if (error) throw error;

      // After successfully creating orders, create notifications for the driver
      const notifications = orders
        .filter(order => !order.is_return_to_store) // Don't create notifications for return-to-store orders
        .map((order, index) => ({
          recipient_type: "driver",
          recipient_id: selectedDriver.id,
          title: "New Delivery Assignment",
          message: `New delivery assigned from ${selectedStore.name} to ${
            order.customername
          }. Delivery sequence: ${index + 1}`,
          type: "order",
          delivery_attempted: false,
        }));

      // Insert notifications
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notificationError) throw notificationError;

      alert(`Successfully created ${orders.length} orders!`);
      setShowRouteConfirmation(false);
      setOptimizedRoutes([]);
      setSelectedDriver(null);
      setSelectedCustomers([]);
      setSelectedStore(null);
      setReturnToStore(false);
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

  // Filter stores based on search
  const filteredStores = stores.filter(
    (store) =>
      store.name?.toLowerCase().includes(storeSearch.toLowerCase()) ||
      store.address?.toLowerCase().includes(storeSearch.toLowerCase())
  );

  // Helper function to get all addresses for a customer
  const getCustomerAddresses = (customer) => {
    let addresses = [];
    
    // If customer has the new addresses array format
    if (customer?.addresses && Array.isArray(customer.addresses)) {
      addresses = customer.addresses.map((addr, i) => ({
        label: addr.label || `Address #${i + 1}`,
        address: addr.address
      }));
    } 
    // If customer has the old format
    else {
      if (customer?.homeaddress) {
        addresses.push({ label: "Home", address: customer.homeaddress });
      }
      if (customer?.workaddress) {
        addresses.push({ label: "Work", address: customer.workaddress });
      }
    }
    
    return addresses;
  };
  
  // Handle address change for a customer
  const handleAddressChange = (customerId, addressData) => {
    setSelectedCustomerAddresses(prev => ({
      ...prev,
      [customerId]: addressData
    }));
  };

  // Handle store selection
  const handleStoreSelect = (store) => {
    setSelectedStore(store);
    // Cache the selected store in localStorage
    if (store) {
      localStorage.setItem('lastSelectedStore', store.id);
    }
  };

  return (
    <DashboardLayout title="Create Multi-Order">
      <div className="">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Add Store Selection Section (before Driver Selection) */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <BuildingStorefrontIcon className="w-5 h-5" /> Select Store
            </h2>

            <div className="mb-4 relative">
              <div className="relative">
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  placeholder="Search stores by name or address..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredStores.map((store) => (
                <div
                  key={store.id}
                  onClick={() => handleStoreSelect(store)}
                  className={`p-4 rounded-lg border text-left hover:border-blue-500 transition-colors cursor-pointer ${
                    selectedStore?.id === store.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <p className="font-medium text-gray-900 mb-2">{store.icon ? `${store.icon} ` : "➕ "}{store.name}</p>
                  
                </div>
              ))}
              {filteredStores.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-4">
                  No stores found matching your search.
                </p>
              )}
            </div>
          </div>

          {/* Driver Selection */}
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5" /> Select Driver
              {driverIdParam && selectedDriver && (
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                  Pre-selected from Drivers page
                </span>
              )}
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
                <div
                  key={driver.id}
                  onClick={() => setSelectedDriver(driver)}
                  className={`p-4 rounded-lg border text-left hover:border-blue-500 transition-colors cursor-pointer ${
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
                </div>
              ))}
              {filteredDrivers.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-4">
                  No drivers found matching your search.
                </p>
              )}
            </div>
          </div>

          {/* Customer Selection */}
          <div id="customer-selection-section" className="mb-8">
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
              {filteredCustomers.map((customer) => {
                const addresses = getCustomerAddresses(customer);
                const selectedAddress = selectedCustomerAddresses[customer.id];
                
                return (
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
                          {addresses.length > 0 ? (
                            <div className="mt-1 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                  <MapPinIcon className="w-4 h-4 mr-1 text-blue-600" />
                                  Delivery Address:
                                </span>
                                {addresses.length > 1 && (
                                  <select 
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => {
                                      const index = parseInt(e.target.value);
                                      const addressData = addresses[index];
                                      handleAddressChange(customer.id, addressData);
                                    }}
                                    className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:border-blue-500 focus:ring-blue-500"
                                    value={addresses.findIndex(a => 
                                      a.address === selectedAddress?.address && a.label === selectedAddress?.label
                                    )}
                                  >
                                    {addresses.map((addr, idx) => (
                                      <option key={idx} value={idx}>
                                        {addr.label}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                              <div className="bg-gray-50 p-3 rounded-md border border-gray-200 hover:border-blue-300 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium text-blue-600 text-sm">
                                    {selectedAddress?.label || 'Address'}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-800 whitespace-pre-line">
                                  {selectedAddress?.address || 'No address available'}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-red-500 italic">No address available</p>
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
              )})}
              {filteredCustomers.length === 0 && (
                <p className="text-gray-500 col-span-full text-center py-4">
                  No customers found matching your search.
                </p>
              )}
            </div>
          </div>

          {/* Return to Store Option */}
          <div className="mb-6">
            <div className="flex items-center">
              <input
                id="return-to-store"
                type="checkbox"
                checked={returnToStore}
                onChange={(e) => setReturnToStore(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="return-to-store" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                <BuildingStorefrontIcon className="w-5 h-5 mr-1 text-blue-500" />
                Add return to store at the end of route
              </label>
            </div>
            {returnToStore && (
              <p className="mt-1 text-sm text-gray-500 ml-6">
                The driver will return to the store after completing all deliveries.
              </p>
            )}
          </div>

        </div>
      </div>
      
      {/* Floating Create Orders Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={handleCreateOrders}
          disabled={
            !selectedDriver ||
            !selectedStore ||
            selectedCustomers.length === 0
          }
          className={`dashboard-button-primary shadow-lg rounded-full px-6 py-3 flex items-center gap-2 ${
            (!selectedDriver || !selectedStore || selectedCustomers.length === 0) 
              ? "opacity-50 cursor-not-allowed" 
              : "hover:shadow-xl transition-shadow"
          }`}
        >
          <span>Create {selectedCustomers.length || 0} Orders</span>
          {(selectedDriver && selectedStore && selectedCustomers.length > 0) && (
            <div className="bg-white text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              {selectedCustomers.length}
            </div>
          )}
        </button>
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
      {showRouteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  Confirm Delivery Routes
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Review optimized multi-stop delivery route
                </p>
              </div>
              <button
                onClick={() => setShowRouteConfirmation(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {/* Store Details Card */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <BuildingStorefrontIcon className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Starting Point: {selectedStore.icon ? `${selectedStore.icon} ` : "🏪 "}{selectedStore.name}
                  </h3>
                </div>
                <div className="ml-9 space-y-2">
                  <div>
                    <p className="text-sm text-gray-500 inline">Address: </p>
                    <p className="text-base text-gray-900 inline">
                      {selectedStore.address}
                    </p>
                  </div>
                  {selectedStore.phone && (
                    <div>
                      <p className="text-sm text-gray-500 inline">Phone: </p>
                      <p className="text-base text-gray-900 inline">
                        {selectedStore.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Driver Details Card */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <UserIcon className="w-6 h-6 text-green-600" />
                  <h3 className="text-lg font-medium text-gray-900">
                    Assigned Driver: {selectedDriver.full_name}
                  </h3>
                </div>
                <div className="ml-9">
                  <div className="space-y-2">
                    {selectedDriver.location && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Location:</span>
                        <span className="text-sm text-gray-900 line-clamp-2">
                          {selectedDriver.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Delivery Stops */}
              {optimizedRoutes.map((route, index) => (
                <div
                  key={route.isReturnToStore ? 'return-to-store' : route.customer.id}
                  className={`${
                    route.isReturnToStore 
                      ? 'bg-blue-50 border border-blue-200'
                      : 'bg-white border border-gray-200'
                  } rounded-lg p-4`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${
                      route.isReturnToStore 
                        ? 'bg-blue-200 text-blue-700'
                        : 'bg-blue-100 text-blue-600'
                      } rounded-full w-6 h-6 flex items-center justify-center`}
                    >
                      <span className="text-sm font-medium">
                        {route.orderIndex}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">
                      {route.isReturnToStore 
                        ? 'Return to Store'
                        : route.customer.full_name
                      }
                    </h3>
                    {route.isReturnToStore && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Final Stop
                      </span>
                    )}
                  </div>
                  <div className="ml-9 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">From</p>
                        <p className="text-base text-gray-900 line-clamp-2">
                          {route.origin}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          To {!route.isReturnToStore && 
                              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
                                {route.addressLabel}
                              </span>
                            }
                        </p>
                        <p className="text-base text-gray-900 line-clamp-2">
                          {route.destination}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Distance</p>
                        <p className="text-base font-medium text-gray-900">
                          {route.distance}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estimated Time</p>
                        <p className="text-base font-medium text-gray-900">
                          {route.duration}
                        </p>
                      </div>
                    </div>
                    {!route.isReturnToStore && (
                      <>
                        {route.customer.phone && (
                          <div>
                            <p className="text-sm text-gray-500">Customer Phone</p>
                            <p className="text-base text-gray-900">
                              {route.customer.phone}
                            </p>
                          </div>
                        )}
                        {route.customer.ordernote && (
                          <div>
                            <p className="text-sm text-gray-500">Delivery Notes</p>
                            <p className="text-base text-gray-900">
                              {route.customer.ordernote}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowRouteConfirmation(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrders}
                className="dashboard-button-primary"
              >
                Confirm and Create Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
