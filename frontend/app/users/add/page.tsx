"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";

export default function AddUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role_id: "",
    password: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axiosInstance.post(ProjectApi.register, {
        name: form.name,
        email: form.email,
        role_id: Number(form.role_id),
        password: form.password,
      });

      toast.success("User created successfully");
      router.push("/users");
    } catch (error: any) {
      const errors = error?.response?.data?.errors;
      if (errors) {
        Object.values(errors).forEach((arr: any) =>
          arr.forEach((msg: string) => toast.error(msg))
        );
      } else {
        toast.error("Failed to create user");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";

  return (
    <div className="min-h-screen flex justify-center pt-12 px-4 bg-gray-50 text-black">
      <div className="w-full max-w-md">
        {/* HEADER */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Create New User
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Add a user and assign role access
          </p>
        </div>

        {/* FORM CARD */}
        <div className="bg-white rounded-2xl shadow-md p-8">
          <form onSubmit={submit} className="space-y-5">
            {/* NAME */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Full Name
              </label>
              <input
                className={inputClass}
                placeholder="John Doe"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email Address
              </label>
              <input
                type="email"
                className={inputClass}
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            {/* ROLE */}
            <div>
              <label className="block text-sm font-medium mb-1">
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
                <option value="1">Super Admin</option>
                <option value="2">User</option>
              </select>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Password
              </label>
              <input
                type="password"
                className={inputClass}
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-[#0070BB] text-white rounded-md text-sm font-medium hover:bg-[#005A99] disabled:opacity-60"
              >
                {loading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
