"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Phone, 
  Users, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  RefreshCw,
  Building2,
  Briefcase,
  Globe,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import {
  getCandidateUpcomingInterviews,
  getCandidatePastInterviews,
  confirmInterview,
  getInterviewTypeText,
  formatInterviewDateTime,
  getInterviewDateTimeStr,
  isToday,
  isUpcoming,
  getInterviewByJobApplyId,
  type InterviewScheduleResponse
} from "@/lib/interview-api";

// Inner component to handle search params (uses useSearchParams which needs Suspense)
function CandidateInterviewsContent() {
  const searchParams = useSearchParams();
  const { headerHeight } = useLayout();
  const [loading, setLoading] = useState(true);
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewScheduleResponse[]>([]);
  const [pastInterviews, setPastInterviews] = useState<InterviewScheduleResponse[]>([]);
  
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

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerHeight || 0}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="interviews" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">My Interviews</h1>
                <p className="text-sm text-gray-600 mt-1">
                  View and manage your upcoming and past interviews
                </p>
              </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Upcoming Interviews</h3>
                <p className="text-muted-foreground">
                  You don't have any scheduled interviews at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            upcomingInterviews.map((interview) => (
              <Card 
                key={interview.id} 
                className={`${isToday(interview) ? "border-primary" : ""} ${
                  interview.status === "SCHEDULED" ? "border-l-4 border-l-yellow-500" : ""
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Company Logo */}
                      {interview.companyLogo ? (
                        <img 
                          src={interview.companyLogo} 
                          alt={interview.companyName || "Company"} 
                          className="h-12 w-12 rounded-lg object-contain border bg-white"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-1">
                        {/* Job Title */}
                        <CardTitle className="text-lg">
                          {interview.jobTitle || interview.positionTitle || "Interview"}
                        </CardTitle>
                        {/* Company Name */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{interview.companyName || "Company"}</span>
                          {interview.companyWebsite && (
                            <a 
                              href={interview.companyWebsite} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <Globe className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        {/* Interview Type */}
                        <div className="flex items-center gap-2">
                          {getInterviewTypeIcon(interview.interviewType)}
                          <span className="text-sm font-medium">
                            {getInterviewTypeText(interview.interviewType)}
                          </span>
                          {isToday(interview) && (
                            <Badge variant="destructive">Today!</Badge>
                          )}
                          {isUpcoming(interview) && !isToday(interview) && (
                            <Badge variant="outline">Soon</Badge>
                          )}
                          {/* Conflict Warning Badge */}
                          {interview.hasConflict && (
                            <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Conflict
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {getInterviewStatusBadge(interview.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Conflict Warning - Show if this interview has scheduling conflict */}
                  {interview.hasConflict && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded-md flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-orange-900">
                          Scheduling Conflict
                        </p>
                        <p className="text-sm text-orange-700">
                          {interview.conflictDetails || "You have another interview scheduled at this time. Consider rescheduling one of them."}
                        </p>
                      </div>
                    </div>
                  )}

                  {interview.status === "SCHEDULED" && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">
                          Confirmation Required
                        </p>
                        <p className="text-sm text-yellow-700">
                          Please confirm your attendance for this interview
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {formatInterviewDateTime(getInterviewDateTimeStr(interview))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.durationMinutes} minutes</span>
                    </div>
                    {interview.location && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{interview.location}</span>
                      </div>
                    )}
                    {interview.meetingLink && (
                      <div className="flex items-center gap-2 text-sm">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <a 
                          href={interview.meetingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          Join Meeting
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Interviewer Info Section */}
                  {(interview.interviewerName || interview.interviewerEmail || interview.interviewerPhone) && (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Interviewer
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        {interview.interviewerName && (
                          <span className="font-medium text-sm">{interview.interviewerName}</span>
                        )}
                        {interview.interviewerEmail && (
                          <a
                            href={`mailto:${interview.interviewerEmail}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {interview.interviewerEmail}
                          </a>
                        )}
                        {interview.interviewerPhone && (
                          <a
                            href={`tel:${interview.interviewerPhone}`}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {interview.interviewerPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {interview.preparationNotes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm">
                        <MessageSquare className="h-4 w-4 inline mr-1 text-muted-foreground" />
                        <span className="font-medium">Notes:</span> {interview.preparationNotes}
                      </p>
                    </div>
                  )}

                  {interview.rescheduleRequests && interview.rescheduleRequests.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Reschedule Request Status:</p>
                      {interview.rescheduleRequests.map((request) => (
                        <div key={request.id} className="p-2 bg-muted rounded-md text-sm">
                          <Badge variant="outline" className="mb-1">
                            {request.status}
                          </Badge>
                          <p className="text-muted-foreground">
                            New time: {formatInterviewDateTime(request.proposedDateTime)}
                          </p>
                          {request.responseMessage && (
                            <p className="text-muted-foreground mt-1">
                              Response: {request.responseMessage}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-2">
                    {/* Confirm button - only for SCHEDULED status */}
                    {interview.status === "SCHEDULED" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedInterview(interview);
                          setConfirmDialogOpen(true);
                        }}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirm Attendance
                      </Button>
                    )}
                  </div>
                    
                    {/* Contact for Reschedule */}
                    {(interview.interviewerEmail || interview.interviewerPhone) && interview.status !== "COMPLETED" && (
                      <div className="p-3 bg-muted rounded-md mt-2">
                        <p className="text-xs text-muted-foreground font-medium">Need to reschedule? Contact the interviewer.</p>
                      </div>
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastInterviews.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Past Interviews</h3>
                <p className="text-muted-foreground">
                  Your completed interviews will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            pastInterviews.map((interview) => (
              <Card key={interview.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {/* Company Logo */}
                      {interview.companyLogo ? (
                        <img 
                          src={interview.companyLogo} 
                          alt={interview.companyName || "Company"} 
                          className="h-12 w-12 rounded-lg object-contain border bg-white"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-1">
                        {/* Job Title */}
                        <CardTitle className="text-lg">
                          {interview.jobTitle || interview.positionTitle || "Interview"}
                        </CardTitle>
                        {/* Company Name */}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{interview.companyName || "Company"}</span>
                        </div>
                        {/* Interview Type */}
                        <div className="flex items-center gap-2">
                          {getInterviewTypeIcon(interview.interviewType)}
                          <span className="text-sm font-medium">
                            {getInterviewTypeText(interview.interviewType)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getInterviewStatusBadge(interview.status)}
                      {(interview.outcome || interview.result) && getResultBadge(interview.outcome || interview.result)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatInterviewDateTime(getInterviewDateTimeStr(interview))}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{interview.durationMinutes} minutes</span>
                    </div>
                  </div>

                  {/* Interviewer Info Section */}
                  {interview.interviewerName && (
                    <div className="p-3 bg-muted/50 rounded-lg border">
                      <p className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        Interviewer
                      </p>
                      <span className="font-medium text-sm">{interview.interviewerName}</span>
                    </div>
                  )}

                  {interview.feedback && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Interviewer Feedback:</p>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {interview.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Special message for NEEDS_SECOND_ROUND */}
                  {(interview.outcome === "NEEDS_SECOND_ROUND" || interview.result === "NEEDS_SECOND_ROUND") && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <RefreshCw className="h-4 w-4 inline mr-1" />
                        <strong>Another round required:</strong> The recruiter will schedule a new interview. 
                        You'll need to confirm your attendance for the next round.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
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
