"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

export default function PropertyViewPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROPERTY ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchProperty();
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
    <div className="p-6 text-black space-y-6">
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
          <Info
            label="Transaction Type"
            value={data.transaction_type}
          />
          <Info
            label="Date"
            value={new Date(data.date).toLocaleDateString("en-IN")}
          />
        </Grid>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
          <SummaryCard
            label="Total Amount"
            value={data.total_amount}
            color="blue"
          />
          <SummaryCard
            label="Paid Amount"
            value={data.paid_amount}
            color="green"
          />
          <SummaryCard
            label="Due Amount"
            value={data.due_amount}
            color="red"
          />
        </div>
      </Section>

      {/* ================= AMOUNT BREAKDOWN ================= */}
      <Section title="Amount Breakdown">
        <Grid>
          <Info
            label="Rate"
            value={`₹${Number(data.rate).toLocaleString("en-IN")}`}
          />
          <Info
            label="Base Amount"
            value={`₹${Number(data.base_amount).toLocaleString("en-IN")}`}
          />
          <Info
            label="GST"
            value={`${data.gst_percentage}% (₹${Number(
              data.gst_amount
            ).toLocaleString("en-IN")})`}
          />
          <Info
            label="Other Expenses"
            value={`₹${Number(
              data.other_expenses
            ).toLocaleString("en-IN")}`}
          />
        </Grid>
      </Section>

      {/* ================= SELLER INFO ================= */}
      <Section title="Seller Information">
        <Grid>
          <Info label="Name" value={data.seller?.name} />
          <Info label="Phone" value={data.seller?.phone} />
          <Info label="Email" value={data.seller?.email} />
          <Info label="Address" value={data.seller?.address} />
          <Info label="PAN" value={data.seller?.pan_number} />
          <Info label="Aadhaar" value={data.seller?.aadhar_number} />
        </Grid>
      </Section>

      {/* ================= BUYER INFO ================= */}
      {data.buyer && (
        <Section title="Buyer Information">
          <Grid>
            <Info label="Name" value={data.buyer?.name} />
            <Info label="Phone" value={data.buyer?.phone} />
            <Info label="Email" value={data.buyer?.email} />
            <Info label="Address" value={data.buyer?.address} />
            <Info label="PAN" value={data.buyer?.pan_number} />
            <Info label="Aadhaar" value={data.buyer?.aadhar_number} />
          </Grid>
        </Section>
      )}

      {/* ================= DOCUMENTS ================= */}
      {data.documents?.length > 0 && (
        <Section title="Documents">
          <ul className="space-y-2 text-sm">
            {data.documents.map((doc: any) => (
              <li
                key={doc.id}
                className="flex justify-between items-center"
              >
                <span>{doc.doc_name}</span>
                <a
                  href={`${process.env.NEXT_PUBLIC_API_URL}/${doc.doc_file}`}
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </Section>
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
