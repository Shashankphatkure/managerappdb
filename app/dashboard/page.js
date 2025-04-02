"use client";
import dynamic from "next/dynamic";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import {
  ShoppingBagIcon,
  UserGroupIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  BuildingStorefrontIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

const DashboardStats = dynamic(() => import("./components/DashboardStats"), {
  ssr: false,
});

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const dashboardCards = [
    {
      title: "Stores",
      link: "/dashboard/stores",
      description: "Manage stores and restaurants",
      icon: BuildingStorefrontIcon,
    },
    // {
    //   title: "Menu Items",
    //   link: "/dashboard/items",
    //   description: "Manage food items and pricing",
    //   icon: ShoppingBagIcon,
    // },
    {
      title: "Orders",
      link: "/dashboard/orders",
      description: "Manage and track orders",
      icon: ShoppingBagIcon,
    },
    {
      title: "Drivers",
      link: "/dashboard/drivers",
      description: "Manage delivery personnel",
      icon: TruckIcon,
    },
    {
      title: "Customers",
      link: "/dashboard/customers",
      description: "Manage customers",
      icon: UserGroupIcon,
    },
    {
      title: "Penalties",
      link: "/dashboard/penalties",
      description: "Manage driver penalties",
      icon: ExclamationTriangleIcon,
    },
    {
      title: "Payments",
      link: "/dashboard/payments",
      description: "Process driver payments",
      icon: CurrencyDollarIcon,
    },
    {
      title: "Ways to Earn",
      link: "/dashboard/earning_methods",
      description: "Manage driver earning methods",
      icon: BanknotesIcon,
    },
    {
      title: "Managers",
      link: "/dashboard/managers",
      description: "Manage system administrators",
      icon: UsersIcon,
    },
  ];

  return (
    <div className="p-8 min-h-screen bg-[#faf9f8]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-light mb-2 text-[#323130]">
              Dashboard Overview
            </h1>
            <p className="text-[#605e5c]">
              Welcome to your management dashboard
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-[#0078d4] text-white rounded-md hover:bg-[#106ebe] transition-colors"
          >
            Sign Out
          </button>
        </div>

        <div className="mb-12">
          <DashboardStats />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dashboardCards.map((card) => (
            <DashboardCard
              key={card.title}
              title={card.title}
              link={card.link}
              description={card.description}
              Icon={card.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardCard({ title, link, description, Icon }) {
  return (
    <a
      href={link}
      className="block p-6 rounded-lg bg-white border border-[#edebe9] hover:border-[#0078d4] shadow-sm hover:shadow-md transition-all duration-200 group"
    >
      <div className="flex items-center mb-4">
        <div className="p-2 rounded-md bg-[#f3f2f1] group-hover:bg-[#deecf9] transition-colors">
          <Icon className="w-6 h-6 text-[#0078d4]" />
        </div>
        <h2 className="text-xl font-semibold ml-3 text-[#323130] group-hover:text-[#0078d4] transition-colors">
          {title}
        </h2>
      </div>
      <p className="text-[#605e5c] group-hover:text-[#323130] transition-colors">
        {description}
      </p>
    </a>
  );
}
