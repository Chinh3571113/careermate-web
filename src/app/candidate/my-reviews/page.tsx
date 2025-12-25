"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Star,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Briefcase,
  Filter,
  Search,
  Lock,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAuthStore } from "@/store/use-auth-store";
import { useLayout } from "@/contexts/LayoutContext";
import CVSidebar from "@/components/layout/CVSidebar";
import {
  getCandidateReviews,
  getReviewTypeText,
  getJobApplicationsWithReviewStatus,
  deleteOwnReview,
  type ReviewResponse,
  type JobApplicationReviewStatus,
  type ReviewType,
} from "@/lib/review-api";
import { QuickReviewDrawer } from "@/components/review";
import { cn } from "@/lib/utils";

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const renderStars = (rating: number, size: "sm" | "md" = "md") => {
  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClass,
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
};

const getReviewTypeIcon = (type: string) => {
  if (type.includes("APPLICATION") || type === "application") return <FileText className="h-4 w-4" />;
  if (type.includes("INTERVIEW") || type === "interview") return <Users className="h-4 w-4" />;
  if (type.includes("WORK") || type === "work") return <Briefcase className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
};

const getReviewTypeBadgeColor = (type: ReviewType) => {
  if (type.includes("APPLICATION")) return "bg-blue-100 text-blue-800";
  if (type.includes("INTERVIEW")) return "bg-purple-100 text-purple-800";
  if (type.includes("WORK")) return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
};

// Review type section component for the grouped card
interface ReviewTypeSectionProps {
  type: "application" | "interview" | "work";
  status: {
    status: "submitted" | "available" | "not_eligible";
    reviewId?: number;
    rating?: number;
    reason?: string;
  };
  onWrite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function ReviewTypeSection({ type, status, onWrite, onEdit, onDelete }: ReviewTypeSectionProps) {
  const typeLabels = {
    application: "Application Experience",
    interview: "Interview Experience",
    work: "Work Experience",
  };
  
  const typeIcons = {
    application: <FileText className="h-4 w-4" />,
    interview: <Users className="h-4 w-4" />,
    work: <Briefcase className="h-4 w-4" />,
  };
  
  const typeBgColors = {
    application: "bg-blue-50 border-blue-200",
    interview: "bg-purple-50 border-purple-200",
    work: "bg-green-50 border-green-200",
  };
  
  const typeTextColors = {
    application: "text-blue-700",
    interview: "text-purple-700",
    work: "text-green-700",
  };

  const isSubmitted = status.status === "submitted";
  const isAvailable = status.status === "available";
  const isLocked = status.status === "not_eligible";

  return (
    <div
      className={cn(
        "p-3 rounded-lg border transition-all",
        isLocked ? "bg-gray-50 border-gray-200 opacity-60" : typeBgColors[type],
        isAvailable && "hover:shadow-sm cursor-pointer"
      )}
      onClick={isAvailable ? onWrite : undefined}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn(isLocked ? "text-gray-400" : typeTextColors[type])}>
            {typeIcons[type]}
          </span>
          <span className={cn(
            "text-sm font-medium",
            isLocked ? "text-gray-500" : typeTextColors[type]
          )}>
            {typeLabels[type]}
          </span>
        </div>
        
        {isSubmitted && (
          <div className="flex items-center gap-2">
            {renderStars(status.rating || 0, "sm")}
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            {onEdit && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 gap-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 gap-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}
        
        {isAvailable && (
          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs">
            <Pencil className="h-3 w-3" />
            Write
          </Button>
        )}
        
        {isLocked && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-gray-400">
                  <Lock className="h-3 w-3" />
                  <span className="text-xs">Locked</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{status.reason || "Not eligible yet"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
}

export default function CandidateMyReviewsPage() {
  const router = useRouter();
  const { headerHeight } = useLayout();
  const authCandidateId = useAuthStore((s) => s.candidateId);
  const authUserId = useAuthStore((s) => s.user?.id);
  const authIsLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchCandidateProfile = useAuthStore((s) => s.fetchCandidateProfile);

  const effectiveCandidateId =
    typeof authCandidateId === "number"
      ? authCandidateId
      : typeof authUserId === "number"
        ? authUserId
        : typeof authUserId === "string"
          ? Number.parseInt(authUserId, 10)
          : null;

  // State
  const [activeTab, setActiveTab] = useState<"submitted" | "applications">("submitted");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [applications, setApplications] = useState<JobApplicationReviewStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isInitializing, setIsInitializing] = useState(true);

  // Review drawer state
  const [selectedApplication, setSelectedApplication] = useState<JobApplicationReviewStatus | null>(null);
  const [selectedReviewType, setSelectedReviewType] = useState<ReviewType | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);

  // Load submitted reviews
  const loadSubmittedReviews = useCallback(async () => {
    if (!effectiveCandidateId) return;
    try {
      const page = await getCandidateReviews(effectiveCandidateId);
      setReviews(page.content || []);
    } catch (e: unknown) {
      console.error("Failed to load reviews:", e);
    }
  }, [effectiveCandidateId]);

  // Load job applications with review status
  const loadApplicationsWithStatus = useCallback(async () => {
    if (!effectiveCandidateId) return;
    try {
      const data = await getJobApplicationsWithReviewStatus(effectiveCandidateId);
      setApplications(data);
    } catch (e: unknown) {
      console.error("Failed to load applications:", e);
      toast.error("Failed to load job applications");
    }
  }, [effectiveCandidateId]);

  // Initialize: fetch candidateId if authenticated but missing
  useEffect(() => {
    const initialize = async () => {
      if (!isAuthenticated) {
        setIsInitializing(false);
        return;
      }

      // If candidateId is already available, we're done initializing
      if (effectiveCandidateId) {
        setIsInitializing(false);
        return;
      }

      // Try to fetch candidateId
      try {
        await fetchCandidateProfile();
      } catch (error) {
        console.error("Failed to fetch candidate profile:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [isAuthenticated, effectiveCandidateId, fetchCandidateProfile]);

  // Initial load - wait for initialization before checking authentication
  useEffect(() => {
    const load = async () => {
      // Wait for initialization to complete
      if (isInitializing || authIsLoading) return;
      
      // If not authenticated or no candidate ID after initialization, redirect
      if (!isAuthenticated || !effectiveCandidateId) {
        toast.error("Please sign in to view your reviews");
        router.push("/");
        return;
      }
      
      setLoading(true);
      await Promise.all([loadSubmittedReviews(), loadApplicationsWithStatus()]);
      setLoading(false);
    };
    load();
  }, [isInitializing, authIsLoading, isAuthenticated, effectiveCandidateId, loadSubmittedReviews, loadApplicationsWithStatus, router]);

  // Handle review submission success
  const handleReviewSuccess = () => {
    setDrawerOpen(false);
    setSelectedApplication(null);
    setSelectedReviewType(null);
    setEditingReview(null);
    // Refresh both lists
    loadSubmittedReviews();
    loadApplicationsWithStatus();
    toast.success(editingReview ? "Review updated successfully!" : "Review submitted successfully!");
  };

  // Transform ReviewResponse to drawer's existingReview format
  const transformReviewForEdit = (review: ReviewResponse) => {
    const categoryRatings: Record<string, number> = {};
    
    // Map all category ratings
    if (review.communicationRating) categoryRatings.communicationRating = review.communicationRating;
    if (review.responsivenessRating) categoryRatings.responsivenessRating = review.responsivenessRating;
    if (review.interviewProcessRating) categoryRatings.interviewProcessRating = review.interviewProcessRating;
    if (review.workCultureRating) categoryRatings.workCultureRating = review.workCultureRating;
    if (review.managementRating) categoryRatings.managementRating = review.managementRating;
    if (review.workLifeBalanceRating) categoryRatings.workLifeBalanceRating = review.workLifeBalanceRating;
    if (review.benefitsRating) categoryRatings.benefitsRating = review.benefitsRating;
    
    return {
      id: review.id,
      overallRating: review.overallRating,
      reviewText: review.reviewText,
      isAnonymous: review.isAnonymous,
      categoryRatings,
    };
  };

  // Handle writing a review
  const handleWriteReview = (app: JobApplicationReviewStatus, type: ReviewType) => {
    setSelectedApplication(app);
    setSelectedReviewType(type);
    setEditingReview(null);
    setDrawerOpen(true);
  };

  // Handle editing a review
  const handleEditReview = (review: ReviewResponse) => {
    // Find the application that matches this review
    const matchingApp = applications.find(app => app.jobApplyId === review.jobApplyId);
    if (matchingApp) {
      setSelectedApplication(matchingApp);
      setSelectedReviewType(review.reviewType as ReviewType);
      setEditingReview(review);
      setDrawerOpen(true);
    } else {
      toast.error("Unable to edit this review. Application not found.");
    }
  };

  // Handle editing a review from applications tab by review ID
  const handleEditReviewById = (app: JobApplicationReviewStatus, reviewId: number, reviewType: ReviewType) => {
    // Find the review from the reviews list
    const review = reviews.find(r => r.id === reviewId);
    if (review) {
      setSelectedApplication(app);
      setSelectedReviewType(reviewType);
      setEditingReview(review);
      setDrawerOpen(true);
    } else {
      toast.error("Unable to edit this review.");
    }
  };

  // Handle deleting a review
  const handleDeleteReview = async (reviewId: number) => {
    if (!confirm("Are you sure you want to delete this review? This action cannot be undone.")) {
      return;
    }

    if (!effectiveCandidateId) {
      toast.error("Unable to delete review: User not authenticated");
      return;
    }

    try {
      await deleteOwnReview(reviewId, effectiveCandidateId);
      toast.success("Review deleted successfully!");
      // Refresh the reviews list
      await loadSubmittedReviews();
      await loadApplicationsWithStatus();
    } catch (error: any) {
      console.error("Error deleting review:", error);
      toast.error(error.message || "Failed to delete review");
    }
  };

  // Filter reviews with useMemo to prevent re-filtering on every render
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const matchesSearch =
        searchQuery === "" ||
        r.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || r.reviewType.includes(filterType.toUpperCase());
      return matchesSearch && matchesType;
    });
  }, [reviews, searchQuery, filterType]);

  // Filter applications with useMemo
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const matchesSearch =
        searchQuery === "" ||
        app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [applications, searchQuery]);

  // Calculate stats
  const availableCount = applications.reduce((count, app) => {
    let c = 0;
    if (app.applicationReview?.status === "available") c++;
    if (app.interviewReview?.status === "available") c++;
    if (app.workReview?.status === "available") c++;
    return count + c;
  }, 0);

  // Loading state
  if (loading) {
    return (
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
          <div className="flex-1 min-w-0 space-y-4 transition-all duration-300">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
      {/* GRID 2 cột: sidebar | content */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
        style={{
          ["--sticky-offset" as any]: `${headerHeight || 0}px`,
          ["--content-pad" as any]: "24px",
        }}
      >
        {/* Sidebar trái: sticky + ẩn mobile */}
        <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
          <CVSidebar activePage="my-reviews" />
        </aside>

        {/* Main Content */}
        <div className="space-y-6 min-w-0 transition-all duration-300">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                My Reviews
              </CardTitle>
              <CardDescription>
                Share your experience to help others make informed career decisions
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{reviews.length}</p>
                    <p className="text-sm text-gray-500">Submitted Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{availableCount}</p>
                    <p className="text-sm text-gray-500">Available to Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Star className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {reviews.length > 0
                        ? (reviews.reduce((acc, r) => acc + r.overallRating, 0) / reviews.length).toFixed(1)
                        : "-"}
                    </p>
                    <p className="text-sm text-gray-500">Avg Rating Given</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                {/* Tab Buttons - Job Activities Style */}
                <div className="border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("submitted")}
                    className={`pb-3 px-1 mr-8 relative border-b-2 ${
                      activeTab === "submitted"
                        ? "text-black font-semibold border-black"
                        : "text-gray-600 hover:text-gray-900 border-transparent"
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4 inline mr-2" />
                    Submitted
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === "submitted" 
                        ? "bg-black text-white" 
                        : "bg-gray-500 text-white"
                    }`}>
                      {reviews.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab("applications")}
                    className={`pb-3 px-1 mr-8 relative border-b-2 ${
                      activeTab === "applications"
                        ? "text-black font-semibold border-black"
                        : "text-gray-600 hover:text-gray-900 border-transparent"
                    }`}
                  >
                    <Building2 className="h-4 w-4 inline mr-2" />
                    My Applications
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      activeTab === "applications" 
                        ? "bg-black text-white" 
                        : "bg-gray-500 text-white"
                    }`}>
                      {applications.length}
                    </span>
                  </button>
                </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-48"
                      />
                    </div>
                    {activeTab === "submitted" && (
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="application">Application</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="work">Work Experience</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

              {/* Submitted Reviews Tab */}
              {activeTab === "submitted" && (
                <>
                  {filteredReviews.length === 0 ? (
                <Card className="border-0 shadow-none">
                  <CardContent className="py-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No reviews yet</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {searchQuery
                        ? "No reviews match your search"
                        : "Start sharing your experiences to help others"}
                    </p>
                    {!searchQuery && availableCount > 0 && (
                      <Button onClick={() => setActiveTab("applications")}>
                        Write a Review
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((r) => (
                    <Card key={r.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-gray-400" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{r.companyName || "Company"}</p>
                              <p className="text-sm text-gray-500">{r.jobTitle || ""}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getReviewTypeBadgeColor(r.reviewType)}`}>
                                {getReviewTypeIcon(r.reviewType)}
                                {getReviewTypeText(r.reviewType)}
                              </span>
                            </div>
                            {renderStars(r.overallRating)}
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-3 line-clamp-3">{r.reviewText}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{r.createdAt ? formatDate(r.createdAt) : ""}</span>
                          <div className="flex items-center gap-2">
                            {r.isAnonymous && (
                              <Badge variant="outline" className="text-xs">Anonymous</Badge>
                            )}
                            <Badge variant="secondary" className="text-xs capitalize">
                              {r.status?.toLowerCase() || "active"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditReview(r)}
                              className="h-8 gap-1"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteReview(r.id)}
                              className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
                </>
              )}

              {/* Applications Tab - Grouped Review Cards */}
              {activeTab === "applications" && (
                <>
                  {filteredApplications.length === 0 ? (
                <Card className="border-0 shadow-none">
                  <CardContent className="py-12 text-center">
                    <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No applications yet</h3>
                    <p className="text-sm text-gray-500">
                      {searchQuery
                        ? "No applications match your search"
                        : "Apply to jobs to start reviewing companies"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Info banner */}
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="py-3">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-blue-800">
                          <p className="font-medium">Review Eligibility</p>
                          <p className="text-blue-700">
                            Each job application has 3 review types. Click on available reviews to write them:
                          </p>
                          <ul className="mt-1 list-disc list-inside text-blue-700">
                            <li><strong>Application:</strong> Available 7 days after applying</li>
                            <li><strong>Interview:</strong> Available after completing an interview</li>
                            <li><strong>Work:</strong> Available after 30 days of employment</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {filteredApplications.map((app) => (
                    <Card key={app.jobApplyId} className="hover:shadow-md transition-shadow">
                      <CardContent className="py-4">
                        {/* Company Header */}
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                          {app.companyLogo ? (
                            <img
                              src={app.companyLogo}
                              alt={app.companyName}
                              className="w-12 h-12 rounded-lg object-contain bg-gray-50"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{app.companyName}</p>
                            <p className="text-sm text-gray-500">{app.jobTitle}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Applied {app.appliedAt ? formatDate(app.appliedAt) : "recently"}
                              {app.daysSinceApplication != null && ` · ${app.daysSinceApplication} days ago`}
                            </p>
                          </div>
                        </div>

                        {/* Review Type Sections */}
                        <div className="space-y-2">
                          <ReviewTypeSection
                            type="application"
                            status={app.applicationReview || { status: "not_eligible", reason: "Loading..." }}
                            onWrite={() => handleWriteReview(app, "APPLICATION_EXPERIENCE")}
                            onEdit={app.applicationReview?.reviewId 
                              ? () => handleEditReviewById(app, app.applicationReview!.reviewId!, "APPLICATION_EXPERIENCE")
                              : undefined}
                            onDelete={app.applicationReview?.reviewId 
                              ? () => handleDeleteReview(app.applicationReview!.reviewId!)
                              : undefined}
                          />
                          <ReviewTypeSection
                            type="interview"
                            status={app.interviewReview || { status: "not_eligible", reason: "Loading..." }}
                            onWrite={() => handleWriteReview(app, "INTERVIEW_EXPERIENCE")}
                            onEdit={app.interviewReview?.reviewId 
                              ? () => handleEditReviewById(app, app.interviewReview!.reviewId!, "INTERVIEW_EXPERIENCE")
                              : undefined}
                            onDelete={app.interviewReview?.reviewId 
                              ? () => handleDeleteReview(app.interviewReview!.reviewId!)
                              : undefined}
                          />
                          <ReviewTypeSection
                            type="work"
                            status={app.workReview || { status: "not_eligible", reason: "Loading..." }}
                            onWrite={() => handleWriteReview(app, "WORK_EXPERIENCE")}
                            onEdit={app.workReview?.reviewId 
                              ? () => handleEditReviewById(app, app.workReview!.reviewId!, "WORK_EXPERIENCE")
                              : undefined}
                            onDelete={app.workReview?.reviewId 
                              ? () => handleDeleteReview(app.workReview!.reviewId!)
                              : undefined}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Drawer */}
      {selectedApplication && effectiveCandidateId && selectedReviewType && (
        <QuickReviewDrawer
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          candidateId={effectiveCandidateId}
          jobApplyId={selectedApplication.jobApplyId}
          companyName={selectedApplication.companyName}
          jobTitle={selectedApplication.jobTitle}
          reviewType={selectedReviewType}
          onSuccess={handleReviewSuccess}
          editMode={!!editingReview}
          existingReview={editingReview ? transformReviewForEdit(editingReview) : undefined}
        />
      )}
    </main>
  );
}
