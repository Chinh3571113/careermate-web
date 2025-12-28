"use client";

import { Search, Filter, Download, FileText, Calendar, MapPin, Clock, CheckCircle, XCircle, Eye, RefreshCw, AlertCircle, MoreHorizontal, ChevronDown, Briefcase } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getJobApplications, getRecruiterApplications, getRecruiterApplicationsFiltered, approveJobApplication, rejectJobApplication, setReviewingJobApplication, JobApplication, updateJobApplicationStatus, extendJobOffer, getRecruiterJobPostings, RecruiterJobPosting } from "@/lib/recruiter-api";
import { createEmploymentVerification } from "@/lib/employment-api";
import { getRecruiterActions, sortStatuses } from "@/lib/status-utils";
import { JobApplicationStatus } from "@/types/status";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function ApplicationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [jobPostings, setJobPostings] = useState<RecruiterJobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get query params for search and job filter
  const searchParam = searchParams.get('search');
  const jobIdParam = searchParams.get('jobId');
  const jobPostingIdParam = searchParams.get('jobPostingId');
  
  const [searchQuery, setSearchQuery] = useState(searchParam || "");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedJobId, setSelectedJobId] = useState<string>(jobIdParam || "all");
  // Get jobPostingId from URL params if provided, otherwise fetch all
  const [jobPostingId, setJobPostingId] = useState<number | null>(
    jobPostingIdParam ? parseInt(jobPostingIdParam) : null
  );

  // Dialog states
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isReviewingDialogOpen, setIsReviewingDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isBanDialogOpen, setIsBanDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isExtendOfferDialogOpen, setIsExtendOfferDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Simplified status filters - only commonly used ones
  const availableStatuses: Array<JobApplicationStatus | 'ALL'> = [
    'ALL',
    'SUBMITTED',
    'REVIEWING',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'APPROVED',
    'OFFER_EXTENDED',
    'REJECTED',
  ];

  // Compact status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'SUBMITTED': { label: 'Submitted', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'REVIEWING': { label: 'Reviewing', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      'INTERVIEW_SCHEDULED': { label: 'Interview', className: 'bg-purple-100 text-purple-800 border-purple-200' },
      'INTERVIEWED': { label: 'Interviewed', className: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'APPROVED': { label: 'Approved', className: 'bg-green-100 text-green-800 border-green-200' },
      'OFFER_EXTENDED': { label: 'Offer Sent', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'ACCEPTED': { label: 'Accepted', className: 'bg-teal-100 text-teal-800 border-teal-200' },
      'WORKING': { label: 'Working', className: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      'REJECTED': { label: 'Rejected', className: 'bg-red-100 text-red-800 border-red-200' },
      'TERMINATED': { label: 'Terminated', className: 'bg-gray-100 text-gray-800 border-gray-200' },
      'NO_RESPONSE': { label: 'No Reply', className: 'bg-slate-100 text-slate-600 border-slate-200' },
      'WITHDRAWN': { label: 'Withdrawn', className: 'bg-orange-100 text-orange-800 border-orange-200' },
      'BANNED': { label: 'Banned', className: 'bg-red-200 text-red-900 border-red-300' },
    };
    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 border-gray-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  // Handle recruiter actions
  const handleRecruiterAction = async (action: string, applicationId: number) => {
    console.log(`Recruiter Action: ${action}, Application ID: ${applicationId}`);
    const application = applications.find(app => app.id === applicationId);

    try {
      switch (action) {
        case 'review':
          setSelectedApplication(application || null);
          setIsReviewingDialogOpen(true);
          break;

        case 'schedule_interview':
          // Navigate to interview scheduling page or open modal
          router.push(`/recruiter/interviews/schedule?applicationId=${applicationId}`);
          break;

        case 'approve':
          setSelectedApplication(application || null);
          setIsApproveDialogOpen(true);
          break;

        case 'reject':
          setSelectedApplication(application || null);
          setIsRejectDialogOpen(true);
          break;

        case 'ban':
          if (confirm('Are you sure you want to ban this candidate? This will prevent them from applying to future positions.')) {
            setSelectedApplication(application || null);
            setIsBanDialogOpen(true);
          }
          break;

        case 'view_interview':
          router.push('/recruiter/interviews');
          break;

        case 'reschedule':
          router.push(`/recruiter/interviews/schedule?applicationId=${applicationId}&action=reschedule`);
          break;

        case 'cancel_interview':
          if (confirm('Are you sure you want to cancel this interview?')) {
            toast.error('Cancel interview API not yet implemented');
          }
          break;

        case 'start_employment':
          // For APPROVED/ACCEPTED status - transition to WORKING and create employment record
          // Note: In v3.1, recruiters should use extend_offer instead for APPROVED candidates
          if (confirm('Are you sure you want to start this employee? This will mark them as currently working and begin employment tracking.')) {
            try {
              // First create employment verification record
              await createEmploymentVerification(applicationId, {
                startDate: new Date().toISOString().split('T')[0],
                position: application?.jobTitle || 'Employee',
              });
              // Then update status to WORKING
              await updateJobApplicationStatus(applicationId, 'WORKING');
              toast.success('Employment started successfully! Status updated to WORKING.');
              await fetchApplications();
            } catch (error: any) {
              console.error('Failed to start employment:', error);
              // If employment creation fails, still try to update status
              try {
                await updateJobApplicationStatus(applicationId, 'WORKING');
                toast.success('Status updated to WORKING (employment record may need manual creation).');
                await fetchApplications();
              } catch (statusError: any) {
                toast.error(statusError.message || 'Failed to start employment');
              }
            }
          }
          break;

        case 'extend_offer':
          // v3.1: Recruiter extends job offer to candidate (APPROVED → OFFER_EXTENDED)
          setSelectedApplication(application || null);
          setIsExtendOfferDialogOpen(true);
          break;

        case 'terminate':
          router.push('/recruiter/employments');
          break;

        case 'view_employment':
          router.push('/recruiter/employments');
          break;

        case 'unban':
          if (confirm('Are you sure you want to unban this candidate?')) {
            // Update status from BANNED to previous status or REJECTED
            await updateJobApplicationStatus(applicationId, 'REJECTED');
            toast.success('Candidate unbanned');
            await fetchApplications();
          }
          break;

        case 'edit_ban':
          setSelectedApplication(application || null);
          setIsBanDialogOpen(true);
          break;

        default:
          toast.error('Unknown action');
      }
    } catch (error: any) {
      console.error('Recruiter action failed:', error);
      toast.error(error.response?.data?.message || 'Action failed. Please try again.');
    }
  };

  // Fetch job postings for the dropdown
  const fetchJobPostings = async () => {
    try {
      const response = await getRecruiterJobPostings({ page: 0, size: 100 });
      if (response.code === 0 || response.code === 200) {
        setJobPostings(response.result.content || []);
      }
    } catch (error: any) {
      console.error("Error fetching job postings:", error);
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setIsLoading(true);

      let response;
      const effectiveJobId = selectedJobId !== 'all' ? parseInt(selectedJobId) : jobPostingId;
      
      if (effectiveJobId) {
        // Fetch applications for specific job posting
        response = await getJobApplications(effectiveJobId);
      } else {
        // Fetch all applications for this recruiter
        response = await getRecruiterApplications();
      }

      if (response.code === 200 && response.result) {
        // Sort by createAt descending (newest first) for better demo
        const sortedApplications = [...response.result].sort((a, b) => {
          const dateA = new Date(a.createAt).getTime();
          const dateB = new Date(b.createAt).getTime();
          return dateB - dateA; // Descending order (newest first)
        });
        setApplications(sortedApplications);
        setFilteredApplications(sortedApplications);
      } else if (response.code === 0 && response.result) {
        // Legacy response format - also sort by newest first
        const sortedApplications = [...response.result].sort((a, b) => {
          const dateA = new Date(a.createAt).getTime();
          const dateB = new Date(b.createAt).getTime();
          return dateB - dateA;
        });
        setApplications(sortedApplications);
        setFilteredApplications(sortedApplications);
      } else {
        toast.error(response.message || "Failed to fetch applications");
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast.error(error.message || "Failed to fetch applications");
      setApplications([]);
      setFilteredApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobPostings();
    fetchApplications();
  }, [jobPostingId, selectedJobId]);

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app =>
        app.fullName.toLowerCase().includes(query) ||
        app.phoneNumber.includes(searchQuery) ||
        app.jobTitle.toLowerCase().includes(query) ||
        app.preferredWorkLocation.toLowerCase().includes(query)
      );
    }

    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    setFilteredApplications(filtered);
  }, [searchQuery, selectedStatus, applications]);

  // Handle viewApplicationId from dashboard - open detail modal for specific application
  useEffect(() => {
    const viewApplicationId = sessionStorage.getItem('viewApplicationId');
    if (viewApplicationId && applications.length > 0) {
      try {
        const applicationId = parseInt(viewApplicationId, 10);
        const applicationToView = applications.find(app => app.id === applicationId);
        
        if (applicationToView) {
          console.log('👁️ Opening application for viewing:', applicationToView);
          setSelectedApplication(applicationToView);
          setIsDetailDialogOpen(true);
          
          // Clear sessionStorage after loading
          sessionStorage.removeItem('viewApplicationId');
        } else {
          console.warn('Application not found with ID:', applicationId);
          sessionStorage.removeItem('viewApplicationId');
        }
      } catch (error) {
        console.error('Error loading application for viewing:', error);
        sessionStorage.removeItem('viewApplicationId');
      }
    }
  }, [applications]); // Depend on applications array to wait until data is loaded

  // Approve
  const handleApprove = async () => {
    if (!selectedApplication) return;
    try {
      setActionLoading(true);
      await approveJobApplication(selectedApplication.id);
      toast.success("Application approved successfully!");
      setIsApproveDialogOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve application");
    } finally {
      setActionLoading(false);
    }
  };

  // Reject
  const handleReject = async () => {
    if (!selectedApplication) return;
    try {
      setActionLoading(true);
      await rejectJobApplication(selectedApplication.id, rejectReason);
      toast.success("Application rejected successfully!");
      setIsRejectDialogOpen(false);
      setRejectReason("");
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject application");
    } finally {
      setActionLoading(false);
    }
  };

  // Set Reviewing
  const handleSetReviewing = async () => {
    if (!selectedApplication) return;
    try {
      setActionLoading(true);
      await setReviewingJobApplication(selectedApplication.id);
      toast.success("Application set to reviewing successfully!");
      setIsReviewingDialogOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.message || "Failed to set application to reviewing");
    } finally {
      setActionLoading(false);
    }
  };

  // Badge - removed, now using StatusBadgeFull component

  const getStatusCount = (status: string) => {
    if (status === "ALL") return applications.length;
    return applications.filter(app => app.status === status).length;
  };

  return (
    <>
      <header className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Applications</h1>
            <p className="text-sm text-gray-500 mt-1">Manage candidate applications for your job postings</p>
          </div>
          <Button
            onClick={fetchApplications}
            disabled={isLoading}
            className="bg-sky-600 hover:bg-sky-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Search and Job Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, job title, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
          </div>
          
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger className="w-full sm:w-[260px] bg-white border-gray-200">
              <Briefcase className="h-4 w-4 mr-2 text-gray-400" />
              <SelectValue placeholder="All Job Postings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Job Postings</SelectItem>
              {jobPostings.map((job) => (
                <SelectItem key={job.id} value={job.id.toString()}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {/* Status Tabs - Pill style */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        {availableStatuses.map(status => {
          const count = getStatusCount(status);
          const isActive = selectedStatus === status;
          return (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${isActive
                ? "bg-sky-600 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {status === "ALL" ? "All" : status === "INTERVIEW_SCHEDULED" ? "Interview" : status === "OFFER_EXTENDED" ? "Offer Sent" : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ')}
              <span className={`ml-1.5 text-xs ${isActive ? "opacity-80" : "text-gray-500"}`}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="border-b p-4">
          <h3 className="text-sm font-medium text-sky-900">
            Total Applications: {filteredApplications.length}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="h-8 w-8 text-sky-600 animate-spin mb-4" />
            <p className="text-sm text-slate-600">Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="mb-2 text-lg font-medium text-slate-900">No applications found</h3>
            <p className="text-sm text-slate-600">
              {searchQuery || selectedStatus !== "ALL"
                ? "Try adjusting your filters"
                : "Applications will appear here when candidates apply to your job postings."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Candidate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Job Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Applied Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApplications.map((application) => (
                  <tr key={application.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{application.fullName}</p>
                        <p className="text-sm text-gray-600">{application.phoneNumber}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-900">{application.jobTitle}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="h-3 w-3" />
                        {application.preferredWorkLocation}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-3 w-3" />
                        {new Date(application.createAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={application.status} />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2 w-[250px]">
                        {/* View Details Button - Fixed position */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsDetailDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 shrink-0"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {/* Primary Action Button - Fixed width */}
                        <div className="w-[130px] shrink-0">
                          {getRecruiterActions(application.status).length > 0 && (
                            <Button
                              variant={getRecruiterActions(application.status)[0].variant as any}
                              size="sm"
                              onClick={() => handleRecruiterAction(
                                getRecruiterActions(application.status)[0].action,
                                application.id
                              )}
                              className="h-8 text-xs w-full justify-center"
                            >
                              {(() => {
                                const label = getRecruiterActions(application.status)[0].label;
                                if (label === 'Terminate Employment') return 'Terminate';
                                if (label === 'Schedule Interview') return 'Schedule';
                                if (label === 'Start Employment') return 'Start';
                                if (label === 'Extend Offer') return 'Send Offer';
                                return label;
                              })()}
                            </Button>
                          )}
                        </div>

                        {/* More Actions Dropdown - Fixed position */}
                        <div className="w-8 shrink-0">
                          {getRecruiterActions(application.status).length > 1 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                {getRecruiterActions(application.status).slice(1).map((statusAction, index) => (
                                  <DropdownMenuItem
                                    key={statusAction.action}
                                    onClick={() => handleRecruiterAction(statusAction.action, application.id)}
                                    className={statusAction.variant === 'destructive' ? 'text-red-600 focus:text-red-600' : ''}
                                  >
                                    {statusAction.label}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>

                        {/* Note icon for cancelled interview - shows when there are notes */}
                        {application.hasCancelledInterview && application.cancelledInterviewNotes && (
                          <div className="shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              onClick={() => {
                                setSelectedApplication(application);
                                setIsDetailDialogOpen(true);
                              }}
                              title={application.cancelledInterviewNotes}
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail / Approve / Reject Dialogs */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>View complete application information</DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-sm text-gray-900">{selectedApplication.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone Number</p>
                  <p className="text-sm text-gray-900">{selectedApplication.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Job Title</p>
                  <p className="text-sm text-gray-900">{selectedApplication.jobTitle}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Preferred Location</p>
                  <p className="text-sm text-gray-900">{selectedApplication.preferredWorkLocation}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <StatusBadge status={selectedApplication.status} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Applied Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedApplication.createAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">CV File</p>
                  <a
                    href={selectedApplication.cvFilePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View CV
                  </a>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Job Description</p>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                  {selectedApplication.jobDescription}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Cover Letter</p>
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md max-h-32 overflow-y-auto">
                  {selectedApplication.coverLetter}
                </div>
              </div>

              {/* Cancelled Interview History */}
              {selectedApplication.hasCancelledInterview && (
                <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <p className="text-sm font-medium text-orange-800">Previous Interview Was Cancelled</p>
                  </div>
                  {selectedApplication.cancelledInterviewDate && (
                    <p className="text-sm text-orange-700 mb-1">
                      <span className="font-medium">Scheduled Date:</span>{' '}
                      {new Date(selectedApplication.cancelledInterviewDate).toLocaleString('vi-VN')}
                    </p>
                  )}
                  {selectedApplication.cancelledInterviewNotes && (
                    <p className="text-sm text-orange-700">
                      <span className="font-medium">Reason:</span>{' '}
                      {selectedApplication.cancelledInterviewNotes.replace('Cancelled: ', '')}
                    </p>
                  )}
                  {selectedApplication.totalInterviewRounds && selectedApplication.totalInterviewRounds > 0 && (
                    <p className="text-sm text-orange-600 mt-2">
                      Total interview rounds: {selectedApplication.totalInterviewRounds}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Application</DialogTitle>
            <DialogDescription>Are you sure you want to approve this application?</DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <p className="font-medium text-gray-900">{selectedApplication.fullName}</p>
              <p className="text-sm text-gray-600">{selectedApplication.jobTitle}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" /> Confirm Approve
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>Please provide a reason for rejecting this application</DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
              <p className="font-medium text-gray-900">{selectedApplication.fullName}</p>
              <p className="text-sm text-gray-600">{selectedApplication.jobTitle}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please explain why you are rejecting this application..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={actionLoading || !rejectReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" /> Confirm Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reviewing Dialog */}
      <Dialog open={isReviewingDialogOpen} onOpenChange={setIsReviewingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Application to Reviewing</DialogTitle>
            <DialogDescription>
              Mark this application as under review. You can approve or reject it later.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="font-medium text-gray-900">{selectedApplication.fullName}</p>
              <p className="text-sm text-gray-600">{selectedApplication.jobTitle}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsReviewingDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSetReviewing}
              disabled={actionLoading}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Setting...
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Set to Reviewing
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog open={isBanDialogOpen} onOpenChange={setIsBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Candidate</DialogTitle>
            <DialogDescription>
              This will prevent the candidate from applying to future positions. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="bg-red-50 p-4 rounded-md border border-red-200 mb-4">
              <p className="font-medium text-gray-900">{selectedApplication.fullName}</p>
              <p className="text-sm text-gray-600">{selectedApplication.jobTitle}</p>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ban Reason <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Explain why this candidate is being banned (e.g., policy violation, fraudulent information)..."
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsBanDialogOpen(false);
                setBanReason("");
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedApplication || !banReason.trim()) {
                  toast.error("Please provide a ban reason");
                  return;
                }
                try {
                  setActionLoading(true);
                  await updateJobApplicationStatus(selectedApplication.id, 'BANNED');
                  toast.success("Candidate banned successfully");
                  setIsBanDialogOpen(false);
                  setBanReason("");
                  await fetchApplications();
                } catch (error: any) {
                  console.error("Failed to ban candidate:", error);
                  toast.error(error.response?.data?.message || "Failed to ban candidate");
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading || !banReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Banning...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Confirm Ban
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Extend Offer Dialog */}
      <Dialog open={isExtendOfferDialogOpen} onOpenChange={setIsExtendOfferDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Extend Job Offer
            </DialogTitle>
            <DialogDescription>
              You are about to extend a job offer to this candidate. They will receive a notification and must confirm or decline before they can start working.
            </DialogDescription>
          </DialogHeader>
          {selectedApplication && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200 my-4">
              <p className="font-medium text-gray-900">{selectedApplication.fullName}</p>
              <p className="text-sm text-gray-600">{selectedApplication.jobTitle}</p>
              <p className="text-sm text-gray-500 mt-1">Current Status: {selectedApplication.status}</p>
            </div>
          )}
          <div className="bg-amber-50 p-3 rounded-md border border-amber-200 text-sm">
            <p className="font-medium text-amber-800">⚠️ Important:</p>
            <ul className="list-disc list-inside text-amber-700 mt-1 space-y-1">
              <li>The candidate will be notified immediately</li>
              <li>They must accept or decline the offer</li>
              <li>You cannot extend offers to candidates already employed elsewhere</li>
            </ul>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsExtendOfferDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedApplication) return;
                try {
                  setActionLoading(true);
                  await extendJobOffer(selectedApplication.id);
                  toast.success('🎉 Job offer extended! Waiting for candidate confirmation.');
                  setIsExtendOfferDialogOpen(false);
                  await fetchApplications();
                } catch (error: any) {
                  console.error("Failed to extend offer:", error);
                  toast.error(error.message || "Failed to extend job offer. The candidate may already be employed.");
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Extending Offer...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm & Extend Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
