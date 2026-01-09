"use client";

import { useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";

/* ================= MODULE DEFINITIONS ================= */
const MODULES = [
  "Dashboard",
  "Manage Role",
  "Customers",
  "Properties",
  "Payments",
  "Reports",
];

/* ================= HELPERS ================= */
const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "_");

export default function CreateRoleModal({ onClose, onCreated }: any) {
  const [roleName, setRoleName] = useState("");
  const [loading, setLoading] = useState(false);

  const [permissions, setPermissions] = useState(
    MODULES.map((module) => ({
      module,
      create: false,
      read: false,
      update: false,
      delete: false,
    }))
  );

  const togglePermission = (index: number, key: string) => {
    const updated = [...permissions];
    updated[index][key as keyof typeof updated[0]] =
      !updated[index][key as keyof typeof updated[0]];
    setPermissions(updated);
  };

  const toggleSelectAll = () => {
    const allSelected = permissions.every(
      (p) => p.create && p.read && p.update && p.delete
    );

    setPermissions(
      permissions.map((p) => ({
        ...p,
        create: !allSelected,
        read: !allSelected,
        update: !allSelected,
        delete: !allSelected,
      }))
    );
  };

  const buildFlatPermissions = () => {
    const perms: string[] = [];

    permissions.forEach((p) => {
      const moduleKey = slugify(p.module);
      if (p.create) perms.push(`${moduleKey}.create`);
      if (p.read) perms.push(`${moduleKey}.read`);
      if (p.update) perms.push(`${moduleKey}.update`);
      if (p.delete) perms.push(`${moduleKey}.delete`);
    });

    return perms;
  };

  const handleCreate = async () => {
    if (!roleName.trim()) return;

    try {
      setLoading(true);

      await axiosInstance.post("/roles", {
        role_name: roleName,
        permissions: buildFlatPermissions(),
        status: true,
      });

      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Create Role</h2>

        <input
          className="w-full h-9 px-3 border border-gray-200 rounded-md mb-4 text-sm"
          placeholder="Role Name"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
        />

        <div className="flex items-center gap-2 mb-3 text-sm">
          <input type="checkbox" onChange={toggleSelectAll} />
          Select All Permissions
        </div>

        <div className="border rounded max-h-[500px] overflow-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-2 text-left">Module</th>
                <th className="p-2">Create</th>
                <th className="p-2">Read</th>
                <th className="p-2">Update</th>
                <th className="p-2">Delete</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm, i) => (
                <tr key={perm.module} className="border-b">
                  <td className="p-2">{perm.module}</td>
                  {["create", "read", "update", "delete"].map((key) => (
                    <td key={key} className="text-center p-2">
                      <input
                        type="checkbox"
                        checked={(perm as any)[key]}
                        onChange={() => togglePermission(i, key)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="border px-4 py-2 rounded">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Creating..." : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
