"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { RefreshCw, AlertCircle } from "lucide-react";
import { getRecruiterJobPostings } from "@/lib/recruiter-api";
import toast from "react-hot-toast";

/**
 * Edit Job Page - Redirects to create page with edit data in sessionStorage
 * This ensures consistent UI/UX between create and edit flows
 */
export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = parseInt(params.id as string);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAndRedirect = async () => {
      try {
        setIsLoading(true);
        
        // Fetch all recruiter jobs and find the one with matching ID
        const response = await getRecruiterJobPostings({ page: 0, size: 100 });
        
        if (response.code === 0 || response.code === 200) {
          const foundJob = response.result.content.find((j) => j.id === jobId);
          
          if (foundJob) {
            // Check if job can be edited (PENDING or REJECTED only)
            if (foundJob.status === "ACTIVE" || foundJob.status === "EXPIRED") {
              toast.error(`Cannot fully edit ${foundJob.status} job. Only expiration date can be changed.`);
              router.push("/recruiter/recruiter-feature/jobs/active");
              return;
            }
            
            // Store job data in sessionStorage for the create page to pick up
            sessionStorage.setItem('editJobData', JSON.stringify(foundJob));
            
            // Redirect to create page
            toast.success("Opening edit form...");
            router.push("/recruiter/recruiter-feature/jobs/create");
          } else {
            setError("Job posting not found");
            toast.error("Job posting not found");
          }
        } else {
          setError(response.message || "Failed to load job");
          toast.error(response.message || "Failed to load job");
        }
      } catch (err: any) {
        console.error("Error loading job:", err);
        setError(err.message || "Failed to load job");
        toast.error(err.message || "Failed to load job");
      } finally {
        setIsLoading(false);
      }
    };

    loadAndRedirect();
  }, [jobId, router]);

  if (isLoading) {
    return (
      <div className="p-4 sm:p-0">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 text-sky-600 animate-spin mb-4" />
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-0">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <button
            onClick={() => router.push("/recruiter/recruiter-feature/jobs/create")}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return null;
}
