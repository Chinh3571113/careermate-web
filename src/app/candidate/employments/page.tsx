"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Star,
  ChevronRight,
  RefreshCw,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import CVSidebar from "@/components/layout/CVSidebar";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuthStore } from "@/store/use-auth-store";
import {
  fetchMyJobApplications,
  terminateEmployment,
  type JobApplication
} from "@/lib/my-jobs-api";
import {
  getEmploymentByJobApply,
  confirmEmployment30Days,
  confirmEmployment90Days,
  formatEmploymentDuration,
  formatEmploymentDate,
  isInProbation,
  isEligibleForReview,
  type EmploymentVerificationResponse
} from "@/lib/employment-api";

const TERMINATION_TYPES = [
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'FIRED_PERFORMANCE', label: 'Fired (Performance)' },
  { value: 'FIRED_MISCONDUCT', label: 'Fired (Misconduct)' },
  { value: 'CONTRACT_END', label: 'Contract Ended' },
  { value: 'MUTUAL_AGREEMENT', label: 'Mutual Agreement' },
  { value: 'PROBATION_FAILED', label: 'Probation Failed' },
  { value: 'COMPANY_CLOSURE', label: 'Company Closure' },
  { value: 'LAYOFF', label: 'Layoff' },
];

interface EmploymentWithVerification {
  application: JobApplication;
  verification?: EmploymentVerificationResponse;
  loading: boolean;
}

export default function CandidateEmploymentsPage() {
  const router = useRouter();
  const { headerHeight } = useLayout();
  const { candidateId, fetchCandidateProfile } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [employments, setEmployments] = useState<EmploymentWithVerification[]>([]);
  
  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedEmployment, setSelectedEmployment] = useState<EmploymentWithVerification | null>(null);
  const [confirmationType, setConfirmationType] = useState<'30' | '90'>('30');
  const [confirmForm, setConfirmForm] = useState({
    stillEmployed: true,
    terminationType: '',
    terminationDate: '',
    reasonForLeaving: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [terminatingId, setTerminatingId] = useState<number | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      if (!candidateId) {
        try {
          await fetchCandidateProfile();
        } catch (error) {
          console.error("Failed to fetch candidate profile:", error);
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (candidateId) {
      loadEmployments();
    }
  }, [candidateId]);

  const loadEmployments = async () => {
    try {
      setLoading(true);
      
      // Get all applications with WORKING status
      const applications = await fetchMyJobApplications(candidateId!);
      const workingApplications = applications.filter(app => 
        app.status === 'WORKING' || app.status === 'TERMINATED'
      );
      
      // Initialize employments with loading state
      const initialEmployments: EmploymentWithVerification[] = workingApplications.map(app => ({
        application: app,
        verification: undefined,
        loading: true
      }));
      setEmployments(initialEmployments);
      setLoading(false);
      
      // Load verification details for each employment in parallel
      const updatedEmployments = await Promise.all(
        workingApplications.map(async (app) => {
          try {
            const verification = await getEmploymentByJobApply(app.id);
            return { application: app, verification, loading: false };
          } catch (error) {
            console.error(`Failed to load verification for job ${app.id}:`, error);
            return { application: app, verification: undefined, loading: false };
          }
        })
      );
      
      setEmployments(updatedEmployments);
    } catch (error: any) {
      console.error("Failed to load employments:", error);
      toast.error(error.message || "Failed to load employment data");
      setLoading(false);
    }
  };

  const handleOpenConfirmDialog = (employment: EmploymentWithVerification, type: '30' | '90') => {
    setSelectedEmployment(employment);
    setConfirmationType(type);
    setConfirmForm({
      stillEmployed: true,
      terminationType: '',
      terminationDate: '',
      reasonForLeaving: ''
    });
    setConfirmDialogOpen(true);
  };

  const handleConfirmEmployment = async () => {
    if (!selectedEmployment?.verification) return;
    
    try {
      setSubmitting(true);
      
      const terminationDetails = !confirmForm.stillEmployed ? {
        terminationType: confirmForm.terminationType,
        terminationDate: confirmForm.terminationDate,
        reasonForLeaving: confirmForm.reasonForLeaving
      } : undefined;
      
      if (confirmationType === '30') {
        await confirmEmployment30Days(
          selectedEmployment.verification.id,
          confirmForm.stillEmployed,
          terminationDetails
        );
      } else {
        await confirmEmployment90Days(
          selectedEmployment.verification.id,
          confirmForm.stillEmployed,
          terminationDetails
        );
      }
      
      toast.success(
        confirmForm.stillEmployed 
          ? `${confirmationType}-day employment status confirmed!`
          : 'Employment termination reported successfully'
      );
      setConfirmDialogOpen(false);
      loadEmployments();
    } catch (error: any) {
      console.error("Failed to confirm employment:", error);
      toast.error(error.message || "Failed to confirm employment status");
    } finally {
      setSubmitting(false);
    }
  };

  const getVerificationStatus = (verification?: EmploymentVerificationResponse) => {
    if (!verification) return null;
    
    const daysEmployed = verification.daysEmployed || 0;
    
    // Check if 30-day verification is needed (day 30-36)
    if (daysEmployed >= 30 && daysEmployed <= 36 && !verification.verified30Days) {
      return { type: '30', urgent: daysEmployed >= 34 };
    }
    
    // Check if 90-day verification is needed (day 90-96)
    if (daysEmployed >= 90 && daysEmployed <= 96 && !verification.verified90Days) {
      return { type: '90', urgent: daysEmployed >= 94 };
    }
    
    return null;
  };

  const handleTerminateEmployment = async (applicationId: number) => {
    if (!confirm('End your employment for this job? This will set status to TERMINATED.')) {
      return;
    }

    try {
      setTerminatingId(applicationId);
      await terminateEmployment(applicationId);
      toast.success('Employment terminated successfully');
      await loadEmployments();
    } catch (error: any) {
      console.error('Failed to terminate employment:', error);
      toast.error(error.response?.data?.message || 'Failed to terminate employment');
    } finally {
      setTerminatingId(null);
    }
  };

  const getEligibilityBadge = (eligibility?: string) => {
    switch (eligibility) {
      case 'ELIGIBLE':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Review Eligible</Badge>;
      case 'NOT_ELIGIBLE':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Not Eligible</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Verification</Badge>;
      default:
        return null;
    }
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
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start"
          style={{
            ["--sticky-offset" as any]: `${headerHeight || 0}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start">
            <CVSidebar activePage="employments" />
          </aside>

          <section className="space-y-6 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">My Employment</h1>
                  <p className="text-sm text-gray-600 mt-1">
                    Track your employment status and verification checkpoints
                  </p>
                </div>
                <Button variant="outline" onClick={loadEmployments} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {employments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <Briefcase className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Employment Records</h3>
                  <p className="text-gray-500 text-center mb-6">
                    You don't have any active or past employment records yet.<br />
                    Once you're hired, your employment will appear here.
                  </p>
                  <Link href="/candidate/my-jobs">
                    <Button>View My Applications</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {employments.map((employment) => {
                    const verificationNeeded = getVerificationStatus(employment.verification);
                    const isActive = employment.application.status === 'WORKING';
                    
                    return (
                      <Card key={employment.application.id} className={`
                        ${verificationNeeded?.urgent ? 'border-red-300 bg-red-50' : ''}
                        ${verificationNeeded && !verificationNeeded.urgent ? 'border-yellow-300 bg-yellow-50' : ''}
                      `}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg">{employment.application.jobTitle}</CardTitle>
                                <CardDescription>
                                  {employment.verification?.companyName || 'Company'}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}>
                                {isActive ? 'Active' : employment.application.status.replace(/_/g, ' ')}
                              </Badge>
                              {getEligibilityBadge(employment.verification?.reviewEligibility)}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {employment.loading ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Loading details...
                            </div>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Start Date</p>
                                  <p className="font-medium">
                                    {employment.verification?.startDate 
                                      ? formatEmploymentDate(employment.verification.startDate)
                                      : 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Days Working</p>
                                  <p className="font-medium">{employment.verification?.daysEmployed ?? 0} days</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 uppercase tracking-wider">Position</p>
                                  <p className="font-medium">{employment.application.jobTitle}</p>
                                </div>
                              </div>

                              {/* Verification Checkpoints */}
                              {employment.verification && (
                                <div className="border-t pt-4 mt-4">
                                  <p className="text-sm font-medium text-gray-700 mb-3">Verification Checkpoints</p>
                                  <div className="flex flex-wrap gap-4">
                                    <div className="flex items-center gap-2">
                                      {employment.verification.verified30Days ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Clock className="h-5 w-5 text-gray-400" />
                                      )}
                                      <span className={employment.verification.verified30Days ? 'text-green-700' : 'text-gray-600'}>
                                        30-Day {employment.verification.verified30Days ? 'Verified' : 'Pending'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {employment.verification.verified90Days ? (
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                      ) : (
                                        <Clock className="h-5 w-5 text-gray-400" />
                                      )}
                                      <span className={employment.verification.verified90Days ? 'text-green-700' : 'text-gray-600'}>
                                        90-Day {employment.verification.verified90Days ? 'Verified' : 'Pending'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Verification Action Required Banner */}
                              {verificationNeeded && isActive && (
                                <div className={`
                                  mt-4 p-4 rounded-lg flex items-center justify-between
                                  ${verificationNeeded.urgent ? 'bg-red-100 border border-red-300' : 'bg-yellow-100 border border-yellow-300'}
                                `}>
                                  <div className="flex items-center gap-3">
                                    <AlertCircle className={`h-5 w-5 ${verificationNeeded.urgent ? 'text-red-600' : 'text-yellow-600'}`} />
                                    <div>
                                      <p className={`font-medium ${verificationNeeded.urgent ? 'text-red-800' : 'text-yellow-800'}`}>
                                        {verificationNeeded.type}-Day Verification Required
                                      </p>
                                      <p className={`text-sm ${verificationNeeded.urgent ? 'text-red-600' : 'text-yellow-600'}`}>
                                        {verificationNeeded.urgent 
                                          ? 'Deadline approaching! Verify now to keep review eligibility.'
                                          : 'Please confirm your employment status to maintain review eligibility.'}
                                      </p>
                                    </div>
                                  </div>
                                  <Button
                                    onClick={() => handleOpenConfirmDialog(employment, verificationNeeded.type as '30' | '90')}
                                    variant={verificationNeeded.urgent ? 'destructive' : 'default'}
                                  >
                                    Verify Now
                                  </Button>
                                </div>
                              )}

                              {/* Actions */}
                              <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
                                {employment.verification?.reviewEligibility === 'ELIGIBLE' && (
                                  <Link href={`/candidate/reviews/submit?jobApplyId=${employment.application.id}`}>
                                    <Button variant="outline" size="sm">
                                      <Star className="h-4 w-4 mr-2" />
                                      Write Review
                                    </Button>
                                  </Link>
                                )}
                                {isActive && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={terminatingId === employment.application.id}
                                    onClick={() => handleTerminateEmployment(employment.application.id)}
                                  >
                                    {terminatingId === employment.application.id ? 'Ending...' : 'End Employment'}
                                  </Button>
                                )}
                                <Link href={`/jobs-detail?id=${employment.application.jobPostingId}`}>
                                  <Button variant="outline" size="sm">
                                    View Job Details
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </Link>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirmationType}-Day Employment Verification</DialogTitle>
            <DialogDescription>
              Confirm your current employment status at {selectedEmployment?.verification?.companyName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label>Are you still employed at this company?</Label>
              <RadioGroup
                value={confirmForm.stillEmployed ? 'yes' : 'no'}
                onValueChange={(value) => setConfirmForm({ ...confirmForm, stillEmployed: value === 'yes' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="cursor-pointer">
                    <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
                    Yes, I'm still employed
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="cursor-pointer">
                    <XCircle className="h-4 w-4 inline mr-1 text-red-600" />
                    No, I have left this position
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {!confirmForm.stillEmployed && (
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label>Termination Type *</Label>
                  <Select
                    value={confirmForm.terminationType}
                    onValueChange={(value) => setConfirmForm({ ...confirmForm, terminationType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select termination type" />
                    </SelectTrigger>
                    <SelectContent>
                      {TERMINATION_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Last Day of Employment *</Label>
                  <Input
                    type="date"
                    value={confirmForm.terminationDate}
                    onChange={(e) => setConfirmForm({ ...confirmForm, terminationDate: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reason for Leaving (Optional)</Label>
                  <Textarea
                    value={confirmForm.reasonForLeaving}
                    onChange={(e) => setConfirmForm({ ...confirmForm, reasonForLeaving: e.target.value })}
                    placeholder="Briefly describe why you left this position..."
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmEmployment} 
              disabled={submitting || (!confirmForm.stillEmployed && (!confirmForm.terminationType || !confirmForm.terminationDate))}
            >
              {submitting ? 'Confirming...' : 'Confirm Status'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
