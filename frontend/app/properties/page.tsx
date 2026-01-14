"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axiosInstance from "../api/axiosInstance";
import ProjectApi from "../api/ProjectApis";

type TabType = "PURCHASE" | "SELL";

export default function PropertiesPage() {
  const [activeTab, setActiveTab] = useState<TabType>("PURCHASE");
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  /* ================= FETCH ================= */
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const url =
        activeTab === "PURCHASE"
          ? `${ProjectApi.all_properties}?page=${page}&transaction_type=PURCHASE`
          : `${ProjectApi.sell_property}?page=${page}`;

      const res = await axiosInstance.get(url);

      setList(res.data.data || []);
      setLastPage(res.data.last_page || 1);
    } catch (err) {
      console.error("Failed to load data", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-black">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Property Management
        </h1>

        {activeTab === "PURCHASE" && (
          <Link
            href="/properties/buy"
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm"
          >
            Buy Property
          </Link>
        )}

        {activeTab === "SELL" && (
          <Link
            href="/properties/sell"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm"
          >
            Sell Property
          </Link>
        )}
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-4">
        {[
          { label: "Purchased Properties", value: "PURCHASE" },
          { label: "Sold Properties", value: "SELL" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => {
              setActiveTab(t.value as TabType);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === t.value
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {[
                "S.No",
                "Title",
                "Category",
                "Buyer / Seller",
                "Amount",
                "Status",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left border-b border-gray-300">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && list.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  No records found
                </td>
              </tr>
            )}

            {!loading &&
              list.map((row, idx) => {
                const title =
                  activeTab === "SELL"
                    ? row.property?.title
                    : row.title;

                const category =
                  activeTab === "SELL"
                    ? row.property?.category
                    : row.category;

                const party =
                  activeTab === "SELL"
                    ? row.buyer?.name
                    : row.seller?.name;

                const amount =
                  activeTab === "SELL"
                    ? row.total_sale_amount
                    : row.total_amount;

                const status =
                  activeTab === "SELL"
                    ? row.property?.status
                    : row.status;

                return (
                  <tr key={row.id} className="hover:bg-blue-50">
                    <td className="px-4 py-3">
                      {(page - 1) * 10 + idx + 1}
                    </td>

                    <td className="px-4 py-3 font-medium">
                      {title}
                    </td>

                    <td className="px-4 py-3">
                      {category}
                    </td>

                    <td className="px-4 py-3">
                      {party || "—"}
                    </td>

                    <td className="px-4 py-3">
                      ₹
                      {Number(amount || 0).toLocaleString("en-IN")}
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                        {status}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={
                          activeTab === "SELL"
                            ? `/properties/sellview?id=${row.id}`
                            : `/properties/view?id=${row.id}`
                        }
                        className="text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end items-center gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm">
          Page <b>{page}</b> of <b>{lastPage}</b>
        </span>

        <button
          disabled={page === lastPage}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
