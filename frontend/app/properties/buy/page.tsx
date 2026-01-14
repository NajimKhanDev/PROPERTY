"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";

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
    transaction_type: "PURCHASE",

    // basic
    title: "",
    category: "LAND",
    address: "",

    // plot & payment
    plot_number: "",
    khata_number: "",
    area_dismil: 0,
    per_dismil_amount: "",
    total_amount: 0,
    paid_amount: "",
    due_amount: 0,
    period_years: "1",
    amount_per_month: 0,
    payment_mode: "",
    transaction_no: "",

    // other
    invoice_no: "",
    date: "",
    payment_date: "",

    // files
    payment_receipt: null as File | null,
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

  /* ================= AUTO CALCULATION ================= */
  useEffect(() => {
    const dismil = Number(formData.area_dismil || 0);
    const per = Number(formData.per_dismil_amount || 0);
    const paid = Number(formData.paid_amount || 0);
    const years = Number(formData.period_years || 1);

    const total = dismil * per;
    const due = total - paid;

    const rawPerMonth = years > 0 ? due / (years * 12) : 0;
    const perMonth = Math.round(rawPerMonth); // ✅ round off

    setFormData((prev) => ({
      ...prev,
      total_amount: total,
      due_amount: due,
      amount_per_month: perMonth,
    }));
  }, [
    formData.area_dismil,
    formData.per_dismil_amount,
    formData.paid_amount,
    formData.period_years,
  ]);


  /* ================= SUBMIT ================= */
  const confirmSubmit = async () => {
    try {
      setLoading(true);

      const fd = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "payment_receipt") return;
        fd.append(key, String(value ?? ""));
      });

      if (formData.payment_receipt) {
        fd.append("payment_receipt", formData.payment_receipt);
      }

      await axiosInstance.post(ProjectApi.create_properties, fd);

      toast.success("Property purchased successfully");
      router.push("/properties");

    } catch (err: any) {
      console.error(err);

      // ✅ Laravel validation errors
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;

        Object.values(errors).forEach((messages: any) => {
          if (Array.isArray(messages)) {
            messages.forEach((msg) => toast.error(msg));
          }
        });
      }
      // ✅ Fallback message
      else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      }
      else {
        toast.error("Failed to buy property");
      }

    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };


  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-300 bg-white " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500";

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 text-black">
      <div className="max-w-5xl mx-auto">
        <Link href="/properties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>

        <h1 className="text-2xl font-bold text-center my-6">
          Buy Property
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmOpen(true);
          }}
          className="bg-white p-8 rounded-xl shadow space-y-10"
        >

          {/* ================= BASIC INFO ================= */}
          <section>
            <h2 className="font-semibold text-lg mb-4">Basic Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Seller *</label>
                <select
                  className={inputClass}
                  required
                  onChange={(e) =>
                    setFormData({ ...formData, seller_id: e.target.value })
                  }
                >
                  <option value="">Select Seller</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  {["LAND", "FLAT", "HOUSE"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Property Title</label>
                <input
                  className={inputClass}
                  required
                  placeholder="Enter property title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                />

              </div>

              <div className="md:col-span-2">
                <label className={labelClass}>Property Address</label>
                <textarea
                  rows={3}
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                />
              </div>
            </div>
          </section>

          {/* ================= PAYMENT & PLOT ================= */}
          <section>
            <h2 className="font-semibold text-lg mb-4">Payment & Plot</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div>
                <label className={labelClass}>Plot Number *</label>
                <input className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, plot_number: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Khata Number *</label>
                <input className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, khata_number: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Dismil <span className="text-red-500">*</span>
                </label>

                <input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="Enter area in dismil"
                  className={inputClass}
                  onChange={(e) => {
                    const value = Math.max(0, Number(e.target.value));
                    setFormData({ ...formData, area_dismil: value });
                  }}
                />
              </div>


              <div>
                <label className={labelClass}>Per Dismil Amount *</label>
                <input type="number" className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, per_dismil_amount: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Total Amount</label>
                <input readOnly className={`${inputClass} bg-gray-100`}
                  value={formData.total_amount.toFixed(2)}
                />
              </div>

              <div>
                <label className={labelClass}>Pay Amount</label>
                <input type="number" className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, paid_amount: e.target.value })
                  }
                />
              </div>

              <div>
                <label className={labelClass}>Due Amount</label>
                <input readOnly className={`${inputClass} bg-gray-100`}
                  value={formData.due_amount.toFixed(2)}
                />
              </div>

              <div>
                <label className={labelClass}>Period (Years)</label>
                <select
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, period_years: e.target.value })
                  }
                >
                  {[1, 2, 3, 5, 10].map((y) => (
                    <option key={y} value={y}>{y} Year</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Amount / Month</label>
                <input readOnly className={`${inputClass} bg-gray-100`}
                  value={formData.amount_per_month.toFixed(2)}
                />
              </div>

              <div className="md:col-span-3">
                <label className={labelClass}>Payment Mode</label>
                <select
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, payment_mode: e.target.value })
                  }
                >
                  <option value="">Select Payment Mode</option>
                  <option value="BANK">Bank</option>
                  <option value="CASH">Cash</option>
                  <option value="ONLINE">Online</option>
                </select>
              </div>

              {(formData.payment_mode === "BANK" ||
                formData.payment_mode === "ONLINE") && (
                  <div className="md:col-span-3">
                    <label className={labelClass}>
                      Transaction No <span className="text-red-500">*</span>
                    </label>

                    <input
                      type="text"
                      placeholder="Enter transaction number"
                      className={inputClass}
                      required
                      onChange={(e) =>
                        setFormData({ ...formData, transaction_no: e.target.value })
                      }
                    />
                  </div>
                )}


              <div className="md:col-span-3">
                <label className={`${labelClass} mb-1 block`}>
                  Payment Receipt
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="relative">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_receipt: e.target.files?.[0] || null,
                      })
                    }
                    className="
        w-full rounded-lg border border-gray-300 bg-white
        px-4 py-2 text-sm text-gray-700
        file:mr-4 file:rounded-md file:border-0
        file:bg-blue-600 file:px-4 file:py-2
        file:text-sm file:font-medium file:text-white
        hover:file:bg-blue-700
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Accepted formats: JPG, PNG, PDF · Max size 5MB
                </p>
              </div>

            </div>
          </section>

          {/* ================= ACTION ================= */}
          <button
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-medium hover:bg-blue-700"
          >
            {loading ? "Saving..." : "Buy Property"}
          </button>
        </form>
      </div>

      {/* ================= CONFIRM MODAL ================= */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center">
          {/* BLUR + DIM OVERLAY */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setConfirmOpen(false)}
          />

          {/* MODAL */}
          <div className="relative bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm space-y-4">
            <p className="font-semibold text-gray-800">
              Confirm property purchase?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
