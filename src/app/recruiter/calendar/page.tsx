"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";;
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Settings,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  getDailyCalendar,
  getWeeklyCalendar,
  getMonthlyCalendar,
  getWorkingHours,
  type DailyCalendarResponse,
  type WeeklyCalendarResponse,
  type MonthlyCalendarResponse,
  type RecruiterWorkingHoursResponse,
} from "@/lib/calendar-api";
import {
  type InterviewScheduleResponse,
} from "@/lib/interview-api";

// ==================== Helper Functions for Gray-Out ====================

interface TimeSlotConfig {
  dayOfWeek: string;
  isWorkingDay: boolean;
  workStart: number;      // Minutes since midnight
  workEnd: number;        // Minutes since midnight
  lunchStart: number | null;
  lunchEnd: number | null;
}

enum TimeSlotStatus {
  AVAILABLE = 'available',
  LUNCH_BREAK = 'lunch',
  NON_WORKING = 'non-working',
  NON_WORKING_DAY = 'off-day'
}

/**
 * Converts "HH:MM:SS" string to minutes since midnight
 */
function timeStringToMinutes(timeString: string | undefined): number {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converts TimeObject to minutes since midnight
 */
function timeObjectToMinutes(timeObj: any): number {
  if (!timeObj) return 0;
  if (typeof timeObj === 'string') return timeStringToMinutes(timeObj);
  return (timeObj.hour || 0) * 60 + (timeObj.minute || 0);
}

/**
 * Gets day name from Date object
 */
function getDayOfWeek(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[date.getDay()];
}

/**
 * Builds working hours map for quick lookups
 */
function buildWorkingHoursMap(
  workingHours: RecruiterWorkingHoursResponse[]
): Map<string, TimeSlotConfig> {
  const map = new Map<string, TimeSlotConfig>();
  
  workingHours.forEach(wh => {
    map.set(wh.dayOfWeek, {
      dayOfWeek: wh.dayOfWeek,
      isWorkingDay: wh.isWorkingDay,
      workStart: timeObjectToMinutes(wh.startTime),
      workEnd: timeObjectToMinutes(wh.endTime),
      lunchStart: wh.lunchBreakStart ? timeObjectToMinutes(wh.lunchBreakStart) : null,
      lunchEnd: wh.lunchBreakEnd ? timeObjectToMinutes(wh.lunchBreakEnd) : null,
    });
  });
  
  return map;
}

/**
 * Determines the status of a specific time slot
 */
function getTimeSlotStatus(
  date: Date,
  hour: number,
  workingHoursMap: Map<string, TimeSlotConfig>
): TimeSlotStatus {
  const dayOfWeek = getDayOfWeek(date);
  const config = workingHoursMap.get(dayOfWeek);
  const timeInMinutes = hour * 60;
  
  // No configuration or non-working day
  if (!config || !config.isWorkingDay) {
    return TimeSlotStatus.NON_WORKING_DAY;
  }
  
  // Before work hours
  if (timeInMinutes < config.workStart) {
    return TimeSlotStatus.NON_WORKING;
  }
  
  // After work hours
  if (timeInMinutes >= config.workEnd) {
    return TimeSlotStatus.NON_WORKING;
  }
  
  // During lunch break
  if (config.lunchStart !== null && config.lunchEnd !== null) {
    if (timeInMinutes >= config.lunchStart && timeInMinutes < config.lunchEnd) {
      return TimeSlotStatus.LUNCH_BREAK;
    }
  }
  
  // Available
  return TimeSlotStatus.AVAILABLE;
}

/**
 * Gets CSS classes for time slot status
 */
function getTimeSlotClasses(status: TimeSlotStatus, isPast: boolean): string {
  const baseClasses = 'border-r border-b border-gray-200 p-2 transition-colors min-h-[60px]';
  
  if (isPast) {
    return `${baseClasses} bg-gray-100 cursor-not-allowed opacity-60`;
  }
  
  switch (status) {
    case TimeSlotStatus.AVAILABLE:
      return `${baseClasses} hover:bg-blue-50 cursor-pointer`;
    case TimeSlotStatus.LUNCH_BREAK:
      return `${baseClasses} bg-orange-50 cursor-not-allowed opacity-70`;
    case TimeSlotStatus.NON_WORKING:
    case TimeSlotStatus.NON_WORKING_DAY:
      return `${baseClasses} bg-gray-100 cursor-not-allowed opacity-50`;
    default:
      return baseClasses;
  }
}

export default function RecruiterCalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dailyCalendar, setDailyCalendar] = useState<DailyCalendarResponse | null>(null);
  const [weeklyCalendar, setWeeklyCalendar] = useState<WeeklyCalendarResponse | null>(null);
  const [monthlyCalendar, setMonthlyCalendar] = useState<MonthlyCalendarResponse | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, viewMode]);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const dateStr = formatDateForAPI(currentDate);

      if (viewMode === "day") {
        // Direct daily API call
        console.log(`📅 [DAY VIEW] Loading daily calendar for: ${dateStr}`);
        const data = await getDailyCalendar(dateStr);
        console.log(`📅 [DAY VIEW] Received data:`, data);
        setDailyCalendar(data);
      } else if (viewMode === "week") {
        // Weekly calendar needs week start date (Monday)
        const weekStart = getWeekStart(currentDate);
        const weekStartStr = formatDateForAPI(weekStart);
        const data = await getWeeklyCalendar(weekStartStr);
        setWeeklyCalendar(data);
      } else {
        // Monthly calendar needs year and month separately
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // 1-indexed
        console.log(`📅 [MONTH VIEW] Loading monthly calendar for: ${year}-${month}`);
        const data = await getMonthlyCalendar(year, month);
        console.log(`📅 [MONTH VIEW] Received data:`, data);
        setMonthlyCalendar(data);
      }
    } catch (error) {
      console.error("Failed to load calendar:", error);
      // Don't show error toast - just show empty state
    } finally {
      setLoading(false);
    }
  };

  const formatDateForAPI = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  const navigateDate = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (viewMode === "day") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
      } else if (viewMode === "week") {
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
      } else {
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDateDisplay = (): string => {
    if (viewMode === "month") {
      return currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const start = getWeekStart(currentDate);
      const end = getWeekEnd(currentDate);
      return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    }
    return currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  };

  const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    // Start from Monday (day 1), not Sunday (day 0)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  };

  const getWeekEnd = (date: Date): Date => {
    const start = getWeekStart(date);
    return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interview Calendar</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your interview schedule</p>
      </div>

      {/* Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateDate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigateDate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold ml-3">{formatDateDisplay()}</span>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button size="sm" variant="outline" onClick={() => router.push("/recruiter/calendar/settings")}>
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Calendar Views */}
      {viewMode === "month" && <MonthView currentDate={currentDate} monthlyCalendar={monthlyCalendar} setCurrentDate={setCurrentDate} setViewMode={setViewMode} />}
      {viewMode === "week" && <WeekView currentDate={currentDate} weeklyCalendar={weeklyCalendar} />}
      {viewMode === "day" && <DayView currentDate={currentDate} dailyCalendar={dailyCalendar} />}
    </div>
  );
}

// Month View Component
function MonthView({ currentDate, monthlyCalendar, setCurrentDate, setViewMode }: any) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells = [];

  // Previous month padding
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="bg-gray-50 border border-gray-200"></div>);
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    cellDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    const isPast = cellDate < today;
    const isToday = cellDate.toDateString() === today.toDateString();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    // Don't show interview count for past days
    const interviews = isPast ? 0 : (monthlyCalendar?.interviewCountByDate?.[dateStr] || 0);

    cells.push(
      <div
        key={day}
        className={`border border-gray-200 p-2 min-h-[100px] cursor-pointer hover:bg-blue-50 transition-colors ${
          isPast ? "bg-gray-50 text-gray-400 cursor-not-allowed" : "bg-white"
        } ${isToday ? "ring-2 ring-inset ring-blue-500 z-10 relative" : ""}`}
        onClick={() => {
          if (!isPast) {
            // Create date string directly to avoid timezone issues
            const targetDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            console.log(`📅 [MONTH CLICK] Day ${day} clicked, target date: ${targetDateStr}`);
            // Parse as local date
            const targetDate = new Date(year, month, day, 12, 0, 0);
            console.log(`📅 [MONTH CLICK] Created date object: ${targetDate.toISOString()}, local: ${targetDate.toLocaleDateString()}`);
            setCurrentDate(targetDate);
            setViewMode("day");
          }
        }}
      >
        <div className="text-right text-sm font-semibold mb-1">{day}</div>
        {interviews > 0 && !isPast && (
          <div className="space-y-1">
            {[...Array(Math.min(interviews, 2))].map((_, i) => (
              <div key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded truncate">
                Interview
              </div>
            ))}
            {interviews > 2 && (
              <div className="text-xs text-gray-500 px-2">+{interviews - 2} more</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {/* Day headers */}
      <div className="grid grid-cols-7 bg-gray-50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {cells}
      </div>
    </div>
  );
}

// Week View Component with accurate time positioning
function WeekView({ currentDate, weeklyCalendar }: any) {
  const [workingHoursMap, setWorkingHoursMap] = useState<Map<string, TimeSlotConfig>>(new Map());
  const [workingHoursLoaded, setWorkingHoursLoaded] = useState(false);

  useEffect(() => {
    if (!workingHoursLoaded) {
      const loadWorkingHours = async () => {
        try {
          const hours = await getWorkingHours();
          const map = buildWorkingHoursMap(hours);
          setWorkingHoursMap(map);
          setWorkingHoursLoaded(true);
        } catch (error) {
          console.error('Failed to load working hours:', error);
        }
      };
      loadWorkingHours();
    }
  }, [workingHoursLoaded]);

  const getWeekDays = () => {
    const start = new Date(currentDate);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(12, 0, 0, 0);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  };

  // Get all interviews for a specific day
  const getInterviewsForDay = (date: Date) => {
    // Don't show interviews for past days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      return [];
    }

    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let interviews: any[] = [];
    
    if (weeklyCalendar?.allInterviews && weeklyCalendar.allInterviews.length > 0) {
      interviews = weeklyCalendar.allInterviews.filter((interview: any) => {
        const dateTimeStr = interview.scheduledDate || interview.interviewDateTime || interview.startTime;
        if (!dateTimeStr) return false;
        const interviewDate = new Date(dateTimeStr);
        if (isNaN(interviewDate.getTime())) return false;
        const interviewDateStr = `${interviewDate.getFullYear()}-${String(interviewDate.getMonth() + 1).padStart(2, '0')}-${String(interviewDate.getDate()).padStart(2, '0')}`;
        return interviewDateStr === dateStr;
      });
    }
    
    if (interviews.length === 0 && weeklyCalendar?.dailyCalendars?.[dateStr]?.interviews) {
      interviews = weeklyCalendar.dailyCalendars[dateStr].interviews;
    }
    
    return interviews;
  };

  // Calculate position and height for an interview card
  const getInterviewStyle = (interview: any, startHour: number) => {
    const dateTimeStr = interview.scheduledDate || interview.interviewDateTime;
    const interviewDate = new Date(dateTimeStr);
    const hours = interviewDate.getHours();
    const minutes = interviewDate.getMinutes();
    const duration = interview.durationMinutes || 60;
    
    // Calculate top position (relative to grid start at startHour)
    const minutesFromStart = (hours - startHour) * 60 + minutes;
    const top = (minutesFromStart / 60) * 60; // 60px per hour
    
    // Calculate height based on duration
    const height = Math.max((duration / 60) * 60, 24); // min 24px height
    
    return { top, height };
  };

  // Format time range string
  const formatTimeRange = (interview: any) => {
    const dateTimeStr = interview.scheduledDate || interview.interviewDateTime;
    const start = new Date(dateTimeStr);
    const duration = interview.durationMinutes || 60;
    const end = new Date(start.getTime() + duration * 60000);
    
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const weekDays = getWeekDays();
  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
  const startHour = 7;
  const now = new Date();

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
      <div className="grid grid-cols-[80px_repeat(7,1fr)] min-w-[900px]">
        {/* Top left corner + day headers */}
        <div className="bg-gray-50 border-b border-r border-gray-200"></div>
        {weekDays.map((date, i) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={i}
              className={`border-b border-r border-gray-200 p-3 text-center bg-gray-50 ${isToday ? "bg-blue-50" : ""}`}
            >
              <div className="text-xs text-gray-600 uppercase">{date.toLocaleDateString("en-US", { weekday: "short" })}</div>
              <div className="text-lg font-semibold mt-1">{date.getDate()}</div>
            </div>
          );
        })}

        {/* Time grid with positioned interviews */}
        <div className="col-span-8 grid grid-cols-[80px_repeat(7,1fr)]">
          {/* Hour labels column */}
          <div className="bg-gray-50">
            {hours.map((hour) => (
              <div key={hour} className="h-[60px] border-r border-b border-gray-200 p-2 text-xs text-gray-500 text-right">
                {hour === 12 ? "12pm" : hour > 12 ? `${hour - 12}pm` : `${hour}am`}
              </div>
            ))}
          </div>
          
          {/* Day columns with positioned interviews */}
          {weekDays.map((date, dayIndex) => {
            const dayInterviews = getInterviewsForDay(date);
            const isPastDay = date < new Date(new Date().setHours(0, 0, 0, 0));
            
            return (
              <div key={dayIndex} className="relative">
                {/* Hour grid cells */}
                {hours.map((hour) => {
                  const isPast = isPastDay || (date.toDateString() === now.toDateString() && hour < now.getHours());
                  const status = getTimeSlotStatus(date, hour, workingHoursMap);
                  
                  return (
                    <div
                      key={hour}
                      className={`h-[60px] border-r border-b border-gray-200 ${
                        isPast || status === TimeSlotStatus.NON_WORKING || status === TimeSlotStatus.NON_WORKING_DAY ? 'bg-gray-100' :
                        status === TimeSlotStatus.LUNCH_BREAK ? 'bg-orange-50' :
                        'bg-white hover:bg-blue-50'
                      }`}
                    >
                      {status === TimeSlotStatus.LUNCH_BREAK && !isPast && (
                        <span className="text-xs text-orange-600 p-1">🍽️</span>
                      )}
                    </div>
                  );
                })}
                
                {/* Positioned interview cards */}
                {dayInterviews.map((interview: any, idx: number) => {
                  const { top, height } = getInterviewStyle(interview, startHour);
                  
                  // Skip if interview is outside visible hours
                  if (top < 0 || top > hours.length * 60) return null;
                  
                  return (
                    <div
                      key={interview.id || idx}
                      className="absolute left-1 right-1 bg-blue-100 border-l-4 border-blue-500 text-blue-800 text-xs p-1 rounded overflow-hidden cursor-pointer hover:bg-blue-200 hover:shadow-md transition-all z-10"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        minHeight: '24px',
                      }}
                      title={`${interview.candidateName || 'Interview'}\n${formatTimeRange(interview)}\n${interview.interviewType || ''}`}
                    >
                      <div className="font-medium truncate">{interview.candidateName || 'Interview'}</div>
                      {height >= 40 && (
                        <div className="text-blue-600 text-[10px] truncate">
                          {formatTimeRange(interview)}
                        </div>
                      )}
                      {height >= 55 && interview.interviewType && (
                        <div className="text-[10px] text-blue-500 truncate">{interview.interviewType}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Day View Component with accurate time positioning
function DayView({ currentDate, dailyCalendar }: any) {
  const [workingHoursMap, setWorkingHoursMap] = useState<Map<string, TimeSlotConfig>>(new Map());
  const [workingHoursLoaded, setWorkingHoursLoaded] = useState(false);

  useEffect(() => {
    if (!workingHoursLoaded) {
      const loadWorkingHours = async () => {
        try {
          const hours = await getWorkingHours();
          const map = buildWorkingHoursMap(hours);
          setWorkingHoursMap(map);
          setWorkingHoursLoaded(true);
        } catch (error) {
          console.error('Failed to load working hours:', error);
        }
      };
      loadWorkingHours();
    }
  }, [workingHoursLoaded]);

  // Calculate position and height for an interview card
  const getInterviewStyle = (interview: any, startHour: number) => {
    const dateTimeStr = interview.scheduledDate || interview.interviewDateTime;
    const interviewDate = new Date(dateTimeStr);
    const hours = interviewDate.getHours();
    const minutes = interviewDate.getMinutes();
    const duration = interview.durationMinutes || 60;
    
    // Calculate top position (relative to grid start at startHour)
    // 70px per hour in day view
    const minutesFromStart = (hours - startHour) * 60 + minutes;
    const top = (minutesFromStart / 60) * 70;
    
    // Calculate height based on duration
    const height = Math.max((duration / 60) * 70, 30); // min 30px height
    
    return { top, height };
  };

  // Format time range string
  const formatTimeRange = (interview: any) => {
    const dateTimeStr = interview.scheduledDate || interview.interviewDateTime;
    const start = new Date(dateTimeStr);
    const duration = interview.durationMinutes || 60;
    const end = new Date(start.getTime() + duration * 60000);
    
    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7am to 8pm
  const startHour = 7;
  const now = new Date();
  // Don't show interviews for past days
  const isPastDay = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
  const interviews = isPastDay ? [] : (dailyCalendar?.interviews || []);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-auto">
      <div className="min-w-[600px]">
        {/* Day header */}
        <div className="border-b p-3 bg-gray-50">
          <div className="text-center">
            <div className="text-sm text-gray-600">{currentDate.toLocaleDateString("en-US", { weekday: "long" })}</div>
            <div className="text-xl font-semibold mt-1">{currentDate.getDate()}</div>
          </div>
        </div>

        {/* Time grid with positioned interviews */}
        <div className="grid grid-cols-[80px_1fr]">
          {/* Hour labels column */}
          <div className="bg-gray-50">
            {hours.map((hour) => (
              <div key={hour} className="h-[70px] border-r border-b border-gray-200 p-2 text-sm text-gray-500 text-right">
                {hour === 12 ? "12:00 pm" : hour > 12 ? `${hour - 12}:00 pm` : `${hour}:00 am`}
              </div>
            ))}
          </div>
          
          {/* Main content area with positioned interviews */}
          <div className="relative">
            {/* Hour grid cells */}
            {hours.map((hour) => {
              const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0)) || 
                            (currentDate.toDateString() === now.toDateString() && hour < now.getHours());
              const status = getTimeSlotStatus(currentDate, hour, workingHoursMap);
              
              return (
                <div
                  key={hour}
                  className={`h-[70px] border-b border-gray-200 ${
                    isPast || status === TimeSlotStatus.NON_WORKING || status === TimeSlotStatus.NON_WORKING_DAY ? 'bg-gray-100' :
                    status === TimeSlotStatus.LUNCH_BREAK ? 'bg-orange-50' :
                    'bg-white hover:bg-blue-50'
                  }`}
                >
                  {status === TimeSlotStatus.LUNCH_BREAK && !isPast && (
                    <div className="flex items-center gap-2 text-orange-600 p-2">
                      <span className="text-sm">🍽️</span>
                      <span className="text-xs">Lunch Break</span>
                    </div>
                  )}
                  {status === TimeSlotStatus.NON_WORKING_DAY && !isPast && (
                    <div className="text-xs text-gray-400 p-2">Day off</div>
                  )}
                </div>
              );
            })}
            
            {/* Positioned interview cards */}
            {interviews.map((interview: any, idx: number) => {
              const { top, height } = getInterviewStyle(interview, startHour);
              
              // Skip if interview is outside visible hours
              if (top < 0 || top > hours.length * 70) return null;
              
              return (
                <div
                  key={interview.id || idx}
                  className="absolute left-2 right-2 bg-blue-100 border-l-4 border-blue-500 text-blue-800 p-2 rounded overflow-hidden cursor-pointer hover:bg-blue-200 hover:shadow-md transition-all z-10"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    minHeight: '30px',
                  }}
                  title={`${interview.candidateName || 'Interview'}\n${formatTimeRange(interview)}\n${interview.interviewType || ''}`}
                >
                  <div className="font-medium truncate">{interview.candidateName || 'Interview'}</div>
                  <div className="text-sm text-blue-600 mt-0.5">
                    {formatTimeRange(interview)}
                  </div>
                  {height >= 70 && interview.positionTitle && (
                    <div className="text-xs text-blue-500 mt-1 truncate">{interview.positionTitle}</div>
                  )}
                  {height >= 90 && interview.interviewType && (
                    <div className="text-xs bg-blue-200 px-2 py-0.5 rounded inline-block mt-1">
                      {interview.interviewType}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
