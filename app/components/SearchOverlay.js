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
  const [searchType, setSearchType] = useState("customers");
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
    const searchData = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoading(true);
      
      let data = [];
      let error = null;
      
      switch (searchType) {
        case "customers":
          ({ data, error } = await supabase
            .from("customers")
            .select("id, full_name, email, phone, city")
            .or(
              `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
            )
            .limit(5));
          break;
        
        case "drivers":
          // First, let's log what we're searching for
          console.log("Searching for drivers with query:", searchQuery);
          
          try {
            // Query directly without the manager filter first to see if there are any results
            const { data: allUsers, error: userError } = await supabase
              .from("users")
              .select("id, full_name, email, phone, city, vehicle_number, vehicle_type, location")
              .or(
                `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,vehicle_number.ilike.%${searchQuery}%`
              )
              .limit(10);
            
            if (userError) {
              console.error("Error searching all users:", userError);
              error = userError;
            } else {
              console.log("Found users:", allUsers?.length || 0);
              
              // Now filter to likely drivers (those with vehicle info or not marked as managers)
              data = allUsers?.filter(user => 
                user.vehicle_number || 
                user.vehicle_type || 
                (user.manager !== true && user.manager !== 'true')
              ) || [];
              
              console.log("Filtered to drivers:", data.length);
            }
          } catch (err) {
            console.error("Exception in driver search:", err);
            error = err;
          }
          break;
        
        case "stores":
          ({ data, error } = await supabase
            .from("stores")
            .select("id, name, address, phone")
            .or(
              `name.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
            )
            .limit(5));
          break;
          
        case "orders":
          ({ data, error } = await supabase
            .from("orders")
            .select("id, customername, status, total_amount, created_at")
            .or(
              `customername.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`
            )
            .order('created_at', { ascending: false })
            .limit(5));
            
          // Handle ID search separately if the query is a number
          if (!error && !isNaN(searchQuery) && searchQuery.trim() !== '') {
            const { data: idData, error: idError } = await supabase
              .from("orders")
              .select("id, customername, status, total_amount, created_at")
              .eq('id', parseInt(searchQuery))
              .limit(1);
              
            if (!idError && idData && idData.length > 0) {
              data = [...idData, ...(data || [])];
            }
          }
          break;
      }

      setIsLoading(false);
      if (error) {
        console.error(`Error searching ${searchType}:`, error);
        return;
      }
      setSearchResults(data);
    };

    const debounceTimeout = setTimeout(searchData, 300);
    return () => clearTimeout(debounceTimeout);
  }, [searchQuery, searchType]);

  const handleResultClick = (item) => {
    let route = '';
    
    switch (searchType) {
      case "customers":
        route = `/dashboard/customers/${item.id}`;
        break;
      case "drivers":
        route = `/dashboard/drivers/${item.id}/assignments`;
        break;
      case "stores":
        route = `/dashboard/stores/${item.id}`;
        break;
      case "orders":
        route = `/dashboard/orders/${item.id}`;
        break;
    }
    
    if (route) {
      router.push(route);
      onClose();
      setSearchQuery("");
    }
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      if (searchQuery.length > 1) {
        return (
          <div className="p-4 text-center text-gray-500">
            No results found
          </div>
        );
      } else {
        return (
          <div className="p-4 text-center text-gray-500">
            Start typing to search {searchType}
          </div>
        );
      }
    }

    return (
      <div className="divide-y divide-gray-100">
        {searchResults.map((item) => (
          <div
            key={item.id}
            className="p-4 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
            onClick={() => handleResultClick(item)}
          >
            <div>
              {searchType === "customers" && (
                <>
                  <div className="font-medium text-gray-900">{item.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {item.email} • {item.phone} • {item.city}
                  </div>
                </>
              )}
              
              {searchType === "drivers" && (
                <>
                  <div className="font-medium text-gray-900">{item.full_name}</div>
                  <div className="text-sm text-gray-500">
                    {item.email} • {item.phone} • {item.city || ''}
                    {item.vehicle_number && <span> • {item.vehicle_type || ''} {item.vehicle_number}</span>}
                  </div>
                </>
              )}
              
              {searchType === "stores" && (
                <>
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.address} • {item.phone}
                  </div>
                </>
              )}
              
              {searchType === "orders" && (
                <>
                  <div className="font-medium text-gray-900">Order #{item.id} - {item.customername}</div>
                  <div className="text-sm text-gray-500">
                    {item.status} • ${item.total_amount} • {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </>
              )}
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </div>
        ))}
      </div>
    );
  };

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
              placeholder={`Search ${searchType}...`}
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
          
          <div className="flex mt-2 space-x-2">
            {["customers", "drivers", "stores", "orders"].map((type) => (
              <button
                key={type}
                className={`px-3 py-1 rounded-full text-sm ${
                  searchType === type
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setSearchType(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            renderSearchResults()
          )}
        </div>
      </div>
    </div>
  );
}
