"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditPropertyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const propertyId = searchParams.get("id");

  const [formData, setFormData] = useState({
    title: "Modern Villa",
    address: "123 Oak Street",
    price: 500000,
    sellerId: 2,
    type: "residential" as "residential" | "commercial",
    description: "Beautiful modern villa",
  });

  const customers = [
    { id: 1, name: "John Doe", type: "buyer" },
    { id: 2, name: "Jane Smith", type: "seller" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating property:", propertyId, formData);
    router.push(`/properties/view?id=${propertyId}`);
  };

  return (
    <div className="p-6 text-black">
      <div className="mb-6">
        <Link
          href={`/properties/view?id=${propertyId}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Property
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Edit Property
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {[
            { label: "Property Title", key: "title", type: "text" },
            { label: "Address", key: "address", type: "text" },
            { label: "Price", key: "price", type: "number" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block font-medium text-gray-700 mb-1">
                {f.label}
              </label>
              <input
                type={f.type}
                value={(formData as any)[f.key]}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [f.key]:
                      f.type === "number"
                        ? Number(e.target.value)
                        : e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Seller
            </label>
            <select
              value={formData.sellerId}
              onChange={(e) =>
                setFormData({ ...formData, sellerId: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {customers
                .filter((c) => c.type === "seller")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Property Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "residential" | "commercial",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="flex gap-4 pt-2">
            <button className="px-4 py-2 bg-[#0070BB] text-white rounded-md text-sm font-medium hover:bg-[#005A99]">
              Update Property
            </button>
            <Link
              href={`/properties/view?id=${propertyId}`}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}