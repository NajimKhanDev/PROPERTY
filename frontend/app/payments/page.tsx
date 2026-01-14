"use client";

import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

type PaymentType = "ALL" | "CREDIT" | "DEBIT";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // filters
  const [type, setType] = useState<PaymentType>("ALL");
  const [paymentMode, setPaymentMode] = useState("");
  const [search, setSearch] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // sorting
  const [sortBy, setSortBy] = useState("payment_date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // pagination
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, paymentMode, search, minAmount, startDate, endDate, sortBy, sortOrder, page]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const params: any = {
        page,
        per_page: 10,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      if (type !== "ALL") params.type = type;
      if (paymentMode) params.payment_mode = paymentMode;
      if (search) params.search = search;
      if (minAmount) params.min_amount = minAmount;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await axiosInstance.get(
        "http://127.0.0.1:8000/api/transactions/all",
        { params }
      );

      setPayments(res.data.data.data || []);
      setLastPage(res.data.data.last_page || 1);
    } catch (err) {
      console.error(err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = payments.reduce(
    (sum, p) => sum + Number(p.amount || 0),
    0
  );

  const avgAmount =
    payments.length > 0
      ? Math.round(totalAmount / payments.length)
      : 0;

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Payment History
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {payments.length} payments found
        </p>
      </div>

      {/* FILTERS */}
<div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
  {/* Header */}
  <div className="flex items-center justify-between mb-5">
    <div>
      <h2 className="text-sm font-semibold text-gray-900">
        Filter Payments
      </h2>
      <p className="text-xs text-gray-500 mt-0.5">
        Refine results using transaction details
      </p>
    </div>

    <button
      onClick={() => {
        setType("ALL");
        setPaymentMode("");
        setSearch("");
        setMinAmount("");
        setStartDate("");
        setEndDate("");
        setPage(1);
      }}
      className="text-xs font-medium text-gray-600 hover:text-gray-900 transition"
    >
      Reset all
    </button>
  </div>

  <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
    {/* Transaction Type */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Transaction
      </label>
      <select
        value={type}
        onChange={(e) => setType(e.target.value as PaymentType)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
      >
        <option value="ALL">All</option>
        <option value="CREDIT">Credit</option>
        <option value="DEBIT">Debit</option>
      </select>
    </div>

    {/* Payment Mode */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Payment Mode
      </label>
      <select
        value={paymentMode}
        onChange={(e) => setPaymentMode(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
      >
        <option value="">All</option>
        <option value="CASH">Cash</option>
        <option value="ONLINE">Online</option>
        <option value="UPI">UPI</option>
      </select>
    </div>

    {/* Min Amount */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Min Amount
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          ₹
        </span>
        <input
          type="number"
          value={minAmount}
          onChange={(e) => setMinAmount(e.target.value)}
          placeholder="0"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-3 py-2 text-sm
                     focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
        />
      </div>
    </div>

    {/* Start Date */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        From
      </label>
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
      />
    </div>

    {/* End Date */}
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">
        To
      </label>
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
      />
    </div>

    {/* Search */}
    <div className="md:col-span-2">
      <label className="block text-xs font-medium text-gray-500 mb-1">
        Search
      </label>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Property, buyer, seller…"
        className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                   focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
      />
    </div>
  </div>
</div>




      {/* STATS */}
      {/* <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
        {[
          { label: "Total Payments", value: payments.length },
          // { label: "Total Amount", value: `₹${totalAmount.toLocaleString("en-IN")}`, color: "text-green-600" },
          // { label: "Average Payment", value: `₹${avgAmount.toLocaleString("en-IN")}`, color: "text-blue-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-semibold`}>
              {s.value}
            </p>
          </div>
        ))}
      </div> */}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["S no","Date", "Property", "Buyer", "Seller", "Amount", "Type"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left font-medium text-gray-600"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  Loading payments…
                </td>
              </tr>
            )}

            {!loading &&
              payments.map((p,i) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-5 py-3">
                    {i + 1}
                  </td>
                  <td className="px-5 py-3">
                    {new Date(p.payment_date).toLocaleDateString("en-GB")}
                  </td>
                  <td className="px-5 py-3 font-medium">
                    {p.property?.title || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {p.sale_deal?.buyer?.name || "—"}
                  </td>
                  <td className="px-5 py-3">
                    {p.property?.seller?.name || "—"}
                  </td>
                  <td className="px-5 py-3 font-semibold text-green-600">
                    ₹{Number(p.amount).toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full font-medium ${p.type === "CREDIT"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                        }`}
                    >
                      {p.type}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {!loading && payments.length === 0 && (
          <div className="py-10 text-center text-gray-500">
            No payments found
          </div>
        )}
      </div>

      {/* PAGINATION */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-4 py-1.5 rounded-md bg-white shadow-sm ring-1 ring-gray-200 disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm text-gray-600">
          Page <b>{page}</b> of <b>{lastPage}</b>
        </span>

        <button
          disabled={page === lastPage}
          onClick={() => setPage((p) => p + 1)}
          className="px-4 py-1.5 rounded-md bg-white shadow-sm ring-1 ring-gray-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* INPUT STYLE
      <style jsx global>{`
  .filter-label {
    @apply block text-xs font-medium text-gray-500 mb-1;
  }

  .filter-input {
    @apply w-full rounded-lg border border-gray-200 bg-gray-50
           px-3 py-2 text-sm text-gray-900
           focus:border-blue-500 focus:ring-2 focus:ring-blue-100
           outline-none transition;
  }
`}</style> */}

    </div>
  );
}
