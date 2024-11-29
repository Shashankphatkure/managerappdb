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
        .from("users")
        .select("*")
        .eq("id", id)
        .single();

      if (customerError) throw customerError;
      setCustomer(customerData);

      // Fetch orders with store details, reviews, and order items
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          `
          *,
          store:stores(name, address, phone),
          reviews:reviews(store_rating, delivery_rating, comment),
          order_items(
            quantity,
            price_at_time,
            special_instructions,
            menu_item:menu_items(name, description)
          ),
          delivery_assignments(
            status,
            pickup_time,
            delivery_time,
            delivery_personnel:delivery_personnel(full_name, phone)
          )
        `
        )
        .eq("user_id", id)
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
                    <h3 className="text-lg font-semibold">
                      Order #{order.id.slice(0, 8)}
                    </h3>
                    <p className="text-gray-600">{order.store.name}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      order.status === "delivered"
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
                        <p className="text-sm text-gray-600">
                          Delivery Address
                        </p>
                        <p>{order.delivery_address}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Order Notes</p>
                        <p>{order.delivery_notes || "No notes"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Payment Method</p>
                        <p className="capitalize">{order.payment_method}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Delivery Information</h4>
                    <div className="space-y-2">
                      {order.delivery_assignments[0] && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600">Driver</p>
                            <p>
                              {order.delivery_assignments[0].delivery_personnel
                                ?.full_name || "Not assigned"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Driver Phone
                            </p>
                            <p>
                              {order.delivery_assignments[0].delivery_personnel
                                ?.phone || "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Delivery Status
                            </p>
                            <p className="capitalize">
                              {order.delivery_assignments[0].status}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Order Items</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-start"
                      >
                        <div>
                          <p className="font-medium">{item.menu_item.name}</p>
                          <p className="text-sm text-gray-600">
                            {item.special_instructions ||
                              "No special instructions"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p>
                            ${item.price_at_time} × {item.quantity}
                          </p>
                          <p className="font-medium">
                            ${(item.price_at_time * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-medium">
                        <p>Total Amount</p>
                        <p>${order.total_amount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {order.reviews && order.reviews[0] && (
                  <div className="border-t mt-4 pt-4">
                    <h4 className="font-medium mb-2">Customer Review</h4>
                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <p className="text-sm text-gray-600">Store Rating</p>
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1">
                            {order.reviews[0].store_rating}/5
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Delivery Rating</p>
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                          <span className="ml-1">
                            {order.reviews[0].delivery_rating}/5
                          </span>
                        </div>
                      </div>
                    </div>
                    {order.reviews[0].comment && (
                      <p className="text-gray-700 mt-2">
                        {order.reviews[0].comment}
                      </p>
                    )}
                  </div>
                )}
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
