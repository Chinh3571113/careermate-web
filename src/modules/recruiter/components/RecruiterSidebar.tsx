"use client";

import Link from "next/link";
import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutGrid,
    BriefcaseBusiness,
    Users2,
    Sparkles,
    IdCard,
    LifeBuoy,
    Calendar,
    ChevronDown,
    ChevronRight,
    MessageSquareText,
} from "lucide-react";
import type { NavItem, SubMenuItem } from "../types";

const NAV_ITEMS: NavItem[] = [
    {
        label: "Dashboard",
        href: "/recruiter/recruiter-feature/dashboard",
        icon: LayoutGrid,
    },
    {
        label: "Candidates",
        href: "/recruiter/candidates/applications",
        icon: Users2,
        subItems: [
            { label: "Job applications", href: "/recruiter/recruiter-feature/candidates/applications" },
            // { label: "Saved candidates", href: "/recruiter/recruiter-feature/candidates/saved" },
            // { label: "Tag management", href: "/recruiter/recruiter-feature/candidates/tags" },
        ],
    },
    {
        label: "Schedule",
        href: "/recruiter/calendar",
        icon: Calendar,
        subItems: [
            { label: "Calendar", href: "/recruiter/calendar" },
            { label: "Calendar Settings", href: "/recruiter/calendar/settings" },
            { label: "Interviews", href: "/recruiter/interviews" },
            { label: "Employments", href: "/recruiter/employments" },
        ],
    },
    {
        label: "Company Reviews",
        href: "/recruiter/recruiter-feature/reviews",
        icon: MessageSquareText,
    },
    // {
    //     label: "Services",
    //     href: "/recruiter/services",
    //     icon: Sparkles,
    //     subItems: [
    //         { label: "Premium features", href: "/recruiter/recruiter-feature/services/premium" },
    //         { label: "Job boosting", href: "/recruiter/recruiter-feature/services/boost" },
    //         { label: "Candidate search", href: "/recruiter/recruiter-feature/services/search" },
    //     ],
    // },
    {
        label: "Uploaded Jobs",
        href: "/recruiter/jobs",
        icon: BriefcaseBusiness,
        subItems: [
            { label: "Create job post", href: "/recruiter/recruiter-feature/jobs/create" },
            { label: "Active jobs", href: "/recruiter/recruiter-feature/jobs/active" },
            // { label: "Draft jobs", href: "/recruiter/recruiter-feature/jobs/drafts" },
            { label: "Job templates", href: "/recruiter/recruiter-feature/jobs/templates" },
        ],
    },
     {
        label: "Account",
        href: "/recruiter/recruiter-feature/profile/account",
        icon: IdCard,
        subItems: [
            { label: "Recruiter account", href: "/recruiter/recruiter-feature/profile/account" },
            { label: "Organization profile", href: "/recruiter/recruiter-feature/profile/organization" },
            { label: "Update history", href: "/recruiter/recruiter-feature/profile/update-history" },
            { label: "Billing & plans", href: "/recruiter/recruiter-feature/profile/billing" },
            { label: "Payment history", href: "/recruiter/transaction-history" },
        ],
    },
    // {
    //     label: "Support",
    //     href: "/recruiter/support",
    //     icon: LifeBuoy,
    //     subItems: [
    //         { label: "Help center", href: "/recruiter/recruiter-feature/support/help" },
    //         { label: "Contact support", href: "/recruiter/recruiter-feature/support/contact" },
    //         { label: "Feature requests", href: "/recruiter/recruiter-feature/support/feedback" },
    //     ],
    // },
];

export function RecruiterSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const [showText, setShowText] = useState(false);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
    const [isPinned, setIsPinned] = useState(false);
    const pathname = usePathname();

    // Load trạng thái ban đầu - RESET về mặc định
    React.useEffect(() => {
        // Clear localStorage để đảm bảo fresh start
        localStorage.removeItem("sidebar-pinned");
        localStorage.setItem("sidebar-open", "false");
        
        // Set trạng thái mặc định
        setIsOpen(false);
        setShowText(false);
        setIsPinned(false);

        console.log('Reset sidebar to default state'); // Debug log

        const savedExpanded = localStorage.getItem("sidebar-expanded-items");
        if (savedExpanded) {
            setExpandedItems(JSON.parse(savedExpanded));
        }
    }, []);

    // Hover mở sidebar
    const handleMouseEnter = () => {
        console.log('🔵 Mouse entered sidebar, isPinned:', isPinned); // Debug log
        
        // Clear timeout nếu có
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
        
        // Mở sidebar ngay lập tức
        setIsOpen(true);
        setTimeout(() => setShowText(true), 150);
        
        // Notify header about hover state
        window.dispatchEvent(new CustomEvent('sidebar-hover', {
            detail: { isOpen: true, isHover: true }
        }));
        
        console.log('✅ Sidebar opened by hover');
    };

    // Hover rời sidebar → đóng
    const handleMouseLeave = () => {
        console.log('🔴 Mouse left sidebar, isPinned:', isPinned); // Debug log
        
        // Nếu được pin bởi button, không đóng
        if (isPinned) {
            console.log('❌ Sidebar is pinned, not closing');
            return;
        }

        // Set timeout để đóng sidebar
        const timeout = setTimeout(() => {
            console.log('🔒 Closing sidebar due to mouse leave');
            setIsOpen(false);
            setShowText(false);
            
            // Notify header about hover state
            window.dispatchEvent(new CustomEvent('sidebar-hover', {
                detail: { isOpen: false, isHover: false }
            }));
            
            // Chỉ update localStorage nếu không được pin
            if (!isPinned) {
                localStorage.setItem("sidebar-open", "false");
                window.dispatchEvent(new CustomEvent("sidebar-toggle"));
            }
        }, 200); // Giảm delay xuống 200ms

        setHoverTimeout(timeout);
    };

    React.useEffect(() => {
        return () => {
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
            }
        };
    }, [hoverTimeout]);

    // Đồng bộ khi toggle từ hamburger button
    React.useEffect(() => {
        const handleSidebarToggle = () => {
            const savedState = localStorage.getItem("sidebar-open");
            const savedPinned = localStorage.getItem("sidebar-pinned");

            const newIsOpen = savedState === "true";
            const newIsPinned = savedPinned === "true";

            console.log('🔄 Sidebar toggle event:', { newIsOpen, newIsPinned }); // Debug log

            setIsOpen(newIsOpen);
            setIsPinned(newIsPinned);

            if (newIsOpen) {
                setTimeout(() => setShowText(true), 150);
            } else {
                setShowText(false);
            }
        };

        window.addEventListener("sidebar-toggle", handleSidebarToggle);
        return () => {
            window.removeEventListener("sidebar-toggle", handleSidebarToggle);
        };
    }, []);

    // Debug helpers - có thể dùng trong console
    React.useEffect(() => {
        (window as any).debugSidebar = () => {
            console.log('📊 Sidebar Debug Info:', {
                isOpen,
                showText,
                isPinned,
                hoverTimeout: !!hoverTimeout,
                localStorage: {
                    open: localStorage.getItem("sidebar-open"),
                    pinned: localStorage.getItem("sidebar-pinned")
                }
            });
        };
        
        (window as any).resetSidebar = () => {
            console.log('🔄 Resetting sidebar completely');
            setIsPinned(false);
            setIsOpen(false);
            setShowText(false);
            localStorage.setItem("sidebar-pinned", "false");
            localStorage.setItem("sidebar-open", "false");
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                setHoverTimeout(null);
            }
        };
    }, [isOpen, showText, isPinned, hoverTimeout]);

    const toggleExpanded = (label: string) => {
        setExpandedItems((prev) => {
            const newItems = prev.includes(label)
                ? prev.filter((item) => item !== label)
                : [...prev, label];
            localStorage.setItem("sidebar-expanded-items", JSON.stringify(newItems));
            return newItems;
        });
    };

    const isItemActive = (item: NavItem) =>
        pathname === item.href ||
        (item.subItems && item.subItems.some((sub) => pathname === sub.href));

    const isSubItemActive = (sub: SubMenuItem) => pathname === sub.href;

    return (
        <aside
            className={cn(
                "fixed left-0 z-40 h-screen border-r border-border bg-card shadow-sm transition-all duration-300 ease-in-out pt-10",
                isOpen ? "w-64" : "w-16"
            )}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="flex flex-col h-full max-h-screen">
                {/* Navigation */}
                <nav
                    className="flex-1 p-2 space-y-1 overflow-y-auto hide-scrollbar"
                    style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                    }}
                >
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isActive = isItemActive(item);
                        const isExpanded = expandedItems.includes(item.label);
                        const hasSubItems = item.subItems && item.subItems.length > 0;

                        return (
                            <div key={item.href} className="space-y-1">
                                {hasSubItems && showText ? (
                                    <button
                                        onClick={() => toggleExpanded(item.label)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left",
                                            isActive
                                                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/30"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        <span className="truncate flex-1">{item.label}</span>
                                        {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                        ) : (
                                            <ChevronRight className="h-4 w-4" />
                                        )}
                                    </button>
                                ) : (
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700 dark:bg-blue-900/30"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                    >
                                        <Icon className="h-5 w-5 shrink-0" />
                                        {showText && <span className="truncate">{item.label}</span>}
                                    </Link>
                                )}

                                {showText && hasSubItems && isExpanded && (
                                    <div className="ml-8 space-y-1">
                                        {item.subItems?.map((subItem) => (
                                            <Link
                                                key={subItem.href}
                                                href={subItem.href}
                                                className={cn(
                                                    "block px-3 py-2 rounded-md text-sm transition-colors",
                                                    isSubItemActive(subItem)
                                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                )}
                                            >
                                                {subItem.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}

export default RecruiterSidebar;
