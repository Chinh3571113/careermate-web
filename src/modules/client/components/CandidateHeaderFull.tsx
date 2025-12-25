"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X, User, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/store/use-auth-store";
import { decodeJWT } from "@/lib/auth-admin";
import toast from "react-hot-toast";
import CandidateMenuList from "@/components/layout/CandidateMenuList";
import { NotificationBell } from "@/components/notifications";

export function CandidateHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const { isAuthenticated, accessToken, logout } = useAuthStore();

    // Handle hydration
    useEffect(() => {
        setIsHydrated(true);
    }, []);

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setIsUserMenuOpen(false);
            }
        };

        if (isUserMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isUserMenuOpen]);

    // Get user info from token
    const getUserInfo = () => {
        if (!accessToken) return null;
        try {
            const decoded = decodeJWT(accessToken);
            return {
                email: decoded?.sub || decoded?.email || 'User',
                name: decoded?.name || decoded?.sub || 'User'
            };
        } catch (error) {
            return null;
        }
    };

    const userInfo = getUserInfo();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success("Logged out successfully!");
            setIsUserMenuOpen(false);
        } catch (error) {
            toast.error("Failed to logout");
            console.error("Logout error:", error);
        }
    };

    // Show loading state during hydration
    // if (!isHydrated) {
    //     return (
    //         <header className="bg-gray-800 text-white shadow-lg">
    //             <div className="max-w-7xl mx-auto">
    //                 <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
    //                     {/* Logo */}
    //                     <div className="flex items-center">
    //                         <Link href="/" className="flex items-center space-x-2">
    //                             <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
    //                                 <span className="text-white font-bold text-sm">H</span>
    //                             </div>
    //                             <span className="text-xl font-bold text-white">HireMate</span>
    //                         </Link>
    //                     </div>

    //                     {/* Desktop Navigation */}
    //                     <nav className="hidden lg:flex items-center space-x-8">
    //                         <div className="relative group">
    //                             <Link href="/jobs" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
    //                                 <span>All Jobs</span>
    //                                 <ChevronDown className="w-4 h-4" />
    //                             </Link>
    //                         </div>

    //                         <div className="relative group">
    //                             <Link href="/companies" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
    //                                 <span>Companies</span>
    //                                 <ChevronDown className="w-4 h-4" />
    //                             </Link>
    //                         </div>

    //                         <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
    //                             Blog
    //                         </Link>

    //                         <Link href="/cv-templates" className="text-gray-300 hover:text-white transition-colors">
    //                             CV Templates
    //                         </Link>

    //                         <Link href="/ai-jobs" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
    //                             <span>AI Jobs</span>
    //                             <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">HOT</span>
    //                         </Link>
    //                     </nav>

    //                     {/* Right Side - Loading state */}
    //                     <div className="flex items-center space-x-4">
    //                         <Link href="/recruiter" className="hidden sm:block text-gray-300 hover:text-white transition-colors">
    //                             For Employers
    //                         </Link>

    //                         {/* Placeholder for auth state during hydration */}
    //                         <div className="flex items-center space-x-4">
    //                             <div className="w-16 h-8 bg-gray-700 rounded animate-pulse"></div>
    //                             <div className="w-20 h-8 bg-gray-700 rounded animate-pulse"></div>
    //                         </div>

    //                         {/* Mobile Menu Button */}
    //                         <button
    //                             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    //                             className="lg:hidden p-2 text-gray-300 hover:text-white"
    //                         >
    //                             {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
    //                         </button>
    //                     </div>
    //                 </div>
    //             </div>
    //         </header>
    //     );
    // }

    return (
        <header className="bg-[#1b1b20f5] text-[#fff] shadow-lg fixed top-0 left-0 right-0 z-50">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link href="/" className="flex items-center space-x-2">
                            <Image
                                src="/images/general/newlogo.png"
                                alt="Logo"
                                width={56}
                                height={56}
                                className="h-14 w-auto"
                            />
                            <span className="text-xl font-bold text-[#ffffff]">CareerMate</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center space-x-8">
                        <div className="relative group">
                            <Link href="/candidate/jobs" className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors">
                                <span>All Jobs</span>
                                <ChevronDown className="w-4 h-4" />
                            </Link>
                        </div>

                        <Link href="/companies" className="text-gray-300 hover:text-white transition-colors">
                            Companies
                        </Link>

                        <Link href="/blog" className="text-gray-300 hover:text-white transition-colors">
                            Blog
                        </Link>

                        <Link href="/cv-templates-introduction" className="text-gray-300 hover:text-white transition-colors">
                            CV Templates
                        </Link>

                        <Link href="/candidate/ai-jobs" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
                            <span>AI Jobs</span>
                            <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">HOT</span>
                        </Link>
                    </nav>

                    {/* Right Side */}
                    <div className="flex items-center space-x-4">
                        <Link href="/recruiter" className="hidden sm:block text-gray-300 hover:text-white transition-colors">
                            For Employers a
                        </Link>

                        {/* Notification Bell */}
                        {isAuthenticated && userInfo && <NotificationBell />}

                        {/* Authentication State */}
                        {isAuthenticated && userInfo ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                    className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="hidden sm:block text-sm font-medium">
                                        {userInfo.name}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                </button>

                                {/* User Dropdown */}
                                {isUserMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border py-2 z-50">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-medium text-gray-900">{userInfo.name}</p>
                                            <p className="text-xs text-gray-500">{userInfo.email}</p>
                                        </div>
                                        
                                        {/* Candidate Menu Items */}
                                        <div className="py-1">
                                            <CandidateMenuList 
                                                onItemClick={() => setIsUserMenuOpen(false)}
                                                prefixCandidate={true}
                                                compact={true}
                                            />
                                        </div>
                                        
                                        <div className="border-t border-gray-200 mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href="/sign-in" className="text-gray-300 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                                <Link href="/sign-up" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                    Sign Up
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="lg:hidden p-2 text-gray-300 hover:text-white"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                
            </div>
        </header>
    );
}

export default CandidateHeader;
