"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import {
  getCandidateInvoiceHistory,
  formatDate,
  formatInvoicePrice,
  type InvoiceListItem,
} from "@/lib/invoice-api";
import { FiArrowLeft, FiFileText, FiPackage } from "react-icons/fi";
import toast from "react-hot-toast";

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const page = await getCandidateInvoiceHistory(0, 20);
        setInvoices(page.content || []);
        if (!page.content || page.content.length === 0) {
          setError(
            "No payment history found. You haven't purchased any package yet."
          );
        }
      } catch (error: any) {
        console.error("Failed to fetch invoice history:", error);
        setError("Failed to load payment history. Please try again later.");
        toast.error("Failed to load payment history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleBack = () => {
    router.push('/candidate/dashboard');
  };

  return (
    // Sử dụng bg-gray-50 cho nền tổng thể nhẹ nhàng
    <div className="bg-gray-50 min-h-screen font-sans text-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="dashboard" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300">
            {/* Header: Đơn giản hóa, dùng màu xám */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <button
                onClick={handleBack}
                className="flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors group"
              >
                <FiArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </button>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Icon background chuyển sang xám nhạt */}
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                    <FiFileText className="w-6 h-6 text-gray-700" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Payment History
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      View your invoices and open details
                    </p>
                  </div>
                </div>
                
                {/* Upgrade Package Button */}
                <button
                  onClick={() => router.push('/candidate/pricing')}
                  className="hidden sm:flex items-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
                >
                  <FiPackage className="w-4 h-4 mr-2" />
                  Upgrade Package
                </button>
              </div>
              
              {/* Mobile Upgrade Button */}
              <button
                onClick={() => router.push('/candidate/pricing')}
                className="sm:hidden w-full mt-4 flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-lg transition-all shadow-md"
              >
                <FiPackage className="w-4 h-4 mr-2" />
                Upgrade Package
              </button>
            </div>

            {/* Loading State: Màu spinner trung tính */}
            {isLoading && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mb-4"></div>
                  <p className="text-gray-500">Loading invoice data...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <FiFileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No Payment Found
                  </h3>
                  <p className="text-gray-500 mb-6 max-w-md mx-auto">
                    {error}
                  </p>
                  <button
                    onClick={() => router.push('/candidate/pricing')}
                    className="inline-flex items-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    View Available Packages
                  </button>
                </div>
              </div>
            )}

            {/* List Display */}
            {!isLoading && !error && invoices.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 md:p-8">
                  <div className="space-y-4">
                    {invoices.map((inv) => (
                      <button
                        key={inv.id}
                        onClick={() => router.push(`/candidate/transaction-history/${inv.id}`)}
                        className="w-full text-left rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-sm text-gray-500">Package</p>
                            <p className="text-base font-semibold text-gray-900 truncate">
                              {inv.packageName}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(inv.startDate)} → {formatDate(inv.endDate)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="text-lg font-bold text-gray-900">
                              {formatInvoicePrice(inv.amount)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{inv.status}</p>
                          </div>
                        </div>
                      </button>
                    ))}
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