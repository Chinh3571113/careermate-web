"use client";

import { useState, useEffect } from "react";
import CVSidebar from "@/components/layout/CVSidebar";
import Link from "next/link";
import { FileText, Briefcase, Mail, Receipt, FolderOpen, BriefcaseBusiness } from "lucide-react";
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
import { fetchCurrentCandidateProfile } from "@/lib/candidate-profile-api";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { ProfileProgressCircle } from "@/components/ui/profile-progress-circle";
import { useCVStore } from "@/stores/cvStore";
import api from "@/lib/api";
import { FaEnvelope} from "react-icons/fa";


export default function CandidateDashboard() {
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  
  // Auth store
  const { user, candidateId, fetchCandidateProfile, setProfile } = useAuthStore();
  const userId = candidateId || user?.id;

  // Get current editing resume ID from Zustand (same as CM Profile)
  const currentEditingResumeId = useCVStore((s) => s.currentEditingResumeId);
  
  // Resume ID state - for CV completion tracking only
  const [resumeId, setResumeId] = useState<number | null>(null);

  // ✅ Profile state (from Candidate Profile API - for user display)
  const [profileName, setProfileName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  
  // ✅ Resume data state (for CV completion calculation only, NOT for user display)
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

  // Calculate profile completion (based on resume data)
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

  // ✅ PRIMARY: Fetch profile data from Candidate Profile API (for user display)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoadingProfile(true);
        console.log('🔍 Dashboard: Fetching candidate profile...');
        const profile = await fetchCurrentCandidateProfile();
        
        console.log('✅ Dashboard: Candidate profile fetched:', {
          fullName: profile.fullName,
          title: profile.title,
          hasImage: !!profile.image,
        });
        
        // Set profile display data (for user card)
        setProfileName(profile.fullName || "");
        setProfileTitle(profile.title || "Update your title");
        setProfileImage(profile.image || "");
        
        // ✅ SYNC with AuthStore (single source of truth)
        setProfile({
          fullName: profile.fullName || "",
          title: profile.title || "",
          image: profile.image || "",
        });
        
      } catch (error) {
        console.error("❌ Dashboard: Failed to fetch candidate profile:", error);
        // Set defaults if profile not found
        setProfileName("");
        setProfileTitle("Update your title");
        setProfileImage("");
        setProfile(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();

    // Refresh profile data when page becomes visible (user returns from cm-profile)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📍 Page visible again, refreshing profile data...');
        fetchProfile();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []); // Run once on mount and on visibility change

  // ✅ SECONDARY: Fetch resume data (for CV completion calculation only)
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        console.log('� Dashboard: Fetching resume data for completion...');
        const response = await api.get("/api/resume");
        
        if (response.data?.result && response.data.result.length > 0) {
          const resumes = response.data.result;
          
          // Select resume using priority:
          // 1. currentEditingResumeId from Zustand (synced with CM Profile)
          // 2. Resume with isActive === true
          // 3. First resume in list
          let selectedResume;
          
          if (currentEditingResumeId) {
            selectedResume = resumes.find((r: any) => 
              String(r.resumeId) === currentEditingResumeId
            );
          }
          
          if (!selectedResume) {
            selectedResume = resumes.find((r: any) => r.isActive === true);
          }
          
          if (!selectedResume) {
            selectedResume = resumes[0];
          }
          
          const resume = selectedResume;
          
          console.log('✅ Dashboard: Resume selected for completion:', {
            resumeId: resume.resumeId,
            isActive: resume.isActive
          });
          
          // Set resumeId state
          setResumeId(resume.resumeId);
          
          // Set profile data ONLY for completion calculation
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
          
          console.log('✅ Dashboard: Resume data set for completion calculation');
        } else {
          console.log('ℹ️ Dashboard: No resume found');
          setProfileData({});
        }
      } catch (error) {
        console.error("❌ Dashboard: Failed to fetch resume data:", error);
        setProfileData({});
      }
    };

    fetchResumeData();
  }, [currentEditingResumeId]); // Re-fetch when currentEditingResumeId changes

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
  const displayName = profileName || user?.fullName || user?.name || user?.email?.split('@')[0] || '';
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
                    {isLoadingProfile && !displayName ? (
                      <>
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                        <div className="h-4 w-40 bg-gray-200 rounded animate-pulse"></div>
                      </>
                    ) : (
                      <>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                          {displayName}
                        </h1>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                          <BriefcaseBusiness className="w-4 h-4 text-gray-400" />
                          {profileTitle || 'Update your title'}
                        </p>
                        <p className="text-sm text-gray-500 flex items-center gap-2">
                          <FaEnvelope className="w-3 h-3 text-gray-400" />
                          {userEmail || user?.email || 'No email'}
                        </p>
                        <Link
                          href="/candidate/cm-profile"
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1 inline-block"
                        >
                          Update your profile →
                        </Link>
                      </>
                    )}
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
                      <span className="text-white font-medium">Default CV</span>
                      <span className="text-xs bg-white/20 backdrop-blur-sm text-white px-2 py-0.5 rounded-full">
                        Default
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
                        {defaultCV.type === 'UPLOADED' ? 'Uploaded CV' : 'Built CV'}
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
                    {/* Template 1 - Modern */}
                    <Link
                      href="/cv-templates"
                      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="aspect-[3/4] relative bg-gradient-to-br from-blue-50 to-white">
                        <img
                          src="/images/cvtemp/modern.png"
                          alt="Modern CV Template"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-700 truncate">Modern</p>
                        <p className="text-[10px] text-gray-500">Professional design</p>
                      </div>
                    </Link>
                    
                    {/* Template 2 - Elegant */}
                    <Link
                      href="/cv-templates"
                      className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="aspect-[3/4] relative bg-gradient-to-br from-purple-50 to-white">
                        <img
                          src="/images/cvtemp/elegant.png"
                          alt="Elegant CV Template"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-700 truncate">Elegant</p>
                        <p className="text-[10px] text-gray-500">Sophisticated look</p>
                      </div>
                    </Link>
                    
                    {/* Explore CV templates */}
                    <Link
                      href="/cv-templates"
                      className="rounded-xl border border-gray-200 bg-white shadow-sm p-2 flex flex-col items-center justify-center min-h-[180px] relative cursor-pointer group hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col items-center justify-center h-full w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 mb-2 group-hover:bg-blue-50 transition-colors">
                          <span className="text-gray-600 text-xl group-hover:text-blue-600 transition-colors">⊕</span>
                        </div>
                        <span className="text-gray-600 font-semibold text-base text-center group-hover:text-blue-600 transition-colors">
                          Explore CV templates
                        </span>
                      </div>
                    </Link>
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
