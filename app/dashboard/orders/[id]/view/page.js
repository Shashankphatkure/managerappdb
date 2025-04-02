"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { use } from "react";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  UserIcon,
  BuildingStorefrontIcon,
  TruckIcon,
  ClockIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

// CSS for the timeline
const timelineStyles = {
  container: "py-2 max-h-[500px] overflow-y-auto pr-2",
  line: "absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200",
  item: "relative flex items-start mb-6",
  iconContainer: "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center z-10",
  content: "ml-4 flex-1",
  title: "text-sm font-medium text-gray-900",
  time: "mt-1 text-xs text-gray-500",
  remark: "mt-1 text-xs text-gray-600 bg-gray-50 p-1.5 rounded",
};

// Get icon color by status
const getStatusIconColor = (status) => {
  const colors = {
    pending: "bg-yellow-500",
    confirmed: "bg-blue-500",
    accepted: "bg-green-500",
    picked_up: "bg-yellow-500",
    on_way: "bg-indigo-500",
    reached: "bg-purple-500",
    delivered: "bg-green-600",
    cancelled: "bg-red-500",
  };
  return colors[status] || "bg-gray-500";
};

export default function ViewOrderPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proofImage, setProofImage] = useState(null);
  const [cancelProofImage, setCancelProofImage] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [managerRemark, setManagerRemark] = useState("");
  
  // Status options for dropdown
  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "accepted", label: "Accepted" },
    { value: "picked_up", label: "Picked Up" },
    { value: "on_way", label: "On The Way" },
    { value: "reached", label: "Reached" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];
  
  // Helper function to format snake_case text to readable text
  const formatRemarkText = (text) => {
    if (!text) return "";
    
    // Replace underscores with spaces and capitalize each word
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Helper function to handle nested path structure
  const getStorageFilePath = (path) => {
    if (!path) return null;
    
    // If path already contains the full path pattern, return it as is
    if (path.includes('cancel-proofs/')) {
      return path;
    }
    
    // If it's just the filename, add the necessary prefix
    return `cancel-proofs/${path}`;
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  async function fetchOrder() {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          customers!orders_customerid_fkey (full_name, phone),
          users!fk_orders_driver (full_name, phone, vehicle_number, vehicle_type)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      
      // Ensure all date fields are properly formatted for the timeline
      if (data) {
        // Format the timestamp fields into Date objects if they exist
        const timestampFields = [
          'created_at', 
          'updated_at', 
          'accepted_time', 
          'pickup_time', 
          'on_way_time', 
          'reached_time', 
          'completiontime', 
          'cancel_time'
        ];
        
        timestampFields.forEach(field => {
          if (data[field] && typeof data[field] === 'string') {
            try {
              // Just ensure it's a valid date string
              new Date(data[field]);
            } catch (e) {
              console.warn(`Invalid date format for ${field}:`, data[field]);
            }
          }
        });
      }
      
      setOrder(data);
      
      // Set the new status to current status for the form
      if (data && data.status) {
        setNewStatus(data.status);
      }

      if (data.photo_proof) {
        const { data: imageUrl, error: imageError } = supabase.storage
          .from("delivery-proofs")
          .getPublicUrl(data.photo_proof);

        if (imageError) throw imageError;
        setProofImage(imageUrl.publicUrl);
      }
      
      if (data.cancel_photo_proof) {
        try {
          const cancelPhotoPath = getStorageFilePath(data.cancel_photo_proof);
          
          const { data: cancelImageUrl, error: cancelImageError } = supabase.storage
            .from("delivery-proofs")
            .getPublicUrl(cancelPhotoPath);

          if (cancelImageError) throw cancelImageError;
          setCancelProofImage(cancelImageUrl.publicUrl);
        } catch (err) {
          console.error("Error processing cancel photo:", err);
        }
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      alert("Error fetching order details");
    } finally {
      setLoading(false);
    }
  }

  // New function to handle status update
  async function updateOrderStatus() {
    setUpdatingStatus(true);
    try {
      // Prepare status update data
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        managerremark: managerRemark,
        updatedbymanager: true, // Set to true when manager updates status
      };
      
      // Set timestamp based on the new status
      switch(newStatus) {
        case 'accepted':
          // Only set accepted_time if not already set
          if (!order.accepted_time) {
            updateData.accepted_time = new Date().toISOString();
          }
          break;
        case 'picked_up':
          // Add pickup_time field if your schema has it
          updateData.pickup_time = new Date().toISOString();
          break;
        case 'on_way':
          // Add on_way_time field if your schema has it
          updateData.on_way_time = new Date().toISOString();
          break;
        case 'reached':
          // Add reached_time field if your schema has it
          updateData.reached_time = new Date().toISOString();
          break;
        case 'delivered':
          // Set completiontime when status changes to delivered
          updateData.completiontime = new Date().toISOString();
          break;
        case 'cancelled':
          // Set cancel_time when status changes to cancelled
          const currentTime = new Date().toISOString();
          updateData.cancel_time = currentTime;
          
          // Also set completiontime to ensure we have a timestamp for cancelled orders
          updateData.completiontime = currentTime;
          
          // If no cancel reason is specified, add a default one
          if (!order.cancel_reason) {
            updateData.cancel_reason = 'cancelled_by_manager';
          }
          break;
      }
      
      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      // Update local order state
      setOrder({
        ...order,
        ...updateData
      });
      
      // Close modal and reset form
      setShowStatusModal(false);
      setManagerRemark("");
      
      // Refresh order data
      fetchOrder();
      
      alert("Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert("Error updating order status");
    } finally {
      setUpdatingStatus(false);
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-purple-100 text-purple-800",
      picked_up: "bg-indigo-100 text-indigo-800",
      on_way: "bg-purple-100 text-purple-800",
      reached: "bg-blue-100 text-blue-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <DashboardLayout title="Order Details">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-white/50 rounded-xl h-48 backdrop-blur-lg"
              />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout title="Order Details">
        <div className="p-6">
          <div className="text-center py-12">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Order not found
            </h3>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const orderSections = [
    {
      title: "Order Information",
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Order ID</p>
              <p className="font-medium">#{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <div className="flex items-center gap-2">
                <span className={`status-badge ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
                <button 
                  onClick={() => setShowStatusModal(true)}
                  className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full"
                  title="Update status"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
              </div>
              {order.updatedbymanager && (
                <p className="text-xs text-gray-500 mt-1">Updated by manager</p>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <span
                className={`status-badge ${getPaymentStatusColor(
                  order.payment_status
                )}`}
              >
                {order.payment_status}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-medium capitalize">{order.payment_method}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium text-green-600">
                ₹{parseFloat(order.total_amount || 0).toFixed(2)}
              </p>
            </div>
          </div>
          {order.managerremark && (
            <div>
              <p className="text-sm text-gray-500">Manager Remarks</p>
              <p className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                {order.managerremark}
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Order Timeline",
      icon: ClockIcon,
      content: (
        <div className={timelineStyles.container}>
          <div className="relative">
            {/* Timeline line */}
            <div className={timelineStyles.line}></div>
            
            {/* Created milestone */}
            <div className={timelineStyles.item}>
              <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('pending')}`}>
                <ClockIcon className="h-4 w-4 text-white" />
              </div>
              <div className={timelineStyles.content}>
                <h3 className={timelineStyles.title}>Order Created</h3>
                <p className={timelineStyles.time}>
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            
            {/* Accepted milestone - if status is accepted or beyond and accepted_time exists */}
            {(order.status === "accepted" ||
              order.status === "picked_up" ||
              order.status === "on_way" ||
              order.status === "reached" ||
              order.status === "delivered") && order.accepted_time && (
              <div className={timelineStyles.item}>
                <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('accepted')}`}>
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
                <div className={timelineStyles.content}>
                  <h3 className={timelineStyles.title}>Accepted by Driver</h3>
                  <p className={timelineStyles.time}>
                    {new Date(order.accepted_time).toLocaleString()}
                  </p>
                  {order.drivername && (
                    <p className="mt-1 text-xs text-blue-600">
                      {order.drivername}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Picked up milestone - if status is picked_up or beyond */}
            {(order.status === "picked_up" ||
              order.status === "on_way" ||
              order.status === "reached" ||
              order.status === "delivered") && order.pickup_time && (
              <div className={timelineStyles.item}>
                <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('picked_up')}`}>
                  <BuildingStorefrontIcon className="h-4 w-4 text-white" />
                </div>
                <div className={timelineStyles.content}>
                  <h3 className={timelineStyles.title}>Picked Up from Store</h3>
                  <p className={timelineStyles.time}>
                    {new Date(order.pickup_time).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {/* On the way milestone - if status is on_way or beyond */}
            {(order.status === "on_way" ||
              order.status === "reached" ||
              order.status === "delivered") && order.on_way_time && (
              <div className={timelineStyles.item}>
                <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('on_way')}`}>
                  <TruckIcon className="h-4 w-4 text-white" />
                </div>
                <div className={timelineStyles.content}>
                  <h3 className={timelineStyles.title}>On The Way</h3>
                  <p className={timelineStyles.time}>
                    {new Date(order.on_way_time).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Reached milestone - if status is reached or beyond */}
            {(order.status === "reached" ||
              order.status === "delivered") && order.reached_time && (
              <div className={timelineStyles.item}>
                <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('reached')}`}>
                  <MapPinIcon className="h-4 w-4 text-white" />
                </div>
                <div className={timelineStyles.content}>
                  <h3 className={timelineStyles.title}>Reached Destination</h3>
                  <p className={timelineStyles.time}>
                    {new Date(order.reached_time).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Delivered milestone - if delivered */}
            {order.status === "delivered" && (
              <div className={timelineStyles.item}>
                <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('delivered')}`}>
                  <CheckCircleIcon className="h-4 w-4 text-white" />
                </div>
                <div className={timelineStyles.content}>
                  <h3 className={timelineStyles.title}>Delivered Successfully</h3>
                  <p className={timelineStyles.time}>
                    {order.completiontime ? new Date(order.completiontime).toLocaleString() : "Unknown time"}
                  </p>
                  {order.remark && (
                    <p className={timelineStyles.remark}>
                      Remark: {formatRemarkText(order.remark)}
                    </p>
                  )}
                </div>
              </div>
            )}
            
            {/* Cancelled milestone - if cancelled */}
            {order.status === "cancelled" && (
              <div className={timelineStyles.item}>
                <div className={`${timelineStyles.iconContainer} ${getStatusIconColor('cancelled')}`}>
                  <XMarkIcon className="h-4 w-4 text-white" />
                </div>
                <div className={timelineStyles.content}>
                  <h3 className={timelineStyles.title}>Order Cancelled</h3>
                  <p className={timelineStyles.time}>
                    {order.cancel_time ? new Date(order.cancel_time).toLocaleString() : 
                     order.completiontime ? new Date(order.completiontime).toLocaleString() : "Unknown time"}
                  </p>
                  {order.cancel_reason && (
                    <p className={timelineStyles.remark + " bg-red-50"}>
                      Reason: {formatRemarkText(order.cancel_reason)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Customer Details",
      icon: UserIcon,
      content: (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{order.customername}</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <span>{order.customers?.phone}</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Delivery Address</p>
            <div className="flex items-start gap-2">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <span className="flex-1">{order.destination}</span>
            </div>
          </div>
          {order.delivery_notes && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Delivery Notes</p>
              <div className="flex items-start gap-2">
                <DocumentTextIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                <span className="flex-1">{order.delivery_notes}</span>
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Pickup Details",
      icon: BuildingStorefrontIcon,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Pickup Location</p>
            <div className="flex items-start gap-2">
              <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <span className="flex-1">{order.start}</span>
            </div>
          </div>
          {order.time && (
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <span>Estimated Time: {order.time}</span>
            </div>
          )}
          {order.distance && (
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-gray-400" />
              <span>Distance: {order.distance}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Driver Details",
      icon: TruckIcon,
      content: order.driverid ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-gray-400" />
            <span className="font-medium">{order.drivername}</span>
          </div>
          <div className="flex items-center gap-2">
            <PhoneIcon className="w-5 h-5 text-gray-400" />
            <span>{order.users?.phone}</span>
          </div>
          {order.users?.vehicle_type && (
            <div className="flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-gray-400" />
              <span>
                {order.users.vehicle_type} - {order.users.vehicle_number}
              </span>
            </div>
          )}
          {order.completiontime && (
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <span>Completed at: {new Date(order.completiontime).toLocaleString()}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No driver assigned yet</p>
      ),
    },
    {
      title: "Delivery Proof",
      icon: DocumentTextIcon,
      content: (
        <div className="space-y-4">
          {proofImage ? (
            <div className="relative h-48 w-full">
              <Image
                src={proofImage}
                alt="Delivery Proof"
                fill
                className="object-contain rounded-lg"
              />
            </div>
          ) : (
            <p className="text-gray-500">No delivery proof uploaded yet</p>
          )}
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">Delivery Remarks</p>
            <p className="text-gray-700">{order.remark ? formatRemarkText(order.remark) : "No remarks added"}</p>
          </div>
        </div>
      ),
    },
    ...(order.status === "cancelled" || cancelProofImage || order.cancel_photo_proof ? [
      {
        title: "Cancellation Details",
        icon: DocumentTextIcon,
        content: (
          <div className="space-y-4">
            {cancelProofImage ? (
              <div>
                <p className="text-sm text-gray-500 mb-2">Cancellation Proof</p>
                <div className="relative h-48 w-full">
                  <Image
                    src={cancelProofImage}
                    alt="Cancellation Proof"
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No cancellation proof uploaded</p>
            )}
            {order.cancel_reason && (
              <div className="mt-4">
                <p className="text-sm text-gray-500 mb-1">Cancellation Reason</p>
                <p className="text-gray-700">{formatRemarkText(order.cancel_reason)}</p>
              </div>
            )}
            <div className="space-y-1 mt-2">
              {order.cancel_time && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <span>Cancelled at: {new Date(order.cancel_time).toLocaleString()}</span>
                </div>
              )}
              {!order.cancel_time && order.completiontime && order.status === "cancelled" && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-gray-400" />
                  <span>Cancelled at: {new Date(order.completiontime).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        ),
      }
    ] : []),
  ];

  return (
    <DashboardLayout
      title={`Order #${id}`}
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PencilSquareIcon className="w-5 h-5 mr-2" />
            Update Status
          </button>
          {order.status === "pending" && !order.driverid && (
            <Link
              href={`/dashboard/orders/${id}/assign`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Assign Driver
            </Link>
          )}
          {order.status === "pending" && order.driverid && (
            <Link
              href={`/dashboard/orders/${id}/transfer`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Transfer Order
            </Link>
          )}
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Orders
          </button>
        </div>
      }
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orderSections.map((section) => (
            <div key={section.title} className="dashboard-card">
              <div className="flex items-center gap-2 mb-4">
                <section.icon className="w-6 h-6 text-[#605e5c]" />
                <h2 className="text-lg font-semibold">{section.title}</h2>
              </div>
              {section.content}
            </div>
          ))}
        </div>
      </div>
      
      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Update Order Status</h3>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="managerRemark" className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks (Optional)
                  </label>
                  <textarea
                    id="managerRemark"
                    rows={3}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Add any notes or comments about this status change"
                    value={managerRemark}
                    onChange={(e) => setManagerRemark(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={updateOrderStatus}
                disabled={updatingStatus}
              >
                {updatingStatus ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
