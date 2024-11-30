"use client";
import { useState } from "react";
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
} from "@heroicons/react/24/outline";

export default function ClientLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const menuItems = [
    {
      path: "/dashboard/orders/new",
      label: "New Order",
      icon: PlusIcon,
      priority: true,
    },
    { path: "/dashboard", label: "Dashboard", icon: ChartBarIcon },
    { path: "/dashboard/drivers", label: "Drivers", icon: TruckIcon },
    { path: "/dashboard/orders", label: "Orders", icon: ShoppingBagIcon },
    { path: "/dashboard/customers", label: "Customers", icon: UserGroupIcon },
    { path: "/dashboard/payments", label: "Payments", icon: BanknotesIcon },
    { path: "/dashboard/reports", label: "Reports", icon: ChartBarIcon },
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
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 relative transition-all duration-300 ${
          isSidebarOpen ? "w-[280px]" : "w-[80px]"
        }`}
      >
        <div className="p-6">
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
                    }`}
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
                    {!isSidebarOpen && (
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
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <UserCircleIcon className="w-6 h-6 text-gray-500" />
            </div>
            <div
              className={`transition-opacity duration-200 ${
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden"
              }`}
            >
              <p className="font-medium text-gray-700">John Doe</p>
              <p className="text-sm text-gray-500">Admin</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isSidebarOpen ? (
                  <XMarkIcon className="w-5 h-5 text-gray-500" />
                ) : (
                  <Bars3Icon className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                {menuItems.find((item) => item.path === pathname)?.label ||
                  "Dashboard"}
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-500" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <BellIcon className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <button className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-3 py-2 transition-colors">
                <UserCircleIcon className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-700">Profile</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
