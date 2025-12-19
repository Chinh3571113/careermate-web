"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Star, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  AlertCircle,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Briefcase,
  Calendar,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuthStore } from "@/store/use-auth-store";
import {
  checkReviewEligibility,
  submitReview,
  getReviewTypeText,
  normalizeReviewType,
  type SubmitReviewRequest,
  type ReviewEligibilityResponse,
  type ReviewType,
  type NormalizedReviewType
} from "@/lib/review-api";

const RATING_CATEGORIES = [
  { key: "workEnvironment", label: "Work Environment" },
  { key: "management", label: "Management" },
  { key: "compensation", label: "Compensation & Benefits" },
  { key: "careerGrowth", label: "Career Growth" },
  { key: "workLifeBalance", label: "Work-Life Balance" }
];

export default function SubmitReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobApplyId = searchParams.get("jobApplyId");
  const authCandidateId = useAuthStore((s) => s.candidateId);
  const authUserId = useAuthStore((s) => s.user?.id);

  const effectiveCandidateId =
    typeof authCandidateId === "number"
      ? authCandidateId
      : typeof authUserId === "number"
        ? authUserId
        : typeof authUserId === "string"
          ? Number.parseInt(authUserId, 10)
          : null;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [eligibility, setEligibility] = useState<ReviewEligibilityResponse | null>(null);
  const [eligibleTypes, setEligibleTypes] = useState<NormalizedReviewType[]>([]);
  
  // Form state
  const [form, setForm] = useState<Partial<SubmitReviewRequest>>({
    jobApplyId: jobApplyId ? parseInt(jobApplyId) : undefined,
    reviewType: undefined,
    overallRating: 3,
    reviewTitle: "",
    reviewText: "",
    categoryRatings: {
      workEnvironment: 3,
      management: 3,
      compensation: 3,
      careerGrowth: 3,
      workLifeBalance: 3
    },
    pros: "",
    cons: "",
    wouldRecommend: true,
    isAnonymous: false
  });

  useEffect(() => {
    // Wait until we can resolve candidateId from auth state
    if (effectiveCandidateId) {
      checkEligibility();
    }
  }, [effectiveCandidateId]);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      if (!effectiveCandidateId) {
        toast.error("Candidate ID not found. Please sign in again.");
        router.push("/");
        return;
      }

      if (!jobApplyId) {
        toast.error("Job application ID is required");
        router.push("/candidate/my-jobs");
        return;
      }

      const data = await checkReviewEligibility(effectiveCandidateId, parseInt(jobApplyId));
      
      // Get eligible types (handle multiple field names)
      const rawEligibleTypes: ReviewType[] = (data.eligibleReviewTypes || data.reviewTypes || data.allowedReviewTypes || []) as any;
      const normalizedEligibleTypes = rawEligibleTypes.map((t) => normalizeReviewType(t as ReviewType));

      if (normalizedEligibleTypes.length === 0) {
        toast.error("You are not eligible to submit a review for this application");
        router.push("/candidate/my-jobs");
        return;
      }

      setEligibility({ ...data, eligibleReviewTypes: rawEligibleTypes });
      setEligibleTypes(normalizedEligibleTypes);
      
      // Auto-select review type if only one is available
      if (normalizedEligibleTypes.length === 1) {
        setForm(prev => ({ ...prev, reviewType: normalizedEligibleTypes[0] }));
      }
    } catch (error: any) {
      console.error("Failed to check eligibility:", error);
      toast.error(error.response?.data?.message || "Failed to check eligibility");
      router.push("/candidate/my-jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.reviewType) {
      toast.error("Please select a review type");
      return;
    }

    if (!form.reviewTitle?.trim()) {
      toast.error("Please provide a review title");
      return;
    }

    if (!form.reviewText?.trim()) {
      toast.error("Please write your review");
      return;
    }

    if (!form.pros?.trim()) {
      toast.error("Please provide at least one pro");
      return;
    }

    if (!form.cons?.trim()) {
      toast.error("Please provide at least one con");
      return;
    }

    try {
      setSubmitting(true);
      if (!effectiveCandidateId) {
        toast.error("Candidate ID not found. Please sign in again.");
        return;
      }

      if (!form.reviewType) {
        toast.error("Please select a review type");
        return;
      }

      await submitReview({
        ...form,
        candidateId: effectiveCandidateId
      } as SubmitReviewRequest);

      toast.success("Review submitted successfully!");
      router.push("/candidate/my-reviews");
    } catch (error: any) {
      console.error("Failed to submit review:", error);
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating: number, onRate?: (value: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onRate?.(value)}
            disabled={!onRate}
            className={`transition-colors ${onRate ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
          >
            <Star
              className={`h-6 w-6 ${
                value <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const calculateProgress = () => {
    return ((step - 1) / 3) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!eligibility) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Submit Company Review</h1>
        <p className="text-muted-foreground">
          Share your experience to help other candidates
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of 4</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(calculateProgress())}% Complete
          </span>
        </div>
        <Progress value={calculateProgress()} className="h-2" />
      </div>

      {/* Step 1: Select Review Type */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Review Type</CardTitle>
            <CardDescription>
              Choose what aspect of your experience you'd like to review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              value={form.reviewType}
              onValueChange={(value: any) => setForm({ ...form, reviewType: value as NormalizedReviewType })}
            >
              {eligibleTypes.includes("APPLICATION_EXPERIENCE") && (
                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="APPLICATION_EXPERIENCE" id="application" />
                  <label htmlFor="application" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Application Process</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review the application and initial screening process
                    </p>
                  </label>
                </div>
              )}

              {eligibleTypes.includes("INTERVIEW_EXPERIENCE") && (
                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="INTERVIEW_EXPERIENCE" id="interview" />
                  <label htmlFor="interview" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Interview Experience</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review the interview process and communication
                    </p>
                  </label>
                </div>
              )}

              {eligibleTypes.includes("WORK_EXPERIENCE") && (
                <div className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted">
                  <RadioGroupItem value="WORK_EXPERIENCE" id="work" />
                  <label htmlFor="work" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Work Experience</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Review company culture, management, and workplace experience
                    </p>
                  </label>
                </div>
              )}

            </RadioGroup>

            {eligibility.message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <p className="text-sm text-blue-900">{eligibility.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Overall Rating & Title */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Rating</CardTitle>
            <CardDescription>
              Rate your {getReviewTypeText(form.reviewType!).toLowerCase()} experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Overall Rating *</Label>
              <div className="flex items-center gap-4">
                {renderStars(form.overallRating!, (value) =>
                  setForm({ ...form, overallRating: value })
                )}
                <span className="text-sm font-medium">
                  {form.overallRating} / 5
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-title">Review Title *</Label>
              <Input
                id="review-title"
                placeholder="Summarize your experience in one line..."
                value={form.reviewTitle}
                onChange={(e) =>
                  setForm({ ...form, reviewTitle: e.target.value })
                }
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {form.reviewTitle?.length || 0} / 100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-text">Your Review *</Label>
              <Textarea
                id="review-text"
                placeholder="Share your detailed experience..."
                value={form.reviewText}
                onChange={(e) =>
                  setForm({ ...form, reviewText: e.target.value })
                }
                rows={8}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {form.reviewText?.length || 0} / 2000 characters
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Category Ratings */}
      {step === 3 && form.reviewType === "WORK" && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Ratings</CardTitle>
            <CardDescription>
              Rate different aspects of working at the company
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {RATING_CATEGORIES.map((category) => (
              <div key={category.key} className="space-y-2">
                <Label>{category.label}</Label>
                <div className="flex items-center gap-4">
                  {renderStars(
                    form.categoryRatings?.[category.key as keyof typeof form.categoryRatings] || 3,
                    (value) =>
                      setForm({
                        ...form,
                        categoryRatings: {
                          ...form.categoryRatings!,
                          [category.key]: value
                        }
                      })
                  )}
                  <span className="text-sm font-medium">
                    {form.categoryRatings?.[category.key as keyof typeof form.categoryRatings]} / 5
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Pros, Cons & Preferences */}
      {step === (form.reviewType === "WORK" ? 4 : 3) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Details</CardTitle>
            <CardDescription>
              Help others understand the highlights and challenges
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="pros">
                <ThumbsUp className="h-4 w-4 inline mr-1 text-green-600" />
                Pros *
              </Label>
              <Textarea
                id="pros"
                placeholder="What did you like? List positive aspects..."
                value={form.pros}
                onChange={(e) => setForm({ ...form, pros: e.target.value })}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {form.pros?.length || 0} / 500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cons">
                <ThumbsDown className="h-4 w-4 inline mr-1 text-red-600" />
                Cons *
              </Label>
              <Textarea
                id="cons"
                placeholder="What could be improved? List challenges..."
                value={form.cons}
                onChange={(e) => setForm({ ...form, cons: e.target.value })}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {form.cons?.length || 0} / 500 characters
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Would you recommend this company?</Label>
                <p className="text-sm text-muted-foreground">
                  Would you recommend others to apply here?
                </p>
              </div>
              <Switch
                checked={form.wouldRecommend}
                onCheckedChange={(checked) =>
                  setForm({ ...form, wouldRecommend: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label>Submit anonymously</Label>
                <p className="text-sm text-muted-foreground">
                  Your name will not be visible to others
                </p>
              </div>
              <Switch
                checked={form.isAnonymous}
                onCheckedChange={(checked) =>
                  setForm({ ...form, isAnonymous: checked })
                }
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-blue-900">Review Guidelines</p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Be honest and constructive in your feedback</li>
                    <li>Avoid personal attacks or offensive language</li>
                    <li>Focus on facts and your personal experience</li>
                    <li>You can edit or delete within 30 days</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {step < (form.reviewType === "WORK" ? 4 : 3) ? (
          <Button
            onClick={() => {
              if (step === 1 && !form.reviewType) {
                toast.error("Please select a review type");
                return;
              }
              setStep(step + 1);
            }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting}>
            <CheckCircle className="h-4 w-4 mr-1" />
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        )}
      </div>
    </div>
  );
}

export { SubmitReviewContent };