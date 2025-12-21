import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import { uploadAvatar } from "@/lib/firebase-upload";
import { useAuthStore } from "@/store/use-auth-store";
import toast from "react-hot-toast";
import { FiUpload, FiX } from "react-icons/fi";

interface PersonalDetailDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    profileName: string;
    profileTitle: string;
    profilePhone: string;
    profileDob: string;
    profileGender: string;
    profileAddress: string;
    profileLink: string;
    profileImage: string;
    onProfileNameChange: (value: string) => void;
    onProfileTitleChange: (value: string) => void;
    onProfilePhoneChange: (value: string) => void;
    onProfileDobChange: (value: string) => void;
    onProfileGenderChange: (value: string) => void;
    onProfileAddressChange: (value: string) => void;
    onProfileLinkChange: (value: string) => void;
    onProfileImageChange: (value: string) => void;
    onSave: () => void;
    onGetRecommendRole?: () => void;
}

export default function PersonalDetailDialog({
    open,
    onOpenChange,
    profileName,
    profileTitle,
    profilePhone,
    profileDob,
    profileGender,
    profileAddress,
    profileLink,
    profileImage,
    onProfileNameChange,
    onProfileTitleChange,
    onProfilePhoneChange,
    onProfileDobChange,
    onProfileGenderChange,
    onProfileAddressChange,
    onProfileLinkChange,
    onProfileImageChange,
    onSave,
    onGetRecommendRole
}: PersonalDetailDialogProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewImage, setPreviewImage] = useState<string>(profileImage);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { candidateId } = useAuthStore();

    // Update preview when profileImage prop changes
    useEffect(() => {
        setPreviewImage(profileImage);
    }, [profileImage]);

    // Handle file selection
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setIsUploading(true);

            // Upload to Firebase Storage using candidateId instead of email
            if (!candidateId) {
                toast.error('Unable to get candidate ID. Please try again later.');
                return;
            }
            
            // Upload returns both storagePath and downloadUrl
            // We use downloadUrl for immediate display, but could store storagePath for future
            const result = await uploadAvatar(candidateId.toString(), file);

            // Update preview and form state with the download URL
            setPreviewImage(result.downloadUrl);
            onProfileImageChange(result.downloadUrl);

            toast.success('Avatar uploaded successfully!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error('Failed to upload avatar');
        } finally {
            setIsUploading(false);
        }
    };

    // Handle remove avatar
    const handleRemoveAvatar = () => {
        setPreviewImage('');
        onProfileImageChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl bg-white">
                <DialogHeader>
                    <DialogTitle>Personal Details</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Avatar Upload Section */}
                    <div className="flex items-center gap-6 pb-4 border-b border-gray-200">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                                {previewImage ? (
                                    <img
                                        src={previewImage}
                                        alt="Profile preview"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-3xl font-semibold text-gray-400">
                                        {profileName ? profileName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'LA'}
                                    </span>
                                )}
                            </div>
                            {previewImage && (
                                <button
                                    type="button"
                                    onClick={handleRemoveAvatar}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                    title="Remove avatar"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="avatar-upload"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer transition-colors ${isUploading
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <FiUpload className="w-4 h-4" />
                                {isUploading ? 'Uploading...' : 'Edit'}
                            </label>
                            <button
                                type="button"
                                onClick={handleRemoveAvatar}
                                disabled={!previewImage || isUploading}
                                className="ml-3 px-4 py-2 text-red-600 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                            >
                                Delete
                            </button>
                            <p className="text-xs text-gray-500 mt-2">
                                Max file size: 5MB. Supported formats: JPG, PNG, GIF
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={profileName}
                                onChange={(e) => onProfileNameChange(e.target.value)}
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div className="col-span-2">
                            <div className="flex items-center justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">
                                    Professional Title
                                </label>
                                {onGetRecommendRole && (
                                    <button
                                        type="button"
                                        onClick={onGetRecommendRole}
                                        className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded transition-all duration-200"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="currentColor"
                                            className="w-3 h-3"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                        Get Recommend Role
                                    </button>
                                )}
                            </div>
                            <Input
                                value={profileTitle}
                                onChange={(e) => onProfileTitleChange(e.target.value)}
                                placeholder="e.g., Software Engineer, Data Analyst"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <Input
                                value={profilePhone}
                                onChange={(e) => onProfilePhoneChange(e.target.value)}
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="date"
                                value={profileDob}
                                onChange={(e) => onProfileDobChange(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gender
                            </label>
                            <select
                                value={profileGender}
                                onChange={(e) => onProfileGenderChange(e.target.value)}
                                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                                <option value="">Select gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Current Province/City
                            </label>
                            <Input
                                value={profileAddress}
                                onChange={(e) => onProfileAddressChange(e.target.value)}
                                placeholder="e.g., TP Hồ Chí Minh"
                            />
                        </div>

                        {/* <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Address (Street, district,...)
                            </label>
                            <Input
                                value={profileAddress}
                                onChange={(e) => onProfileAddressChange(e.target.value)}
                                placeholder="Enter your detailed address"
                            />
                        </div> */}

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Personal Link (LinkedIn, portfolio,...)
                            </label>
                            <Input
                                value={profileLink}
                                onChange={(e) => onProfileLinkChange(e.target.value)}
                                placeholder="https://linkedin.com/in/yourprofile"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        className="bg-gradient-to-r from-[#3a4660] to-gray-400 text-white rounded-lg hover:from-[#3a4660] hover:to-[#3a4660]"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
