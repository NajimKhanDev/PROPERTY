import { Edit, Trash } from "lucide-react";

// Format date -> "09 Jan 2026"
const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function RoleTable({ roles, onEdit, onDelete }: any) {
  return (
    <div className="overflow-x-auto rounded-lg">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 text-gray-700 text-left">
            {[
              "ID",
              "Role Name",
              "Permissions",
              "Status",
              "Created",
              "Updated",
              "Actions",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 font-semibold border-b border-gray-100"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {roles.map((role: any, idx: number) => (
            <tr
              key={idx}
              className={`${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-blue-50 transition`}
            >
              {/* ID */}
              <td className="px-4 py-3">{idx+1}</td>

              {/* Role Name */}
              <td className="px-4 py-3 font-medium">
                {role.role_name}
              </td>

              {/* Permissions */}
              <td
                className="px-4 py-3 max-w-[260px] truncate"
                title={role.permissions?.join(", ")}
              >
                {role.permissions?.length
                  ? role.permissions.join(", ")
                  : "—"}
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    role.status
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {role.status ? "Active" : "Inactive"}
                </span>
              </td>

              {/* Created */}
              <td className="px-4 py-3 text-gray-500">
                {formatDate(role.created_at)}
              </td>

              {/* Updated */}
              <td className="px-4 py-3 text-gray-500">
                {formatDate(role.updated_at)}
              </td>

              {/* Actions */}
              <td className="px-4 py-3 flex gap-2">
                <button
                  className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-md"
                  onClick={() => onEdit(role)}
                >
                  <Edit size={14} className="text-blue-600" />
                </button>

                <button
                  className="p-1.5 bg-red-100 hover:bg-red-200 rounded-md"
                  onClick={() => onDelete(role)}
                >
                  <Trash size={14} className="text-red-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!roles.length && (
        <div className="text-center text-gray-500 py-6">
          No roles found
        </div>
      )}
    </div>
  );
}
