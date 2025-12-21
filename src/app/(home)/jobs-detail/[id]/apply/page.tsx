"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { FiUpload, FiFile, FiChevronDown, FiCheck } from "react-icons/fi";
import { submitJobApplication } from "@/lib/job-apply-api";
import { fetchJobPostingById, transformJobPosting, submitApplyFeedback } from "@/lib/job-api";
import { useAuthStore } from "@/store/use-auth-store";
import { uploadJobApplicationCV } from "@/lib/firebase-upload";
import { resumeService, Resume } from "@/services/resumeService";
import toast from "react-hot-toast";

interface JobDetails {
  id: number;
  title: string;
  company: string;
  companyLogo?: string;
  salaryRange?: string;
  location: string;
  jobType: string;
}

interface CVOption {
  id: string;
  name: string;
  url: string;
  isDefault: boolean;
  type: "UPLOAD" | "WEB" | "DRAFT";
  updatedAt?: string;
}

export default function JobApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.id as string;
  const { user, candidateId, fetchCandidateProfile } = useAuthStore();

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [showConfirmQuit, setShowConfirmQuit] = useState(false);
  
  // CV selection state
  const [cvOptions, setCvOptions] = useState<CVOption[]>([]);
  const [selectedCvId, setSelectedCvId] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUploadMode, setIsUploadMode] = useState(false);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isLoadingCVs, setIsLoadingCVs] = useState(true);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    preferredLocation: "",
    coverLetter: "",
  });

  const [errors, setErrors] = useState({
    fullName: "",
    phoneNumber: "",
    preferredLocation: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingJob, setIsLoadingJob] = useState(true);

  // Fetch real job details from API
  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!jobId) return;

      setIsLoadingJob(true);
      try {
        console.log("📋 Fetching job details for ID:", jobId);
        const response = await fetchJobPostingById(parseInt(jobId));

        if (response) {
          const transformedJob = transformJobPosting(response);

          setJobDetails({
            id: transformedJob.id,
            title: transformedJob.title,
            company: transformedJob.company,
            companyLogo: transformedJob.companyLogo,
            salaryRange: transformedJob.salaryRange,
            location: transformedJob.location,
            jobType: transformedJob.jobType,
          });

          console.log("✅ Job details loaded:", transformedJob);
        }
      } catch (error) {
        console.error("❌ Error fetching job details:", error);
        toast.error("Failed to load job details");

        // Fallback to basic info with jobId
        setJobDetails({
          id: parseInt(jobId),
          title: "Job Position",
          company: "Company",
          location: "Location",
          jobType: "Full time",
        });
      } finally {
        setIsLoadingJob(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  // Fetch user's CVs
  useEffect(() => {
    const fetchUserCVs = async () => {
      if (!user) return;

      setIsLoadingCVs(true);
      try {
        console.log("📄 Fetching user CVs...");
        const resumes = await resumeService.fetchResumes();
        
        // Convert resumes to CV options
        const options: CVOption[] = resumes
          .filter((r: Resume) => r.resumeUrl && r.type !== "DRAFT") // Only show CVs with URL and not draft
          .map((r: Resume) => ({
            id: r.resumeId.toString(),
            name: r.type === "WEB" 
              ? `CareerMate CV #${r.resumeId}` 
              : `Uploaded CV #${r.resumeId}`,
            url: r.resumeUrl,
            isDefault: r.isActive,
            type: r.type,
            updatedAt: r.createdAt,
          }));

        setCvOptions(options);
        
        // Auto-select default CV
        const defaultCV = options.find(cv => cv.isDefault);
        if (defaultCV) {
          setSelectedCvId(defaultCV.id);
        } else if (options.length > 0) {
          setSelectedCvId(options[0].id);
        }

        console.log("✅ CVs loaded:", options);
      } catch (error) {
        console.error("❌ Error fetching CVs:", error);
        // Don't show error toast, just let user upload new CV
      } finally {
        setIsLoadingCVs(false);
      }
    };

    fetchUserCVs();
  }, [user]);

  // Auto-fill user info when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phoneNumber || "",
        preferredLocation: "",
        coverLetter: "",
      });
    }

    // Fetch candidate profile if not already loaded
    if (user && !candidateId) {
      console.log("📝 CandidateId not in store, fetching profile...");
      fetchCandidateProfile();
    }
  }, [user, candidateId, fetchCandidateProfile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file
      const maxSize = 3 * 1024 * 1024; // 3MB
      if (file.size > maxSize) {
        toast.error("File size must not exceed 3MB");
        return;
      }

      const allowedTypes = [".doc", ".docx", ".pdf"];
      const fileExtension = file.name.substring(file.name.lastIndexOf("."));
      if (!allowedTypes.includes(fileExtension.toLowerCase())) {
        toast.error("Please upload .doc, .docx, or .pdf file");
        return;
      }

      setCvFile(file);
      setIsUploadMode(true);
      setSelectedCvId(""); // Clear selected CV when uploading new
    }
  };

  const handleSelectCV = (cvId: string) => {
    setSelectedCvId(cvId);
    setIsUploadMode(false);
    setCvFile(null);
    setIsDropdownOpen(false);
  };

  const handleUploadNewClick = () => {
    setIsUploadMode(true);
    setSelectedCvId("");
    setIsDropdownOpen(false);
  };

  const getSelectedCVName = () => {
    if (isUploadMode && cvFile) {
      return cvFile.name;
    }
    const selected = cvOptions.find(cv => cv.id === selectedCvId);
    if (selected) {
      return selected.isDefault ? `${selected.name} (Default)` : selected.name;
    }
    return "Select a CV";
  };

  const validateForm = () => {
    const newErrors = {
      fullName: "",
      phoneNumber: "",
      preferredLocation: "",
    };

    let isValid = true;

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      isValid = false;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\s/g, ""))) {
      newErrors.phoneNumber = "Please enter a valid phone number";
      isValid = false;
    }

    if (!formData.preferredLocation) {
      newErrors.preferredLocation = "Preferred work location is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate CV is provided
    if (!isUploadMode && !selectedCvId) {
      toast.error("Please select a CV or upload a new one");
      return;
    }

    if (isUploadMode && !cvFile) {
      toast.error("Please upload your CV");
      return;
    }

    if (!user?.id) {
      toast.error("User information not found. Please login again.");
      router.push("/sign-in");
      return;
    }

    // ✅ Validate candidateId is loaded (like save/like buttons do)
    if (!candidateId) {
      toast.error("Loading your profile... Please try again in a moment.");
      // Try to fetch profile again
      await fetchCandidateProfile();
      return;
    }

    setIsSubmitting(true);

    try {
      let cvFilePath = "";

      // Handle CV path
      if (isUploadMode && cvFile) {
        // Upload new CV to Firebase Storage
        toast.loading("Uploading CV...", { id: "upload-cv" });
        try {
          const uploadResult = await uploadJobApplicationCV(jobId, cvFile);
          cvFilePath = uploadResult.downloadUrl;
          toast.success("CV uploaded successfully", { id: "upload-cv" });
          console.log("✅ CV uploaded to:", uploadResult.storagePath);
        } catch (uploadError) {
          toast.error("Failed to upload CV. Please try again.", { id: "upload-cv" });
          throw uploadError;
        }
      } else {
        // Use selected CV URL
        const selectedCV = cvOptions.find(cv => cv.id === selectedCvId);
        if (!selectedCV) {
          toast.error("Selected CV not found. Please try again.");
          setIsSubmitting(false);
          return;
        }
        cvFilePath = selectedCV.url;
      }

      // Prepare application data
      // ✅ Don't use fallback - require real candidateId like save/like buttons
      if (!candidateId) {
        throw new Error("Candidate ID not found. Please login again.");
      }

      const applicationData = {
        jobPostingId: parseInt(jobId),
        candidateId: candidateId,
        cvFilePath: cvFilePath,
        fullName: formData.fullName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        preferredWorkLocation: formData.preferredLocation.trim(),
        coverLetter: formData.coverLetter.trim() || "",
        status: "PENDING",
      };

      // Log data before submission
      console.log("🔍 ===== PREPARING TO SUBMIT APPLICATION =====");
      console.log("🔍 Job ID:", jobId);
      console.log("🔍 User ID (from JWT):", user.id);
      console.log("🔍 Candidate ID (from profile API):", candidateId);
      console.log("🔍 CV File Path:", cvFilePath);

      // Validate required fields
      if (!applicationData.jobPostingId || isNaN(applicationData.jobPostingId)) {
        throw new Error("Invalid job posting ID");
      }
      if (!applicationData.candidateId) {
        throw new Error("Invalid candidate ID");
      }
      if (!applicationData.cvFilePath) {
        throw new Error("CV file path is required");
      }

      // Submit application
      toast.loading("Submitting application...", { id: "submit-app" });
      const response = await submitJobApplication(applicationData);

      toast.success("Application submitted successfully!", { id: "submit-app" });

      // ✅ Submit apply feedback - AWAIT like save/like buttons do
      const jobIdNumber = parseInt(jobId);
      
      try {
        console.log('📝 Submitting apply feedback:', { candidateId, jobIdNumber });
        await submitApplyFeedback(candidateId, jobIdNumber);
        console.log('✅ Apply feedback submitted successfully');
      } catch (error: any) {
        // Log error but don't block user flow - this is background tracking
        console.error("❌ Failed to submit apply feedback:", error);
        console.error("❌ Error details:", error.response?.data || error.message);
      }

      // Navigate to success page with job info (no extra API call needed on success page)
      const successParams = new URLSearchParams({
        applicationId: response.result.id.toString(),
        jobTitle: jobDetails?.title || "Your applied position",
        company: jobDetails?.company || "The company",
        location: jobDetails?.location || "your area",
      });
      router.push(`/jobs-detail/${jobId}/apply/success?${successParams.toString()}`);
    } catch (error) {
      console.error("Error submitting application:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to submit application. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingJob || !jobDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
        {/* Back button */}
        <button
          onClick={() => setShowConfirmQuit(true)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Single-card Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 shadow-sm">
          {/* Title and meta inside the same card */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            {/* Company Logo & Info */}
            <div className="flex items-start gap-4 mb-4">
              {jobDetails.companyLogo && (
                <img
                  src={jobDetails.companyLogo}
                  alt={jobDetails.company}
                  className="w-16 h-16 object-contain rounded-lg border border-gray-200"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{jobDetails.title}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-medium text-gray-700">{jobDetails.company}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{jobDetails.location}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{jobDetails.jobType}</span>
                  {jobDetails.salaryRange && (
                    <>
                      <span className="text-gray-400">•</span>
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                        {jobDetails.salaryRange}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CV Selection Section */}
          <div className="mb-6">
            <label className="block text-gray-900 font-semibold mb-3">
              Your CV <span className="text-red-500">*</span>
            </label>

            {/* CV Dropdown */}
            <div className="relative mb-4">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoadingCVs}
                className={`w-full flex items-center justify-between px-4 py-3 border rounded-lg transition-colors ${
                  isDropdownOpen ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-300 hover:border-gray-400"
                } ${isLoadingCVs ? "bg-gray-50 cursor-not-allowed" : "bg-white cursor-pointer"}`}
              >
                <div className="flex items-center gap-3">
                  <FiFile className="text-gray-500" />
                  <span className={selectedCvId || (isUploadMode && cvFile) ? "text-gray-900" : "text-gray-500"}>
                    {isLoadingCVs ? "Loading CVs..." : getSelectedCVName()}
                  </span>
                </div>
                <FiChevronDown className={`text-gray-500 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {/* Existing CVs */}
                  {cvOptions.length > 0 && (
                    <div className="py-2">
                      <div className="px-4 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Your CVs
                      </div>
                      {cvOptions.map((cv) => (
                        <button
                          key={cv.id}
                          type="button"
                          onClick={() => handleSelectCV(cv.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                            selectedCvId === cv.id && !isUploadMode ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <FiFile className={cv.isDefault ? "text-blue-600" : "text-gray-400"} />
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900">
                                {cv.name}
                                {cv.isDefault && (
                                  <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {cv.type === "WEB" ? "Created on CareerMate" : "Uploaded"} 
                                {cv.updatedAt && ` • ${new Date(cv.updatedAt).toLocaleDateString()}`}
                              </div>
                            </div>
                          </div>
                          {selectedCvId === cv.id && !isUploadMode && (
                            <FiCheck className="text-blue-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Divider */}
                  {cvOptions.length > 0 && <div className="border-t border-gray-200" />}

                  {/* Upload New Option */}
                  <button
                    type="button"
                    onClick={handleUploadNewClick}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                      isUploadMode ? "bg-blue-50" : ""
                    }`}
                  >
                    <FiUpload className="text-blue-600" />
                    <span className="text-sm font-medium text-blue-600">Upload a new CV</span>
                  </button>
                </div>
              )}
            </div>

            {/* Upload Section - Show when upload mode is active */}
            {isUploadMode && (
              <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/50">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="cvFile"
                    accept=".doc,.docx,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="cvFile"
                    className="px-4 py-2 bg-white border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FiUpload />
                    {cvFile ? "Change file" : "Choose file"}
                  </label>
                  {cvFile && (
                    <div className="flex items-center gap-2">
                      <FiFile className="text-blue-600" />
                      <span className="text-sm text-gray-700 font-medium">{cvFile.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload .doc, .docx, or .pdf file (max 3MB). This CV will be saved to:{" "}
                  <span className="font-mono text-blue-600">job-applications/{jobId}/</span>
                </p>
              </div>
            )}

            {/* No CVs Message */}
            {!isLoadingCVs && cvOptions.length === 0 && !isUploadMode && (
              <div className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded-lg">
                You don&apos;t have any CVs yet. Please upload one to apply.
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Your name"
                />
                {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0123456789"
                />
                {errors.phoneNumber && <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Preferred Work Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred work location <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.preferredLocation}
                  onChange={(e) => setFormData({ ...formData, preferredLocation: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.preferredLocation ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select location</option>
                  <option value="TP Hồ Chí Minh">TP Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Other">Other</option>
                </select>
                {errors.preferredLocation && <p className="text-sm text-red-500 mt-1">{errors.preferredLocation}</p>}
              </div>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Letter <span className="text-gray-400">(Optional)</span>
            </label>
            <p className="text-sm text-gray-600 mb-2">
              What skills, work projects or achievements make you a strong candidate?
            </p>
            <textarea
              value={formData.coverLetter}
              onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
              rows={6}
              maxLength={500}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Details and specific examples will make your application stronger..."
            />
            <p className="text-xs text-gray-500 mt-1">{formData.coverLetter.length} of 500 characters</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || (!selectedCvId && !cvFile)}
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Send Application"}
          </button>
        </form>
      </div>

      {/* Quit applying confirm modal */}
      {showConfirmQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Quit applying</h3>
              <button aria-label="Close" onClick={() => setShowConfirmQuit(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Changes you made so far will not be saved. Are you sure you want to quit this page?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmQuit(false)} className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">
                Continue applying
              </button>
              <button onClick={() => router.back()} className="px-4 py-2 rounded-md bg-red-500 text-white hover:bg-red-600">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
