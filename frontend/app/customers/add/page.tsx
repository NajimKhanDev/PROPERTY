"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddCustomerPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    type: "buyer" as "buyer" | "seller" | "both",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Adding customer:", formData);
    router.push("/customers");
  };

  return (
    <div className="p-6 text-black">
      <div className="mb-6">
        <Link
          href="/customers"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Add New Customer
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5 text-sm">
          {/* Name */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Type */}
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

          {/* Actions */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-[#0070BB] text-white rounded-md text-sm font-medium hover:bg-[#005A99]"
            >
              Add Customer
            </button>
            <Link
              href="/customers"
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
