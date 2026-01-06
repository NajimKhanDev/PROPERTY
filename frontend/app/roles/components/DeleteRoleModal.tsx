"use client";

export default function DeleteRoleModal({ role, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white w-[420px] rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-900">Delete Role</h2>

        <p className="mt-3 text-sm text-gray-700">
          Are you sure you want to delete
          <strong className="text-red-600"> {role.name} </strong>?
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
            className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
