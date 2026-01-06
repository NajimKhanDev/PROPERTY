"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  type: "BUYER" | "SELLER" | "BOTH";
  created_at: string;
}

export default function CustomerViewPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH CUSTOMER BY ID ================= */
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

      const json = res.data;

      if (!json?.status) {
        throw new Error("Failed to fetch customer");
      }

      setCustomer(json.data);
    } catch (error) {
      console.error("Error loading customer:", error);
      setCustomer(null);
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
  if (!customer) {
    return (
      <div className="p-6 text-center text-gray-500">
        Customer not found
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-600">
      {/* HEADER */}
      <div className="mb-6">
        <Link href="/customers" className="text-blue-600 hover:text-blue-800">
          ← Back to Customers
        </Link>
        <h1 className="text-2xl font-bold mt-2 text-gray-800">
          Customer Details
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================= CUSTOMER INFO ================= */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-semibold text-gray-800">
                Customer Information
              </h2>

              <Link
                href={`/customers/${customer.id}/edit`}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Edit Customer
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Name
                </label>
                <p className="text-lg font-medium text-gray-900">
                  {customer.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-lg">{customer.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone
                </label>
                <p className="text-lg">{customer.phone}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Customer Type
                </label>
                <span
                  className={`px-3 py-1 text-sm rounded-full font-medium ${
                    customer.type === "BUYER"
                      ? "bg-green-100 text-green-800"
                      : customer.type === "SELLER"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {customer.type}
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Address
                </label>
                <p className="text-lg whitespace-pre-line">
                  {customer.address}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Member Since
                </label>
                <p className="text-lg">
                  {new Date(customer.created_at).toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE ================= */}
        <div className="space-y-6">
          {/* Stats (placeholder – backend ready later) */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Statistics
            </h3>
            <div className="space-y-4 text-gray-500">
              <p>Transactions: —</p>
              <p>Total Amount: —</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href={`/customers/${customer.id}/edit`}
                className="block w-full text-center bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Edit Customer
              </Link>

              <Link
                href="/properties/add"
                className="block w-full text-center bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Add Property
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
