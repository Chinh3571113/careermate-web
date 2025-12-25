import { memo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Phone,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
  Building2,
  Globe,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { InterviewScheduleResponse } from "@/lib/interview-api";
import {
  getInterviewTypeText,
  formatInterviewDateTime,
  getInterviewDateTimeStr,
  isToday,
  isUpcoming
} from "@/lib/interview-api";

interface UpcomingInterviewsTabProps {
  interviews: InterviewScheduleResponse[];
  onConfirmClick: (interview: InterviewScheduleResponse) => void;
  getStatusBadge: (status: string) => React.ReactElement;
  getTypeIcon: (type: string) => React.ReactElement;
}

const InterviewCard = memo(({ 
  interview, 
  onConfirmClick, 
  getStatusBadge, 
  getTypeIcon 
}: {
  interview: InterviewScheduleResponse;
  onConfirmClick: (interview: InterviewScheduleResponse) => void;
  getStatusBadge: (status: string) => React.ReactElement;
  getTypeIcon: (type: string) => React.ReactElement;
}) => (
  <Card 
    className={`${isToday(interview) ? "border-primary" : ""} ${
      interview.status === "SCHEDULED" ? "border-l-4 border-l-yellow-500" : ""
    }`}
  >
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
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
            <CardTitle className="text-lg">
              {interview.jobTitle || interview.positionTitle || "Interview"}
            </CardTitle>
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
            <div className="flex items-center gap-2">
              {getTypeIcon(interview.interviewType)}
              <span className="text-sm font-medium">
                {getInterviewTypeText(interview.interviewType)}
              </span>
              {isToday(interview) && (
                <Badge variant="destructive">Today!</Badge>
              )}
              {isUpcoming(interview) && !isToday(interview) && (
                <Badge variant="outline">Soon</Badge>
              )}
              {interview.hasConflict && (
                <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Conflict
                </Badge>
              )}
            </div>
          </div>
        </div>
        {getStatusBadge(interview.status)}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
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
              href={interview.meetingLink.startsWith('http://') || interview.meetingLink.startsWith('https://') 
                ? interview.meetingLink 
                : `https://${interview.meetingLink}`
              } 
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
        {interview.status === "SCHEDULED" && (
          <Button
            size="sm"
            onClick={() => onConfirmClick(interview)}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Confirm Attendance
          </Button>
        )}
      </div>
        
      {(interview.interviewerEmail || interview.interviewerPhone) && interview.status !== "COMPLETED" && (
        <div className="p-3 bg-muted rounded-md mt-2">
          <p className="text-xs text-muted-foreground font-medium">Need to reschedule? Contact the interviewer.</p>
        </div>
      )}
    </CardContent>
  </Card>
));

InterviewCard.displayName = "InterviewCard";

const UpcomingInterviewsTab = memo(({ 
  interviews, 
  onConfirmClick,
  getStatusBadge,
  getTypeIcon
}: UpcomingInterviewsTabProps) => {
  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Upcoming Interviews</h3>
          <p className="text-muted-foreground">
            You don't have any scheduled interviews at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <InterviewCard
          key={interview.id}
          interview={interview}
          onConfirmClick={onConfirmClick}
          getStatusBadge={getStatusBadge}
          getTypeIcon={getTypeIcon}
        />
      ))}
    </div>
  );
});

UpcomingInterviewsTab.displayName = "UpcomingInterviewsTab";

export default UpcomingInterviewsTab;
