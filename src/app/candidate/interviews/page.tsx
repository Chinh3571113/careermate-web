"use client";

import { useEffect, useState, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Calendar, 
  MapPin, 
  Video, 
  Phone,
  Clock,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import {
  getCandidateUpcomingInterviews,
  getCandidatePastInterviews,
  confirmInterview,
  getInterviewByJobApplyId,
  formatInterviewDateTime,
  getInterviewDateTimeStr,
  type InterviewScheduleResponse
} from "@/lib/interview-api";

// Lazy load tab components
const UpcomingInterviewsTab = lazy(() => import("./UpcomingInterviewsTab"));
const PastInterviewsTab = lazy(() => import("./PastInterviewsTab"));

// Inner component to handle search params (uses useSearchParams which needs Suspense)
function CandidateInterviewsContent() {
  const searchParams = useSearchParams();
  const { headerHeight } = useLayout();
  const [loading, setLoading] = useState(true);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [pastInterviews, setPastInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  // Dialog states
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<InterviewScheduleResponse | null>(null);

  // Handle URL params for actions from my-jobs page
  useEffect(() => {
    const handleUrlAction = async () => {
      const action = searchParams.get('action');
      const jobApplyId = searchParams.get('id');
      
      if (!action || !jobApplyId) return;
      
      console.log(`📋 [INTERVIEWS PAGE] Handling URL action: ${action} for jobApplyId: ${jobApplyId}`);
      
      try {
        // Get the interview by job apply ID
        const result = await getInterviewByJobApplyId(parseInt(jobApplyId));
        
        if (!result.found) {
          toast.error("Interview not found for this application");
          return;
        }
        
        const interview = result.interview;
        setSelectedInterview(interview);
        
        // Open the confirm dialog if action is confirm AND interview is not yet confirmed
        if (action === 'confirm') {
          if (interview.candidateConfirmed || interview.status === 'CONFIRMED') {
            toast.info("This interview is already confirmed");
            // Clear the URL params without triggering a re-render
            window.history.replaceState({}, '', '/candidate/interviews');
          } else {
            setConfirmDialogOpen(true);
            toast.info("Please confirm your interview attendance");
          }
        }
      } catch (error: any) {
        console.error("Failed to handle URL action:", error);
        toast.error(error.message || "Failed to load interview details");
      }
    };

    // Wait for interviews to load first, then handle URL action
    if (!loading && upcomingInterviews.length >= 0) {
      handleUrlAction();
    }
  }, [searchParams, loading, upcomingInterviews.length]);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    try {
      setLoading(true);

      const [upcoming, past] = await Promise.all([
        getCandidateUpcomingInterviews(),
        getCandidatePastInterviews()
      ]);
      
      setUpcomingInterviews(upcoming);
      setPastInterviews(past);
    } catch (error: any) {
      console.error("Failed to load interviews:", error);
      toast.error(error.response?.data?.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmInterview = async () => {
    if (!selectedInterview) return;

    try {
      await confirmInterview(selectedInterview.id);
      toast.success("Interview confirmed successfully");
      setConfirmDialogOpen(false);
      loadInterviews();
    } catch (error: any) {
      console.error("Failed to confirm interview:", error);
      toast.error(error.response?.data?.message || "Failed to confirm interview");
    }
  };

  const getInterviewStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      SCHEDULED: { variant: "outline", label: "Awaiting Confirmation" },
      CONFIRMED: { variant: "default", label: "Confirmed" },
      COMPLETED: { variant: "secondary", label: "Completed" },
      CANCELLED: { variant: "destructive", label: "Cancelled" },
      NO_SHOW: { variant: "destructive", label: "Missed" },
      RESCHEDULED: { variant: "outline", label: "Another Round Scheduled" }
    };
    
    const { variant, label } = config[status] || { variant: "outline" as const, label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case "PHONE": return <Phone className="h-4 w-4" />;
      case "VIDEO_CALL": return <Video className="h-4 w-4" />;
      case "IN_PERSON": return <MapPin className="h-4 w-4" />;
      case "ONLINE_ASSESSMENT": return <Calendar className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getResultBadge = (result?: string) => {
    if (!result) return null;
    
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      PASS: { variant: "default", label: "Passed" },
      FAIL: { variant: "destructive", label: "Not Selected" },
      PENDING: { variant: "secondary", label: "Under Review" },
      NEEDS_SECOND_ROUND: { variant: "outline", label: "Second Round Required" },
      // Legacy support
      PASSED: { variant: "default", label: "Passed" },
      FAILED: { variant: "destructive", label: "Not Selected" }
    };
    
    const { variant, label } = config[result] || { variant: "secondary" as const, label: result };
    return <Badge variant={variant}>{label}</Badge>;
  };

  // Skeleton loading component that matches the actual layout
  const InterviewSkeleton = () => (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      <div
        className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
        style={{
          ["--sticky-offset" as any]: `${headerHeight || 0}px`,
          ["--content-pad" as any]: "24px",
        }}
      >
        {/* Sidebar Skeleton */}
        <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Main Content Skeleton */}
        <section className="space-y-6 min-w-0 transition-all duration-300">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Interview Cards */}
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-6 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                    </div>
                    <div className="h-6 w-24 bg-gray-200 rounded" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );

  if (loading) {
    return <InterviewSkeleton />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start"
          style={{
            ["--sticky-offset" as any]: `${headerHeight || 0}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start">
            <CVSidebar activePage="interviews" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">My Interviews</h1>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage your upcoming and past interviews
                </p>
              </div>

              {/* Tabs - Job Activities Style */}
              <div className="border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`pb-3 px-1 mr-8 relative border-b-2 ${
                    activeTab === "upcoming"
                      ? "text-black font-semibold border-black"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                >
                  Upcoming Interviews
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "upcoming" 
                      ? "bg-black text-white" 
                      : "bg-gray-500 text-white"
                  }`}>
                    {upcomingInterviews.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("past")}
                  className={`pb-3 px-1 mr-8 relative border-b-2 ${
                    activeTab === "past"
                      ? "text-black font-semibold border-black"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                >
                  Past Interviews
                  <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === "past" 
                      ? "bg-black text-white" 
                      : "bg-gray-500 text-white"
                  }`}>
                    {pastInterviews.length}
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="py-4">
                {activeTab === "upcoming" && (
                  <Suspense fallback={
                    <Card>
                      <CardContent className="py-12 text-center">
                        <div className="h-12 w-12 mx-auto mb-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-48 mx-auto mb-2 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-64 mx-auto bg-gray-200 rounded animate-pulse" />
                      </CardContent>
                    </Card>
                  }>
                    <UpcomingInterviewsTab
                      interviews={upcomingInterviews}
                      onConfirmClick={(interview) => {
                        setSelectedInterview(interview);
                        setConfirmDialogOpen(true);
                      }}
                      getStatusBadge={getInterviewStatusBadge}
                      getTypeIcon={getInterviewTypeIcon}
                    />
                  </Suspense>
                )}

                {activeTab === "past" && (
                  <Suspense fallback={
                    <Card>
                      <CardContent className="py-12 text-center">
                        <div className="h-12 w-12 mx-auto mb-4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-6 w-48 mx-auto mb-2 bg-gray-200 rounded animate-pulse" />
                        <div className="h-4 w-64 mx-auto bg-gray-200 rounded animate-pulse" />
                      </CardContent>
                    </Card>
                  }>
                    <PastInterviewsTab
                      interviews={pastInterviews}
                      getStatusBadge={getInterviewStatusBadge}
                      getResultBadge={getResultBadge}
                      getTypeIcon={getInterviewTypeIcon}
                    />
                  </Suspense>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Confirm Interview Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Interview Attendance</DialogTitle>
              <DialogDescription>
                Please confirm that you will attend this interview
              </DialogDescription>
            </DialogHeader>
            {selectedInterview && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatInterviewDateTime(getInterviewDateTimeStr(selectedInterview))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedInterview.durationMinutes} minutes</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  By confirming, you're committing to attend this interview. If you need to reschedule,
                  please use the "Request Reschedule" option instead.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmInterview}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm Attendance
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </main>
  );
}

// Main page component with Suspense wrapper for useSearchParams
export default function CandidateInterviewsPage() {
  return (
    <Suspense fallback={
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </main>
    }>
      <CandidateInterviewsContent />
    </Suspense>
  );
}
