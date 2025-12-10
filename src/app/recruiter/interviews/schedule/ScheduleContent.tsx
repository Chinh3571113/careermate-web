"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Briefcase,
  MapPin,
  Video,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useAuthStore } from "@/store/use-auth-store";
import {
  getAvailableSlots,
  getDailyCalendar,
  type DailyCalendarResponse,
} from "@/lib/calendar-api";
import { 
  scheduleInterview, 
  getInterviewById, 
  getInterviewByJobApplyId, 
  updateInterview,
  getRecruiterUpcomingInterviews,
  requestReschedule,
  type UpdateInterviewRequest,
  type InterviewScheduleResponse
} from "@/lib/interview-api";
import { getApplicationById } from "@/lib/recruiter-api";

interface InterviewForm {
  jobApplyId: number;
  candidateId: number;
  candidateName: string;
  positionTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  interviewType: string;
  location: string;
  meetingLink: string;
  notes: string;
}

const INTERVIEW_TYPES = [
  { value: "PHONE", label: "Phone Interview" },
  { value: "VIDEO_CALL", label: "Video Interview" },
  { value: "IN_PERSON", label: "In-Person Interview" },
  { value: "ONLINE_ASSESSMENT", label: "Online Assessment" },
];

const DURATIONS = [
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

export default function ScheduleInterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId");
  const action = searchParams.get("action"); // 'reschedule' or null
  const interviewIdParam = searchParams.get("interviewId"); // For reschedule

  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isReschedule, setIsReschedule] = useState(false);
  const [originalInterview, setOriginalInterview] = useState<InterviewScheduleResponse | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Use ref to ensure handleSchedule always has the latest interview data
  // This prevents stale closure issues with React state
  const interviewRef = useRef<{ isReschedule: boolean; interview: InterviewScheduleResponse | null }>({
    isReschedule: false,
    interview: null
  });

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [dailyCalendar, setDailyCalendar] = useState<DailyCalendarResponse | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  // Form state
  const [form, setForm] = useState<InterviewForm>({
    jobApplyId: parseInt(applicationId || "0"),
    candidateId: 0,
    candidateName: "",
    positionTitle: "",
    scheduledDate: "",
    scheduledTime: "",
    durationMinutes: 60,
    interviewType: "VIDEO_CALL",
    location: "",
    meetingLink: "",
    notes: "",
  });

  // Mount and initialize
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      initializePage();
    }
  }, [mounted]);

  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate, form.durationMinutes]);

  // Note: Conflict checking is handled by the available slots API
  // The backend returns only non-conflicting time slots, so we don't need separate conflict checks

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
  }

  function formatDateForAPI(date: Date): string {
    return date.toISOString().split("T")[0];
  }

  function getWeekDates(startDate: Date): Date[] {
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  /**
   * Format time to ISO 8601 datetime string
   * Handles time in HH:mm or HH:mm:ss format
   * Returns: YYYY-MM-DDTHH:mm:ss (no extra colons)
   */
  function formatScheduledDateTime(date: string, time: string): string {
    // Time can be "10:00" or "10:00:00"
    // We need to ensure it's always HH:mm:ss format
    const timeParts = time.split(':');
    let formattedTime = time;
    
    if (timeParts.length === 2) {
      // Time is HH:mm, add :00 for seconds
      formattedTime = `${time}:00`;
    } else if (timeParts.length === 3) {
      // Time is already HH:mm:ss, use as-is
      formattedTime = time;
    }
    
    return `${date}T${formattedTime}`;
  }

  const initializePage = async () => {
    console.log('🚀 [INIT] Starting page initialization...', { action, applicationId, interviewIdParam });
    try {
      setLoading(true);
      
      // STEP 1: Check if we already have an interview for this job application
      // This determines whether we schedule a NEW interview or RESCHEDULE an existing one
      let existingInterview: InterviewScheduleResponse | null = null;
      
      // Try by interviewId first (if provided in URL)
      if (interviewIdParam) {
        const interviewId = parseInt(interviewIdParam);
        console.log('🔍 [AUTO-DETECT] Fetching interview by ID:', interviewId);
        try {
          existingInterview = await getInterviewById(interviewId);
          console.log('✅ [AUTO-DETECT] Found interview by ID:', existingInterview?.id);
        } catch (e: any) {
          console.log('⚠️ [AUTO-DETECT] Could not find interview by ID:', e?.message);
        }
      }
      
      // If no interview found by ID, try by applicationId (jobApplyId)
      if (!existingInterview && applicationId) {
        const jobApplyId = parseInt(applicationId);
        console.log('🔍 [AUTO-DETECT] Checking for existing interview for jobApplyId:', jobApplyId);
        
        // Method 1: Try direct API call
        try {
          const result = await getInterviewByJobApplyId(jobApplyId);
          console.log('🔍 [AUTO-DETECT] getInterviewByJobApplyId result:', result);
          
          if (result.found) {
            existingInterview = result.interview;
            console.log('✅ [AUTO-DETECT] Found existing interview via direct API:', existingInterview.id);
          } else {
            console.log('ℹ️ [AUTO-DETECT] Direct API returned not found, trying fallback...');
          }
        } catch (e: any) {
          console.error('⚠️ [AUTO-DETECT] Direct API error:', e?.message);
        }
        
        // Method 2: Fallback - search in recruiter's upcoming interviews
        if (!existingInterview) {
          console.log('🔍 [AUTO-DETECT FALLBACK] Searching in recruiter upcoming interviews...');
          try {
            const allInterviews = await getRecruiterUpcomingInterviews();
            console.log('🔍 [AUTO-DETECT FALLBACK] Got', allInterviews.length, 'upcoming interviews');
            
            const matchingInterview = allInterviews.find(i => i.jobApplyId === jobApplyId);
            if (matchingInterview) {
              existingInterview = matchingInterview;
              console.log('✅ [AUTO-DETECT FALLBACK] Found matching interview:', existingInterview.id);
            } else {
              console.log('ℹ️ [AUTO-DETECT FALLBACK] No matching interview in upcoming list');
            }
          } catch (fallbackError: any) {
            console.error('⚠️ [AUTO-DETECT FALLBACK] Failed:', fallbackError?.message);
          }
        }
      }

      // STEP 2: Configure page based on whether interview exists
      if (existingInterview) {
        // === RESCHEDULE MODE ===
        console.log('🔄 [RESCHEDULE MODE] Interview exists - entering reschedule mode');
        console.log('🔄 [RESCHEDULE MODE] Interview details:', {
          id: existingInterview.id,
          jobApplyId: existingInterview.jobApplyId,
          status: existingInterview.status,
          scheduledDate: existingInterview.scheduledDate
        });
        
        // Update both state AND ref to ensure handleSchedule has latest data
        setIsReschedule(true);
        setOriginalInterview(existingInterview);
        interviewRef.current = { isReschedule: true, interview: existingInterview };
        
        console.log('🔄 [RESCHEDULE MODE] Updated ref:', interviewRef.current);
        
        // Pre-fill form with existing interview data
        const dateTimeStr = existingInterview.scheduledDate || existingInterview.interviewDateTime || '';
        const interviewDate = new Date(dateTimeStr);
        const dateStr = formatDateForAPI(interviewDate);
        
        // Get candidate/position info - try from interview first, then fetch from application
        let candidateName = existingInterview.candidateName || '';
        let positionTitle = existingInterview.positionTitle || '';
        let candidateId = existingInterview.candidateId || 0;
        
        // If interview doesn't have candidate info, fetch from application
        if (!candidateName || !positionTitle) {
          console.log('📋 [RESCHEDULE MODE] Interview missing candidate info, fetching from application...');
          try {
            const appResponse = await getApplicationById(existingInterview.jobApplyId);
            if (appResponse.result) {
              const app = appResponse.result;
              candidateName = candidateName || app.fullName || 'Unknown Candidate';
              positionTitle = positionTitle || app.jobTitle || 'Unknown Position';
              candidateId = candidateId || app.candidateId || 0;
              console.log('✅ [RESCHEDULE MODE] Got candidate info from application:', candidateName, positionTitle);
            }
          } catch (appError) {
            console.error('⚠️ [RESCHEDULE MODE] Failed to fetch application details:', appError);
          }
        }
        
        setForm(prev => ({
          ...prev,
          jobApplyId: existingInterview!.jobApplyId,
          candidateId: candidateId,
          candidateName: candidateName || 'Unknown Candidate',
          positionTitle: positionTitle || 'Unknown Position',
          durationMinutes: existingInterview!.durationMinutes,
          interviewType: existingInterview!.interviewType as string,
          location: existingInterview!.location || '',
          meetingLink: existingInterview!.meetingLink || '',
          notes: existingInterview!.preparationNotes || '',
        }));
        
        // Set the date for calendar (but don't set time - let user pick new time)
        setSelectedDate(dateStr);
        setCurrentWeekStart(getWeekStart(interviewDate));
        
        toast.info("Interview exists. Select a new date and time to reschedule.");
      } else if (applicationId) {
        // === NEW SCHEDULE MODE ===
        console.log('➕ [NEW SCHEDULE MODE] No existing interview, loading application details');
        const jobApplyId = parseInt(applicationId);
        
        try {
          const appResponse = await getApplicationById(jobApplyId);
          if (appResponse.result) {
            const app = appResponse.result;
            setForm(prev => ({
              ...prev,
              jobApplyId: app.id,
              candidateId: app.candidateId,
              candidateName: app.fullName || 'Unknown Candidate',
              positionTitle: app.jobTitle || 'Unknown Position',
            }));
            console.log('✅ [NEW SCHEDULE] Pre-filled application data:', app.fullName, app.jobTitle);
          }
        } catch (appError) {
          console.error("Failed to fetch application details:", appError);
          toast.error("Failed to load application details");
        }
      } else {
        // === ERROR STATE ===
        console.error('❌ [INIT] No applicationId or interviewId provided');
        toast.error("Missing application or interview ID");
      }

      // Set today as initial selected date if not already set
      if (!selectedDate) {
        const today = new Date();
        const todayStr = formatDateForAPI(today);
        setSelectedDate(todayStr);
        setForm((prev) => ({ ...prev, scheduledDate: todayStr }));
      }
    } catch (error) {
      console.error("Failed to initialize page:", error);
      toast.error("Failed to load page data");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate) return;

    try {
      console.log(`📅 [LOAD SLOTS] Loading for date ${selectedDate}, duration ${form.durationMinutes}min (ID from JWT)`);
      
      const [slots, calendar] = await Promise.all([
        getAvailableSlots(selectedDate, form.durationMinutes),
        getDailyCalendar(selectedDate),
      ]);

      console.log(`✅ [LOAD SLOTS] Got ${slots.length} slots:`, slots);
      console.log(`✅ [LOAD SLOTS] Calendar:`, calendar);

      setAvailableSlots(slots);
      setDailyCalendar(calendar);
      
      // Show helpful message if no slots available
      if (slots.length === 0) {
        if (calendar && !calendar.isWorkingDay) {
          toast.info("This is not a working day. Please select another date.");
        } else if (calendar && calendar.hasTimeOff) {
          toast.info("You have time off on this day.");
        } else {
          console.log("⚠️ [LOAD SLOTS] No slots returned - may need to configure working hours");
        }
      }
    } catch (error: any) {
      console.error("Failed to load available slots:", error);
      // Don't show error toast if it's a "no working hours" issue
      if (error.message?.includes("working hours")) {
        toast.warning("Please configure your working hours in Calendar settings first.");
      } else {
        toast.error("Failed to load available time slots");
      }
    }
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDateForAPI(date);
    setSelectedDate(dateStr);
    setForm((prev) => ({
      ...prev,
      scheduledDate: dateStr,
      scheduledTime: "", // Reset time when date changes
    }));
  };

  const handleTimeSelect = (time: string) => {
    setForm((prev) => ({ ...prev, scheduledTime: time }));
  };

  const handleSchedule = async () => {
    // Note: Conflict checking is handled by available slots API
    // Users can only select from available (non-conflicting) time slots

    if (!form.scheduledDate || !form.scheduledTime) {
      toast.error("Please select date and time");
      return;
    }

    if (!form.candidateName || !form.positionTitle) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setScheduling(true);

      const scheduledDateTime = formatScheduledDateTime(form.scheduledDate, form.scheduledTime);
      
      // Use ref as the source of truth to avoid stale closure issues
      const { isReschedule: isRescheduleMode, interview: interviewData } = interviewRef.current;
      
      console.log('📋 [HANDLE SCHEDULE] State check:', {
        isRescheduleFromState: isReschedule,
        isRescheduleFromRef: isRescheduleMode,
        hasOriginalInterviewState: !!originalInterview,
        hasOriginalInterviewRef: !!interviewData,
        originalInterviewIdState: originalInterview?.id,
        originalInterviewIdRef: interviewData?.id,
        jobApplyId: form.jobApplyId,
      });

      // Handle reschedule differently
      // Use ref values to avoid stale closure
      if (isRescheduleMode && interviewData) {
        console.log('🔄 [HANDLE SCHEDULE] Using RESCHEDULE flow for interview ID:', interviewData.id);
        
        // Try direct update first (PUT /api/interviews/{id})
        try {
          console.log('🔄 [HANDLE SCHEDULE] Attempting direct update (PUT)...');
          const updateRequest: UpdateInterviewRequest = {
            scheduledDate: scheduledDateTime,
            durationMinutes: form.durationMinutes,
            interviewType: form.interviewType as 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE' | 'ONLINE_ASSESSMENT',
            location: form.location || undefined,
            meetingLink: form.meetingLink || undefined,
            preparationNotes: form.notes || undefined,
            updateReason: 'Rescheduled by recruiter',
          };

          await updateInterview(interviewData.id, updateRequest);
          console.log('✅ [HANDLE SCHEDULE] Direct update succeeded');
        } catch (updateError: any) {
          console.log('⚠️ [HANDLE SCHEDULE] Direct update failed, trying reschedule request API...');
          console.log('⚠️ [HANDLE SCHEDULE] Error was:', updateError?.message);
          
          // Fallback to reschedule request API (POST /api/interviews/{id}/reschedule)
          // This API uses consent flow but with requiresConsent: false for recruiter
          await requestReschedule(interviewData.id, {
            newRequestedDate: scheduledDateTime,
            reason: form.notes || 'Rescheduled by recruiter',
            requestedBy: 'RECRUITER',
            requiresConsent: false,
          });
          console.log('✅ [HANDLE SCHEDULE] Reschedule request succeeded');
        }

        toast.success("Interview rescheduled successfully!", {
          description: `New time: ${form.scheduledDate} at ${formatTime(form.scheduledTime)}`,
        });
      } else {
        console.log('➕ [HANDLE SCHEDULE] Using CREATE (new schedule) flow');
        // Schedule new interview - createdByRecruiterId is extracted from JWT on backend
        await scheduleInterview(form.jobApplyId, {
          scheduledDate: scheduledDateTime,
          durationMinutes: form.durationMinutes,
          interviewType: form.interviewType as 'IN_PERSON' | 'VIDEO_CALL' | 'PHONE' | 'ONLINE_ASSESSMENT',
          createdByRecruiterId: 0, // Backend will extract from JWT, this is for type compatibility
          location: form.location || undefined,
          meetingLink: form.meetingLink || undefined,
          preparationNotes: form.notes || undefined,
        });

        toast.success("Interview scheduled successfully!", {
          description: `Scheduled for ${form.scheduledDate} at ${formatTime(form.scheduledTime)}`,
        });
      }

      // Redirect back to interviews page
      router.push("/recruiter/interviews");
    } catch (error: any) {
      console.error("Failed to schedule interview:", error);
      toast.error(error.message || "Failed to schedule interview");
    } finally {
      setScheduling(false);
    }
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + (direction === "next" ? 7 : -7));
    setCurrentWeekStart(newStart);
  };

  function formatTime(time: string): string {
    const [hours, minutes] = time.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  function getDayName(date: Date): string {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  }

  function isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function isPast(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentWeekStart);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {isReschedule ? "Reschedule Interview" : "Schedule Interview"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isReschedule 
                ? "Select a new date and time for this interview"
                : "Choose a date and time to schedule the interview"}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </div>

      {/* Current Interview Info - shown only when rescheduling */}
      {isReschedule && originalInterview && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
              <Clock className="h-5 w-5" />
              Current Interview Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-amber-700 block">Candidate</span>
                <span className="font-medium text-amber-900">{originalInterview.candidateName}</span>
              </div>
              <div>
                <span className="text-amber-700 block">Position</span>
                <span className="font-medium text-amber-900">{originalInterview.positionTitle}</span>
              </div>
              <div>
                <span className="text-amber-700 block">Current Date & Time</span>
                <span className="font-medium text-amber-900">
                  {new Date(originalInterview.scheduledDate || originalInterview.interviewDateTime || '').toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-amber-700 block">Duration</span>
                <span className="font-medium text-amber-900">{originalInterview.durationMinutes} minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Select Date & Time
              </CardTitle>
              <CardDescription>Choose an available date and time slot</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Week Navigator */}
              <div className="flex items-center justify-between mb-4">
                <Button variant="outline" size="sm" onClick={() => navigateWeek("prev")}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm font-medium">
                  {currentWeekStart.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                <Button variant="outline" size="sm" onClick={() => navigateWeek("next")}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Week Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDates.map((date, index) => {
                  const dateStr = formatDateForAPI(date);
                  const isSelected = selectedDate === dateStr;
                  const disabled = isPast(date);

                  return (
                    <button
                      key={index}
                      onClick={() => !disabled && handleDateSelect(date)}
                      disabled={disabled}
                      className={`
                        p-3 rounded-lg border text-center transition-colors
                        ${isSelected ? "bg-primary text-primary-foreground border-primary" : ""}
                        ${isToday(date) ? "ring-2 ring-primary/50" : ""}
                        ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent"}
                        ${!isSelected && !disabled ? "border-border" : ""}
                      `}
                    >
                      <div className="text-xs font-medium">{getDayName(date)}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                    </button>
                  );
                })}
              </div>

              {/* Available Time Slots */}
              {selectedDate && (
                <div>
                  <Label className="mb-3 block">Available Time Slots</Label>
                  {availableSlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No available slots for this date</p>
                      <p className="text-sm">Try another date or adjust duration</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => handleTimeSelect(slot)}
                          className={`
                            p-3 rounded-lg border text-sm font-medium transition-colors
                            ${
                              form.scheduledTime === slot
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border hover:bg-accent"
                            }
                          `}
                        >
                          {formatTime(slot)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Daily Calendar Info */}
              {dailyCalendar && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium mb-2">Selected Day Summary</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Working Hours:</span>
                      <div className="font-medium">
                        {dailyCalendar.isWorkingDay
                          ? `${formatTime(dailyCalendar.workStartTime || "")} - ${formatTime(
                              dailyCalendar.workEndTime || ""
                            )}`
                          : "Not a working day"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Scheduled Interviews:</span>
                      <div className="font-medium">{dailyCalendar.totalInterviews}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Available Slots:</span>
                      <div className="font-medium">{dailyCalendar.availableSlots}</div>
                    </div>
                    {dailyCalendar.hasTimeOff && (
                      <div className="col-span-2 text-amber-600">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Time-off: {dailyCalendar.timeOffReason}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Interview Details Form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
              <CardDescription>Fill in the interview information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Candidate Name */}
              <div>
                <Label htmlFor="candidateName">
                  Candidate Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="candidateName"
                    value={form.candidateName}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, candidateName: e.target.value }))
                    }
                    placeholder="Enter candidate name"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Position Title */}
              <div>
                <Label htmlFor="positionTitle">
                  Position <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="positionTitle"
                    value={form.positionTitle}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, positionTitle: e.target.value }))
                    }
                    placeholder="Enter position title"
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Interview Type */}
              <div>
                <Label htmlFor="interviewType">Interview Type</Label>
                <Select
                  value={form.interviewType}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, interviewType: value }))}
                >
                  <SelectTrigger id="interviewType" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERVIEW_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Select
                  value={form.durationMinutes.toString()}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, durationMinutes: parseInt(value) }))
                  }
                >
                  <SelectTrigger id="duration" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DURATIONS.map((duration) => (
                      <SelectItem key={duration.value} value={duration.value.toString()}>
                        {duration.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location - show only for IN_PERSON type */}
              {form.interviewType === "IN_PERSON" && (
                <div>
                  <Label htmlFor="location">Location</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={form.location}
                      onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter interview location"
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Meeting Link - show for VIDEO_CALL and PHONE types */}
              {(form.interviewType === "VIDEO_CALL" || form.interviewType === "PHONE" || form.interviewType === "ONLINE_ASSESSMENT") && (
                <div>
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <div className="relative mt-1">
                    <Video className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="meetingLink"
                      value={form.meetingLink}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, meetingLink: e.target.value }))
                      }
                      placeholder="https://meet.google.com/..."
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Schedule Button */}
              <Button
                onClick={() => setShowConfirmDialog(true)}
                disabled={scheduling || !form.scheduledTime}
                className="w-full"
                size="lg"
              >
                {scheduling ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isReschedule ? "Updating..." : "Scheduling..."}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {isReschedule ? "Update Interview" : "Schedule Interview"}
                  </>
                )}
              </Button>

              {form.scheduledDate && form.scheduledTime && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="font-medium text-green-900 mb-1">
                    {isReschedule ? "Ready to Update" : "Ready to Schedule"}
                  </div>
                  <div className="text-green-700">
                    {form.scheduledDate} at {formatTime(form.scheduledTime)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isReschedule ? "Confirm Interview Reschedule" : "Confirm Interview Schedule"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  {isReschedule 
                    ? "Are you sure you want to reschedule this interview? The candidate will be notified of the change."
                    : "Please confirm the interview details. The candidate will receive a notification about this interview."}
                </p>
                <div className="bg-muted p-3 rounded-lg space-y-2 text-sm">
                  <div><strong>Candidate:</strong> {form.candidateName}</div>
                  <div><strong>Position:</strong> {form.positionTitle}</div>
                  <div><strong>Date:</strong> {form.scheduledDate}</div>
                  <div><strong>Time:</strong> {form.scheduledTime ? formatTime(form.scheduledTime) : "Not selected"}</div>
                  <div><strong>Duration:</strong> {form.durationMinutes} minutes</div>
                  <div><strong>Type:</strong> {INTERVIEW_TYPES.find(t => t.value === form.interviewType)?.label || form.interviewType}</div>
                  {form.location && <div><strong>Location:</strong> {form.location}</div>}
                  {form.meetingLink && <div><strong>Meeting Link:</strong> {form.meetingLink}</div>}
                </div>
                <p className="text-amber-600 font-medium">
                  ⚠️ A notification will be sent to the candidate immediately after confirmation.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setShowConfirmDialog(false);
              handleSchedule();
            }}>
              {isReschedule ? "Confirm Reschedule" : "Confirm Schedule"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
