"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Clock, 
  Coffee, 
  Calendar as CalendarIcon,
  Save,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  getWorkingHours,
  setWorkingHoursBatch,
  stringToTimeObject,
  timeObjectToString,
  type RecruiterWorkingHoursRequest,
} from "@/lib/calendar-api";

interface WorkingHoursForm {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  enabled: boolean;
  startTime: string;
  endTime: string;
  lunchBreakStart?: string;
  lunchBreakEnd?: string;
  bufferMinutes: number;
  maxInterviewsPerDay: number;
}

const DAYS_OF_WEEK: Array<{ value: WorkingHoursForm['dayOfWeek']; label: string }> = [
  { value: 'MONDAY', label: "Monday" },
  { value: 'TUESDAY', label: "Tuesday" },
  { value: 'WEDNESDAY', label: "Wednesday" },
  { value: 'THURSDAY', label: "Thursday" },
  { value: 'FRIDAY', label: "Friday" },
  { value: 'SATURDAY', label: "Saturday" },
  { value: 'SUNDAY', label: "Sunday" }
];

export default function CalendarSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingHours, setWorkingHoursState] = useState<WorkingHoursForm[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      loadSettings();
    }
  }, [mounted]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('📅 [SETTINGS] Loading working hours');
      
      const hours = await getWorkingHours();
      console.log('✅ [SETTINGS] Loaded working hours:', hours);
      
      // Always create all 7 days in order, merging with backend data
      const formData: WorkingHoursForm[] = DAYS_OF_WEEK.map((day) => {
        const existingDay = hours?.find(h => h.dayOfWeek === day.value);
        
        if (existingDay) {
          // Use backend data
          return {
            dayOfWeek: existingDay.dayOfWeek as WorkingHoursForm['dayOfWeek'],
            enabled: existingDay.isWorkingDay,
            startTime: existingDay.startTime ? timeObjectToString(existingDay.startTime) : '09:00',
            endTime: existingDay.endTime ? timeObjectToString(existingDay.endTime) : '17:00',
            lunchBreakStart: existingDay.lunchBreakStart ? timeObjectToString(existingDay.lunchBreakStart) : '',
            lunchBreakEnd: existingDay.lunchBreakEnd ? timeObjectToString(existingDay.lunchBreakEnd) : '',
            bufferMinutes: existingDay.bufferMinutesBetweenInterviews || 15,
            maxInterviewsPerDay: existingDay.maxInterviewsPerDay || 8,
          };
        } else {
          // Use defaults for missing days
          return {
            dayOfWeek: day.value,
            enabled: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.value),
            startTime: '09:00',
            endTime: '17:00',
            lunchBreakStart: '12:00',
            lunchBreakEnd: '13:00',
            bufferMinutes: 15,
            maxInterviewsPerDay: 8,
          };
        }
      });
      
      setWorkingHoursState(formData);
    } catch (error: any) {
      console.error('❌ [SETTINGS] Error loading settings:', error);
      toast.error(error.message || 'Failed to load settings');
      
      // Initialize with defaults on error
      const defaultHours: WorkingHoursForm[] = DAYS_OF_WEEK.map((day) => ({
        dayOfWeek: day.value,
        enabled: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].includes(day.value),
        startTime: '09:00',
        endTime: '17:00',
        lunchBreakStart: '12:00',
        lunchBreakEnd: '13:00',
        bufferMinutes: 15,
        maxInterviewsPerDay: 8,
      }));
      setWorkingHoursState(defaultHours);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkingHours = async () => {
    try {
      setSaving(true);
      console.log('💾 [SETTINGS] Saving working hours:', workingHours);

      const requests: RecruiterWorkingHoursRequest[] = workingHours.map((h) => ({
        dayOfWeek: h.dayOfWeek, // Already in correct format (MONDAY, TUESDAY, etc.)
        isWorkingDay: h.enabled,
        startTime: h.enabled ? stringToTimeObject(h.startTime) : undefined,
        endTime: h.enabled ? stringToTimeObject(h.endTime) : undefined,
        lunchBreakStart: h.enabled && h.lunchBreakStart ? stringToTimeObject(h.lunchBreakStart) : undefined,
        lunchBreakEnd: h.enabled && h.lunchBreakEnd ? stringToTimeObject(h.lunchBreakEnd) : undefined,
        bufferMinutesBetweenInterviews: h.bufferMinutes,
        maxInterviewsPerDay: h.maxInterviewsPerDay,
      }));

      console.log('📤 [SETTINGS] Sending batch request:', requests);
      console.log('📤 [SETTINGS] First request sample:', JSON.stringify(requests[0], null, 2));
      await setWorkingHoursBatch(requests);
      
      toast.success('Working hours saved successfully!');
      
      // Redirect to calendar page after saving
      router.push('/recruiter/calendar');
    } catch (error: any) {
      console.error('❌ [SETTINGS] Error saving working hours:', error);
      toast.error(error.message || 'Failed to save working hours');
    } finally {
      setSaving(false);
    }
  };

  const updateWorkingHours = (dayIndex: number, field: keyof WorkingHoursForm, value: any) => {
    setWorkingHoursState((prev) => {
      const updated = [...prev];
      updated[dayIndex] = { ...updated[dayIndex], [field]: value };
      return updated;
    });
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-3xl font-bold">Calendar Settings</h1>
            </div>
            <p className="text-muted-foreground">
              Configure your working hours and availability for interviews
            </p>
          </div>
        </div>
      </div>

      {/* Working Hours Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Working Hours
          </CardTitle>
          <CardDescription>
            Set your availability for each day of the week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {workingHours.map((day, index) => {
            const dayInfo = DAYS_OF_WEEK.find((d) => d.value === day.dayOfWeek);
            
            return (
              <div key={day.dayOfWeek} className="border rounded-lg p-4 space-y-4">
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">{dayInfo?.label}</h3>
                  </div>
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={(checked) =>
                      updateWorkingHours(index, 'enabled', checked)
                    }
                  />
                </div>

                {/* Always show fields, but disable when day is not enabled */}
                <div className={`space-y-4 pl-8 transition-opacity ${!day.enabled ? 'opacity-40' : ''}`}>
                  {/* Working Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`${day.dayOfWeek}-start`}>Start Time</Label>
                      <Input
                        id={`${day.dayOfWeek}-start`}
                        type="time"
                        value={day.startTime}
                        onChange={(e) =>
                          updateWorkingHours(index, 'startTime', e.target.value)
                        }
                        disabled={!day.enabled}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`${day.dayOfWeek}-end`}>End Time</Label>
                      <Input
                        id={`${day.dayOfWeek}-end`}
                        type="time"
                        value={day.endTime}
                        onChange={(e) =>
                          updateWorkingHours(index, 'endTime', e.target.value)
                        }
                        disabled={!day.enabled}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {/* Lunch Break */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Coffee className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Lunch Break (Optional)</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${day.dayOfWeek}-lunch-start`} className="text-xs">
                          Start
                        </Label>
                        <Input
                          id={`${day.dayOfWeek}-lunch-start`}
                          type="time"
                          value={day.lunchBreakStart || ''}
                          onChange={(e) =>
                            updateWorkingHours(index, 'lunchBreakStart', e.target.value)
                          }
                          disabled={!day.enabled}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${day.dayOfWeek}-lunch-end`} className="text-xs">
                          End
                        </Label>
                        <Input
                          id={`${day.dayOfWeek}-lunch-end`}
                          type="time"
                          value={day.lunchBreakEnd || ''}
                          onChange={(e) =>
                            updateWorkingHours(index, 'lunchBreakEnd', e.target.value)
                          }
                          disabled={!day.enabled}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${day.dayOfWeek}-buffer`}>
                          Buffer Between Interviews (minutes)
                        </Label>
                        <Input
                          id={`${day.dayOfWeek}-buffer`}
                          type="number"
                          min="0"
                          max="60"
                          value={day.bufferMinutes}
                          onChange={(e) =>
                            updateWorkingHours(
                              index,
                              'bufferMinutes',
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={!day.enabled}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${day.dayOfWeek}-max`}>
                          Max Interviews Per Day
                        </Label>
                        <Input
                          id={`${day.dayOfWeek}-max`}
                          type="number"
                          min="1"
                          max="20"
                          value={day.maxInterviewsPerDay}
                          onChange={(e) =>
                            updateWorkingHours(
                              index,
                              'maxInterviewsPerDay',
                              parseInt(e.target.value) || 1
                            )
                          }
                          disabled={!day.enabled}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Working Hours Configuration
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Your working hours determine when interviews can be scheduled. Buffer time ensures you have breaks between interviews.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveWorkingHours} disabled={saving} size="lg">
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Working Hours
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
