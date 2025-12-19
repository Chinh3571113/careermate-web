/**
 * QuickReviewDrawer Component
 * Slide-in drawer for quick review submission without navigating away
 * Production-ready with multi-step form, validation, and smooth animations
 */

"use client";

import { useState, useEffect, useCallback } from 'react';
import { X, Star, ChevronRight, ChevronLeft, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { 
  submitReview,
  updateReview,
  getReviewTypeText, 
  normalizeReviewType,
  type ReviewType, 
  type SubmitReviewRequest,
  type NormalizedReviewType,
} from '@/lib/review-api';
import { clearEligibilityCache } from '@/hooks/useReviewEligibility';
import toast from 'react-hot-toast';

export interface QuickReviewDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: number;
  jobApplyId: number;
  companyName: string;
  jobTitle: string;
  reviewType?: ReviewType;  // Single type (backwards compatible)
  availableTypes?: ReviewType[];  // Multiple available types (new)
  onSuccess?: () => void;
  
  // Edit mode props
  editMode?: boolean;
  existingReview?: {
    id: number;
    overallRating: number;
    reviewText: string;
    isAnonymous: boolean;
    categoryRatings: Record<string, number>;
  };
}

interface RatingCategory {
  key: string;
  label: string;
  description?: string;
}

const APPLICATION_CATEGORIES: RatingCategory[] = [
  { key: 'communicationRating', label: 'Communication', description: 'How well did they communicate?' },
  { key: 'responsivenessRating', label: 'Responsiveness', description: 'How quickly did they respond?' },
];

const INTERVIEW_CATEGORIES: RatingCategory[] = [
  { key: 'communicationRating', label: 'Communication', description: 'How well did they communicate?' },
  { key: 'interviewProcessRating', label: 'Interview Process', description: 'Was the process organized?' },
];

const WORK_CATEGORIES: RatingCategory[] = [
  { key: 'workCultureRating', label: 'Work Culture', description: 'Team environment and values' },
  { key: 'managementRating', label: 'Management', description: 'Leadership and support' },
  { key: 'workLifeBalanceRating', label: 'Work-Life Balance', description: 'Flexibility and hours' },
  { key: 'benefitsRating', label: 'Benefits', description: 'Compensation and perks' },
];

const getCategoriesForType = (type: ReviewType): RatingCategory[] => {
  const normalized = normalizeReviewType(type);
  if (normalized === 'WORK_EXPERIENCE') return WORK_CATEGORIES;
  if (normalized === 'INTERVIEW_EXPERIENCE') return INTERVIEW_CATEGORIES;
  return APPLICATION_CATEGORIES;
};

const REVIEW_PROMPTS: Record<NormalizedReviewType, string[]> = {
  APPLICATION_EXPERIENCE: [
    'How was the application process?',
    'Did they respond to your application?',
    'Would you recommend others to apply here?',
  ],
  INTERVIEW_EXPERIENCE: [
    'How was your interview experience?',
    'Were the interviewers professional?',
    'Was the process respectful of your time?',
  ],
  WORK_EXPERIENCE: [
    'What was it like working here?',
    'How was the team culture?',
    'Would you recommend this employer?',
  ],
};

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  description?: string;
}

const StarRating = ({ value, onChange, size = 'md', label, description }: StarRatingProps) => {
  const [hovered, setHovered] = useState(0);
  
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          {value > 0 && (
            <span className="text-xs text-gray-500">{value}/5</span>
          )}
        </div>
      )}
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
          >
            <Star
              className={cn(
                sizeClasses[size],
                'transition-colors',
                (hovered || value) >= star
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

export default function QuickReviewDrawer({
  open,
  onOpenChange,
  candidateId,
  jobApplyId,
  companyName,
  jobTitle,
  reviewType,
  availableTypes,
  onSuccess,
  editMode = false,
  existingReview,
}: QuickReviewDrawerProps) {
  // Determine if we need type selection step
  const hasMultipleTypes = availableTypes && availableTypes.length > 1;
  const singleType = reviewType || (availableTypes?.length === 1 ? availableTypes[0] : undefined);
  
  const [selectedType, setSelectedType] = useState<ReviewType | undefined>(singleType);
  const [step, setStep] = useState(hasMultipleTypes ? 0 : 1); // Step 0 = type selection
  const [overallRating, setOverallRating] = useState(existingReview?.overallRating || 0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>(existingReview?.categoryRatings || {});
  const [reviewText, setReviewText] = useState(existingReview?.reviewText || '');
  const [isAnonymous, setIsAnonymous] = useState(existingReview?.isAnonymous || false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use selected type for form logic
  const activeType = selectedType || singleType || 'APPLICATION_EXPERIENCE';
  const categories = getCategoriesForType(activeType);
  const normalizedType = normalizeReviewType(activeType);
  const prompts = REVIEW_PROMPTS[normalizedType];

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setSelectedType(singleType);
      setStep(hasMultipleTypes ? 0 : 1);
      
      // Populate with existing data if in edit mode
      if (editMode && existingReview) {
        setOverallRating(existingReview.overallRating);
        setCategoryRatings(existingReview.categoryRatings);
        setReviewText(existingReview.reviewText);
        setIsAnonymous(existingReview.isAnonymous);
      } else {
        setOverallRating(0);
        setCategoryRatings({});
        setReviewText('');
        setIsAnonymous(false);
      }
    }
  }, [open, hasMultipleTypes, singleType, editMode, existingReview]);

  const handleCategoryRating = useCallback((key: string, value: number) => {
    setCategoryRatings(prev => {
      const updated = { ...prev, [key]: value };
      // Auto-calculate overall rating from category averages
      const values = Object.values(updated).filter(v => v > 0);
      if (values.length > 0) {
        const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
        setOverallRating(Math.round(avg));
      }
      return updated;
    });
  }, []);

  const canProceedStep1 = categories.every(cat => categoryRatings[cat.key] > 0); // All categories rated
  const canProceedStep2 = overallRating > 0; // Overall rating (auto-calculated or adjusted)
  const canSubmit = reviewText.trim().length >= 20;

  const handleSubmit = async () => {
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const request: SubmitReviewRequest & { candidateId: number } = {
        candidateId,
        jobApplyId,
        reviewType: normalizedType,
        overallRating,
        reviewText: reviewText.trim(),
        isAnonymous,
        ...categoryRatings,
      };

      if (editMode && existingReview) {
        // Update existing review
        await updateReview(existingReview.id, request);
        toast.success('Review updated successfully!');
      } else {
        // Create new review
        await submitReview(request);
        toast.success('Review submitted successfully! Thank you for your feedback.');
      }
      
      // Clear cache for this application
      clearEligibilityCache(candidateId, jobApplyId);
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || (editMode ? 'Failed to update review' : 'Failed to submit review'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 0: return 'Select Review Type';
      case 1: return 'Rate Your Experience';
      case 2: return 'Overall Rating';
      case 3: return 'Write Your Review';
      default: return '';
    }
  };

  const totalSteps = hasMultipleTypes ? 4 : 3;
  const displayStep = hasMultipleTypes ? step : step; // For progress display

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {selectedType ? getReviewTypeText(selectedType) : 'Select Type'}
            </Badge>
          </div>
          <DialogTitle className="text-lg">
            {editMode ? 'Edit Review' : 'Review'} {companyName}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {jobTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 py-4">
          {(hasMultipleTypes ? [0, 1, 2, 3] : [1, 2, 3]).map((s, idx) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  s === step
                    ? 'bg-yellow-500 text-white'
                    : s < step
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                )}
              >
                {s < step ? '✓' : idx + 1}
              </div>
              {idx < (hasMultipleTypes ? 3 : 2) && (
                <div
                  className={cn(
                    'w-8 h-0.5 mx-1',
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          ))}
          <span className="ml-2 text-sm text-gray-600">{getStepTitle()}</span>
        </div>

        {/* Step 0: Type Selection (only if multiple types) */}
        {step === 0 && hasMultipleTypes && availableTypes && (
          <div className="space-y-4 py-4">
            <p className="text-gray-700 text-center">
              Select the type of review you want to submit:
            </p>
            <div className="space-y-3">
              {availableTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    'w-full p-4 rounded-lg border-2 text-left transition-all',
                    selectedType === type
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="font-medium">{getReviewTypeText(type)}</div>
                  <p className="text-sm text-gray-500 mt-1">
                    {normalizeReviewType(type) === 'APPLICATION_EXPERIENCE' && 
                      'Rate your application experience with this company'}
                    {normalizeReviewType(type) === 'INTERVIEW_EXPERIENCE' && 
                      'Share your interview experience and process'}
                    {normalizeReviewType(type) === 'WORK_EXPERIENCE' && 
                      'Review your work experience at this company'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Category Ratings */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600 mb-4">
              Rate each aspect of your experience:
            </p>
            {categories.map(cat => (
              <div key={cat.key} className="p-3 bg-gray-50 rounded-lg">
                <StarRating
                  value={categoryRatings[cat.key] || 0}
                  onChange={(v) => handleCategoryRating(cat.key, v)}
                  size="sm"
                  label={cat.label}
                  description={cat.description}
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Overall Rating (Read-Only Display) */}
        {step === 2 && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-4">
              <p className="text-gray-700">Your overall rating:</p>
              <p className="text-sm text-gray-500">
                Calculated from your ratings above
              </p>
              <div className="flex justify-center">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={cn(
                        'w-9 h-9',
                        star <= overallRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      )}
                    />
                  ))}
                </div>
              </div>
              {overallRating > 0 && (
                <p className="text-sm font-medium text-gray-700">
                  {overallRating === 1 && 'Poor'}
                  {overallRating === 2 && 'Fair'}
                  {overallRating === 3 && 'Good'}
                  {overallRating === 4 && 'Very Good'}
                  {overallRating === 5 && 'Excellent'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Written Review */}
        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="review-text" className="text-sm font-medium">
                Share your experience
              </Label>
              <Textarea
                id="review-text"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={`${prompts[1]} ${prompts[2]}`}
                className="min-h-[150px] resize-none"
                maxLength={2000}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Minimum 20 characters</span>
                <span className={reviewText.length < 20 ? 'text-red-500' : ''}>
                  {reviewText.length}/2000
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="anonymous" className="text-sm text-gray-700">
                Post anonymously
              </label>
            </div>

            {/* Summary */}
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">Review Summary</p>
              <div className="flex items-center gap-2 text-sm text-yellow-700">
                <span>Overall:</span>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={cn('w-4 h-4', s <= overallRating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300')} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t mt-4">
          {step > (hasMultipleTypes ? 0 : 1) ? (
            <Button variant="outline" onClick={() => setStep(s => s - 1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep(s => s + 1)}
              disabled={
                step === 0 ? !selectedType :
                step === 1 ? !canProceedStep1 : 
                !canProceedStep2
              }
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editMode ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {editMode ? 'Update Review' : 'Submit Review'}
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
