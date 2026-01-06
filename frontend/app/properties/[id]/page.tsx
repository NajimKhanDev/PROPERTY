"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function PropertyViewPage() {
  const params = useParams();
  const propertyId = params.id;

  const property = {
    title: "Modern Villa",
    address: "123 Oak Street",
    price: 500000,
    sellerName: "Jane Smith",
    type: "residential",
    description: "Beautiful modern villa",
  };

  const payments = [
    { id: 1, amount: 100000, date: "2024-01-20" },
    { id: 2, amount: 150000, date: "2024-02-15" },
  ];

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const remaining = property.price - totalPaid;

  return (
    <div className="p-6 text-black">
      <div className="mb-6">
        <Link
          href="/properties"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Property Details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 space-y-4 text-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Property Information</h2>
            <Link
              href={`/properties/${propertyId}/edit`}
              className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm"
            >
              Edit Property
            </Link>
          </div>

          {[
            ["Title", property.title],
            ["Type", property.type],
            ["Address", property.address],
            ["Seller", property.sellerName],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-gray-500">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}

          <div>
            <p className="text-gray-500">Price</p>
            <p className="text-xl font-bold text-green-600">
              ₹{property.price.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 text-sm space-y-3">
          <h3 className="font-semibold">Payment Summary</h3>
          <p>Total Paid: ₹{totalPaid.toLocaleString()}</p>
          <p className="text-red-600 font-medium">
            Remaining: ₹{remaining.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
