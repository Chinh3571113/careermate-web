"use client";

import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CVSidebar from "@/components/layout/CVSidebar";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useLayout } from "@/contexts/LayoutContext";
import api from "@/lib/api";
import { openCVTemplate } from "@/lib/cv-template-navigation";
import { generateHighlightedResume } from "@/lib/resume-api";
import {
  ProfileHeaderCard,
  AboutMeSection,
  EducationSection,
  WorkExperienceSection,
  LanguageSection,
  SkillsSection,
  HighlightProjectsSection,
  CertificatesSection,
  AwardsSection,
  ProfileStrengthSidebar,
} from "./components";
import toast from "react-hot-toast";
import {
  useEducation,
  useWorkExperience,
  useLanguages,
  useProjects,
  useAwards,
  useCertificates,
  useSkills,
  useAboutMe
} from "./hooks";
import { useCVStore } from "@/stores/cvStore";
import { useAuthStore } from "@/store/use-auth-store";

// Lazy load dialog components for better code splitting
const AboutMeDialog = lazy(() => import("./components/dialogs/AboutMeDialog"));
const PersonalDetailDialog = lazy(() => import("./components/dialogs/PersonalDetailDialog"));
const EducationDialog = lazy(() => import("./components/dialogs/EducationDialog"));
const WorkExperienceDialog = lazy(() => import("./components/dialogs/WorkExperienceDialog"));
const LanguageDialog = lazy(() => import("./components/dialogs/LanguageDialog"));
const ProjectDialog = lazy(() => import("./components/dialogs/ProjectDialog"));
const AwardDialog = lazy(() => import("./components/dialogs/AwardDialog"));
const CertificateDialog = lazy(() => import("./components/dialogs/CertificateDialog"));
const SkillsDialog = lazy(() => import("./components/dialogs/SkillsDialog"));

// Dialog loading fallback
const DialogFallback = () => null;

// Helper function to decode JWT token
function decodeJwt(token: string): { email?: string; sub?: string;[key: string]: any } | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export default function CMProfile() {
  // Get resumeId from URL query param (set by CV Management Edit button or Sync)
  const searchParams = useSearchParams();
  const urlResumeId = searchParams.get('resumeId');

  /**
   * Resume selection priority (handled by Zustand store with sessionStorage persist):
   * 0. resumeId from URL query param (highest priority - from Edit/Sync button)
   * 1. currentEditingResumeId from Zustand (persisted to sessionStorage)
   * 2. Resume with isActive === true (backend-driven)
   * 3. First resume in the list (default fallback)
   */
  // Use selector-based Zustand hooks to avoid unnecessary re-renders
  const currentEditingResumeId = useCVStore((s) => s.currentEditingResumeId);
  const setCurrentEditingResume = useCVStore((s) => s.setCurrentEditingResume);
  const _hasHydrated = useCVStore((s) => s._hasHydrated);

  // When URL has resumeId, save it to Zustand (which persists to sessionStorage)
  useEffect(() => {
    if (urlResumeId) {
      if (process.env.NODE_ENV === 'development') {
        console.log("📍 URL resumeId detected, saving to store:", urlResumeId);
      }
      setCurrentEditingResume(urlResumeId);
    }
  }, [urlResumeId, setCurrentEditingResume]);

  // Get candidateId and setCandidateId from auth store for avatar upload
  const { candidateId, setCandidateId } = useAuthStore();

  // Resume ID state - will be fetched from API
  const [resumeId, setResumeId] = useState<number | null>(null);
  const [isLoadingResume, setIsLoadingResume] = useState(true);

  // Custom hooks for data management
  const educationHook = useEducation(resumeId);
  const workExpHook = useWorkExperience(resumeId);
  const languagesHook = useLanguages(resumeId);
  const projectsHook = useProjects(resumeId);
  const awardsHook = useAwards(resumeId);
  const certificatesHook = useCertificates(resumeId);
  const skillsHook = useSkills(resumeId);
  const aboutMeHook = useAboutMe(resumeId);

  // UI state
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [skillType, setSkillType] = useState<string>("");
  const [selectedSkill, setSelectedSkill] = useState<string>("");
  const [skillExperience, setSkillExperience] = useState<string>("");
  const [skills, setSkills] = useState<Array<{
    id: string;
    skill: string;
    experience?: string;
  }>>([]);
  const [originalSkills, setOriginalSkills] = useState<Array<{
    id: string;
    skill: string;
    experience?: string;
  }>>([]);
  const { headerHeight } = useLayout();
  const [headerH, setHeaderH] = useState(headerHeight || 0);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Personal Detail modal state
  const [isPersonalDetailOpen, setIsPersonalDetailOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileTitle, setProfileTitle] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileDob, setProfileDob] = useState("");
  const [profileGender, setProfileGender] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Role recommendation state
  const [isRoleRecommendOpen, setIsRoleRecommendOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [roleResults, setRoleResults] = useState<Array<{
    role: string;
    confidence: number;
    experience_level: string;
    suggested_skills?: string[];
  }>>([]);
  const [showAllRoles, setShowAllRoles] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedRoleData, setSelectedRoleData] = useState<any>(null);

  // Calculate profile completion using shared hook
  const profileCompletion = useProfileCompletion({
    fullName: profileName,
    title: profileTitle,
    phone: profilePhone,
    dob: profileDob,
    gender: profileGender,
    address: profileAddress,
    link: profileLink,
    aboutMe: aboutMeHook.aboutMeText,
    awards: awardsHook.awards,
    certificates: certificatesHook.certificates,
    projects: projectsHook.projects,
    languages: languagesHook.languages,
    educations: educationHook.educations,
    workExperiences: workExpHook.workExperiences,
    coreSkillGroups: skillsHook.coreSkillGroups,
    softSkillGroups: skillsHook.softSkillGroups,
  });

  // Section completion data for ProfileStrengthSidebar
  const sectionCompletion = useMemo(() => {
    const coreSkillsCount = skillsHook.coreSkillGroups.reduce(
      (total, group) => total + (group.items?.length || 0),
      0
    );
    const softSkillsCount = skillsHook.softSkillGroups.reduce(
      (total, group) => total + (group.items?.length || 0),
      0
    );
    const totalSkillsCount = coreSkillsCount + softSkillsCount;

    return {
      aboutMe: {
        hasAny: aboutMeHook.aboutMeText.trim().length > 0
      },
      workExperience: { 
        count: workExpHook.workExperiences.length, 
        maxCount: 3 
      },
      education: {
        hasAny: educationHook.educations.length > 0
      },
      skills: {
        totalCount: totalSkillsCount,
        maxCount: 10
      },
      languages: {
        hasAny: languagesHook.languages.length > 0
      },
      projects: {
        hasAny: projectsHook.projects.length > 0
      },
      certificates: { 
        hasAny: certificatesHook.certificates.length > 0 
      },
      awards: {
        hasAny: awardsHook.awards.length > 0
      }
    };
  }, [
    aboutMeHook.aboutMeText,
    workExpHook.workExperiences.length,
    educationHook.educations.length,
    skillsHook.coreSkillGroups,
    skillsHook.softSkillGroups,
    languagesHook.languages.length,
    projectsHook.projects.length,
    certificatesHook.certificates.length,
    awardsHook.awards.length
  ]);

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

  // Decode email from access token
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        const decoded = decodeJwt(token);
        if (decoded) {
          // Email can be in 'email' or 'sub' field depending on JWT structure
          const email = decoded.email || decoded.sub || "";
          setUserEmail(email);
        }
      }
    }
  }, []);

  // Auto-create profile and resume on page load, then fetch data
  // IMPORTANT: Wait for Zustand to hydrate from sessionStorage first
  useEffect(() => {
    // Don't run until Zustand has hydrated from sessionStorage
    if (!_hasHydrated) {
      if (process.env.NODE_ENV === 'development') {
        console.log("⏳ Waiting for Zustand to hydrate from sessionStorage...");
      }
      return;
    }

    const initializeAndFetchData = async () => {
      setIsLoadingResume(true);
      if (process.env.NODE_ENV === 'development') {
        console.log("🚀 Starting initialization (hydrated, currentEditingResumeId:", currentEditingResumeId, ")");
      }

      try {
        // ✅ STEP 1: Initialize profile and resume
        await initializeProfileAndResume();

        // ✅ STEP 2: Fetch resume data
        await fetchResumeData();

        // ✅ STEP 3: Fetch personal details
        await fetchPersonalDetails();

      } catch (error: any) {
        console.error("Failed to initialize:", error);
        toast.error("Failed to load profile. Please refresh the page.");
      } finally {
        setIsLoadingResume(false);
      }
    };

    initializeAndFetchData();
  }, [_hasHydrated]); // Run when hydration completes

  // Re-fetch resume data when URL resumeId changes (e.g., after sync from CV Management)
  useEffect(() => {
    if (urlResumeId && !isLoadingResume && _hasHydrated) {
      if (process.env.NODE_ENV === 'development') {
        console.log("🔄 URL resumeId changed, re-fetching data:", urlResumeId);
      }
      fetchResumeData();
    }
  }, [urlResumeId, _hasHydrated]);

  // Initialize profile and resume helper function
  const initializeProfileAndResume = async () => {
    try {
      // ✅ STEP 1: Check if profile already exists
      let profileExists = false;
      try {
        const profileCheck = await api.get("/api/candidates/profiles/current");
        if (profileCheck.data?.result?.id) {
          profileExists = true;
        }
      } catch (checkError: any) {
        // Profile doesn't exist yet (404 or other error)
        profileExists = false;
      }

      // ✅ STEP 2: Create profile if it doesn't exist
      if (!profileExists) {
        try {
          // Check if there's a pending DoB from sign-up
          const pendingDob = typeof window !== "undefined"
            ? localStorage.getItem("pending_profile_dob")
            : null;

          // ✅ Create candidate profile - only dob is required
          const profilePayload = {
            dob: pendingDob || new Date().toISOString().split('T')[0] // Use today's date as fallback
          };

          await api.post("/api/candidates/profiles/create", profilePayload);

          // Clear the pending DoB after successful creation
          if (pendingDob && typeof window !== "undefined") {
            localStorage.removeItem("pending_profile_dob");
          }

          toast.success("Profile created successfully!");
        } catch (profileError: any) {
          // If profile already exists (409/400), just clear the flag
          if (profileError?.response?.status === 409 || profileError?.response?.status === 400) {
            if (typeof window !== "undefined") {
              localStorage.removeItem("pending_profile_dob");
            }
          } else {
            throw profileError; // Re-throw to be caught by outer try-catch
          }
        }
      } else {
        // Profile exists, clear pending DoB flag if any
        if (typeof window !== "undefined") {
          localStorage.removeItem("pending_profile_dob");
        }
      }

      // ✅ STEP 3: Check if resume exists
      let resumeExists = false;
      try {
        const resumeCheck = await api.get("/api/resume");
        if (resumeCheck.data?.result && resumeCheck.data.result.length > 0) {
          resumeExists = true;
        }
      } catch (resumeCheckError: any) {
        resumeExists = false;
      }

      // ✅ STEP 4: Create resume (blank) only if no resume exists
      if (!resumeExists) {
        try {
          const resumePayload = {
            aboutMe: ""
          };
          await api.post("/api/resume", resumePayload);
          toast.success("Resume created successfully!");

          // ✅ Wait a bit for backend to process
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (resumeError: any) {
          // Resume creation failed or already exists
          if (resumeError?.response?.status !== 409 && resumeError?.response?.status !== 400) {
            throw resumeError; // Re-throw to be caught by outer try-catch
          }
        }
      }
    } catch (error: any) {
      console.error("Initialization error:", error);
      throw error; // Re-throw to be caught by main useEffect
    }
  };

  // Fetch resume data helper function
  const fetchResumeData = async () => {
    try {
      const response = await api.get("/api/resume");

      if (response.data?.result && response.data.result.length > 0) {
        const resumes = response.data.result;

        /**
         * Resume selection logic with fallback
         * 
         * Priority order:
         * 0. resumeId from URL query param (highest - from Edit/Sync button)
         * 1. currentEditingResumeId from Zustand (persisted to sessionStorage)
         * 2. Resume with isActive === true (backend-driven)
         * 3. First resume in the list (default fallback)
         * 
         * NOTE: URL param and currentEditingResumeId are synced via useEffect above
         */
        let selectedResume = resumes[0]; // Default fallback
        let selectionSource = "default (first resume)";

        // Priority 0: Check for resumeId from URL query param
        if (urlResumeId) {
          const urlResume = resumes.find((r: any) =>
            String(r.resumeId) === urlResumeId
          );
          if (urlResume) {
            selectedResume = urlResume;
            selectionSource = `URL param: ${urlResumeId}`;
          }
        }
        // Priority 1: Check for currentEditingResumeId from Zustand (persisted to sessionStorage)
        else if (currentEditingResumeId) {
          const storedResume = resumes.find((r: any) =>
            String(r.resumeId) === currentEditingResumeId
          );
          if (storedResume) {
            selectedResume = storedResume;
            selectionSource = `Zustand/sessionStorage: ${currentEditingResumeId}`;
          }
        }
        // Priority 2: Check for active resume (backend-driven)
        else if (resumes.find((r: any) => r.isActive === true)) {
          const activeResume = resumes.find((r: any) => r.isActive === true);
          selectedResume = activeResume;
          selectionSource = "active resume (isActive=true)";
        }

        if (process.env.NODE_ENV === 'development') {
          console.log("✅ Selected resume:", selectedResume.resumeId, "| Source:", selectionSource);
        }

        const resume = selectedResume;
        setResumeId(resume.resumeId);

        // Also update Zustand store to keep it in sync
        setCurrentEditingResume(String(resume.resumeId));

        // Load About Me - always set, even if empty to ensure state sync
        console.log("📝 Loading About Me from resume:", resume.aboutMe);
        aboutMeHook.setAboutMeText(resume.aboutMe || "");

        // Load Awards
        if (resume.awards && resume.awards.length > 0) {
          const transformedAwards = resume.awards.map((award: any) => {
            const date = new Date(award.getDate);
            return {
              id: award.awardId.toString(),
              name: award.name,
              organization: award.organization,
              month: String(date.getMonth() + 1).padStart(2, '0'),
              year: String(date.getFullYear()),
              description: award.description
            };
          });
          awardsHook.setAwards(transformedAwards);
        }

        // Load Education
        if (resume.educations && resume.educations.length > 0) {
          const transformedEducations = resume.educations.map((edu: any) => {
            const startDate = new Date(edu.startDate);
            const endDate = edu.endDate ? new Date(edu.endDate) : null;
            return {
              id: edu.educationId.toString(),
              school: edu.school,
              degree: edu.degree,
              major: edu.major,
              startMonth: String(startDate.getMonth() + 1).padStart(2, '0'),
              startYear: String(startDate.getFullYear()),
              endMonth: endDate ? String(endDate.getMonth() + 1).padStart(2, '0') : '',
              endYear: endDate ? String(endDate.getFullYear()) : ''
            };
          });
          educationHook.setEducations(transformedEducations);
        }

        // Load Highlight Projects
        if (resume.highlightProjects && resume.highlightProjects.length > 0) {
          const transformedProjects = resume.highlightProjects.map((project: any) => {
            const startDate = new Date(project.startDate);
            const endDate = project.endDate ? new Date(project.endDate) : null;
            return {
              id: project.highlightProjectId.toString(),
              name: project.name,
              startMonth: String(startDate.getMonth() + 1).padStart(2, '0'),
              startYear: String(startDate.getFullYear()),
              endMonth: endDate ? String(endDate.getMonth() + 1).padStart(2, '0') : '',
              endYear: endDate ? String(endDate.getFullYear()) : '',
              description: project.description,
              url: project.projectUrl,
              working: !project.endDate
            };
          });
          projectsHook.setProjects(transformedProjects);
        }

        // Load Work Experience
        if (resume.workExperiences && resume.workExperiences.length > 0) {
          const transformedWorkExp = resume.workExperiences.map((exp: any) => {
            const startDate = new Date(exp.startDate);
            const endDate = exp.endDate ? new Date(exp.endDate) : null;
            return {
              id: exp.workExperienceId.toString(),
              jobTitle: exp.jobTitle,
              company: exp.company,
              startMonth: String(startDate.getMonth() + 1).padStart(2, '0'),
              startYear: String(startDate.getFullYear()),
              endMonth: endDate ? String(endDate.getMonth() + 1).padStart(2, '0') : '',
              endYear: endDate ? String(endDate.getFullYear()) : '',
              description: exp.description,
              project: exp.project,
              working: !exp.endDate
            };
          });
          workExpHook.setWorkExperiences(transformedWorkExp);
        }

        // Load Foreign Languages
        if (resume.foreignLanguages && resume.foreignLanguages.length > 0) {
          const transformedLanguages = resume.foreignLanguages.map((lang: any) => ({
            id: lang.foreignLanguageId.toString(),
            language: lang.language,
            level: lang.level
          }));
          languagesHook.setLanguages(transformedLanguages);
        }

        // Load Certificates
        if (resume.certificates && resume.certificates.length > 0) {
          const transformedCerts = resume.certificates.map((cert: any) => {
            const date = new Date(cert.getDate);
            return {
              id: cert.certificateId.toString(),
              name: cert.name,
              org: cert.organization,
              month: String(date.getMonth() + 1).padStart(2, '0'),
              year: String(date.getFullYear()),
              url: cert.certificateUrl,
              desc: cert.description
            };
          });
          certificatesHook.setCertificates(transformedCerts);
        }

        // Load Skills
        if (resume.skills && resume.skills.length > 0) {
          const coreSkills = resume.skills.filter((skill: any) => skill.skillType === "core");
          const softSkills = resume.skills.filter((skill: any) => skill.skillType === "soft");

          // Transform core skills
          if (coreSkills.length > 0) {
            const coreSkillItems = coreSkills.map((skill: any) => ({
              id: skill.skillId.toString(),
              skill: skill.skillName,
              experience: skill.yearOfExperience ? String(skill.yearOfExperience) : ''
            }));

            skillsHook.setCoreSkillGroups([{
              id: 'core-group-1',
              name: 'Core Skills',
              items: coreSkillItems
            }]);
          }

          // Transform soft skills
          if (softSkills.length > 0) {
            const softSkillItems = softSkills.map((skill: any) => ({
              id: skill.skillId.toString(),
              skill: skill.skillName
            }));

            skillsHook.setSoftSkillGroups([{
              id: 'soft-group-1',
              name: 'Soft Skills',
              items: softSkillItems
            }]);
          }
        }
      }
    } catch (error: any) {
      // Handle 400 error when resume is just created
      if (error?.response?.status === 400) {
        if (process.env.NODE_ENV === 'development') {
          console.log("Resume exists but empty - this is expected for new users");
        }
        // Don't throw error, just continue with empty data
      } else {
        console.error("Failed to load resume data:", error);
        toast.error("Failed to load resume data");
        throw error; // Re-throw for other errors
      }
    }
  };

  // Fetch personal details helper function
  const fetchPersonalDetails = async () => {
    try {
      // ✅ Use /api/candidates/profiles/current
      const response = await api.get("/api/candidates/profiles/current");

      if (response.data?.result) {
        const profile = response.data.result;

        // ✅ Set candidateId for avatar upload
        if (profile.candidateId) {
          setCandidateId(profile.candidateId);
        }

        // ✅ Use fullName from API (not username)
        setProfileName(profile.fullName || "");
        setProfileTitle(profile.title || "");
        setProfilePhone(profile.phone || "");
        setProfileDob(profile.dob || "");
        setProfileGender(profile.gender || "");
        setProfileAddress(profile.address || "");
        setProfileLink(profile.link || "");
        setProfileImage(profile.image || "");
      }
    } catch (error) {
      // Don't show error on initial load if profile doesn't exist yet
      console.error("Failed to fetch personal details:", error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const handleAddSkill = () => {
    if (!selectedSkill) return;
    // For core skills, require experience; for soft, ignore experience
    if (skillType === "core" && !skillExperience) return;
    const newItem = {
      id: Date.now().toString(),
      skill: selectedSkill,
      ...(skillType === "core" ? { experience: skillExperience } : {}),
    } as { id: string; skill: string; experience?: string };

    setSkills((prev) => [...prev, newItem]);
    setSelectedSkill("");
    if (skillType === "core") setSkillExperience("");
  };

  const handleRemoveSkill = (id: string) => {
    setSkills(skills.filter(skill => skill.id !== id));
  };

  const handleSaveSkills = async () => {
    if (skillType !== "core" && skillType !== "soft") {
      toast.error("Please select a skill type");
      return;
    }

    await skillsHook.saveSkills(skills, skillType, originalSkills);

    // Generate highlighted resume (roadmap) after saving skills
    if (resumeId) {
      try {
        await generateHighlightedResume(resumeId);
        console.log('✅ Highlighted resume generated after saving skills');
      } catch (error) {
        console.error('❌ Error generating highlighted resume:', error);
        // Don't show error to user as this is a background operation
      }
    }

    // Reset form after successful save
    setSkillType("");
    setSkills([]);
    setOriginalSkills([]);
    setSelectedSkill("");
    setSkillExperience("");
  };

  const handleCancelSkills = () => {
    skillsHook.setIsSkillDialogOpen(false);
    // Reset form
    setSkillType("");
    setSkills([]);
    setOriginalSkills([]);
    setSelectedSkill("");
    setSkillExperience("");
  };

  // Edit handlers for skills
  const handleEditCoreSkills = (group: any) => {
    // Populate dialog with existing core skills
    setSkillType("core");
    const groupSkills = group.items || [];
    setSkills([...groupSkills]);
    setOriginalSkills([...groupSkills]); // Store original for comparison
    skillsHook.setIsSkillDialogOpen(true);
  };

  const handleEditSoftSkills = () => {
    // Populate dialog with existing soft skills
    setSkillType("soft");
    const softSkills = skillsHook.softSkillGroups.flatMap(group => group.items || []);
    setSkills([...softSkills]);
    setOriginalSkills([...softSkills]); // Store original for comparison
    skillsHook.setIsSkillDialogOpen(true);
  };

  // Personal Detail handlers
  const handleSavePersonalDetail = async () => {
    // Only fullName and dob are required
    if (!profileName || !profileName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!profileDob) {
      toast.error("Date of birth is required");
      return;
    }

    try {
      // ✅ Update profile via /api/candidates/profiles
      // Payload structure: { dob, title, fullName, phone, address, image, gender, link }
      // Send empty string for optional fields if not provided
      const profileData = {
        dob: profileDob,
        title: profileTitle || "",
        fullName: profileName,
        phone: profilePhone || "",
        address: profileAddress || "",
        image: profileImage || "",
        gender: profileGender || "",
        link: profileLink || ""
      };

      await api.put("/api/candidates/profiles", profileData);

      toast.success("Personal details updated successfully!");
      setIsPersonalDetailOpen(false);
    } catch (error: any) {
      toast.error("Failed to update personal details. Please try again.");
    }
  };

  // Role recommendation handlers
  const handleGetRecommendRole = () => {
    // Đóng Personal Detail Dialog (nếu đang mở)
    setIsPersonalDetailOpen(false);

    // Mở Role Recommend Dialog
    setIsRoleRecommendOpen(true);
    setInputText("");
    setRoleResults([]);
    setShowAllRoles(false);
    setSelectedRole(null);
    setSelectedRoleData(null);
  };

  const handleAnalyzeText = async () => {
    if (!inputText.trim()) {
      toast.error("Please enter text to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      // ✅ Get Python API URL from environment variable
      const API_BASE = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';
      console.log('🔗 Python API URL:', API_BASE);

      // ✅ Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch(`${API_BASE}/api/cv-creation/recommend-roles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to parse error response from backend
        let errorMessage = `API Error: ${response.status}`;
        let isValidationError = false;
        try {
          const errorData = await response.json();
          
          // Extract meaningful error message
          if (errorData.error) {
            errorMessage = errorData.error;
            // Check if this is a validation error (400) vs server error (500)
            isValidationError = response.status === 400;
            // Add suggestion if available
            if (errorData.suggestion) {
              errorMessage += `. ${errorData.suggestion}`;
            }
          }
          
          // Only log to console for server errors, not validation errors
          if (!isValidationError) {
            console.error('❌ Python API Error:', response.status, errorData);
          }
        } catch {
          // If JSON parsing fails, ignore
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Check if backend returned success: false (even with 200 status)
      if (data.success === false) {
        throw new Error(data.error || 'Failed to analyze text');
      }

      // Sort by confidence and store results
      const sortedResults = (data.recommendations || data.roles || []).sort((a: any, b: any) => b.confidence - a.confidence);
      setRoleResults(sortedResults);

      if (sortedResults.length === 0) {
        toast.error("No role recommendations found. Try describing your skills and experience.");
      } else {
        toast.success(`Found ${sortedResults.length} role recommendations!`);
      }
    } catch (error: any) {
      // Only log unexpected errors to console
      const isValidationError = error.message?.includes('Could not extract any skills') || 
                                error.message?.includes('Text input is empty');
      
      if (!isValidationError && error.name !== 'AbortError') {
        console.error('❌ Error analyzing text:', error.message || error);
      }

      // ✅ User-friendly error messages
      if (error.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        toast.error("Cannot connect to AI service. Please check if the Python service is running.");
      } else if (error.message.includes('Could not extract any skills')) {
        toast.error("No skills detected. Please mention specific technologies, frameworks, or programming languages.");
      } else {
        toast.error(error.message || "Failed to analyze text. Please try again.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectRole = (role: any) => {
    setSelectedRole(role.role);
    setSelectedRoleData(role);
  };

  const handleConfirmRole = async () => {
    if (!selectedRoleData) {
      toast.error("Please select a role first");
      return;
    }

    try {
      // Fetch current profile to get existing values
      let currentFullName = profileName?.trim() || "";
      let currentDob = profileDob || "";

      if (!currentFullName || !currentDob) {
        try {
          const resp = await api.get('/api/candidates/profiles/current');
          const p = resp.data?.result;
          if (p) {
            currentFullName = currentFullName || (p.fullName || "");
            currentDob = currentDob || (p.dob || "");
            // update local state so UI reflects fetched values
            if (!profileName && p.fullName) setProfileName(p.fullName);
            if (!profileDob && p.dob) setProfileDob(p.dob);
          }
        } catch (fetchErr) {
          console.warn('Could not fetch current profile before updating title', fetchErr);
        }
      }

      // Backend requires fullName and dob
      if (!currentFullName || !currentDob) {
        toast.error('Please complete your name and date of birth in Personal Details before updating title.');
        return;
      }

      // Send ALL fields - use empty string for optional fields if not present
      // Backend expects all fields in PUT request
      const profileData = {
        title: selectedRoleData.role,
        fullName: currentFullName,
        dob: currentDob,
        phone: profilePhone?.trim() || "",
        address: profileAddress?.trim() || "",
        gender: profileGender?.trim() || "",
        image: profileImage?.trim() || "",
        link: profileLink?.trim() || ""
      };

      console.log('📤 Updating profile with:', profileData);

      await api.put('/api/candidates/profiles', profileData);

      // Update local state
      setProfileTitle(selectedRoleData.role);

      toast.success('Professional Title updated successfully!');
      setIsRoleRecommendOpen(false);

      // Reset states
      setInputText('');
      setRoleResults([]);
      setShowAllRoles(false);
      setSelectedRole(null);
      setSelectedRoleData(null);
    } catch (error: any) {
      console.error('Error updating professional title:', error);
      console.error('Error response:', error.response?.data || error.response);
      toast.error(error.response?.data?.message || 'Failed to update Professional Title. Please try again.');
    }
  };

  // Handler for Preview & Download CV button
  const handlePreviewCV = () => {
    // Prepare CV data from profile information
    // Note: This data will be normalized by openCVTemplate to match CVData interface
    const cvData = {
      personalInfo: {
        fullName: profileName || "",
        position: profileTitle || "",
        email: userEmail || "", // Use fetched email
        phone: profilePhone || "",
        location: profileAddress || "",
        linkedin: profileLink || "", // CVPreview uses personalInfo.linkedin for personal link
        photoUrl: profileImage || "",
        summary: aboutMeHook.aboutMeText || "",
        dob: profileDob || "", // Add date of birth
        gender: profileGender || "", // Add gender
      },
      experience: workExpHook.workExperiences || [],
      education: educationHook.educations || [],
      // Pass both coreSkillGroups and softSkillGroups for proper normalization
      coreSkillGroups: skillsHook.coreSkillGroups || [],
      softSkillGroups: skillsHook.softSkillGroups || [],
      languages: languagesHook.languages || [],
      certifications: certificatesHook.certificates || [],
      projects: projectsHook.projects || [],
      awards: awardsHook.awards || [],
    };

    // Prepare profile data
    const profile = {
      fullName: profileName,
      title: profileTitle,
      phone: profilePhone,
      dob: profileDob,
      gender: profileGender,
      address: profileAddress,
      link: profileLink,
      image: profileImage,
    };

    // Use default template - classic is the standard template
    const templateId = "classic";

    // Navigate to CV template page with data
    openCVTemplate(cvData, profile, templateId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div
          className="grid grid-cols-1 lg:grid-cols-[16rem_minmax(0,1fr)_18rem] gap-6 items-start transition-all duration-300"
          style={{
            ["--sticky-offset" as any]: `${headerH}px`,
            ["--content-pad" as any]: "24px",
          }}
        >
          {/* Sidebar */}
          <aside className="hidden lg:block sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <CVSidebar activePage="cm-profile" />
          </aside>

          {/* Main Content */}
          <section className="space-y-6 min-w-0 transition-all duration-300">
            {isLoadingResume ? (
              /* Loading State - Skeleton Loaders */
              <div className="space-y-6">
                {/* Profile Header Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      </div>
                    </div>
                    <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </div>

                {/* Content Sections Skeleton */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                      <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/5 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Actual Content */
              <>
                {/* Profile Header */}
                <ProfileHeaderCard
                  profileName={profileName}
                  profileTitle={profileTitle}
                  profileImage={profileImage}
                  profilePhone={profilePhone}
                  profileDob={profileDob}
                  profileGender={profileGender}
                  profileAddress={profileAddress}
                  profileLink={profileLink}
                  email={userEmail}
                  onEditPersonalDetails={() => setIsPersonalDetailOpen(true)}
                />

                {/* About Me */}
                <AboutMeSection
                  aboutMeText={aboutMeHook.aboutMeText}
                  onEdit={() => aboutMeHook.setIsAboutMeOpen(true)}
                />

                {/* Education */}
                <EducationSection
                  educations={educationHook.educations}
                  onAdd={() => educationHook.openEducationDialog()}
                  onEdit={(edu) => educationHook.openEducationDialog(edu)}
                  onRemove={educationHook.removeEducation}
                />

                {/* Work Experience */}
                <WorkExperienceSection
                  workExperiences={workExpHook.workExperiences}
                  onAdd={() => workExpHook.openWorkExpDialog()}
                  onEdit={(exp) => workExpHook.openWorkExpDialog(exp)}
                  onRemove={workExpHook.removeWorkExp}
                />

                {/* Foreign Language */}
                <LanguageSection
                  languages={languagesHook.languages}
                  onAdd={() => languagesHook.openLanguageDialog()}
                  onEdit={(lang) => {
                    // Language edit uses same dialog as add
                    languagesHook.openLanguageDialog();
                  }}
                  onRemove={languagesHook.removeLanguage}
                />

                {/* Skills */}
                <SkillsSection
                  coreSkillGroups={skillsHook.coreSkillGroups}
                  softSkillItems={skillsHook.softSkillGroups.flatMap(group => group.items || [])}
                  onAddCoreSkills={() => {
                    setSkillType("core");
                    setSkills([]);
                    setOriginalSkills([]);
                    skillsHook.setIsSkillDialogOpen(true);
                  }}
                  onAddSoftSkills={() => {
                    setSkillType("soft");
                    setSkills([]);
                    setOriginalSkills([]);
                    skillsHook.setIsSkillDialogOpen(true);
                  }}
                  onEditCoreSkills={handleEditCoreSkills}
                  onEditSoftSkills={handleEditSoftSkills}
                  onDeleteCoreSkills={() => skillsHook.deleteAllSkills('core')}
                  onDeleteSoftSkills={() => skillsHook.deleteAllSkills('soft')}
                  popoverOpen={popoverOpen}
                  setPopoverOpen={setPopoverOpen}
                />

                {/* Highlight Project */}
                <HighlightProjectsSection
                  projects={projectsHook.projects}
                  onAdd={() => projectsHook.openProjectDialog()}
                  onEdit={(project) => projectsHook.openProjectDialog(project)}
                  onRemove={projectsHook.removeProject}
                />

                {/* Certificates */}
                <CertificatesSection
                  certificates={certificatesHook.certificates}
                  onAdd={() => certificatesHook.openCertDialog()}
                  onEdit={(cert) => certificatesHook.openCertDialog(cert)}
                  onRemove={certificatesHook.removeCertificate}
                />

                {/* Awards */}
                <AwardsSection
                  awards={awardsHook.awards}
                  onAdd={() => awardsHook.openAwardsDialog()}
                  onEdit={(award) => awardsHook.openAwardsDialog(award)}
                  onRemove={awardsHook.removeAward}
                />
              </>
            )}
          </section>

          {/* Right Sidebar - Profile Strength */}
          <ProfileStrengthSidebar
            profileCompletion={profileCompletion}
            expandedSections={expandedSections}
            onToggleSection={toggleSection}
            onPreviewClick={handlePreviewCV}
            sectionCompletion={sectionCompletion}
            onAddAboutMe={() => aboutMeHook.setIsAboutMeOpen(true)}
            onAddWorkExperience={() => workExpHook.openWorkExpDialog()}
            onAddEducation={() => educationHook.openEducationDialog()}
            onAddSkills={() => {
              setSkillType('core');
              setSkills([]);
              setOriginalSkills([]);
              skillsHook.setIsSkillDialogOpen(true);
            }}
            onAddLanguages={() => languagesHook.openLanguageDialog()}
            onAddProjects={() => projectsHook.openProjectDialog()}
            onAddCertificates={() => certificatesHook.openCertDialog()}
            onAddAwards={() => awardsHook.openAwardsDialog()}
          />
        </div>
      </main>

      {/* Lazy-loaded Dialog Components wrapped in Suspense */}
      <Suspense fallback={<DialogFallback />}>
        {/* Skills Dialog Component */}
        <SkillsDialog
          open={skillsHook.isSkillDialogOpen}
          onOpenChange={skillsHook.setIsSkillDialogOpen}
          skillType={skillType as 'core' | 'soft' | ''}
          skills={skills}
          selectedSkill={selectedSkill}
          skillExperience={skillExperience}
          onSelectedSkillChange={setSelectedSkill}
          onSkillExperienceChange={setSkillExperience}
          onAddSkill={handleAddSkill}
          onRemoveSkill={handleRemoveSkill}
          onSave={handleSaveSkills}
          onCancel={handleCancelSkills}
          isEditMode={originalSkills.length > 0}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Certificate Dialog Component */}
        <CertificateDialog
          open={certificatesHook.isCertDialogOpen}
          onOpenChange={certificatesHook.setIsCertDialogOpen}
          editingCertificate={certificatesHook.editingCert}
          onEditingCertificateChange={certificatesHook.setEditingCert}
          onSave={certificatesHook.saveCertificate}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* About Me Modal */}
        <AboutMeDialog
          open={aboutMeHook.isAboutMeOpen}
          onOpenChange={aboutMeHook.setIsAboutMeOpen}
          value={aboutMeHook.aboutMeText}
          onChange={aboutMeHook.handleAboutMeChange}
          onSave={aboutMeHook.saveAboutMe}
          maxLength={2500}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Personal Detail Modal */}
        <PersonalDetailDialog
          open={isPersonalDetailOpen}
          onOpenChange={setIsPersonalDetailOpen}
          profileName={profileName}
          profileTitle={profileTitle}
          profilePhone={profilePhone}
          profileDob={profileDob}
          profileGender={profileGender}
          profileAddress={profileAddress}
          profileLink={profileLink}
          profileImage={profileImage}
          onProfileNameChange={setProfileName}
          onProfileTitleChange={setProfileTitle}
          onProfilePhoneChange={setProfilePhone}
          onProfileDobChange={setProfileDob}
          onProfileGenderChange={setProfileGender}
          onProfileAddressChange={setProfileAddress}
          onProfileLinkChange={setProfileLink}
          onProfileImageChange={setProfileImage}
          onSave={handleSavePersonalDetail}
          onGetRecommendRole={handleGetRecommendRole} // ✅ Hàm mở Role Recommend Dialog
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Education Modal */}
        <EducationDialog
          open={educationHook.isEducationOpen}
          onOpenChange={educationHook.setIsEducationOpen}
          editingEducation={educationHook.editingEducation}
          onEditingEducationChange={educationHook.setEditingEducation}
          onSave={educationHook.saveEducation}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Work Experience Dialog Component */}
        <WorkExperienceDialog
          open={workExpHook.isWorkExpOpen}
          onOpenChange={workExpHook.setIsWorkExpOpen}
          editingWorkExp={workExpHook.editingWorkExp}
          onEditingWorkExpChange={workExpHook.setEditingWorkExp}
          onSave={workExpHook.saveWorkExp}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Language Dialog Component */}
        <LanguageDialog
          open={languagesHook.isLanguageOpen}
          onOpenChange={languagesHook.setIsLanguageOpen}
          languages={languagesHook.languages}
          onAddLanguage={languagesHook.addLanguage}
          onRemoveLanguage={languagesHook.removeLanguage}
          onSave={languagesHook.saveLanguages}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Award Dialog Component */}
        <AwardDialog
          open={awardsHook.isAwardsOpen}
          onOpenChange={awardsHook.setIsAwardsOpen}
          editingAward={awardsHook.editingAward}
          onEditingAwardChange={awardsHook.setEditingAward}
          onSave={awardsHook.saveAward}
        />
      </Suspense>

      <Suspense fallback={<DialogFallback />}>
        {/* Project Dialog Component */}
        <ProjectDialog
          open={projectsHook.isProjectOpen}
          onOpenChange={projectsHook.setIsProjectOpen}
          editingProject={projectsHook.editingProject}
          onEditingProjectChange={projectsHook.setEditingProject}
          onSave={projectsHook.saveProject}
        />
      </Suspense>

      {/* Role Recommendation Dialog (Phần này sẽ hiển thị khi isRoleRecommendOpen là true) */}
      {isRoleRecommendOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Get Role Recommendations</h2>
              <button
                onClick={() => setIsRoleRecommendOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Input Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Enter your skills, experience, or resume text for analysis
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Example: I have 5 years of experience in React, Node.js, and TypeScript. I've built multiple full-stack applications..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-y"
                  disabled={isAnalyzing}
                />
                <button
                  onClick={handleAnalyzeText}
                  disabled={isAnalyzing || !inputText.trim()}
                  className="w-full px-4 py-3 bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg hover:from-[#3a4660] hover:to-[#3a4660] transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Analyze'
                  )}
                </button>
              </div>

              {/* Results Section */}
              {roleResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Recommended Roles</h3>

                  {/* Top 3 or All Roles */}
                  <div className="space-y-3">
                    {(showAllRoles ? roleResults : roleResults.slice(0, 3)).map((role, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectRole(role)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedRole === role.role
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{role.role}</h4>
                            <p className="text-sm text-gray-600">Experience Level: {role.experience_level}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                              {(role.confidence * 100).toFixed(0)}% Match
                            </span>
                          </div>
                        </div>

                        {/* Show suggested skills when role is selected */}
                        {selectedRole === role.role && role.suggested_skills && role.suggested_skills.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Suggested Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {role.suggested_skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* View More Button */}
                  {roleResults.length > 3 && (
                    <button
                      onClick={() => setShowAllRoles(!showAllRoles)}
                      className="w-full px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      {showAllRoles ? 'Show Less' : `View More Recommendations (${roleResults.length - 3} more)`}
                    </button>
                  )}

                  {/* Confirm Button */}
                  {selectedRole && (
                    <div className="pt-4 border-t border-gray-200">
                      <button
                        onClick={handleConfirmRole}
                        className="w-full px-4 py-3 bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg hover:from-[#3a4660] hover:to-[#3a4660] transition-colors font-medium"
                      >
                        Confirm & Update Professional Title
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}