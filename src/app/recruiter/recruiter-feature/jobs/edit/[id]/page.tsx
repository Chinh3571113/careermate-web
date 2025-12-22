"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Save,
  X,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Users,
  Package,
  Plus,
  Trash2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  getRecruiterJobPostings,
  RecruiterJobPosting,
  getSkills,
  Skill,
  updateJobPosting,
  CreateJobPostRequest,
} from "@/lib/recruiter-api";
import toast from "react-hot-toast";

export default function EditJobPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = parseInt(params.id as string);

  const [job, setJob] = useState<RecruiterJobPosting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    address: "",
    expirationDate: "",
    yearsOfExperience: 0,
    workModel: "",
    salaryRange: "",
    reason: "",
    jobPackage: "",
    skills: [] as Array<{ id: number; mustToHave: boolean; name?: string }>,
  });

  // Skill selection state
  const [selectedSkillId, setSelectedSkillId] = useState("");
  const [newSkillMustHave, setNewSkillMustHave] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch job and skills on mount
  useEffect(() => {
    fetchJob();
    fetchSkills();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setIsLoading(true);
      // Fetch all recruiter jobs and find the one with matching ID
      const response = await getRecruiterJobPostings({ page: 0, size: 100 });
      if (response.code === 0 || response.code === 200) {
        const foundJob = response.result.content.find((j) => j.id === jobId);
        if (foundJob) {
          setJob(foundJob);
          // Initialize form with job data
          setFormData({
            title: foundJob.title,
            description: foundJob.description,
            address: foundJob.address,
            expirationDate: foundJob.expirationDate,
            yearsOfExperience: foundJob.yearsOfExperience,
            workModel: foundJob.workModel,
            salaryRange: foundJob.salaryRange,
            reason: foundJob.reason,
            jobPackage: foundJob.jobPackage,
            skills: foundJob.skills?.map((s) => ({
              id: s.id,
              mustToHave: s.mustToHave,
              name: s.name,
            })) || [],
          });
        } else {
          toast.error("Job posting not found");
          router.push("/recruiter/recruiter-feature/jobs/create");
        }
      }
    } catch (error: any) {
      console.error("Error fetching job:", error);
      toast.error(error.message || "Failed to load job");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      setIsLoadingSkills(true);
      const response = await getSkills();
      if (response.code === 200 && response.result) {
        setAvailableSkills(response.result);
      }
    } catch (error: any) {
      console.error("Failed to fetch skills:", error);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  // Check if job can be fully edited (PENDING or REJECTED status)
  const canFullyEdit = job?.status === "PENDING" || job?.status === "REJECTED";
  const isActiveOrExpired = job?.status === "ACTIVE" || job?.status === "EXPIRED";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleAddSkill = () => {
    if (!selectedSkillId) return;

    const skillId = parseInt(selectedSkillId);
    const skill = availableSkills.find((s) => s.id === skillId);
    if (!skill) return;

    // Check if skill already added
    if (formData.skills.some((s) => s.id === skillId)) {
      toast.error("Skill already added");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        { id: skillId, mustToHave: newSkillMustHave, name: skill.name },
      ],
    }));

    // Reset selection
    setSelectedSkillId("");
    setNewSkillMustHave(true);
  };

  const handleRemoveSkill = (skillId: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== skillId),
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (canFullyEdit) {
      if (!formData.title.trim()) newErrors.title = "Title is required";
      if (!formData.description.trim())
        newErrors.description = "Description is required";
      if (!formData.address.trim()) newErrors.address = "Address is required";
      if (!formData.workModel) newErrors.workModel = "Work model is required";
      if (!formData.salaryRange.trim())
        newErrors.salaryRange = "Salary range is required";
      if (!formData.reason.trim()) newErrors.reason = "Reason is required";
      if (formData.skills.length === 0)
        newErrors.skills = "At least one skill is required";
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = "Expiration date is required";
    } else {
      const expDate = new Date(formData.expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expDate < today) {
        newErrors.expirationDate = "Expiration date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fix the form errors");
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData: CreateJobPostRequest = {
        title: formData.title,
        description: formData.description,
        address: formData.address,
        expirationDate: formData.expirationDate,
        jdSkills: formData.skills.map((s) => ({
          id: s.id,
          mustToHave: s.mustToHave,
        })),
        yearsOfExperience: formData.yearsOfExperience,
        workModel: formData.workModel,
        salaryRange: formData.salaryRange,
        reason: formData.reason,
        jobPackage: formData.jobPackage,
      };

      const response = await updateJobPosting(jobId, updateData);

      if (response.code === 0 || response.code === 200) {
        toast.success("Job posting updated successfully!");
        router.push("/recruiter/recruiter-feature/jobs/create");
      } else {
        toast.error(response.message || "Failed to update job posting");
      }
    } catch (error: any) {
      console.error("Error updating job:", error);
      toast.error(error.message || "Failed to update job posting");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-0">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 text-sky-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-4 sm:p-0">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800">
            Job Not Found
          </h2>
          <p className="text-gray-600 mt-2">
            The job posting you're looking for doesn't exist or has been deleted.
          </p>
          <button
            onClick={() => router.push("/recruiter/recruiter-feature/jobs/create")}
            className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  // If job is ACTIVE or EXPIRED, redirect to active page (only expiration date edit allowed)
  if (isActiveOrExpired) {
    return (
      <div className="p-4 sm:p-0">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-amber-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Limited Editing Available
          </h2>
          <p className="text-gray-600 mb-4">
            This job is currently <strong>{job.status}</strong>. For active or
            expired jobs, only the expiration date can be modified. Please use
            the "Edit" option in the Active Jobs page to change the deadline.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => router.push("/recruiter/recruiter-feature/jobs/active")}
              className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
            >
              Go to Active Jobs
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-0">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-md transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Edit Job Posting</h1>
            <p className="text-sm text-gray-500">
              Status:{" "}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  job.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : job.status === "REJECTED"
                    ? "bg-red-100 text-red-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {job.status}
              </span>
            </p>
          </div>
        </div>
      </header>

      {/* Info Banner for REJECTED jobs */}
      {job.status === "REJECTED" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-800">Job Was Rejected</h3>
              <p className="text-sm text-red-700 mt-1">
                Please review and update the job posting based on the rejection
                feedback. Once saved, the job will be resubmitted for admin
                review.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border shadow-sm p-6 space-y-6">
        {/* Title */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Briefcase className="h-4 w-4" />
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., Senior Software Engineer"
          />
          {errors.title && (
            <p className="text-sm text-red-600 mt-1">{errors.title}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={6}
            className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
              errors.description ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Describe the job responsibilities, requirements, and benefits..."
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4" />
            Address *
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
              errors.address ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., 123 Main St, Ho Chi Minh City"
          />
          {errors.address && (
            <p className="text-sm text-red-600 mt-1">{errors.address}</p>
          )}
        </div>

        {/* Grid: Expiration, Work Model, Experience */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Calendar className="h-4 w-4" />
              Expiration Date *
            </label>
            <input
              type="date"
              name="expirationDate"
              value={formData.expirationDate}
              onChange={handleInputChange}
              min={new Date().toISOString().split("T")[0]}
              className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
                errors.expirationDate ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.expirationDate && (
              <p className="text-sm text-red-600 mt-1">{errors.expirationDate}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Clock className="h-4 w-4" />
              Work Model *
            </label>
            <select
              name="workModel"
              value={formData.workModel}
              onChange={handleInputChange}
              className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
                errors.workModel ? "border-red-500" : "border-gray-300"
              }`}
            >
              <option value="">Select work model</option>
              <option value="ONSITE">On-site</option>
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
            </select>
            {errors.workModel && (
              <p className="text-sm text-red-600 mt-1">{errors.workModel}</p>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Users className="h-4 w-4" />
              Years of Experience
            </label>
            <input
              type="number"
              name="yearsOfExperience"
              value={formData.yearsOfExperience}
              onChange={handleInputChange}
              min={0}
              max={50}
              className="w-full border border-gray-300 rounded-md p-3 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>
        </div>

        {/* Salary Range */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <DollarSign className="h-4 w-4" />
            Salary Range *
          </label>
          <input
            type="text"
            name="salaryRange"
            value={formData.salaryRange}
            onChange={handleInputChange}
            className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
              errors.salaryRange ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="e.g., $50,000 - $80,000 or Negotiable"
          />
          {errors.salaryRange && (
            <p className="text-sm text-red-600 mt-1">{errors.salaryRange}</p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            Reason for Hiring *
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            rows={3}
            className={`w-full border rounded-md p-3 focus:ring-sky-500 focus:border-sky-500 ${
              errors.reason ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Why are you hiring for this position?"
          />
          {errors.reason && (
            <p className="text-sm text-red-600 mt-1">{errors.reason}</p>
          )}
        </div>

        {/* Job Package */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Package className="h-4 w-4" />
            Job Package
          </label>
          <select
            name="jobPackage"
            value={formData.jobPackage}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-md p-3 focus:ring-sky-500 focus:border-sky-500"
          >
            <option value="BASIC">Basic</option>
            <option value="STANDARD">Standard</option>
            <option value="PREMIUM">Premium</option>
          </select>
        </div>

        {/* Skills Section */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            Required Skills *
          </label>

          {/* Add Skill */}
          <div className="flex gap-2 mb-3">
            <select
              value={selectedSkillId}
              onChange={(e) => setSelectedSkillId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-sky-500 focus:border-sky-500"
              disabled={isLoadingSkills}
            >
              <option value="">
                {isLoadingSkills ? "Loading skills..." : "Select a skill"}
              </option>
              {availableSkills
                .filter((s) => !formData.skills.some((fs) => fs.id === s.id))
                .map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
            </select>

            <label className="flex items-center gap-2 bg-gray-50 px-3 rounded-md border border-gray-300">
              <input
                type="checkbox"
                checked={newSkillMustHave}
                onChange={(e) => setNewSkillMustHave(e.target.checked)}
                className="rounded text-sky-600"
              />
              <span className="text-sm text-gray-600">Must Have</span>
            </label>

            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!selectedSkillId}
              className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {/* Selected Skills */}
          {formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill.id}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                    skill.mustToHave
                      ? "bg-sky-100 text-sky-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {skill.name ||
                    availableSkills.find((s) => s.id === skill.id)?.name ||
                    `Skill #${skill.id}`}
                  {skill.mustToHave && (
                    <span className="text-xs text-sky-600">(Required)</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill.id)}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No skills added yet</p>
          )}
          {errors.skills && (
            <p className="text-sm text-red-600 mt-1">{errors.skills}</p>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
