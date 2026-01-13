"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";

export default function EditUserPage() {
  const id = useSearchParams().get("id");
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<any[]>([]);


  const [form, setForm] = useState({
    name: "",
    email: "",
    role_id: "",
  });


  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axiosInstance.get("/roles");
      setRoles(res.data?.data || []);
    } catch {
      toast.error("Failed to load roles");
    }
  };


  useEffect(() => {
    if (!id) return;

    const fetchUser = async () => {
      try {
        const res = await axiosInstance.get(
          ProjectApi.userById(Number(id))
        );

        // console.log(res.data.data[0])
        const u = res.data.data[0];

        setForm({
          name: u.name ?? "",
          email: u.email ?? "",
          role_id: String(u.role_id ?? u.role?.id ?? ""),
        });
      } catch (err) {
        toast.error("Failed to load user");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);


  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axiosInstance.put(ProjectApi.userById(Number(id)), {
        name: form.name,
        email: form.email,
        role_id: Number(form.role_id),
      });

      toast.success("User updated successfully");
      router.push("/users");
    } catch {
      toast.error("Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:ring-2 focus:ring-blue-100 text-black";

  if (loading) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen flex justify-center pt-12 bg-gray-50">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow">
        <h1 className="text-xl font-bold mb-1 text-black">Edit User</h1>
        <p className="text-sm text-gray-500 mb-6">
          Update user information and role
        </p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-black">Name</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">Email</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-black">
              Role
            </label>

            <select
              className={inputClass}
              value={form.role_id}
              onChange={(e) =>
                setForm({ ...form, role_id: e.target.value })
              }
              required
            >
              <option value="">Select role</option>

              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name}
                </option>
              ))}
            </select>

            {roles.length === 0 && (
              <p className="text-xs text-gray-400 mt-1">
                Loading roles…
              </p>
            )}
          </div>


          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 rounded text-black"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="px-4 py-2 bg-[#0070BB] text-white rounded"
            >
              {saving ? "Updating..." : "Update User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
