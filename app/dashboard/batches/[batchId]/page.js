"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserIcon,
  TruckIcon,
  MapPinIcon,
  DocumentDuplicateIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhoneIcon,
} from "@heroicons/react/24/outline";

export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { batchId } = params;
  
  const [batch, setBatch] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driver, setDriver] = useState(null);
  const [store, setStore] = useState(null);
  const [mapUrl, setMapUrl] = useState("");
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
    }
  }, [batchId]);

  async function fetchBatchDetails() {
    try {
      // Get all orders in this batch
      const { data: batchOrders, error: ordersError } = await supabase
        .from("orders")
        .select(`
          *,
          customers (full_name, phone, homeaddress, workaddress, addresses)
        `)
        .eq("batch_id", batchId)
        .order("delivery_sequence");

      if (ordersError) throw ordersError;
      
      if (!batchOrders || batchOrders.length === 0) {
        setLoading(false);
        return;
      }

      setOrders(batchOrders);
      
      // Get driver details
      if (batchOrders[0].driverid) {
        const { data: driverData, error: driverError } = await supabase
          .from("users")
          .select("*")
          .eq("id", batchOrders[0].driverid)
          .single();
        
        if (!driverError) {
          setDriver(driverData);
        }
      }
      
      // Get store details
      if (batchOrders[0].storeid) {
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("*")
          .eq("id", batchOrders[0].storeid)
          .single();
        
        if (!storeError) {
          setStore(storeData);
        }
      }

      // Calculate batch stats
      const orderStatuses = batchOrders.map(order => order.status);
      const completedCount = orderStatuses.filter(status => 
        ["delivered", "reached"].includes(status)
      ).length;
      
      const inProgressCount = orderStatuses.filter(status => 
        ["accepted", "picked_up", "on_way"].includes(status)
      ).length;
      
      let batchStatus = "pending";
      if (completedCount === batchOrders.length) {
        batchStatus = "completed";
      } else if (inProgressCount > 0 || completedCount > 0) {
        batchStatus = "in_progress";
      } else if (orderStatuses.every(status => status === "confirmed")) {
        batchStatus = "confirmed";
      }

      // Generate Google Maps URL for the route
      const destinationAddresses = batchOrders.map(order => {
        const customerAddr = order.destination || getCustomerAddress(order.customers);
        return encodeURIComponent(customerAddr);
      }).filter(addr => addr);

      const startAddr = batchOrders[0].start || store?.address;
      
      if (startAddr && destinationAddresses.length > 0) {
        const waypoints = destinationAddresses.slice(0, -1).join('|');
        const destination = destinationAddresses[destinationAddresses.length - 1];
        
        let mapUrlString = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(startAddr)}&destination=${destination}`;
        
        if (waypoints) {
          mapUrlString += `&waypoints=${waypoints}`;
        }
        
        setMapUrl(mapUrlString);
      }

      // Set batch object
      setBatch({
        batch_id: batchId,
        created_at: batchOrders[0].created_at,
        orders_count: batchOrders.length,
        status: batchStatus,
        store_name: batchOrders[0].store_name || store?.name,
        completion_percentage: Math.round((completedCount / batchOrders.length) * 100)
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      setLoading(false);
    }
  }

  // Helper to get customer address from different possible formats
  const getCustomerAddress = (customer) => {
    if (!customer) return "";
    
    if (customer.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      return customer.addresses[0].address;
    }
    
    return customer.homeaddress || customer.workaddress || "";
  };

  // Helper to get address label
  const getAddressLabel = (customer) => {
    if (!customer) return "";
    
    if (customer.addresses && Array.isArray(customer.addresses) && customer.addresses.length > 0) {
      return customer.addresses[0].label || "Address";
    }
    
    return customer.homeaddress ? "Home" : (customer.workaddress ? "Work" : "");
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-indigo-100 text-indigo-800",
      accepted: "bg-blue-100 text-blue-800",
      picked_up: "bg-blue-100 text-blue-800",
      on_way: "bg-purple-100 text-purple-800",
      reached: "bg-green-100 text-green-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Helper function to get status label
  const getStatusLabel = (status) => {
    const labels = {
      pending: "Pending",
      confirmed: "Confirmed",
      accepted: "Accepted",
      picked_up: "Picked Up",
      on_way: "On The Way",
      reached: "Reached",
      delivered: "Delivered",
      cancelled: "Cancelled",
      in_progress: "In Progress",
      completed: "Completed",
    };
    return labels[status] || status;
  };

  return (
    <DashboardLayout 
      title={
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard/batches")}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold">Batch Details</h1>
            <p className="text-sm text-gray-500">
              {batch ? `Batch ID: ${batch.batch_id}` : "Loading batch details..."}
            </p>
          </div>
        </div>
      }
      actions={
        mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="dashboard-button-primary flex items-center gap-2"
          >
            <MapPinIcon className="w-5 h-5" /> View Route on Maps
          </a>
        )
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse h-16 bg-[#f3f2f1] rounded-lg"
              />
            ))}
          </div>
        ) : batch ? (
          <>
            {/* Batch Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Batch Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Batch Information</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <span
                        className={`inline-flex items-center mt-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}
                      >
                        {getStatusLabel(batch.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Created At</p>
                      <p className="text-base font-medium text-gray-900">
                        {batch.created_at && new Date(batch.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Number of Orders</p>
                      <p className="text-base font-medium text-gray-900">
                        {batch.orders_count} Orders
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Progress</p>
                      <div className="mt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {batch.completion_percentage}% Complete
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${batch.completion_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Store Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Pickup Location</h2>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-3">
                      <BuildingStorefrontIcon className="w-6 h-6 text-blue-500 mr-2" />
                      <h3 className="text-lg font-medium">{store?.name || batch.store_name}</h3>
                    </div>
                    <div className="space-y-2 ml-8">
                      {store?.address && (
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-sm font-medium text-gray-900">
                            {store.address}
                          </p>
                        </div>
                      )}
                      {store?.phone && (
                        <div className="flex items-center">
                          <p className="text-sm text-gray-500 mr-2">Phone:</p>
                          <p className="text-sm font-medium text-gray-900">
                            {store.phone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Driver Information */}
                <div className="space-y-4">
                  <h2 className="text-lg font-medium">Driver Information</h2>
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-3">
                      <TruckIcon className="w-6 h-6 text-green-500 mr-2" />
                      <h3 className="text-lg font-medium">
                        {driver?.full_name || orders[0]?.drivername || "No Driver"}
                      </h3>
                    </div>
                    {driver && (
                      <div className="space-y-2 ml-8">
                        {driver.phone && (
                          <div className="flex items-center">
                            <p className="text-sm text-gray-500 mr-2">Phone:</p>
                            <p className="text-sm font-medium text-gray-900">
                              {driver.phone}
                            </p>
                            <a 
                              href={`tel:${driver.phone}`} 
                              className="ml-2 p-1.5 bg-green-100 rounded-full text-green-600 hover:bg-green-200"
                            >
                              <PhoneIcon className="w-4 h-4" />
                            </a>
                          </div>
                        )}
                        {driver.location && (
                          <div>
                            <p className="text-sm text-gray-500">Location</p>
                            <p className="text-sm font-medium text-gray-900">
                              {driver.location}
                            </p>
                          </div>
                        )}
                        {driver.vehicle_number && (
                          <div>
                            <p className="text-sm text-gray-500">Vehicle</p>
                            <p className="text-sm font-medium text-gray-900">
                              {driver.vehicle_number}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Sequence */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mb-8">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-lg font-medium">Delivery Sequence</h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  {orders.map((order, index) => {
                    const isReturnToStore = order.is_return_to_store;
                    const customerAddress = isReturnToStore ? order.destination : (order.destination || getCustomerAddress(order.customers));
                    const addressLabel = isReturnToStore ? "Store Return" : getAddressLabel(order.customers);
                    return (
                      <div 
                        key={order.id} 
                        className={`border ${isReturnToStore ? 'border-blue-200 bg-blue-50' : 'border-gray-200'} rounded-lg p-5 hover:border-blue-300 transition-colors`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={`${isReturnToStore ? 'bg-blue-200 text-blue-700' : 'bg-blue-100 text-blue-600'} rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1`}>
                              <span className="text-base font-semibold">
                                {order.delivery_sequence}
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center mb-2">
                                <h3 className="text-lg font-medium text-gray-900">
                                  {isReturnToStore ? 'Return to Store' : (order.customers?.full_name || order.customername)}
                                </h3>
                                <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {getStatusLabel(order.status)}
                                </span>
                                {isReturnToStore && (
                                  <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Final Stop
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-3">
                                {customerAddress && (
                                  <div>
                                    <div className="flex items-center">
                                      <MapPinIcon className="w-4 h-4 text-gray-400 mr-1" />
                                      {addressLabel && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2 py-0.5 rounded">
                                          {addressLabel}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700 mt-1 ml-5">
                                      {customerAddress}
                                    </p>
                                  </div>
                                )}
                                
                                {!isReturnToStore && order.customers?.phone && (
                                  <div className="flex items-center">
                                    <PhoneIcon className="w-4 h-4 text-gray-400 mr-1" />
                                    <p className="text-sm text-gray-700">
                                      {order.customers.phone}
                                    </p>
                                    <a 
                                      href={`tel:${order.customers.phone}`} 
                                      className="ml-2 p-1 bg-green-50 rounded-full text-green-600 hover:bg-green-100"
                                    >
                                      <PhoneIcon className="w-3 h-3" />
                                    </a>
                                  </div>
                                )}
                              </div>
                              
                              {!isReturnToStore && order.delivery_notes && (
                                <div className="mt-3 bg-amber-50 p-3 rounded-md border border-amber-100">
                                  <p className="text-sm text-amber-800">
                                    <span className="font-medium">Note:</span> {order.delivery_notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <Link
                            href={`/dashboard/orders/${order.id}/view`}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            View Order
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              Batch not found
            </h3>
            <p className="mt-1 text-gray-500">
              The batch you're looking for doesn't exist or has been deleted.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/batches"
                className="dashboard-button-primary"
              >
                Back to Batches
              </Link>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 