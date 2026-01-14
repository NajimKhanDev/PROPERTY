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

interface Pagination {
  total: number;
  current_page: number;
  last_page: number;
  per_page?: number;
  from?: number;
  to?: number;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("properties");
  const [loading, setLoading] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);
  const [customerPagination, setCustomerPagination] = useState<Pagination | null>(null);

  const [properties, setProperties] = useState<any[]>([]);
  const [propertyPagination, setPropertyPagination] = useState<Pagination | null>(null);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [transactionPagination, setTransactionPagination] = useState<Pagination | null>(null);

  /* ================= CUSTOMER FILTERS ================= */
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerType, setCustomerType] =
    useState<"" | "BUYER" | "SELLER">("");
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
      setCustomerPagination(res.data?.pagination || null);
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
      setPropertyPagination(res.data?.pagination || null);
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
      setTransactionPagination(res.data?.data || null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined || value === "") return "—";
    const num = Number(value);
    if (isNaN(num)) return value;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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
        {["properties", "transactions", "customers"].map((t) => (
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
              "Total Bought",
              "Total Sold",
              "Recoverable",
              "Payable",
              "Items",
            ]}
            pagination={customerPagination}
            currentPage={customerPage}
            onPageChange={setCustomerPage}
          >
            {customers.map((c) => (
              <Row key={c.id}>
                <Cell>{c.name}</Cell>
                <Cell>{c.phone}</Cell>
                <Cell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    c.type === 'BUYER' 
                      ? 'bg-blue-100 text-blue-700' 
                      : c.type === 'SELLER'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {c.type}
                  </span>
                </Cell>
                <Cell align="right">{formatCurrency(c.total_bought)}</Cell>
                <Cell align="right">{formatCurrency(c.total_sold)}</Cell>
                <Cell 
                  align="right" 
                  className={Number(c.recoverable) < 0 ? "text-green-600" : "text-red-600"}
                >
                  {formatCurrency(c.recoverable)}
                </Cell>
                <Cell 
                  align="right" 
                  className={Number(c.payable) < 0 ? "text-green-600" : "text-red-600"}
                >
                  {formatCurrency(c.payable)}
                </Cell>
                <Cell>
                  <div className="text-xs">
                    <p className="font-medium">Purchased: {c.purchased_items?.length || 0}</p>
                    <p className="text-gray-500">Sold: {c.sold_items?.length || 0}</p>
                  </div>
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
              "Area",
              "Purchase",
              "Sale",
              "Profit/Loss",
              "Margin",
              "Buyers",
            ]}
            pagination={propertyPagination}
            currentPage={propertyPage}
            onPageChange={setPropertyPage}
          >
            {properties.map((p) => (
              <Row key={p.id}>
                <Cell>
                  <div>
                    <p className="font-medium">{p.title}</p>
                    <p className="text-xs text-gray-500">From: {p.purchased_from}</p>
                  </div>
                </Cell>
                <Cell>{p.category}</Cell>
                <Cell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    p.status === 'SOLD' 
                      ? 'bg-green-100 text-green-700' 
                      : p.status === 'AVAILABLE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.status}
                  </span>
                </Cell>
                <Cell>
                  <div className="text-sm">
                    <p>Total: {p.total_area}</p>
                    <p className="text-gray-500">Sold: {p.sold_area}</p>
                  </div>
                </Cell>
                <Cell align="right">
                  <div>
                    <p>{formatCurrency(p.cost_price)}</p>
                    <p className="text-xs text-gray-500">Due: {formatCurrency(p.vendor_due)}</p>
                  </div>
                </Cell>
                <Cell align="right">
                  <div>
                    <p>{formatCurrency(p.total_sale_price)}</p>
                    <p className="text-xs text-gray-500">
                      Received: {formatCurrency(p.total_received)}
                    </p>
                  </div>
                </Cell>
                <Cell
                  align="right"
                  className={
                    Number(p.profit_loss) >= 0
                      ? "text-green-600 font-semibold"
                      : "text-red-600 font-semibold"
                  }
                >
                  <div>
                    <p>{formatCurrency(p.profit_loss)}</p>
                    <p className="text-xs">Pending: {formatCurrency(p.total_pending)}</p>
                  </div>
                </Cell>
                <Cell>{p.margin_pct}</Cell>
                <Cell>
                  <div className="text-sm">
                    <p className="font-medium">{p.total_buyers} buyers</p>
                    <p className="text-xs text-gray-500 truncate max-w-[150px]">
                      {p.sold_to}
                    </p>
                  </div>
                </Cell>
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
              <option value="ONLINE">Online</option>
            </select>

            <input 
              type="date" 
              className={inputClass} 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
            <input 
              type="date" 
              className={inputClass} 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />

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
              placeholder="Search Reference/Remarks"
              value={txnSearch}
              onChange={(e) => setTxnSearch(e.target.value)}
            />
            <button className={buttonClass} onClick={fetchTransactions}>
              Apply
            </button>
          </div>

          <CardTable
            headers={["Date", "Property", "Party", "Type", "Mode", "Reference", "Remarks", "Amount", "Receipt"]}
            pagination={transactionPagination}
            currentPage={txnPage}
            onPageChange={setTxnPage}
          >
            {transactions.map((t) => (
              <Row key={t.id}>
                <Cell>{formatDate(t.payment_date)}</Cell>
                <Cell>
                  <div>
                    <p className="font-medium">{t.property?.title || "-"}</p>
                    {t.sell_property_id && (
                      <p className="text-xs text-gray-500">Sale ID: {t.sell_property_id}</p>
                    )}
                  </div>
                </Cell>
                <Cell>
                  <div>
                    <p className="font-medium">
                      {t.type === "CREDIT"
                        ? t.sale_deal?.buyer?.name || "-"
                        : t.property?.seller?.name || "-"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.type === "CREDIT"
                        ? t.sale_deal?.buyer?.phone || "-"
                        : t.property?.seller?.phone || "-"}
                    </p>
                  </div>
                </Cell>
                <Cell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    t.type === 'CREDIT' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {t.type}
                  </span>
                </Cell>
                <Cell>{t.payment_mode}</Cell>
                <Cell>
                  <div className="text-sm">
                    <p className="font-medium">{t.reference_no || "-"}</p>
                    {t.transaction_no && (
                      <p className="text-xs text-gray-500">Tx: {t.transaction_no}</p>
                    )}
                  </div>
                </Cell>
                <Cell>
                  <p className="text-sm">{t.remarks || "-"}</p>
                </Cell>
                <Cell
                  align="right"
                  className={t.type === "CREDIT" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}
                >
                  {formatCurrency(t.amount)}
                </Cell>
                <Cell>
                  {t.payment_receipt ? (
                    <a
                      href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${t.payment_receipt}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      View
                    </a>
                  ) : "—"}
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
  pagination,
  currentPage,
  onPageChange,
}: {
  headers: string[];
  children: React.ReactNode;
  pagination?: Pagination | null;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}) => {
  const handlePageChange = (page: number) => {
    if (onPageChange && page >= 1 && page <= (pagination?.last_page || 1)) {
      onPageChange(page);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
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
      
      {pagination && pagination.total > 0 && (
        <div className="border-t border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{pagination.from || 1}</span> to{" "}
            <span className="font-medium">{pagination.to || pagination.total}</span> of{" "}
            <span className="font-medium">{pagination.total}</span> results
          </div>
          
          {pagination.last_page > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange((currentPage || 1) - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                  let pageNum;
                  if (pagination.last_page <= 5) {
                    pageNum = i + 1;
                  } else if ((currentPage || 1) <= 3) {
                    pageNum = i + 1;
                  } else if ((currentPage || 1) >= pagination.last_page - 2) {
                    pageNum = pagination.last_page - 4 + i;
                  } else {
                    pageNum = (currentPage || 1) - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 text-sm rounded ${
                        currentPage === pageNum
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange((currentPage || 1) + 1)}
                disabled={currentPage === pagination.last_page}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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