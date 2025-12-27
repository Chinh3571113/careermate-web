"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Briefcase, 
  Clock, 
  Calendar,
  Mail,
  Phone,
  AlertTriangle,
  FileText,
  XCircle,
  Search,
  Filter,
  Users,
  UserCheck,
  UserX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getRecruiterActiveEmployments,
  terminateEmployment,
  calculateEmploymentDuration,
  formatEmploymentDuration,
  isInProbation,
  isEligibleForReview,
  type EmploymentVerificationResponse,
  type TerminationType
} from "@/lib/employment-api";

const TERMINATION_TYPES: { value: TerminationType; label: string }[] = [
  { value: 'RESIGNATION', label: 'Resignation' },
  { value: 'FIRED_PERFORMANCE', label: 'Fired (Performance)' },
  { value: 'FIRED_MISCONDUCT', label: 'Fired (Misconduct)' },
  { value: 'CONTRACT_END', label: 'Contract Ended' },
  { value: 'MUTUAL_AGREEMENT', label: 'Mutual Agreement' },
  { value: 'PROBATION_FAILED', label: 'Probation Failed' },
  { value: 'COMPANY_CLOSURE', label: 'Company Closure' },
  { value: 'LAYOFF', label: 'Layoff' },
];

export default function EmploymentsPage() {
  const [loading, setLoading] = useState(true);
  const [employments, setEmployments] = useState<EmploymentVerificationResponse[]>([]);
  const [selectedEmployment, setSelectedEmployment] = useState<EmploymentVerificationResponse | null>(null);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'probation' | 'terminated'>('all');
  
  // Termination form - updated to match backend API
  const [terminationForm, setTerminationForm] = useState({
    terminationType: '' as TerminationType | '',
    terminationDate: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    loadEmployments();
  }, []);

  const loadEmployments = async () => {
    try {
      setLoading(true);
      const data = await getRecruiterActiveEmployments();
      setEmployments(data || []);
    } catch (error: any) {
      console.error("Failed to load employments:", error);
      // Don't show error toast if it's just empty data
      if (error.message !== 'Failed to fetch active employments') {
        toast.error(error.message || "Failed to load employments");
      }
      setEmployments([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered employments based on search and status filter
  const filteredEmployments = useMemo(() => {
    return employments.filter((emp) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === '' || 
        (emp.candidateName?.toLowerCase().includes(searchLower)) ||
        (emp.jobTitle?.toLowerCase().includes(searchLower)) ||
        (emp.position?.toLowerCase().includes(searchLower)) ||
        (emp.candidateEmail?.toLowerCase().includes(searchLower)) ||
        (emp.department?.toLowerCase().includes(searchLower));

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'active') {
        matchesStatus = emp.employmentStatus === 'ACTIVE' && !isInProbation(emp.startDate, emp.probationEndDate);
      } else if (statusFilter === 'probation') {
        matchesStatus = emp.employmentStatus === 'ACTIVE' && isInProbation(emp.startDate, emp.probationEndDate);
      } else if (statusFilter === 'terminated') {
        matchesStatus = emp.employmentStatus === 'TERMINATED';
      }

      return matchesSearch && matchesStatus;
    });
  }, [employments, searchQuery, statusFilter]);

  // Stats for quick overview
  const stats = useMemo(() => {
    const total = employments.length;
    const active = employments.filter(e => e.employmentStatus === 'ACTIVE' && !isInProbation(e.startDate, e.probationEndDate)).length;
    const probation = employments.filter(e => e.employmentStatus === 'ACTIVE' && isInProbation(e.startDate, e.probationEndDate)).length;
    const terminated = employments.filter(e => e.employmentStatus === 'TERMINATED').length;
    return { total, active, probation, terminated };
  }, [employments]);

  const handleTerminateEmployment = async () => {
    if (!selectedEmployment) return;

    if (!terminationForm.terminationType) {
      toast.error("Please select a termination type");
      return;
    }

    try {
      await terminateEmployment(selectedEmployment.jobApplyId, {
        terminationType: terminationForm.terminationType as TerminationType,
        terminationDate: terminationForm.terminationDate,
        reason: terminationForm.reason || undefined
      });

      toast.success("Employment terminated successfully");
      setTerminateDialogOpen(false);
      setTerminationForm({
        terminationType: '',
        terminationDate: new Date().toISOString().split('T')[0],
        reason: ''
      });
      loadEmployments();
    } catch (error: any) {
      console.error("Failed to terminate employment:", error);
      toast.error(error.message || "Failed to terminate employment");
    }
  };

  const getEmploymentStatusBadge = (employment: EmploymentVerificationResponse) => {
    if (employment.employmentStatus === "TERMINATED") {
      return <Badge variant="secondary">Terminated</Badge>;
    }
    if (isInProbation(employment.startDate, employment.probationEndDate)) {
      return <Badge variant="outline" className="border-yellow-500 text-yellow-700">On Probation</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Employment Management</h1>
        <p className="text-muted-foreground">
          Manage active employee records and handle terminations
        </p>
      </div>

      {/* Stats Cards */}
      {employments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('all')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className={`h-8 w-8 ${statusFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('active')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className={`h-8 w-8 ${statusFilter === 'active' ? 'text-green-600' : 'text-muted-foreground'}`} />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('probation')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Probation</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.probation}</p>
                </div>
                <Clock className={`h-8 w-8 ${statusFilter === 'probation' ? 'text-yellow-600' : 'text-muted-foreground'}`} />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter('terminated')}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Terminated</p>
                  <p className="text-2xl font-bold text-gray-500">{stats.terminated}</p>
                </div>
                <UserX className={`h-8 w-8 ${statusFilter === 'terminated' ? 'text-gray-600' : 'text-muted-foreground'}`} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      {employments.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, position, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'probation' | 'terminated') => setStatusFilter(v)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="probation">On Probation</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Results count */}
      {employments.length > 0 && searchQuery && (
        <p className="text-sm text-muted-foreground mb-4">
          Showing {filteredEmployments.length} of {employments.length} employees
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      )}

      <div className="grid gap-4">
        {filteredEmployments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">
                {employments.length === 0 ? 'No Active Employments' : 'No Results Found'}
              </h3>
              <p className="text-muted-foreground">
                {employments.length === 0 
                  ? "You don't have any active employees at the moment."
                  : `No employees match your search "${searchQuery}" with the selected filter.`
                }
              </p>
              {employments.length > 0 && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEmployments.map((employment, index) => {
            const duration = calculateEmploymentDuration(employment.startDate, employment.endDate);
            const isProbation = isInProbation(employment.startDate, employment.probationEndDate);
            const canReview = isEligibleForReview(employment.startDate, employment.endDate);

            return (
              <Card key={employment.id || employment.jobApplyId || index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5" />
                        <CardTitle className="text-xl">
                          {employment.candidateName || employment.jobTitle || 'Employee'}
                        </CardTitle>
                        {isProbation && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                            Probation
                          </Badge>
                        )}
                      </div>
                      <CardDescription>
                        {employment.position || employment.jobTitle || 'Position N/A'} {employment.department ? `• ${employment.department}` : ''}
                      </CardDescription>
                    </div>
                    {getEmploymentStatusBadge(employment)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Start Date</p>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {new Date(employment.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {formatEmploymentDuration(employment.startDate, employment.endDate)}
                        </span>
                      </div>
                    </div>

                    {(employment.candidateEmail || employment.candidatePhone) && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Contact</p>
                        <div className="space-y-1">
                          {employment.candidateEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <a
                                className="text-sm font-medium underline-offset-4 hover:underline"
                                href={`mailto:${employment.candidateEmail}`}
                              >
                                {employment.candidateEmail}
                              </a>
                            </div>
                          )}
                          {employment.candidatePhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <a
                                className="text-sm font-medium underline-offset-4 hover:underline"
                                href={`tel:${employment.candidatePhone}`}
                              >
                                {employment.candidatePhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {employment.salary && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Salary</p>
                        <span className="text-sm font-medium">
                          ${employment.salary.toLocaleString()}
                        </span>
                      </div>
                    )}

                    {employment.probationEndDate && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Probation End</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {new Date(employment.probationEndDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {employment.endDate && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {new Date(employment.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {isProbation && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-900">
                          Probation Period Active
                        </p>
                        <p className="text-sm text-yellow-700">
                          Employee is currently in probation until {new Date(employment.probationEndDate!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {canReview && employment.employmentStatus === "ACTIVE" && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Review Eligible
                        </p>
                        <p className="text-sm text-blue-700">
                          Employee has been employed for 30+ days and is eligible for work reviews
                        </p>
                      </div>
                    </div>
                  )}

                  {employment.terminationReason && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-2">Termination Reason:</p>
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                          {employment.terminationReason}
                        </p>
                      </div>
                    </div>
                  )}

                  {employment.employmentStatus === "ACTIVE" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedEmployment(employment);
                          setTerminationForm({
                            terminationType: '',
                            terminationDate: new Date().toISOString().split('T')[0],
                            reason: ''
                          });
                          setTerminateDialogOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Terminate Employment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Terminate Employment Dialog */}
      <Dialog open={terminateDialogOpen} onOpenChange={setTerminateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Terminate Employment</DialogTitle>
            <DialogDescription>
              This action will end the employee&apos;s employment. Please provide details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="termination-type">Termination Type *</Label>
              <Select
                value={terminationForm.terminationType}
                onValueChange={(value: TerminationType) =>
                  setTerminationForm({ ...terminationForm, terminationType: value })
                }
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
              <Label htmlFor="termination-date">Termination Date *</Label>
              <Input
                id="termination-date"
                type="date"
                value={terminationForm.terminationDate}
                onChange={(e) =>
                  setTerminationForm({ ...terminationForm, terminationDate: e.target.value })
                }
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Provide additional details about the termination..."
                value={terminationForm.reason}
                onChange={(e) =>
                  setTerminationForm({ ...terminationForm, reason: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTerminateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleTerminateEmployment}
              disabled={!terminationForm.terminationType}
            >
              Confirm Termination
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
