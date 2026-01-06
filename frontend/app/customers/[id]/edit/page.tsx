"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;

  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "123-456-7890",
    address: "123 Main St, City, State",
    type: "buyer" as "buyer" | "seller" | "both",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Updating customer:", customerId, formData);
    router.push(`/customers/${customerId}`);
  };

  return (
    <div className="p-6 text-black">
      <div className="mb-6">
        <Link
          href={`/customers/${customerId}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Customer
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Edit Customer
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Same fields as Add page */}
          {["name", "email", "phone"].map((field) => (
            <div key={field}>
              <label className="block font-medium text-gray-700 mb-1 capitalize">
                {field}
              </label>
              <input
                type="text"
                value={(formData as any)[field]}
                onChange={(e) =>
                  setFormData({ ...formData, [field]: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Customer Type
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as "buyer" | "seller" | "both",
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#0070BB] text-white rounded-md text-sm font-medium hover:bg-[#005A99]"
            >
              Update Customer
            </button>
            <Link
              href={`/customers/${customerId}`}
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
