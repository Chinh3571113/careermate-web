"use client";

import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export function CandidateFooter() {
    return (
        <footer className="bg-[#1b1b20f5] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <div className="w-8 h-auto items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                    <Image
                                        src="/images/general/newlogo.png"
                                        alt="Logo"
                                        width={32}
                                        height={32}
                                        className="h-auto w-auto"
                                    />
                                </span>
                            </div>
                            <span className="text-xl font-bold">CareerMate</span>
                        </div>
                        <p className="text-gray-400 mb-4 max-w-md">
                            The leading AI-powered job portal connecting talented candidates with top employers.
                            Find your dream job or discover exceptional talent.
                        </p>
                        <div className="flex space-x-4">
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg">
                                <Facebook className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg">
                                <Twitter className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg">
                                <Linkedin className="w-5 h-5" />
                            </Link>
                            <Link href="#" className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg">
                                <Instagram className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>

                    {/* For Candidates */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">For Candidates</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/jobs-detail" className="text-gray-400 hover:text-white transition-colors">
                                    Find Jobs
                                </Link>
                            </li>
                            <li>
                                <Link href="/companies" className="text-gray-400 hover:text-white transition-colors">
                                    Browse Companies
                                </Link>
                            </li>
                            <li>
                                <Link href="/candidate/cv-management" className="text-gray-400 hover:text-white transition-colors">
                                    CV Templates
                                </Link>
                            </li>
                            <li>
                                <Link href="/candidate/road-map" className="text-gray-400 hover:text-white transition-colors">
                                    Career Advice
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* For Employers */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">For Employers</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/recruiter" className="text-gray-400 hover:text-white transition-colors">
                                    Post Jobs
                                </Link>
                            </li>
                            <li>
                                <Link href="/recruiter/candidates" className="text-gray-400 hover:text-white transition-colors">
                                    Find Candidates
                                </Link>
                            </li>
                            <li>
                                <Link href="/recruiter/pricing" className="text-gray-400 hover:text-white transition-colors">
                                    Pricing
                                </Link>
                            </li>
                            <li>
                                <Link href="/recruiter/solutions" className="text-gray-400 hover:text-white transition-colors">
                                    Solutions
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="border-t border-gray-800 mt-8 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="text-gray-400 text-sm">
                            © {new Date().getFullYear()} CareerMate. All rights reserved.
                        </div>
                        <div className="flex space-x-6 mt-4 md:mt-0">
                            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="/contact" className="text-gray-400 hover:text-white text-sm transition-colors">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default CandidateFooter;
