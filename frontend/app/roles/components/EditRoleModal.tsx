"use client";

import { useState } from "react";

export default function EditRoleModal({ role, onClose }: any) {
  const [roleName, setRoleName] = useState(role.name);

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white w-[600px] rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-900">Edit Role</h2>

        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          className="mt-4 w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#0070BB]"
        />

        <p className="mt-4 text-sm text-gray-500">
          Permissions preview only (UI mode)
        </p>

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
            Update Role
          </button>
        </div>
      </div>
    </div>
  );
}
