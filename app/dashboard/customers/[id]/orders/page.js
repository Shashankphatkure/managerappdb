"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../../components/DashboardLayout";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { use } from "react";

export default function CustomerOrdersPage({ params }) {
  const router = useRouter();
  const id = use(params).id;
  const [orders, setOrders] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCustomerAndOrders();
  }, [id]);

  async function fetchCustomerAndOrders() {
    try {
      // Fetch customer details
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("id", id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch orders with updated schema
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          *,
          delivery_personnel:driverid(
            id,
            full_name,
            phone
          )
        `
        )
        .eq("customerid", id)
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;
      setOrders(orderData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Customer Orders">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout title="Customer Not Found">
        <div className="p-6 text-center">
          <p className="text-gray-600">Customer not found</p>
          <button
            onClick={() => router.push("/dashboard/customers")}
            className="mt-4 dashboard-button-secondary"
          >
            Back to Customers
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`Orders - ${customer.full_name}`}
      actions={
        <button
          onClick={() => router.push("/dashboard/customers")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Customers
        </button>
      }
    >
      <div className="p-6">
        <div className="mb-6 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-2">Customer Information</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-medium">{customer.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{customer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{customer.phone || "N/A"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.id}</h3>
                    <p className="text-gray-600">{order.customername}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : order.status === "cancelled"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Order Details</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Start Location</p>
                        <p>{order.start}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Destination</p>
                        <p>{order.destination}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Distance</p>
                        <p>{order.distance}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Status</p>
                        <p className="capitalize">{order.payment_status}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Driver Information</h4>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-600">Driver Name</p>
                        <p>{order.drivername || "Not assigned"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Driver Email</p>
                        <p>{order.driveremail || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Completion Time</p>
                        <p>{order.completiontime || "Not completed"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-medium">
                    <p>Total Amount</p>
                    <p>${order.total_amount?.toFixed(2) || "0.00"}</p>
                  </div>
                  {order.remark && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Remarks</p>
                      <p>{order.remark}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No orders found for this customer</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
