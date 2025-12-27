"use client";

import { 
    Users, 
    Briefcase, 
    Eye, 
    TrendingUp, 
    Calendar, 
    Search, 
    User, 
    CheckCircle, 
    Package, 
    X, 
    Sparkles, 
    FileBarChart, 
    UserCircle 
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRecruiterInvoice, formatRelativeTime, formatInvoicePrice, type RecruiterInvoice } from "@/lib/recruiter-invoice-api";
import {
    getRecruiterStats,
    getRecruiterProfile,
    getRecruiterJobPostings,
    getRecruiterApplicationsFiltered,
    type JobPostingStats,
    type RecruiterProfileData,
    type RecruiterJobPosting,
    type JobApplication
} from "@/lib/recruiter-api";

// ✅ Reusable QuickActionCard Component
interface QuickActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
}

function QuickActionCard({ title, description, icon, onClick, variant = 'secondary' }: QuickActionCardProps) {
    const isPrimary = variant === 'primary';
    
    return (
        <button
            onClick={onClick}
            className={`group relative overflow-hidden rounded-xl p-6 text-left transition-all duration-200 ${
                isPrimary
                    ? 'bg-gradient-to-br from-[#24497b] to-[#436a9d] text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                    : 'bg-white border-2 border-sky-100 hover:border-sky-300 shadow-sm hover:shadow-md'
            }`}
        >
            {/* Icon */}
            <div className={`mb-4 inline-flex items-center justify-center rounded-lg p-3 ${
                isPrimary 
                    ? 'bg-white/20' 
                    : 'bg-gradient-to-br from-sky-50 to-blue-50'
            }`}>
                {icon}
            </div>

            {/* Content */}
            <h3 className={`text-lg font-semibold mb-2 ${
                isPrimary ? 'text-white' : 'text-gray-900'
            }`}>
                {title}
            </h3>
            <p className={`text-sm ${
                isPrimary ? 'text-white/90' : 'text-gray-600'
            }`}>
                {description}
            </p>

            {/* Arrow indicator */}
            <div className={`absolute bottom-4 right-4 transition-transform group-hover:translate-x-1 ${
                isPrimary ? 'text-white/70' : 'text-sky-400'
            }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
            </div>
        </button>
    );
}

// ✅ Helper: Check if job is expired (client-side check)
function isJobExpired(expirationDate: string): boolean {
    const expDate = new Date(expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expDate.setHours(0, 0, 0, 0);
    return expDate < today;
}

// ✅ Helper: Get effective job status (handles backend ACTIVE + expired case)
function getEffectiveJobStatus(job: RecruiterJobPosting): string {
    if (job.status === 'ACTIVE' && isJobExpired(job.expirationDate)) {
        return 'EXPIRED';
    }
    return job.status;
}

export default function RecruiterDashboardPage() {
    const router = useRouter();

    // Invoice data
    const [invoice, setInvoice] = useState<RecruiterInvoice | null>(null);
    const [loadingInvoice, setLoadingInvoice] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    // Stats data (✅ CONNECTED TO API)
    const [stats, setStats] = useState<JobPostingStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);

    // Profile data (✅ CONNECTED TO API)
    const [profile, setProfile] = useState<RecruiterProfileData | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // Recent jobs data (✅ NEW - CONNECTED TO API)
    const [recentJobs, setRecentJobs] = useState<RecruiterJobPosting[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(true);

    // Recent applications/candidates data (✅ NEW - CONNECTED TO API)
    const [recentApplications, setRecentApplications] = useState<JobApplication[]>([]);
    const [loadingApplications, setLoadingApplications] = useState(true);

    // Fetch invoice
    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const data = await getRecruiterInvoice();
                setInvoice(data);
            } catch (error: any) {
                if (error.message !== 'NO_INVOICE_FOUND') {
                    console.error('Failed to fetch invoice:', error);
                }
            } finally {
                setLoadingInvoice(false);
            }
        };
        fetchInvoice();
    }, []);

    // Fetch recruiter stats (✅ SAFE - handles API errors gracefully)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await getRecruiterStats();
                if (response?.result) {
                    setStats(response.result);
                } else {
                    console.error('[Dashboard Stats] Unexpected API response structure:', response);
                    setStats(null);
                }
            } catch (error) {
                console.error('[Dashboard Stats] Failed to fetch recruiter stats:', error);
                setStats(null); // Graceful degradation
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    // Fetch recruiter profile (✅ SAFE - handles API errors gracefully)
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await getRecruiterProfile();
                if (response?.result) {
                    setProfile(response.result);
                } else {
                    console.error('[Dashboard Profile] Unexpected API response structure:', response);
                    setProfile(null);
                }
            } catch (error) {
                console.error('[Dashboard Profile] Failed to fetch recruiter profile:', error);
                setProfile(null); // Graceful degradation
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, []);

    // Fetch recent job postings (✅ SAFE - handles both paginated and direct array responses)
    useEffect(() => {
        const fetchRecentJobs = async () => {
            try {
                const response = await getRecruiterJobPostings({ page: 0, size: 3 });
                
                // Safely handle paginated response (result.content) or direct array (result)
                if (response?.result) {
                    if (Array.isArray(response.result)) {
                        // Direct array response
                        setRecentJobs(response.result.slice(0, 3));
                    } else if (response.result.content && Array.isArray(response.result.content)) {
                        // Paginated response
                        setRecentJobs(response.result.content);
                    } else {
                        console.error('[Dashboard Jobs] Unexpected API response structure:', response);
                        setRecentJobs([]);
                    }
                } else {
                    console.error('[Dashboard Jobs] Invalid response:', response);
                    setRecentJobs([]);
                }
            } catch (error) {
                console.error('[Dashboard Jobs] Failed to fetch recent jobs:', error);
                setRecentJobs([]); // Graceful degradation
            } finally {
                setLoadingJobs(false);
            }
        };
        fetchRecentJobs();
    }, []);

    // Fetch recent applications (✅ SAFE - handles both response types and safe date sorting)
    useEffect(() => {
        const fetchRecentApplications = async () => {
            try {
                const response = await getRecruiterApplicationsFiltered({ page: 0, size: 5 });
                
                // Safely handle paginated response or direct array
                let applications: JobApplication[] = [];
                
                if (response?.result) {
                    if (Array.isArray(response.result)) {
                        // Direct array response
                        applications = response.result;
                    } else if ((response.result as any).content && Array.isArray((response.result as any).content)) {
                        // Paginated response
                        applications = (response.result as any).content;
                    } else {
                        console.error('[Dashboard Applications] Unexpected API response structure:', response);
                    }
                }
                
                // Sort by most recent with safe date handling (fallback to 0 if invalid)
                const sorted = applications.sort((a, b) => {
                    const dateA = a?.createAt ? new Date(a.createAt).getTime() : 0;
                    const dateB = b?.createAt ? new Date(b.createAt).getTime() : 0;
                    return dateB - dateA;
                });
                
                setRecentApplications(sorted.slice(0, 5));
            } catch (error) {
                console.error('[Dashboard Applications] Failed to fetch recent applications:', error);
                setRecentApplications([]); // Graceful degradation
            } finally {
                setLoadingApplications(false);
            }
        };
        fetchRecentApplications();
    }, []);

    const handleClick = () => {
        router.push("/recruiter/jobs/create");
    };

    return (
        <>
            {/* ==================== SECTION 1: Welcome Banner ==================== */}
            <div className="mb-6 bg-gradient-to-r from-[#e8f1fe] to-[#ccdff9] rounded-lg p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-[#313131] mb-3">
                            Hello, <span className="text-[#ff2f2f]">
                                {loadingProfile ? '...' : (profile?.username || profile?.contactPerson || 'Recruiter')}
                            </span> welcome to CareerMate! 🎉
                        </h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    <div className="lg:col-span-2">
                        <p className="text-[#313131] mb-4">
                            You have successfully registered! Start hiring the best talent for your company.
                        </p>
                    </div>
                    <div className="lg:col-span-1">
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <img src="/img/dashboard1.png" alt="Dashboard 1" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== SECTION 2: Quick Actions (MOVED TO TOP) ==================== */}
            {/* Responsive: 3 cols on desktop, 2 on tablet, 1 on mobile */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Primary Action - Post a Job */}
                    <QuickActionCard
                        title="Post a New Job"
                        description="Create and publish job postings to attract top candidates"
                        icon={<Sparkles className="h-6 w-6 text-white" />}
                        onClick={() => router.push('/recruiter/recruiter-feature/jobs/create')}
                        variant="primary"
                    />
                    
                    {/* Secondary Actions */}
                    <QuickActionCard
                        title="View Applications"
                        description="Review and manage candidate applications"
                        icon={<FileBarChart className="h-6 w-6 text-sky-600" />}
                        onClick={() => router.push('/recruiter/recruiter-feature/jobs/applications')}
                    />
                    
                    <QuickActionCard
                        title="Complete Profile"
                        description="Update your company information and branding"
                        icon={<UserCircle className="h-6 w-6 text-sky-600" />}
                        onClick={() => router.push('/recruiter/recruiter-feature/profile/organization')}
                    />
                </div>
            </div>

            {/* ==================== SECTION 3: KPI Stats Cards ==================== */}
            <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <div className="flex items-center">
                        <div className="rounded-full bg-blue-100 p-3">
                            <Briefcase className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Jobs Posted</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loadingStats ? '...' : (stats?.totalJobPostings || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <div className="flex items-center">
                        <div className="rounded-full bg-green-100 p-3">
                            <Users className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Total Applications</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loadingStats ? '...' : (stats?.totalApplications || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <div className="flex items-center">
                        <div className="rounded-full bg-yellow-100 p-3">
                            <Eye className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Active Jobs</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loadingStats ? '...' : (stats?.activeJobPostings || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <div className="flex items-center">
                        <div className="rounded-full bg-purple-100 p-3">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">Hired Candidate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {loadingStats ? '...' : (stats?.hiredApplications || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ==================== SECTION 4: Job Post Status | Application Status ==================== */}
            {/* Paired side-by-side for visual balance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left: Job Post Status */}
                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Job Post Status</h3>
                    {loadingStats ? (
                        <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="p-3">
                                    <div className="text-xl font-bold text-green-500">{stats?.activeJobPostings || 0}</div>
                                    <div className="text-sm text-gray-600">Live</div>
                                </div>
                                <div className="p-3">
                                    <div className="text-xl font-bold text-gray-500">{stats?.pausedJobPostings || 0}</div>
                                    <div className="text-sm text-gray-600">Paused</div>
                                </div>
                                <div className="p-3">
                                    <div className="text-xl font-bold text-gray-500">{stats?.pendingJobPostings || 0}</div>
                                    <div className="text-sm text-gray-600">Pending</div>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                                <div className="p-3">
                                    <div className="text-xl font-bold text-orange-500">{stats?.totalJobPostings || 0}</div>
                                    <div className="text-sm text-gray-600">Total</div>
                                </div>
                                <div className="p-3">
                                    <div className="text-xl font-bold text-red-500">{stats?.expiredJobPostings || 0}</div>
                                    <div className="text-sm text-gray-600">Expired</div>
                                </div>
                                <div className="p-3">
                                    <div className="text-xl font-bold text-yellow-500">{stats?.rejectedJobPostings || 0}</div>
                                    <div className="text-sm text-gray-600">Rejected</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>


                {/* Right: Application Status */}
                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Application Status</h3>
                    {loadingStats ? (
                        <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        </div>
                    ) : stats ? (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Submitted</span>
                                <span className="text-lg font-bold text-blue-600">{stats.submittedApplications || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Reviewing</span>
                                <span className="text-lg font-bold text-yellow-600">{stats.reviewingApplications || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Interview Scheduled</span>
                                <span className="text-lg font-bold text-purple-600">{stats.interviewScheduledApplications || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Hired</span>
                                <span className="text-lg font-bold text-green-600">{stats.hiredApplications || 0}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Search className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                            <p className="text-sm text-gray-500">No application data</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== SECTION 5: Recent Jobs | Recent Applications ==================== */}
            {/* Paired side-by-side for easy comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Left: Recent Job Postings */}
                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Job Postings</h3>
                        <button
                            onClick={() => router.push('/recruiter/recruiter-feature/jobs/active')}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            View All →
                        </button>
                    </div>

                    {loadingJobs ? (
                        <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-3">Loading jobs...</p>
                        </div>
                    ) : recentJobs.length > 0 ? (
                        <div className="space-y-3">
                            {recentJobs.map((job) => {
                                const effectiveStatus = getEffectiveJobStatus(job);
                                const isExpired = effectiveStatus === 'EXPIRED';
                                
                                return (
                                    <div
                                        key={job.id}
                                        className="group border rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer"
                                        onClick={() => router.push('/recruiter/recruiter-feature/jobs/active')}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                router.push('/recruiter/recruiter-feature/jobs/active');
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    {job.title}
                                                </h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {job.address} • {job.workModel}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                                        effectiveStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        effectiveStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                        effectiveStatus === 'PAUSED' ? 'bg-gray-100 text-gray-700' :
                                                        effectiveStatus === 'EXPIRED' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {effectiveStatus}
                                                    </span>
                                                    {isExpired && job.status === 'ACTIVE' && (
                                                        <span className="text-xs text-orange-600 italic">Auto-expired</span>
                                                    )}
                                                    <span className="text-xs text-gray-500">
                                                        {job.createAt ? new Date(job.createAt).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Arrow indicator */}
                                            <div className="ml-3 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Briefcase className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No jobs posted yet</p>
                            <button
                                onClick={() => router.push('/recruiter/recruiter-feature/jobs/create')}
                                className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Create your first job →
                            </button>
                        </div>
                    )}
                </div>

                {/* Right: Recent Applications */}
                <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Recent Applications</h3>
                        {recentApplications.length > 0 && (
                            <button
                                onClick={() => router.push('/recruiter/recruiter-feature/jobs/applications')}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                                View All →
                            </button>
                        )}
                    </div>

                    {loadingApplications ? (
                        <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-3">Loading applications...</p>
                        </div>
                    ) : recentApplications.length > 0 ? (
                        <div className="space-y-3">
                            {recentApplications.slice(0, 3).map((application) => (
                                <div
                                    key={application.id}
                                    className="group border rounded-lg p-4 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer"
                                    onClick={() => router.push('/recruiter/recruiter-feature/jobs/applications')}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            router.push('/recruiter/recruiter-feature/jobs/applications');
                                        }
                                    }}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                                            <User className="h-6 w-6 text-blue-600 group-hover:text-purple-700 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-gray-900 truncate group-hover:text-purple-700 transition-colors">
                                                {application.fullName || 'Candidate'}
                                            </h4>
                                            <p className="text-sm text-gray-600 truncate">
                                                {application.jobTitle}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${application.status === 'WORKING' ? 'bg-green-100 text-green-700' :
                                                    application.status === 'OFFER_EXTENDED' ? 'bg-emerald-100 text-emerald-700' :
                                                        application.status === 'INTERVIEW_SCHEDULED' ? 'bg-purple-100 text-purple-700' :
                                                            application.status === 'INTERVIEWED' ? 'bg-indigo-100 text-indigo-700' :
                                                                application.status === 'REVIEWING' ? 'bg-yellow-100 text-yellow-700' :
                                                                    application.status === 'APPROVED' ? 'bg-cyan-100 text-cyan-700' :
                                                                        application.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                                            application.status === 'WITHDRAWN' ? 'bg-gray-100 text-gray-700' :
                                                                                'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {application.status.replace(/_/g, ' ')}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {formatRelativeTime(application.createAt)}
                                                </span>
                                            </div>
                                        </div>
                                        {/* Arrow indicator */}
                                        <div className="text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all flex-shrink-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                                <Users className="h-10 w-10 text-gray-300" />
                            </div>
                            <p className="text-gray-500 font-medium">No applications yet</p>
                            <p className="text-sm text-gray-400 mt-1">Applications will appear here when candidates apply</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ==================== SECTION 6: Recent Activity (Log-style, Bottom) ==================== */}
            <div className="rounded-lg bg-white p-6 shadow-sm shadow-sky-100">
                <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Activity</h3>

                {loadingInvoice ? (
                    <div className="text-center py-8">
                        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-sm text-gray-500 mt-3">Loading activities...</p>
                    </div>
                ) : invoice ? (
                    <div className="space-y-3">
                        {/* Package Purchase Activity */}
                        <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Package Upgraded
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Successfully upgraded to <span className="font-semibold text-blue-600">{invoice.packageName}</span> package
                                            </p>
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="text-sm text-gray-500">
                                                    Amount: <span className="font-medium text-gray-700">{formatInvoicePrice(invoice.amount)}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                Active
                                            </span>
                                            <button
                                                onClick={() => setShowDetails(true)}
                                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                                                title="View details"
                                            >
                                                <Eye className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {formatRelativeTime(invoice.startDate)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Popup */}
                        {showDetails && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowDetails(false)}>
                                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all" onClick={(e) => e.stopPropagation()}>
                                    {/* Header */}
                                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                                                <Package className="h-5 w-5 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900">Package Details</h3>
                                                <p className="text-xs text-gray-500">Current subscription information</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowDetails(false)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            <X className="h-5 w-5 text-gray-500" />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 space-y-4">
                                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                            <span className="text-sm text-gray-600 font-medium">Package Name</span>
                                            <span className="text-sm font-bold text-gray-900 bg-blue-50 px-3 py-1 rounded-full">{invoice.packageName}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                            <span className="text-sm text-gray-600 font-medium">Amount Paid</span>
                                            <span className="text-sm font-bold text-green-600">{formatInvoicePrice(invoice.amount)}</span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                            <span className="text-sm text-gray-600 font-medium">Start Date</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {new Date(invoice.startDate).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                            <span className="text-sm text-gray-600 font-medium">Valid Until</span>
                                            <span className="text-sm font-semibold text-gray-900">
                                                {new Date(invoice.endDate).toLocaleDateString('vi-VN', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-3">
                                            <span className="text-sm text-gray-600 font-medium">Status</span>
                                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                                                Active & Valid
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                                        <button
                                            onClick={() => {
                                                setShowDetails(false);
                                                router.push('/recruiter/recruiter-feature/profile/billing');
                                            }}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                        >
                                            Manage Billing
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mx-auto mb-4 h-32 w-32 rounded-full bg-gray-100 flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-300" />
                        </div>
                        <p className="text-gray-500 font-medium">No recent activity</p>
                        <p className="text-sm text-gray-400 mt-1">Your activities will be displayed here</p>
                        <button
                            onClick={() => router.push('/recruiter/recruiter-feature/profile/billing')}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Upgrade your package →
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}