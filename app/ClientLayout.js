"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  PlusIcon,
  ChartBarIcon,
  TruckIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon,
  ClipboardDocumentListIcon,
  MapPinIcon,
  ReceiptRefundIcon,
  DocumentChartBarIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import SearchOverlay from "./components/SearchOverlay";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ClientLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [userData, setUserData] = useState(null);
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Check for mobile view on mount and window resize
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Close sidebar automatically when navigating on mobile
    if (isMobileView) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobileView]);

  useEffect(() => {
    async function getUserData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: managerData } = await supabase
          .from("managers")
          .select("full_name, role")
          .eq("auth_id", user.id)
          .single();

        if (managerData) {
          setUserData(managerData);
        }
      }
    }

    getUserData();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          console.log("New notification:", payload.new);
          const { title, message } = payload.new;
          toast.info(`${title}: ${message}`);
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const menuItems = [
    {
      path: "/dashboard/orders/new",
      label: "New Order",
      icon: PlusIcon,
      priority: true,
    },
    { path: "/dashboard", label: "Dashboard", icon: ChartBarIcon },
    { path: "/dashboard/customers", label: "Customers", icon: UserGroupIcon },
    
    { path: "/dashboard/orders", label: "Orders", icon: ShoppingBagIcon },
    { path: "/dashboard/orders/drivers", label: "Track Driver", icon: MapPinIcon },
    { path: "/dashboard/batches", label: "Batches", icon: DocumentDuplicateIcon },
    { path: "/dashboard/drivers", label: "Drivers", icon: TruckIcon },
    { path: "/dashboard/payments", label: "Payments", icon: BanknotesIcon },
    { path: "/dashboard/reports", label: "Reports", icon: DocumentChartBarIcon },
    {
      path: "/dashboard/penalties",
      label: "Penalties",
      icon: ExclamationTriangleIcon,
    },
    {
      path: "/dashboard/notifications",
      label: "Notifications",
      icon: BellIcon,
    },
    {
      path: "/dashboard/announcements",
      label: "Announcements",
      icon: MegaphoneIcon,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Mobile overlay */}
      {isMobileView && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-10"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 relative transition-all duration-300 ${
          isSidebarOpen ? "w-[280px]" : "w-0 md:w-[80px]"
        } ${isMobileView ? "fixed z-20 h-full shadow-lg" : ""}`}
      >
        <div className={`p-6 ${!isSidebarOpen && isMobileView ? "hidden" : ""}`}>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <div
                    className={`flex items-center ${
                      isSidebarOpen ? "px-4" : "justify-center"
                    } py-3 rounded-lg cursor-pointer transition-all duration-200 hover:translate-x-1 group ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : item.priority
                        ? "text-blue-600 hover:bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                    } ${!isSidebarOpen && isMobileView ? "hidden" : ""}`}
                    onClick={() => isMobileView && setIsSidebarOpen(false)}
                  >
                    <item.icon
                      className={`w-5 h-5 ${
                        isActive || item.priority
                          ? "text-blue-600"
                          : "text-gray-500"
                      }`}
                    />
                    {isSidebarOpen && (
                      <span
                        className={`ml-3 font-medium ${
                          isActive ? "text-blue-600" : "text-gray-600"
                        }`}
                      >
                        {item.label}
                      </span>
                    )}
                    {!isSidebarOpen && !isMobileView && (
                      <div className="fixed left-20 bg-gray-900 text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                        {item.label}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Section */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 ${!isSidebarOpen && isMobileView ? "hidden" : ""}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-gray-500" />
            </div>
            <div
              className={`transition-opacity duration-200 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              <p className="font-medium text-gray-700">
                {userData?.full_name || "Loading..."}
              </p>
              <p className="text-sm text-gray-500">
                {userData?.role || "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${isMobileView ? "w-full" : ""}`}>
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                {isSidebarOpen ? (
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <h1 className="text-xl font-semibold text-gray-800 truncate">
                {menuItems.find((item) => item.path === pathname)?.label ||
                  "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Search"
              >
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
              </button>
              <Link href="/dashboard/notifications">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative" aria-label="Notifications">
                  <BellIcon className="w-5 h-5 text-gray-500" />
                </button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>

      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </div>
  );
}
