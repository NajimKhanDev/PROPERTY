"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";


export default function PropertyViewPage() {
  const params = useParams();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // payment modal
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [payment, setPayment] = useState({
    amount: "",
    payment_date: "",
    payment_mode: "ONLINE",
    reference_no: "",
    remarks: "",
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchProperty();
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `${ProjectApi.get_property_by_id}/${propertyId}`
      );
      setProperty(res.data.data || res.data);
    } catch (err) {
      console.error("Failed to load property", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axiosInstance.get(
        `/transactions?property_id=${propertyId}`
      );
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  /* ================= CREATE PAYMENT ================= */
  const submitPayment = async () => {
    try {
      setPaymentLoading(true);

      await axiosInstance.post("/transactions", {
        property_id: property.id,
        sell_property_id: property.sell_property_id,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        payment_mode: payment.payment_mode,
        reference_no: payment.reference_no,
        remarks: payment.remarks,
      });

      setOpenPayment(false);
      setPayment({
        amount: "",
        payment_date: "",
        payment_mode: "ONLINE",
        reference_no: "",
        remarks: "",
      });

      fetchProperty();
      fetchTransactions();
    } catch (err: any) {
      console.error("Payment failed", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Payment failed";

      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }

  };


  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading property details...
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 text-center text-gray-500">
        Property not found
      </div>
    );
  }

  return (
    <div className="p-6 text-black">
      {/* HEADER */}
      <div className="mb-6">
        <Link
          href="/properties"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Property Details
        </h1>
      </div>

      {/* ================= PROPERTY INFO ================= */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 text-sm">
        <h2 className="text-lg font-semibold">Property Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Info label="Title" value={property.title} />
          <Info label="Transaction Type" value={property.transaction_type} />
          <Info label="Category" value={property.category} />
          <Info label="Status" value={property.status} />
          <Info label="Address" value={property.address} />
          <Info label="Invoice No" value={property.invoice_no} />
        </div>
      </div>

      {/* ================= PAYMENTS ================= */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Payments</h3>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Paid Amount" value={property.paid_amount} color="green" />
          <SummaryCard label="Due Amount" value={property.due_amount} color="red" />
          <SummaryCard label="Total Amount" value={property.total_amount} color="blue" />
        </div>

        {property.due_amount > 0 && (
          <button
            onClick={() => {
              setPayment({
                amount: "",
                payment_date: new Date().toISOString().slice(0, 10),
                payment_mode: "ONLINE",
                reference_no: "",
                remarks: "",
              });
              setOpenPayment(true);
            }}
            className="px-5 py-2 bg-[#0070BB] text-white rounded-md hover:bg-[#005A99]"
          >
            Add Payment
          </button>
        )}

        {/* TRANSACTIONS */}
        <h4 className="font-semibold mt-6 mb-3">Transaction History</h4>

        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-gray-500">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Mode</th>
                <th className="text-left py-2">Reference</th>
                <th className="text-left py-2">Remarks</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="py-2">
                    {new Date(tx.payment_date).toLocaleDateString("en-IN")}
                  </td>
                  <td className="py-2">{tx.payment_mode}</td>
                  <td className="py-2">{tx.reference_no || "—"}</td>
                  <td className="py-2">{tx.remarks || "—"}</td>
                  <td className="py-2 text-right font-medium text-red-600">
                    ₹{Number(tx.amount).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {openPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Soft blur layer without dark tint */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/40" />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Add Payment</h3>

            <input
              type="number"
              placeholder="Amount"
              value={payment.amount}
              onChange={(e) =>
                setPayment({ ...payment, amount: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <input
              type="date"
              value={payment.payment_date}
              onChange={(e) =>
                setPayment({ ...payment, payment_date: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <select
              value={payment.payment_mode}
              onChange={(e) =>
                setPayment({ ...payment, payment_mode: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            >
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <input
              placeholder="Reference Number"
              value={payment.reference_no}
              onChange={(e) =>
                setPayment({ ...payment, reference_no: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <textarea
              rows={2}
              placeholder="Remarks"
              value={payment.remarks}
              onChange={(e) =>
                setPayment({ ...payment, remarks: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenPayment(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                disabled={paymentLoading}
                className="px-4 py-2 rounded-md bg-[#0070BB] text-white hover:bg-[#005A99]"
              >
                {paymentLoading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ================= SMALL COMPONENTS ================= */
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
  const colorMap: any = {
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorMap[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};
