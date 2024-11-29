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
} from "@heroicons/react/24/outline";

export default function ViewOrderPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const supabase = createClientComponentClient();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

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
          users (full_name, phone),
          delivery_personnel (full_name, phone, vehicle_number, vehicle_type)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error("Error fetching order:", error);
      alert("Error fetching order details");
    } finally {
      setLoading(false);
    }
  }

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
              <span className={`status-badge ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
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
                ${parseFloat(order.total_amount || 0).toFixed(2)}
              </p>
            </div>
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
            <span>{order.users?.phone}</span>
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
            <span>{order.delivery_personnel?.phone}</span>
          </div>
          {order.delivery_personnel?.vehicle_type && (
            <div className="flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-gray-400" />
              <span>
                {order.delivery_personnel.vehicle_type} -{" "}
                {order.delivery_personnel.vehicle_number}
              </span>
            </div>
          )}
          {order.completiontime && (
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-gray-400" />
              <span>Completed at: {order.completiontime}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-gray-500">No driver assigned yet</p>
      ),
    },
  ];

  return (
    <DashboardLayout
      title={`Order #${id}`}
      actions={
        <div className="space-x-2">
          {order.status === "pending" && !order.driverid && (
            <Link
              href={`/dashboard/orders/${id}/assign`}
              className="dashboard-button-primary"
            >
              Assign Driver
            </Link>
          )}
          {order.status === "pending" && order.driverid && (
            <Link
              href={`/dashboard/orders/${id}/transfer`}
              className="dashboard-button-secondary"
            >
              Transfer Order
            </Link>
          )}
          <button
            onClick={() => router.push("/dashboard/orders")}
            className="dashboard-button-secondary flex items-center gap-2"
          >
            <ArrowLeftIcon className="w-5 h-5" />
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
    </DashboardLayout>
  );
}
