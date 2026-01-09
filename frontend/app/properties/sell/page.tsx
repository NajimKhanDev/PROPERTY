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

interface Property {
  id: number;
  title: string;
  category: string;
  owner_id: number;
}

export default function SellPropertyPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] =
    useState<Property | null>(null);

  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [formData, setFormData] = useState({
    property_id: "",
    customer_id: "",
    sale_rate: "",
    gst_percentage: "",
    paid_amount: "",
    document: null as File | null,
  });

  /* ================= LOAD PROPERTIES ================= */
  useEffect(() => {
    axiosInstance.get(ProjectApi.all_properties_ready_to_sell).then((res) => {
      setProperties(res.data.data || []);
    });
  }, []);

  /* ================= LOAD BUYERS ================= */
  useEffect(() => {
    axiosInstance.get(ProjectApi.all_customers).then((res) => {
      setCustomers(
        res.data.data.data.filter(
          (c: Customer) => c.type === "BUYER" || c.type === "BOTH"
        )
      );
    });
  }, []);

  /* ================= SUBMIT SALE ================= */
  const submitSale = async () => {
    if (!selectedProperty) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("property_id", formData.property_id);
      fd.append("customer_id", formData.customer_id);
      fd.append("sale_rate", formData.sale_rate);

      if (formData.gst_percentage)
        fd.append("gst_percentage", formData.gst_percentage);

      if (formData.paid_amount)
        fd.append("paid_amount", formData.paid_amount);

      if (formData.document)
        fd.append("document", formData.document);

      await axiosInstance.post(ProjectApi.sell_property, fd);
      router.push("/properties");
    } catch (err) {
      console.error(err);
      alert("Failed to sell property");
    } finally {
      setLoading(false);
      setOpenConfirm(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-300 text-sm " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 text-black">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <Link
            href="/properties"
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Properties
          </Link>

          <h1 className="text-2xl font-bold mt-2">
            Sell Property
          </h1>
          <p className="text-sm text-gray-500">
            Complete the sale details and confirm the transaction
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpenConfirm(true);
          }}
          className="bg-white rounded-xl shadow-sm border p-8 space-y-6"
        >
          {/* PROPERTY */}
          <Field label="Property">
            <select
              required
              className={inputClass}
              value={formData.property_id}
              onChange={(e) => {
                const prop = properties.find(
                  (p) => p.id === Number(e.target.value)
                );
                setSelectedProperty(prop || null);
                setFormData({ ...formData, property_id: e.target.value });
              }}
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.category})
                </option>
              ))}
            </select>
          </Field>

          {/* BUYER */}
          <Field label="Buyer">
            <select
              required
              className={inputClass}
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
          </Field>

          {/* PRICING */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Sale Rate">
              <input
                type="number"
                required
                placeholder="₹ Sale amount"
                className={inputClass}
                value={formData.sale_rate}
                onChange={(e) =>
                  setFormData({ ...formData, sale_rate: e.target.value })
                }
              />
            </Field>

            <Field label="GST % (optional)">
              <input
                type="number"
                placeholder="GST"
                className={inputClass}
                value={formData.gst_percentage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    gst_percentage: e.target.value,
                  })
                }
              />
            </Field>

            <Field label="Paid Amount (optional)">
              <input
                type="number"
                placeholder="Advance paid"
                className={inputClass}
                value={formData.paid_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paid_amount: e.target.value,
                  })
                }
              />
            </Field>
          </div>

          {/* DOCUMENT */}
          <Field label="Agreement / Document (optional)">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".pdf,.jpg,.png"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    document: e.target.files?.[0] || null,
                  })
                }
                className="text-sm"
              />
              {formData.document && (
                <span className="text-xs text-green-600">
                  {formData.document.name}
                </span>
              )}
            </div>
          </Field>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/properties"
              className="px-4 py-2 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Proceed to Sell
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRM MODAL */}
      {openConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-semibold">
              Confirm Property Sale
            </h3>

            <p className="text-sm text-gray-600">
              This action will mark the property as sold and
              create sale records.
            </p>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 text-sm bg-gray-100 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={submitSale}
                disabled={loading}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md"
              >
                {loading ? "Saving..." : "Confirm Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= SMALL UI HELPERS ================= */

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1">
    <label className="text-sm font-medium text-gray-700">
      {label}
    </label>
    {children}
  </div>
);
