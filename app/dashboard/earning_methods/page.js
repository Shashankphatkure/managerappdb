"use client";
import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import DashboardLayout from "../components/DashboardLayout";
import Link from "next/link";
import {
  CurrencyDollarIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  UserGroupIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

export default function EarningMethodsPage() {
  const [earningMethods, setEarningMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchEarningMethods = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("earning_methods")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setEarningMethods(data || []);
      } catch (error) {
        console.error("Error fetching earning methods:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarningMethods();
  }, [supabase]);

  // Map icon names to Heroicons components
  const getIconComponent = (iconName) => {
    const iconMap = {
      'flash-outline': BoltIcon,
      'time-outline': ClockIcon,
      'checkmark-circle-outline': CheckCircleIcon,
      'people-outline': UserGroupIcon,
    };

    const IconComponent = iconMap[iconName] || CurrencyDollarIcon;
    return IconComponent;
  };

  return (
    <DashboardLayout
      title="Ways to Earn"
      subtitle="Earning methods for drivers"
      actions={
        <Link
          href="/dashboard/earning_methods/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <PlusIcon className="w-5 h-5" />
          Add Earning Method
        </Link>
      }
    >
      <div className="p-6">
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-xl h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {earningMethods.map((method) => {
              const IconComponent = getIconComponent(method.icon_name);
              
              return (
                <Link
                  key={method.id}
                  href={`/dashboard/earning_methods/${method.id}`}
                  className="block bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div 
                        className="p-3 rounded-lg" 
                        style={{ 
                          backgroundColor: method.icon_bg_color || '#f3f2f1' 
                        }}
                      >
                        <IconComponent 
                          className="w-6 h-6" 
                          style={{ 
                            color: method.icon_color || '#0078d4' 
                          }} 
                        />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="text-lg font-semibold text-gray-900">{method.title}</h3>
                          <div className="text-lg font-medium text-green-600">{method.amount}</div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{method.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 