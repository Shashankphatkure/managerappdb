"use client";
import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function CustomerStats() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalOrders: 0,
    averageOrderValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      // Get total customers
      const { count: totalCustomers } = await supabase
        .from("customers")
        .select("*", { count: "exact" });

      // Get active customers (with orders in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: activeCustomers } = await supabase
        .from("orders")
        .select("customer_id", { count: "exact", distinct: true })
        .gte("created_at", thirtyDaysAgo.toISOString());

      // Get order statistics
      const { data: orderStats } = await supabase
        .from("orders")
        .select("total_amount");

      const totalOrders = orderStats?.length || 0;
      const totalValue =
        orderStats?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
      const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

      setStats({
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        totalOrders,
        averageOrderValue,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div>Loading statistics...</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
        <p className="text-2xl font-bold">{stats.totalCustomers}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Active Customers</h3>
        <p className="text-2xl font-bold">{stats.activeCustomers}</p>
        <p className="text-xs text-gray-500">Last 30 days</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
        <p className="text-2xl font-bold">{stats.totalOrders}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">
          Average Order Value
        </h3>
        <p className="text-2xl font-bold">
          ${stats.averageOrderValue.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
