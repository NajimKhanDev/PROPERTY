"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";

/* ================= PAGE ================= */
function PropertyViewContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSaleTab, setActiveSaleTab] = useState<string>("all");

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchMasterView();
  }, [propertyId]);

  const fetchMasterView = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `/properties/master-view/${propertyId}`
      );
      setData(res.data);
      // Set first buyer as active tab if available
      if (res.data.ledger?.sales_history?.length > 0) {
        setActiveSaleTab(res.data.ledger.sales_history[0].sale_id.toString());
      }
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

  const { overview, financials, parties, ledger, documents, emi_details } = data;

  // Get all transactions for "All" tab
  const allSaleTransactions = ledger.sales_history.flatMap(
    (sale: any) => sale.transactions
  );

  return (
    <div className="p-6 text-black space-y-6">
      {/* HEADER */}
      <div>
        <Link href="/allproperties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold mt-2">
          Property Master View
        </h1>
      </div>

      {/* ================= OVERVIEW ================= */}
      <Section title="Property Overview">
        <Grid>
          <Info label="Title" value={overview.title} />
          <Info label="Category" value={overview.category} />
          <Info label="Status" value={overview.status} />
          <Info
            label="Added On"
            value={new Date(overview.added_on).toLocaleDateString("en-IN")}
          />
          <Info label="Total Area (dismil)" value={overview.total_area} />
          <Info label="Sold Area (dismil)" value={overview.sold_area} />
          <Info label="Remaining Area (dismil)" value={overview.remaining_area} />
        </Grid>
      </Section>

      {/* ================= VENDOR ================= */}
      <Section title="Vendor (Purchase Party)">
        <Grid>
          <Info label="Name" value={parties.vendor?.name} />
          <Info label="Phone" value={parties.vendor?.phone} />
          <Info label="Email" value={parties.vendor?.email} />
        </Grid>
      </Section>

      {/* ================= BUYERS ================= */}
      <Section title="Buyers (Sale Parties)">
        {parties.buyers && parties.buyers.length > 0 ? (
          <div className="space-y-4">
            {parties.buyers.map((buyerInfo: any, index: number) => (
              <div key={buyerInfo.sale_id} className="border border-gray-300 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Buyer {index + 1} (Sale ID: {buyerInfo.sale_id})</h3>
                <Grid>
                  <Info label="Name" value={buyerInfo.buyer?.name} />
                  <Info label="Phone" value={buyerInfo.buyer?.phone} />
                  <Info label="Email" value={buyerInfo.buyer?.email} />
                  <Info label="Area (dismil)" value={buyerInfo.area_dismil} />
                  <Info label="Sale Amount" value={formatCurrency(buyerInfo.sale_amount)} />
                  <Info label="Received Amount" value={formatCurrency(buyerInfo.received_amount)} />
                  <Info label="Pending Amount" value={formatCurrency(buyerInfo.pending_amount)} />
                  <Info label="Payment Status" value={buyerInfo.payment_status} />
                </Grid>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Property not sold yet
          </p>
        )}
      </Section>

      {/* ================= FINANCIAL SUMMARY ================= */}
      <Section title="Financial Summary">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard
            label="Purchase Cost"
            value={financials.purchase_cost}
            color="red"
          />
          <SummaryCard
            label="Total Sale Revenue"
            value={financials.total_sale_revenue}
            color="green"
          />
          <SummaryCard
            label="Net Profit"
            value={financials.net_profit}
            color="blue"
          />
          <SummaryCard
            label="Total Received"
            value={financials.total_received}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
          <DueCard
            label="Vendor Due"
            value={financials.vendor_due}
            type="vendor"
          />
          <DueCard
            label="Total Pending"
            value={financials.total_pending}
            type="customer"
          />
        </div>
      </Section>

      {/* ================= VENDOR LEDGER ================= */}
      {/* <Section title="Vendor Ledger (Purchase)">
        {ledger.purchase_history.length === 0 ? (
          <p className="text-sm text-gray-500">
            No purchase transactions found
          </p>
        ) : (
          <LedgerTable
            data={ledger.purchase_history}
            type="DEBIT"
          />
        )}
      </Section> */}

      {/* ================= BUYER LEDGERS - TAB VIEW ================= */}
      <Section title="Buyer Ledgers (Sales)">
        {ledger.sales_history.length === 0 ? (
          <p className="text-sm text-gray-500">
            No sale transactions found
          </p>
        ) : (
          <div className="space-y-4">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-2 overflow-x-auto">
                <button
                  onClick={() => setActiveSaleTab("all")}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    activeSaleTab === "all"
                      ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All Transactions
                </button>
                {ledger.sales_history.map((sale: any) => (
                  <button
                    key={sale.sale_id}
                    onClick={() => setActiveSaleTab(sale.sale_id.toString())}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      activeSaleTab === sale.sale_id.toString()
                        ? "bg-blue-50 text-blue-600 border-b-2 border-blue-500"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {sale.buyer_name} (Sale #{sale.sale_id})
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {activeSaleTab === "all" ? (
                <div>
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-600">
                      Showing all transactions across {ledger.sales_history.length} buyers
                    </p>
                  </div>
                  <LedgerTable
                    data={allSaleTransactions}
                    type="CREDIT"
                  />
                </div>
              ) : (
                ledger.sales_history
                  .filter((sale: any) => sale.sale_id.toString() === activeSaleTab)
                  .map((sale: any) => (
                    <div key={sale.sale_id}>
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold">
                          Buyer: {sale.buyer_name} (Sale ID: {sale.sale_id})
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Total Transactions: {sale.transactions.length}
                        </p>
                      </div>
                      <LedgerTable
                        data={sale.transactions}
                        type="CREDIT"
                      />
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </Section>

      {/* ================= EMI DETAILS - TAB VIEW ================= */}
      {emi_details && emi_details.length > 0 && (
        <Section title="EMI Details">
          <div className="space-y-4">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-2 overflow-x-auto">
                {emi_details.map((emiGroup: any, index: number) => (
                  <button
                    key={emiGroup.sale_id}
                    onClick={() => setActiveSaleTab(`emi_${emiGroup.sale_id}`)}
                    className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                      activeSaleTab === `emi_${emiGroup.sale_id}`
                        ? "bg-green-50 text-green-600 border-b-2 border-green-500"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {emiGroup.buyer_name} (EMIs)
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-4">
              {emi_details
                .filter((emiGroup: any) => activeSaleTab === `emi_${emiGroup.sale_id}`)
                .map((emiGroup: any) => (
                  <div key={emiGroup.sale_id}>
                    <div className="mb-4 p-4 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-green-800">
                            Buyer: {emiGroup.buyer_name} (Sale ID: {emiGroup.sale_id})
                          </h3>
                          <p className="text-sm text-green-600 mt-1">
                            EMIs: {emiGroup.paid_emis} paid of {emiGroup.total_emis} total
                            {emiGroup.pending_emis > 0 && ` • ${emiGroup.pending_emis} pending`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-800">
                            Payment Status: {emiGroup.pending_emis === 0 ? "FULLY PAID" : "PARTIAL"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-left p-3">EMI #</th>
                            <th className="text-left p-3">Amount</th>
                            <th className="text-left p-3">Due Date</th>
                            <th className="text-left p-3">Status</th>
                            <th className="text-left p-3">Paid Date</th>
                            <th className="text-left p-3">Payment Mode</th>
                            <th className="text-left p-3">Receipt</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {emiGroup.emis.map((emi: any) => (
                            <tr key={emi.id} className="border-b border-gray-200">
                              <td className="p-3">{emi.emi_number}</td>
                              <td className="p-3 font-medium">
                                ₹{Number(emi.emi_amount).toLocaleString("en-IN")}
                              </td>
                              <td className="p-3">
                                {new Date(emi.due_date).toLocaleDateString("en-IN")}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  emi.status === 'PAID' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {emi.status}
                                </span>
                              </td>
                              <td className="p-3">
                                {emi.paid_date 
                                  ? new Date(emi.paid_date).toLocaleDateString("en-IN")
                                  : "—"
                                }
                              </td>
                              <td className="p-3">{emi.payment_mode || "—"}</td>
                              <td className="p-3">
                                {emi.payment_receipt ? (
                                  <a
                                    href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${emi.payment_receipt}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:underline"
                                  >
                                    View
                                  </a>
                                ) : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Section>
      )}

      {/* ================= DOCUMENTS ================= */}
      {/* {documents && (
        <Section title="Property Documents">
          <div className="space-y-6">
            {documents.inventory_docs && documents.inventory_docs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Inventory Documents</h3>
                <DocList docs={documents.inventory_docs} />
              </div>
            )}
            {documents.sale_docs && documents.sale_docs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Sale Documents</h3>
                <DocList docs={documents.sale_docs} />
              </div>
            )}
            {(!documents.inventory_docs || documents.inventory_docs.length === 0) && 
             (!documents.sale_docs || documents.sale_docs.length === 0) && (
              <p className="text-sm text-gray-500">No documents found</p>
            )}
          </div>
        </Section>
      )} */}
    </div>
  );
}

export default function PropertyViewPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Loading property details...</div>}>
      <PropertyViewContent />
    </Suspense>
  );
}

/* ================= UI HELPERS ================= */

const Section = ({ title, children }: any) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </div>
);

const Grid = ({ children }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {children}
  </div>
);

const Info = ({ label, value }: any) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

const isNumeric = (val: any) =>
  val !== null &&
  val !== undefined &&
  val !== "" &&
  !isNaN(Number(val));

const formatCurrency = (val: any) => {
  if (!isNumeric(val)) return "—";
  return `₹${Number(val).toLocaleString("en-IN")}`;
};

const SummaryCard = ({ label, value, color }: any) => {
  const map: any = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-lg ${map[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">
        {formatCurrency(value)}
      </p>
    </div>
  );
};

const DueCard = ({ label, value, type }: any) => {
  const numeric = isNumeric(value);
  const isZero = numeric && Number(value) === 0;

  return (
    <div
      className={`p-4 rounded-lg border ${
        !numeric || isZero
          ? "bg-gray-50 text-gray-600"
          : type === "customer"
          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
          : "bg-purple-50 text-purple-700 border-purple-200"
      }`}
    >
      <p className="text-sm">{label}</p>
      <p className="text-xl font-bold">
        {formatCurrency(value)}
      </p>

      {numeric && !isZero && (
        <p className="text-xs mt-1">
          {type === "customer"
            ? "Amount to receive from customer"
            : "Amount to pay vendor"}
        </p>
      )}
    </div>
  );
};

const LedgerTable = ({
  data,
  type,
}: {
  data: any[];
  type: "DEBIT" | "CREDIT";
}) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left p-3">Date</th>
          <th className="text-left p-3">Mode</th>
          <th className="text-left p-3">Reference</th>
          <th className="text-left p-3">Remarks</th>
          <th className="text-right p-3">Amount</th>
          <th className="text-left p-3">Receipt</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {data.map((tx,i) => (
          <tr key={i} className="border-b border-gray-200 hover:bg-gray-50">
            <td className="p-3">
              {new Date(tx.payment_date).toLocaleDateString("en-IN")}
            </td>
            <td className="p-3">{tx.payment_mode}</td>
            <td className="p-3">{tx.reference_no || "—"}</td>
            <td className="p-3">{tx.remarks || "—"}</td>
            <td
              className={`p-3 text-right font-semibold ${
                type === "CREDIT"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              ₹{Number(tx.amount).toLocaleString("en-IN")}
            </td>
            <td className="p-3">
              {tx.payment_receipt ? (
                <a
                  href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${tx.payment_receipt}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  View
                </a>
              ) : "—"}
            </td>
          </tr>
        ))}
      </tbody>
      {data.length > 0 && (
        <tfoot className="bg-gray-50">
          <tr>
            <td colSpan={4} className="p-3 text-right font-semibold">
              Total:
            </td>
            <td className="p-3 text-right font-bold">
              ₹{data.reduce((sum, tx) => sum + Number(tx.amount), 0).toLocaleString("en-IN")}
            </td>
            <td className="p-3"></td>
          </tr>
        </tfoot>
      )}
    </table>
  </div>
);

const DocList = ({ docs }: { docs: any[] }) => (
  <div className="divide-y border rounded-lg overflow-hidden">
    {docs.map((doc) => (
      <div
        key={doc.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50"
      >
        <div>
          <p className="font-medium">{doc.doc_name}</p>
          <p className="text-xs text-gray-500">
            Added on{" "}
            {new Date(doc.created_at).toLocaleDateString("en-IN")}
          </p>
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${doc.doc_file}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline"
        >
          View / Download
        </a>
      </div>
    ))}
  </div>
);