"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";

/* ================= PAGE ================= */
export default function PropertyViewPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchMasterView();
  }, [propertyId]);

  const fetchMasterView = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/properties/master-view/${propertyId}`
      );
      setData(res.data);
    } catch (err) {
      console.error("Failed to load property", err);
    } finally {
      setLoading(false);
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

  const { overview, financials, parties, ledger, documents } = data;

  return (
    <div className="p-6 text-black space-y-6">
      {/* HEADER */}
      <div>
        <Link href="/allproperties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          Property Master View
        </h1>
      </div>

      {/* ================= OVERVIEW ================= */}
      <Section title="Property Overview">
        <Grid>
          <Info label="Title" value={overview.title} />
          <Info label="Category" value={overview.category} />
          <Info label="Status" value={overview.status} />
          <Info
            label="Added On"
            value={new Date(overview.added_on).toLocaleDateString("en-IN")}
          />
        </Grid>
      </Section>

      {/* ================= VENDOR ================= */}
      <Section title="Vendor (Purchase Party)">
        <Grid>
          <Info label="Name" value={parties.vendor?.name} />
          <Info label="Phone" value={parties.vendor?.phone} />
          <Info label="Email" value={parties.vendor?.email} />
        </Grid>
      </Section>

      {/* ================= BUYER ================= */}
      <Section title="Buyer (Sale Party)">
        {parties.buyer ? (
          <Grid>
            <Info label="Name" value={parties.buyer.name} />
            <Info label="Phone" value={parties.buyer.phone} />
            <Info label="Email" value={parties.buyer.email} />
          </Grid>
        ) : (
          <p className="text-sm text-gray-500">
            Property not sold yet
          </p>
        )}
      </Section>

      {/* ================= FINANCIAL SUMMARY ================= */}
      <Section title="Financial Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Purchase Cost"
            value={financials.purchase_cost}
            color="red"
          />
          <SummaryCard
            label="Sale Revenue"
            value={financials.sale_revenue}
            color="green"
          />
          <SummaryCard
            label="Net Profit"
            value={financials.net_profit}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <DueCard
            label="Vendor Due"
            value={financials.vendor_due}
            type="vendor"
          />
          <DueCard
            label="Customer Due"
            value={financials.customer_due}
            type="customer"
          />
        </div>
      </Section>

      {/* ================= VENDOR LEDGER ================= */}
      <Section title="Vendor Ledger (Purchase)">
        {ledger.purchase_history.length === 0 ? (
          <p className="text-sm text-gray-500">
            No purchase transactions found
          </p>
        ) : (
          <LedgerTable
            data={ledger.purchase_history}
            type="DEBIT"
          />
        )}
      </Section>

      {/* ================= BUYER LEDGER ================= */}
      <Section title="Buyer Ledger (Sale)">
        {ledger.sale_history.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sale transactions found
          </p>
        ) : (
          <LedgerTable
            data={ledger.sale_history}
            type="CREDIT"
          />
        )}
      </Section>

      {/* ================= DOCUMENTS ================= */}
      {/* <Section title="Property Documents">
        <div className="space-y-6">

          <div>
            <h3 className="font-semibold mb-2">Inventory Documents</h3>

            {documents.inventory_docs.length === 0 ? (
              <p className="text-sm text-gray-500">No inventory documents</p>
            ) : (
              <DocList docs={documents.inventory_docs} />
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Sale Documents</h3>

            {documents.sale_docs.length === 0 ? (
              <p className="text-sm text-gray-500">No sale documents</p>
            ) : (
              <DocList docs={documents.sale_docs} />
            )}
          </div>

        </div>
      </Section> */}

    </div>
  );
}

/* ================= UI HELPERS ================= */

const Section = ({ title, children }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </div>
);

const Grid = ({ children }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {children}
  </div>
);

const Info = ({ label, value }: any) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);


  const isNumeric = (val: any) =>
    val !== null &&
    val !== undefined &&
    val !== "" &&
    !isNaN(Number(val));

  const formatCurrency = (val: any) => {
    if (!isNumeric(val)) return "—";
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  const formatText = (val: any) => {
    if (val === null || val === undefined || val === "") return "—";
    return String(val);
  };

const SummaryCard = ({ label, value, color }: any) => {
  const map: any = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-lg ${map[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">
        {formatCurrency(value)}
      </p>
    </div>
  );
};


const DueCard = ({ label, value, type }: any) => {
  const numeric = isNumeric(value);
  const isZero = numeric && Number(value) === 0;

  return (
    <div
      className={`p-4 rounded-lg border ${
        !numeric || isZero
          ? "bg-gray-50 text-gray-600"
          : type === "customer"
          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : "bg-purple-50 text-purple-700 border-purple-200"
      }`}
    >
      <p className="text-sm">{label}</p>
      <p className="text-xl font-bold">
        {formatCurrency(value)}
      </p>

      {numeric && !isZero && (
        <p className="text-xs mt-1">
          {type === "customer"
            ? "Amount to receive from customer"
            : "Amount to pay vendor"}
        </p>
      )}
    </div>
  );
};


const LedgerTable = ({
  data,
  type,
}: {
  data: any[];
  type: "DEBIT" | "CREDIT";
}) => (
  <table className="w-full text-sm">
    <thead className="bg-gray-50">
      <tr>
        <th className="text-left p-3">Date</th>
        <th className="text-left p-3">Mode</th>
        <th className="text-left p-3">Reference</th>
        <th className="text-left p-3">Remarks</th>
        <th className="text-right p-3">Amount</th>
      </tr>
    </thead>
    <tbody className="divide-y ">
      {data.map((tx) => (
        <tr key={tx.id} className="border-b border-gray-200">
          <td className="p-3">
            {new Date(tx.payment_date).toLocaleDateString("en-IN")}
          </td>
          <td className="p-3">{tx.payment_mode}</td>
          <td className="p-3">{tx.reference_no || "—"}</td>
          <td className="p-3">{tx.remarks || "—"}</td>
          <td
            className={`p-3 text-right font-semibold ${type === "CREDIT"
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
);


const DocList = ({ docs }: { docs: any[] }) => (
  <div className="divide-y border rounded-lg overflow-hidden">
    {docs.map((doc) => (
      <div
        key={doc.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50"
      >
        <div>
          <p className="font-medium">{doc.doc_name}</p>
          <p className="text-xs text-gray-500">
            Added on{" "}
            {new Date(doc.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${doc.doc_file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          View / Download
        </a>
      </div>
    ))}
  </div>
);
