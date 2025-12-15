"use client";

import { useState, useEffect } from "react";
import CVSidebar from "@/components/layout/CVSidebar";
import Link from "next/link";
import { FileText, Briefcase, Mail, Receipt, FolderOpen } from "lucide-react";
import { useLayout } from "@/contexts/LayoutContext";
import { useAuthStore } from "@/store/use-auth-store";
import { useResumeData } from "@/hooks/useResumeData";
import { resumesToCVsSync } from "@/utils/resumeConverter";
import { CV } from "@/services/cvService";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { getMyInvoice } from "@/lib/invoice-api";
import { fetchMyJobApplications, type JobApplication } from "@/lib/my-jobs-api";
import { fetchSavedJobs, type SavedJobFeedback } from "@/lib/job-api";
import { getCurrentUser } from "@/lib/user-api";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProfileProgressCircle } from "@/components/ui/profile-progress-circle";
import { useCVStore } from "@/stores/cvStore";
import api from "@/lib/api";

export default function CandidateDashboard() {
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  
  // Auth store
  const { user, candidateId, fetchCandidateProfile } = useAuthStore();
  const userId = candidateId || user?.id;

  // Get current editing resume ID from Zustand (same as CM Profile)
  const currentEditingResumeId = useCVStore((s) => s.currentEditingResumeId);
  
  // Resume ID state - will match CM Profile's selected resume
  const [resumeId, setResumeId] = useState<number | null>(null);

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  
  // Profile data for completion calculation (same as CM Profile)
  const [profileData, setProfileData] = useState<{
    fullName?: string;
    title?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    address?: string;
    link?: string;
    aboutMe?: string;
    awards?: any[];
    certificates?: any[];
    projects?: any[];
    languages?: any[];
    educations?: any[];
    workExperiences?: any[];
    coreSkillGroups?: Array<{ items?: any[] }>;
    softSkillGroups?: Array<{ items?: any[] }>;
  }>({});

  // Calculate profile completion using shared hook (same logic as CM Profile)
  const profileCompletion = useProfileCompletion(profileData);

  // CV state
  const [defaultCV, setDefaultCV] = useState<CV | null>(null);
  const [allCVs, setAllCVs] = useState<CV[]>([]);

  // Job activities state
  const [appliedJobsCount, setAppliedJobsCount] = useState(0);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [invitationsCount, setInvitationsCount] = useState(0);

  // Fetch resume data
  const {
    webResumes,
    uploadedResumes,
    draftResumes,
    activeResume,
    loading: resumeLoading
  } = useResumeData();

  // Ensure candidateId is loaded
  useEffect(() => {
    if (!candidateId && user) {
      fetchCandidateProfile();
    }
  }, [candidateId, user, fetchCandidateProfile]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHeight = localStorage.getItem("headerHeight");
      if (savedHeight && !headerHeight) {
        setHeaderH(parseInt(savedHeight));
      } else if (headerHeight) {
        setHeaderH(headerHeight);
      }
    }
  }, [headerHeight]);

  // Fetch profile data from /api/resume (SAME as CM Profile)
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // Fetch from /api/resume like CM Profile does
        const response = await api.get("/api/resume");
        console.log('🔍 Dashboard /api/resume response:', response.data);
        
        // API returns array of resumes, need to select one (like CM Profile does)
        if (response.data?.result && response.data.result.length > 0) {
          const resumes = response.data.result;
          
          // Select resume using SAME PRIORITY as CM Profile:
          // Priority 0: currentEditingResumeId from Zustand (synced with CM Profile)
          // Priority 1: Resume with isActive === true
          // Priority 2: First resume in list
          let selectedResume;
          let selectionSource = '';
          
          if (currentEditingResumeId) {
            selectedResume = resumes.find((r: any) => 
              String(r.resumeId) === currentEditingResumeId
            );
            if (selectedResume) {
              selectionSource = `Zustand: ${currentEditingResumeId} (synced with CM Profile)`;
            }
          }
          
          if (!selectedResume) {
            selectedResume = resumes.find((r: any) => r.isActive === true);
            if (selectedResume) {
              selectionSource = 'isActive=true';
            }
          }
          
          if (!selectedResume) {
            selectedResume = resumes[0];
            selectionSource = 'first resume (fallback)';
          }
          
          const resume = selectedResume;
          
          console.log('📋 Dashboard selected resume:', {
            resumeId: resume.resumeId,
            source: selectionSource,
            isActive: resume.isActive
          });
          
          // Set resumeId state (matches CM Profile's resumeId)
          setResumeId(resume.resumeId);
          
          // Debug: log resume data
          console.log('📊 Dashboard Resume Data:', {
            fullName: resume.fullName,
            title: resume.title,
            educations: resume.educations?.length || 0,
            workExperiences: resume.workExperiences?.length || 0,
            coreSkillGroups: resume.coreSkillGroups?.length || 0,
            softSkillGroups: resume.softSkillGroups?.length || 0,
            awards: resume.awards?.length || 0,
            certificates: resume.certificates?.length || 0,
            projects: resume.projects?.length || 0,
            languages: resume.languages?.length || 0,
            aboutMe: !!resume.aboutMe,
          });
          
          // Set profile data for completion calculation
          setProfileData({
            fullName: resume.fullName,
            title: resume.title,
            phone: resume.phone,
            dob: resume.dob,
            gender: resume.gender,
            address: resume.address,
            link: resume.link,
            aboutMe: resume.aboutMe,
            awards: resume.awards || [],
            certificates: resume.certificates || [],
            projects: resume.projects || [],
            languages: resume.languages || [],
            educations: resume.educations || [],
            workExperiences: resume.workExperiences || [],
            coreSkillGroups: resume.coreSkillGroups || [],
            softSkillGroups: resume.softSkillGroups || [],
          });

          // Set display fields
          setProfileName(resume.fullName || "");
          setProfileTitle(resume.title || "");
          setProfileImage(resume.image || "");
          
          console.log('✅ Dashboard profile data set from /api/resume');
        }
      } catch (error) {
        console.error("❌ Failed to fetch resume data:", error);
        // Fallback: try /api/candidates/profiles/current
        try {
          console.log('🔄 Dashboard falling back to /api/candidates/profiles/current');
          const response = await api.get("/api/candidates/profiles/current");
          if (response.data?.result) {
            const profile = response.data.result;
            setProfileData({
              fullName: profile.fullName,
              title: profile.title,
              phone: profile.phone,
              dob: profile.dob,
              gender: profile.gender,
              address: profile.address,
              link: profile.link,
              aboutMe: profile.aboutMe,
              awards: profile.awards || [],
              certificates: profile.certificates || [],
              projects: profile.projects || [],
              languages: profile.languages || [],
              educations: profile.educations || [],
              workExperiences: profile.workExperiences || [],
              coreSkillGroups: profile.coreSkillGroups || [],
              softSkillGroups: profile.softSkillGroups || [],
            });
            setProfileName(profile.fullName || "");
            setProfileTitle(profile.title || "");
            setProfileImage(profile.image || "");
            console.log('📊 Dashboard fallback to /api/candidates/profiles/current');
          }
        } catch (fallbackError) {
          console.error("Failed to fetch profile data:", fallbackError);
        }
      }
    };

    // Fetch profile on mount
    fetchProfileData();

    // Refresh profile data when page becomes visible (user returns from cm-profile)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📍 Page visible again, refreshing profile data...');
        fetchProfileData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentEditingResumeId]); // Re-fetch when currentEditingResumeId changes (synced with CM Profile)

  // Fetch current user info (including email) from API
  useEffect(() => {
    const fetchCurrentUserInfo = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser?.email) {
          setUserEmail(currentUser.email);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        // Fallback to user from auth store
        if (user?.email) {
          setUserEmail(user.email);
        }
      }
    };

    fetchCurrentUserInfo();
  }, [user]);

  // Check premium status
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const invoice = await getMyInvoice();
        setIsPremium(invoice?.packageName === 'PREMIUM');
      } catch (error) {
        setIsPremium(false);
      }
    };
    checkPremiumStatus();
  }, []);

  // Convert resume data to CV format and set default CV
  useEffect(() => {
    if (!resumeLoading) {
      const uploadedCVs = resumesToCVsSync(uploadedResumes, userId);
      const builtCVs = resumesToCVsSync(webResumes, userId);
      const draftCVs = resumesToCVsSync(draftResumes, userId);
      
      const cvs = [...uploadedCVs, ...builtCVs, ...draftCVs];
      setAllCVs(cvs);

      // Set default CV from active resume
      if (activeResume) {
        const activeCV = cvs.find((cv) => cv.id === activeResume.resumeId.toString());
        if (activeCV) {
          setDefaultCV(activeCV);
        }
      }
    }
  }, [webResumes, uploadedResumes, draftResumes, activeResume, resumeLoading, userId]);

  // Fetch job activities data
  useEffect(() => {
    if (!candidateId) return;

    const loadJobActivities = async () => {
      try {
        // Fetch applied jobs
        const applications = await fetchMyJobApplications(candidateId);
        setAppliedJobsCount(applications.length);

        // Fetch saved jobs
        const savedJobs = await fetchSavedJobs(candidateId);
        setSavedJobsCount(savedJobs.length);

        // TODO: Fetch invitations when API available
        // setInvitationsCount(invitations.length);
      } catch (error) {
        console.error("Failed to fetch job activities:", error);
      }
    };

    loadJobActivities();
  }, [candidateId]);

  // Note: Profile completion is now calculated in the fetchProfile function above
  // using the same logic as cm-profile (calculateProfileCompletion)

  // Display name
  const displayName = profileName || user?.fullName || user?.name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="dashboard" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300">
            {/* Welcome Header - Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <PremiumAvatar
                    src={profileImage}
                    alt={displayName}
                    size="lg"
                    isPremium={isPremium}
                  />
                  <div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                      {displayName}
                    </h1>
                    <p className="text-sm text-gray-600 mb-1">
                      💼 {profileTitle || 'Update your title'}
                    </p>
                    <p className="text-sm text-gray-500">
                      ✉️ {userEmail || user?.email || 'No email'}
                    </p>
                    <Link
                      href="/candidate/cm-profile"
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                    >
                      Update your profile →
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Attached CV - Default CV Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Your Attached CV
              </h2>
              {defaultCV ? (
                <div className="bg-gradient-to-r from-[#3a4660] to-gray-400 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">Active CV</span>
                      <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{defaultCV.name}</h3>
                      <p className="text-sm text-gray-500">
                        {defaultCV.type === 'UPLOADED' ? 'Uploaded CV' : 'Built CV'} • {defaultCV.fileSize || 'N/A'}
                      </p>
                    </div>
                    <Link
                      href="/candidate/cv-management"
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">
                    You have not attached a CV yet. Please upload your CV for
                    quick application.
                  </p>
                  <Link
                    href="/candidate/cv-management"
                    className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center space-x-1"
                  >
                    <span>Manage CV Management</span>
                    <span>→</span>
                  </Link>
                </div>
              )}
            </div>

            {/* CM Profile */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                CM Profile
              </h2>
              <div className="flex items-start gap-8 flex-wrap xl:flex-nowrap">
                {/* Progress Circle - Using shared component with cm-profile colors */}
                <div className="flex-shrink-0">
                  <ProfileProgressCircle 
                    completion={profileCompletion} 
                    size="lg"
                  />
                </div>
                {/* Chat bubble for complete profile */}
                <div className="flex-1 flex flex-col justify-center min-w-[220px]">
                  <div className="relative inline-block">
                    <div
                      className="bg-white border border-gray-200 shadow-md rounded-2xl px-5 py-4 text-gray-800 text-base leading-snug max-w-xs mb-2"
                      style={{ position: "relative" }}
                    >
                      {profileCompletion >= 70 ? (
                        <span>
                          <span className="text-blue-600 font-semibold">Great!</span>{" "}
                          Your profile is strong enough to generate a CV tailored for IT professionals.
                        </span>
                      ) : profileCompletion >= 40 ? (
                        <span>
                          <span className="text-amber-600 font-semibold">Almost there!</span>{" "}
                          Complete your profile to at least{" "}
                          <span className="font-semibold">70%</span>{" "}
                          to generate your CV template.
                        </span>
                      ) : (
                        <span>
                          <span className="text-gray-600 font-semibold">Let's get started!</span>{" "}
                          Your profile is still in early stage. Add more information to unlock CV generation.
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href="/candidate/cm-profile"
                    className="inline-block text-base text-blue-600 hover:text-blue-700 font-medium mt-2"
                  >
                    {profileCompletion >= 70 ? 'View your profile →' : 'Complete your profile →'}
                  </Link>
                </div>
                {/* CV Templates grid */}
                <div className="flex-1 min-w-[260px]">
                  <div className="grid grid-cols-3 gap-4">
                    {/* Template 1 */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-2 flex flex-col items-center justify-center min-h-[180px]">
                      <div className="w-full h-24 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="w-1/2 h-2 bg-gray-100 rounded"></div>
                    </div>
                    {/* Template 2 */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-2 flex flex-col items-center justify-center min-h-[180px]">
                      <div className="w-full h-24 bg-gray-100 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="w-1/2 h-2 bg-gray-100 rounded"></div>
                    </div>
                    {/* Explore CV templates */}
                    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-2 flex flex-col items-center justify-center min-h-[180px] relative cursor-pointer group">
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 mb-2">
                          <span className="text-gray-600 text-xl">⊕</span>
                        </div>
                        <span className="text-gray-600 font-semibold text-base text-center">
                          Explore CV templates
                        </span>
                      </div>
                      <span className="absolute inset-0 rounded-xl border-2 border-gray-500 opacity-0 group-hover:opacity-100 transition"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Your Activities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Your Activities
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Applied Jobs */}
                <Link
                  href="/candidate/my-jobs"
                  className="relative bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="absolute top-0 right-0 opacity-10">
                    <Briefcase className="w-32 h-32 text-blue-600" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Applied Jobs
                    </h3>
                    <div className="text-5xl font-bold text-blue-600 mb-2">
                      {appliedJobsCount}
                    </div>
                    <p className="text-sm text-gray-600">Total applications</p>
                  </div>
                </Link>

                {/* Saved Jobs */}
                <Link
                  href="/candidate/my-jobs?tab=saved"
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="absolute top-0 right-0 opacity-10">
                    <svg
                      className="w-32 h-32 text-gray-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Saved Jobs
                    </h3>
                    <div className="text-5xl font-bold text-gray-600 mb-2">
                      {savedJobsCount}
                    </div>
                    <p className="text-sm text-gray-600">
                      Bookmarked positions
                    </p>
                  </div>
                </Link>

                {/* Job Invitations */}
                <div className="relative bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10">
                    <Mail className="w-32 h-32 text-green-600" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Job invitations
                    </h3>
                    <div className="text-5xl font-bold text-green-600 mb-2">
                      {invitationsCount}
                    </div>
                    <p className="text-sm text-gray-600">Pending invitations</p>
                  </div>
                </div>

                {/* Transaction History */}
                <Link
                  href="/candidate/transaction-history"
                  className="relative bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  <div className="absolute top-0 right-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Receipt className="w-32 h-32 text-purple-600" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Transaction History
                    </h3>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      View
                    </div>
                    <p className="text-sm text-gray-600">Package purchases</p>
                  </div>
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-purple-600 text-xl">→</span>
                  </div>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
