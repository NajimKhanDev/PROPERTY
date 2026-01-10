"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

/* ================= TYPES ================= */

interface CustomerProfile {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  pan_number: string;
  pan_file_path: string;
  aadhar_number: string;
  aadhar_file_path: string;
  type: "BUYER" | "SELLER" | "BOTH";
  created_at: string;
}

interface CustomerSummary {
  total_purchased_from_us: number;
  total_sold_to_us: number;
}

interface PurchaseHistory {
  deal_id: number;
  property: string;
  category: string;
  invoice_no: string;
  date: string;
  amount: string;
  paid: string;
  due: string;
  status: string;
}

interface CustomerHistory {
  purchases_list: PurchaseHistory[];
  supplies_list: any[];
}

interface CustomerResponse {
  profile: CustomerProfile;
  summary: CustomerSummary;
  history: CustomerHistory;
}

/* ================= PAGE ================= */

export default function CustomerViewPage() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get("id");

  const [data, setData] = useState<CustomerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH CUSTOMER ================= */
  useEffect(() => {
    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const fetchCustomer = async () => {
    try {
      setLoading(true);

      const res = await axiosInstance.get(
        `${ProjectApi.all_customers}/${customerId}`
      );

      if (!res.data?.status) {
        throw new Error("Failed to fetch customer");
      }

      setData(res.data.data);
    } catch (error) {
      console.error("Error loading customer:", error);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading customer details...
      </div>
    );
  }

  /* ================= NOT FOUND ================= */
  if (!data) {
    return (
      <div className="p-6 text-center text-gray-500">
        Customer not found
      </div>
    );
  }

  const { profile, summary, history } = data;

  return (
    <div className="p-6 text-gray-600">
      {/* HEADER */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <Link href="/customers" className="text-blue-600 hover:text-blue-800">
            ← Back to Customers
          </Link>
          <h1 className="text-2xl font-bold mt-2 text-gray-800">
            Customer Details
          </h1>
        </div>

        {/* EDIT BUTTON */}
        <Link
          href={`/customers/edit?id=${profile.id}`}
          className="px-3 py-1.5 bg-[#0070BB] text-white rounded-md text-sm hover:bg-[#005A99]"
        >
          Edit Customer
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= CUSTOMER INFO ================= */}
        <div className="lg:col-span-2 space-y-6">
          {/* BASIC INFO */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Customer Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">Name</label>
                <p className="text-lg font-medium text-gray-900">
                  {profile.name}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="text-lg">{profile.email}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Phone</label>
                <p className="text-lg">{profile.phone}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Customer Type</label>
                <span
                  className={`inline-block px-3 py-1 mt-1 text-sm rounded-full font-medium ${
                    profile.type === "BUYER"
                      ? "bg-green-100 text-green-800"
                      : profile.type === "SELLER"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {profile.type}
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm text-gray-500">Address</label>
                <p className="text-lg whitespace-pre-line">
                  {profile.address}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Member Since</label>
                <p className="text-lg">
                  {new Date(profile.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </div>

          {/* KYC INFO */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              KYC Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-500">PAN Number</label>
                <p className="font-medium">{profile.pan_number}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500">Aadhar Number</label>
                <p className="font-medium">{profile.aadhar_number}</p>
              </div>
            </div>
          </div>

          {/* PURCHASE HISTORY */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Purchase History
            </h3>

            {history.purchases_list.length === 0 ? (
              <p className="text-gray-500">No purchases found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Invoice</th>
                      <th className="px-4 py-2 text-left">Property</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Amount</th>
                      <th className="px-4 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.purchases_list.map((item) => (
                      <tr key={item.deal_id} className="border-t">
                        <td className="px-4 py-2">{item.invoice_no}</td>
                        <td className="px-4 py-2">{item.property}</td>
                        <td className="px-4 py-2">{item.date}</td>
                        <td className="px-4 py-2">₹{item.amount}</td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-1 rounded bg-green-100 text-green-700">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="space-y-6">
          {/* STATS */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Statistics
            </h3>
            <div className="space-y-3 text-gray-700">
              <p>
                Total Purchased: ₹
                {summary.total_purchased_from_us.toLocaleString()}
              </p>
              <p>
                Total Sold: ₹
                {summary.total_sold_to_us.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
