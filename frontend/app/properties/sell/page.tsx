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
  status: string;
}

export default function SellPropertyPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    property_id: "",
    customer_id: "",
    sale_rate: "",
    gst_percentage: "",
    other_charges: "",
    discount: "",
    paid_amount: "",
    payment_mode: "ONLINE",
    reference_no: "",
    sale_date: "",
    invoice_no: "",
    remarks: "",
    document: null as File | null,
  });

  /* ================= LOAD PROPERTIES ================= */
  useEffect(() => {
    axiosInstance.get(ProjectApi.all_properties).then((res) => {
    // axiosInstance.get("/properties").then((res) => {
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

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!confirm("Are you sure you want to sell this property?")) return;

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("property_id", formData.property_id);
      fd.append("customer_id", formData.customer_id);
      fd.append("sale_rate", formData.sale_rate);
      fd.append("gst_percentage", formData.gst_percentage);
      fd.append("other_charges", formData.other_charges);
      fd.append("discount", formData.discount);
      fd.append("paid_amount", formData.paid_amount);
      fd.append("payment_mode", formData.payment_mode);
      fd.append("reference_no", formData.reference_no);
      fd.append("sale_date", formData.sale_date);
      fd.append("invoice_no", formData.invoice_no);
      fd.append("remarks", formData.remarks);

      if (formData.document) {
        fd.append("document", formData.document);
      }

      await axiosInstance.post(ProjectApi.sell_property, fd);
      router.push("/properties");
    } catch (err) {
      console.error(err);
      alert("Failed to sell property");
    } finally {
      setLoading(false);
    }
  };

  /* ================= INPUT STYLE ================= */
  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-300 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/properties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>

        <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6 text-center">
          Sell Property
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-md p-8 space-y-5 text-sm"
        >
          {/* Property */}
          <div>
            <label className="block font-medium mb-1">Property</label>
            <select
              required
              className={inputClass}
              onChange={(e) =>
                setFormData({ ...formData, property_id: e.target.value })
              }
            >
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Buyer */}
          <div>
            <label className="block font-medium mb-1">Buyer</label>
            <select
              required
              className={inputClass}
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

          {/* Sale Rate */}
          <input
            type="number"
            placeholder="Sale Amount"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, sale_rate: e.target.value })
            }
            required
          />

          {/* GST */}
          <input
            type="number"
            placeholder="GST %"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, gst_percentage: e.target.value })
            }
          />

          {/* Other Charges */}
          <input
            type="number"
            placeholder="Other Charges"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, other_charges: e.target.value })
            }
          />

          {/* Discount */}
          <input
            type="number"
            placeholder="Discount"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, discount: e.target.value })
            }
          />

          {/* Paid */}
          <input
            type="number"
            placeholder="Paid Amount"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, paid_amount: e.target.value })
            }
          />

          {/* Payment Mode */}
          <select
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, payment_mode: e.target.value })
            }
          >
            {["ONLINE", "CASH", "CHEQUE"].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>

          <input
            placeholder="Reference No"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, reference_no: e.target.value })
            }
          />

          <input
            type="date"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, sale_date: e.target.value })
            }
          />

          <input
            placeholder="Invoice No"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, invoice_no: e.target.value })
            }
          />

          <textarea
            placeholder="Remarks"
            rows={3}
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, remarks: e.target.value })
            }
          />

          <input
            type="file"
            onChange={(e) =>
              setFormData({
                ...formData,
                document: e.target.files?.[0] || null,
              })
            }
          />

          <div className="flex justify-end gap-3 pt-4">
            <Link
              href="/properties"
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </Link>

            <button
              disabled={loading}
              className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {loading ? "Saving..." : "Sell Property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
