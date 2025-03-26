"use client";
import { useState, useEffect, use } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardLayout from "../../../components/DashboardLayout";
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  FaceSmileIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";

// Import EmojiPicker dynamically to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function EditStorePage({ params }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const unwrappedParams = use(params);
  const storeId = unwrappedParams.id;
  
  const [store, setStore] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    opening_time: "",
    closing_time: "",
    icon: "🏪",
  });

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const { data, error } = await supabase
          .from("stores")
          .select("*")
          .eq("id", storeId)
          .single();

        if (error) throw error;
        
        if (data) {
          setStore({
            name: data.name || "",
            description: data.description || "",
            address: data.address || "",
            phone: data.phone || "",
            opening_time: data.opening_time || "",
            closing_time: data.closing_time || "",
            icon: data.icon || "🏪",
            is_active: data.is_active,
          });
        }
      } catch (error) {
        console.error("Error fetching store:", error);
        alert("Error loading store data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId, supabase]);

  const onEmojiClick = (emojiObject) => {
    setStore({ ...store, icon: emojiObject.emoji });
    setShowEmojiPicker(false);
  };

  const formFields = [
    {
      label: "Store Icon",
      type: "emoji",
      value: store.icon,
      onChange: (value) => setStore({ ...store, icon: value }),
      icon: FaceSmileIcon,
      required: true,
    },
    {
      label: "Store Name",
      type: "text",
      value: store.name,
      onChange: (value) => setStore({ ...store, name: value }),
      icon: BuildingStorefrontIcon,
      required: true,
    },
    {
      label: "Description",
      type: "textarea",
      value: store.description,
      onChange: (value) => setStore({ ...store, description: value }),
      icon: DocumentTextIcon,
    },
    {
      label: "Address",
      type: "textarea",
      value: store.address,
      onChange: (value) => setStore({ ...store, address: value }),
      icon: MapPinIcon,
      required: true,
    },
    {
      label: "Phone",
      type: "tel",
      value: store.phone,
      onChange: (value) => setStore({ ...store, phone: value }),
      icon: PhoneIcon,
    },
    {
      label: "Opening Time",
      type: "time",
      value: store.opening_time,
      onChange: (value) => setStore({ ...store, opening_time: value }),
      icon: ClockIcon,
    },
    {
      label: "Closing Time",
      type: "time",
      value: store.closing_time,
      onChange: (value) => setStore({ ...store, closing_time: value }),
      icon: ClockIcon,
    },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("stores")
        .update({
          name: store.name,
          description: store.description,
          address: store.address,
          phone: store.phone,
          opening_time: store.opening_time,
          closing_time: store.closing_time,
          icon: store.icon,
        })
        .eq("id", storeId);

      if (error) throw error;
      router.push("/dashboard/stores");
    } catch (error) {
      console.error("Error updating store:", error);
      alert("Error updating store. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout
        title="Edit Store"
        subtitle="Update store information"
      >
        <div className="p-6">
          <div className="animate-pulse bg-white rounded-xl h-96"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Edit Store"
      subtitle="Update store information"
      actions={
        <button
          onClick={() => router.push("/dashboard/stores")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Stores
        </button>
      }
    >
      <div className="">
        <div className="bg-white border border-[#edebe9] rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {formFields.map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-semibold text-[#323130]">
                  {field.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <field.icon className="h-5 w-5 text-[#605e5c]" />
                  </div>
                  
                  {field.type === "emoji" ? (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="block w-full rounded-md border border-[#8a8886] pl-10 py-2 text-sm text-left focus:border-[#0078d4] focus:ring-[#0078d4] flex items-center"
                      >
                        <span className="text-2xl mr-2">{store.icon}</span>
                        <span className="text-sm text-gray-500">Click to change icon</span>
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute z-10 mt-1">
                          <EmojiPicker onEmojiClick={onEmojiClick} />
                        </div>
                      )}
                    </div>
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="block w-full rounded-md border border-[#8a8886] pl-10 py-2 text-sm focus:border-[#0078d4] focus:ring-[#0078d4]"
                      rows={3}
                      required={field.required}
                      placeholder={field.placeholder}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="block w-full rounded-md border border-[#8a8886] pl-10 py-2 text-sm focus:border-[#0078d4] focus:ring-[#0078d4]"
                      required={field.required}
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              </div>
            ))}

            <div className="pt-6 border-t border-[#edebe9]">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/stores")}
                  className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-[#8a8886] rounded-md hover:bg-[#f3f2f1] focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] border border-transparent rounded-md hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-[#0078d4] flex items-center gap-2"
                >
                  <BuildingStorefrontIcon className="w-5 h-5" />
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
} 