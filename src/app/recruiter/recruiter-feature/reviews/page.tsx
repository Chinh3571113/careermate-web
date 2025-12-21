"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Search,
  Filter,
  Star,
  Calendar,
  TrendingUp,
  MessageSquare,
  Award,
  Users,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  recruiterGetCompanyReviews,
  recruiterGetStats,
  type AdminReviewResponse,
} from "@/lib/review-api";

interface RecruiterStats {
  totalActiveReviews: number;
  averageOverallRating: number;
  application_experienceCount?: number;
  interview_experienceCount?: number;
  work_experienceCount?: number;
  last30Days?: number;
  last7Days?: number;
  last24Hours?: number;
}

export default function RecruiterReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([]);
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filters (read-only - no status filtering)
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [duration, setDuration] = useState<string>("all");

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [currentPage, activeTab]);

  // Trigger search when duration changes dates
  useEffect(() => {
    if (duration !== "all" && (dateFrom || dateTo)) {
      handleSearch();
    }
  }, [dateFrom, dateTo]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        size: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      };

      // Map tab to review type
      if (activeTab !== "all") {
        params.reviewType = activeTab;
      }
      
      if (rating) params.rating = rating;
      if (searchText) params.searchText = searchText;
      if (dateFrom) params.startDate = dateFrom;
      if (dateTo) params.endDate = dateTo;

      console.log("🔍 Loading reviews with params:", params);
      const result = await recruiterGetCompanyReviews(params);
      console.log("✅ Reviews loaded:", result);
      setReviews(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error: any) {
      console.error("❌ Failed to load reviews:", error);
      console.error("Error response:", error.response?.data);
      if (error.response?.status === 400) {
        toast.error("Unable to load reviews. Please ensure your recruiter profile and company information are complete.");
      } else {
        toast.error("Failed to load reviews: " + (error.response?.data?.message || error.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log("📊 Loading stats...");
      const data = await recruiterGetStats();
      console.log("✅ Stats loaded:", data);
      setStats(data);
    } catch (error) {
      console.error("❌ Failed to load stats:", error);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadReviews();
  };

  const handleResetFilters = () => {
    setRating(undefined);
    setSearchText("");
    setDateFrom("");
    setDateTo("");
    setDuration("all");
    setCurrentPage(0);
    setTimeout(loadReviews, 100);
  };

  const handleDurationChange = (value: string) => {
    setDuration(value);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    switch(value) {
      case "today":
        setDateFrom(today);
        setDateTo(today);
        break;
      case "7days":
        const date7 = new Date();
        date7.setDate(date7.getDate() - 7);
        setDateFrom(date7.toISOString().split('T')[0]);
        setDateTo(today);
        break;
      case "30days":
        const date30 = new Date();
        date30.setDate(date30.getDate() - 30);
        setDateFrom(date30.toISOString().split('T')[0]);
        setDateTo(today);
        break;
      case "90days":
        const date90 = new Date();
        date90.setDate(date90.getDate() - 90);
        setDateFrom(date90.toISOString().split('T')[0]);
        setDateTo(today);
        break;
      case "all":
        setDateFrom("");
        setDateTo("");
        break;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(0);
  };

  const renderReviews = () => {
    return reviews.map((review) => (
      <Card key={review.id} className="border-2">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{review.jobTitle}</h3>
                  <Badge variant="outline">
                    {review.reviewType.replace("_EXPERIENCE", "")}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {review.isAnonymous ? "Anonymous Candidate" : review.candidateName}
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {renderStars(review.overallRating)}
                <span className="text-sm font-semibold">{review.overallRating}/5</span>
              </div>
            </div>

            <p className="text-sm border-l-4 border-gray-200 pl-4 py-2">
              {review.reviewText}
            </p>

            {/* Category Ratings */}
            {review.reviewType === "APPLICATION_EXPERIENCE" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Communication:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.communicationRating || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Response Time:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.responsivenessRating || 0)}
                  </div>
                </div>
              </div>
            )}

            {review.reviewType === "INTERVIEW_EXPERIENCE" && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Communication:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.communicationRating || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Responsiveness:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.responsivenessRating || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Process:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.interviewProcessRating || 0)}
                  </div>
                </div>
              </div>
            )}

            {review.reviewType === "WORK_EXPERIENCE" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Culture:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.workCultureRating || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Balance:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.workLifeBalanceRating || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Benefits:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.benefitsRating || 0)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Management:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(review.managementRating || 0)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    ));
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Company Reviews</h1>
        <p className="text-muted-foreground">View reviews for your company (read-only)</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalActiveReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">Active reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Average Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats.averageOverallRating?.toFixed(1) || '0.0'}
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Out of 5.0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Review Types
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="text-sm">Application: {stats.application_experienceCount || 0}</div>
                <div className="text-sm">Interview: {stats.interview_experienceCount || 0}</div>
                <div className="text-sm">Work: {stats.work_experienceCount || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Last 30 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.last30Days || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">New reviews</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Reviews
          </CardTitle>
          <CardDescription>Search and filter active reviews for your company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <Label className="mb-2 block">Star Rating</Label>
              <Select
                value={rating?.toString() || "all"}
                onValueChange={(v) => setRating(v === "all" ? undefined : parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Duration</Label>
              <Select
                value={duration}
                onValueChange={handleDurationChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Search Text</Label>
              <Input
                placeholder="Search in reviews..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <Label className="mb-2 block">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDuration("all"); // Reset duration when custom date is set
                }}
                max={dateTo || undefined}
              />
            </div>

            <div>
              <Label className="mb-2 block">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDuration("all"); // Reset duration when custom date is set
                }}
                min={dateFrom || undefined}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button onClick={handleResetFilters} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List with Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Reviews ({totalElements})</CardTitle>
          <CardDescription>
            All reviews are moderated by administrators. You cannot edit or remove reviews.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Tabs for Review Types - Merged with Reviews Display */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All Reviews</TabsTrigger>
              <TabsTrigger value="APPLICATION_EXPERIENCE">Application</TabsTrigger>
              <TabsTrigger value="INTERVIEW_EXPERIENCE">Interview</TabsTrigger>
              <TabsTrigger value="WORK_EXPERIENCE">Work Experience</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews found for your company
                </div>
              ) : (
                <div className="space-y-4">{renderReviews()}</div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <Button
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
