"use client";

import Link from "next/link";
import { type SavedJobFeedback } from "@/lib/job-api";
import { getDaysDiff } from "@/lib/my-jobs-utils";
import { CompanyLogoPlaceholder, TimeCircleIcon } from "@/components/ui/icons";

interface RecentJobsTabProps {
    viewedJobs: SavedJobFeedback[];
}

const RecentJobsTab = ({ viewedJobs }: RecentJobsTabProps) => {
    return (
        <div>
            {/* Viewed Jobs List */}
            {viewedJobs.length > 0 && (
                <div className="space-y-4">
                    {viewedJobs.map((job) => {
                        const viewedDays = getDaysDiff(job.createdAt);

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
                                        <Link
                                            href={`/jobs-detail?id=${job.jobId}`}
                                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors block mb-2"
                                        >
                                            {job.jobTitle}
                                        </Link>

                                        <p className="text-gray-700 mb-2">{job.candidateName}</p>

                                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mb-3">
                                            <span>{job.candidateName}</span>
                                            <span>•</span>
                                            <span>At office</span>
                                        </div>

                                        <div className="salary-badge">
                                            💰 Salary Range
                                        </div>
                                    </div>

                                    {/* Right Side - Viewed Info and Actions */}
                                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                        <div className="text-right text-sm">
                                            <p className="text-gray-600">Viewed {viewedDays} days ago</p>
                                        </div>

                                        <Link
                                            href={`/jobs-detail?id=${job.jobId}`}
                                            className="px-6 py-2 border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors font-medium"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Empty state */}
            {viewedJobs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="bg-gray-200 p-4 rounded-lg mb-4">
                        <TimeCircleIcon className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-6">
                        No recently viewed jobs to display.
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

export default RecentJobsTab;
