"use client";

import { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";

type Tab = "overview" | "dues" | "sales" | "daybook";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  const [daybook, setDaybook] = useState<any[]>([]);
  const [dues, setDues] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [totalRecoverable, setTotalRecoverable] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);

  /* ================= FILTERS ================= */
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    type: "ALL",
  });

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);

      const [daybookRes, duesRes, salesRes] = await Promise.all([
        axiosInstance.get("/reports/daybook"),
        axiosInstance.get("/reports/dues"),
        axiosInstance.get("/reports/sales-performance"),
      ]);

      setDaybook(daybookRes.data?.data || []);
      setDues(duesRes.data?.data?.data || []);
      setTotalRecoverable(Number(duesRes.data?.total_recoverable || 0));
      setSales(salesRes.data?.data || []);
      setTotalProfit(Number(salesRes.data?.total_profit || 0));
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTER LOGIC ================= */
  const applyDateFilter = (dateStr: string) => {
    const d = new Date(dateStr);
    if (filters.from && d < new Date(filters.from)) return false;
    if (filters.to && d > new Date(filters.to)) return false;
    return true;
  };

  const filteredDaybook = useMemo(
    () =>
      daybook.filter(
        (d) =>
          applyDateFilter(d.date) &&
          (filters.type === "ALL" || d.type === filters.type)
      ),
    [daybook, filters]
  );

  const filteredSales = useMemo(
    () => sales.filter((s) => applyDateFilter(s.sale_date)),
    [sales, filters]
  );

  const filteredDues = useMemo(
    () => dues.filter((d) => applyDateFilter(d.sale_date)),
    [dues, filters]
  );

  if (loading) {
    return <div className="p-6 text-gray-500">Loading reports...</div>;
  }

  return (
    <div className="p-6 space-y-6 text-black bg-gray-50 min-h-screen">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">
          Financial performance & recovery insights
        </p>
      </div>

      {/* ================= FILTER BAR ================= */}
      <div className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4 items-end">
        <Filter label="From">
          <input
            type="date"
            className="input"
            value={filters.from}
            onChange={(e) =>
              setFilters({ ...filters, from: e.target.value })
            }
          />
        </Filter>

        <Filter label="To">
          <input
            type="date"
            className="input"
            value={filters.to}
            onChange={(e) =>
              setFilters({ ...filters, to: e.target.value })
            }
          />
        </Filter>

        <Filter label="Type">
          <select
            className="input"
            value={filters.type}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value })
            }
          >
            <option value="ALL">All</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
        </Filter>

        <button
          onClick={() =>
            setFilters({ from: "", to: "", type: "ALL" })
          }
          className="ml-auto text-sm text-blue-600 hover:underline"
        >
          Reset Filters
        </button>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-6 border-b border-gray-200">
        {[
          ["overview", "Overview"],
          ["dues", "Dues"],
          ["sales", "Sales"],
          ["daybook", "Daybook"],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k as Tab)}
            className={`pb-2 text-sm ${
              tab === k
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ================= CONTENT ================= */}
      {tab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Stat label="Total Profit" value={totalProfit} color="green" />
          <Stat
            label="Total Recoverable"
            value={totalRecoverable}
            color="red"
          />
          <Stat
            label="Total Transactions"
            value={filteredDaybook.length}
            color="blue"
          />
        </div>
      )}

      {tab === "daybook" && (
        <Table
          headers={[
            "Date",
            "Property",
            "Party",
            "Type",
            "Mode",
            "Amount",
          ]}
        >
          {filteredDaybook.map((d) => (
            <Row key={d.id}>
              <Cell>{d.date}</Cell>
              <Cell>{d.property}</Cell>
              <Cell>{d.party}</Cell>
              <Cell>{d.type}</Cell>
              <Cell>{d.mode}</Cell>
              <Cell align="right" className={d.color}>
                ₹{Number(d.amount).toLocaleString("en-IN")}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {tab === "dues" && (
        <Table headers={["Property", "Buyer", "Total", "Received", "Pending"]}>
          {filteredDues.map((d) => (
            <Row key={d.id}>
              <Cell>{d.property.title}</Cell>
              <Cell>{d.buyer.name}</Cell>
              <Cell align="right">
                ₹{Number(d.total_sale_amount).toLocaleString("en-IN")}
              </Cell>
              <Cell align="right" className="text-green-600">
                ₹{Number(d.received_amount).toLocaleString("en-IN")}
              </Cell>
              <Cell align="right" className="text-red-600 font-medium">
                ₹{Number(d.pending_amount).toLocaleString("en-IN")}
              </Cell>
            </Row>
          ))}
        </Table>
      )}

      {tab === "sales" && (
        <Table
          headers={[
            "Deal",
            "Property",
            "Cost",
            "Sale",
            "Profit",
            "Margin",
          ]}
        >
          {filteredSales.map((s) => (
            <Row key={s.deal_id}>
              <Cell>{s.deal_id}</Cell>
              <Cell>{s.property}</Cell>
              <Cell align="right">
                ₹{Number(s.cost_price).toLocaleString("en-IN")}
              </Cell>
              <Cell align="right">
                ₹{Number(s.sale_price).toLocaleString("en-IN")}
              </Cell>
              <Cell align="right" className="text-green-600 font-medium">
                ₹{Number(s.profit).toLocaleString("en-IN")}
              </Cell>
              <Cell>{s.margin_per}</Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ================= UI HELPERS ================= */

const Filter = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1 text-sm">
    <label className="text-gray-500">{label}</label>
    {children}
  </div>
);

const Stat = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "red" | "blue";
}) => {
  const map: any = {
    green: "text-green-600",
    red: "text-red-600",
    blue: "text-blue-600",
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`text-2xl font-semibold ${map[color]}`}>
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const Table = ({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((h) => (
            <th
              key={h}
              className="px-4 py-3 text-left font-medium text-gray-500"
            >
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

const Row = ({ children }: { children: React.ReactNode }) => (
  <tr className="border-t border-gray-100">{children}</tr>
);

const Cell = ({
  children,
  align = "left",
  className = "",
}: {
  children: React.ReactNode;
  align?: "left" | "right";
  className?: string;
}) => (
  <td
    className={`px-4 py-3 ${
      align === "right" ? "text-right" : ""
    } ${className}`}
  >
    {children}
  </td>
);
