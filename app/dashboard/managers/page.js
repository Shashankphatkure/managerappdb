"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Link from "next/link";
import DashboardLayout from "../components/DashboardLayout";
import {
  UserGroupIcon,
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchManagers();
  }, []);

  async function fetchManagers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("managers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error("Error fetching managers:", error);
    } finally {
      setLoading(false);
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: "bg-purple-100 text-purple-800",
      supervisor: "bg-blue-100 text-blue-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      roleConfig[role] || "bg-gray-100 text-gray-800"
    }`;
  };

  return (
    <DashboardLayout
      title="Managers"
      subtitle={`Total Managers: ${managers.length}`}
      actions={
        <Link
          href="/dashboard/managers/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          Add New Manager
        </Link>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-24" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {managers.map((manager) => (
              <div
                key={manager.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center border-2 border-gray-100">
                          <UserGroupIcon className="h-8 w-8 text-blue-500" />
                        </div>
                        <span
                          className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                            manager.is_active ? "bg-green-400" : "bg-gray-300"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {manager.full_name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            ID: {manager.id.slice(0, 8)}
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              manager.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {manager.is_active ? "Active" : "Inactive"}
                          </span>
                          <span className={getRoleBadge(manager.role)}>
                            {manager.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/managers/${manager.id}`}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                      >
                        Edit Profile
                      </Link>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                        Contact Info
                      </h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-600">
                          <PhoneIcon className="w-4 h-4" />
                          <span className="text-sm">{manager.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <EnvelopeIcon className="w-4 h-4" />
                          <span className="text-sm">{manager.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {managers.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <UserGroupIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No managers found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding your first manager.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/managers/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Manager
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
