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
import { calculateProfileCompletion } from "@/lib/profile-completion";
import api from "@/lib/api";

export default function CandidateDashboard() {
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  
  // Auth store
  const { user, candidateId, fetchCandidateProfile } = useAuthStore();
  const userId = candidateId || user?.id;

  // Profile state
  const [profileName, setProfileName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [profileCompletion, setProfileCompletion] = useState(20);

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

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get("/api/candidates/profiles/current");
        if (response.data?.result) {
          const profile = response.data.result;
          setProfileName(profile.fullName || "");
          setProfileTitle(profile.title || "");
          setProfileImage(profile.image || "");
          
          // Calculate profile completion using same logic as cm-profile
          const completionData: any = {
            fullName: profile.fullName,
            title: profile.title,
            phone: profile.phone,
            dob: profile.dob,
            gender: profile.gender,
            address: profile.address,
            link: profile.link,
            image: profile.image,
            aboutMe: profile.aboutMe,
            awards: profile.awards || [],
            certificates: profile.certificates || [],
            projects: profile.projects || [],
            languages: profile.languages || [],
            educations: profile.educations || [],
            workExperiences: profile.workExperiences || [],
            // Flatten skill groups to get total skill count
            coreSkills: (profile.coreSkillGroups || []).flatMap((g: any) => g.items || []),
            softSkills: (profile.softSkillGroups || []).flatMap((g: any) => g.items || []),
          };
          
          console.log('📊 Dashboard Profile Data:', {
            workExperiences: completionData.workExperiences?.length || 0,
            educations: completionData.educations?.length || 0,
            coreSkills: completionData.coreSkills?.length || 0,
            softSkills: completionData.softSkills?.length || 0,
            awards: completionData.awards?.length || 0,
            certificates: completionData.certificates?.length || 0,
            projects: completionData.projects?.length || 0,
            languages: completionData.languages?.length || 0,
            hasAboutMe: !!completionData.aboutMe,
            profileFields: {
              fullName: !!completionData.fullName,
              title: !!completionData.title,
              phone: !!completionData.phone,
              dob: !!completionData.dob,
              gender: !!completionData.gender,
              address: !!completionData.address,
              link: !!completionData.link,
            }
          });
          
          const completion = calculateProfileCompletion(completionData);
          console.log('✅ Dashboard Profile Completion:', completion + '%');
          setProfileCompletion(completion);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      }
    };

    // Fetch current user info (including email) from API
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

    fetchProfile();
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
                {/* Progress Circle */}
                <div className="flex-shrink-0">
                  <div className="relative w-36 h-36">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke="#fee2e2"
                        strokeWidth="14"
                        fill="none"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="64"
                        stroke={profileCompletion >= 70 ? "#22c55e" : "#ef4444"}
                        strokeWidth="14"
                        fill="none"
                        strokeDasharray={`${64 * 2 * Math.PI * (profileCompletion / 100)} ${64 * 2 * Math.PI}`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-gray-900">
                          {profileCompletion}%
                        </div>
                        <div className="text-sm text-gray-500">completed</div>
                      </div>
                    </div>
                  </div>
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
                          Great job! Your profile is{" "}
                          <span className="text-green-600 font-semibold">{profileCompletion}%</span>{" "}
                          complete. You can now generate CV templates!
                        </span>
                      ) : (
                        <span>
                          Complete profile to{" "}
                          <span className="text-gray-600 font-semibold">70%</span>{" "}
                          to generate CV template for IT professionals.
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
