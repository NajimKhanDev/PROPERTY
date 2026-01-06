import { Edit, Trash } from "lucide-react";

// Format date -> "12 Dec 2025"
const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
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
              "Description",
              "Permissions",
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
              key={role.role_id}
              className={`transition ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-blue-50`}
            >
              {/* ID */}
              <td className="px-4 py-3 border-b border-gray-100">
                {role.role_id}
              </td>

              {/* Role Name */}
              <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                {role.name}
              </td>

              {/* Description */}
              <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                {role.desc}
              </td>

              {/* Permissions (TRUNCATED) */}
              <td
                className="
                  px-4 py-3 border-b border-gray-100 text-gray-600
                  max-w-[260px] truncate whitespace-nowrap overflow-hidden text-ellipsis
                "
                title={role.permission?.join(", ")}
              >
                {role.permission?.join(", ") || "—"}
              </td>

              {/* Created */}
              <td className="px-4 py-3 border-b border-gray-100 text-gray-500">
                {formatDate(role.created_at)}
              </td>

              {/* Updated */}
              <td className="px-4 py-3 border-b border-gray-100 text-gray-500">
                {formatDate(role.updated_at)}
              </td>

              {/* Action Buttons */}
              <td className="px-4 py-3 border-b border-gray-100 flex gap-2">
                {/* Edit */}
                <button
                  className="p-1.5 rounded-md bg-blue-100 hover:bg-blue-200 transition shadow-sm"
                  onClick={() => onEdit(role)}
                >
                  <Edit size={14} className="text-blue-600" />
                </button>

                {/* Delete */}
                <button
                  className="p-1.5 rounded-md bg-red-100 hover:bg-red-200 transition shadow-sm"
                  onClick={() => onDelete(role)}
                >
                  <Trash size={14} className="text-red-600" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
