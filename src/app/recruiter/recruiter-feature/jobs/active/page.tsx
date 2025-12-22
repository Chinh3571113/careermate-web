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
  UserCheck,
  Sparkles,
} from "lucide-react";
import {
  getRecruiterJobPostings,
  RecruiterJobPosting,
  pauseJobPosting,
  resumeJobPosting,
  closeJobPosting,
  updateJobPosting,
  CreateJobPostRequest,
  getRecommendedCandidates,
  CandidateRecommendation,
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [newExpirationDate, setNewExpirationDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [recommendations, setRecommendations] = useState<CandidateRecommendation[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

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

  const handleEditExpirationDate = async () => {
    if (!selectedJob) return;

    setIsProcessing(true);
    try {
      const updateData: CreateJobPostRequest = {
        title: selectedJob.title,
        description: selectedJob.description,
        address: selectedJob.address,
        expirationDate: newExpirationDate,
        jdSkills: selectedJob.skills?.map(s => ({ id: s.id, mustToHave: s.mustToHave })) || [],
        yearsOfExperience: selectedJob.yearsOfExperience,
        workModel: selectedJob.workModel,
        salaryRange: selectedJob.salaryRange,
        reason: selectedJob.reason || "",
        jobPackage: selectedJob.jobPackage,
      };

      const response = await updateJobPosting(selectedJob.id, updateData);

      if (response.code === 0 || response.code === 200) {
        toast.success("Expiration date updated successfully!");
        setShowEditDateModal(false);
        setSelectedJob(null);
        setNewExpirationDate("");
        await fetchJobs();
      } else {
        toast.error(response.message || "Failed to update expiration date");
      }
    } catch (error: any) {
      console.error("Error updating expiration date:", error);
      toast.error(error.message || "Failed to update expiration date");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleViewRecommendations = async (job: RecruiterJobPosting) => {
    setSelectedJob(job);
    setShowRecommendationsModal(true);
    setIsLoadingRecommendations(true);
    try {
      // Don't pass minMatchScore - let backend use default (0.0) to show all applicants
      const response = await getRecommendedCandidates(job.id, 20);
      if (response.code === 0 || response.code === 200) {
        setRecommendations(response.result.recommendations);
        if (response.result.recommendations.length === 0) {
          toast("No matching applicants found. AI recommendations are based on candidates who have already applied to this job.", {
            icon: "ℹ️",
            duration: 5000,
          });
        }
      } else {
        toast.error(response.message || "Failed to load recommendations");
      }
    } catch (error: any) {
      console.error("Error loading recommendations:", error);
      toast.error(error.message || "Failed to load recommended candidates");
    } finally {
      setIsLoadingRecommendations(false);
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
                      onClick={() => {
                        setSelectedJob(job);
                        setShowDetailModal(true);
                      }}
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
                    
                    {job.status === "ACTIVE" && (
                      <button
                        onClick={() => {
                          setSelectedJob(job);
                          setNewExpirationDate(job.expirationDate);
                          setShowEditDateModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-sky-600 hover:bg-white rounded-lg transition-colors"
                        title="Edit Expiration Date"
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
                    
                    {/* AI Recommendations Button - for ACTIVE jobs */}
                    {job.status === "ACTIVE" && (
                      <button
                        onClick={() => handleViewRecommendations(job)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View AI-Recommended Candidates"
                      >
                        <Sparkles className="h-4 w-4" />
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

      {/* Detail View Modal */}
      {showDetailModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedJob(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedJob.status)}`}>
                  {selectedJob.status}
                </span>
                <span className="text-sm text-gray-500">
                  ID: {selectedJob.id}
                </span>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <div className="text-gray-600 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {selectedJob.description}
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Location</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedJob.address}</span>
                </div>
              </div>

              {/* Skills */}
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.skills.map((skill, index) => (
                      <span 
                        key={index}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          skill.mustToHave 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {skill.name} {skill.mustToHave && '(Required)'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Job Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Work Model</h3>
                  <p className="text-gray-600">{selectedJob.workModel || 'N/A'}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Experience Required</h3>
                  <p className="text-gray-600">{selectedJob.yearsOfExperience} years</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Salary Range</h3>
                  <p className="text-gray-600">{selectedJob.salaryRange}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Job Package</h3>
                  <p className="text-gray-600">{selectedJob.jobPackage || 'N/A'}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Created Date</h3>
                  <p className="text-gray-600">{new Date(selectedJob.createdDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Expiration Date</h3>
                  <p className="text-gray-600">{new Date(selectedJob.expirationDate).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Rejection Reason (only for REJECTED status) */}
              {selectedJob.rejectionReason && selectedJob.status === 'REJECTED' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h3>
                  <p className="text-red-600">{selectedJob.rejectionReason}</p>
                </div>
              )}

              {/* Benefits & Additional Information */}
              {selectedJob.reason && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-700 mb-2">Benefits & Additional Information</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedJob.reason}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                {selectedJob.status === "ACTIVE" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleViewRecommendations(selectedJob);
                    }}
                    className="flex-1 min-w-[200px] px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    View AI Recommendations
                  </button>
                )}
                {canEdit(selectedJob.status) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      router.push(`/recruiter/recruiter-feature/jobs/edit/${selectedJob.id}`);
                    }}
                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Job
                  </button>
                )}
                {selectedJob.status === "ACTIVE" && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      setNewExpirationDate(selectedJob.expirationDate);
                      setShowEditDateModal(true);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Edit Expiration
                  </button>
                )}
                {canPause(selectedJob.status) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedJob, 'pause');
                    }}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Pause className="h-4 w-4" />
                    Pause
                  </button>
                )}
                {canResume(selectedJob.status) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedJob, 'resume');
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Resume
                  </button>
                )}
                {canClose(selectedJob.status) && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleAction(selectedJob, 'close');
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expiration Date Modal */}
      {showEditDateModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Expiration Date</h3>
              <button
                onClick={() => {
                  setShowEditDateModal(false);
                  setSelectedJob(null);
                  setNewExpirationDate("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                <strong>Job Title:</strong> {selectedJob.title}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Expiration Date
                  </label>
                  <input
                    type="date"
                    value={selectedJob.expirationDate}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Expiration Date *
                  </label>
                  <input
                    type="date"
                    value={newExpirationDate}
                    onChange={(e) => setNewExpirationDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> For jobs with applicants, you can only extend the date by up to 60 days 
                  or reduce it by up to 7 days from the current expiration date.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEditDateModal(false);
                  setSelectedJob(null);
                  setNewExpirationDate("");
                }}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditExpirationDate}
                disabled={isProcessing || !newExpirationDate || newExpirationDate === selectedJob.expirationDate}
                className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendations Modal */}
      {showRecommendationsModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  AI-Recommended Applicants
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  For: <span className="font-semibold">{selectedJob.title}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Showing applicants with SUBMITTED or REVIEWING status, ranked by AI match score
                </p>
              </div>
              <button
                onClick={() => {
                  setShowRecommendationsModal(false);
                  setSelectedJob(null);
                  setRecommendations([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingRecommendations ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600">Analyzing applicants with AI...</p>
                </div>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg font-medium">No matching applicants found</p>
                  <p className="text-gray-500 text-sm mt-2">
                    No applicants with SUBMITTED or REVIEWING status match this job's requirements yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Results Summary */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                    <p className="text-purple-900 font-semibold">
                      Found {recommendations.length} matching applicants
                    </p>
                    <p className="text-purple-700 text-sm mt-1">
                      Applicants are ranked by AI match score based on skills, experience, and qualifications
                    </p>
                  </div>

                  {/* Candidate Cards */}
                  {recommendations.map((candidate, index) => (
                    <div
                      key={candidate.candidateId}
                      className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            {candidate.avatarUrl ? (
                              <img
                                src={candidate.avatarUrl}
                                alt={candidate.candidateName}
                                className="h-16 w-16 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                                {candidate.candidateName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-0.5 border-2 border-purple-500">
                              <span className="text-xs font-bold text-purple-600">#{index + 1}</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{candidate.candidateName}</h3>
                            <p className="text-sm text-gray-600">{candidate.email}</p>
                            {candidate.phoneNumber && (
                              <p className="text-sm text-gray-600">{candidate.phoneNumber}</p>
                            )}
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className="text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                            <Sparkles className="h-4 w-4 text-white" />
                            <span className="text-white font-bold">{Math.round(candidate.matchScore * 100)}% Match</span>
                          </div>
                          {candidate.applicationStatus && (
                            <div className="mt-2">
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                Already Applied
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Candidate Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Experience</p>
                          <p className="text-sm font-semibold text-gray-900">{candidate.totalYearsExperience} years</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Education</p>
                          <p className="text-sm font-semibold text-gray-900">{candidate.educationLevel || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Certificates</p>
                          <p className="text-sm font-semibold text-gray-900">{candidate.certificatesCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Projects</p>
                          <p className="text-sm font-semibold text-gray-900">{candidate.projectsCount}</p>
                        </div>
                      </div>

                      {/* Profile Summary */}
                      {candidate.profileSummary && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-700 line-clamp-2">{candidate.profileSummary}</p>
                        </div>
                      )}

                      {/* Skills */}
                      <div className="space-y-3">
                        {candidate.matchedSkills && candidate.matchedSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-700 mb-2 uppercase">
                              ✓ Matched Skills ({candidate.matchedSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.matchedSkills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-orange-700 mb-2 uppercase">
                              ⚠ Missing Skills ({candidate.missingSkills.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {candidate.missingSkills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t border-gray-200 flex gap-3">
                        <button
                          onClick={() => {
                            setShowRecommendationsModal(false);
                            router.push(`/recruiter/recruiter-feature/candidates/profile/${candidate.candidateId}`);
                          }}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <UserCheck className="h-4 w-4" />
                          View Full Profile
                        </button>
                        {candidate.cvFilePath && (
                          <button
                            onClick={() => window.open(candidate.cvFilePath, '_blank')}
                            className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            View CV
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
