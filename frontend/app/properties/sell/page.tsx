"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";

interface Customer {
  id: number;
  name: string;
  type: "BUYER" | "SELLER" | "BOTH";
}

export default function SellPropertyPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: "",
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

  /* ================= LOAD BUYERS ================= */
  useEffect(() => {
    axiosInstance.get("/api/customers").then((res) => {
      setCustomers(
        res.data.data.data.filter(
          (c: Customer) => c.type === "BUYER" || c.type === "BOTH"
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
      fd.append("transaction_type", "SELL");
      fd.append("customer_id", formData.customer_id);
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

      formData.documents.forEach((file) => {
        fd.append("documents[]", file);
      });

      await axiosInstance.post("/api/properties", fd);

      router.push("/properties");
    } catch (err) {
      console.error(err);
      alert("Failed to sell property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 text-black">
      {/* HEADER */}
      <Link
        href="/properties"
        className="text-sm text-blue-600 hover:text-blue-800"
      >
        ← Back to Properties
      </Link>

      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">
        Sell Property
      </h1>

      {/* FORM */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4 text-sm"
      >
        {/* Buyer */}
        <div>
          <label className="block font-medium mb-1">Buyer</label>
          <select
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.customer_id}
            onChange={(e) =>
              setFormData({ ...formData, customer_id: e.target.value })
            }
          >
            <option value="">Select Buyer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block font-medium mb-1">Property Title</label>
          <input
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        {/* Category */}
        <div>
          <label className="block font-medium mb-1">Property Category</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            value={formData.category}
            onChange={(e) =>
              setFormData({ ...formData, category: e.target.value })
            }
          >
            {["FLAT", "HOUSE", "LAND", "COMMERCIAL", "AGRICULTURE"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>
        </div>

        {/* Rate */}
        <div>
          <label className="block font-medium mb-1">Selling Price</label>
          <input
            type="number"
            required
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, rate: e.target.value })
            }
          />
        </div>

        {/* GST */}
        <div>
          <label className="block font-medium mb-1">GST (%)</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, gst_percentage: e.target.value })
            }
          />
        </div>

        {/* Other Expenses */}
        <div>
          <label className="block font-medium mb-1">Other Expenses</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, other_expenses: e.target.value })
            }
          />
        </div>

        {/* Paid Amount */}
        <div>
          <label className="block font-medium mb-1">Paid Amount</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, paid_amount: e.target.value })
            }
          />
        </div>

        {/* Payment Mode */}
        <div>
          <label className="block font-medium mb-1">Payment Mode</label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2"
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
          <label className="block font-medium mb-1">Payment Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, payment_date: e.target.value })
            }
          />
        </div>

        {/* Invoice */}
        <div>
          <label className="block font-medium mb-1">Invoice No</label>
          <input
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, invoice_no: e.target.value })
            }
          />
        </div>

        {/* Date */}
        <div>
          <label className="block font-medium mb-1">Transaction Date</label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            onChange={(e) =>
              setFormData({ ...formData, date: e.target.value })
            }
          />
        </div>

        {/* Documents */}
        <div>
          <label className="block font-medium mb-1">Documents</label>
          <input
            type="file"
            multiple
            onChange={(e) =>
              setFormData({
                ...formData,
                documents: Array.from(e.target.files || []),
              })
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            disabled={loading}
            className="px-4 py-2 bg-[#0070BB] text-white rounded-md hover:bg-[#005A99]"
          >
            {loading ? "Saving..." : "Sell Property"}
          </button>

          <Link
            href="/properties"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
