"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import RoleTable from "./components/RoleTable";
import CreateRoleModal from "./components/CreateRoleModal";
import EditRoleModal from "./components/EditRoleModal";
import DeleteRoleModal from "./components/DeleteRoleModal";
import axiosInstance from "@/app/api/axiosInstance";

export default function ManageRolesPage() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

const fetchRoles = async () => {
  try {
    setLoading(true);
    const res = await axiosInstance.get("/roles");

    setRoles(res.data?.data || []);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchRoles();
  }, []);

  // console.log(roles,"roles=============>")

  return (
    <div className="p-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Roles</h1>
          <p className="text-gray-500 mt-1">
            {roles.length} roles available
          </p>
        </div>

        <button
          onClick={() => setOpenCreateModal(true)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center gap-1.5"
        >
          <Plus size={16} /> Add Role
        </button>
      </div>

      {/* Table */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        {loading ? (
          <p className="text-sm text-gray-500">Loading roles...</p>
        ) : (
          <RoleTable
            roles={roles}
            onEdit={(role: any) => {
              setSelectedRole(role);
              setOpenEditModal(true);
            }}
            onDelete={(role: any) => {
              setSelectedRole(role);
              setOpenDeleteModal(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      {openCreateModal && (
        <CreateRoleModal
          onClose={() => setOpenCreateModal(false)}
          onCreated={fetchRoles}
        />
      )}

      {openEditModal && selectedRole && (
        <EditRoleModal
          role={selectedRole}
          onClose={() => setOpenEditModal(false)}
          onUpdated={fetchRoles}
        />
      )}

      {openDeleteModal && selectedRole && (
        <DeleteRoleModal
          role={selectedRole}
          onClose={() => setOpenDeleteModal(false)}
          onDeleted={fetchRoles}
        />
      )}
    </div>
  );
}
