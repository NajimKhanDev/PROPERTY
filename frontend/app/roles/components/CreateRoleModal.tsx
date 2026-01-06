"use client";

import { useState } from "react";

export default function CreateRoleModal({ onClose }: any) {
  const [roleName, setRoleName] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const modules = [
    "Dashboard",
    "Manage Users",
    "Loan Applications",
    "Reports",
  ];

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white w-[600px] rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Create Role</h2>

        <input
          placeholder="Role Name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="mt-4 w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#0070BB]"
        />

        <div className="mt-4 flex items-center gap-2">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={() => setSelectAll(!selectAll)}
          />
          <span className="text-sm font-medium">Select All Permissions</span>
        </div>

        <div className="mt-4 border rounded-lg max-h-[200px] overflow-y-auto">
          {modules.map((m) => (
            <div
              key={m}
              className="flex items-center justify-between px-4 py-2 border-b text-sm"
            >
              <span>{m}</span>
              <input type="checkbox" checked={selectAll} readOnly />
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm"
          >
            Create Role
          </button>
        </div>
      </div>
    </div>
  );
}
