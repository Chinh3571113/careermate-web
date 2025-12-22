'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Search,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    User,
    Mail,
    MessageSquare,
    TrendingUp,
    BarChart3,
    X,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Flag,
    Shield,
    Clock
} from 'lucide-react';
import { adminModerationApi, type AdminCommentResponse, type AdminCommentFilters, type CommentStatistics, type ModerationStatistics } from '@/lib/admin-moderation-api';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function CommentModeration() {
    const [activeTab, setActiveTab] = useState<'flagged' | 'all'>('flagged');
    const [comments, setComments] = useState<AdminCommentResponse[]>([]);
    const [statistics, setStatistics] = useState<CommentStatistics | null>(null);
    const [moderationStats, setModerationStats] = useState<ModerationStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    // Filters
    const [searchEmail, setSearchEmail] = useState('');
    const [searchContent, setSearchContent] = useState('');
    const [blogIdFilter, setBlogIdFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [duration, setDuration] = useState('all');
    const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'flaggedAt'>('flaggedAt');
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');

    const pageSize = 20;

    useEffect(() => {
        fetchComments();
        fetchStatistics();
        fetchModerationStats();
    }, [currentPage, sortBy, sortDirection, activeTab]);

    const fetchComments = async (overrideFilters?: { searchEmail?: string; searchContent?: string; blogIdFilter?: string; page?: number }) => {
        try {
            setLoading(true);
            
            const emailFilter = overrideFilters?.searchEmail ?? searchEmail;
            const contentFilter = overrideFilters?.searchContent ?? searchContent;
            const blogFilter = overrideFilters?.blogIdFilter ?? blogIdFilter;
            const pageNum = overrideFilters?.page ?? currentPage;
            
            const filters: AdminCommentFilters = {
                page: pageNum,
                size: pageSize,
                sortBy,
                sortDirection,
            };

            if (emailFilter) filters.userEmail = emailFilter;
            if (contentFilter) filters.content = contentFilter;
            if (blogFilter) filters.blogId = parseInt(blogFilter);
            if (dateFrom) filters.startDate = dateFrom;
            if (dateTo) filters.endDate = dateTo;

            let response;
            if (activeTab === 'flagged') {
                response = await adminModerationApi.getFlaggedCommentsPendingReview(filters);
            } else {
                response = await adminModerationApi.getAllComments(filters);
            }
            
            setComments(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error: any) {
            console.error('❌ Error fetching comments:', error);
            console.error('❌ Error response:', error.response?.data);
            if (comments.length > 0) {
                toast.error(error.response?.data?.message || error.message || 'Failed to fetch comments');
            }
            setComments([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStatistics = async () => {
        try {
            const stats = await adminModerationApi.getCommentStatistics();
            setStatistics(stats);
        } catch (error: any) {
            console.error('Error fetching statistics:', error);
            setStatistics(null);
        }
    };

    const fetchModerationStats = async () => {
        try {
            const stats = await adminModerationApi.getModerationStatistics();
            setModerationStats(stats);
        } catch (error: any) {
            console.error('Error fetching moderation statistics:', error);
            setModerationStats(null);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(0);
        fetchComments();
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
                const last7Days = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                setDateFrom(last7Days);
                setDateTo(today);
                break;
            case "30days":
                const last30Days = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
                setDateFrom(last30Days);
                setDateTo(today);
                break;
            case "90days":
                const last90Days = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
                setDateFrom(last90Days);
                setDateTo(today);
                break;
            case "all":
                setDateFrom("");
                setDateTo("");
                break;
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('Are you sure you want to permanently delete this comment?')) {
            return;
        }

        try {
            await adminModerationApi.deleteComment(commentId);
            toast.success('Comment deleted successfully');
            fetchComments();
            fetchStatistics();
            fetchModerationStats();
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            toast.error(error.message || 'Failed to delete comment');
        }
    };

    const handleHideComment = async (commentId: number) => {
        try {
            setComments(prev => prev.map(c => 
                c.id === commentId ? { ...c, isHidden: true } : c
            ));
            
            await adminModerationApi.hideComment(commentId);
            toast.success('Comment hidden successfully');
            await fetchComments();
        } catch (error: any) {
            console.error('Error hiding comment:', error);
            toast.error(error.message || 'Failed to hide comment');
            await fetchComments();
        }
    };

    const handleShowComment = async (commentId: number) => {
        try {
            setComments(prev => prev.map(c => 
                c.id === commentId ? { ...c, isHidden: false } : c
            ));
            
            await adminModerationApi.showComment(commentId);
            toast.success('Comment shown successfully');
            await fetchComments();
        } catch (error: any) {
            console.error('Error showing comment:', error);
            toast.error(error.message || 'Failed to show comment');
            await fetchComments();
        }
    };

    const handleApprove = async (commentId: number) => {
        try {
            await adminModerationApi.approveComment(commentId);
            toast.success('Comment approved and unflagged');
            fetchComments();
            fetchStatistics();
            fetchModerationStats();
        } catch (error: any) {
            console.error('Error approving comment:', error);
            toast.error(error.message || 'Failed to approve comment');
        }
    };

    const handleReject = async (commentId: number) => {
        if (!confirm('This will hide the comment from public view. Continue?')) {
            return;
        }

        try {
            await adminModerationApi.rejectComment(commentId);
            toast.success('Comment rejected and hidden');
            fetchComments();
            fetchStatistics();
            fetchModerationStats();
        } catch (error: any) {
            console.error('Error rejecting comment:', error);
            toast.error(error.message || 'Failed to reject comment');
        }
    };

    const handleUnflag = async (commentId: number) => {
        try {
            await adminModerationApi.unflagComment(commentId);
            toast.success('Comment unflagged (false positive)');
            fetchComments();
            fetchStatistics();
            fetchModerationStats();
        } catch (error: any) {
            console.error('Error unflagging comment:', error);
            toast.error(error.message || 'Failed to unflag comment');
        }
    };

    const getSeverityColor = (flagReason?: string) => {
        if (!flagReason) return 'gray';
        if (flagReason.includes('HIGH')) return 'red';
        if (flagReason.includes('MEDIUM')) return 'yellow';
        return 'green';
    };

    const getSeverityBadge = (flagReason?: string) => {
        if (!flagReason) return 'UNKNOWN';
        if (flagReason.includes('HIGH')) return 'HIGH';
        if (flagReason.includes('MEDIUM')) return 'MEDIUM';
        if (flagReason.includes('LOW')) return 'LOW';
        return 'UNKNOWN';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !comments.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards - Changes based on active tab */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {activeTab === 'flagged' && moderationStats ? (
                    /* Flagged Tab Statistics */
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                                <Clock className="w-4 h-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {moderationStats.pendingReviewComments}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Profanity Rules</CardTitle>
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {moderationStats.automationRules.totalProfanityWords}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Keywords detected</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Controversial</CardTitle>
                                <Shield className="w-4 h-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {moderationStats.automationRules.totalControversialKeywords}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Keywords detected</p>
                            </CardContent>
                        </Card>
                    </>
                ) : (
                    /* All Comments Tab Statistics */
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
                                <MessageSquare className="w-4 h-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-blue-600">
                                    {totalElements}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">In database</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Visible</CardTitle>
                                <Eye className="w-4 h-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    {comments.filter(c => !c.isHidden).length}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Public comments</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Hidden</CardTitle>
                                <EyeOff className="w-4 h-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    {comments.filter(c => c.isHidden).length}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Hidden by admin</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-8">
                    <button
                        onClick={() => {
                            setActiveTab('flagged');
                            setCurrentPage(0);
                            setSortBy('flaggedAt');
                            setSortDirection('DESC');
                        }}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'flagged'
                                ? 'border-orange-600 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <AlertTriangle className="w-5 h-5" />
                        Flagged Comments
                        {moderationStats && moderationStats.pendingReviewComments > 0 && (
                            <Badge variant="destructive">{moderationStats.pendingReviewComments}</Badge>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            setActiveTab('all');
                            setCurrentPage(0);
                            setSortBy('createdAt');
                            setSortDirection('DESC');
                        }}
                        className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                            activeTab === 'all'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        <MessageSquare className="w-5 h-5" />
                        All Comments
                    </button>
                </nav>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">User Email</label>
                                <Input
                                    placeholder="Search by email..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Comment Content</label>
                                <Input
                                    placeholder="Search by content..."
                                    value={searchContent}
                                    onChange={(e) => setSearchContent(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Blog ID</label>
                                <Input
                                    type="text"
                                    placeholder="Enter blog ID..."
                                    value={blogIdFilter}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || /^\d+$/.test(value)) {
                                            setBlogIdFilter(value);
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Duration</label>
                                <select
                                    value={duration}
                                    onChange={(e) => handleDurationChange(e.target.value)}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                                >
                                    <option value="all">All Time</option>
                                    <option value="today">Today</option>
                                    <option value="7days">Last 7 Days</option>
                                    <option value="30days">Last 30 Days</option>
                                    <option value="90days">Last 90 Days</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Date From</label>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => {
                                        setDateFrom(e.target.value);
                                        setDuration("all");
                                    }}
                                    max={dateTo || undefined}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Date To</label>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => {
                                        setDateTo(e.target.value);
                                        setDuration("all");
                                    }}
                                    min={dateFrom || undefined}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Sort By</label>
                                <select
                                    value={`${sortBy}-${sortDirection}`}
                                    onChange={(e) => {
                                        const [field, dir] = e.target.value.split('-');
                                        setSortBy(field as 'createdAt' | 'updatedAt' | 'flaggedAt');
                                        setSortDirection(dir as 'ASC' | 'DESC');
                                        setCurrentPage(0);
                                    }}
                                    className="w-full h-10 px-3 border border-gray-300 rounded-md"
                                >
                                    {activeTab === 'flagged' ? (
                                        <>
                                            <option value="flaggedAt-DESC">Recently Flagged</option>
                                            <option value="flaggedAt-ASC">Oldest Flagged</option>
                                            <option value="createdAt-DESC">Newest First</option>
                                            <option value="createdAt-ASC">Oldest First</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="createdAt-DESC">Newest First</option>
                                            <option value="createdAt-ASC">Oldest First</option>
                                            <option value="updatedAt-DESC">Recently Updated</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit">
                                <Search className="w-4 h-4 mr-2" />
                                Search
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setSearchEmail('');
                                    setBlogIdFilter('');
                                    setDateFrom('');
                                    setDateTo('');
                                    setDuration('all');
                                    setCurrentPage(0);
                                    fetchComments({ searchEmail: '', blogIdFilter: '', page: 0 });
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Comments List */}
            {activeTab === 'flagged' ? (
                /* Flagged Comments - Card View */
                <div className="space-y-4">
                    {comments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    All Clear! 🎉
                                </h3>
                                <p className="text-gray-600">
                                    No flagged comments pending review.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        comments.map((comment) => {
                            const severity = getSeverityBadge(comment.flagReason);
                            const severityColor = getSeverityColor(comment.flagReason);
                            
                            return (
                                <Card
                                    key={comment.id}
                                    className="border"
                                >
                                    <CardContent className="pt-6">
                                        {/* Header with user, post, date, severity and status */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3 text-xs text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {comment.userName}
                                                </span>
                                                <span>•</span>
                                                <Link
                                                    href={`/blog/${comment.blogId}`}
                                                    className="text-blue-600 hover:underline"
                                                    target="_blank"
                                                >
                                                    Post #{comment.blogId}
                                                </Link>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">
                                                    {formatDate(comment.createdAt)}
                                                </span>
                                                <Badge
                                                    variant={
                                                        severityColor === 'red' ? 'destructive' :
                                                        severityColor === 'yellow' ? 'default' :
                                                        'secondary'
                                                    }
                                                >
                                                    {severity === 'HIGH' && '🔴 HIGH'}
                                                    {severity === 'MEDIUM' && '🟡 MEDIUM'}
                                                    {severity === 'LOW' && '🟢 LOW'}
                                                </Badge>
                                                {comment.isHidden && (
                                                    <Badge variant="secondary" className="bg-red-100 text-red-800">
                                                        Hidden
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Comment Content */}
                                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                                            <p className="text-gray-900 text-sm">{comment.content}</p>
                                        </div>

                                        {/* Flag Reason */}
                                        {comment.flagReason && (
                                            <div className="bg-orange-50 border border-orange-200 p-2 rounded-md mb-3">
                                                <div className="flex items-start gap-2">
                                                    <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                                                    <div>
                                                        <p className="text-xs font-semibold text-orange-900">
                                                            {comment.flagReason}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions - Simplified: Only Hide/Show buttons */}
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => 
                                                    comment.isHidden 
                                                        ? handleShowComment(comment.id) 
                                                        : handleHideComment(comment.id)
                                                }
                                                variant={comment.isHidden ? "default" : "outline"}
                                                className="flex-1"
                                                size="sm"
                                            >
                                                {comment.isHidden ? (
                                                    <>
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Show
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="w-4 h-4 mr-2" />
                                                        Hide
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            ) : (
                /* All Comments - Table View */
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blog</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {comments.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center">
                                                {loading ? (
                                                    <p className="text-gray-500">Loading comments...</p>
                                                ) : (
                                                    <div>
                                                        <p className="text-gray-500 mb-2">No comments found</p>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                    comments.map((comment) => (
                                        <tr key={comment.id} className={comment.isHidden ? 'bg-gray-50' : ''}>
                                            <td className="px-6 py-4">
                                                <div className="max-w-md">
                                                    <p className="text-sm text-gray-900 line-clamp-3">{comment.content}</p>
                                                    {comment.isFlagged && (
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <AlertTriangle className="w-3 h-3 text-orange-600" />
                                                            <span className="text-xs text-orange-600 font-medium">Flagged</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-medium text-gray-900">{comment.userName}</p>
                                                    <p className="text-gray-500 text-xs">{comment.userEmail}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <Link
                                                        href={`/blog/${comment.blogId}`}
                                                        className="font-medium text-blue-600 hover:underline"
                                                        target="_blank"
                                                    >
                                                        {comment.blogTitle}
                                                    </Link>
                                                    <p className="text-gray-500 text-xs">ID: {comment.blogId}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {formatDate(comment.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={comment.isHidden ? "destructive" : "secondary"}>
                                                    {comment.isHidden ? "Hidden" : "Visible"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => 
                                                            comment.isHidden 
                                                                ? handleShowComment(comment.id) 
                                                                : handleHideComment(comment.id)
                                                        }
                                                    >
                                                        {comment.isHidden ? (
                                                            <>
                                                                <Eye className="w-4 h-4 mr-2" />
                                                                Show
                                                            </>
                                                        ) : (
                                                            <>
                                                                <EyeOff className="w-4 h-4 mr-2" />
                                                                Hide
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t">
                            <div className="text-sm text-gray-600">
                                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalElements)} of {totalElements} comments
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                >
                                    Previous
                                </Button>
                                <span className="px-4 py-2 text-sm">
                                    Page {currentPage + 1} of {totalPages}
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                                    disabled={currentPage >= totalPages - 1}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            )}
        </div>
    );
}
