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

  /* ================= FETCH SALE PROPERTY ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchSaleProperty();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchSaleProperty = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `${ProjectApi.sell_property}/20`
        // `${ProjectApi.sell_property}/${propertyId}`
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to load sale property", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CREATE PAYMENT ================= */
  const submitPayment = async () => {
    try {
      setPaymentLoading(true);

      await axiosInstance.post("/transactions", {
        property_id: data.property_id,
        sell_property_id: data.id,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        payment_mode: payment.payment_mode,
        reference_no: payment.reference_no,
        remarks: payment.remarks,
      });

      toast.success("Payment added successfully");

      setOpenPayment(false);
      setPayment({
        amount: "",
        payment_date: "",
        payment_mode: "ONLINE",
        reference_no: "",
        remarks: "",
      });

      fetchSaleProperty();
    } catch (err: any) {
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

  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        Property not found
      </div>
    );
  }

  const transactions = data.transactions || [];

  return (
    <div className="p-6 text-black space-y-6">
      {/* HEADER */}
      <div>
        <Link href="/properties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Sale Details
        </h1>
      </div>

      {/* ================= SALE INFO ================= */}
      <Section title="Sale Information">
        <Grid cols={3}>
          <Info label="Invoice No" value={data.invoice_no} />
          <Info label="Sale Date" value={data.sale_date} />
          <Info
            label="Sale Rate"
            value={`₹${Number(data.sale_rate).toLocaleString("en-IN")}`}
          />
          <Info
            label="Base Amount"
            value={`₹${Number(data.sale_base_amount).toLocaleString("en-IN")}`}
          />
          <Info
            label="GST"
            value={`${data.gst_percentage}% (₹${Number(
              data.gst_amount
            ).toLocaleString("en-IN")})`}
          />
          <Info
            label="Other Charges"
            value={`₹${Number(data.other_charges).toLocaleString("en-IN")}`}
          />
          <Info
            label="Discount"
            value={`₹${Number(data.discount_amount).toLocaleString("en-IN")}`}
          />
        </Grid>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <SummaryCard
            label="Total Sale Amount"
            value={data.total_sale_amount}
            color="blue"
          />
          <SummaryCard
            label="Received Amount"
            value={data.received_amount}
            color="green"
          />
          <SummaryCard
            label="Pending Amount"
            value={data.pending_amount}
            color="red"
          />
        </div>

        {data.pending_amount > 0 && (
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
            className="mt-4 px-5 py-2 bg-[#0070BB] text-white rounded-md hover:bg-[#005A99]"
          >
            Add Payment
          </button>
        )}
      </Section>

      {/* ================= BUYER INFO ================= */}
      <Section title="Buyer Information">
        <Grid cols={2}>
          <Info label="Name" value={data.buyer?.name} />
          <Info label="Phone" value={data.buyer?.phone} />
          <Info label="Email" value={data.buyer?.email} />
          <Info label="Address" value={data.buyer?.address} />
          <Info label="PAN" value={data.buyer?.pan_number} />
          <Info label="Aadhaar" value={data.buyer?.aadhar_number} />
        </Grid>
      </Section>

      {/* ================= PROPERTY INFO ================= */}
      <Section title="Property Information">
        <Grid cols={3}>
          <Info label="Title" value={data.property?.title} />
          <Info label="Category" value={data.property?.category} />
          <Info label="Transaction Type" value={data.property?.transaction_type} />
          <Info label="Status" value={data.property?.status} />
          <Info
            label="Rate"
            value={`₹${Number(data.property?.rate).toLocaleString("en-IN")}`}
          />
          <Info
            label="Total Amount"
            value={`₹${Number(
              data.property?.total_amount
            ).toLocaleString("en-IN")}`}
          />
        </Grid>
      </Section>

      {/* ================= TRANSACTIONS ================= */}
      <Section title="Transaction History">
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b">
              <tr>
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Mode</th>
                <th className="text-left py-2">Reference</th>
                <th className="text-left py-2">Remarks</th>
                <th className="text-right py-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="py-2">
                    {new Date(tx.payment_date).toLocaleDateString("en-IN")}
                  </td>
                  <td
                    className={`py-2 ${
                      tx.type === "CREDIT"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {tx.type}
                  </td>
                  <td className="py-2">{tx.payment_mode}</td>
                  <td className="py-2">{tx.reference_no || "—"}</td>
                  <td className="py-2">{tx.remarks || "—"}</td>
                  <td
                    className={`py-2 text-right font-medium ${
                      tx.type === "CREDIT"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    ₹{Number(tx.amount).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ================= PAYMENT MODAL ================= */}
      {openPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-md bg-black/40" />

          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold">Add Payment</h3>

            <Input
              type="number"
              placeholder="Amount"
              value={payment.amount}
              onChange={(e) =>
                setPayment({ ...payment, amount: e.target.value })
              }
            />

            <Input
              type="date"
              value={payment.payment_date}
              onChange={(e) =>
                setPayment({ ...payment, payment_date: e.target.value })
              }
            />

            <select
              value={payment.payment_mode}
              onChange={(e) =>
                setPayment({ ...payment, payment_mode: e.target.value })
              }
              className="input"
            >
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <Input
              placeholder="Reference Number"
              value={payment.reference_no}
              onChange={(e) =>
                setPayment({ ...payment, reference_no: e.target.value })
              }
            />

            <textarea
              rows={2}
              placeholder="Remarks"
              value={payment.remarks}
              onChange={(e) =>
                setPayment({ ...payment, remarks: e.target.value })
              }
              className="input"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenPayment(false)}
                className="px-4 py-2 rounded-md bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                disabled={paymentLoading}
                className="px-4 py-2 rounded-md bg-[#0070BB] text-white"
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

/* ================= REUSABLE UI ================= */

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

const Grid = ({
  cols,
  children,
}: {
  cols: number;
  children: React.ReactNode;
}) => (
  <div
    className={`grid grid-cols-1 md:grid-cols-${cols} gap-4`}
  >
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

const Input = (props: any) => (
  <input
    {...props}
    className="input"
  />
);
