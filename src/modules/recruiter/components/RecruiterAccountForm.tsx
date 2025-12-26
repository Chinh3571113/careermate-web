"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { Toggle } from "./RecruiterToggle";
import ChangePasswordDialog from "./ChangePasswordDialog";
import { ProfileService } from "../services/profileService";
import type { Recruiter } from "@/types/recruiter";
import { useAuthStore } from "@/store/use-auth-store";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { Loader2, Upload, User } from "lucide-react";

export function RecruiterAccountForm() {
    const [openPwd, setOpenPwd] = useState(false);
    const [recruiterData, setRecruiterData] = useState<Recruiter | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [savingUsername, setSavingUsername] = useState(false);
    const { user, accessToken, isAuthenticated, isLoading: authLoading, setRecruiterAvatarUrl } = useAuthStore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
    });

    useEffect(() => {
        const fetchRecruiterData = async () => {
            // Wait for auth store to be fully hydrated (not loading anymore)
            if (authLoading) {
                console.log('⏳ [RecruiterAccountForm] Auth store still loading...');
                return;
            }
            
            // Check if authenticated after auth is loaded
            if (!accessToken || !isAuthenticated) {
                console.log('⏳ [RecruiterAccountForm] Not authenticated yet', { accessToken: !!accessToken, isAuthenticated });
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                console.log('🔄 [RecruiterAccountForm] Fetching recruiter data...');
                // Use ProfileService which calls /api/recruiter/profile (JWT-based, no email needed)
                const data = await ProfileService.getRecruiterAccount();
                if (data) {
                    console.log('✅ [RecruiterAccountForm] Data loaded:', data);
                    setRecruiterData(data);
                    setFormData({
                        username: data.username || "",
                        email: data.email || "",
                    });
                    // Also update the avatar in auth store
                    if (data.avatarUrl) {
                        setRecruiterAvatarUrl(data.avatarUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching recruiter data:", error);
                toast.error("Failed to load recruiter data");
            } finally {
                setLoading(false);
            }
        };

        fetchRecruiterData();
    }, [accessToken, isAuthenticated, authLoading, setRecruiterAvatarUrl]);

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSavePersonalInfo = async () => {
        if (!formData.username.trim()) {
            toast.error("Username cannot be empty");
            return;
        }
        try {
            setSavingUsername(true);
            const response = await api.put<{ code: number; result: any }>(
                `/api/users/username?username=${encodeURIComponent(formData.username.trim())}`
            );
            if (response.data.code === 200) {
                toast.success("Username updated successfully");
                if (recruiterData) {
                    setRecruiterData({ ...recruiterData, username: formData.username.trim() });
                }
            }
        } catch (error: any) {
            console.error("Error updating username:", error);
            toast.error(error.response?.data?.message || "Failed to update username");
        } finally {
            setSavingUsername(false);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("File size must be less than 2MB");
            return;
        }

        try {
            setUploadingAvatar(true);

            const formDataUpload = new FormData();
            formDataUpload.append("image", file);

            const uploadResponse = await api.post<{
                code: number;
                result: { imageUrl: string };
            }>("/api/upload/avatar", formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (uploadResponse.data.code === 1000 && uploadResponse.data.result.imageUrl) {
                const imageUrl = uploadResponse.data.result.imageUrl;

                const updateResponse = await api.put<{ code: number; result: any }>(
                    `/api/users/avatar?avatarUrl=${encodeURIComponent(imageUrl)}`
                );

                if (updateResponse.data.code === 200) {
                    toast.success("Avatar updated successfully");
                    if (recruiterData) {
                        setRecruiterData({ ...recruiterData, avatarUrl: imageUrl });
                    }
                    // Update avatar in auth store (updates header immediately)
                    setRecruiterAvatarUrl(imageUrl);
                }
            } else {
                toast.error("Failed to upload avatar");
            }
        } catch (error: any) {
            console.error("Error uploading avatar:", error);
            toast.error(error.response?.data?.message || "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    if (authLoading || loading) {
        return (
            <section className="rounded-lg border bg-white p-6 shadow-sm shadow-sky-100">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                    <p className="ml-3 text-sm text-gray-500">Loading...</p>
                </div>
            </section>
        );
    }
    return (
        <section className="rounded-lg border bg-white p-6 shadow-sm shadow-sky-100">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
                <div>
                    <div className="mb-6 rounded-md bg-sky-50 p-4 text-sm text-sky-900">
                        <p>
                            Complete your company details and verification. Your information helps us review and activate your recruiter account.
                        </p>
                    </div>

                    <form className="space-y-6">
                        {/* Personal Information */}
                        <div className="mb-8">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                                Personal Information
                            </h4>
                            <fieldset className="space-y-2 mb-4">
                                <label className="block text-sm font-medium text-sky-900">
                                    Username <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-sky-500"
                                    placeholder="Enter your username"
                                />
                            </fieldset>

                            <fieldset className="space-y-3 mb-4">
                                <label className="block text-sm font-medium text-sky-900">
                                    Work Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    readOnly
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    className="w-full cursor-not-allowed rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                                />
                            </fieldset>

                            <fieldset className="space-y-3 mb-4">
                                <label className="block text-sm font-medium text-sky-900">Password</label>
                                <input
                                    readOnly
                                    type="password"
                                    className="w-full cursor-not-allowed rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none"
                                    defaultValue="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setOpenPwd(true)}
                                    className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium text-sky-800 hover:bg-sky-50"
                                >
                                    Change password
                                </button>
                            </fieldset>

                            {/* <fieldset className="space-y-2 mb-4">
                                <label className="block text-sm font-medium text-sky-900">
                                    Contact Person <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-sky-500"
                                    placeholder="Enter contact person name"
                                />
                            </fieldset>

                            <fieldset className="space-y-2 mb-4">
                                <label className="block text-sm font-medium text-sky-900">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-sky-500"
                                    placeholder="0929098765"
                                />
                            </fieldset> */}
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={handleSavePersonalInfo}
                                disabled={savingUsername}
                                className="inline-flex h-9 items-center rounded-md bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                                {savingUsername ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save changes"
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                <aside className="space-y-6">
                    <div className="rounded-md bg-sky-50 p-4 text-center">
                        <p className="mb-4 text-sm font-medium text-sky-900">Profile avatar</p>
                        <div 
                            className="mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full border-2 border-sky-200 relative cursor-pointer group"
                            onClick={handleAvatarClick}
                        >
                            {recruiterData?.avatarUrl ? (
                                <Image
                                    src={recruiterData.avatarUrl}
                                    alt="Avatar"
                                    width={112}
                                    height={112}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center bg-gray-100">
                                    <User className="h-12 w-12 text-gray-400" />
                                </div>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {uploadingAvatar ? (
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                    <Upload className="h-6 w-6 text-white" />
                                )}
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <button
                            type="button"
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            className="inline-flex h-9 items-center rounded-md border border-sky-200 px-3 text-sm font-medium text-sky-800 hover:bg-sky-600 hover:text-white disabled:opacity-50"
                        >
                            {uploadingAvatar ? "Uploading..." : "Change avatar"}
                        </button>
                        <p className="mt-2 text-xs text-muted-foreground">Recommended size 1000×1000px, ≤ 2MB</p>
                    </div>
                </aside>
            </div>

            <ChangePasswordDialog open={openPwd} onOpenChange={setOpenPwd} />
        </section>
    );
}

export default RecruiterAccountForm;


