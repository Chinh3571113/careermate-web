"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  formatDate,
  formatInvoicePrice,
  getRecruiterInvoiceHistory,
  type InvoiceListItem,
} from "@/lib/invoice-api";
import {
  FiArrowLeft,
  FiCalendar,
  FiFileText,
  FiPackage,
} from "react-icons/fi";

export default function RecruiterTransactionHistoryPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        const page = await getRecruiterInvoiceHistory(0, 20);
        setInvoices(page.content || []);

        if (!page.content || page.content.length === 0) {
          setError("No payment history found. You haven't purchased any package yet.");
        }
      } catch (err: any) {
        console.error("Failed to fetch recruiter invoice history:", err);
        setError("Failed to load payment history. Please try again later.");
        toast.error("Failed to load payment history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleBack = () => {
    router.push("/recruiter/recruiter-feature/dashboard");
  };

  return (
    <div className="space-y-6 min-w-0">
      {/* Header */}
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
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
              <FiFileText className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Payment History
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View and open your invoice receipts
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push("/recruiter/recruiter-feature/profile/billing")}
            className="hidden sm:flex items-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg"
          >
            <FiPackage className="w-4 h-4 mr-2" />
            Manage Plans
          </button>
        </div>

        <button
          onClick={() => router.push("/recruiter/recruiter-feature/profile/billing")}
          className="sm:hidden w-full mt-4 flex items-center justify-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all shadow-md"
        >
          <FiPackage className="w-4 h-4 mr-2" />
          Manage Plans
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mb-4"></div>
            <p className="text-gray-500">Loading invoice history...</p>
          </div>
        </div>
      )}

      {/* Error / Empty */}
      {!isLoading && error && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
              <FiFileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Payment Found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => router.push("/recruiter/recruiter-feature/profile/billing")}
              className="inline-flex items-center px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              View Plans
            </button>
          </div>
        </div>
      )}

      {/* History List */}
      {!isLoading && !error && invoices.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="space-y-4">
              {invoices.map((inv) => (
                <button
                  key={inv.id}
                  type="button"
                  onClick={() => router.push(`/recruiter/transaction-history/${inv.id}`)}
                  className="w-full text-left p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <FiPackage className="w-4 h-4 text-gray-500" />
                        <p className="text-base font-semibold text-gray-900">
                          {inv.packageName}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <FiCalendar className="w-4 h-4" />
                        <span>
                          {formatDate(inv.startDate)} - {formatDate(inv.endDate)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <p className="text-base font-bold text-gray-900">
                        {formatInvoicePrice(inv.amount)}
                      </p>
                      <span className="text-sm text-gray-500">View</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
