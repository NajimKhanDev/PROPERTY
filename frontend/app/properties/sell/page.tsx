"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

/* ================= TYPES ================= */

interface Customer {
  id: number;
  name: string;
  type: "BUYER" | "SELLER" | "BOTH";
}

interface Property {
  id: number;
  title: string;
  category: string;
}

interface PropertyDetails {
  id: number;
  title: string;
  category: string;
  address: string;
  area_dismil: any;
  total_amount: string;
}

/* ================= COMPONENT ================= */

export default function SellPropertyPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);

  const [loading, setLoading] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [formData, setFormData] = useState({
    property_id: "",
    customer_id: "",

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

    payment_receipt: null as File | null,
  });

  /* ================= LOAD PROPERTIES ================= */
  useEffect(() => {
    axiosInstance
      .get(ProjectApi.all_properties_ready_to_sell)
      .then((res) => setProperties(res.data.data || []));
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

  /* ================= AUTO CALCULATION ================= */
  useEffect(() => {
    const dismil = Number(formData.area_dismil || 0);
    const per = Number(formData.per_dismil_amount || 0);
    const paid = Number(formData.paid_amount || 0);
    const years = Number(formData.period_years || 1);

    const total = dismil * per;
    const due = total - paid;

    const rawPerMonth = years > 0 ? due / (years * 12) : 0;
    const perMonth = Math.round(rawPerMonth); // 👈 round off

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

  /* ================= SUBMIT SALE ================= */
  const submitSale = async () => {

    if (
      (formData.payment_mode === "BANK" ||
        formData.payment_mode === "ONLINE") &&
      !formData.transaction_no
    ) {
      alert("Transaction number is required");
      return;
    }


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

      // console.log(fd, "fd=========>")

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


  // console.log(propertyDetails,"propertyDetails=========>")
  const inputClass =
    "w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 text-black">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* HEADER */}
        <div>
          <Link href="/properties" className="text-sm text-blue-600">
            ← Back to Properties
          </Link>
          <h1 className="text-2xl font-bold mt-2">Sell Property</h1>
          <p className="text-sm text-gray-500">
            Complete selling details and payment structure
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setOpenConfirm(true);
          }}
          className="bg-white rounded-xl shadow p-8 space-y-8"
        >
          {/* PROPERTY */}
          <Field label="Property">
            <select
              required
              className={inputClass}
              onChange={async (e) => {
                const id = e.target.value;

                if (!id) return;

                const res = await axiosInstance.get(`/properties/${id}`);
                const data = res.data;

                setPropertyDetails(data);

                setFormData((prev) => ({
                  ...prev,
                  property_id: id,

                  // ✅ AUTO-FILL
                  plot_number: data.plot_number || "",
                  khata_number: data.khata_number || "",
                  area_dismil: Number(data.area_dismil || 0),

                  // reset payment-related fields if needed
                  per_dismil_amount: "",
                  paid_amount: "",
                  due_amount: 0,
                  total_amount: 0,
                  amount_per_month: 0,
                }));
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

          {propertyDetails && (
            <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-2">
              <h4 className="font-semibold text-gray-800 mb-2">
                Property Details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Title</p>
                  <p className="font-medium text-gray-800">
                    {propertyDetails.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Category</p>
                  <p className="font-medium text-gray-800">
                    {propertyDetails.category}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Area (Dismil)</p>
                  <p className="font-medium text-gray-800">
                    {propertyDetails.area_dismil}
                  </p>
                </div>
              </div>
            </div>
          )}


          {/* BUYER */}
          <Field label="Buyer">
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
          </Field>

          {/* ================= PAYMENT & PLOT ================= */}
          <section>
            <h2 className="font-semibold text-lg mb-4">
              Payment & Plot Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <Field label="Plot Number *">
                <input
                  className={inputClass}
                  value={formData.plot_number}
                  onChange={(e) =>
                    setFormData({ ...formData, plot_number: e.target.value })
                  }
                  readOnly
                />
              </Field>


              <Field label="Khata Number *">
                <input
                  className={inputClass}
                  value={formData.khata_number}
                  onChange={(e) =>
                    setFormData({ ...formData, khata_number: e.target.value })
                  }
                  readOnly
                />
              </Field>


              <Field label="Dismil *">
                <input
                  type="number"
                  min={0}
                  max={propertyDetails?.area_dismil || 0}
                  step="0.01"
                  placeholder="Enter area in dismil"
                  className={inputClass}
                  value={formData.area_dismil}
                  onChange={(e) => {
                    const maxDismil = Number(propertyDetails?.area_dismil || 0);
                    let value = Number(e.target.value);

                    if (value < 0) value = 0;
                    if (value > maxDismil) value = maxDismil;

                    setFormData({ ...formData, area_dismil: value });
                  }}
                />
              </Field>



              <Field label="Per Dismil Amount *">
                <input
                  type="number"
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      per_dismil_amount: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Total Amount">
                <input
                  readOnly
                  className={`${inputClass} bg-gray-100`}
                  value={formData.total_amount.toFixed(2)}
                />
              </Field>

              <Field label="Pay Amount">
                <input
                  type="number"
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({ ...formData, paid_amount: e.target.value })
                  }
                />
              </Field>

              <Field label="Due Amount">
                <input
                  readOnly
                  className={`${inputClass} bg-gray-100`}
                  value={formData.due_amount.toFixed(2)}
                />
              </Field>

              <Field label="Period (Years)">
                <select
                  className={inputClass}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      period_years: e.target.value,
                    })
                  }
                >
                  {[1, 2, 3, 5, 10].map((y) => (
                    <option key={y} value={y}>
                      {y} Year
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Amount / Month">
                <input
                  readOnly
                  className={`${inputClass} bg-gray-100`}
                  value={formData.amount_per_month.toFixed(2)}
                />
              </Field>

              <div className="md:col-span-3">
                <Field label="Payment Mode">
                  <select
                    className={inputClass}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payment_mode: e.target.value,
                        transaction_no:
                          e.target.value === "CASH" ? "" : formData.transaction_no,
                      })
                    }
                  >

                    <option value="">Select Payment Mode</option>
                    <option value="BANK">Bank</option>
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </Field>
              </div>

              {/* Transaction No (BANK / ONLINE only) */}
              {(formData.payment_mode === "BANK" ||
                formData.payment_mode === "ONLINE") && (
                  <div className="md:col-span-3">
                    <Field label="Transaction No *">
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Enter transaction number"
                        value={formData.transaction_no}
                        required
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            transaction_no: e.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                )}

              <div className="md:col-span-3">
                <Field label="Payment Receipt">
                  <div className="space-y-1">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payment_receipt: e.target.files?.[0] || null,
                        })
                      }
                      className="
          w-full rounded-lg border border-gray-300 bg-white
          px-3 py-2 text-sm text-gray-700
          file:mr-4 file:rounded-md file:border-0
          file:bg-blue-600 file:px-4 file:py-2
          file:text-xs file:font-medium file:text-white
          hover:file:bg-blue-700
          focus:outline-none focus:ring-2 focus:ring-blue-500
        "
                    />

                    <p className="text-xs text-gray-500">
                      Accepted formats: JPG, PNG, PDF · Max size 5MB
                    </p>

                    {formData.payment_receipt && (
                      <p className="text-xs text-green-600">
                        Selected file: {formData.payment_receipt.name}
                      </p>
                    )}
                  </div>
                </Field>
              </div>

            </div>
          </section>

          {/* ACTIONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Link
              href="/properties"
              className="px-4 py-2 bg-gray-100 rounded-md"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 text-white rounded-md"
            >
              Proceed to Sell
            </button>
          </div>
        </form>
      </div>

      {/* CONFIRM MODAL */}
      {openConfirm && (
        <div className="fixed inset-0 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white p-6 rounded-xl space-y-4">
            <p className="font-semibold">Confirm property sale?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setOpenConfirm(false)}>
                Cancel
              </button>
              <button
                onClick={submitSale}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded"
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

/* ================= HELPERS ================= */

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
