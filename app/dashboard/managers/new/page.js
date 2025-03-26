"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  UserIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  HomeIcon,
  IdentificationIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/outline";

// Reusable Input Component
function InputField({
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
  ...props
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full pl-10 pr-4 py-3 text-base border-gray-300 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
          sm:text-sm rounded-lg shadow-sm transition-all
          hover:border-gray-400 ${className}`}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
}

export default function NewManagerPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [manager, setManager] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "supervisor",
    is_active: true,
    password: "",
    confirm_password: "",
    address: "",
    emergency_contact: "",
    alternate_phone: "",
    aadhaar_number: "",
    pan_number: "",
    bank_account_number: "",
    base_salary: "",
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords match
      if (manager.password !== manager.confirm_password) {
        throw new Error("Passwords do not match");
      }

      // Create new user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: manager.email,
        password: manager.password,
        options: {
          data: {
            full_name: manager.full_name,
            role: manager.role,
          },
        },
      });

      if (authError) throw authError;

      // Insert into managers table
      const { data: newManager, error: insertError } = await supabase
        .from("managers")
        .insert([
          {
            full_name: manager.full_name,
            email: manager.email,
            phone: manager.phone,
            role: manager.role,
            is_active: manager.is_active,
            auth_id: authData.user.id,
            address: manager.address,
            emergency_contact: manager.emergency_contact,
            alternate_phone: manager.alternate_phone,
            aadhaar_number: manager.aadhaar_number,
            pan_number: manager.pan_number,
            bank_account_number: manager.bank_account_number,
            base_salary: manager.base_salary ? parseFloat(manager.base_salary) : null,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Send notification about new manager creation
      await supabase.from("notifications").insert([
        {
          title: "New Manager Added",
          message: `${manager.full_name} has been added as a ${manager.role}`,
          type: "manager_created",
          severity: "info",
          created_at: new Date().toISOString(),
        },
      ]);

      router.push("/dashboard/managers");
    } catch (error) {
      console.error("Error creating manager:", error);
      alert(
        error.message === "duplicate key value violates unique constraint"
          ? "A manager with this email already exists"
          : "Error creating manager. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout
      title="Add New Manager"
      subtitle="Create a new manager account"
      actions={
        <button
          onClick={() => router.push("/dashboard/managers")}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Managers
        </button>
      }
    >
      <div className="">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
            {/* Basic Information */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <UserGroupIcon className="w-6 h-6 text-blue-500" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <InputField
                    icon={UserIcon}
                    value={manager.full_name}
                    onChange={(e) =>
                      setManager({ ...manager, full_name: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <InputField
                    icon={EnvelopeIcon}
                    type="email"
                    value={manager.email}
                    onChange={(e) =>
                      setManager({ ...manager, email: e.target.value })
                    }
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Phone
                  </label>
                  <InputField
                    icon={PhoneIcon}
                    type="tel"
                    value={manager.alternate_phone}
                    onChange={(e) =>
                      setManager({
                        ...manager,
                        alternate_phone: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <InputField
                    icon={HomeIcon}
                    value={manager.address}
                    onChange={(e) =>
                      setManager({ ...manager, address: e.target.value })
                    }
                    placeholder="Enter address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Contact
                  </label>
                  <InputField
                    icon={PhoneIcon}
                    type="tel"
                    value={manager.emergency_contact}
                    onChange={(e) =>
                      setManager({
                        ...manager,
                        emergency_contact: e.target.value,
                      })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhaar Number
                  </label>
                  <InputField
                    icon={IdentificationIcon}
                    type="text"
                    value={manager.aadhaar_number}
                    onChange={(e) =>
                      setManager({ ...manager, aadhaar_number: e.target.value })
                    }
                    maxLength={12}
                    placeholder="1234 5678 9012"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number
                  </label>
                  <InputField
                    icon={IdentificationIcon}
                    type="text"
                    value={manager.pan_number}
                    onChange={(e) =>
                      setManager({ ...manager, pan_number: e.target.value })
                    }
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Account Number
                  </label>
                  <InputField
                    icon={BuildingLibraryIcon}
                    type="text"
                    value={manager.bank_account_number}
                    onChange={(e) =>
                      setManager({
                        ...manager,
                        bank_account_number: e.target.value,
                      })
                    }
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Salary
                  </label>
                  <InputField
                    icon={BanknotesIcon}
                    type="number"
                    value={manager.base_salary}
                    onChange={(e) =>
                      setManager({ ...manager, base_salary: e.target.value })
                    }
                    step="0.01"
                    placeholder="50000.00"
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <LockClosedIcon className="w-6 h-6 text-yellow-500" />
                Security
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <InputField
                    icon={LockClosedIcon}
                    type="password"
                    value={manager.password}
                    onChange={(e) =>
                      setManager({ ...manager, password: e.target.value })
                    }
                    placeholder="Enter password"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <InputField
                    icon={LockClosedIcon}
                    type="password"
                    value={manager.confirm_password}
                    onChange={(e) =>
                      setManager({
                        ...manager,
                        confirm_password: e.target.value,
                      })
                    }
                    placeholder="Confirm password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldCheckIcon className="w-6 h-6 text-green-500" />
                Additional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <InputField
                    icon={PhoneIcon}
                    type="tel"
                    value={manager.phone}
                    onChange={(e) =>
                      setManager({ ...manager, phone: e.target.value })
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheckIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      value={manager.role}
                      onChange={(e) =>
                        setManager({ ...manager, role: e.target.value })
                      }
                      className="block w-full pl-10 pr-10 py-3 text-base border-gray-300 
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                        sm:text-sm rounded-lg shadow-sm transition-all
                        hover:border-gray-400 appearance-none cursor-pointer"
                    >
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={manager.is_active}
                    onChange={(e) =>
                      setManager({ ...manager, is_active: e.target.checked })
                    }
                    className="rounded border-gray-300 text-blue-600 
                      focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Active Account
                  </span>
                </label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="px-8 py-6 bg-gray-50 flex justify-end gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/managers")}
                className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center px-6 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Create Manager
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
