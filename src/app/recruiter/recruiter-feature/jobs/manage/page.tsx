"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  BarChart3,
  RefreshCw,
  Pencil,
  Pause,
  Play,
  XCircle,
  Search,
  Filter,
  Plus,
  Calendar,
  MapPin,
  Briefcase,
  X,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
} from "lucide-react";
import {
  getRecruiterJobPostings,
  RecruiterJobPosting,
  pauseJobPosting,
  resumeJobPosting,
  closeJobPosting,
} from "@/lib/recruiter-api";
import toast from "react-hot-toast";

type JobStatus = "ALL" | "PENDING" | "ACTIVE" | "REJECTED" | "PAUSED" | "EXPIRED" | "CLOSED" | "DELETED";

const STATUS_TABS: { key: JobStatus; label: string; icon: any; color: string }[] = [
  { key: "ALL", label: "All Jobs", icon: Briefcase, color: "text-gray-600" },
  { key: "PENDING", label: "Pending", icon: Clock, color: "text-yellow-600" },
  { key: "ACTIVE", label: "Active", icon: CheckCircle, color: "text-green-600" },
  { key: "REJECTED", label: "Rejected", icon: XCircle, color: "text-red-600" },
  { key: "PAUSED", label: "Paused", icon: Pause, color: "text-amber-600" },
  { key: "EXPIRED", label: "Expired", icon: AlertCircle, color: "text-orange-600" },
  { key: "CLOSED", label: "Closed", icon: CheckCircle, color: "text-blue-600" },
];

export default function ManageJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<RecruiterJobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<RecruiterJobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<JobStatus>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<RecruiterJobPosting | null>(null);
  const [confirmAction, setConfirmAction] = useState<'pause' | 'resume' | 'close' | 'delete' | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, activeTab, searchQuery]);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const response = await getRecruiterJobPostings({ page: 0, size: 100 });
      if (response.code === 0 || response.code === 200) {
        setJobs(response.result.content);
      }
    } catch (error: any) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by status tab
    if (activeTab !== "ALL") {
      filtered = filtered.filter((job) => job.status === activeTab);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(query) ||
          job.address.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      ACTIVE: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      PAUSED: "bg-amber-100 text-amber-800",
      EXPIRED: "bg-orange-100 text-orange-800",
      CLOSED: "bg-blue-100 text-blue-800",
      DELETED: "bg-gray-100 text-gray-800",
    };
    return styles[status] || "bg-gray-100 text-gray-800";
  };

  const getDaysUntilExpiry = (expirationDate: string): number => {
    const expiry = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleAction = (job: RecruiterJobPosting, action: 'pause' | 'resume' | 'close' | 'delete') => {
    setSelectedJob(job);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const executeAction = async () => {
    if (!selectedJob || !confirmAction) return;

    setIsProcessing(true);
    try {
      let response;
      let successMessage = "";

      switch (confirmAction) {
        case "pause":
          response = await pauseJobPosting(selectedJob.id);
          successMessage = "Job paused successfully";
          break;
        case "resume":
          response = await resumeJobPosting(selectedJob.id);
          successMessage = "Job resumed successfully";
          break;
        case "close":
          response = await closeJobPosting(selectedJob.id);
          successMessage = "Job closed successfully";
          break;
      }

      if (response && (response.code === 0 || response.code === 200)) {
        toast.success(successMessage);
        setShowConfirmModal(false);
        setConfirmAction(null);
        setSelectedJob(null);
        await fetchJobs();
      } else {
        toast.error(response?.message || "Action failed");
      }
    } catch (error: any) {
      console.error("Error executing action:", error);
      toast.error(error.message || "Failed to perform action");
    } finally {
      setIsProcessing(false);
    }
  };

  const canEdit = (status: string) => ["PENDING", "REJECTED"].includes(status);
  const canPause = (status: string) => status === "ACTIVE";
  const canResume = (status: string) => status === "PAUSED";
  const canClose = (status: string) => status === "ACTIVE";
  const canDelete = (status: string) => ["PENDING", "REJECTED", "EXPIRED"].includes(status);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Job Postings</h1>
            <p className="text-gray-600 mt-1">View and manage all your job postings in one place</p>
          </div>
          <button
            onClick={() => router.push("/recruiter/recruiter-feature/jobs/create")}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create New Job
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, location, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-x-auto">
        <div className="flex">
          {STATUS_TABS.map((tab) => {
            const Icon = tab.icon;
            const count = tab.key === "ALL" ? jobs.length : jobs.filter(j => j.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-[120px] flex flex-col items-center gap-2 px-4 py-4 transition-colors ${
                  activeTab === tab.key
                    ? "bg-sky-50 border-b-2 border-sky-600"
                    : "hover:bg-gray-50"
                }`}
              >
                <Icon className={`h-5 w-5 ${activeTab === tab.key ? "text-sky-600" : tab.color}`} />
                <div className="text-center">
                  <div className={`text-sm font-medium ${activeTab === tab.key ? "text-sky-600" : "text-gray-700"}`}>
                    {tab.label}
                  </div>
                  <div className="text-xs text-gray-500">{count}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-sky-600 animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No jobs found</p>
          <p className="text-gray-500 text-sm mt-1">
            {searchQuery ? "Try adjusting your search" : "Create your first job posting to get started"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const daysLeft = getDaysUntilExpiry(job.expirationDate);
            return (
              <div
                key={job.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                      {job.title}
                    </h3>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                      {job.status}
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="line-clamp-1">{job.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>Expires in {daysLeft} days</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-400" />
                      <span>{job.workModel}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-4 bg-gray-50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/recruiter/recruiter-feature/jobs/${job.id}`)}
                      className="p-2 text-gray-600 hover:text-sky-600 hover:bg-white rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {canEdit(job.status) && (
                      <button
                        onClick={() => router.push(`/recruiter/recruiter-feature/jobs/edit/${job.id}`)}
                        className="p-2 text-gray-600 hover:text-sky-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit Job"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    
                    {(job.status === "ACTIVE" || job.status === "EXPIRED") && (
                      <button
                        onClick={() => router.push(`/recruiter/recruiter-feature/jobs/edit/${job.id}`)}
                        className="p-2 text-gray-600 hover:text-sky-600 hover:bg-white rounded-lg transition-colors"
                        title={job.status === "EXPIRED" ? "Extend Expiration Date" : "Edit Expiration Date"}
                      >
                        <Calendar className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {canPause(job.status) && (
                      <button
                        onClick={() => handleAction(job, 'pause')}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Pause Job"
                      >
                        <Pause className="h-4 w-4" />
                      </button>
                    )}
                    
                    {canResume(job.status) && (
                      <button
                        onClick={() => handleAction(job, 'resume')}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Resume Job"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    )}
                    
                    {canClose(job.status) && (
                      <button
                        onClick={() => handleAction(job, 'close')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Close Job"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    
                    {canDelete(job.status) && (
                      <button
                        onClick={() => handleAction(job, 'delete')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Job"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && selectedJob && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmAction === 'pause' && <Pause className="h-6 w-6 text-amber-600" />}
              {confirmAction === 'resume' && <Play className="h-6 w-6 text-green-600" />}
              {confirmAction === 'close' && <XCircle className="h-6 w-6 text-blue-600" />}
              {confirmAction === 'delete' && <Trash2 className="h-6 w-6 text-red-600" />}
              <h3 className="text-lg font-semibold text-gray-900">
                {confirmAction === 'pause' && 'Pause Job Posting'}
                {confirmAction === 'resume' && 'Resume Job Posting'}
                {confirmAction === 'close' && 'Close Job Posting'}
                {confirmAction === 'delete' && 'Delete Job Posting'}
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Job Title:</strong> {selectedJob.title}
              </p>
              <p className="text-sm text-gray-600">
                {confirmAction === 'pause' && 'Temporarily stop receiving applications. You can resume later.'}
                {confirmAction === 'resume' && 'Make the job active again and accept applications.'}
                {confirmAction === 'close' && 'Mark as closed (position filled). Cannot be reopened.'}
                {confirmAction === 'delete' && 'Permanently delete this job posting.'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                  setSelectedJob(null);
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeAction}
                disabled={isProcessing}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                  confirmAction === 'pause' ? 'bg-amber-600 hover:bg-amber-700' :
                  confirmAction === 'resume' ? 'bg-green-600 hover:bg-green-700' :
                  confirmAction === 'close' ? 'bg-blue-600 hover:bg-blue-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Confirm</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
