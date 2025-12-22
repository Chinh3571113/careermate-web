'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Trash2,
    Calendar,
    User,
    Mail,
    Star,
    TrendingUp,
    BarChart3,
    Award,
    X
} from 'lucide-react';
import { adminModerationApi, type AdminRatingResponse, type AdminRatingFilters, type RatingStatistics } from '@/lib/admin-moderation-api';
import toast from 'react-hot-toast';

export default function RatingModeration() {
    const [ratings, setRatings] = useState<AdminRatingResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    
    // Filters
    const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'rating'>('createdAt');
    const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
    const [duration, setDuration] = useState<string>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [userEmail, setUserEmail] = useState<string>('');
    const [blogId, setBlogId] = useState<string>('');
    const [ratingValue, setRatingValue] = useState<string>('');

    const pageSize = 20;

    useEffect(() => {
        fetchRatings();
    }, [currentPage, sortBy, sortDirection, dateFrom, dateTo, userEmail, blogId, ratingValue]);

    const fetchRatings = async () => {
        try {
            setLoading(true);
            
            const filters: AdminRatingFilters = {
                page: currentPage,
                size: pageSize,
                sortBy,
                sortDirection,
                ...(dateFrom && { startDate: dateFrom }),
                ...(dateTo && { endDate: dateTo }),
                ...(userEmail && { userEmail }),
                ...(blogId && { blogId: parseInt(blogId) }),
                ...(ratingValue && { rating: parseInt(ratingValue) }),
            };

            const response = await adminModerationApi.getAllRatings(filters);
            
            setRatings(response.content);
            setTotalPages(response.totalPages);
            setTotalElements(response.totalElements);
        } catch (error: any) {
            console.error('Error fetching ratings:', error);
            if (ratings.length > 0) {
                toast.error(error.message || 'Failed to fetch ratings');
            }
            setRatings([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDurationChange = (newDuration: string) => {
        setDuration(newDuration);
        const today = new Date();
        
        switch(newDuration) {
            case 'today':
                const todayStr = today.toISOString().split('T')[0];
                setDateFrom(todayStr);
                setDateTo(todayStr);
                break;
            case '7days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                setDateFrom(sevenDaysAgo.toISOString().split('T')[0]);
                setDateTo(today.toISOString().split('T')[0]);
                break;
            case '30days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
                setDateTo(today.toISOString().split('T')[0]);
                break;
            case '90days':
                const ninetyDaysAgo = new Date(today);
                ninetyDaysAgo.setDate(today.getDate() - 90);
                setDateFrom(ninetyDaysAgo.toISOString().split('T')[0]);
                setDateTo(today.toISOString().split('T')[0]);
                break;
            case 'all':
            default:
                setDateFrom('');
                setDateTo('');
                break;
        }
        setCurrentPage(0);
    };

    const handleDeleteRating = async (ratingId: number) => {
        if (!confirm('Are you sure you want to permanently delete this rating?')) {
            return;
        }

        try {
            await adminModerationApi.deleteRating(ratingId);
            toast.success('Rating deleted successfully');
            fetchRatings();
        } catch (error: any) {
            console.error('Error deleting rating:', error);
            toast.error(error.message || 'Failed to delete rating');
        }
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

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (loading && !ratings.length) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* Duration Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Duration
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => handleDurationChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="all">All Time</option>
                                <option value="today">Today</option>
                                <option value="7days">Last 7 Days</option>
                                <option value="30days">Last 30 Days</option>
                                <option value="90days">Last 90 Days</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date From
                            </label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => {
                                    setDateFrom(e.target.value);
                                    setDuration('all');
                                    setCurrentPage(0);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        {/* Date To */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date To
                            </label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => {
                                    setDateTo(e.target.value);
                                    setDuration('all');
                                    setCurrentPage(0);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        {/* User Email Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                User Email
                            </label>
                            <input
                                type="text"
                                value={userEmail}
                                onChange={(e) => {
                                    setUserEmail(e.target.value);
                                    setCurrentPage(0);
                                }}
                                placeholder="Search by email..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        {/* Blog ID Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Blog ID
                            </label>
                            <input
                                type="text"
                                value={blogId}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === '' || /^\d+$/.test(value)) {
                                        setBlogId(value);
                                        setCurrentPage(0);
                                    }
                                }}
                                placeholder="Enter blog ID..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                        </div>

                        {/* Star Rating Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Star Rating
                            </label>
                            <select
                                value={ratingValue}
                                onChange={(e) => {
                                    setRatingValue(e.target.value);
                                    setCurrentPage(0);
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All Ratings</option>
                                <option value="5">⭐⭐⭐⭐⭐ (5 stars)</option>
                                <option value="4">⭐⭐⭐⭐ (4 stars)</option>
                                <option value="3">⭐⭐⭐ (3 stars)</option>
                                <option value="2">⭐⭐ (2 stars)</option>
                                <option value="1">⭐ (1 star)</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ratings List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Rating Moderation ({totalElements} total)</span>
                        <select
                            value={`${sortBy}-${sortDirection}`}
                            onChange={(e) => {
                                const [field, dir] = e.target.value.split('-');
                                setSortBy(field as 'createdAt' | 'updatedAt' | 'rating');
                                setSortDirection(dir as 'ASC' | 'DESC');
                                setCurrentPage(0);
                            }}
                            className="text-sm px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="createdAt-DESC">Newest First</option>
                            <option value="createdAt-ASC">Oldest First</option>
                            <option value="rating-DESC">Highest Rating</option>
                            <option value="rating-ASC">Lowest Rating</option>
                        </select>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Rating
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Blog
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center">
                                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </td>
                                    </tr>
                                ) : ratings.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No ratings found
                                        </td>
                                    </tr>
                                ) : (
                                    ratings.map((rating) => (
                                        <tr key={rating.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                                                        <User className="w-3 h-3" />
                                                        {rating.userName}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                                        <Mail className="w-3 h-3" />
                                                        {rating.userEmail}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {renderStars(rating.rating)}
                                                    <span className="text-sm font-medium text-gray-700">
                                                        {rating.rating}/5
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs">
                                                    <p className="text-sm text-gray-900 line-clamp-1">{rating.blogTitle}</p>
                                                    <p className="text-xs text-gray-500">ID: {rating.blogId}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Calendar className="w-3 h-3" />
                                                    {formatDate(rating.createdAt)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end">
                                                    <button
                                                        onClick={() => handleDeleteRating(rating.id)}
                                                        title="Delete rating"
                                                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M3 6h18" />
                                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        </svg>
                                                        Delete
                                                    </button>
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
                        <div className="flex items-center justify-between mt-6 pt-4 border-t">
                            <div className="text-sm text-gray-600">
                                Showing page {currentPage + 1} of {totalPages}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                                    disabled={currentPage === 0}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
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
        </div>
    );
}
