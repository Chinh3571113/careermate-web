"use client";

import { Search, Filter, Download, FileText, Calendar, MapPin, Clock, CheckCircle, XCircle, Eye, RefreshCw, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getJobApplications, getRecruiterApplications, getRecruiterApplicationsFiltered, approveJobApplication, rejectJobApplication, setReviewingJobApplication, JobApplication, updateJobApplicationStatus, extendJobOffer } from "@/lib/recruiter-api";
import { StatusBadgeFull } from "@/components/shared/StatusBadge";
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

export default function ApplicationsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  // Get jobPostingId from URL params if provided, otherwise fetch all
  const jobPostingIdParam = searchParams.get('jobPostingId');
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
  const [rejectReason, setRejectReason] = useState("");
  const [banReason, setBanReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Available statuses for filtering (13 statuses)
  const availableStatuses: Array<JobApplicationStatus | 'ALL'> = [
    'ALL',
    'SUBMITTED',
    'REVIEWING',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'APPROVED',
    'OFFER_EXTENDED',
    'WORKING',
    'REJECTED',
    'TERMINATED',
    'NO_RESPONSE',
    'WITHDRAWN',
    'BANNED'
  ];

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
          
        case 'create_employment':
          router.push(`/recruiter/employments/create?applicationId=${applicationId}`);
          break;
        
        case 'start_employment':
          // For ACCEPTED status - transition to WORKING
          // Note: In v3.1, recruiters should use extend_offer instead for APPROVED candidates
          if (confirm('Are you sure you want to start this employee? This will mark them as currently working.')) {
            await updateJobApplicationStatus(applicationId, 'WORKING');
            toast.success('Employment started successfully!');
            await fetchApplications();
          }
          break;

        case 'extend_offer':
          // v3.1: Recruiter extends job offer to candidate (APPROVED → OFFER_EXTENDED)
          if (confirm('Extend job offer to this candidate?\n\nThe candidate will be notified and must confirm or decline the offer before they can start working.')) {
            try {
              await extendJobOffer(applicationId);
              toast.success('🎉 Job offer extended! Waiting for candidate confirmation.');
              await fetchApplications();
            } catch (error: any) {
              console.error('Failed to extend offer:', error);
              toast.error(error.message || 'Failed to extend job offer');
            }
          }
          break;
          
        case 'send_offer':
          toast.error('Send offer feature not yet implemented');
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

  // Fetch applications
  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      
      let response;
      if (jobPostingId) {
        // Fetch applications for specific job posting
        response = await getJobApplications(jobPostingId);
      } else {
        // Fetch all applications for this recruiter
        response = await getRecruiterApplications();
      }

      if (response.code === 200 && response.result) {
        setApplications(response.result);
        setFilteredApplications(response.result);
      } else if (response.code === 0 && response.result) {
        // Legacy response format
        setApplications(response.result);
        setFilteredApplications(response.result);
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
    fetchApplications();
  }, [jobPostingId]);

  // Filter applications
  useEffect(() => {
    let filtered = applications;

    if (searchQuery) {
      filtered = filtered.filter(app =>
        app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.phoneNumber.includes(searchQuery) ||
        app.preferredWorkLocation.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedStatus !== "ALL") {
      filtered = filtered.filter(app => app.status === selectedStatus);
    }

    setFilteredApplications(filtered);
  }, [searchQuery, selectedStatus, applications]);

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
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-sky-800">Job applications</h1>
          <p className="text-sm text-gray-600 mt-1">Manage candidate applications for your job postings</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Job Posting ID:</label>
            <input
              type="number"
              value={jobPostingId ?? ''}
              onChange={(e) => setJobPostingId(e.target.value ? Number(e.target.value) : null)}
              className="w-24 rounded-md border px-3 py-2 text-sm"
              placeholder="All"
            />
          </div>
          <button
            onClick={fetchApplications}
            disabled={isLoading}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm shadow-sky-100">
        <div className="mb-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border bg-background pl-9 pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b overflow-x-auto">
          {availableStatuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap ${
                selectedStatus === status
                  ? "border-b-2 border-sky-600 text-sky-700"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {status === "ALL" ? "All" : status.replace(/_/g, ' ')}{" "}
              <span className="ml-1 text-xs">({getStatusCount(status)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg bg-white shadow-sm shadow-sky-100">
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
                      <StatusBadgeFull status={application.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2 flex-wrap">
                        {/* View Details Button */}
                        <button
                          onClick={() => {
                            setSelectedApplication(application);
                            setIsDetailDialogOpen(true);
                          }}
                          className="p-2 rounded-full hover:bg-blue-100 text-blue-600 transition"
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Dynamic Action Buttons based on status */}
                        {getRecruiterActions(application.status).slice(0, 3).map((statusAction) => (
                          <Button
                            key={statusAction.action}
                            variant={statusAction.variant as any}
                            size="sm"
                            onClick={() => handleRecruiterAction(statusAction.action, application.id)}
                            className="text-xs px-2 py-1 h-7"
                          >
                            {statusAction.label}
                          </Button>
                        ))}
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
                  <StatusBadgeFull status={selectedApplication.status} size="sm" />
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
    </>
  );
}
