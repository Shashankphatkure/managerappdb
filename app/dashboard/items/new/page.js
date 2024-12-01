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
  TrashIcon,
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
  const [items, setItems] = useState([
    {
      name: "",
      description: "",
      price: "",
      store_id: "",
      category_id: "",
      is_available: true,
    },
  ]);

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    if (items[0]?.store_id) {
      fetchCategories(items[0].store_id);
    }
  }, [items[0]?.store_id]);

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
    if (!items[0]?.store_id) {
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
            store_id: items[0].store_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh categories and update the current item
      await fetchCategories(items[0].store_id);
      setItems(items.map((item) => ({ ...item, category_id: data.id })));
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
        .insert(
          items.map((item) => ({
            ...item,
            price: parseFloat(item.price),
            category_id: item.category_id || null,
          }))
        )
        .select();

      if (error) throw error;
      router.push("/dashboard/items");
    } catch (error) {
      console.error("Error creating menu items:", error.message);
      alert(error.message || "Error creating menu items. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        name: "",
        description: "",
        price: "",
        store_id: items[0].store_id,
        category_id: items[0].category_id,
        is_available: true,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const updateAllItems = (field, value) => {
    setItems(items.map((item) => ({ ...item, [field]: value })));
  };

  return (
    <DashboardLayout
      title="Add New Menu Items"
      subtitle="Create one or more items for your store menu"
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
      <div className="mx-auto py-6 px-4 sm:px-6 lg:px-8">
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
          <div className="bg-white border border-[#edebe9] rounded-lg shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                <select
                  value={items[0].store_id}
                  onChange={(e) => updateAllItems("store_id", e.target.value)}
                  className="dashboard-input pl-10"
                  required
                >
                  <option value="">Select Store</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>

                <div className="flex gap-2">
                  <select
                    value={items[0].category_id}
                    onChange={(e) =>
                      updateAllItems("category_id", e.target.value)
                    }
                    className="dashboard-input pl-10 flex-1"
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="px-4 py-2 text-sm font-medium text-[#0078d4] bg-white border border-[#0078d4] rounded-md hover:bg-[#f3f2f1]"
                  >
                    Add New
                  </button>
                </div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="border-t border-[#edebe9] pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Item #{index + 1}</h3>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        updateItem(index, "name", e.target.value)
                      }
                      placeholder="Item Name"
                      className="dashboard-input"
                      required
                    />

                    <textarea
                      value={item.description}
                      onChange={(e) =>
                        updateItem(index, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="dashboard-input"
                      rows={3}
                    />

                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(index, "price", e.target.value)
                      }
                      placeholder="Price"
                      className="dashboard-input"
                      step="0.01"
                      min="0"
                      required
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={addItem}
                  className="text-[#0078d4] hover:text-[#106ebe] flex items-center gap-2"
                >
                  <PlusIcon className="w-5 h-5" />
                  Add Another Item
                </button>
              </div>

              <div className="pt-8 border-t border-[#edebe9]">
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/items")}
                    className="px-4 py-2 text-sm font-medium text-[#323130] bg-white border border-[#8a8886] rounded-md hover:bg-[#f3f2f1]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#0078d4] border border-transparent rounded-md hover:bg-[#106ebe]"
                  >
                    {submitting
                      ? "Adding..."
                      : `Add ${items.length} ${
                          items.length === 1 ? "Item" : "Items"
                        }`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Category Modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-8">
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
