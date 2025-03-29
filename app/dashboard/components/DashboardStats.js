"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  UserGroupIcon,
  TruckIcon,
  ClockIcon,
  BanknotesIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

export default function DashboardStats() {
  const [stats, setStats] = useState({
    activeDrivers: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    pendingPayments: 0,
    inactiveDrivers: 0,
    pendingPenalties: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel("dashboard_stats")
      .on("postgres_changes", { event: "*", schema: "public" }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchStats() {
    try {
      const [
        driversCount,
        inactiveDriversCount,
        ordersCount,
        customersCount,
        paymentsCount,
        penaltiesCount,
      ] = await Promise.all([
        supabase
          .from("users")
          .select("*", { count: "exact" })
          .eq("is_active", true),
        supabase
          .from("users")
          .select("*", { count: "exact" })
          .eq("is_active", false),
        supabase
          .from("orders")
          .select("*", { count: "exact" })
          .eq("status", "pending"),
        supabase.from("customers").select("*", { count: "exact" }),
        supabase
          .from("driver_payments")
          .select("*", { count: "exact" })
          .eq("paymentstatus", "pending"),
        supabase
          .from("penalties")
          .select("*", { count: "exact" })
          .eq("status", "pending")
          .is("appeal_status", null),
      ]);

      setStats({
        activeDrivers: driversCount.count || 0,
        inactiveDrivers: inactiveDriversCount.count || 0,
        pendingOrders: ordersCount.count || 0,
        totalCustomers: customersCount.count || 0,
        pendingPayments: paymentsCount.count || 0,
        pendingPenalties: penaltiesCount.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  }

  const handleNavigation = (path) => {
    router.push(path);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse bg-white rounded-xl h-32" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "ACTIVE DRIVERS",
      value: stats.activeDrivers,
      icon: TruckIcon,
      color: "blue",
      onClick: () => handleNavigation("/dashboard/drivers?status=active"),
    },
    {
      title: "INACTIVE DRIVERS",
      value: stats.inactiveDrivers,
      icon: TruckIcon,
      color: "emerald",
      onClick: () => handleNavigation("/dashboard/drivers?status=inactive"),
    },
    {
      title: "PENDING ORDERS",
      value: stats.pendingOrders,
      icon: ClockIcon,
      color: "yellow",
      onClick: () => handleNavigation("/dashboard/orders?status=pending"),
    },
    {
      title: "TOTAL CUSTOMERS",
      value: stats.totalCustomers,
      icon: UserGroupIcon,
      color: "green",
      onClick: () => handleNavigation("/dashboard/customers"),
    },
    {
      title: "PENDING PAYMENTS",
      value: stats.pendingPayments,
      icon: BanknotesIcon,
      color: "purple",
      onClick: () => handleNavigation("/dashboard/payments?status=pending"),
    },
    {
      title: "PENDING PENALTIES",
      value: stats.pendingPenalties,
      icon: ExclamationTriangleIcon,
      color: "red",
      onClick: () => handleNavigation("/dashboard/penalties?status=pending"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {statCards.map((card) => (
        <div 
          key={card.title} 
          className={`dashboard-card group ${card.onClick ? 'cursor-pointer hover:shadow-md' : ''}`}
          onClick={card.onClick}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#605e5c]">{card.title}</p>
              <p className="text-2xl font-bold mt-2 text-[#323130]">
                {card.value}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-${card.color}-50`}>
              <card.icon className={`w-6 h-6 text-${card.color}-600`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
