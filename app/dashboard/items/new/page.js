"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/DashboardLayout";
import {
  BuildingStorefrontIcon,
  DocumentTextIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  PhotoIcon,
  ArrowLeftIcon,
  PlusIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";

export default function NewMenuItemPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "" });

  const [item, setItem] = useState({
    name: "",
    description: "",
    price: "",
    store_id: "",
    category_id: "",
    image_url: "",
    is_available: true,
  });

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (item.store_id) {
      fetchCategories(item.store_id);
    }
  }, [item.store_id]);

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
      console.error("Error fetching stores:", error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories(storeId) {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .eq("store_id", storeId)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error.message);
    }
  }

  async function handleCreateCategory() {
    if (!item.store_id) {
      alert("Please select a store first");
      return;
    }

    if (!newCategory.name.trim()) {
      alert("Please enter a category name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .insert([
          {
            name: newCategory.name,
            store_id: item.store_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh categories and update the current item
      await fetchCategories(item.store_id);
      setItem({ ...item, category_id: data.id });
      setShowCategoryModal(false);
      setNewCategory({ name: "" });
    } catch (error) {
      console.error("Error creating category:", error.message);
      alert("Error creating category. Please try again.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("menu_items")
        .insert([
          {
            ...item,
            price: parseFloat(item.price),
            category_id: item.category_id || null, // Handle empty category
          },
        ])
        .select()
        .single();

      if (error) throw error;
      router.push("/dashboard/items");
    } catch (error) {
      console.error("Error creating menu item:", error.message);
      alert(error.message || "Error creating menu item. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const formFields = [
    {
      label: "Store",
      type: "select",
      value: item.store_id,
      onChange: (value) => setItem({ ...item, store_id: value }),
      icon: BuildingStorefrontIcon,
      options: stores.map((store) => ({
        value: store.id,
        label: store.name,
      })),
      required: true,
    },
    {
      label: "Category",
      type: "select",
      value: item.category_id,
      onChange: (value) => setItem({ ...item, category_id: value }),
      icon: MapPinIcon,
      options: categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
      addNew: {
        label: "Add New Category",
        action: () => setShowCategoryModal(true),
      },
    },
    {
      label: "Item Name",
      type: "text",
      value: item.name,
      onChange: (value) => setItem({ ...item, name: value }),
      icon: ShoppingBagIcon,
      required: true,
    },
    {
      label: "Description",
      type: "textarea",
      value: item.description,
      onChange: (value) => setItem({ ...item, description: value }),
      icon: DocumentTextIcon,
    },
    {
      label: "Price",
      type: "number",
      value: item.price,
      onChange: (value) => setItem({ ...item, price: value }),
      icon: PhoneIcon,
      prefix: "$",
      required: true,
    },
    {
      label: "Image URL",
      type: "url",
      value: item.image_url,
      onChange: (value) => setItem({ ...item, image_url: value }),
      icon: PhotoIcon,
      placeholder: "https://...",
    },
  ];

  return (
    <DashboardLayout
      title="Add New Menu Item"
      subtitle="Create a new item for your store menu"
      actions={
        <button
          onClick={() => router.push("/dashboard/items")}
          className="dashboard-button-secondary flex items-center gap-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Items
        </button>
      }
    >
      <div className="max-w-3xl mx-auto p-8">
        {loading ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[#f3f2f1] rounded-lg h-16"
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-[#edebe9] rounded-lg shadow-sm p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formFields.map((field) => (
                <div key={field.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-[#323130]">
                      {field.label}
                    </label>
                    {field.addNew && (
                      <button
                        type="button"
                        onClick={field.addNew.action}
                        className="text-sm text-[#0078d4] hover:text-[#106ebe] flex items-center gap-1"
                      >
                        <PlusIcon className="w-4 h-4" />
                        {field.addNew.label}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <field.icon className="h-5 w-5 text-[#605e5c]" />
                    </div>
                    {field.type === "select" ? (
                      <select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="dashboard-input pl-10"
                        required={field.required}
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="dashboard-input pl-10"
                        rows={3}
                        required={field.required}
                        placeholder={field.placeholder}
                      />
                    ) : (
                      <div className="relative">
                        {field.prefix && (
                          <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                            <span className="text-gray-500">
                              {field.prefix}
                            </span>
                          </div>
                        )}
                        <input
                          type={field.type}
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          className={`dashboard-input ${
                            field.prefix ? "pl-14" : "pl-10"
                          }`}
                          required={field.required}
                          placeholder={field.placeholder}
                          step={field.type === "number" ? "0.01" : undefined}
                          min={field.type === "number" ? "0" : undefined}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-[#edebe9]">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/items")}
                    className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-[#8a8886] rounded-md hover:bg-[#f3f2f1] focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] border border-transparent rounded-md hover:bg-[#106ebe] focus:outline-none focus:ring-2 focus:ring-[#0078d4]"
                  >
                    {submitting ? "Adding..." : "Add Item"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-[#323130] mb-4">
                  Add New Category
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#323130]">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) =>
                        setNewCategory({ ...newCategory, name: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border border-[#8a8886] px-3 py-2 text-sm focus:border-[#0078d4] focus:ring-[#0078d4]"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowCategoryModal(false)}
                      className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-[#8a8886] rounded-md hover:bg-[#f3f2f1]"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] border border-transparent rounded-md hover:bg-[#106ebe]"
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
