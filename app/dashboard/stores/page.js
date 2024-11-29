"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

export default function StoresPage() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStores();
  }, []);

  async function fetchStores() {
    try {
      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("name");

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error("Error fetching stores:", error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStoreStatus(storeId, currentStatus) {
    try {
      const { error } = await supabase
        .from("stores")
        .update({ is_active: !currentStatus })
        .eq("id", storeId);

      if (error) throw error;
      fetchStores();
    } catch (error) {
      console.error("Error updating store status:", error);
      alert("Error updating store status");
    }
  }

  return (
    <DashboardLayout
      title="Stores"
      actions={
        <Link
          href="/dashboard/stores/new"
          className="dashboard-button-primary flex items-center gap-2"
        >
          <BuildingStorefrontIcon className="w-5 h-5" />
          Add New Store
        </Link>
      }
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {loading
            ? [...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-white rounded-xl h-48"
                />
              ))
            : stores.map((store) => (
                <div key={store.id} className="dashboard-card group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-[#323130]">
                        {store.name}
                      </h3>
                      {store.description && (
                        <p className="text-sm text-[#605e5c] mt-1">
                          {store.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        store.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {store.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-[#605e5c]">
                    <p>{store.address}</p>
                    <p>{store.phone}</p>
                    {store.opening_time && store.closing_time && (
                      <p>
                        Hours: {store.opening_time} - {store.closing_time}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#edebe9] flex justify-end gap-2">
                    <Link
                      href={`/dashboard/stores/${store.id}/edit`}
                      className="text-[#0078d4] hover:text-[#106ebe] flex items-center gap-1"
                    >
                      <PencilIcon className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() =>
                        toggleStoreStatus(store.id, store.is_active)
                      }
                      className={`flex items-center gap-1 ${
                        store.is_active
                          ? "text-red-600 hover:text-red-800"
                          : "text-green-600 hover:text-green-800"
                      }`}
                    >
                      {store.is_active ? (
                        <>
                          <XCircleIcon className="w-4 h-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
        </div>

        {stores.length === 0 && !loading && (
          <div className="text-center py-12">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-[#605e5c]" />
            <h3 className="mt-2 text-sm font-medium text-[#323130]">
              No stores
            </h3>
            <p className="mt-1 text-sm text-[#605e5c]">
              Get started by creating a new store.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
