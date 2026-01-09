"use client";

import { useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";

const MODULES = [
  "Dashboard",
  "Manage Role",
  "Manage Users",
  "Customers",
  "Properties",
  "Payments",
  "Reports",
];

const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, "_");

export default function EditRoleModal({ role, onClose, onUpdated }: any) {
  const [roleName, setRoleName] = useState(role.role_name || role.name);
  const [loading, setLoading] = useState(false);

  const [permissions, setPermissions] = useState(() =>
    MODULES.map((module) => {
      const key = slugify(module);
      const rolePerms: string[] = role.permissions || [];

      return {
        module,
        create: rolePerms.includes(`${key}.create`),
        read: rolePerms.includes(`${key}.read`),
        update: rolePerms.includes(`${key}.update`),
        delete: rolePerms.includes(`${key}.delete`),
      };
    })
  );

  const togglePermission = (index: number, key: string) => {
    const updated = [...permissions];
    updated[index][key as keyof typeof updated[0]] =
      !updated[index][key as keyof typeof updated[0]];
    setPermissions(updated);
  };

  const buildFlatPermissions = () => {
    const perms: string[] = [];
    permissions.forEach((p) => {
      const key = slugify(p.module);
      if (p.create) perms.push(`${key}.create`);
      if (p.read) perms.push(`${key}.read`);
      if (p.update) perms.push(`${key}.update`);
      if (p.delete) perms.push(`${key}.delete`);
    });
    return perms;
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);

      await axiosInstance.put(`/roles/${role.id || role.role_id}`, {
        role_name: roleName,
        permissions: buildFlatPermissions(),
        status: true,
      });

      onUpdated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-3">
      <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4">Edit Role</h2>

        <input
          className="w-full h-9 px-3 border border-gray-200 rounded-md mb-4 text-sm"
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
        />

        <div className="border rounded max-h-[500px] overflow-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-gray-100">
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
            onClick={handleUpdate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Updating..." : "Update Role"}
          </button>
        </div>
      </div>
    </div>
  );
}
