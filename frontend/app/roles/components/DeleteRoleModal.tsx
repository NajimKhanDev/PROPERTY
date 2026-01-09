"use client";

import axiosInstance from "@/app/api/axiosInstance";

export default function DeleteRoleModal({ role, onClose, onDeleted }: any) {
  const handleDelete = async () => {
    await axiosInstance.delete(`/roles/${role.id || role.role_id}`);
    onDeleted();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white w-[420px] rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900">Delete Role</h2>

        <p className="mt-3 text-sm text-gray-700">
          Are you sure you want to delete
          <strong className="text-red-600"> {role.role_name || role.name} </strong>?
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 border border-gray-200 rounded-md text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
