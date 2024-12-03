import { useState, useEffect, useRef } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";

export default function SearchOverlay({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const searchCustomers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, email, phone, city")
        .or(
          `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        )
        .limit(5);

      setIsLoading(false);
      if (error) {
        console.error("Error searching customers:", error);
        return;
      }
      setSearchResults(data);
    };

    const debounceTimeout = setTimeout(searchCustomers, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search customers..."
              className="flex-1 outline-none text-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {searchResults.map((customer) => (
                <div
                  key={customer.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    router.push(`/dashboard/customers/${customer.id}`);
                    onClose();
                    setSearchQuery("");
                  }}
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {customer.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {customer.email} • {customer.phone} • {customer.city}
                    </div>
                  </div>
                  <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          ) : searchQuery.length > 1 ? (
            <div className="p-4 text-center text-gray-500">
              No results found
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Start typing to search customers
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
