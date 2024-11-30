"use client";

export default function DashboardLayout({ children, title, actions }) {
  return (
    <div className="p-6 min-h-screen bg-[#faf9f8]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-[#323130]">{title}</h1>
        {actions && <div>{actions}</div>}
      </div>

      <div className="rounded-xl bg-[#fafafa] border border-[#edebe9] shadow-lg">
        {children}
      </div>
    </div>
  );
}
