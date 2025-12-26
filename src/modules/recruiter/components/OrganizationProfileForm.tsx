"use client";

import { useRef, useState, useEffect } from "react";
import { useRecruiterProfile } from "../hooks/useRecruiterProfile";
import { updateOrganization } from "@/lib/recruiter-api";
import api from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";
import { Building2, Loader2, ChevronDown, ChevronUp, Upload } from "lucide-react";

export function OrganizationProfileForm() {
  const { profile, loading: profileLoading, refetch } = useRecruiterProfile();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    companyName: "",
    website: "",
    logoUrl: "",
    contactPerson: "",
    phoneNumber: "",
    companyAddress: "",
    about: "",
    companyEmail: "",
  });

  // Toggle field expansion
  const toggleField = (fieldName: string) => {
    setExpandedFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  // Truncate text helper
  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        companyName: profile.companyName || "",
        website: profile.website || "",
        logoUrl: profile.logoUrl || "",
        contactPerson: profile.contactPerson || "",
        phoneNumber: profile.phoneNumber || "",
        companyAddress: profile.companyAddress || "",
        about: profile.about || "",
        companyEmail: profile.companyEmail || "",
      });
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit for logos)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo must be less than 5MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const response = await api.post<{ code: number; result: { imageUrl: string } }>('/api/upload/logo', formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.code === 1000 && response.data.result.imageUrl) {
        // Update form data with new logo URL
        setFormData(prev => ({
          ...prev,
          logoUrl: response.data.result.imageUrl,
        }));
        
        toast.success('Logo uploaded! Remember to save changes.');
      } else {
        toast.error('Failed to upload logo');
      }
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      // Reset file input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate required fields
      if (!formData.companyName.trim()) {
        toast.error("Company name is required");
        return;
      }
      if (!formData.contactPerson.trim()) {
        toast.error("Contact person is required");
        return;
      }
      if (!formData.phoneNumber.trim()) {
        toast.error("Phone number is required");
        return;
      }
      if (!formData.companyAddress.trim()) {
        toast.error("Company address is required");
        return;
      }

      await updateOrganization({
        companyName: formData.companyName,
        website: formData.website,
        logoUrl: formData.logoUrl,
        contactPerson: formData.contactPerson,
        phoneNumber: formData.phoneNumber,
        companyAddress: formData.companyAddress,
        companyEmail: formData.companyEmail,
      });
      
      toast.success("Update request submitted! Waiting for admin approval.");
      refetch(); // Refresh profile data to show pending update
    } catch (error: any) {
      console.error("Error updating organization info:", error);
      toast.error(error.message || "Failed to submit update request");
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <section className="rounded-lg border bg-white p-6 shadow-sm shadow-sky-100">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-sky-600" />
            <p className="mt-4 text-sm text-gray-500">Loading organization profile...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border bg-white p-6 shadow-sm shadow-sky-100">
      {/* Verification Status Banner */}
      {profile?.verificationStatus === "PENDING" && (
        <div className="mb-6 rounded-md bg-amber-50 border border-amber-200 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <Building2 className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900">Pending Verification</h4>
              <p className="mt-1 text-sm text-amber-800">
                Your organization profile is currently under review. You'll be notified once verification is complete.
              </p>
            </div>
          </div>
        </div>
      )}

      {profile?.verificationStatus === "APPROVED" && (
        <div className="mb-6 rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <Building2 className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-green-900">Verified Organization</h4>
              <p className="mt-1 text-sm text-green-800">
                Your organization profile has been verified and approved.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Notice */}
      {profile?.rejectionReason && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <h4 className="text-sm font-semibold text-red-900 mb-2">Rejection Reason</h4>
          <p className="text-sm text-red-800">{profile.rejectionReason}</p>
        </div>
      )}

      {/* Pending Update Request */}
      {profile?.hasPendingUpdate && profile?.pendingUpdateRequest && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-base font-bold text-blue-900">Update Request Pending Review</h4>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
              profile.pendingUpdateRequest.status === 'REJECTED' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {profile.pendingUpdateRequest.status}
            </span>
          </div>
          
          <p className="text-sm text-blue-800 mb-4">
            You submitted an update request on{" "}
            <strong>{new Date(profile.pendingUpdateRequest.createdAt).toLocaleDateString('vi-VN')}</strong>.
            Your current information will remain active until an admin approves the changes.
          </p>

          {/* Rejection Reason for Update Request */}
          {profile.pendingUpdateRequest.status === 'REJECTED' && profile.pendingUpdateRequest.rejectionReason && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3">
              <h5 className="text-xs font-semibold text-red-900 mb-1 uppercase tracking-wide">Update Request Rejected</h5>
              <p className="text-sm text-red-800">{profile.pendingUpdateRequest.rejectionReason}</p>
            </div>
          )}

          {/* Admin Note for Approved Request */}
          {profile.pendingUpdateRequest.status === 'APPROVED' && profile.pendingUpdateRequest.adminNote && (
            <div className="mb-4 rounded-md bg-green-50 border border-green-200 p-3">
              <h5 className="text-xs font-semibold text-green-900 mb-1 uppercase tracking-wide">Admin Note</h5>
              <p className="text-sm text-green-800">{profile.pendingUpdateRequest.adminNote}</p>
            </div>
          )}

          {/* Show pending changes */}
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-blue-700 hover:text-blue-800 flex items-center gap-1">
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              View Pending Changes
            </summary>
            <div className="mt-3 space-y-3 rounded-md bg-white p-4 border border-blue-200">
              {profile.pendingUpdateRequest.newCompanyName !== profile.pendingUpdateRequest.currentCompanyName && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Company Name:</span>
                  <div className="ml-4 mt-1">
                    <span className="line-through text-gray-400">{profile.pendingUpdateRequest.currentCompanyName}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium">{profile.pendingUpdateRequest.newCompanyName}</span>
                  </div>
                </div>
              )}
              {profile.pendingUpdateRequest.newWebsite !== profile.pendingUpdateRequest.currentWebsite && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Website:</span>
                  <div className="ml-4 mt-1">
                    <span className="line-through text-gray-400">{profile.pendingUpdateRequest.currentWebsite || 'N/A'}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium">{profile.pendingUpdateRequest.newWebsite}</span>
                  </div>
                </div>
              )}
              {profile.pendingUpdateRequest.newLogoUrl !== profile.pendingUpdateRequest.currentLogoUrl && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Logo URL:</span>
                  <div className="ml-4 mt-1 break-all">
                    <span className="line-through text-gray-400 text-xs">{truncateText(profile.pendingUpdateRequest.currentLogoUrl || 'N/A', 40)}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium text-xs">{truncateText(profile.pendingUpdateRequest.newLogoUrl, 40)}</span>
                  </div>
                </div>
              )}
              {profile.pendingUpdateRequest.newContactPerson !== profile.pendingUpdateRequest.currentContactPerson && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Contact Person:</span>
                  <div className="ml-4 mt-1">
                    <span className="line-through text-gray-400">{profile.pendingUpdateRequest.currentContactPerson}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium">{profile.pendingUpdateRequest.newContactPerson}</span>
                  </div>
                </div>
              )}
              {profile.pendingUpdateRequest.newPhoneNumber !== profile.pendingUpdateRequest.currentPhoneNumber && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Phone Number:</span>
                  <div className="ml-4 mt-1">
                    <span className="line-through text-gray-400">{profile.pendingUpdateRequest.currentPhoneNumber}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium">{profile.pendingUpdateRequest.newPhoneNumber}</span>
                  </div>
                </div>
              )}
              {profile.pendingUpdateRequest.newCompanyAddress !== profile.pendingUpdateRequest.currentCompanyAddress && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Company Address:</span>
                  <div className="ml-4 mt-1">
                    <span className="line-through text-gray-400">{profile.pendingUpdateRequest.currentCompanyAddress}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium">{profile.pendingUpdateRequest.newCompanyAddress}</span>
                  </div>
                </div>
              )}
              {profile.pendingUpdateRequest.newCompanyEmail !== profile.pendingUpdateRequest.currentCompanyEmail && (
                <div className="text-sm">
                  <span className="font-medium text-gray-700">Company Email:</span>
                  <div className="ml-4 mt-1">
                    <span className="line-through text-gray-400">{profile.pendingUpdateRequest.currentCompanyEmail || 'N/A'}</span>
                    <span className="mx-2 text-blue-600">→</span>
                    <span className="text-blue-700 font-medium">{profile.pendingUpdateRequest.newCompanyEmail}</span>
                  </div>
                </div>
              )}
            </div>
          </details>
        </div>
      )}

      <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Company Name - Always show (required) */}
          <fieldset className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-sky-900">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              placeholder="e.g., FPT Corporation"
            />
          </fieldset>

          {/* Company Logo - With Upload */}
          <fieldset className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-sky-900">
              Company Logo
            </label>
            <div className="flex items-start gap-4">
              {/* Hidden file input */}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              
              {/* Logo Preview - Clickable for upload */}
              <div className="flex-shrink-0">
                <button
                  type="button"
                  onClick={handleLogoClick}
                  disabled={uploadingLogo}
                  className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-sky-400 hover:bg-sky-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500 group"
                >
                  {formData.logoUrl ? (
                    <>
                      <Image
                        src={formData.logoUrl}
                        alt={formData.companyName || "Company Logo"}
                        fill
                        className="object-cover"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        {uploadingLogo ? (
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        ) : (
                          <Upload className="h-6 w-6 text-white" />
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
                      {uploadingLogo ? (
                        <Loader2 className="h-6 w-6 text-sky-600 animate-spin" />
                      ) : (
                        <>
                          <Building2 className="h-8 w-8 text-sky-400 group-hover:text-sky-600" />
                          <span className="text-xs text-gray-500 group-hover:text-sky-600">Upload</span>
                        </>
                      )}
                    </div>
                  )}
                </button>
              </div>
              
              {/* URL input field and info */}
              <div className="flex-1 space-y-2">
                <input
                  type="url"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  placeholder="https://example.com/logo.png or upload an image"
                />
                
                {formData.logoUrl && formData.logoUrl.length > 60 && (
                  <p className="text-xs text-gray-500 break-all">
                    URL: {truncateText(formData.logoUrl, 80)}
                  </p>
                )}
                
                <p className="text-xs text-gray-500">
                  Click logo to upload (max 5MB) or enter URL. Square image recommended.
                </p>
              </div>
            </div>
          </fieldset>

          {/* Website - Always show (Giữ nguyên logic truncate) */}
          <fieldset className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-sky-900">
              Website
            </label>
            {formData.website && formData.website.length > 60 && !expandedFields['website'] ? (
              <div className="space-y-2">
                <input
                  type="url"
                  name="website"
                  value={truncateText(formData.website, 60)} // Hiển thị cắt ngắn trong input nếu không mở rộng
                  readOnly // Đảm bảo người dùng không thể sửa khi bị cắt ngắn
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => toggleField('website')}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  <ChevronDown className="h-3 w-3" />
                  Show full URL
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  placeholder="https://yourcompany.com"
                />
                {formData.website && formData.website.length > 60 && expandedFields['website'] && (
                  <button
                    type="button"
                    onClick={() => toggleField('website')}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </button>
                )}
              </div>
            )}
          </fieldset>
          

          {/* Contact Person - Always show (required) */}
          <fieldset className="space-y-2">
            <label className="block text-sm font-medium text-sky-900">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              placeholder="Enter contact person name"
            />
          </fieldset>

          {/* Phone Number - Always show (required) */}
          <fieldset className="space-y-2">
            <label className="block text-sm font-medium text-sky-900">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              required
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              placeholder="0929098765"
            />
          </fieldset>

          {/* Company Email - Always show (Giữ nguyên logic truncate) */}
          <fieldset className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-sky-900">
              Company Email
            </label>
            {formData.companyEmail && formData.companyEmail.length > 50 && !expandedFields['companyEmail'] ? (
              <div className="space-y-2">
                <input
                  type="email"
                  name="companyEmail"
                  value={truncateText(formData.companyEmail, 50)}
                  readOnly
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => toggleField('companyEmail')}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  <ChevronDown className="h-3 w-3" />
                  Show full email
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleInputChange}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  placeholder="contact@company.com"
                />
                {formData.companyEmail && formData.companyEmail.length > 50 && expandedFields['companyEmail'] && (
                  <button
                    type="button"
                    onClick={() => toggleField('companyEmail')}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </button>
                )}
              </div>
            )}
          </fieldset>

          {/* Company Address - Always show (required) (Giữ nguyên logic truncate) */}
          <fieldset className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-sky-900">
              Company Address <span className="text-red-500">*</span>
            </label>
            {formData.companyAddress && formData.companyAddress.length > 100 && !expandedFields['companyAddress'] ? (
              <div className="space-y-2">
                <input
                  type="text"
                  name="companyAddress"
                  value={truncateText(formData.companyAddress, 100)}
                  readOnly
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 text-gray-600"
                />
                <button
                  type="button"
                  onClick={() => toggleField('companyAddress')}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  <ChevronDown className="h-3 w-3" />
                  Show more
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  name="companyAddress"
                  value={formData.companyAddress}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                  placeholder="e.g., Ftown1"
                />
                {formData.companyAddress && formData.companyAddress.length > 100 && expandedFields['companyAddress'] && (
                  <button
                    type="button"
                    onClick={() => toggleField('companyAddress')}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    <ChevronUp className="h-3 w-3" />
                    Show less
                  </button>
                )}
              </div>
            )}
          </fieldset>

          {/* Company Introduction - Only show if has value (Giữ nguyên logic truncate cho textarea) */}
          {(formData.about || profile?.about) && (
            <fieldset className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-sky-900">
                Company Introduction
              </label>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                rows={4}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 resize-none"
                placeholder="Write a short introduction about your company"
              />
              <p className="text-xs text-gray-500">
                Tell candidates about your company culture, mission, and values
              </p>

              {/* Logic Hiển thị thêm/bớt cho Textarea (nếu cần) */}
              {formData.about && formData.about.length > 200 && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => toggleField('about')}
                    className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                  >
                    {expandedFields['about'] ? (
                      <>
                        <ChevronUp className="h-3 w-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3" />
                        Show more
                      </>
                    )}
                  </button>
                </div>
              )}
            </fieldset>
          )}

          {/* Rating - Only show if has valid rating > 0 */}
          {profile?.rating != null && profile.rating > 0 && (
            <fieldset className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-sky-900">
                Company Rating
              </label>
              <div className="flex items-center gap-3 rounded-md border bg-gray-50 px-3 py-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.floor(profile.rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      }`}
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {profile.rating.toFixed(1)} / 5.0
                </span>
              </div>
            </fieldset>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-sky-600 px-6 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default OrganizationProfileForm;