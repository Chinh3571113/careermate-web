"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { RecruiterHeader } from "./RecruiterHeader";
import { RecruiterSidebar } from "./RecruiterSidebar";
import { getWorkingHours } from "@/lib/calendar-api";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface RecruiterLayoutWrapperProps {
    children: ReactNode;
}

export function RecruiterLayoutWrapper({ children }: RecruiterLayoutWrapperProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false); // Always start with false for SSR consistency
    const [isHydrated, setIsHydrated] = useState(false);
    const [hasWorkingHours, setHasWorkingHours] = useState<boolean | null>(null);
    const [checkingWorkingHours, setCheckingWorkingHours] = useState(true);
    const pathname = usePathname();
    const router = useRouter();

    // Pages that should be accessible without working hours setup
    const allowedPagesWithoutWorkingHours = [
        '/recruiter/calendar/settings',
        '/recruiter/recruiter-feature/profile',
        '/recruiter/recruiter-feature/company-profile',
    ];

    const isAllowedPage = allowedPagesWithoutWorkingHours.some(page => pathname?.startsWith(page));

    useEffect(() => {
        // Set hydrated flag and initialize sidebar state from localStorage
        setIsHydrated(true);
        const savedState = localStorage.getItem('sidebar-open');
        if (savedState !== null) {
            setSidebarOpen(savedState === 'true');
        }

        // Listen for explicit toggle events
        const handleSidebarToggle = () => {
            const isOpen = localStorage.getItem('sidebar-open') === 'true';
            setSidebarOpen(isOpen);
        };

        window.addEventListener('sidebar-toggle', handleSidebarToggle);

        return () => {
            window.removeEventListener('sidebar-toggle', handleSidebarToggle);
        };
    }, []);

    // Check if recruiter has configured working hours
    useEffect(() => {
        const checkWorkingHours = async () => {
            try {
                setCheckingWorkingHours(true);
                const workingHours = await getWorkingHours();
                
                // Check if any working day is configured (at least one day with isWorkingDay = true)
                const hasConfiguredWorkingDays = workingHours.some(
                    (wh) => wh.isWorkingDay === true
                );
                
                setHasWorkingHours(hasConfiguredWorkingDays);
                console.log('📅 [WORKING HOURS CHECK] Has configured:', hasConfiguredWorkingDays);
            } catch (error) {
                console.error('❌ [WORKING HOURS CHECK] Error:', error);
                // If error fetching, assume not configured
                setHasWorkingHours(false);
            } finally {
                setCheckingWorkingHours(false);
            }
        };

        checkWorkingHours();
    }, [pathname]); // Re-check when pathname changes (after saving settings)

    // Show setup prompt if working hours not configured and not on allowed page
    const showSetupPrompt = !checkingWorkingHours && hasWorkingHours === false && !isAllowedPage;

    return (
        <div className="min-h-screen bg-white">
            {/* Header full width */}
            <RecruiterHeader sidebarOpen={sidebarOpen} />
            
            <div className="flex">
                {/* Sidebar */}
                <RecruiterSidebar />
                
                {/* Main content */}
                <main
                    className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'
                        }`}
                >
                    <div className="px-4 py-8">
                        <div className="mx-auto max-w-6xl">
                            {showSetupPrompt ? (
                                <div className="flex items-center justify-center min-h-[60vh]">
                                    <Card className="max-w-lg w-full">
                                        <CardHeader className="text-center">
                                            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                                            </div>
                                            <CardTitle className="text-2xl">Set Up Your Working Hours</CardTitle>
                                            <CardDescription className="text-base mt-2">
                                                Before you can start scheduling interviews and managing candidates, 
                                                you need to configure your working hours.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Calendar className="w-5 h-5 text-primary mt-0.5" />
                                                    <div>
                                                        <p className="font-medium">Select Your Working Days</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Choose which days of the week you&apos;re available for interviews
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                                                    <div>
                                                        <p className="font-medium">Set Your Hours</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Define start time, end time, and lunch breaks
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                className="w-full" 
                                                size="lg"
                                                onClick={() => router.push('/recruiter/calendar/settings')}
                                            >
                                                <Clock className="w-4 h-4 mr-2" />
                                                Configure Working Hours
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : (
                                children
                            )}
                        </div>
                    </div>
                </main>
            </div>
            
            {/* Footer full width */}
            {/* <RecruiterFooter sidebarOpen={sidebarOpen} /> */}
        </div>
    );
}

