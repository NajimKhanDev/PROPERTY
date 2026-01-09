"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

interface User {
  id: number;
  name: string;
  email: string;
  role: {
    id: number;
    role_name: string;
  };
  status: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [openDelete, setOpenDelete] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ProjectApi.users);
      setUsers(res.data.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedId) return;

    try {
      setDeleting(true);
      await axiosInstance.delete(ProjectApi.userById(selectedId));
      fetchUsers();
    } finally {
      setDeleting(false);
      setOpenDelete(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="p-6 text-black">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          <p className="text-sm text-gray-500">{users.length} users</p>
        </div>

        <Link
          href="/users/add"
          className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm"
        >
          Add User
        </Link>
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              {["S no","Name", "Email", "Role", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-500">
                  Loading users...
                </td>
              </tr>
            )}

            {!loading &&
              users.map((u,i) => (
                <tr key={u.id} className="border-t border-gray-200">
                  <td className="px-4 py-3">{i +1}</td>
                  <td className="px-4 py-3">{u.name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role?.role_name}</td>
                  <td className="px-4 py-3 flex gap-3">
                    <Link
                      href={`/users/view?id=${u.id}`}
                      className="text-blue-600"
                    >
                      View
                    </Link>
                    <Link
                      href={`/users/edit?id=${u.id}`}
                      className="text-green-600"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => {
                        setSelectedId(u.id);
                        setOpenDelete(true);
                      }}
                      className="text-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* DELETE MODAL */}
      {openDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h2 className="font-semibold">Delete User</h2>
            <p className="text-sm text-gray-600 mt-2">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenDelete(false)}
                className="px-4 py-2 bg-gray-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
