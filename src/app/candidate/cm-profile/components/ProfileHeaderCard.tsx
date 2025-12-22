"use client";

import { FiEdit } from "react-icons/fi";
import { Mail, Phone, Calendar, MapPin, Link, Sparkles, Mars, Venus, CircleSmall } from "lucide-react";
import { PremiumAvatar } from "@/components/ui/premium-avatar";
import { useEffect, useState } from "react";
import { getMyInvoice } from "@/lib/invoice-api";
import { useRouter } from "next/navigation";

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
                        onClick={() => router.push('/candidate/ai-cv-checker')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-lg text-sm font-medium transition-all duration-200"
                        title="AI CV Checker"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI CV Checker
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
    );
}
