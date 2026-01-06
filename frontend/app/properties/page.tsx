"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "../api/axiosInstance";
import ProjectApi from "../api/ProjectApis";

interface Property {
  id: number;
  title: string;
  address: string;
  rate: string;
  total_amount: string;
  customer_id: number;
  transaction_type: "PURCHASE" | "SELL";
  category: string;
  status: "AVAILABLE" | "SOLD" | "PENDING";
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROPERTIES ================= */
  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(ProjectApi.all_properties);
      const json = res.data;

      setProperties(json.data || []);
    } catch (error) {
      console.error("Error loading properties:", error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-black">
      {/* ================= HEADER ================= */}
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

      {/* ================= TABLE ================= */}
      <div className="bg-white p-5 rounded-xl shadow-sm">
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-left">
                {[
                  "S.no",
                  "Title",
                  "Address",
                  "Price",
                  "Transaction",
                  "Status",
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
              {/* LOADING */}
              {loading && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    Loading properties...
                  </td>
                </tr>
              )}

              {/* EMPTY */}
              {!loading && properties.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No properties found
                  </td>
                </tr>
              )}

              {/* DATA */}
              {!loading &&
                properties.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`transition ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                      {idx+1}
                    </td>
                    <td className="px-4 py-3 border-b border-gray-100 font-medium text-gray-900">
                      {p.title}
                    </td>

                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                      {p.address}
                    </td>

                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                      ₹{Number(p.rate).toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3 border-b border-gray-100 text-gray-700">
                      {p.transaction_type}
                    </td>

                    <td className="px-4 py-3 border-b border-gray-100">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          p.status === "AVAILABLE"
                            ? "bg-green-100 text-green-700"
                            : p.status === "SOLD"
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
