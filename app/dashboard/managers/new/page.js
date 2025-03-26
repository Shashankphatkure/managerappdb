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

// Reusable Input Component with validation
function InputField({
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  className,
  error,
  ...props
}) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className={`h-5 w-5 ${error ? "text-red-400" : "text-gray-400"}`} />
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        className={`block w-full pl-10 pr-4 py-3 text-base
          focus:outline-none focus:ring-2 focus:border-blue-500 
          sm:text-sm rounded-lg shadow-sm transition-all
          hover:border-gray-400 ${
            error 
            ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500" 
            : "border-gray-300 focus:ring-blue-500"
          } ${className}`}
        placeholder={placeholder}
        aria-invalid={error ? "true" : "false"}
        {...props}
      />
      {error && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500" aria-hidden="true" />
        </div>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function NewManagerPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
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

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    
    // Basic validations
    if (!manager.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (manager.full_name.length < 3) {
      newErrors.full_name = "Name must be at least 3 characters";
    }
    
    if (!manager.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(manager.email)) {
      newErrors.email = "Invalid email format";
    }
    
    if (manager.phone && !/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/.test(manager.phone)) {
      newErrors.phone = "Invalid phone number format";
    }
    
    // Password validations
    if (!manager.password) {
      newErrors.password = "Password is required";
    } else if (manager.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    } else if (!/\d/.test(manager.password) || !/[a-zA-Z]/.test(manager.password)) {
      newErrors.password = "Password must contain both letters and numbers";
    }
    
    if (manager.password !== manager.confirm_password) {
      newErrors.confirm_password = "Passwords do not match";
    }
    
    // Document validations
    if (manager.aadhaar_number && manager.aadhaar_number.length !== 12) {
      newErrors.aadhaar_number = "Aadhaar must be 12 digits";
    } else if (manager.aadhaar_number && !/^\d+$/.test(manager.aadhaar_number)) {
      newErrors.aadhaar_number = "Aadhaar must contain only numbers";
    }
    
    if (manager.pan_number && manager.pan_number.length !== 10) {
      newErrors.pan_number = "PAN must be 10 characters";
    } else if (manager.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(manager.pan_number)) {
      newErrors.pan_number = "Invalid PAN format (e.g., ABCDE1234F)";
    }
    
    // Salary validation
    if (manager.base_salary && (isNaN(manager.base_salary) || parseFloat(manager.base_salary) < 0)) {
      newErrors.base_salary = "Salary must be a positive number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change with immediate validation for certain fields
  const handleInputChange = (field, value) => {
    const updatedManager = { ...manager, [field]: value };
    setManager(updatedManager);
    
    // Clear specific error when field is modified
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
    
    // Validate certain fields on change
    if (field === 'confirm_password' && updatedManager.password !== value) {
      setErrors({ ...errors, confirm_password: "Passwords do not match" });
    } else if (field === 'confirm_password') {
      setErrors({ ...errors, confirm_password: undefined });
    }
    
    if (field === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
      setErrors({ ...errors, email: "Invalid email format" });
    } else if (field === 'email') {
      setErrors({ ...errors, email: undefined });
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateForm()) {
      // Scroll to the first error
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);

    try {
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

      if (authError) {
        if (authError.message.includes("email")) {
          setErrors({ ...errors, email: "This email is already registered" });
          throw new Error("Email already in use");
        }
        throw authError;
      }

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

      if (insertError) {
        if (insertError.message.includes("duplicate key") || insertError.message.includes("unique constraint")) {
          setErrors({ ...errors, email: "This email is already registered" });
          throw new Error("Manager with this email already exists");
        }
        throw insertError;
      }

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
      
      // If no specific field error was set, show a general alert
      if (Object.keys(errors).length === 0) {
        alert(
          error.message === "Email already in use" || error.message === "Manager with this email already exists"
            ? "A manager with this email already exists"
            : "Error creating manager. Please try again."
        );
      }
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
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <InputField
                    icon={UserIcon}
                    value={manager.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="John Doe"
                    required
                    error={errors.full_name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <InputField
                    icon={EnvelopeIcon}
                    type="email"
                    value={manager.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="john@example.com"
                    required
                    error={errors.email}
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
                    onChange={(e) => handleInputChange('alternate_phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    error={errors.alternate_phone}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <InputField
                    icon={HomeIcon}
                    value={manager.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter address"
                    error={errors.address}
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
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    error={errors.emergency_contact}
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
                    onChange={(e) => handleInputChange('aadhaar_number', e.target.value)}
                    maxLength={12}
                    placeholder="1234 5678 9012"
                    error={errors.aadhaar_number}
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
                    onChange={(e) => handleInputChange('pan_number', e.target.value)}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    error={errors.pan_number}
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
                    onChange={(e) => handleInputChange('bank_account_number', e.target.value)}
                    placeholder="1234567890"
                    error={errors.bank_account_number}
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
                    onChange={(e) => handleInputChange('base_salary', e.target.value)}
                    step="0.01"
                    placeholder="50000.00"
                    error={errors.base_salary}
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
                    Password <span className="text-red-500">*</span>
                  </label>
                  <InputField
                    icon={LockClosedIcon}
                    type="password"
                    value={manager.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    required
                    minLength={6}
                    error={errors.password}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <InputField
                    icon={LockClosedIcon}
                    type="password"
                    value={manager.confirm_password}
                    onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                    placeholder="Confirm password"
                    required
                    minLength={6}
                    error={errors.confirm_password}
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
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    error={errors.phone}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className={`relative ${errors.role ? 'border-red-300 rounded-lg' : ''}`}>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ShieldCheckIcon className={`h-5 w-5 ${errors.role ? 'text-red-400' : 'text-gray-400'}`} />
                    </div>
                    <select
                      value={manager.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className={`block w-full pl-10 pr-10 py-3 text-base 
                        focus:outline-none focus:ring-2 focus:border-blue-500 
                        sm:text-sm rounded-lg shadow-sm transition-all
                        hover:border-gray-400 appearance-none cursor-pointer
                        ${errors.role 
                          ? 'border-red-300 text-red-900 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-blue-500'}`}
                    >
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role}</p>}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={manager.is_active}
                    onChange={(e) => handleInputChange('is_active', e.target.checked)}
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
