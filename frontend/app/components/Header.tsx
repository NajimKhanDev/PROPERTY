"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Menu, User } from "lucide-react";

export default function Header({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: any) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const [user, setUser] = useState<any>(null);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  /* ================= LOAD USER ================= */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("auth_user");
      if (stored) setUser(JSON.parse(stored));
    } catch (err) {
      console.error("Failed to parse auth_user", err);
    }
  }, []);

  const handleAvatarClick = (e: any) => {
    const rect = e.target.getBoundingClientRect();
    setPos({ top: rect.bottom + 8, left: rect.right - 200 });
    setOpen(!open);
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileOpen(!mobileOpen);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const confirmLogoutAction = () => {
    localStorage.clear();
    setConfirmLogout(false);
    router.push("/");
  };

  /* ================= CLOSE ON OUTSIDE CLICK ================= */
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        avatarRef.current &&
        !avatarRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : "?";

  return (
    <>
      {/* HEADER */}
      <header className="bg-white p-4 shadow flex items-center justify-between">
        {/* LEFT */}
        <div className="flex items-center gap-3 text-gray-600">


          <h2 className="text-lg font-semibold">Property Bazaar</h2>
        </div>

        {/* RIGHT */}
        <div className="flex items-center space-x-3">
          <span className="text-gray-600 text-sm">
            Welcome back{user?.name ? `, ${user.name}` : ""}!
          </span>

          <div
            ref={avatarRef}
            className="w-9 h-9 bg-blue-600 text-white flex justify-center items-center rounded-full cursor-pointer select-none"
            onClick={handleAvatarClick}
          >
            {userInitial}
          </div>
        </div>
      </header>

      {/* PROFILE DROPDOWN */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-56 bg-white shadow-md border border-gray-300 rounded-md p-3 z-[99999]"
            style={{ top: pos.top, left: pos.left }}
          >
            <p className="font-semibold text-gray-900">
              {user?.name || "User"}
            </p>

            <p className="text-xs text-gray-500">
              {user?.email || "-"}
            </p>

            <p className="text-xs text-gray-400 mb-3">
              Role: {user?.role_data?.name || user?.role}
            </p>

            {/* VIEW PROFILE */}
            {/* <button
              className="w-full flex items-center gap-2 text-left px-3 py-2
                         text-gray-700 hover:bg-gray-100 rounded text-sm"
              onClick={() => {
                setOpen(false);
                router.push(`/admin/customers/customer-details?id=${user?.id}`);
              }}
            >
              <User size={14} />
              View Profile
            </button> */}

            {/* LOGOUT */}
            <button
              className="w-full text-left px-3 py-2 mt-1 text-red-600
                         hover:bg-gray-100 rounded text-sm"
              onClick={() => setConfirmLogout(true)}
            >
              Logout
            </button>
          </div>,
          document.body
        )}

      {/* CONFIRM LOGOUT MODAL */}
      {confirmLogout &&
        createPortal(
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[999999]">
            <div className="bg-white w-72 rounded-lg shadow-lg p-5">
              <h3 className="text-base font-semibold text-gray-800">
                Confirm Logout
              </h3>

              <p className="text-xs text-gray-600 mt-2">
                Are you sure you want to logout?
              </p>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="px-3 py-1.5 text-xs border border-gray-500 text-gray-500 rounded-md hover:bg-gray-100 "
                  onClick={() => setConfirmLogout(false)}
                >
                  Cancel
                </button>

                <button
                  className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
                  onClick={confirmLogoutAction}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
