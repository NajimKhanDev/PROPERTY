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

  const [emiPayment, setEmiPayment] = useState({
    paid_amount: "",
    payment_mode: "CASH",
    transaction_no: "",
    payment_receipt: null as File | null,
  });


  const [openPayment, setOpenPayment] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);

  const [paymentData, setPaymentData] = useState({
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

      // console.log(res.data,"----------->")
      const sale = res.data;
      // console.log(sale.transactions ,"sale.transactions ----------->")
      // const sale = res.data.data?.[0];

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



  /* ================= ADD PAYMENT ================= */
  const submitPayment = async () => {
    try {
      setSavingPayment(true);

      const res = await axiosInstance.post("/transactions", {
        property_id: propertyId,
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

      // fetchSellDeal(); // refresh list
    } catch (err: any) {
      const message =
        err?.response?.data?.message || "Failed to add payment";

      toast.error(message); // ✅ SHOW BACKEND MESSAGE
    } finally {
      setSavingPayment(false);
    }
  };



  const isEmiFormValid =
    Number(emiPayment.paid_amount) > 0 &&
    Boolean(emiPayment.payment_mode) &&
    Boolean(emiPayment.transaction_no) &&   // ✅ REQUIRED
    Boolean(emiPayment.payment_receipt);


  const allEmisPaid =
    emis.length > 0 && emis.every((emi) => emi.status === "PAID");



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


  console.log(dealData?.transactions, "dealData?.transactions")
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
          <Info label="Status" value={data.property?.status} />
          <Info label="Transaction Type" value={data.property?.transaction_type} />
          <Info
            label="Date"
            value={new Date(data.property?.date).toLocaleDateString("en-IN")}
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

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b  text-gray-500">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Mode</th>
                  <th className="text-left py-2">Transaction No</th>
                  <th className="text-left py-2">Reference</th>
                  <th className="text-left py-2">Receipt</th>
                  <th className="text-left py-2">Remarks</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>

              <tbody className="divide-y border-b border-gray-200">
                {dealData.transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition">
                    <td className="py-2">
                      {new Date(tx.payment_date).toLocaleDateString("en-IN")}
                    </td>

                    <td className="py-2">
                      <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">
                        {tx.payment_mode}
                      </span>
                    </td>

                    <td className="py-2">{tx.transaction_no || "—"}</td>
                    <td className="py-2">{tx.reference_no || "—"}</td>

                    <td className="py-2">
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

                    <td className="py-2">{tx.remarks || "—"}</td>

                    <td className="py-2 text-right font-medium text-green-600">
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
                            disabled
                            className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 cursor-not-allowed"
                          >
                            Paid
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
            placeholder="Amount"
            className={inputClass}
            onChange={(e) =>
              setPaymentData({ ...paymentData, amount: e.target.value })
            }
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
            <option value="BANK">Bank</option>
            <option value="ONLINE">Online</option>
            <option value="CASH">Cash</option>
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
          />

          <select
            className={inputClass}
            onChange={(e) =>
              setEmiPayment({ ...emiPayment, payment_mode: e.target.value })
            }
          >
            <option value="BANK">Bank</option>
            <option value="ONLINE">Online</option>
            <option value="CASH">Cash</option>
          </select>

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
