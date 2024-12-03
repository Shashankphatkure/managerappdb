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
} from "@heroicons/react/24/outline";

export default function ManagersPage() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);

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

  const handleToggleActive = async (managerId, currentStatus) => {
    try {
      const { error } = await supabase
        .from("managers")
        .update({ is_active: !currentStatus })
        .eq("id", managerId);

      if (error) throw error;

      // Update local state
      setManagers(
        managers.map((manager) =>
          manager.id === managerId
            ? { ...manager, is_active: !currentStatus }
            : manager
        )
      );

      // Create notification
      await supabase.from("notifications").insert([
        {
          title: "Manager Status Updated",
          message: `Manager status has been ${
            !currentStatus ? "activated" : "deactivated"
          }`,
          type: "manager_updated",
          severity: "info",
        },
      ]);
    } catch (error) {
      console.error("Error toggling manager status:", error);
      alert("Error updating manager status");
    }
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: "bg-purple-100 text-purple-800",
      supervisor: "bg-blue-100 text-blue-800",
    };
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      roleConfig[role] || "bg-gray-100 text-gray-800"
    }`;
  };

  const handleEditClick = (manager) => {
    setSelectedManager(manager);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedManager(null);
  };

  const handleSaveChanges = async (updatedManager) => {
    try {
      const { error } = await supabase
        .from("managers")
        .update(updatedManager)
        .eq("id", updatedManager.id);

      if (error) throw error;

      setManagers(
        managers.map((manager) =>
          manager.id === updatedManager.id ? updatedManager : manager
        )
      );

      handleModalClose();
    } catch (error) {
      console.error("Error updating manager:", error);
      alert("Error updating manager");
    }
  };

  const Modal = ({ children, onClose }) => {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <div
            className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>
          <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
            <div className="absolute right-0 top-0 pr-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg font-semibold leading-6 text-gray-900 mb-4">
                  Edit Manager Profile
                </h3>
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {manager.full_name}
                        </h3>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            ID: {manager.id.slice(0, 8)}
                          </span>
                          <span className={getRoleBadge(manager.role)}>
                            {manager.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Toggle Switch */}
                      <div className="flex items-center">
                        <button
                          onClick={() =>
                            handleToggleActive(manager.id, manager.is_active)
                          }
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            manager.is_active ? "bg-blue-600" : "bg-gray-200"
                          }`}
                          role="switch"
                          aria-checked={manager.is_active}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              manager.is_active
                                ? "translate-x-5"
                                : "translate-x-0"
                            }`}
                          />
                        </button>
                        <span className="ml-2 text-sm text-gray-500">
                          {manager.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <Link
                        href="#"
                        onClick={() => handleEditClick(manager)}
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

      {isModalOpen && (
        <Modal onClose={handleModalClose}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSaveChanges(selectedManager);
            }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={selectedManager.email}
                onChange={(e) =>
                  setSelectedManager({
                    ...selectedManager,
                    email: e.target.value,
                  })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={selectedManager.full_name}
                onChange={(e) =>
                  setSelectedManager({
                    ...selectedManager,
                    full_name: e.target.value,
                  })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={selectedManager.phone}
                onChange={(e) =>
                  setSelectedManager({
                    ...selectedManager,
                    phone: e.target.value,
                  })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={selectedManager.role}
                onChange={(e) =>
                  setSelectedManager({
                    ...selectedManager,
                    role: e.target.value,
                  })
                }
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
              >
                <option value="admin">Admin</option>
                <option value="supervisor">Supervisor</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alternate Phone
                </label>
                <input
                  type="text"
                  value={selectedManager.alternate_phone || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      alternate_phone: e.target.value,
                    })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={selectedManager.address || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      address: e.target.value,
                    })
                  }
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={selectedManager.emergency_contact || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      emergency_contact: e.target.value,
                    })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhaar Number
                </label>
                <input
                  type="text"
                  value={selectedManager.aadhaar_number || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      aadhaar_number: e.target.value,
                    })
                  }
                  maxLength={12}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={selectedManager.pan_number || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      pan_number: e.target.value,
                    })
                  }
                  maxLength={10}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  value={selectedManager.bank_account_number || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      bank_account_number: e.target.value,
                    })
                  }
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Salary
                </label>
                <input
                  type="number"
                  value={selectedManager.base_salary || ""}
                  onChange={(e) =>
                    setSelectedManager({
                      ...selectedManager,
                      base_salary: e.target.value,
                    })
                  }
                  step="0.01"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2"
                />
              </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleModalClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
