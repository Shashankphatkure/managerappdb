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
  MapIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
  });
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCustomers();
  }, [filters]);

  async function fetchCustomers() {
    try {
      let query = supabase.from("customers").select(`
          *,
          orders:orders(count)
        `);

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
        );
      }

      // Default sorting by created_at
      query = query.order("created_at", { ascending: false });

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
    <DashboardLayout
      title="Customer Management"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/customers/map"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <MapIcon className="w-5 h-5" />
            View Map
          </Link>
          <Link
            href="/dashboard/customers/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Customer
          </Link>
        </div>
      }
    >
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
          </div>
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
                    <td className="px-6 py-4">{customer.orders[0]?.count || 0}</td>
                    <td className="px-6 py-4">
                      <div className="space-x-2">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/customers/new?id=${customer.id}`}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          Edit
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
