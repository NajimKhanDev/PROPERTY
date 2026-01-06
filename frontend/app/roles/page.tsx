"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import RoleTable from "./components/RoleTable";
import CreateRoleModal from "./components/CreateRoleModal";
import EditRoleModal from "./components/EditRoleModal";
import DeleteRoleModal from "./components/DeleteRoleModal";
import SidebarLayout from "../components/SidebarLayout";

/* ================= STATIC ROLES ================= */
const STATIC_ROLES = [
  {
    role_id: 1,
    name: "Admin",
    desc: "System Administrator",
    permission: [
      "create_dashboard",
      "read_dashboard",
      "update_dashboard",
      "delete_dashboard",
      "read_manage_users",
    ],
    created_at: "2025-01-10",
    updated_at: "2025-02-01",
  },
  {
    role_id: 2,
    name: "Manager",
    desc: "Branch Manager",
    permission: ["read_dashboard", "read_reports", "read_customers"],
    created_at: "2025-01-15",
    updated_at: "2025-02-03",
  },
  {
    role_id: 3,
    name: "Agent",
    desc: "Loan Agent",
    permission: ["read_customers", "create_loan_applications"],
    created_at: "2025-01-20",
    updated_at: "2025-02-05",
  },
];

export default function ManageRolesPage() {
  const [roles, setRoles] = useState(STATIC_ROLES);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  return (
    <>

      <div className="p-6 text-black">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Manage Roles</h1>
            <p className="text-gray-500 mt-1">{roles.length} roles available</p>
          </div>

          <button
            onClick={() => setOpenCreateModal(true)}
            className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm hover:bg-[#005A99] flex items-center gap-1.5"
          >
            <Plus size={16} /> Add Role
          </button>
        </div>

        {/* Table */}
        <div className="bg-white p-5 rounded-xl shadow-sm">
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
        </div>

        {/* Modals */}
        {openCreateModal && (
          <CreateRoleModal
            onClose={() => setOpenCreateModal(false)}
            onCreated={() => { }}
          />
        )}

        {openEditModal && selectedRole && (
          <EditRoleModal
            role={selectedRole}
            onClose={() => setOpenEditModal(false)}
            onUpdated={() => { }}
          />
        )}

        {openDeleteModal && selectedRole && (
          <DeleteRoleModal
            role={selectedRole}
            onClose={() => setOpenDeleteModal(false)}
            onDeleted={() => { }}
          />
        )}
      </div>

    </>
  );
}
