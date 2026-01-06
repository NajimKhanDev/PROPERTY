"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

interface Customer {
  id: number;
  name: string;
  type: "BUYER" | "SELLER" | "BOTH";
}

export default function BuyPropertyPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);


  const [formData, setFormData] = useState({
    seller_id: "",
    title: "",
    category: "FLAT",
    rate: "",
    gst_percentage: "",
    other_expenses: "",
    paid_amount: "",
    payment_mode: "ONLINE",
    payment_date: "",
    invoice_no: "",
    date: "",
    documents: [] as File[],
  });

  /* ================= LOAD SELLERS ================= */
  useEffect(() => {
    axiosInstance.get(ProjectApi.all_customers).then((res) => {
      setCustomers(
        res.data.data.data.filter(
          (c: Customer) => c.type === "SELLER" || c.type === "BOTH"
        )
      );
    });
  }, []);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("transaction_type", "PURCHASE");
      fd.append("seller_id", formData.seller_id);
      fd.append("title", formData.title);
      fd.append("category", formData.category);
      fd.append("quantity", "1");
      fd.append("rate", formData.rate);
      fd.append("gst_percentage", formData.gst_percentage);
      fd.append("other_expenses", formData.other_expenses);
      fd.append("paid_amount", formData.paid_amount);
      fd.append("payment_mode", formData.payment_mode);
      fd.append("payment_date", formData.payment_date);
      fd.append("invoice_no", formData.invoice_no);
      fd.append("date", formData.date);

      formData.documents.forEach((file) =>
        fd.append("documents[]", file)
      );

      await axiosInstance.post(ProjectApi.create_properties, fd);
      router.push("/properties");
    } catch (err) {
      console.error(err);
      alert("Failed to buy property");
    } finally {
      setLoading(false);
    }
  };

  const confirmSubmit = async () => {
    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("transaction_type", "PURCHASE");
      fd.append("seller_id", formData.seller_id);
      fd.append("title", formData.title);
      fd.append("category", formData.category);
      fd.append("quantity", "1");
      fd.append("rate", formData.rate);
      fd.append("gst_percentage", formData.gst_percentage);
      fd.append("other_expenses", formData.other_expenses);
      fd.append("paid_amount", formData.paid_amount);
      fd.append("payment_mode", formData.payment_mode);
      fd.append("payment_date", formData.payment_date);
      fd.append("invoice_no", formData.invoice_no);
      fd.append("date", formData.date);

      formData.documents.forEach((file) =>
        fd.append("documents[]", file)
      );

      await axiosInstance.post(ProjectApi.create_properties, fd);

      router.push("/properties");
    } catch (err) {
      console.error(err);
      alert("Failed to buy property");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };


  /* ================= INPUT STYLE ================= */
  const inputClass =
    "w-full px-3 py-2 rounded-md bg-white " +
    "border border-gray-300 " +
    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500";

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 text-black">
      <div className="max-w-2xl mx-auto">
        {/* HEADER */}
        <Link href="/properties" className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Properties
        </Link>

        <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6 text-center">
          Buy Property
        </h1>

        {/* FORM CARD */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
          className="bg-white rounded-2xl shadow-md p-8 space-y-5 text-sm"
        >
          {/* Seller */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Seller
            </label>
            <select
              required
              className={inputClass}
              value={formData.seller_id}
              onChange={(e) =>
                setFormData({ ...formData, seller_id: e.target.value })
              }
            >
              <option value="">Select Seller</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Property Title
            </label>
            <input
              className={inputClass}
              placeholder="2 BHK Flat – Vijay Nagar"
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Property Category
            </label>
            <select
              className={inputClass}
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {['LAND', 'FLAT', 'HOUSE', 'COMMERCIAL', 'AGRICULTURE'].map(
                (c) => (
                  <option key={c}>{c}</option>
                )
              )}
            </select>
          </div>

          {/* Rate */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Purchase Price
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="4500000"
              onChange={(e) =>
                setFormData({ ...formData, rate: e.target.value })
              }
              required
            />
          </div>

          {/* GST */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              GST Percentage
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="5"
              onChange={(e) =>
                setFormData({ ...formData, gst_percentage: e.target.value })
              }
            />
          </div>

          {/* Other Expenses */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Other Expenses
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="50000"
              onChange={(e) =>
                setFormData({ ...formData, other_expenses: e.target.value })
              }
            />
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Paid Amount
            </label>
            <input
              type="number"
              className={inputClass}
              placeholder="1000000"
              onChange={(e) =>
                setFormData({ ...formData, paid_amount: e.target.value })
              }
            />
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Payment Mode
            </label>
            <select
              className={inputClass}
              value={formData.payment_mode}
              onChange={(e) =>
                setFormData({ ...formData, payment_mode: e.target.value })
              }
            >
              {["ONLINE", "CASH", "CHEQUE"].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Payment Date
            </label>
            <input
              type="date"
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
            />
          </div>

          {/* Invoice */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Invoice Number
            </label>
            <input
              className={inputClass}
              placeholder="INV-002"
              onChange={(e) =>
                setFormData({ ...formData, invoice_no: e.target.value })
              }
            />
          </div>

          {/* Date */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Transaction Date
            </label>
            <input
              type="date"
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
            />
          </div>

          {/* Documents */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">
              Documents
            </label>
            <input
              type="file"
              multiple
              className="block w-full text-sm text-gray-600"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  documents: Array.from(e.target.files || []),
                })
              }
            />
          </div>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/properties"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </Link>

            <button
              disabled={loading}
              className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {loading ? "Saving..." : "Buy Property"}
            </button>
          </div>
        </form>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Purchase
            </h2>

            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to buy this property?
            </p>

            <div className="mt-4 space-y-1 text-sm text-gray-700">
              <p><strong>Title:</strong> {formData.title}</p>
              <p><strong>Price:</strong> ₹{Number(formData.rate || 0).toLocaleString()}</p>
              <p><strong>Paid:</strong> ₹{Number(formData.paid_amount || 0).toLocaleString()}</p>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={confirmSubmit}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {loading ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
