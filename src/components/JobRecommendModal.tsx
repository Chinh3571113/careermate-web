"use client";

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, Briefcase, Star, Lock, Search, Tag } from "lucide-react";
import { checkJobRecommendationAccess } from "@/lib/entitlement-api";
import { getJobRecommendations, type JobRecommendation } from "@/lib/job-recommendation-api";
import { fetchCurrentCandidateProfile } from "@/lib/candidate-profile-api";
import api from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface JobRecommendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResumeSkill {
  skillId: number;
  skillName: string;
  skillType: string;
  yearOfExperience?: number;
}

export default function JobRecommendModal({ isOpen, onClose }: JobRecommendModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [contentBasedJobs, setContentBasedJobs] = useState<JobRecommendation[]>([]);
  const [collaborativeJobs, setCollaborativeJobs] = useState<JobRecommendation[]>([]);
  const [hotJobs, setHotJobs] = useState<JobRecommendation[]>([]);
  const [activeTab, setActiveTab] = useState<'main' | 'recommended' | 'hot'>('main');
  const [expandedJobId, setExpandedJobId] = useState<number | null>(null);
  const [jobDetails, setJobDetails] = useState<Map<number, any>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<number>>(new Set());
  
  // New states for input form
  const [showInputForm, setShowInputForm] = useState(true);
  const [titleInput, setTitleInput] = useState("");
  const [resumeSkills, setResumeSkills] = useState<string[]>([]);
  const [candidateId, setCandidateId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset states when modal opens
      setShowInputForm(true);
      setContentBasedJobs([]);
      setCollaborativeJobs([]);
      setHotJobs([]);
      setTitleInput("");
      checkAccessAndLoadSkills();
    }
  }, [isOpen]);

  const checkAccessAndLoadSkills = async () => {
    try {
      setLoading(true);
      
      // Check access
      const accessRes = await checkJobRecommendationAccess();
      setHasAccess(accessRes.hasAccess);
      
      if (!accessRes.hasAccess) {
        setShowUpgradePrompt(true);
        setLoading(false);
        return;
      }

      // Fetch candidate profile
      const profile = await fetchCurrentCandidateProfile();
      if (profile.candidateId) {
        setCandidateId(profile.candidateId);
        if (profile.title) {
          setTitleInput(profile.title);
        }
      }

      // Load skills from active resume
      await loadActiveResumeSkills();
      
    } catch (error) {
      console.error('Error checking access:', error);
      setShowUpgradePrompt(true);
    } finally {
      setLoading(false);
    }
  };

  const loadActiveResumeSkills = async () => {
    try {
      setLoadingSkills(true);
      
      // Fetch all resumes
      const resumeResponse = await api.get('/api/resume');
      
      if (resumeResponse.data.result && resumeResponse.data.result.length > 0) {
        // Find active resume
        const activeResume = resumeResponse.data.result.find(
          (resume: any) => resume.isActive === true
        );
        
        if (activeResume && activeResume.skills && activeResume.skills.length > 0) {
          const skills = activeResume.skills.map((skill: ResumeSkill) => skill.skillName);
          setResumeSkills(skills);
          console.log('✅ Loaded skills from active resume:', skills);
        } else {
          // If no active resume, try to get skills from first resume
          const firstResume = resumeResponse.data.result[0];
          if (firstResume.skills && firstResume.skills.length > 0) {
            const skills = firstResume.skills.map((skill: ResumeSkill) => skill.skillName);
            setResumeSkills(skills);
            console.log('✅ Loaded skills from first resume:', skills);
          } else {
            console.log('⚠️ No skills found in any resume');
            setResumeSkills([]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading resume skills:', error);
      setResumeSkills([]);
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSearchRecommendations = async () => {
    if (!titleInput.trim()) {
      toast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }

    if (!candidateId) {
      toast.error("Không tìm thấy thông tin tài khoản");
      return;
    }

    if (resumeSkills.length === 0) {
      toast.error("Không tìm thấy skills trong CV. Vui lòng cập nhật CV trước.");
      return;
    }

    try {
      setLoading(true);
      setShowInputForm(false);

      // Build request
      const requestData = {
        candidate_id: candidateId,
        skills: resumeSkills,
        title: titleInput.trim(),
        description: `Looking for ${titleInput.trim()} position with skills: ${resumeSkills.join(', ')}`,
        top_n: 5
      };

      console.log('🔵 Job Recommendation Request:', requestData);

      const response = await getJobRecommendations(requestData);
      
      // Set data for 3 sections
      setContentBasedJobs(response.results.content_based || []);
      setCollaborativeJobs(response.results.collaborative || []);
      setHotJobs(response.results.hybrid_top || []);
      
      const totalJobs = (response.results.content_based?.length || 0) + 
                        (response.results.collaborative?.length || 0) + 
                        (response.results.hybrid_top?.length || 0);
      
      if (totalJobs > 0) {
        toast.success(`Tìm thấy ${totalJobs} công việc phù hợp!`);
      } else {
        toast.success("Không tìm thấy công việc phù hợp", { icon: "ℹ️" });
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast.error("Không thể tải gợi ý công việc");
      setShowInputForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToInput = () => {
    setShowInputForm(true);
    setContentBasedJobs([]);
    setCollaborativeJobs([]);
    setHotJobs([]);
    setExpandedJobId(null);
    setJobDetails(new Map());
  };

  const handleUpgrade = () => {
    onClose();
    router.push('/candidate/pricing');
  };

  const toggleJobDetails = async (jobId: number) => {
    if (expandedJobId === jobId) {
      setExpandedJobId(null);
      return;
    }

    setExpandedJobId(jobId);

    // If already loaded, don't fetch again
    if (jobDetails.has(jobId)) {
      return;
    }

    // Fetch job details
    try {
      setLoadingDetails(prev => new Set(prev).add(jobId));
      const response = await api.get(`/api/job-postings/${jobId}`);
      const details = response.data.result;
      
      setJobDetails(prev => new Map(prev).set(jobId, details));
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/80 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Job Recommendations</h2>
              <p className="text-sm text-gray-600">Job recommendations tailored to your profile</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">
                {loadingSkills ? "Loading skills from CV..." : "Searching for matching jobs..."}
              </p>
            </div>
          ) : showUpgradePrompt ? (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Premium Feature</h3>
                <p className="text-gray-600">
                  You need to upgrade to Premium to use Job Recommendations
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 mb-6">
                <p className="text-sm font-semibold text-blue-900 mb-3">Premium Benefits:</p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>Personalized Job Recommendations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>AI-Powered Job Matching</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>Priority Job Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                    <span>Access to All Premium Features</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          ) : showInputForm ? (
            /* Input Form - Title và Skills */
            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Find Matching Jobs</h3>
                <p className="text-gray-600 text-sm">
                  Enter the job title you want; the system will analyze based on the skills in your CV
                </p>
              </div>

              {/* Title Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={titleInput}
                    onChange={(e) => setTitleInput(e.target.value)}
                    placeholder="e.g., Frontend Developer, Backend Engineer, Fullstack..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchRecommendations();
                      }
                    }}
                  />
                </div>
              </div>

              {/* Skills from Resume */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <label className="text-sm font-semibold text-gray-700">
                    Skills from your CV
                  </label>
                </div>
                
                {loadingSkills ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Loading skills...</span>
                    </div>
                ) : resumeSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {resumeSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ No skills found in CV. Please update your CV before searching.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        router.push('/candidate/cv-management');
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Update CV now →
                    </button>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 mb-6">
                <p className="text-sm text-indigo-800">
                  <strong>💡 Tip:</strong> The system analyzes the title and skills to find the best matches based on:
                </p>
                <ul className="mt-2 text-sm text-indigo-700 space-y-1 ml-4">
                  <li>• Content-based: Based on the job description</li>
                  <li>• Collaborative: Based on behavior of similar candidates</li>
                  <li>• Hybrid: A combination of both methods</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={handleSearchRecommendations}
                  disabled={!titleInput.trim() || resumeSkills.length === 0}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Search Jobs
                </button>
              </div>
            </div>
          ) : (contentBasedJobs.length === 0 && collaborativeJobs.length === 0 && hotJobs.length === 0) ? (
            <div className="text-center py-20 px-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No matching jobs found
              </h3>
              <p className="text-gray-600 mb-6">
                Try a different job title or add more skills to your CV.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleBackToInput}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Try again
                </button>
                <button
                  onClick={() => {
                    onClose();
                    router.push('/candidate/cv-profile');
                  }}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  Update CV
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {/* Search Info & New Search Button */}
              <div className="flex items-center justify-between mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Results for: <strong className="text-blue-700">{titleInput}</strong>
                  </span>
                </div>
                <button
                  onClick={handleBackToInput}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  New search
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('main')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'main'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Phù hợp nhất ({contentBasedJobs.length})
                </button>
                <button
                  onClick={() => setActiveTab('recommended')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'recommended'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Recommend for you ({collaborativeJobs.length})
                </button>
                <button
                  onClick={() => setActiveTab('hot')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'hot'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Job Hot 🔥 ({hotJobs.length})
                </button>
              </div>

              {/* Job List */}
              <div className="space-y-4">
                {activeTab === 'main' && contentBasedJobs.map((job, index) => {
                  const isExpanded = expandedJobId === job.job_id;
                  const details = jobDetails.get(job.job_id);
                  const isLoadingDetail = loadingDetails.has(job.job_id);

                  return (
                    <div
                      key={`main-${job.job_id}-${index}`}
                      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Job Summary */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            {job.final_score && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-medium text-gray-600">
                                  {(job.final_score * 100).toFixed(0)}% Match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Skills */}
                        {job.skills && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.skills.split(',').slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                            {job.skills.split(',').length > 4 && (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                +{job.skills.split(',').length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Match Details */}
                        {(job.semantic_similarity || job.skill_overlap !== undefined) && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                            {job.semantic_similarity && (
                              <div>
                                <span className="font-medium">Semantic:</span>{' '}
                                {(job.semantic_similarity * 100).toFixed(0)}%
                              </div>
                            )}
                            {job.skill_overlap !== undefined && (
                              <div>
                                <span className="font-medium">Skill:</span>{' '}
                                {(job.skill_overlap * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        )}

                        {/* View Button */}
                        <button
                          onClick={() => toggleJobDetails(job.job_id)}
                          disabled={isLoadingDetail}
                          className="mt-3 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                        >
                          {isLoadingDetail ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading...
                            </span>
                          ) : isExpanded ? (
                            'Hide details'
                          ) : (
                            'View details'
                          )}
                        </button>
                      </div>

                      {/* Expanded Job Details */}
                      {isExpanded && details && (
                        <div className="border-t border-gray-200 bg-gray-50 p-5 space-y-4 max-h-[600px] overflow-y-auto">
                          {/* Company Info */}
                          <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                            {details.recruiterInfo?.companyLogo && (
                              <img
                                src={details.recruiterInfo.companyLogo}
                                alt={details.recruiterInfo?.companyName}
                                className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {details.recruiterInfo?.companyName || 'Company'}
                              </h4>
                              <p className="text-sm text-gray-600">{details.address}</p>
                            </div>
                          </div>

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Salary Range</p>
                              <p className="text-sm font-semibold text-emerald-600">
                                {details.salaryRange || 'Negotiable'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Working Mode</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {details.workingMode || 'Full time'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Experience</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {details.experienceYears || 'Any'} years
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Positions</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {details.numberOfRecruitment || 1} opening{details.numberOfRecruitment > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Skills */}
                          {details.skills && details.skills.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Required Skills</h5>
                              <div className="flex flex-wrap gap-2">
                                {details.skills.map((skill: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`px-3 py-1 text-sm rounded-full ${
                                      skill.mustToHave
                                        ? 'bg-red-50 text-red-700 border border-red-200 font-medium'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}
                                  >
                                    {skill.name}
                                    {skill.mustToHave && ' *'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Job Description */}
                          {details.description && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Job Description</h5>
                              <div 
                                className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: details.description }}
                              />
                            </div>
                          )}

                          {/* Requirements */}
                          {details.requirement && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Requirements</h5>
                              <div 
                                className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: details.requirement }}
                              />
                            </div>
                          )}

                          {/* Benefits */}
                          {details.benefit && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Benefits & Compensation</h5>
                              <div 
                                className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: details.benefit }}
                              />
                            </div>
                          )}

                          {/* Apply Button */}
                          <button
                            onClick={() => {
                              router.push(`/jobs-detail?id=${job.job_id}`);
                              onClose();
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                          >
                            Apply Now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeTab === 'recommended' && collaborativeJobs.map((job, index) => {
                  const isExpanded = expandedJobId === job.job_id;
                  const details = jobDetails.get(job.job_id);
                  const isLoadingDetail = loadingDetails.has(job.job_id);

                  return (
                    <div
                      key={`recommended-${job.job_id}-${index}`}
                      className="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
                    >
                      {/* Job Summary */}
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1">
                              {job.title}
                            </h3>
                            {job.final_score && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-medium text-gray-600">
                                  {(job.final_score * 100).toFixed(0)}% Match
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {job.description}
                        </p>

                        {/* Skills */}
                        {job.skills && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.skills.split(',').slice(0, 4).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium"
                              >
                                {skill.trim()}
                              </span>
                            ))}
                            {job.skills.split(',').length > 4 && (
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                +{job.skills.split(',').length - 4} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Match Details */}
                        {(job.semantic_similarity || job.skill_overlap !== undefined) && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                            {job.semantic_similarity && (
                              <div>
                                <span className="font-medium">Semantic:</span>{' '}
                                {(job.semantic_similarity * 100).toFixed(0)}%
                              </div>
                            )}
                            {job.skill_overlap !== undefined && (
                              <div>
                                <span className="font-medium">Skill:</span>{' '}
                                {(job.skill_overlap * 100).toFixed(0)}%
                              </div>
                            )}
                          </div>
                        )}

                        {/* View Button */}
                        <button
                          onClick={() => toggleJobDetails(job.job_id)}
                          disabled={isLoadingDetail}
                          className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                        >
                          {isLoadingDetail ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Loading...
                            </span>
                          ) : isExpanded ? (
                            'Hide details'
                          ) : (
                            'View details'
                          )}
                        </button>
                      </div>

                      {/* Expanded Job Details */}
                      {isExpanded && details && (
                        <div className="border-t border-gray-200 bg-gray-50 p-5 space-y-4 max-h-[600px] overflow-y-auto">
                          {/* Company Info */}
                          <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                            {details.recruiterInfo?.companyLogo && (
                              <img
                                src={details.recruiterInfo.companyLogo}
                                alt={details.recruiterInfo?.companyName}
                                className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white"
                              />
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {details.recruiterInfo?.companyName || 'Company'}
                              </h4>
                              <p className="text-sm text-gray-600">{details.address}</p>
                            </div>
                          </div>

                          {/* Key Info Grid */}
                          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Salary Range</p>
                              <p className="text-sm font-semibold text-emerald-600">
                                {details.salaryRange || 'Negotiable'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Working Mode</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {details.workingMode || 'Full time'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Experience</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {details.experienceYears || 'Any'} years
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Positions</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {details.numberOfRecruitment || 1} opening{details.numberOfRecruitment > 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>

                          {/* Skills */}
                          {details.skills && details.skills.length > 0 && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Required Skills</h5>
                              <div className="flex flex-wrap gap-2">
                                {details.skills.map((skill: any, idx: number) => (
                                  <span
                                    key={idx}
                                    className={`px-3 py-1 text-sm rounded-full ${
                                      skill.mustToHave
                                        ? 'bg-red-50 text-red-700 border border-red-200 font-medium'
                                        : 'bg-gray-100 text-gray-700 border border-gray-200'
                                    }`}
                                  >
                                    {skill.name}
                                    {skill.mustToHave && ' *'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Job Description */}
                          {details.description && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Job Description</h5>
                              <div 
                                className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: details.description }}
                              />
                            </div>
                          )}

                          {/* Requirements */}
                          {details.requirement && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Requirements</h5>
                              <div 
                                className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: details.requirement }}
                              />
                            </div>
                          )}

                          {/* Benefits */}
                          {details.benefit && (
                            <div>
                              <h5 className="font-semibold text-gray-900 mb-2">Benefits & Compensation</h5>
                              <div 
                                className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: details.benefit }}
                              />
                            </div>
                          )}

                          {/* Apply Button */}
                          <button
                            onClick={() => {
                              router.push(`/jobs-detail?id=${job.job_id}`);
                              onClose();
                            }}
                            className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                          >
                            Apply Now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {activeTab === 'hot' && hotJobs.map((job, index) => {
                  const isExpanded = expandedJobId === job.job_id;
                  const details = jobDetails.get(job.job_id);
                  const isLoadingDetail = loadingDetails.has(job.job_id);

                  return (
                  <div
                    key={`hot-${job.job_id}-${index}`}
                    className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-300 hover:shadow-lg transition-shadow relative overflow-hidden"
                  >
                    {/* Hot Badge */}
                    <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full text-xs font-bold shadow-md">
                      🔥 HOT
                    </div>

                    <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-16">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          {job.title}
                        </h3>
                        {job.final_score && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-medium text-gray-600">
                              {(job.final_score * 100).toFixed(0)}% Match
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {job.description}
                    </p>

                    {/* Skills */}
                    {job.skills && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {job.skills.split(',').slice(0, 4).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium"
                          >
                            {skill.trim()}
                          </span>
                        ))}
                        {job.skills.split(',').length > 4 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            +{job.skills.split(',').length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Match Details */}
                    {(job.semantic_similarity || job.skill_overlap !== undefined) && (
                      <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-orange-100 pt-3">
                        {job.semantic_similarity && (
                          <div>
                            <span className="font-medium">Semantic:</span>{' '}
                            {(job.semantic_similarity * 100).toFixed(0)}%
                          </div>
                        )}
                        {job.skill_overlap !== undefined && (
                          <div>
                            <span className="font-medium">Skill:</span>{' '}
                            {(job.skill_overlap * 100).toFixed(0)}%
                          </div>
                        )}
                      </div>
                    )}

                    {/* View Button */}
                    <button
                      onClick={() => toggleJobDetails(job.job_id)}
                      disabled={isLoadingDetail}
                      className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg transition-colors font-medium text-sm shadow-md disabled:opacity-50"
                    >
                      {isLoadingDetail ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Loading...
                        </span>
                      ) : isExpanded ? (
                        'Hide details'
                      ) : (
                        'View details'
                      )}
                    </button>
                  </div>

                  {/* Expanded Job Details */}
                  {isExpanded && details && (
                    <div className="border-t border-orange-200 bg-white p-5 space-y-4 max-h-[600px] overflow-y-auto">
                      {/* Company Info */}
                      <div className="flex items-start gap-3 pb-4 border-b border-gray-200">
                        {details.recruiterInfo?.companyLogo && (
                          <img
                            src={details.recruiterInfo.companyLogo}
                            alt={details.recruiterInfo?.companyName}
                            className="w-16 h-16 object-contain rounded-lg border border-gray-200 bg-white"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {details.recruiterInfo?.companyName || 'Company'}
                          </h4>
                          <p className="text-sm text-gray-600">{details.address}</p>
                        </div>
                      </div>

                      {/* Key Info Grid */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Salary Range</p>
                          <p className="text-sm font-semibold text-emerald-600">
                            {details.salaryRange || 'Negotiable'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Working Mode</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {details.workingMode || 'Full time'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Experience</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {details.experienceYears || 'Any'} years
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Positions</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {details.numberOfRecruitment || 1} opening{details.numberOfRecruitment > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>

                      {/* Skills */}
                      {details.skills && details.skills.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">Required Skills</h5>
                          <div className="flex flex-wrap gap-2">
                            {details.skills.map((skill: any, idx: number) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 text-sm rounded-full ${
                                  skill.mustToHave
                                    ? 'bg-red-50 text-red-700 border border-red-200 font-medium'
                                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                                }`}
                              >
                                {skill.name}
                                {skill.mustToHave && ' *'}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Job Description */}
                      {details.description && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">Job Description</h5>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: details.description }}
                          />
                        </div>
                      )}

                      {/* Requirements */}
                      {details.requirement && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">Requirements</h5>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: details.requirement }}
                          />
                        </div>
                      )}

                      {/* Benefits */}
                      {details.benefit && (
                        <div>
                          <h5 className="font-semibold text-gray-900 mb-2">Benefits & Compensation</h5>
                          <div 
                            className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: details.benefit }}
                          />
                        </div>
                      )}

                      {/* Apply Button */}
                      <button
                        onClick={() => {
                          router.push(`/jobs-detail?id=${job.job_id}`);
                          onClose();
                        }}
                        className="w-full px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-lg transition-all font-semibold shadow-md hover:shadow-lg"
                      >
                        Apply Now
                      </button>
                    </div>
                  )}
                  </div>
                );
                })}


                {/* Empty state for each tab */}
                {activeTab === 'main' && contentBasedJobs.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No matching jobs</p>
                  </div>
                )}
                {activeTab === 'recommended' && collaborativeJobs.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No recommended jobs</p>
                  </div>
                )}
                {activeTab === 'hot' && hotJobs.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No hot jobs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
