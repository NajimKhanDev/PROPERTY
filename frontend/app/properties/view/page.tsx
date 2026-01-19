"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";


function PropertyViewContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

  const [property, setProperty] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [emiOpen, setEmiOpen] = useState(true); // default expanded

  const [emis, setEmis] = useState<any[]>([]);
  const [openEmiPay, setOpenEmiPay] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<any>(null);
  const [emiLoading, setEmiLoading] = useState(false);

  const [openUnpayModal, setOpenUnpayModal] = useState(false);
  const [emiToUnpay, setEmiToUnpay] = useState<any>(null);


  const [emiPayment, setEmiPayment] = useState({
    paid_amount: "",
    payment_mode: "BANK",
    transaction_no: "", // ✅ NEW
    payment_receipt: null as File | null,
  });



  // payment modal
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const [payment, setPayment] = useState({
    amount: "",
    payment_date: "",
    payment_mode: "ONLINE",
    reference_no: "",
    remarks: "",
  });

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchProperty();
    fetchTransactions();
    fetchEmis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchEmis = async () => {
    try {
      const res = await axiosInstance.get(
        `/emis?property_id=${propertyId}`
      );

      // pagination response
      setEmis(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load EMIs", err);
    }
  };


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

  const fetchTransactions = async () => {
    try {
      const res = await axiosInstance.get(
        `/transactions?property_id=${propertyId}&type=DEBIT`
      );
      setTransactions(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load transactions", err);
    }
  };

  /* ================= CREATE PAYMENT ================= */
  const submitPayment = async () => {
    try {
      setPaymentLoading(true);

      await axiosInstance.post("/transactions", {
        property_id: property.id,
        sell_property_id: property.sell_property_id,
        amount: Number(payment.amount),
        payment_date: payment.payment_date,
        payment_mode: payment.payment_mode,
        reference_no: payment.reference_no,
        remarks: payment.remarks,
      });

      setOpenPayment(false);
      setPayment({
        amount: "",
        payment_date: "",
        payment_mode: "ONLINE",
        reference_no: "",
        remarks: "",
      });

      fetchProperty();
      fetchTransactions();
    } catch (err: any) {
      console.error("Payment failed", err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        "Payment failed";

      toast.error(message);
    } finally {
      setPaymentLoading(false);
    }

  };

  const submitEmiPayment = async () => {
    if (!selectedEmi) return;

    if (!emiPayment.payment_receipt) {
      toast.error("Payment receipt is required");
      return;
    }

    if (
      (emiPayment.payment_mode === "BANK" ||
        emiPayment.payment_mode === "ONLINE") &&
      !emiPayment.transaction_no
    ) {
      toast.error("Transaction number is required");
      return;
    }



    try {
      setEmiLoading(true);

      const formData = new FormData();
      formData.append("paid_amount", emiPayment.paid_amount);
      formData.append("payment_mode", emiPayment.payment_mode);
      formData.append("transaction_no", emiPayment.transaction_no);

      if (emiPayment.payment_receipt) {
        formData.append("payment_receipt", emiPayment.payment_receipt);
      }

      await axiosInstance.post(
        `/emis/${selectedEmi.id}/pay`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("EMI paid successfully");


      setOpenEmiPay(false);
      setEmiPayment({
        paid_amount: "",
        payment_mode: "BANK",
        transaction_no: "",
        payment_receipt: null,
      });


      fetchEmis();
      fetchTransactions();
      fetchProperty();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
    } finally {
      setEmiLoading(false);
    }
  };


  const confirmUnpayEmi = async () => {
    if (!emiToUnpay) return;

    try {
      setEmiLoading(true);

      await axiosInstance.post(`/emis/${emiToUnpay.id}/unpay`);

      toast.success("EMI marked as unpaid");

      setOpenUnpayModal(false);
      setEmiToUnpay(null);

      fetchEmis();
      fetchTransactions();
      fetchProperty();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to unpay EMI");
    } finally {
      setEmiLoading(false);
    }
  };



  const formatAmount = (val: any) =>
    val !== null && val !== undefined
      ? `₹${Number(val).toLocaleString("en-IN")}`
      : "—";

  const formatText = (val: any) => val ?? "—";

  const allEmisPaid =
    emis.length > 0 && emis.every((emi) => emi.status === "PAID");


  const isTxnRequired =
    emiPayment.payment_mode === "BANK" ||
    emiPayment.payment_mode === "ONLINE";

  const isConfirmDisabled =
    emiLoading ||
    !emiPayment.payment_receipt ||
    (isTxnRequired && !emiPayment.transaction_no);


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

      {/* ================= PROPERTY INFO ================= */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6 text-sm">
        <h2 className="text-lg font-semibold">Property Information</h2>

        {/* BASIC DETAILS */}
        <div>
          <h4 className="font-bold text-gray-700 mb-3">Basic Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Info label="Transaction Type" value={property.transaction_type} />
            <Info label="Title" value={property.title} />
            <Info label="Category" value={property.category} />
            <Info label="Status" value={property.status} />
            {/* <Info label="Invoice No" value={property.invoice_no} /> */}
            {/* <Info label="Payment Mode" value={property.payment_mode} /> */}
          </div>
        </div>

        {/* LOCATION & PROPERTY */}
        <div>
          <h4 className="font-bold text-gray-700 mb-3">Property Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Info label="Address" value={property.address} />
            <Info label="Plot Number" value={property.plot_number} />
            <Info label="Khata Number" value={property.khata_number} />
            {/* <Info label="House Number" value={property.house_number} />
            <Info label="Floor Number" value={property.floor_number} />
            <Info label="BHK" value={property.bhk} /> */}
          </div>
        </div>

        {/* AREA DETAILS */}
        <div>
          <h4 className="font-bold text-gray-700 mb-3">Area Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Info label="Area (Dismil)" value={property.area_dismil} />
            <Info
              label="Per Dismil Amount"
              value={formatAmount(property.per_dismil_amount)}
            />
            {/* <Info
              label="Super Built-up Area"
              value={property.super_built_up_area}
            /> */}
          </div>
        </div>



        {/* FINANCIAL DETAILS */}
        {/* <div>
          <h4 className="font-bold text-gray-700 mb-3">Financial Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="Quantity" value={property.quantity} />
            <Info label="Rate" value={formatAmount(property.rate)} />
            <Info label="Base Amount" value={formatAmount(property.base_amount)} />
            <Info
              label="GST (%)"
              value={property.gst_percentage}
            />
            <Info label="GST Amount" value={formatAmount(property.gst_amount)} />
            <Info
              label="Other Expenses"
              value={formatAmount(property.other_expenses)}
            />
            <Info
              label="Total Amount"
              value={formatAmount(property.total_amount)}
            />
            <Info
              label="Paid Amount"
              value={formatAmount(property.paid_amount)}
            />
            <Info
              label="Due Amount"
              value={formatAmount(property.due_amount)}
            />
          </div>
        </div> */}

        {/* EMI DETAILS */}
        {/* <div>
          <h4 className="font-bold text-gray-700 mb-3">EMI Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Info label="Period (Years)" value={property.period_years} />
            <Info
              label="Amount / Month"
              value={formatAmount(property.amount_per_month)}
            />
          </div>
        </div> */}

        {/* RECEIPT */}
        {/* {property.payment_receipt && (
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Payment Receipt</h4>
            <a
              href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${property.payment_receipt}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 text-sm font-medium hover:underline"
            >
              View Receipt
            </a>
          </div>
        )} */}
      </div>

      {/* ================= VENDOR DETAILS ================= */}
      {property?.seller && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4 mt-5">
          <h3 className="text-lg font-semibold text-gray-800">
            Vendor (Seller) Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <Info label="Name" value={property.seller.name} />
            <Info label="Phone" value={property.seller.phone} />
            <Info label="Email" value={property.seller.email} />
            <Info label="Address" value={property.seller.address} />
            <Info label="PAN Number" value={property.seller.pan_number} />
            <Info label="Aadhaar Number" value={property.seller.aadhar_number} />
          </div>

          {/* DOCUMENT LINKS */}
          <div className="flex flex-wrap gap-6 pt-2">
            {property.seller.pan_file_path && (
              <a
                href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${property.seller.pan_file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                View PAN Document
              </a>
            )}

            {property.seller.aadhar_file_path && (
              <a
                href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${property.seller.aadhar_file_path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 text-sm hover:underline"
              >
                View Aadhaar Document
              </a>
            )}
          </div>
        </div>
      )}



      {/* ================= PAYMENTS ================= */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Payments</h3>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Paid Amount" value={property.paid_amount} color="green" />
          <SummaryCard label="Due Amount" value={property.due_amount} color="red" />
          <SummaryCard label="Total Amount" value={property.total_amount} color="blue" />
        </div>

        {property.due_amount > 0 && allEmisPaid && (
          <button
            onClick={() => {
              setPayment({
                amount: property.due_amount,
                payment_date: new Date().toISOString().slice(0, 10),
                payment_mode: "ONLINE",
                reference_no: "",
                remarks: "",
              });
              setOpenPayment(true);
            }}
            className="px-5 py-2 bg-[#0070BB] text-white rounded-md hover:bg-[#005A99]"
          >
            Add Payment
          </button>
        )}


        {/* TRANSACTIONS */}
        <h4 className="font-semibold mt-6 mb-3">Transaction History</h4>

        {transactions.length === 0 ? (
          <p className="text-sm text-gray-500">No transactions found</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm text-gray-700">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Transaction No
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Receipt
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500">
                    Remarks
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(tx.payment_date).toLocaleDateString("en-IN")}
                    </td>

                    {/* Mode */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {tx.payment_mode}
                      </span>
                    </td>

                    {/* Transaction No */}
                    <td className="px-4 py-3 text-gray-600">
                      {tx.transaction_no || "—"}
                    </td>

                    {/* Reference */}
                    <td className="px-4 py-3 text-gray-600">
                      {tx.reference_no || "—"}
                    </td>

                    {/* Receipt */}
                    <td className="px-4 py-3">
                      {tx.payment_receipt ? (
                        <a
                          href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${tx.payment_receipt}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs font-medium hover:underline"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* Remarks */}
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {tx.remarks || "—"}
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        )}
      </div>


      {/* ================= EMI ================= */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <div
          className="flex items-center justify-between mb-4 cursor-pointer select-none"
          onClick={() => setEmiOpen(!emiOpen)}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {emiOpen ? "▾" : "▸"}
            </span>
            <h3 className="text-lg font-semibold text-gray-800">
              EMI Schedule
            </h3>
          </div>

          <span className="text-xs text-gray-500">
            Total EMIs: {emis.length}
          </span>
        </div>


        {emiOpen && (
          emis.length === 0 ? (
            <p className="text-sm text-gray-500">
              No EMI schedule available
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr className="text-gray-600">
                    <th className="px-4 py-3 text-left">EMI No</th>
                    <th className="px-4 py-3 text-left">Due Date</th>
                    <th className="px-4 py-3 text-right">EMI Amount</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Transaction No</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Receipt</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {emis.map((emi) => {
                    const isPaid = emi.status === "PAID";

                    return (
                      <tr
                        key={emi.id}
                        className="border-t border-gray-200 hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 font-medium">
                          EMI {emi.emi_number}
                        </td>

                        <td className="px-4 py-3">
                          {new Date(emi.due_date).toLocaleDateString("en-IN")}
                        </td>

                        <td className="px-4 py-3 text-right font-medium">
                          ₹{Number(emi.emi_amount).toLocaleString("en-IN")}
                        </td>

                        <td className="px-4 py-3 text-right text-gray-700">
                          ₹{Number(emi.paid_amount).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {emi.transaction_no}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${isPaid
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                              }`}
                          >
                            {emi.status}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {emi.payment_receipt ? (
                            <a
                              href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${emi.payment_receipt}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 text-xs font-medium hover:underline"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>


                        <td className="px-4 py-3 text-right">
                          {!isPaid ? (
                            <button
                              onClick={() => {
                                setSelectedEmi(emi);
                                setEmiPayment({
                                  paid_amount: emi.emi_amount,
                                  payment_mode: "BANK",
                                  transaction_no: "",
                                  payment_receipt: null,
                                });
                                setOpenEmiPay(true);
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-[#0070BB] text-white rounded-md hover:bg-[#005A99]"
                            >
                              Pay EMI
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setEmiToUnpay(emi);
                                setOpenUnpayModal(true);
                              }}
                              className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                              Unpay
                            </button>

                          )}

                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>



      {/* ================= DOCUMENTS ================= */}
      {/* <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Documents</h3>

        {property.documents?.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded</p>
        ) : (
          <div className="space-y-6">

            <div>
              <h4 className="font-medium mb-2">Purchase / Inventory Documents</h4>

              {property.documents.filter((d: any) => !d.sell_property_id).length === 0 ? (
                <p className="text-sm text-gray-500">No purchase documents</p>
              ) : (
                <DocList
                  docs={property.documents.filter(
                    (d: any) => !d.sell_property_id
                  )}
                />
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Sale Documents</h4>

              {property.documents.filter((d: any) => d.sell_property_id).length === 0 ? (
                <p className="text-sm text-gray-500">No sale documents</p>
              ) : (
                <DocList
                  docs={property.documents.filter(
                    (d: any) => d.sell_property_id
                  )}
                />
              )}
            </div>

          </div>
        )}
      </div> */}

      {/* ================= MODAL ================= */}
      {openPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Soft blur layer without dark tint */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/40" />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Add Payment</h3>

            <input
              type="number"
              placeholder="Amount"
              value={payment.amount}
              onChange={(e) =>
                setPayment({ ...payment, amount: e.target.value })
              }
              disabled
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <input
              type="date"
              value={payment.payment_date}
              onChange={(e) =>
                setPayment({ ...payment, payment_date: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <select
              value={payment.payment_mode}
              onChange={(e) =>
                setPayment({ ...payment, payment_mode: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            >
              <option value="ONLINE">Online</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
            </select>

            <input
              placeholder="Reference Number"
              value={payment.reference_no}
              onChange={(e) =>
                setPayment({ ...payment, reference_no: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <textarea
              rows={2}
              placeholder="Remarks"
              value={payment.remarks}
              onChange={(e) =>
                setPayment({ ...payment, remarks: e.target.value })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0070BB]"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setOpenPayment(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitPayment}
                disabled={paymentLoading}
                className="px-4 py-2 rounded-md bg-[#0070BB] text-white hover:bg-[#005A99]"
              >
                {paymentLoading ? "Saving..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}


      {openEmiPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">
              Pay EMI
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              EMI #{selectedEmi?.emi_number} · Due on{" "}
              {selectedEmi &&
                new Date(selectedEmi.due_date).toLocaleDateString("en-IN")}
            </p>

            {/* EMI Amount */}
            <div className="mb-4">
              <label className="text-xs text-gray-500">EMI Amount</label>
              <input
                type="number"
                value={emiPayment.paid_amount}
                onChange={(e) =>
                  setEmiPayment({
                    ...emiPayment,
                    paid_amount: e.target.value,
                  })
                }
                disabled
                className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#0070BB]"
              />
            </div>

            {/* Payment Mode */}
            <div className="mb-4">
              <label className="text-xs text-gray-500">Payment Mode</label>
              <select
                value={emiPayment.payment_mode}
                onChange={(e) =>
                  setEmiPayment({
                    ...emiPayment,
                    payment_mode: e.target.value,
                  })
                }
                className="w-full mt-1 border rounded-md px-3 py-2"
              >
                <option value="BANK">Bank</option>
                <option value="ONLINE">Online</option>
                <option value="CASH">Cash</option>
              </select>
            </div>

            {/* Transaction No (BANK / ONLINE only) */}
            {(emiPayment.payment_mode === "BANK" ||
              emiPayment.payment_mode === "ONLINE") && (
                <div className="mb-4">
                  <label className="text-xs text-gray-500">
                    Transaction No <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    placeholder="Enter transaction number"
                    value={emiPayment.transaction_no}
                    onChange={(e) =>
                      setEmiPayment({
                        ...emiPayment,
                        transaction_no: e.target.value,
                      })
                    }
                    className="w-full mt-1 border rounded-md px-3 py-2 focus:ring-2 focus:ring-[#0070BB]"
                  />
                </div>
              )}



            {/* Receipt */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Payment Receipt <span className="text-red-500">*</span>
              </label>

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                required
                onChange={(e) =>
                  setEmiPayment({
                    ...emiPayment,
                    payment_receipt: e.target.files?.[0] || null,
                  })
                }
                className="
      w-full rounded-lg border border-gray-300 bg-white
      px-3 py-2 text-sm text-gray-700
      file:mr-4 file:rounded-md file:border-0
      file:bg-blue-600 file:px-4 file:py-2
      file:text-xs file:font-medium file:text-white
      hover:file:bg-blue-700
      focus:outline-none focus:ring-2 focus:ring-blue-500
    "
              />

              <p className="mt-1 text-xs text-gray-500">
                Accepted formats: JPG, PNG, PDF · Max size 5MB
              </p>
            </div>


            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpenEmiPay(false)}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={submitEmiPayment}
                disabled={isConfirmDisabled}
                className={`px-4 py-2 rounded-md text-white ${isConfirmDisabled
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0070BB] hover:bg-[#005A99]"
                  }`}
              >
                {emiLoading ? "Processing..." : "Confirm Payment"}
              </button>

            </div>
          </div>
        </div>
      )}

      {openUnpayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Confirm Unpay EMI
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              You are about to <span className="font-semibold text-red-600">unpay</span>{" "}
              <strong>EMI #{emiToUnpay?.emi_number}</strong> of amount{" "}
              <strong>
                ₹{Number(emiToUnpay?.emi_amount).toLocaleString("en-IN")}
              </strong>.
            </p>

            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-700 mb-4">
              ⚠️ This will:
              <ul className="list-disc ml-5 mt-1 space-y-1">
                <li>Mark the EMI as unpaid</li>
                <li>Remove transaction number & receipt</li>
                <li>Update paid & due amounts</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setOpenUnpayModal(false);
                  setEmiToUnpay(null);
                }}
                className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>

              <button
                onClick={confirmUnpayEmi}
                disabled={emiLoading}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {emiLoading ? "Processing..." : "Yes, Unpay EMI"}
              </button>
            </div>
          </div>
        </div>
      )}



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

/* ================= SMALL COMPONENTS ================= */
const Info = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-gray-500">{label}</p>
    <p className="font-medium">{value || "—"}</p>
  </div>
);

const SummaryCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "red" | "blue";
}) => {
  const colorMap: any = {
    green: "bg-green-50 border-green-200 text-green-600",
    red: "bg-red-50 border-red-200 text-red-600",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorMap[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const DocList = ({ docs }: { docs: any[] }) => (
  <div className="border rounded-lg divide-y">
    {docs.map((doc) => (
      <div
        key={doc.id}
        className="flex items-center justify-between p-3 hover:bg-gray-50"
      >
        <div>
          <p className="font-medium">{doc.doc_name}</p>
          <p className="text-xs text-gray-500">
            Uploaded on{" "}
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
