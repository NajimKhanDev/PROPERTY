"use client";

import { useState } from "react";

interface Payment {
  id: number;
  propertyId: number;
  propertyTitle: string;
  amount: number;
  date: string;
  type: "full" | "partial";
  buyerName: string;
  sellerName: string;
}

export default function PaymentsPage() {
  const [payments] = useState<Payment[]>([
    {
      id: 1,
      propertyId: 1,
      propertyTitle: "Modern Villa",
      amount: 100000,
      date: "2024-01-15",
      type: "partial",
      buyerName: "John Doe",
      sellerName: "Jane Smith",
    },
    {
      id: 2,
      propertyId: 1,
      propertyTitle: "Modern Villa",
      amount: 400000,
      date: "2024-02-15",
      type: "full",
      buyerName: "John Doe",
      sellerName: "Jane Smith",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "full" | "partial">("all");

  const filteredPayments = payments.filter(
    (p) => filter === "all" || p.type === filter
  );

  const totalAmount = filteredPayments.reduce(
    (sum, p) => sum + p.amount,
    0
  );

  const avgAmount =
    filteredPayments.length > 0
      ? Math.round(totalAmount / filteredPayments.length)
      : 0;

  return (
    <div className="p-6 text-black">
      {/* ================= HEADER ================= */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Payment History
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredPayments.length} payments found
          </p>
        </div>

        <select
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value as "all" | "full" | "partial")
          }
          className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Payments</option>
          <option value="full">Full Payments</option>
          <option value="partial">Partial Payments</option>
        </select>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Total Payments</p>
          <p className="text-2xl font-bold text-gray-900">
            {filteredPayments.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalAmount.toLocaleString()}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-sm text-gray-500">Average Payment</p>
          <p className="text-2xl font-bold text-blue-600">
            ₹{avgAmount.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-left">
                {[
                  "Date",
                  "Property",
                  "Buyer",
                  "Seller",
                  "Amount",
                  "Type",
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
              {filteredPayments.map((p, idx) => (
                <tr
                  key={p.id}
                  className={`transition ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-blue-50`}
                >
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {new Date(p.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                    {p.propertyTitle}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {p.buyerName}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                    {p.sellerName}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100 font-medium text-green-600">
                    ₹{p.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 border-b border-gray-100">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                        p.type === "full"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {p.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPayments.length === 0 && (
            <div className="text-center py-8 text-sm text-gray-500">
              No payments found for the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
