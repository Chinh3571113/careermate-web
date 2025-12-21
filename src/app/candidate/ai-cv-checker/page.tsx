"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Search, Sparkles, CheckCircle2, BriefcaseBusiness } from "lucide-react";
import { analyzeCVATS } from "@/lib/cv-ats-api";
import toast from "react-hot-toast";
import CVSidebar from "@/components/layout/CVSidebar";
import { resumeService, type Resume } from "@/services/resumeService";
import { fetchSavedJobs, type SavedJobFeedback, fetchJobPostingById } from "@/lib/job-api";
import { useAuthStore } from "@/store/use-auth-store";
import { extractOriginalName } from "@/utils/cvFileNameHelper";

export default function AICVChecker() {
  const router = useRouter();
  const { candidateId } = useAuthStore();
  
  // CV Selection states
  const [cvSelectionMode, setCvSelectionMode] = useState<"file" | "existing" | "text">("file");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvText, setCvText] = useState("");
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null);
  const [userCVs, setUserCVs] = useState<Resume[]>([]);
  const [isLoadingCVs, setIsLoadingCVs] = useState(false);
  
  // JD Selection states
  const [jdSelectionMode, setJdSelectionMode] = useState<"text" | "saved" | "file">("text");
  const [jobDescription, setJobDescription] = useState("");
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [savedJobs, setSavedJobs] = useState<SavedJobFeedback[]>([]);
  const [isLoadingSavedJobs, setIsLoadingSavedJobs] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Load user's CVs
  useEffect(() => {
    const loadUserCVs = async () => {
      if (!candidateId) return;
      
      setIsLoadingCVs(true);
      try {
        const resumes = await resumeService.fetchResumes();
        // Filter only uploaded and web CVs (not drafts)
        const validCVs = resumes.filter(r => r.type !== "DRAFT" && r.resumeUrl);
        setUserCVs(validCVs);
        
        // Auto-select active CV
        const activeCV = validCVs.find(cv => cv.isActive);
        if (activeCV) {
          setSelectedCvId(activeCV.resumeId);
        }
      } catch (error) {
        console.error("Failed to load CVs:", error);
        toast.error("Failed to load your CVs");
      } finally {
        setIsLoadingCVs(false);
      }
    };

    loadUserCVs();
  }, [candidateId]);

  // Load saved jobs
  useEffect(() => {
    const loadSavedJobs = async () => {
      if (!candidateId) return;
      
      setIsLoadingSavedJobs(true);
      try {
        const jobs = await fetchSavedJobs(candidateId);
        setSavedJobs(jobs);
      } catch (error) {
        console.error("Failed to load saved jobs:", error);
        toast.error("Failed to load saved jobs");
      } finally {
        setIsLoadingSavedJobs(false);
      }
    };

    loadSavedJobs();
  }, [candidateId]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (
        file.type === "application/pdf" ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(".doc")
      ) {
        if (file.size <= 5 * 1024 * 1024) {
          setCvFile(file);
        } else {
          toast.error("File is too large. Please select a file under 5MB.");
        }
      } else {
        toast.error("Only PDF or DOCX files are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size <= 5 * 1024 * 1024) {
        setCvFile(file);
      } else {
        toast.error("File is too large. Please select a file under 5MB.");
      }
    }
  };

  const handleAnalyze = async () => {
    // Validate CV selection
    let cvToAnalyze: File | null = null;
    let jdText = "";

    // Get CV based on selection mode
    if (cvSelectionMode === "file") {
      if (!cvFile) {
        toast.error("Please upload your CV file.");
        return;
      }
      cvToAnalyze = cvFile;
    } else if (cvSelectionMode === "existing") {
      if (!selectedCvId) {
        toast.error("Please select a CV from your list.");
        return;
      }
      // Download CV from URL and convert to File
      const selectedCV = userCVs.find(cv => cv.resumeId === selectedCvId);
      if (!selectedCV || !selectedCV.resumeUrl) {
        toast.error("Selected CV not found or has no URL.");
        return;
      }
      
      try {
        const response = await fetch(selectedCV.resumeUrl);
        const blob = await response.blob();
        cvToAnalyze = new File([blob], `CV_${selectedCvId}.pdf`, { type: blob.type });
      } catch (error) {
        toast.error("Failed to load selected CV.");
        return;
      }
    } else if (cvSelectionMode === "text") {
      if (!cvText.trim()) {
        toast.error("Please paste your CV text.");
        return;
      }
      // Convert text to file
      const blob = new Blob([cvText], { type: "text/plain" });
      cvToAnalyze = new File([blob], "CV_Text.txt", { type: "text/plain" });
    }

    // Get JD based on selection mode
    if (jdSelectionMode === "text") {
      if (!jobDescription.trim()) {
        toast.error("Please enter the job description.");
        return;
      }
      jdText = jobDescription;
    } else if (jdSelectionMode === "saved") {
      if (!selectedJobId) {
        toast.error("Please select a saved job.");
        return;
      }
      // Fetch job details
      try {
        const jobDetails = await fetchJobPostingById(selectedJobId);
        if (!jobDetails) {
          toast.error("Failed to load selected job details.");
          return;
        }
        jdText = jobDetails.description || "";
        if (!jdText.trim()) {
          toast.error("Selected job has no description.");
          return;
        }
      } catch (error) {
        toast.error("Failed to load selected job details.");
        return;
      }
    } else if (jdSelectionMode === "file") {
      if (!jdFile) {
        toast.error("Please upload a job description file.");
        return;
      }
      // Read file content
      try {
        jdText = await jdFile.text();
      } catch (error) {
        toast.error("Failed to read job description file.");
        return;
      }
    }

    if (!cvToAnalyze) {
      toast.error("Please provide a CV.");
      return;
    }

    if (!jdText.trim()) {
      toast.error("Please provide a job description.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const result = await analyzeCVATS(jdText, cvToAnalyze);

      sessionStorage.setItem("cv_ats_result", JSON.stringify(result));

      toast.success("CV analysis completed successfully!");
      router.push("/candidate/ai-cv-result");
    } catch (error: any) {
      console.error("Error analyzing CV:", error);
      toast.error(error.message || "An error occurred while analyzing your CV.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <CVSidebar activePage="cm-profile" />
          </aside>

          {/* Main Content */}
          <div className="max-w-4xl mx-auto w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#3a4660] to-gray-400 rounded-2xl p-8 mb-8 text-white shadow-lg">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Optimize Your CV to Increase Interview Chances</h1>
              </div>
              <p className="text-green-50 text-lg">
                Boost your interview chances with CV improvement suggestions, ATS scoring, and auto-generated cover letters — tailored for each job role.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              {/* Step 1: Upload CV */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3a4660] to-gray-400 text-white flex items-center justify-center font-bold">
                    1
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Upload Your CV<span className="text-red-500">*</span>
                  </h2>
                </div>

                {/* Upload Options */}
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    className={`px-4 py-2 border-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      cvSelectionMode === "file" 
                        ? "border-[#3a4660] bg-[#3a4660] text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCvSelectionMode("file")}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 border-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      cvSelectionMode === "existing" 
                        ? "border-[#3a4660] bg-[#3a4660] text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCvSelectionMode("existing")}
                  >
                    <FileText className="w-4 h-4" />
                    Choose from Your CVs
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 border-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      cvSelectionMode === "text" 
                        ? "border-[#3a4660] bg-[#3a4660] text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setCvSelectionMode("text")}
                  >
                    <FileText className="w-4 h-4" />
                    Paste Text
                  </button>
                </div>

                {/* CV Content Area */}
                {cvSelectionMode === "file" && (
                  <>
                    <input
                      id="cv-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {/* Upload Area */}
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                        dragActive
                          ? "border-[#3a4660] bg-green-50"
                          : "border-gray-300 bg-gray-50"
                      }`}
                    >
                      {cvFile ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-[#3a4660]" />
                          <div className="text-left">
                            <p className="font-semibold text-gray-900">{cvFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <button
                            onClick={() => setCvFile(null)}
                            className="ml-4 text-red-500 hover:text-red-600 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="cv-file-input" className="cursor-pointer">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-[#3a4660] font-semibold text-lg mb-2 hover:text-[#1e2126] transition-colors">
                            Upload new files
                          </p>
                          <p className="text-gray-600 mb-1">
                            Drop files here or click to upload.
                          </p>
                        </label>
                      )}
                    </div>

                    <div className="mt-3 space-y-1">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="text-gray-400">ℹ️</span>
                        Supported formats: .pdf, .doc, .docx. Maximum size: 5 MB.
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <span className="text-gray-400">ℹ️</span>
                        Only English CVs are supported.
                      </p>
                    </div>
                  </>
                )}

                {cvSelectionMode === "existing" && (
                  <div className="space-y-3">
                    {isLoadingCVs ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#3a4660] rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading your CVs...</p>
                      </div>
                    ) : userCVs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">You don't have any CVs yet.</p>
                        <p className="text-sm">Please upload a CV or create one in CareerMate.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {userCVs.map((cv) => {
                          // Generate display name based on CV type
                          let cvDisplayName: string;
                          
                          if (cv.type === "WEB") {
                            cvDisplayName = `CareerMate CV #${cv.resumeId}`;
                          } else {
                            // For uploaded CVs, extract filename from URL
                            try {
                              const pathname = new URL(cv.resumeUrl).pathname;
                              const encodedName = pathname.split("%2F").pop() || "";
                              const decoded = decodeURIComponent(encodedName);
                              cvDisplayName = extractOriginalName(decoded); // Remove _CM_timestamp
                            } catch {
                              cvDisplayName = `Uploaded CV #${cv.resumeId}`;
                            }
                          }
                          
                          return (
                            <div
                              key={cv.resumeId}
                              onClick={() => setSelectedCvId(cv.resumeId)}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                selectedCvId === cv.resumeId
                                  ? "border-[#3a4660] bg-blue-50"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  selectedCvId === cv.resumeId
                                    ? "border-[#3a4660] bg-[#3a4660]"
                                    : "border-gray-300"
                                }`}>
                                  {selectedCvId === cv.resumeId && (
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-gray-900 truncate">
                                      {cvDisplayName}
                                    </p>
                                    {cv.isActive && (
                                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium shrink-0">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-500">
                                    {cv.type === "WEB" ? "Created with CareerMate" : "Uploaded"} • 
                                    {new Date(cv.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                                {cv.resumeUrl && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(cv.resumeUrl, '_blank');
                                    }}
                                    className="shrink-0 px-3 py-1.5 text-sm text-[#3a4660] hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                                    title="Preview CV"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {cvSelectionMode === "text" && (
                  <>
                    <textarea
                      value={cvText}
                      onChange={(e) => setCvText(e.target.value)}
                      placeholder="Paste your CV content here..."
                      className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#3a4660] focus:outline-none resize-none text-gray-900 placeholder:text-gray-400"
                    />
                    <p className="text-sm text-gray-600 flex items-center gap-1 mt-2">
                      <span className="text-gray-400">ℹ️</span>
                      Paste the full content of your CV in plain text format.
                    </p>
                  </>
                )}
              </div>

              {/* Step 2: Job Description */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#3a4660] to-gray-400 text-white flex items-center justify-center font-bold">
                    2
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Add Job Description<span className="text-red-500">*</span>
                  </h2>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    className={`px-4 py-2 border-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      jdSelectionMode === "text" 
                        ? "border-[#3a4660] bg-[#3a4660] text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setJdSelectionMode("text")}
                  >
                    <FileText className="w-4 h-4" />
                    Paste Text
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 border-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      jdSelectionMode === "saved" 
                        ? "border-[#3a4660] bg-[#3a4660] text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setJdSelectionMode("saved")}
                  >
                    <BriefcaseBusiness className="w-4 h-4" />
                    Choose from Your Saved Jobs
                  </button>

                  <button
                    type="button"
                    className={`px-4 py-2 border-2 rounded-lg transition-colors flex items-center gap-2 font-medium ${
                      jdSelectionMode === "file" 
                        ? "border-[#3a4660] bg-[#3a4660] text-white" 
                        : "border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setJdSelectionMode("file")}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                </div>

                {/* JD Content based on mode */}
                {jdSelectionMode === "text" && (
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="The more detailed the job description, the better CareerMate AI can analyze your CV."
                    className="w-full h-40 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-[#3a4660] focus:outline-none resize-none text-gray-900 placeholder:text-gray-400"
                  />
                )}

                {jdSelectionMode === "saved" && (
                  <div className="space-y-3">
                    {isLoadingSavedJobs ? (
                      <div className="text-center py-8">
                        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#3a4660] rounded-full animate-spin mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Loading saved jobs...</p>
                      </div>
                    ) : savedJobs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p className="mb-2">You haven't saved any jobs yet.</p>
                        <p className="text-sm">Go to job search and save jobs you're interested in.</p>
                      </div>
                    ) : (
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {savedJobs.map((job) => (
                          <div
                            key={job.jobId}
                            onClick={() => setSelectedJobId(job.jobId)}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                              selectedJobId === job.jobId
                                ? "border-[#3a4660] bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                selectedJobId === job.jobId
                                  ? "border-[#3a4660] bg-[#3a4660]"
                                  : "border-gray-300"
                              }`}>
                                {selectedJobId === job.jobId && (
                                  <CheckCircle2 className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{job.jobTitle}</p>
                                <p className="text-sm text-gray-500">
                                  Saved on {new Date(job.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {jdSelectionMode === "file" && (
                  <>
                    <input
                      id="jd-file-input"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setJdFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />
                    
                    <div className="border-2 border-dashed rounded-xl p-8 text-center border-gray-300 bg-gray-50">
                      {jdFile ? (
                        <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-gray-900">{jdFile.name}</p>
                              <p className="text-sm text-gray-500">
                                {(jdFile.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setJdFile(null)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="jd-file-input" className="cursor-pointer block">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-[#3a4660] font-semibold text-lg mb-2">
                            Upload Job Description File
                          </p>
                          <p className="text-gray-600 mb-1">
                            Click to upload .pdf, .doc, .docx, or .txt file
                          </p>
                        </label>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="px-8 py-3 bg-gray-300 text-gray-600 rounded-xl font-semibold hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Analyzing...
                    </span>
                  ) : (
                    "Start Scanning"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
