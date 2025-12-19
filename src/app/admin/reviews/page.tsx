"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  RotateCcw,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Star,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import {
  adminSearchReviews,
  adminUpdateReviewStatus,
  adminBulkUpdateReviews,
  adminGetReviewStats,
  type AdminReviewFilterRequest,
  type AdminReviewResponse,
  type AdminReviewStats,
} from "@/lib/review-api";

export default function AdminReviewManagementPage() {
  const [reviews, setReviews] = useState<AdminReviewResponse[]>([]);
  const [stats, setStats] = useState<AdminReviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedReviews, setSelectedReviews] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [filters, setFilters] = useState<AdminReviewFilterRequest>({
    page: 0,
    size: 20,
    sortBy: "createdAt",
    sortDirection: "DESC",
  });

  // Dialogs
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [singleActionDialog, setSingleActionDialog] = useState(false);
  const [selectedReviewForAction, setSelectedReviewForAction] = useState<AdminReviewResponse | null>(null);
  const [actionType, setActionType] = useState<"ACTIVE" | "HIDDEN" | "REMOVED">("HIDDEN");
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [filters.page]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const result = await adminSearchReviews(filters);
      setReviews(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
      setCurrentPage(filters.page || 0);
    } catch (error: any) {
      toast.error("Failed to load reviews: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminGetReviewStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleSearch = () => {
    setFilters({ ...filters, page: 0 });
    loadReviews();
  };

  const handleResetFilters = () => {
    setFilters({
      page: 0,
      size: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
      searchText: undefined,
      reviewType: undefined,
      status: undefined,
      startDate: undefined,
      endDate: undefined,
      minRating: undefined,
      maxRating: undefined,
      flaggedOnly: undefined,
    });
    setTimeout(loadReviews, 100);
  };

  const toggleSelectReview = (reviewId: number) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(reviews.map((r) => r.id)));
    }
  };

  const handleSingleAction = async () => {
    if (!selectedReviewForAction) return;
    
    try {
      console.log('🔄 Starting single action update:', {
        reviewId: selectedReviewForAction.id,
        currentStatus: selectedReviewForAction.status,
        newStatus: actionType,
        reason: actionReason
      });
      
      const result = await adminUpdateReviewStatus(selectedReviewForAction.id, actionType, actionReason);
      
      console.log('✅ Single action completed:', result);
      toast.success(`Review status updated to ${actionType}`);
      setSingleActionDialog(false);
      setActionReason("");
      setSelectedReviewForAction(null);
      loadReviews();
      loadStats();
    } catch (error: any) {
      console.error('❌ Single action failed:', error);
      toast.error("Action failed: " + (error.response?.data?.message || error.message || "Unknown error"));
    }
  };

  const handleBulkAction = async () => {
    if (selectedReviews.size === 0) {
      toast.error("No reviews selected");
      return;
    }

    try {
      console.log('🔄 Starting bulk action update:', {
        reviewCount: selectedReviews.size,
        reviewIds: Array.from(selectedReviews),
        newStatus: actionType,
        reason: actionReason
      });
      
      const result = await adminBulkUpdateReviews({
        reviewIds: Array.from(selectedReviews),
        newStatus: actionType,
        reason: actionReason,
      });
      
      console.log('✅ Bulk action completed:', result);
      toast.success(`${selectedReviews.size} reviews updated to ${actionType}`);
      setBulkActionDialog(false);
      setActionReason("");
      setSelectedReviews(new Set());
      loadReviews();
      loadStats();
    } catch (error: any) {
      console.error('❌ Bulk action failed:', error);
      toast.error("Bulk action failed: " + (error.response?.data?.message || error.message || "Unknown error"));
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800 border-green-300",
      HIDDEN: "bg-gray-100 text-gray-800 border-gray-300",
      FLAGGED: "bg-amber-100 text-amber-800 border-amber-300",
      REMOVED: "bg-red-100 text-red-800 border-red-300",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
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
        <h1 className="text-3xl font-bold">Review Management</h1>
        <p className="text-muted-foreground">Moderate and manage company reviews</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Active: {stats.activeReviews}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Moderation Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.flaggedReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hidden: {stats.hiddenReviews}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Last 7 Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                {stats.last7Days}
                {stats.last7Days > stats.last30Days / 4 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Last 24h: {stats.last24Hours}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Removed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.removedReviews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Policy violations
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
          </CardTitle>
          <CardDescription>Search and filter reviews for moderation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Label className="mb-2 block">Search Text</Label>
              <Input
                placeholder="Search by company, candidate, job title, or review content..."
                value={filters.searchText || ""}
                onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>

            <div>
              <Label className="mb-2 block">Review Type</Label>
              <Select
                value={filters.reviewType || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, reviewType: v === "all" ? undefined : v as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="APPLICATION_EXPERIENCE">Application</SelectItem>
                  <SelectItem value="INTERVIEW_EXPERIENCE">Interview</SelectItem>
                  <SelectItem value="WORK_EXPERIENCE">Work</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Status</Label>
              <Select
                value={filters.status || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, status: v === "all" ? undefined : v as any })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="HIDDEN">Hidden</SelectItem>
                  <SelectItem value="FLAGGED">Flagged</SelectItem>
                  <SelectItem value="REMOVED">Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Start Date</Label>
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-2 block">End Date</Label>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div>
              <Label className="mb-2 block">Min Rating</Label>
              <Select
                value={filters.minRating?.toString() || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, minRating: v === "all" ? undefined : parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">Max Rating</Label>
              <Select
                value={filters.maxRating?.toString() || "all"}
                onValueChange={(v) =>
                  setFilters({ ...filters, maxRating: v === "all" ? undefined : parseInt(v) })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any</SelectItem>
                  <SelectItem value="1">1 Star</SelectItem>
                  <SelectItem value="2">2 Stars</SelectItem>
                  <SelectItem value="3">3 Stars</SelectItem>
                  <SelectItem value="4">4 Stars</SelectItem>
                  <SelectItem value="5">5 Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={filters.flaggedOnly || false}
                  onCheckedChange={(checked) =>
                    setFilters({ ...filters, flaggedOnly: checked as boolean })
                  }
                />
                <span className="text-sm">Flagged Only</span>
              </label>
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
            {selectedReviews.size > 0 && (
              <Button
                onClick={() => {
                  setActionType("HIDDEN");
                  setBulkActionDialog(true);
                }}
                variant="outline"
                className="ml-auto gap-2"
              >
                <CheckSquare className="h-4 w-4" />
                Update Status ({selectedReviews.size})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reviews ({totalElements})</CardTitle>
            {reviews.length > 0 && (
              <Button variant="outline" size="sm" onClick={toggleSelectAll}>
                {selectedReviews.size === reviews.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No reviews found</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <Card key={review.id} className="border-2">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={selectedReviews.has(review.id)}
                        onCheckedChange={() => toggleSelectReview(review.id)}
                      />
                      
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{review.companyName}</h3>
                              {getStatusBadge(review.status)}
                              <Badge variant="outline">{review.reviewType.replace('_EXPERIENCE', '')}</Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {review.isAnonymous ? "Anonymous" : review.candidateName} • {review.jobTitle}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              {(review.flagCount ?? 0) > 0 && (
                                <span className="flex items-center gap-1 text-amber-600">
                                  <AlertCircle className="h-3 w-3" />
                                  {review.flagCount} flags
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {renderStars(review.overallRating)}
                            <span className="text-sm font-semibold">{review.overallRating}/5</span>
                          </div>
                        </div>

                        <p className="text-sm">{review.reviewText}</p>

                        {review.removalReason && review.status !== "ACTIVE" && (
                          <div className="text-xs bg-red-50 border border-red-200 rounded p-2 text-red-800">
                            <strong>Removal Reason:</strong> {review.removalReason}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => {
                              setSelectedReviewForAction(review);
                              // Set default action based on current status
                              if (review.status === "REMOVED") {
                                setActionType("ACTIVE");
                              } else if (review.status === "HIDDEN") {
                                setActionType("ACTIVE");
                              } else {
                                setActionType("HIDDEN");
                              }
                              setSingleActionDialog(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                            Update Status
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <Button
                variant="outline"
                disabled={currentPage === 0}
                onClick={() => setFilters({ ...filters, page: currentPage - 1 })}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={currentPage >= totalPages - 1}
                onClick={() => setFilters({ ...filters, page: currentPage + 1 })}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Action Dialog */}
      <Dialog open={singleActionDialog} onOpenChange={setSingleActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Review Status</DialogTitle>
            <DialogDescription>
              Change the visibility and moderation status of this review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">New Status</Label>
              <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active (Visible to public)</SelectItem>
                  <SelectItem value="HIDDEN">Hidden (Not visible, excluded from stats)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Reason (optional)</Label>
              <Textarea
                placeholder="Reason for status change..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSingleAction}
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Update Status ({selectedReviews.size} Reviews)</DialogTitle>
            <DialogDescription>
              Apply the same status change to all selected reviews
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">New Status</Label>
              <Select value={actionType} onValueChange={(v: any) => setActionType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active (Visible to public)</SelectItem>
                  <SelectItem value="HIDDEN">Hidden (Not visible, excluded from stats)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">Reason (optional)</Label>
              <Textarea
                placeholder="Reason for status change..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
            >
              Update {selectedReviews.size} Reviews
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
