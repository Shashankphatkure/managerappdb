"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../../components/DashboardLayout";
import { use } from "react";
import { MapPinIcon, PencilIcon } from "@heroicons/react/24/outline";

export default function CustomerDetailPage({ params }) {
  const router = useRouter();
  const id = use(params).id; // Using React.use() to unwrap params
  const supabase = createClientComponentClient();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  async function fetchCustomerDetails() {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select(
          `
          *,
          orders:orders(*)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      setCustomer(data);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      alert("Error fetching customer details. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout title="Customer Details">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#f3f2f1] rounded w-1/4" />
            <div className="h-32 bg-[#f3f2f1] rounded" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout title="Customer Not Found">
        <div className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900">
              Customer not found
            </h2>
            <p className="mt-2 text-gray-600">
              The customer you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/dashboard/customers"
              className="mt-4 dashboard-button-secondary"
            >
              Back to Customers
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Function to handle displaying addresses in the UI
  const getAddressesToDisplay = () => {
    // If customer has the new addresses array format
    if (customer.addresses && Array.isArray(customer.addresses)) {
      return customer.addresses;
    }
    
    // If customer has the old format, convert it
    const addresses = [];
    if (customer.homeaddress) {
      addresses.push({ label: "Home", address: customer.homeaddress });
    }
    if (customer.workaddress) {
      addresses.push({ label: "Work", address: customer.workaddress });
    }
    
    // Return either the converted addresses or an empty array if none exist
    return addresses.length > 0 ? addresses : [];
  };

  const addresses = getAddressesToDisplay();

  return (
    <DashboardLayout 
      title={`Customer: ${customer.full_name}`}
      actions={
        <Link
          href={`/dashboard/customers/new?id=${customer.id}`}
          className="dashboard-button-primary flex items-center gap-2"
        >
          <PencilIcon className="w-5 h-5" />
          Edit Customer
        </Link>
      }
    >
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Full Name</label>
                  <p className="text-gray-900">{customer.full_name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="text-gray-900">{customer.email || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="text-gray-900">{customer.phone || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">City</label>
                  <p className="text-gray-900">{customer.city || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="text-gray-900 capitalize">
                    {customer.status || "N/A"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Customer Since
                  </label>
                  <p className="text-gray-900">
                    {customer.created_at
                      ? new Date(customer.created_at).toLocaleDateString()
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">
                Additional Information
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">
                    Subscription Status
                  </label>
                  <p className="text-gray-900">
                    {customer.subscriptionstart
                      ? `Active (${
                          customer.subscriptiondays
                        } days from ${new Date(
                          customer.subscriptionstart
                        ).toLocaleDateString()})`
                      : "No active subscription"}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Order Notes</label>
                  <p className="text-gray-900">{customer.ordernote || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Addresses</h3>
            {addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((addressItem, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center mb-2">
                      <MapPinIcon className="h-5 w-5 text-[#0078d4] mr-2" />
                      <span className="font-medium text-gray-700">
                        {addressItem.label || `Address #${index + 1}`}
                      </span>
                    </div>
                    <p className="text-gray-600 whitespace-pre-line">
                      {addressItem.address || "No address details provided"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No addresses found for this customer.</p>
            )}
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Order History</h3>
            {customer.orders && customer.orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customer.orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4">{order.id}</td>
                        <td className="px-6 py-4">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">${order.total_amount}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              order.status === "delivered"
                                ? "bg-green-100 text-green-800"
                                : order.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">
                No orders found for this customer.
              </p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
