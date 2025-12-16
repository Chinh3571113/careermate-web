"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import {
  formatDate,
  formatInvoicePrice,
  getCandidateInvoiceById,
  type InvoiceListItem,
} from "@/lib/invoice-api";
import {
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiPackage,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function CandidateInvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { headerHeight } = useLayout();

  const [headerH, setHeaderH] = useState(headerHeight || 0);
  const [invoice, setInvoice] = useState<InvoiceListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idRaw = params?.id;
  const invoiceId = typeof idRaw === "string" ? Number(idRaw) : NaN;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHeight = localStorage.getItem("headerHeight");
      if (savedHeight && !headerHeight) {
        setHeaderH(parseInt(savedHeight));
      } else if (headerHeight) {
        setHeaderH(headerHeight);
      }
    }
  }, [headerHeight]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!Number.isFinite(invoiceId)) {
          setError("Invalid invoice id.");
          return;
        }

        setIsLoading(true);
        const data = await getCandidateInvoiceById(invoiceId);
        if (!data) {
          setError("Invoice not found.");
          return;
        }
        setInvoice(data);
      } catch (err: any) {
        console.error("Failed to fetch invoice detail:", err);
        setError("Failed to load invoice detail. Please try again later.");
        toast.error("Failed to load invoice detail");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="dashboard" />
          </aside>

          <section className="space-y-6 min-w-0 transition-all duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <button
                onClick={() => router.push("/candidate/transaction-history")}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
              >
                <FiArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Payment History
              </button>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                    <FiFileText className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Invoice Detail
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      Receipt for your package purchase
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/candidate/pricing")}
                  className="hidden sm:flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <FiPackage className="w-4 h-4 mr-2" />
                  Upgrade Package
                </button>
              </div>

              <button
                onClick={() => router.push("/candidate/pricing")}
                className="sm:hidden w-full mt-4 flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all shadow-md"
              >
                <FiPackage className="w-4 h-4 mr-2" />
                Upgrade Package
              </button>
            </div>

            {isLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mb-4"></div>
                  <p className="text-gray-500">Loading invoice detail...</p>
                </div>
              </div>
            )}

            {!isLoading && error && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <FiFileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Cannot Load Invoice
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
                  <button
                    onClick={() => router.push("/candidate/transaction-history")}
                    className="inline-flex items-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Back to History
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !error && invoice && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="bg-gray-900 p-8 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold mb-2 tracking-tight">
                        Invoice Receipt
                      </h2>
                      <p className="text-gray-400 text-sm">Thank you for your purchase</p>
                    </div>
                    <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <FiCheckCircle className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-8">
                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center border-b border-gray-100 pb-2">
                        <FiPackage className="w-4 h-4 mr-2" />
                        Package Details
                      </h3>

                      <div className="space-y-5">
                        <div className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3"></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Package Name</p>
                            <p className="text-lg font-semibold text-gray-900">
                              {invoice.packageName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3"></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Amount Paid</p>
                            <p className="text-2xl font-bold text-emerald-600">
                              {formatInvoicePrice(invoice.amount)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center border-b border-gray-100 pb-2">
                        <FiCalendar className="w-4 h-4 mr-2" />
                        Subscription Period
                      </h3>

                      <div className="space-y-5">
                        <div className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3"></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">Start Date</p>
                            <p className="text-base font-medium text-gray-800">
                              {formatDate(invoice.startDate)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-3"></div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 mb-1">End Date</p>
                            <p className="text-base font-medium text-gray-800">
                              {formatDate(invoice.endDate)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-gray-500 text-sm font-medium">Total Amount</span>
                      <span className="text-3xl font-bold text-gray-900 mt-1">
                        {formatInvoicePrice(invoice.amount)}
                      </span>
                    </div>

                    <div className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm">
                      <span className="text-gray-500 text-xs uppercase font-bold mr-3 tracking-wide">
                        Status
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <FiCheckCircle className="w-3.5 h-3.5 mr-1" />
                        {invoice.status || "Paid"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100">
                    <button
                      onClick={() => router.push("/candidate/transaction-history")}
                      className="flex-1 px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Back to History
                    </button>
                    <button
                      onClick={() => router.push("/candidate/pricing")}
                      className="flex-1 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors shadow-sm"
                    >
                      Upgrade Package
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
