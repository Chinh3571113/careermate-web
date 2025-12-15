"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, CircleDollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { type SavedJobFeedback, type JobPosting, unsaveJob, fetchJobPostingById } from "@/lib/job-api";
import { getDaysDiff } from "@/lib/my-jobs-utils";
import { InfoIcon, CompanyLogoPlaceholder, BookmarkIcon } from "@/components/ui/icons";
import { AiFillStar } from "react-icons/ai";

interface SavedJobsTabProps {
    savedJobs: SavedJobFeedback[];
    candidateId: number | null;
    onJobUnsaved: (jobId: number) => void;
}

interface EnrichedSavedJob extends SavedJobFeedback {
    jobDetails?: JobPosting | null;
}

const SavedJobsTab = ({ savedJobs, candidateId, onJobUnsaved }: SavedJobsTabProps) => {
    const [localSavedJobs, setLocalSavedJobs] = useState<EnrichedSavedJob[]>(savedJobs);
    const [loading, setLoading] = useState(true);

    // Fetch job details for all saved jobs
    useEffect(() => {
        const fetchJobDetails = async () => {
            setLoading(true);
            const enrichedJobs = await Promise.all(
                savedJobs.map(async (job) => {
                    const jobDetails = await fetchJobPostingById(job.jobId);
                    return {
                        ...job,
                        jobDetails
                    };
                })
            );
            setLocalSavedJobs(enrichedJobs);
            setLoading(false);
        };

        fetchJobDetails();
    }, [savedJobs]);

    const handleUnsaveJob = async (jobId: number) => {
        if (!candidateId) {
            toast.error("Please login to unsave jobs");
            return;
        }

        try {
            await unsaveJob(candidateId, jobId);
            setLocalSavedJobs(prev => prev.filter(job => job.jobId !== jobId));
            onJobUnsaved(jobId);
            toast.success("Job removed from saved");
        } catch (error: any) {
            toast.error('Failed to remove job from saved');
        }
    };

    return (
        <div>
            {/* Header with info and sort */}
            <div className="flex items-center justify-between mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <InfoIcon />
                    <span>You can save up to 20 jobs.</span>
                </div>
                <div className="flex items-center gap-2">
                    <span>Sort by:</span>
                    <button className="font-medium text-gray-900 flex items-center gap-1">
                        Nearest expiration time
                        <ChevronDown className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Saved Jobs List */}
            {localSavedJobs.length > 0 && (
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading job details...</div>
                    ) : (
                        localSavedJobs.map((job) => {
                            const jobDetails = job.jobDetails;
                            const postedDays = getDaysDiff(jobDetails?.postTime || job.createdAt);
                            
                            // Calculate expiry days from actual expirationDate
                            let expiresInDays = 0;
                            if (jobDetails?.expirationDate) {
                                const expiryDate = new Date(jobDetails.expirationDate);
                                expiresInDays = Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
                            }

                            const companyName = jobDetails?.recruiterInfo?.companyName || "Company";
                            const location = jobDetails?.address || "Location not available";
                            const salaryRange = jobDetails?.salaryRange || "Negotiable";

                            return (
                                <div
                                    key={job.id}
                                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Company Logo */}
                                        <CompanyLogoPlaceholder />

                                        {/* Job Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <Link
                                                    href={`/jobs-detail?id=${job.jobId}`}
                                                    className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                                                >
                                                    {job.jobTitle}
                                                </Link>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-md text-sm font-medium border border-emerald-200">
                                                    <CircleDollarSign className="w-4 h-4" />
                                                    <span>{salaryRange}</span>
                                                </div>
                                            </div>

                                            <p className="text-gray-700 font-medium mb-2">{companyName}</p>

                                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                                <span>{location}</span>
                                            </div>
                                        </div>

                                        {/* Right Side - Posted Info and Actions */}
                                        <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
                                            <div className="text-right text-sm">
                                                <p className="text-gray-600">Posted {postedDays} {postedDays === 1 ? 'day' : 'days'} ago</p>
                                                {jobDetails?.expirationDate && (
                                                    <p className="text-orange-500">(Expires in {expiresInDays} {expiresInDays === 1 ? 'day' : 'days'})</p>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/jobs-detail/${job.jobId}/apply`}
                                                    className="px-6 py-2.5 bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-md font-medium hover:from-[#3a4660] hover:to-[#3a4660] transition-colors"
                                                >
                                                    Apply Now
                                                </Link>
                                                <button
                                                    onClick={() => handleUnsaveJob(job.jobId)}
                                                    className="p-2.5 border-2 border-yellow-500 bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                                                    title="Remove from saved"
                                                >
                                                    <AiFillStar className="w-6 h-6 text-yellow-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {/* Empty state */}
            {localSavedJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-gray-200 p-4 rounded-lg mb-4">
                        <BookmarkIcon className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-6">
                        You haven't saved any jobs yet.
                    </p>
                    <Link
                        href="/jobs-detail"
                        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
                    >
                        Explore jobs
                    </Link>
                </div>
            )}
        </div>
    );
};

export default SavedJobsTab;
