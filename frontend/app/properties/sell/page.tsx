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
  owner_id: number; // seller id
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
    buyer_id: "",
    rate: "",
    paid_amount: "",
    invoice_no: "",
    document: null as File | null,
  });

  /* ================= LOAD PROPERTIES ================= */
  useEffect(() => {
    axiosInstance.get(ProjectApi.all_properties).then((res) => {
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
    if (!selectedProperty) {
      alert("Property not selected");
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();

      fd.append("transaction_type", "SELL");
      // fd.append("seller_id", String(selectedProperty.owner_id));
      fd.append("buyer_id", formData.buyer_id);

      fd.append("title", selectedProperty.title);
      fd.append("category", selectedProperty.category);

      fd.append("quantity", "1");
      fd.append("rate", formData.rate);

      fd.append("invoice_no", formData.invoice_no);
      fd.append("paid_amount", formData.paid_amount);

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
      setOpenConfirm(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-300 " +
    "focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 text-black">
      <div className="max-w-2xl mx-auto">
        <Link href="/properties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>

        <h1 className="text-2xl font-bold text-center mt-4 mb-6">
          Sell Property
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpenConfirm(true);
          }}
          className="bg-white p-8 rounded-xl shadow space-y-4"
        >
          {/* PROPERTY */}
          <select
            required
            className={inputClass}
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
                {p.title}
              </option>
            ))}
          </select>

          {/* BUYER */}
          <select
            required
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, buyer_id: e.target.value })
            }
          >
            <option value="">Select Buyer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="number"
            required
            placeholder="Sale Rate"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, rate: e.target.value })
            }
          />

          <input
            type="number"
            required
            placeholder="Paid Amount"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, paid_amount: e.target.value })
            }
          />

          <input
            required
            placeholder="Invoice No"
            className={inputClass}
            onChange={(e) =>
              setFormData({ ...formData, invoice_no: e.target.value })
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
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md"
            >
              Sell Property
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRM MODAL */}
      {openConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />

          <div className="relative bg-white p-6 rounded-xl shadow w-full max-w-sm">
            <h3 className="text-lg font-semibold">
              Confirm Property Sale
            </h3>

            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to sell this property?
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setOpenConfirm(false)}
                className="px-4 py-2 bg-gray-100 rounded-md"
              >
                Cancel
              </button>

              <button
                onClick={submitSale}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
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
