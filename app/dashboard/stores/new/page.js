"use client";
import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import DashboardLayout from "../../components/DashboardLayout";
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  PhotoIcon,
  ArrowLeftIcon,
  FaceSmileIcon,
} from "@heroicons/react/24/outline";

// Import EmojiPicker dynamically to avoid SSR issues
const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

export default function NewStorePage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [submitting, setSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [store, setStore] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    opening_time: "",
    closing_time: "",
    icon: "🏪", // Default store icon
  });

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
      const { error } = await supabase.from("stores").insert([
        {
          ...store,
          is_active: true,
        },
      ]);

      if (error) throw error;
      router.push("/dashboard/stores");
    } catch (error) {
      console.error("Error creating store:", error);
      alert("Error creating store. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout
      title="Add New Store"
      subtitle="Create a new store location"
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
                  {submitting ? "Adding..." : "Add Store"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
