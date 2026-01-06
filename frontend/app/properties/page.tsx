"use client";

import { useState } from "react";
import Link from "next/link";

interface Property {
  id: number;
  title: string;
  address: string;
  price: number;
  sellerId: number;
  sellerName: string;
  type: "residential" | "commercial";
  status: "available" | "sold" | "pending";
  description: string;
}

export default function PropertiesPage() {
  const [properties] = useState<Property[]>([
    {
      id: 1,
      title: "Modern Villa",
      address: "123 Oak St",
      price: 500000,
      sellerId: 2,
      sellerName: "Jane Smith",
      type: "residential",
      status: "available",
      description: "Beautiful modern villa",
    },
  ]);

  const handleDelete = (id: number) => {
    if (confirm("Delete this property?")) {
      console.log("Delete property:", id);
    }
  };

  return (
    <div className="p-6 text-black">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Property Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {properties.length} properties available
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/properties/buy"
            className="px-3 py-1.5 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            Buy Property
          </Link>
          <Link
            href="/properties/sell"
            className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm hover:bg-[#005A99]"
          >
            Sell Property
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-left">
                {["Title", "Address", "Price", "Seller", "Status", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 font-semibold border-b border-gray-100"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {properties.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                    {p.title}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {p.address}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    ₹{p.price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {p.sellerName}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        p.status === "available"
                          ? "bg-green-100 text-green-700"
                          : p.status === "sold"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 flex gap-3">
                    <Link
                      href={`/properties/${p.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                    <Link
                      href={`/properties/${p.id}/edit`}
                      className="text-green-600 hover:text-green-800"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
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
