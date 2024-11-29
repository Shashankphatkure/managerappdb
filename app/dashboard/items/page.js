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
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStores();
    fetchItems();
  }, [selectedStore]);

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
          className="dashboard-button-primary flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Item
        </Link>
      }
    >
      <div className="p-6">
        {/* Filters */}
        <div className="mb-6 bg-white rounded-xl shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-[#605e5c]" />
              </div>
              <input
                type="text"
                placeholder="Search items..."
                className="dashboard-input pl-10 w-full"
              />
            </div>
            <div className="relative w-full md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingStorefrontIcon className="h-5 w-5 text-[#605e5c]" />
              </div>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="dashboard-input pl-10 w-full"
              >
                <option value="">All Stores</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-[#f3f2f1] rounded h-16"
                />
              ))}
            </div>
          ) : (
            <table className="min-w-full">
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
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-10 w-10 rounded-full object-cover mr-3"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-sm text-gray-500">
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
                      <div className="flex space-x-3">
                        <Link
                          href={`/dashboard/items/${item.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() =>
                            toggleItemAvailability(item.id, item.is_available)
                          }
                          className={`${
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
            <div className="text-center py-12">
              <ShoppingBagIcon className="mx-auto h-12 w-12 text-[#605e5c]" />
              <h3 className="mt-2 text-sm font-medium text-[#323130]">
                No menu items found
              </h3>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
