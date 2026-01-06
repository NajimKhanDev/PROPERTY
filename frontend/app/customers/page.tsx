"use client";

import { useState } from "react";
import Link from "next/link";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "buyer" | "seller" | "both";
}

export default function CustomersPage() {
  const [customers] = useState<Customer[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      address: "123 Main St",
      type: "buyer",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "098-765-4321",
      address: "456 Oak Ave",
      type: "seller",
    },
  ]);

  const handleDelete = (id: number) => {
    if (confirm("Delete this customer?")) {
      console.log("Delete customer:", id);
    }
  };

  return (
    <div className="p-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Customer Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {customers.length} customers available
          </p>
        </div>

        <Link
          href="/customers/add"
          className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm hover:bg-[#005A99]"
        >
          Add Customer
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-left">
                {["Name", "Email", "Phone", "Type", "Actions"].map((h) => (
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
              {customers.map((c, idx) => (
                <tr
                  key={c.id}
                  className={`transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {c.email}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {c.phone}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        c.type === "buyer"
                          ? "bg-green-100 text-green-700"
                          : c.type === "seller"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 flex gap-3">
                    <Link
                      href={`/customers/${c.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/customers/${c.id}/edit`}
                      className="text-green-600 hover:text-green-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
