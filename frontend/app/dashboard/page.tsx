"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Property {
  id: string;
  address: string;
  type: string;
  price: number;
  owner: string;
  status: "available" | "sold";
  salePrice?: number;
  profit?: number;
}

export default function Dashboard() {
  const [properties, setProperties] = useState<Property[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem("isLoggedIn")) {
      router.push("/login");
      return;
    }

    const savedProperties = localStorage.getItem("properties");
    if (savedProperties) {
      setProperties(JSON.parse(savedProperties));
    }
  }, [router]);

  /* ===================== DERIVED STATS ===================== */

  const sales = useMemo(
    () => properties.filter((p) => p.status === "sold"),
    [properties]
  );

  const totalRevenue = useMemo(
    () => sales.reduce((sum, s) => sum + (s.salePrice ?? s.price), 0),
    [sales]
  );

  const totalProfit = useMemo(
    () => sales.reduce((sum, s) => sum + (s.profit ?? 0), 0),
    [sales]
  );

  const averageSalePrice = useMemo(
    () => (sales.length ? totalRevenue / sales.length : 0),
    [sales, totalRevenue]
  );

  return (
    <div className="p-6 space-y-6 text-black">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of properties & sales performance
        </p>
      </div>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Properties"
          value={properties.length}
          color="text-[#0070BB]"
        />
        <StatCard
          label="Properties Sold"
          value={sales.length}
          color="text-green-600"
        />
        <StatCard
          label="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          color="text-[#0070BB]"
        />
        <StatCard
          label="Total Profit"
          value={`₹${totalProfit.toLocaleString()}`}
          color="text-[#0070BB]"
        />
      </div>

      {/* ================= LOWER PANELS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Property Types */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Property Types
          </h3>

          {properties.length > 0 ? (
            <div className="space-y-2 text-sm">
              {Object.entries(
                properties.reduce((acc, prop) => {
                  acc[prop.type] = (acc[prop.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{type}</span>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              No properties registered
            </p>
          )}
        </div>

        {/* Sales Statistics */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Sales Statistics
          </h3>

          {sales.length > 0 ? (
            <div className="space-y-2 text-sm">
              <StatRow
                label="Average Sale Price"
                value={`₹${averageSalePrice.toLocaleString()}`}
              />
              <StatRow
                label="Highest Sale"
                value={`₹${Math.max(
                  ...sales.map((s) => s.salePrice ?? s.price)
                ).toLocaleString()}`}
              />
              <StatRow
                label="Lowest Sale"
                value={`₹${Math.min(
                  ...sales.map((s) => s.salePrice ?? s.price)
                ).toLocaleString()}`}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-500">No sales recorded</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ===================== REUSABLE UI ===================== */

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${color || "text-gray-900"} mt-1`}>
        {value}
      </p>
    </div>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
