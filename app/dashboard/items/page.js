"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import {
  ShoppingBagIcon,
  BuildingStorefrontIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

export default function MenuItemsPage() {
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStores();
    fetchItems();
  }, [selectedStore, searchQuery]);

  async function fetchStores() {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  }

  async function fetchItems() {
    try {
      let query = supabase
        .from("menu_items")
        .select(
          `
          *,
          stores (name),
          categories (name)
        `
        )
        .order("name");

      if (selectedStore) {
        query = query.eq("store_id", selectedStore);
      }

      if (searchQuery) {
        query = query.or(
          `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleItemAvailability(itemId, currentStatus) {
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: !currentStatus })
        .eq("id", itemId);

      if (error) throw error;
      fetchItems();
    } catch (error) {
      console.error("Error updating item status:", error);
      alert("Error updating item status");
    }
  }

  return (
    <DashboardLayout
      title="Menu Items"
      actions={
        <Link
          href="/dashboard/items/new"
          className="dashboard-button-primary flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Item
        </Link>
      }
    >
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Search Input */}
            <div className="relative flex-1">
              <label
                htmlFor="search"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Search Items
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or description..."
                  className="block w-full pl-11 pr-4 py-3 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Store Dropdown */}
            <div className="relative md:w-80">
              <label
                htmlFor="store"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Filter by Store
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <BuildingStorefrontIcon className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="store"
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  className="block w-full pl-11 pr-10 py-3 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-white"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          {loading ? (
            <div className="space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-gray-100 rounded-lg h-16"
                />
              ))}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="font-medium text-gray-900 text-base">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.stores?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {item.categories?.name || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${parseFloat(item.price).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          item.is_available
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {item.is_available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-4">
                        <Link
                          href={`/dashboard/items/${item.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 font-medium hover:underline transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() =>
                            toggleItemAvailability(item.id, item.is_available)
                          }
                          className={`font-medium transition-colors ${
                            item.is_available
                              ? "text-red-600 hover:text-red-900"
                              : "text-green-600 hover:text-green-900"
                          }`}
                        >
                          {item.is_available
                            ? "Mark Unavailable"
                            : "Mark Available"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {items.length === 0 && !loading && (
            <div className="text-center py-16">
              <ShoppingBagIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No menu items found
              </h3>
              <p className="mt-2 text-gray-500">
                Get started by adding your first menu item.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
