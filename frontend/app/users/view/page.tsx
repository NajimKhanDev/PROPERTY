"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

function ViewUserContent() {
  const id = useSearchParams().get("id");
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(ProjectApi.userById(Number(id)))
      .then((res) => setUser(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;

  if (!user) return <p className="p-6 text-red-600">User not found</p>;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center pt-12 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md overflow-hidden">
        {/* HEADER */}
        <div className="px-6 py-4 border-b">
          <h1 className="text-xl font-semibold text-gray-800">
            User Details
          </h1>
          <p className="text-sm text-gray-500">
            View user information and access role
          </p>
        </div>

        {/* CONTENT */}
        <div className="p-6 space-y-5 text-sm">
          <Detail label="Full Name" value={user.name} />
          <Detail label="Email Address" value={user.email} />

          <Detail
            label="Role"
            value={
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                {user.role?.role_name}
              </span>
            }
          />

          <Detail
            label="Status"
            value={
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  user.status
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {user.status ? "Active" : "Inactive"}
              </span>
            }
          />
        </div>

        {/* ACTIONS */}
        <div className="px-6 py-4 border-t flex justify-end">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-sm rounded-md text-black"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ViewUserPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading...</p>}>
      <ViewUserContent />
    </Suspense>
  );
}

/* ---------- REUSABLE ROW ---------- */
function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center gap-4">
      <p className="text-gray-500">{label}</p>
      <div className="text-gray-800 font-medium text-right">
        {value}
      </div>
    </div>
  );
}
