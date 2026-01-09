"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  /* ================= LOAD USER PERMISSIONS ================= */
  useEffect(() => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("auth_user") || "{}"
      );

      const permissions: string[] =
        storedUser?.role?.permissions || [];

      setUserPermissions(permissions);
    } catch (err) {
      console.error("Failed to parse user from localStorage");
      setUserPermissions([]);
    }
  }, []);

  /* ================= PERMISSION CHECK ================= */
  const canRead = (permission: string) => {
    return userPermissions.includes(permission);
  };

  /* ================= NAV ITEMS ================= */
  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: "📊",
      permission: "dashboard.read",
    },
    {
      href: "/roles",
      label: "Roles",
      icon: "🔐",
      permission: "manage_role.read",
    },
    {
      href: "/customers",
      label: "Customers",
      icon: "👥",
      permission: "customers.read",
    },
    {
      href: "/properties",
      label: "Properties",
      icon: "🏠",
      permission: "properties.read",
    },
    {
      href: "/payments",
      label: "Payments",
      icon: "💳",
      permission: "payments.read",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: "📈",
      permission: "reports.read",
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    canRead(item.permission)
  );

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64
        bg-[#0070BB] text-white
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-white/20">
          <h1 className="text-lg lg:text-xl font-bold">
            Property Bazaar
          </h1>
          <button
            onClick={closeMobileMenu}
            className="lg:hidden p-2 rounded-md text-white/80 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-4 lg:mt-6 space-y-1">
          {visibleNavItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center px-4 lg:px-6 py-3 text-sm transition-all
                ${
                  active
                    ? "bg-[#005A99] border-l-4 border-white"
                    : "hover:bg-[#005A99]/80"
                }`}
              >
                <span className="mr-3 text-sm">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}

          {visibleNavItems.length === 0 && (
            <p className="px-6 py-3 text-sm text-white/70">
              No access assigned
            </p>
          )}
        </nav>
      </aside>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="lg:hidden bg-[#0070BB] shadow">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-md text-white hover:bg-[#005A99]"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <h1 className="text-lg font-semibold text-white">
              Property Bazaar
            </h1>

            <div className="w-10" />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
}
