"use client";
import { useState, useEffect, use } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  TruckIcon,
  SwatchIcon,
  IdentificationIcon,
  DocumentTextIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  InformationCircleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";

export default function DriverDetailPage({ params }) {
  const router = useRouter();
  const driverId = use(params).id;
  const supabase = createClientComponentClient();
  const [driver, setDriver] = useState({
    full_name: "",
    email: "",
    phone: "",
    age: "",
    address: "",
    city: "",
    vehicle_number: "",
    vehicle_type: "",
    vehicle_color: "",
    aadhar_no: "",
    pan_card_number: "",
    driving_license: "",
    bank_account_no: "",
    bank_ifsc_code: "",
    about_driver: "",
    home_phone_number: "",
    photo: "",
    is_active: true,
    password: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (driverId !== "new") {
      fetchDriver();
    } else {
      setLoading(false);
    }
  }, [driverId]);

  async function fetchDriver() {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", driverId)
        .single();

      if (error) throw error;
      if (data) setDriver(data);
    } catch (error) {
      console.error("Error fetching driver:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      if (driverId === "new") {
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email: driver.email,
            password: driver.password,
            options: {
              data: {
                full_name: driver.full_name,
              },
            },
          }
        );

        if (authError) {
          console.error("Auth Error:", authError);
          throw new Error(`Authentication failed: ${authError.message}`);
        }

        if (!authData?.user?.id) {
          throw new Error("No user ID returned from authentication");
        }

        const { password, ...driverWithoutPassword } = driver;

        const { data: userData, error: dbError } = await supabase
          .from("users")
          .insert([
            {
              ...driverWithoutPassword,
              auth_id: authData.user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select();

        if (dbError) {
          console.error("Database Error:", dbError);
          throw new Error(`Database insert failed: ${dbError.message}`);
        }
      } else {
        const { error } = await supabase
          .from("users")
          .update(driver)
          .eq("id", driverId);

        if (error) {
          console.error("Update Error:", error);
          throw new Error(`Update failed: ${error.message}`);
        }
      }

      router.push("/dashboard/drivers");
    } catch (error) {
      console.error("Detailed Error:", error);
      alert(error.message || "Error saving driver. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const formFields = [
    {
      label: "Full Name",
      type: "text",
      value: driver.full_name,
      onChange: (value) => setDriver({ ...driver, full_name: value }),
      icon: UserIcon,
      required: true,
    },
    {
      label: "Email",
      type: "email",
      value: driver.email,
      onChange: (value) => setDriver({ ...driver, email: value }),
      icon: EnvelopeIcon,
      required: true,
    },
    {
      label: "Phone",
      type: "tel",
      value: driver.phone,
      onChange: (value) => setDriver({ ...driver, phone: value }),
      icon: PhoneIcon,
      required: true,
    },
    {
      label: "Age",
      type: "text",
      value: driver.age,
      onChange: (value) => setDriver({ ...driver, age: value }),
      icon: UserIcon,
    },
    {
      label: "Address",
      type: "text",
      value: driver.address,
      onChange: (value) => setDriver({ ...driver, address: value }),
      icon: MapPinIcon,
    },
    {
      label: "City",
      type: "text",
      value: driver.city,
      onChange: (value) => setDriver({ ...driver, city: value }),
      icon: BuildingOfficeIcon,
    },
    {
      label: "Vehicle Number",
      type: "text",
      value: driver.vehicle_number,
      onChange: (value) => setDriver({ ...driver, vehicle_number: value }),
      icon: TruckIcon,
    },
    {
      label: "Vehicle Type",
      type: "text",
      value: driver.vehicle_type,
      onChange: (value) => setDriver({ ...driver, vehicle_type: value }),
      icon: TruckIcon,
    },
    {
      label: "Vehicle Color",
      type: "text",
      value: driver.vehicle_color,
      onChange: (value) => setDriver({ ...driver, vehicle_color: value }),
      icon: SwatchIcon,
    },
    {
      label: "Aadhar Number",
      type: "text",
      value: driver.aadhar_no,
      onChange: (value) => setDriver({ ...driver, aadhar_no: value }),
      icon: IdentificationIcon,
    },
    {
      label: "PAN Card Number",
      type: "text",
      value: driver.pan_card_number,
      onChange: (value) => setDriver({ ...driver, pan_card_number: value }),
      icon: DocumentTextIcon,
    },
    {
      label: "Driving License",
      type: "text",
      value: driver.driving_license,
      onChange: (value) => setDriver({ ...driver, driving_license: value }),
      icon: IdentificationIcon,
    },
    {
      label: "Bank Account Number",
      type: "text",
      value: driver.bank_account_no,
      onChange: (value) => setDriver({ ...driver, bank_account_no: value }),
      icon: BanknotesIcon,
    },
    {
      label: "Bank IFSC Code",
      type: "text",
      value: driver.bank_ifsc_code,
      onChange: (value) => setDriver({ ...driver, bank_ifsc_code: value }),
      icon: BuildingLibraryIcon,
    },
    {
      label: "About Driver",
      type: "textarea",
      value: driver.about_driver,
      onChange: (value) => setDriver({ ...driver, about_driver: value }),
      icon: InformationCircleIcon,
    },
    {
      label: "Home Phone Number",
      type: "tel",
      value: driver.home_phone_number,
      onChange: (value) => setDriver({ ...driver, home_phone_number: value }),
      icon: PhoneIcon,
    },
  ].concat(
    driverId === "new"
      ? [
          {
            label: "Password",
            type: "password",
            value: driver.password,
            onChange: (value) => setDriver({ ...driver, password: value }),
            icon: KeyIcon,
            required: true,
          },
        ]
      : []
  );

  return (
    <DashboardLayout
      title={driverId === "new" ? "Add New Driver" : "Edit Driver"}
      actions={
        <button
          onClick={() => router.push("/dashboard/drivers")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Drivers
        </button>
      }
    >
      <div className="max-w-4xl mx-auto p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[#f3f2f1] rounded h-16"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.slice(0, 6).map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <field.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      {field.type === "textarea" ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          rows={3}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required={field.required}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicle Information Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                Vehicle Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.slice(6, 9).map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <field.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                Documents
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.slice(9, 12).map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <field.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                Bank Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formFields.slice(12, 14).map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <field.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                Additional Information
              </h2>
              <div className="grid grid-cols-1 gap-6">
                {formFields.slice(14).map((field) => (
                  <div key={field.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <field.icon className="h-5 w-5 text-gray-400" />
                      </div>
                      {field.type === "textarea" ? (
                        <textarea
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          rows={3}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={driver.is_active}
                  onChange={(e) =>
                    setDriver({ ...driver, is_active: e.target.checked })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Active Status
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckCircleIcon className="w-5 h-5 mr-2" />
                {saving ? "Saving..." : "Save Driver"}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
