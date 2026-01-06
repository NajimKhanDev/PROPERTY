"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

export default function PropertyViewPage() {
  const params = useParams();
  const propertyId = params.id;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH PROPERTY ================= */
  useEffect(() => {
    if (propertyId) fetchProperty();
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= PROPERTY INFO ================= */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 space-y-4 text-sm">
          <div className="flex justify-between">
            <h2 className="text-lg font-semibold">Property Information</h2>
            <Link
              href={`/properties/${propertyId}/edit`}
              className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm"
            >
              Edit Property
            </Link>
          </div>

          {[
            ["Title", property.title],
            ["Transaction Type", property.transaction_type],
            ["Category", property.category],
            ["Address", property.address],
            [
              property.transaction_type === "PURCHASE" ? "Seller" : "Buyer",
              property.seller?.name || property.buyer?.name || "—",
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-gray-500">{label}</p>
              <p className="font-medium">{value}</p>
            </div>
          ))}

          <div>
            <p className="text-gray-500">Total Amount</p>
            <p className="text-xl font-bold text-green-600">
              ₹{Number(property.total_amount).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* ================= PAYMENT SUMMARY ================= */}
        <div className="bg-white rounded-xl shadow-sm p-6 text-sm space-y-3">
          <h3 className="font-semibold">Payment Summary</h3>

          <p>
            Paid Amount:{" "}
            <span className="font-medium text-green-600">
              ₹{Number(property.paid_amount).toLocaleString("en-IN")}
            </span>
          </p>

          <p className="text-red-600 font-medium">
            Due Amount: ₹{Number(property.due_amount).toLocaleString("en-IN")}
          </p>

          <p>Status: {property.status}</p>
        </div>
      </div>

      {/* ================= DOCUMENTS ================= */}
      {property.documents?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="font-semibold mb-3">Documents</h3>
          <ul className="space-y-2 text-sm">
            {property.documents.map((doc: any) => (
              <li key={doc.id} className="flex justify-between items-center">
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
        </div>
      )}
    </div>
  );
}
