'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // const logout = () => {
  //   localStorage.removeItem('isLoggedIn');
  //   router.push('/login');
  // };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/roles', label: 'Roles', icon: '🔐' },
    { href: '/customers', label: 'Customers', icon: '👥' },
    { href: '/properties', label: 'Properties', icon: '🏠' },
    { href: '/payments', label: 'Payments', icon: '💳' },
    { href: '/reports', label: 'Reports', icon: '📈' },
  ];

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">

      {/* Mobile overlay */}
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
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
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
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                className={`flex items-center px-4 lg:px-6 py-3 text-sm lg:text-sm
                transition-all
                ${
                  active
                    ? 'bg-[#005A99] border-l-4 border-white'
                    : 'hover:bg-[#005A99]/80'
                }`}
              >
                <span className="mr-3 text-sm">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        {/* <div className="absolute bottom-0 w-full p-4 lg:p-6 border-t border-white/20">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm lg:text-base
            text-white/90 rounded-md
            hover:bg-red-500/90 transition"
          >
            <span className="mr-3 text-lg">🚪</span>
            Logout
          </button>
        </div> */}
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
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
