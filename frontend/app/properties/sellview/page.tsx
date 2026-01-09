"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";

export default function PropertyViewPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [dealData, setDealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [openPayment, setOpenPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_mode: "ONLINE",
    reference_no: "",
    payment_date: "",
    remarks: "",
  });

  /* ================= FETCH PROPERTY ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchProperty();
    fetchSellDeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `${ProjectApi.all_properties}/${propertyId}`
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to load property", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH SELL DEAL ================= */
  const fetchSellDeal = async () => {
    try {
      const res = await axiosInstance.get(
        `/transactions/sell-deal/${propertyId}`
      );
      if (res.data?.status) {
        setDealData(res.data);
      }
    } catch (err) {
      console.error("Failed to load sell deal", err);
    }
  };

  /* ================= ADD PAYMENT ================= */
const submitPayment = async () => {
  try {
    setSavingPayment(true);

    const res = await axiosInstance.post("/transactions", {
      property_id: propertyId,
      sell_property_id: dealData.deal_summary.sale_id,
      amount: paymentData.amount,
      payment_mode: paymentData.payment_mode,
      reference_no: paymentData.reference_no,
      payment_date: paymentData.payment_date,
      remarks: paymentData.remarks,
      type: "CREDIT",
    });

    toast.success("Payment added successfully");

    setOpenPayment(false);
    setPaymentData({
      amount: "",
      payment_mode: "ONLINE",
      reference_no: "",
      payment_date: "",
      remarks: "",
    });

    fetchSellDeal(); // refresh list
  } catch (err: any) {
    const message =
      err?.response?.data?.message || "Failed to add payment";

    toast.error(message); // ✅ SHOW BACKEND MESSAGE
  } finally {
    setSavingPayment(false);
  }
};


  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading property details...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        Property not found
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 text-black">
      {/* HEADER */}
      <div>
        <Link href="/properties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Property Details
        </h1>
      </div>

      {/* ================= PROPERTY INFO ================= */}
      <Section title="Property Information">
        <Grid>
          <Info label="Title" value={data.title} />
          <Info label="Category" value={data.category} />
          <Info label="Status" value={data.status} />
          <Info label="Invoice No" value={data.invoice_no} />
          <Info label="Transaction Type" value={data.transaction_type} />
          <Info
            label="Date"
            value={new Date(data.date).toLocaleDateString("en-IN")}
          />
        </Grid>
      </Section>

      {/* ================= DEAL SUMMARY ================= */}
      {dealData?.deal_summary && (
        <Section title="Deal Summary">
          <Grid>
            <Info label="Invoice No" value={dealData.deal_summary.invoice_no} />
            <Info label="Property" value={dealData.deal_summary.property_title} />
            <Info label="Buyer" value={dealData.deal_summary.buyer_name} />
            <Info label="Status" value={dealData.deal_summary.status} />
          </Grid>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <SummaryCard
              label="Total Sale Value"
              value={dealData.deal_summary.total_sale_val}
              color="blue"
            />
            <SummaryCard
              label="Received Amount"
              value={dealData.deal_summary.received_total}
              color="green"
            />
            <SummaryCard
              label="Pending Due"
              value={dealData.deal_summary.pending_due}
              color="red"
            />
          </div>

          {Number(dealData.deal_summary.pending_due) > 0 && (
            <div className="pt-4 text-right">
              <button
                onClick={() => setOpenPayment(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                + Add Payment
              </button>
            </div>
          )}
        </Section>
      )}

      {/* ================= TRANSACTIONS ================= */}
      {dealData?.transactions?.length > 0 && (
        <Section title="Payment Transactions">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-gray-600">
                  <th className="p-3 text-left font-medium">Date</th>
                  <th className="p-3 text-left font-medium">Amount</th>
                  <th className="p-3 text-left font-medium">Mode</th>
                  <th className="p-3 text-left font-medium">Reference</th>
                  <th className="p-3 text-left font-medium">Remarks</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {dealData.transactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="p-3">
                      {new Date(tx.payment_date).toLocaleDateString("en-IN")}
                    </td>

                    <td className="p-3 font-semibold text-green-600">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">
                        {tx.payment_mode}
                      </span>
                    </td>

                    <td className="p-3 text-gray-600">
                      {tx.reference_no || "—"}
                    </td>

                    <td className="p-3 text-gray-600">
                      {tx.remarks || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}


      {/* ================= ADD PAYMENT MODAL ================= */}
      {openPayment && (
        <Modal title="Add Payment" onClose={() => setOpenPayment(false)}>
          <input
            type="number"
            placeholder="Amount"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({ ...paymentData, amount: e.target.value })
            }
          />

          <select
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                payment_mode: e.target.value,
              })
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
              setPaymentData({
                ...paymentData,
                reference_no: e.target.value,
              })
            }
          />

          <input
            type="date"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                payment_date: e.target.value,
              })
            }
          />

          <textarea
            rows={3}
            placeholder="Remarks"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                remarks: e.target.value,
              })
            }
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setOpenPayment(false)}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={submitPayment}
              disabled={savingPayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {savingPayment ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ================= REUSABLE UI ================= */

const inputClass =
  "w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </div>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {children}
  </div>
);

const Info = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

const SummaryCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "red" | "blue";
}) => {
  const map: any = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-lg ${map[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  </div>
);
