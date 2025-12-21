import { SquarePlus, ChevronDown, ChevronUp } from "lucide-react";
import { ProfileProgressCircle } from "@/components/ui/profile-progress-circle";

interface SectionCompletion {
    aboutMe: { hasAny: boolean };
    workExperience: { count: number; maxCount: number }; // max 3
    education: { hasAny: boolean };
    skills: { totalCount: number; maxCount: number }; // max 10 total skills
    languages: { hasAny: boolean };
    projects: { hasAny: boolean };
    certificates: { hasAny: boolean };
    awards: { hasAny: boolean };
}

interface ProfileStrengthSidebarProps {
    profileCompletion: number;
    expandedSections: string[];
    onToggleSection: (section: string) => void;
    onPreviewClick?: () => void;
    sectionCompletion?: SectionCompletion;
    // Dialog open handlers
    onAddAboutMe?: () => void;
    onAddEducation?: () => void;
    onAddWorkExperience?: () => void;
    onAddSkills?: () => void;
    onAddLanguages?: () => void;
    onAddProjects?: () => void;
    onAddCertificates?: () => void;
    onAddAwards?: () => void;
}

// Helper function to get status message based on completion percentage
const getStatusMessage = (completion: number) => {
    if (completion >= 70) {
        return {
            title: "Great!",
            description: "Your profile is strong enough to generate a CV tailored for IT professionals.",
            actionLabel: "What you can improve",
        };
    } else if (completion >= 40) {
        return {
            title: "Almost there!",
            description: "Complete your profile to at least 70% to generate your CV template.",
            actionLabel: "What you should add",
        };
    } else {
        return {
            title: "Let's get started!",
            description: "Your profile is still in early stage. Add more information to unlock CV generation.",
            actionLabel: "What you should add",
        };
    }
};

export default function ProfileStrengthSidebar({
    profileCompletion,
    expandedSections,
    onToggleSection,
    onPreviewClick,
    sectionCompletion,
    onAddAboutMe,
    onAddWorkExperience,
    onAddEducation,
    onAddSkills,
    onAddLanguages,
    onAddProjects,
    onAddCertificates,
    onAddAwards
}: ProfileStrengthSidebarProps) {
    const statusInfo = getStatusMessage(profileCompletion);
    const isEligible = profileCompletion >= 70;

    // Calculate which sections are incomplete
    const incompleteSections = {
        aboutMe: !sectionCompletion || !sectionCompletion.aboutMe.hasAny,
        workExperience: !sectionCompletion || sectionCompletion.workExperience.count < sectionCompletion.workExperience.maxCount,
        education: !sectionCompletion || !sectionCompletion.education.hasAny,
        skills: !sectionCompletion || sectionCompletion.skills.totalCount < sectionCompletion.skills.maxCount,
        languages: !sectionCompletion || !sectionCompletion.languages.hasAny,
        projects: !sectionCompletion || !sectionCompletion.projects.hasAny,
        certificates: !sectionCompletion || !sectionCompletion.certificates.hasAny,
        awards: !sectionCompletion || !sectionCompletion.awards.hasAny
    };

    // Primary items to show (collapsed) - ordered as they appear in UI from top to bottom
    const primaryItems = [
        { key: 'aboutMe', label: 'Add About Me', onClick: onAddAboutMe, show: incompleteSections.aboutMe },
        { key: 'education', label: 'Add Education', onClick: onAddEducation, show: incompleteSections.education },
        { key: 'workExperience', label: 'Add Work Experience', onClick: onAddWorkExperience, show: incompleteSections.workExperience },
    ].filter(item => item.show);

    // Secondary items (expanded) - ordered as they appear in UI from top to bottom
    const secondaryItems = [
        { key: 'skills', label: 'Add Skills', onClick: onAddSkills, show: incompleteSections.skills },
        { key: 'projects', label: 'Add Highlight Project', onClick: onAddProjects, show: incompleteSections.projects },
        { key: 'languages', label: 'Add Foreign Language', onClick: onAddLanguages, show: incompleteSections.languages },
        { key: 'certificates', label: 'Add Certificates', onClick: onAddCertificates, show: incompleteSections.certificates },
        { key: 'awards', label: 'Add Awards', onClick: onAddAwards, show: incompleteSections.awards },
    ].filter(item => item.show);

    const isExpanded = expandedSections.includes("more");
    const hasSecondaryItems = secondaryItems.length > 0;

    return (
        <aside className="hidden xl:block space-y-6 sticky [top:calc(var(--sticky-offset)+var(--content-pad))] self-start transition-all duration-300">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-5">
                    Profile Strength
                </h3>

                {/* Progress Circle - Using shared component */}
                <div className="flex justify-center mb-6">
                    <ProfileProgressCircle
                        completion={profileCompletion}
                        size="md"
                    />
                </div>

                {/* Status Message Box */}
                <div className={`rounded-lg p-4 mb-6 ${isEligible ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-200"}`}>
                    <p className={`text-sm font-semibold mb-1 ${isEligible ? "text-green-700" : "text-gray-700"}`}>
                        {statusInfo.title}
                    </p>
                    <p className={`text-sm ${isEligible ? "text-green-600" : "text-gray-600"}`}>
                        {statusInfo.description}
                    </p>
                </div>

                {/* Action Items Section */}
                {(primaryItems.length > 0 || hasSecondaryItems) && (
                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-700">
                            {statusInfo.actionLabel}
                        </p>

                        {/* Primary Items */}
                        {primaryItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={item.onClick}
                                className="w-full text-left flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                            >
                                <SquarePlus className="w-4 h-4" />
                                <span>{item.label}</span>
                            </button>
                        ))}

                        {/* Secondary Items (when expanded) */}
                        {isExpanded && secondaryItems.map((item) => (
                            <button
                                key={item.key}
                                onClick={item.onClick}
                                className="w-full text-left flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                            >
                                <SquarePlus className="w-4 h-4" />
                                <span>{item.label}</span>
                            </button>
                        ))}

                        {/* Show More/Less Toggle - Always at bottom */}
                        {hasSecondaryItems && (
                            <button
                                onClick={() => onToggleSection("more")}
                                className="w-full flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium transition-colors text-sm"
                            >
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                                <span>{isExpanded ? "Show less" : "Add more information"}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* Primary Action Button */}
                <div className="pt-4">
                    {isEligible ? (
                        <button
                            onClick={onPreviewClick}
                            className="w-full py-3 bg-gradient-to-r from-[#3a4660] to-gray-400 text-white font-medium rounded-lg hover:from-[#3a4660] hover:to-[#3a4660] transition-all duration-200"
                        >
                            Preview & Download CV
                        </button>
                    ) : (
                        <div className="relative group">
                            <button
                                disabled
                                className="w-full py-3 bg-gray-500 text-white font-medium rounded-lg cursor-not-allowed opacity-70"
                            >
                                Your profile is not ready
                            </button>

                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
                                Complete at least 70% of your profile to generate your CV
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
