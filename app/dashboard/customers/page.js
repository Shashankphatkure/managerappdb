"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import CustomerStats from "./components/CustomerStats";
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    orderCount: "all",
    sortBy: "created_at",
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  async function fetchCustomers() {
    try {
      let query = supabase.from("users").select(`
          *,
          orders:orders(count)
        `);

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Apply order count filter
      if (filters.orderCount === "none") {
        query = query.eq("orders.count", 0);
      } else if (filters.orderCount === "active") {
        query = query.gt("orders.count", 0);
      }

      // Apply sorting
      query = query.order(filters.sortBy, { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout title="Customer Management">
      <div className="p-6">
        <div className="mb-6">
          <CustomerStats />
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 items-center">
            <input
              type="text"
              placeholder="Search customers..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="p-2 border rounded"
            />
            <select
              value={filters.orderCount}
              onChange={(e) =>
                setFilters({ ...filters, orderCount: e.target.value })
              }
              className="p-2 border rounded"
            >
              <option value="all">All Customers</option>
              <option value="active">With Orders</option>
              <option value="none">No Orders</option>
            </select>
            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              className="p-2 border rounded"
            >
              <option value="created_at">Join Date</option>
              <option value="full_name">Name</option>
              <option value="email">Email</option>
            </select>
          </div>
          <Link
            href="/dashboard/customers/new"
            className="dashboard-button-primary"
          >
            Add New Customer
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-[#f3f2f1] rounded" />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4">{customer.full_name}</td>
                    <td className="px-6 py-4">{customer.email}</td>
                    <td className="px-6 py-4">{customer.phone || "N/A"}</td>
                    <td className="px-6 py-4">{customer.city || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          customer.status === "active"
                            ? "bg-green-100 text-green-800"
                            : customer.status === "inactive"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {customer.status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {customer.subscriptionstart ? (
                        <span>
                          {new Date(
                            customer.subscriptionstart
                          ).toLocaleDateString()}
                          ({customer.subscriptiondays} days)
                        </span>
                      ) : (
                        "No subscription"
                      )}
                    </td>
                    <td className="px-6 py-4">{customer.orders.length}</td>
                    <td className="px-6 py-4">
                      <div className="space-x-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/customers/${customer.id}/orders`}
                          className="text-green-600 hover:text-green-900"
                        >
                          Orders
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
