import { memo } from "react";
import {
  Calendar,
  Clock,
  RefreshCw,
  Building2,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InterviewScheduleResponse } from "@/lib/interview-api";
import {
  getInterviewTypeText,
  formatInterviewDateTime,
  getInterviewDateTimeStr
} from "@/lib/interview-api";

interface PastInterviewsTabProps {
  interviews: InterviewScheduleResponse[];
  getStatusBadge: (status: string) => React.ReactElement;
  getResultBadge: (result?: string) => React.ReactElement | null;
  getTypeIcon: (type: string) => React.ReactElement;
}

const PastInterviewCard = memo(({ 
  interview,
  getStatusBadge,
  getResultBadge,
  getTypeIcon
}: { 
  interview: InterviewScheduleResponse;
  getStatusBadge: (status: string) => React.ReactElement;
  getResultBadge: (result?: string) => React.ReactElement | null;
  getTypeIcon: (type: string) => React.ReactElement;
}) => (
  <Card>
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
            </div>
            <div className="flex items-center gap-2">
              {getTypeIcon(interview.interviewType)}
              <span className="text-sm font-medium">
                {getInterviewTypeText(interview.interviewType)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {getStatusBadge(interview.status)}
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
));

PastInterviewCard.displayName = "PastInterviewCard";

const PastInterviewsTab = memo(({ 
  interviews,
  getStatusBadge,
  getResultBadge,
  getTypeIcon
}: PastInterviewsTabProps) => {
  if (interviews.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No Past Interviews</h3>
          <p className="text-muted-foreground">
            Your completed interviews will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.map((interview) => (
        <PastInterviewCard
          key={interview.id}
          interview={interview}
          getStatusBadge={getStatusBadge}
          getResultBadge={getResultBadge}
          getTypeIcon={getTypeIcon}
        />
      ))}
    </div>
  );
});

PastInterviewsTab.displayName = "PastInterviewsTab";

export default PastInterviewsTab;
