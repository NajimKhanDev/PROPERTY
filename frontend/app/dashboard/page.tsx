"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";
import {
  Home,
  CheckCircle,
  Clock,
  Package,
  Handshake,
} from "lucide-react";


interface DashboardData {
  cash_book: {
    label: string;
    total_received: string;
    total_paid: string;
    cash_in_hand: number;
    status: "POSITIVE" | "NEGATIVE";
  };
  inventory: {
    total_properties: number;
    fully_sold: number;
    partially_sold: number;
    available: number;
    total_sale_deals: number;
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Properties"
          value={data.inventory.total_properties}
          icon={<Home size={22} />}
        />

        <StatCard
          label="Fully Sold"
          value={data.inventory.fully_sold}
          color="text-green-600"
          icon={<CheckCircle size={22} className="text-green-600" />}
        />

        <StatCard
          label="Partially Sold"
          value={data.inventory.partially_sold}
          color="text-yellow-600"
          icon={<Clock size={22} className="text-yellow-600" />}
        />

        <StatCard
          label="Available"
          value={data.inventory.available}
          color="text-blue-600"
          icon={<Package size={22} className="text-blue-600" />}
        />

        <StatCard
          label="Sale Deals"
          value={data.inventory.total_sale_deals}
          color="text-purple-600"
          icon={<Handshake size={22} className="text-purple-600" />}
        />

      </div>

      {/* ================= FINANCIAL PANELS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Book */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">{data.cash_book.label}</h3>
            <span
              className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${data.cash_book.status === "POSITIVE"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
            >
              {data.cash_book.status}
            </span>
          </div>
          <div className="space-y-3">
            <StatRow
              label="Total Received"
              value={`₹${Number(
                data.cash_book.total_received
              ).toLocaleString()}`}
              color="text-green-600"
            />
            <StatRow
              label="Total Paid"
              value={`₹${Number(
                data.cash_book.total_paid
              ).toLocaleString()}`}
              color="text-red-600"
            />
            <div className="pt-2 border-t border-gray-100">
              <StatRow
                label="Cash In Hand"
                value={`₹${data.cash_book.cash_in_hand.toLocaleString()}`}
                color="text-blue-600"
                bold
              />
            </div>
          </div>
        </div>

        {/* Profitability */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Profitability</h3>
          <div className="space-y-3">
            <StatRow
              label="Total Sales Value"
              value={`₹${Number(
                data.profitability.total_sales_value
              ).toLocaleString()}`}
            />
            <StatRow
              label="Purchase Cost (Sold)"
              value={`₹${Number(
                data.profitability.purchase_cost_sold
              ).toLocaleString()}`}
            />
            <div className="pt-2 border-t border-gray-100">
              <StatRow
                label="Gross Profit"
                value={`₹${data.profitability.gross_profit.toLocaleString()}`}
                color="text-[#0070BB]"
                bold
              />
            </div>
            <StatRow
              label="Profit Margin"
              value={data.profitability.profit_margin}
              color="text-green-600"
            />
          </div>
        </div>

        {/* Outstanding */}
        {/* <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Outstanding</h3>
          <div className="space-y-3">
            <StatRow
              label="Receivables"
              value={`₹${Number(data.outstanding.receivables).toLocaleString()}`}
              color={Number(data.outstanding.receivables) < 0 ? "text-red-600" : "text-green-600"}
            />
            <StatRow
              label="Payables"
              value={`₹${Number(data.outstanding.payables).toLocaleString()}`}
              color={Number(data.outstanding.payables) < 0 ? "text-green-600" : "text-red-600"}
            />
            <div className="pt-2 border-t border-gray-100">
              <StatRow
                label="Net Market Position"
                value={`₹${data.outstanding.net_market_pos.toLocaleString()}`}
                color={
                  data.outstanding.net_market_pos > 0 ? "text-green-600" :
                    data.outstanding.net_market_pos < 0 ? "text-red-600" : "text-gray-600"
                }
                bold
              />
              <p className="text-xs text-gray-500 mt-1">
                {data.outstanding.net_market_pos === 0
                  ? "Balanced position"
                  : data.outstanding.net_market_pos > 0
                    ? "Positive market position"
                    : "Negative market position"}
              </p>
            </div>
          </div>
        </div> */}
      </div>

      {/* ================= RECENT ACTIVITY ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <RecentList
          title="Recent Sales"
          items={data.recent_activity.sales}
          emptyMessage="No recent sales"
          type="sale"
        />

        {/* Recent Purchases */}
        <RecentList
          title="Recent Purchases"
          items={data.recent_activity.purchases}
          emptyMessage="No recent purchases"
          type="purchase"
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
  icon,
}: {
  label: string;
  value: string | number;
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`text-2xl font-bold ${color ?? "text-gray-900"} mt-2`}>
            {value}
          </p>
        </div>

        {icon && (
          <div className="p-2 rounded-lg bg-gray-100 text-gray-700">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
  bold = false,
}: {
  label: string;
  value: string;
  color?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : "font-medium"} ${color ?? "text-gray-900"}`}>
        {value}
      </span>
    </div>
  );
}

function RecentList({
  title,
  items,
  emptyMessage,
  type,
}: {
  title: string;
  items: any[];
  emptyMessage: string;
  type: "sale" | "purchase";
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
          {items.length} records
        </span>
      </div>

      {items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-sm">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{item.party}</span>
                  {type === "purchase" && item.status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${item.status === "SOLD"
                      ? "bg-green-100 text-green-700"
                      : item.status === "AVAILABLE"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                      }`}>
                      {item.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium text-sm ${type === "sale" ? "text-green-600" : "text-red-600"
                  }`}>
                  ₹{Number(item.amount).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(item.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}