"use client";
import { useState, useEffect, use } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import Image from "next/image";
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
  EyeIcon,
  EyeSlashIcon,
  PhotoIcon,
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
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this driver? This action cannot be undone.")) {
      return;
    }
    
    setDeleting(true);
    
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", driverId);
      
      if (error) throw error;
      
      router.push("/dashboard/drivers");
    } catch (error) {
      console.error("Error deleting driver:", error);
      alert("Failed to delete driver. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleResetPassword() {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    
    if (!newPassword) {
      setPasswordError("Password cannot be empty");
      return;
    }
    
    setResettingPassword(true);
    
    try {
      // Get the user's email
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email")
        .eq("id", driverId)
        .single();
        
      if (userError) {
        throw new Error(`Failed to get user: ${userError.message}`);
      }
      
      if (userData?.email) {
        // Use the standard update password API
        const { error: resetError } = await supabase.auth.updateUser({
          password: newPassword
        });
          
        if (resetError) {
          throw new Error(`Password reset failed: ${resetError.message}`);
        }
        
        // Clear the password fields after successful reset
        setNewPassword("");
        setConfirmPassword("");
        alert("Password has been reset successfully");
      }
    } catch (error) {
      console.error("Password Reset Error:", error);
      setPasswordError(error.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      // Handle photo upload first if there's a file
      if (photoFile) {
        setUploadingPhoto(true);
        const photoPath = `drivers/${Date.now()}_${photoFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('drivers-photos')
          .upload(photoPath, photoFile);
          
        if (uploadError) {
          throw new Error(`Photo upload failed: ${uploadError.message}`);
        }
        
        // Get the public URL for the uploaded photo
        const { data: { publicUrl } } = supabase.storage
          .from('drivers-photos')
          .getPublicUrl(photoPath);
          
        // Update driver object with the photo URL
        setDriver({ ...driver, photo: publicUrl });
        driver.photo = publicUrl; // Ensure the latest value is used in the save operation
        setUploadingPhoto(false);
      }

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

  // Handler for photo file changes
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

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
                {/* Driver Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Driver Photo
                  </label>
                  <div className="flex items-start space-x-4">
                    <div className="w-32 h-32 border-2 border-gray-300 border-dashed rounded-lg flex justify-center items-center overflow-hidden">
                      {photoPreview || driver.photo ? (
                        <Image 
                          src={photoPreview || driver.photo} 
                          alt="Driver photo" 
                          width={120}
                          height={120}
                          objectFit="cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PhotoIcon className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col space-y-2">
                      <label className="dashboard-button-secondary inline-flex items-center px-4 py-2 cursor-pointer">
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handlePhotoChange}
                          disabled={uploadingPhoto}
                        />
                        <span className="flex items-center">
                          <PhotoIcon className="h-5 w-5 mr-2" />
                          {uploadingPhoto ? "Uploading..." : "Upload Photo"}
                        </span>
                      </label>
                      <p className="text-xs text-gray-500">
                        Upload a clear photo of the driver. Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {formFields.slice(14).map((field) => (
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
                          type={field.label === "Password" && showPassword ? "text" : field.type}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required={field.required}
                        />
                      )}
                      {field.label === "Password" && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                          ) : (
                            <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Password Section (Only for existing drivers) */}
            {driverId !== "new" && (
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-3">
                  Reset Password
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setPasswordError("");
                        }}
                        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative rounded-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <KeyIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setPasswordError("");
                        }}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                  {passwordError && (
                    <div className="col-span-2">
                      <p className="text-sm text-red-600">{passwordError}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500 mb-4">
                      Enter a new password to reset this driver's password.
                    </p>
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resettingPassword}
                      className="inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <KeyIcon className="w-5 h-5 mr-2" />
                      {resettingPassword ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
            <div className="flex justify-end gap-4 pt-6">
              {driverId !== "new" && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  {deleting ? "Deleting..." : "Delete Driver"}
                </button>
              )}
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
