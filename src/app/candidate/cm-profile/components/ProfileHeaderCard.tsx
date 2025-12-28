"use client";

import { FiEdit, FiX } from "react-icons/fi";
import { Mail, Phone, Calendar, MapPin, Link, Sparkles, Mars, Venus, CircleSmall, Lock } from "lucide-react";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { useEffect, useState } from "react";
import { getMyInvoice } from "@/lib/invoice-api";
import { useRouter } from "next/navigation";
import { checkCVAnalyseAccess } from "@/lib/entitlement-api";
import toast from "react-hot-toast";

interface ProfileHeaderCardProps {
    profileName: string;
    profileTitle: string;
    profileImage: string;
    profilePhone: string;
    profileDob: string;
    profileGender: string;
    profileAddress: string;
    profileLink: string;
    email: string;
    onEditPersonalDetails: () => void;
}

export default function ProfileHeaderCard({
    profileName,
    profileTitle,
    profileImage,
    profilePhone,
    profileDob,
    profileGender,
    profileAddress,
    profileLink,
    email,
    onEditPersonalDetails
}: ProfileHeaderCardProps) {
    const router = useRouter();
    const [isPremium, setIsPremium] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [isCheckingAccess, setIsCheckingAccess] = useState(false);

    // Check if user has PREMIUM package
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

    // Handler for AI CV Checker button with subscription validation
    const handleAICVChecker = async () => {
        setIsCheckingAccess(true);

        try {
            // Check subscription access first
            const accessRes = await checkCVAnalyseAccess();

            if (!accessRes.hasAccess) {
                setIsCheckingAccess(false);
                setShowUpgradeModal(true);
                return;
            }

            // If has access, navigate to AI CV Checker page
            setIsCheckingAccess(false);
            router.push('/candidate/ai-cv-checker');
        } catch (error: any) {
            console.error("Error checking CV Analyse access:", error);
            setIsCheckingAccess(false);
            toast.error("Failed to check access. Please try again.");
        }
    };

    // Determine gender icon based on profileGender value
    const getGenderIcon = () => {
        const gender = profileGender?.toLowerCase();
        if (gender === 'male') {
            return <Mars className="w-4 h-4 text-gray-500 flex-shrink-0" />;
        } else if (gender === 'female') {
            return <Venus className="w-4 h-4 text-gray-500 flex-shrink-0" />;
        } else {
            // For 'other' or empty/undefined
            return <CircleSmall className="w-4 h-4 text-gray-500 flex-shrink-0" />;
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <PremiumAvatar
                            src={profileImage}
                            alt={profileName || 'User'}
                            size="xl"
                            isPremium={isPremium}
                        />
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                                {profileName || 'Your full name'}
                            </h1>
                            <p className="text-base font-semibold text-gray-900">
                                {profileTitle || 'Your title'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAICVChecker}
                            disabled={isCheckingAccess}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="AI CV Checker"
                        >
                            <Sparkles className="w-4 h-4" />
                            {isCheckingAccess ? 'Checking...' : 'AI CV Checker'}
                        </button>
                        <button
                            onClick={onEditPersonalDetails}
                            className="text-gray-600 hover:text-gray-700 p-2"
                            title="Edit Personal Details"
                        >
                            <FiEdit className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Contact Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center space-x-2.5">
                        <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className={email ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {email || "example@gmail.com"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className={profilePhone ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {profilePhone || "Your phone number"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className={profileDob ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {profileDob || "Your date of birth"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        {getGenderIcon()}
                        <span className={profileGender ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {profileGender || "Your gender"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className={profileAddress ? "text-gray-900 font-medium" : "text-gray-400"}>
                            {profileAddress || "Your current address"}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2.5">
                        <Link className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        {profileLink ? (
                            <a
                                href={profileLink.startsWith('http') ? profileLink : `https://${profileLink}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 font-medium underline hover:underline-offset-2 transition-colors"
                            >
                                {profileLink}
                            </a>
                        ) : (
                            <span className="text-gray-400">Your personal link</span>
                        )}
                    </div>
                </div>
            </div>

        {/* AI CV Checker Upgrade Modal */}
        {showUpgradeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative">
                    {/* Close button */}
                    <button
                        onClick={() => setShowUpgradeModal(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FiX className="w-6 h-6" />
                    </button>

                    {/* Modal content */}
                    <div className="p-8">
                        <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <Lock className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">
                            Upgrade Required
                        </h2>
                        <p className="text-gray-600 mb-6 text-center">
                            AI CV Checker is a premium feature. Upgrade your subscription to unlock AI-powered CV analysis and get personalized feedback to improve your CV.
                        </p>

                        {/* Features list */}
                        <div className="mb-6 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>AI-powered CV analysis</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Match score with job requirements</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Personalized improvement suggestions</span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Maybe Later
                            </button>
                            <button
                                onClick={() => {
                                    setShowUpgradeModal(false);
                                    router.push("/candidate/pricing");
                                }}
                                className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-md hover:from-indigo-700 hover:to-purple-700 transition-colors font-medium"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}
