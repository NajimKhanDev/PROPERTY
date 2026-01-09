"use client";

import { useEffect, useState } from "react";
import axiosInstance from "@/app/api/axiosInstance";

type Tab = "customers" | "properties" | "transactions";

/* ================= TAILWIND INPUT STYLES ================= */
const inputClass =
  "h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";

const selectClass =
  "h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300";

const buttonClass =
  "h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);

  /* ================= CUSTOMER FILTERS ================= */
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerType, setCustomerType] =
    useState<"" | "BUYER" | "SELLER" | "BOTH">("");
  const [customerPage, setCustomerPage] = useState(1);

  /* ================= PROPERTY FILTERS ================= */
  const [propertySearch, setPropertySearch] = useState("");
  const [propertyStatus, setPropertyStatus] = useState("");
  const [propertyCategory, setPropertyCategory] = useState("");
  const [propertyPage, setPropertyPage] = useState(1);

  /* ================= TRANSACTION FILTERS ================= */
  const [txnType, setTxnType] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [txnSearch, setTxnSearch] = useState("");
  const [sortBy, setSortBy] = useState("payment_date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [txnPage, setTxnPage] = useState(1);
  const perPage = 10;

  /* ================= TAB BASED FETCH ================= */
  useEffect(() => {
    if (tab === "customers") fetchCustomers();
    if (tab === "properties") fetchProperties();
    if (tab === "transactions") fetchTransactions();
  }, [tab]);

  /* ================= API CALLS ================= */
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/reports/customers/all", {
        params: {
          search: customerSearch || undefined,
          type: customerType || undefined,
          page: customerPage,
        },
      });
      setCustomers(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/reports/properties/all", {
        params: {
          search: propertySearch || undefined,
          status: propertyStatus || undefined,
          category: propertyCategory || undefined,
          page: propertyPage,
        },
      });
      setProperties(res.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/transactions/all", {
        params: {
          type: txnType || undefined,
          payment_mode: paymentMode || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          min_amount: minAmount || undefined,
          max_amount: maxAmount || undefined,
          search: txnSearch || undefined,
          sort_by: sortBy,
          sort_order: sortOrder,
          page: txnPage,
          per_page: perPage,
        },
      });
      setTransactions(res.data?.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen text-gray-900">
      {/* ================= HEADER ================= */}
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-gray-500">
          Customers, Properties & Transaction Analytics
        </p>
      </div>

      {/* ================= TABS ================= */}
      <div className="flex gap-6 border-b border-gray-200">
        {["properties", "transactions","customers"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as Tab)}
            className={`pb-2 text-sm font-medium ${
              tab === t
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500">Loading...</div>}

      {/* ================= CUSTOMERS ================= */}
      {tab === "customers" && !loading && (
        <>
          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-100">
            <input
              className={inputClass}
              placeholder="Search name / phone"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            <select
              className={selectClass}
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as any)}
            >
              <option value="">All Types</option>
              <option value="BUYER">Buyer</option>
              <option value="SELLER">Seller</option>
              <option value="BOTH">Both</option>
            </select>
            <button className={buttonClass} onClick={fetchCustomers}>
              Apply
            </button>
          </div>

          <CardTable
            headers={[
              "Name",
              "Phone",
              "Type",
              "Bought",
              "Sold",
              "Recoverable",
              "Payable",
            ]}
          >
            {customers.map((c) => (
              <Row key={c.id}>
                <Cell>{c.name}</Cell>
                <Cell>{c.phone}</Cell>
                <Cell>{c.type}</Cell>
                <Cell align="right">₹{Number(c.total_bought).toLocaleString("en-IN")}</Cell>
                <Cell align="right">₹{Number(c.total_sold).toLocaleString("en-IN")}</Cell>
                <Cell align="right" className="text-red-600">
                  ₹{Number(c.recoverable).toLocaleString("en-IN")}
                </Cell>
                <Cell align="right" className="text-orange-600">
                  ₹{Number(c.payable).toLocaleString("en-IN")}
                </Cell>
              </Row>
            ))}
          </CardTable>
        </>
      )}

      {/* ================= PROPERTIES ================= */}
      {tab === "properties" && !loading && (
        <>
          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-100">
            <input
              className={inputClass}
              placeholder="Search title / invoice / party"
              value={propertySearch}
              onChange={(e) => setPropertySearch(e.target.value)}
            />
            <select
              className={selectClass}
              value={propertyStatus}
              onChange={(e) => setPropertyStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="AVAILABLE">Available</option>
              <option value="SOLD">Sold</option>
              <option value="BOOKED">Booked</option>
            </select>
            <input
              className={inputClass}
              placeholder="Category"
              value={propertyCategory}
              onChange={(e) => setPropertyCategory(e.target.value)}
            />
            <button className={buttonClass} onClick={fetchProperties}>
              Apply
            </button>
          </div>

          <CardTable
            headers={[
              "Property",
              "Category",
              "Status",
              "Purchase",
              "Sale",
              "Profit / Loss",
              "Margin",
            ]}
          >
            {properties.map((p) => (
              <Row key={p.id}>
                <Cell>{p.title}</Cell>
                <Cell>{p.category}</Cell>
                <Cell>{p.status}</Cell>
                <Cell align="right">₹{Number(p.cost_price).toLocaleString("en-IN")}</Cell>
                <Cell align="right">₹{Number(p.sale_price).toLocaleString("en-IN")}</Cell>
                <Cell
                  align="right"
                  className={
                    Number(p.profit_loss) >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  ₹{Number(p.profit_loss).toLocaleString("en-IN")}
                </Cell>
                <Cell>{p.margin_pct}</Cell>
              </Row>
            ))}
          </CardTable>
        </>
      )}

      {/* ================= TRANSACTIONS ================= */}
      {tab === "transactions" && !loading && (
        <>
          <div className="flex flex-wrap gap-3 bg-white p-4 rounded-lg border border-gray-100">
            <select className={selectClass} value={txnType} onChange={(e) => setTxnType(e.target.value)}>
              <option value="">All Types</option>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </select>

            <select
              className={selectClass}
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="">Payment Mode</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK">Bank</option>
            </select>

            <input type="date" className={inputClass} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" className={inputClass} value={endDate} onChange={(e) => setEndDate(e.target.value)} />

            <input
              className={inputClass}
              placeholder="Min Amount"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Max Amount"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
            />
            <input
              className={inputClass}
              placeholder="Search"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
            />
            <button className={buttonClass} onClick={fetchTransactions}>
              Apply
            </button>
          </div>

          <CardTable
            headers={["Date", "Property", "Party", "Type", "Mode", "Amount"]}
          >
            {transactions.map((t) => (
              <Row key={t.id}>
                <Cell>{t.payment_date?.slice(0, 10)}</Cell>
                <Cell>{t.property?.title || "-"}</Cell>
                <Cell>
                  {t.type === "CREDIT"
                    ? t.sale_deal?.buyer?.name || "-"
                    : t.property?.seller?.name || "-"}
                </Cell>
                <Cell>{t.type}</Cell>
                <Cell>{t.payment_mode}</Cell>
                <Cell
                  align="right"
                  className={t.type === "CREDIT" ? "text-green-600" : "text-red-600"}
                >
                  ₹{Number(t.amount).toLocaleString("en-IN")}
                </Cell>
              </Row>
            ))}
          </CardTable>
        </>
      )}
    </div>
  );
}

/* ================= UI HELPERS ================= */

const CardTable = ({
  headers,
  children,
}: {
  headers: string[];
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          {headers.map((h) => (
            <th key={h} className="px-4 py-3 text-left font-medium text-gray-500">
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
  <tr className="border-t border-gray-100 hover:bg-gray-50">{children}</tr>
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
