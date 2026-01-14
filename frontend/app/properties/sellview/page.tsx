"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import axiosInstance from "@/app/api/axiosInstance";
import ProjectApi from "@/app/api/ProjectApis";
import toast from "react-hot-toast";

export default function PropertyViewPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get("id");

  const [data, setData] = useState<any>(null);
  const [dealData, setDealData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [emiOpen, setEmiOpen] = useState(true);

  const [emis, setEmis] = useState<any[]>([]);
  const [openEmiPay, setOpenEmiPay] = useState(false);
  const [selectedEmi, setSelectedEmi] = useState<any>(null);
  const [savingEmi, setSavingEmi] = useState(false);

  const [openUnpayModal, setOpenUnpayModal] = useState(false);
  const [emiToUnpay, setEmiToUnpay] = useState<any>(null);


  const [emiPayment, setEmiPayment] = useState({
    paid_amount: "",
    payment_mode: "CASH",
    transaction_no: "",
    payment_receipt: null as File | null,
  });


  const [openPayment, setOpenPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [paymentData, setPaymentData] = useState<any>({
    amount: "",
    payment_mode: "ONLINE",
    reference_no: "",
    payment_date: "",
    remarks: "",
  });


  /* ================= FETCH PROPERTY ================= */
  useEffect(() => {
    if (!propertyId) return;
    fetchProperty();
    // fetchSellDeal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  useEffect(() => {
    if (dealData?.deal_summary?.sale_id) {
      fetchEmis(dealData.deal_summary.sale_id);
    }
  }, [dealData]);


  const fetchEmis = async (sellPropertyId: number) => {
    try {
      const res = await axiosInstance.get(
        `/sell-emis?sell_property_id=${sellPropertyId}`
      );
      if (res.data?.status) {
        setEmis(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch EMIs", err);
    }
  };


  const fetchProperty = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(
        `${ProjectApi.sell_property}/${propertyId}`
      );

      const sale = res.data;


      setData(sale);
      setDealData({
        deal_summary: {
          invoice_no: sale.invoice_no,
          property_title: sale.property?.title,
          buyer_name: sale.buyer?.name,
          status: sale.pending_amount > 0 ? "PENDING" : "COMPLETED",
          total_sale_val: sale.total_sale_amount,
          received_total: sale.received_amount,
          pending_due: sale.pending_amount,
          sale_id: sale.id,
        },
        transactions: sale.transactions || [],
      });
    } catch (err) {
      console.error("Failed to load property", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH SELL DEAL ================= */
  // const fetchSellDeal = async () => {
  //   try {
  //     const res = await axiosInstance.get(
  //       `/transactions/sell-deal/${propertyId}`
  //     );
  //     if (res.data?.status) {
  //       setDealData(res.data);
  //     }
  //   } catch (err) {
  //     console.error("Failed to load sell deal", err);
  //   }
  // };

  /* ================= PAY EMIs ================= */

  const payEmi = async () => {
    if (!selectedEmi) return;

    if (!isEmiFormValid) {
      alert("Please fill all required fields");
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
      setSavingEmi(true);

      const fd = new FormData();
      fd.append("paid_amount", emiPayment.paid_amount);
      fd.append("payment_mode", emiPayment.payment_mode);
      fd.append("transaction_no", emiPayment.transaction_no);

      if (emiPayment.payment_receipt) {
        fd.append("payment_receipt", emiPayment.payment_receipt);
      }

      await axiosInstance.post(
        `/sell-emis/${selectedEmi.id}/pay`,
        fd
      );

      toast.success("EMI paid successfully");

      window.location.reload()

      setOpenEmiPay(false);
      setSelectedEmi(null);

      fetchEmis(selectedEmi.sell_property_id);
      // fetchSellDeal(); // update totals
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to pay EMI"
      );
    } finally {
      setSavingEmi(false);
    }
  };

  const confirmUnpayEmi = async () => {
    if (!emiToUnpay) return;

    try {
      setSavingEmi(true);

      await axiosInstance.post(
        `/sell-emis/${emiToUnpay.id}/unpay`
      );

      toast.success("EMI marked as unpaid");

      setOpenUnpayModal(false);
      setEmiToUnpay(null);

      fetchEmis(emiToUnpay.sell_property_id);
      window.location.reload(); // keeping consistent with your pattern
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to unpay EMI"
      );
    } finally {
      setSavingEmi(false);
    }
  };




  /* ================= ADD PAYMENT ================= */
  const submitPayment = async () => {
    try {
      setSavingPayment(true);

      const res = await axiosInstance.post("/transactions", {
        property_id: data.property.id,
        sell_property_id: dealData.deal_summary.sale_id,
        amount: paymentData.amount,
        payment_mode: paymentData.payment_mode,
        reference_no: paymentData.reference_no,
        payment_date: paymentData.payment_date,
        remarks: paymentData.remarks,
        type: "CREDIT",
      });

      toast.success("Payment added successfully");

      setOpenPayment(false);
      setPaymentData({
        amount: "",
        payment_mode: "ONLINE",
        reference_no: "",
        payment_date: "",
        remarks: "",
      });

      window.location.reload()
      // fetchSellDeal(); // refresh list
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to add payment";

      toast.error(message); // ✅ SHOW BACKEND MESSAGE
    } finally {
      setSavingPayment(false);
    }
  };



  const isTxnRequired =
    emiPayment.payment_mode === "BANK" ||
    emiPayment.payment_mode === "ONLINE";

  const isEmiFormValid =
    Number(emiPayment.paid_amount) > 0 &&
    Boolean(emiPayment.payment_mode) &&
    Boolean(emiPayment.payment_receipt) &&
    (!isTxnRequired || Boolean(emiPayment.transaction_no));



  const allEmisPaid =
    emis.length > 0 && emis.every((emi) => emi.status === "PAID");

  const canAddPayment =
    Number(data?.pending_amount) > 0 &&
    emis.length > 0 &&
    allEmisPaid;


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


  // console.log(data, "data")
  return (
    <div className="p-6 space-y-6 text-black">
      {/* HEADER */}
      <div>
        <Link href="/properties" className="text-sm text-blue-600">
          ← Back to Properties
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Property Details
        </h1>
      </div>

      {/* ================= PROPERTY INFO ================= */}
      <Section title="Property Information">
        <Grid>
          <Info label="Title" value={data.property?.title} />
          <Info label="Category" value={data.property?.category} />
          {/* <Info label="Status" value={data.property?.status} /> */}
          {/* <Info label="Transaction Type" value={data.property?.transaction_type} /> */}
          <Info
            label="Date"
            value={new Date(data?.sale_date).toLocaleDateString("en-IN")}
          />
        </Grid>
      </Section>

      <Section title="Plot & Area Details">
        <Grid>
          <Info label="Plot Number" value={data.plot_number} />
          <Info label="Khata Number" value={data.khata_number} />
          <Info label="Area (Dismil)" value={data.area_dismil} />
          <Info
            label="Per Dismil Amount"
            value={`₹${Number(data.per_dismil_amount).toLocaleString("en-IN")}`}
          />
        </Grid>
      </Section>

      {data.property?.seller && (
        <Section title="Vendor (Seller) Details">
          <Grid>
            <Info label="Name" value={data.property.seller.name} />
            <Info label="Phone" value={data.property.seller.phone} />
            <Info label="Email" value={data.property.seller.email} />
            <Info label="Address" value={data.property.seller.address} />
            <Info label="PAN No" value={data.property.seller.pan_number} />
            <Info label="Aadhaar No" value={data.property.seller.aadhar_number} />
          </Grid>
        </Section>
      )}

      {data.buyer && (
        <Section title="Buyer Details">
          <Grid>
            <Info label="Name" value={data.buyer.name} />
            <Info label="Phone" value={data.buyer.phone} />
            <Info label="Email" value={data.buyer.email} />
            {/* <Info label="Buyer ID" value={data.buyer.id} /> */}
          </Grid>
        </Section>
      )}


      {/* ================= DEAL SUMMARY ================= */}
      <Section title="Deal Summary">
        <Grid>
          <Info label="Invoice No" value={data.invoice_no} />
          <Info label="Sale Date" value={data.sale_date} />
          <Info label="Sale Rate / Decmil" value={`₹${data.sale_rate}`} />
          {/* <Info label="Total Sale Amount" value={`₹${data.total_sale_amount}`} /> */}
          {/* <Info label="Received Amount" value={`₹${data.received_amount}`} /> */}
          {/* <Info label="Pending Amount" value={`₹${data.pending_amount}`} /> */}
        </Grid>
      </Section>



      {/* ================= TRANSACTIONS ================= */}
      {dealData?.transactions?.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Transactions</h3>

          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <SummaryCard
              label="Total Sale Amount"
              value={data.total_sale_amount}
              color="blue"
            />
            <SummaryCard
              label="Received Amount"
              value={data.received_amount}
              color="green"
            />
            <SummaryCard
              label="Pending Amount"
              value={data.pending_amount}
              color="red"
            />
          </div>

          {canAddPayment && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => {
                  setPaymentData({
                    amount: Number(data.pending_amount),
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
            </div>
          )}


          {/* TABLE */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
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
                {dealData.transactions.map((tx: any) => (
                  <tr
                    key={tx.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* DATE */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(tx.payment_date).toLocaleDateString("en-IN")}
                    </td>

                    {/* MODE */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
                        {tx.payment_mode}
                      </span>
                    </td>

                    {/* TRANSACTION NO */}
                    <td className="px-4 py-3 text-gray-600">
                      {tx.transaction_no || "—"}
                    </td>

                    {/* REFERENCE */}
                    <td className="px-4 py-3 text-gray-600">
                      {tx.reference_no || "—"}
                    </td>

                    {/* RECEIPT */}
                    <td className="px-4 py-3">
                      {tx.payment_receipt ? (
                        <a
                          href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${tx.payment_receipt}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    {/* REMARKS */}
                    <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                      {tx.remarks || "—"}
                    </td>

                    {/* AMOUNT */}
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      ₹{Number(tx.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}






      {/* ================= EMIS ================= */}


      {emis.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div
            className="flex items-center justify-between cursor-pointer select-none"
            onClick={() => setEmiOpen((prev) => !prev)}
          >
            <h2 className="text-lg font-semibold">
              EMI Schedule
            </h2>

            <span className="text-sm text-blue-600">
              {emiOpen ? "Hide ▲" : "Show ▼"}
            </span>
          </div>
          {emiOpen && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3 text-left">EMI No</th>
                    <th className="p-3 text-left">Due Date</th>
                    <th className="p-3 text-left">Amount</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Document</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {emis.map((emi) => (
                    <tr key={emi.id} className="border-b border-gray-200 hover:bg-gray-50">
                      {/* EMI NO */}
                      <td className="p-3">#{emi.emi_number}</td>

                      {/* DUE DATE */}
                      <td className="p-3">
                        {new Date(emi.due_date).toLocaleDateString("en-IN")}
                      </td>

                      {/* EMI AMOUNT */}
                      <td className="p-3 font-semibold">
                        ₹{Number(emi.emi_amount).toLocaleString("en-IN")}
                      </td>

                      {/* STATUS */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${emi.status === "PAID"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                            }`}
                        >
                          {emi.status}
                        </span>
                      </td>

                      {/* DOCUMENT COLUMN */}
                      <td className="p-3">
                        {emi.payment_receipt ? (
                          <a
                            href={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${emi.payment_receipt}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Receipt
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="p-3 text-sm">
                        {emi.status === "PENDING" ? (
                          <button
                            onClick={() => {
                              setSelectedEmi(emi);
                              setEmiPayment({
                                paid_amount: emi.emi_amount,
                                payment_mode: "CASH",
                                transaction_no: "",
                                payment_receipt: null,
                              });
                              setOpenEmiPay(true);
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Pay EMI
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEmiToUnpay(emi);
                              setOpenUnpayModal(true);
                            }}
                            className="
    px-4 py-1.5
    text-xs font-medium
    rounded-md
    bg-red-600 text-white
    hover:bg-red-700
    transition
  "
                          >
                            Unpay
                          </button>


                        )}
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>)}
        </div>
      )}





      {/* ================= DOCUMENTS ================= */}
      {/* {data.documents && (
        <Section title="Documents">
          <div className="space-y-6">

            <div>
              <h3 className="font-medium mb-2">Purchase / Inventory Documents</h3>

              {data.documents.filter((d: any) => !d.sell_property_id).length === 0 ? (
                <p className="text-sm text-gray-500">No purchase documents</p>
              ) : (
                <DocList
                  docs={data.documents.filter((d: any) => !d.sell_property_id)}
                />
              )}
            </div>

            <div>
              <h3 className="font-medium mb-2">Sale Documents</h3>

              {data.documents.filter((d: any) => d.sell_property_id).length === 0 ? (
                <p className="text-sm text-gray-500">No sale documents</p>
              ) : (
                <DocList
                  docs={data.documents.filter((d: any) => d.sell_property_id)}
                />
              )}
            </div>

          </div>
        </Section>
      )} */}



      {/* ================= ADD PAYMENT MODAL ================= */}
      {openPayment && (
        <Modal title="Add Payment" onClose={() => setOpenPayment(false)}>
          <input
            type="number"
            max={Number(data.pending_amount)}
            value={paymentData.amount}
            onChange={(e) => {
              let value = Number(e.target.value);
              if (value > Number(data.pending_amount)) {
                value = Number(data.pending_amount);
              }

              setPaymentData({
                ...paymentData,
                amount: value,
              });
            }}
            disabled
            className={inputClass}
          />


          <select
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                payment_mode: e.target.value,
              })
            }
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="ONLINE">Online</option>
          </select>

          <input
            placeholder="Reference No"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                reference_no: e.target.value,
              })
            }
          />

          <input
            type="date"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                payment_date: e.target.value,
              })
            }
          />

          <textarea
            rows={3}
            placeholder="Remarks"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({
                ...paymentData,
                remarks: e.target.value,
              })
            }
          />

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setOpenPayment(false)}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>
            <button
              onClick={submitPayment}
              disabled={savingPayment}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {savingPayment ? "Saving..." : "Save Payment"}
            </button>
          </div>
        </Modal>
      )}

      {openEmiPay && selectedEmi && (
        <Modal title={`Pay EMI #${selectedEmi.emi_number}`} onClose={() => setOpenEmiPay(false)}>
          <input
            type="number"
            className={inputClass}
            value={emiPayment.paid_amount}
            onChange={(e) =>
              setEmiPayment({ ...emiPayment, paid_amount: e.target.value })
            }
            readOnly
          />

          <select
            className={inputClass}
            onChange={(e) =>
              setEmiPayment({ ...emiPayment, payment_mode: e.target.value })
            }
          >
            <option value="CASH">Cash</option>
            <option value="BANK">Bank</option>
            <option value="ONLINE">Online</option>
          </select>

          {(emiPayment.payment_mode === "BANK" ||
            emiPayment.payment_mode === "ONLINE") && (
              <input
                type="text"
                placeholder="Transaction No *"
                className={inputClass}
                value={emiPayment.transaction_no}
                onChange={(e) =>
                  setEmiPayment({
                    ...emiPayment,
                    transaction_no: e.target.value,
                  })
                }
              />
            )}



          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-700">
              Payment Receipt <span className="text-red-500">*</span>
            </label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
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

            <p className="text-xs text-gray-500">
              Accepted formats: JPG, PNG, PDF · Max size 5MB
            </p>

            {emiPayment.payment_receipt && (
              <p className="text-xs text-green-600">
                Selected file: {emiPayment.payment_receipt.name}
              </p>
            )}
            {!emiPayment.payment_receipt && (
              <p className="text-xs text-red-500">
                Payment receipt is required
              </p>
            )}

          </div>


          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setOpenEmiPay(false)}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>

            <button
              onClick={payEmi}
              disabled={savingEmi || !isEmiFormValid}
              className={`px-4 py-2 rounded text-white ${savingEmi || !isEmiFormValid
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
                }`}
            >
              {savingEmi ? "Paying..." : "Confirm Payment"}
            </button>

          </div>
        </Modal>
      )}

      {openUnpayModal && emiToUnpay && (
        <Modal
          title="Confirm Unpay EMI"
          onClose={() => {
            setOpenUnpayModal(false);
            setEmiToUnpay(null);
          }}
        >
          <p className="text-sm text-gray-600">
            You are about to <span className="font-semibold text-red-600">unpay</span>{" "}
            <strong>EMI #{emiToUnpay.emi_number}</strong> of amount{" "}
            <strong>
              ₹{Number(emiToUnpay.emi_amount).toLocaleString("en-IN")}
            </strong>.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs text-yellow-700">
            ⚠️ This action will:
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Mark EMI as unpaid</li>
              <li>Remove receipt & transaction number</li>
              <li>Update received & pending amounts</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => {
                setOpenUnpayModal(false);
                setEmiToUnpay(null);
              }}
              className="px-4 py-2 bg-gray-200 rounded-md"
            >
              Cancel
            </button>

            <button
              onClick={confirmUnpayEmi}
              disabled={savingEmi}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {savingEmi ? "Processing..." : "Yes, Unpay EMI"}
            </button>
          </div>
        </Modal>
      )}


    </div>
  );
}

/* ================= REUSABLE UI ================= */

const inputClass =
  "w-full px-3 py-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500";

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </div>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {children}
  </div>
);

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
  const map: any = {
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-700",
  };

  return (
    <div className={`p-4 rounded-lg ${map[color]}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-bold">
        ₹{Number(value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      {children}
    </div>
  </div>
);


const DocList = ({ docs }: { docs: any[] }) => (
  <div className="border rounded-lg divide-y overflow-hidden">
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
