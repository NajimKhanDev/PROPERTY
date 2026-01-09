"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";

interface DashboardData {
  cash_book: {
    total_received: string;
    total_paid: string;
    cash_in_hand: number;
    status: "POSITIVE" | "NEGATIVE";
  };
  inventory: {
    total_units: number;
    sold_units: number;
    unsold_units: number;
  };
  profitability: {
    total_sales_value: string;
    purchase_cost_sold: string;
    gross_profit: number;
    profit_margin: string;
  };
  outstanding: {
    receivables: string;
    payables: string;
    net_market_pos: number;
  };
  recent_activity: {
    sales: {
      id: number;
      title: string;
      party: string;
      amount: string;
      date: string;
    }[];
    purchases: {
      id: number;
      title: string;
      party: string;
      amount: string;
      status: string;
      date: string;
    }[];
  };
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/dashboard");
      setData(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-500">Loading dashboard...</p>;
  }

  if (!data) {
    return <p className="p-6 text-red-500">Failed to load dashboard</p>;
  }

  return (
    <div className="p-6 space-y-6 text-black">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Business overview & financial insights
        </p>
      </div>

      {/* ================= TOP STATS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Properties"
          value={data.inventory.total_units}
        />
        <StatCard
          label="Sold Properties"
          value={data.inventory.sold_units}
          color="text-green-600"
        />
        <StatCard
          label="Total Sales Value"
          value={`₹${Number(
            data.profitability.total_sales_value
          ).toLocaleString()}`}
        />
        <StatCard
          label="Gross Profit"
          value={`₹${data.profitability.gross_profit.toLocaleString()}`}
          color="text-[#0070BB]"
        />
      </div>

      {/* ================= FINANCIAL PANELS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Book */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Cash Book</h3>
          <StatRow
            label="Total Received"
            value={`₹${Number(
              data.cash_book.total_received
            ).toLocaleString()}`}
          />
          <StatRow
            label="Total Paid"
            value={`₹${Number(
              data.cash_book.total_paid
            ).toLocaleString()}`}
          />
          <StatRow
            label="Cash In Hand"
            value={`₹${data.cash_book.cash_in_hand.toLocaleString()}`}
          />
          <span
            className={`inline-block mt-3 px-3 py-1 text-xs font-medium rounded-full ${
              data.cash_book.status === "POSITIVE"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {data.cash_book.status}
          </span>
        </div>

        {/* Profitability */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Profitability</h3>
          <StatRow
            label="Purchase Cost (Sold)"
            value={`₹${Number(
              data.profitability.purchase_cost_sold
            ).toLocaleString()}`}
          />
          <StatRow
            label="Gross Profit"
            value={`₹${data.profitability.gross_profit.toLocaleString()}`}
          />
          <StatRow
            label="Profit Margin"
            value={data.profitability.profit_margin}
          />
        </div>
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <RecentList
          title="Recent Sales"
          items={data.recent_activity.sales}
        />

        {/* Recent Purchases */}
        <RecentList
          title="Recent Purchases"
          items={data.recent_activity.purchases}
        />
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
      <p className={`text-2xl font-bold ${color ?? "text-gray-900"} mt-1`}>
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
    <div className="flex justify-between text-sm mb-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function RecentList({
  title,
  items,
}: {
  title: string;
  items: any[];
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>

      {items.length ? (
        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between border-b pb-2"
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-gray-500">{item.party}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ₹{Number(item.amount).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500">No records found</p>
      )}
    </div>
  );
}
