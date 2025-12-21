import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { searchSkills, type JDSkill } from "@/lib/jd-skill-api";

interface SkillItem {
    id: string;
    skill: string;
    experience?: string;
}

interface SkillsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    skillType: 'core' | 'soft' | '';
    skills: SkillItem[];
    selectedSkill: string;
    skillExperience: string;
    onSelectedSkillChange: (value: string) => void;
    onSkillExperienceChange: (value: string) => void;
    onAddSkill: () => void;
    onRemoveSkill: (id: string) => void;
    onSave: () => void;
    onCancel: () => void;
    isEditMode?: boolean;
}

export default function SkillsDialog({
    open,
    onOpenChange,
    skillType,
    skills,
    selectedSkill,
    skillExperience,
    onSelectedSkillChange,
    onSkillExperienceChange,
    onAddSkill,
    onRemoveSkill,
    onSave,
    onCancel,
    isEditMode = false
}: SkillsDialogProps) {
    // Autocomplete state for core skills
    const [suggestedSkills, setSuggestedSkills] = useState<JDSkill[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSkills, setIsLoadingSkills] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    // Search skills when user types (only for core skills)
    useEffect(() => {
        if (skillType !== 'core' || !selectedSkill || selectedSkill.trim().length < 2) {
            setSuggestedSkills([]);
            setShowSuggestions(false);
            return;
        }

        const searchTimer = setTimeout(async () => {
            setIsLoadingSkills(true);
            try {
                const results = await searchSkills(selectedSkill);
                setSuggestedSkills(results);
                setShowSuggestions(results.length > 0);
            } catch (error) {
                console.error('Error fetching skills:', error);
                setSuggestedSkills([]);
            } finally {
                setIsLoadingSkills(false);
            }
        }, 300); // Debounce 300ms

        return () => clearTimeout(searchTimer);
    }, [selectedSkill, skillType]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle selecting a suggested skill
    const handleSelectSuggestion = (skillName: string) => {
        onSelectedSkillChange(skillName);
        setShowSuggestions(false);
        setSuggestedSkills([]);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {skillType === "core" ? "Core Skills" : "Soft Skills"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Tip */}
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start space-x-2">
                        <span className="text-orange-600 text-lg">💡</span>
                        <p className="text-sm text-gray-700">
                            <span className="font-semibold">Tips:</span>{" "}
                            {skillType === "core"
                                ? "Organize your core skills into groups helps recruiters quickly understand your professional capabilities."
                                : "Highlight soft skills that demonstrate how you add value beyond professional abilities."}
                        </p>
                    </div>

                    {/* List Skills */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                            List skills ({skills.length}/20)
                        </Label>

                        <div className="flex space-x-2">
                            <div className="flex-1 relative">
                                <Input
                                    ref={inputRef}
                                    placeholder="Enter skill"
                                    value={selectedSkill}
                                    onChange={e => onSelectedSkillChange(e.target.value)}
                                    onFocus={() => {
                                        if (skillType === 'core' && suggestedSkills.length > 0) {
                                            setShowSuggestions(true);
                                        }
                                    }}
                                    className="flex-1"
                                />
                                
                                {/* Autocomplete Dropdown for Core Skills */}
                                {skillType === 'core' && showSuggestions && (
                                    <div
                                        ref={suggestionsRef}
                                        className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                                    >
                                        {isLoadingSkills ? (
                                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                                <div className="animate-spin inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full mr-2"></div>
                                                Searching skills...
                                            </div>
                                        ) : suggestedSkills.length > 0 ? (
                                            <ul className="py-1">
                                                {suggestedSkills.map((skill) => (
                                                    <li
                                                        key={skill.id}
                                                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-900 transition-colors"
                                                        onClick={() => handleSelectSuggestion(skill.name)}
                                                    >
                                                        {skill.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
                                    </div>
                                )}
                            </div>
                            {skillType === "core" && (
                                <Select value={skillExperience} onValueChange={onSkillExperienceChange}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select experience" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">&lt;1 year</SelectItem>
                                        <SelectItem value="2">1 year+</SelectItem>
                                        <SelectItem value="3">2 years+</SelectItem>
                                        <SelectItem value="4">3 years+</SelectItem>
                                        <SelectItem value="5">4 years+</SelectItem>
                                        <SelectItem value="6">5 years+</SelectItem>
                                        <SelectItem value="7">6 years+</SelectItem>
                                        <SelectItem value="8">7 years+</SelectItem>
                                        <SelectItem value="9">8 years+</SelectItem>
                                        <SelectItem value="10">9 years+</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            <Button
                                onClick={onAddSkill}
                                disabled={
                                    !selectedSkill || (skillType === "core" && !skillExperience)
                                }
                                className="bg-green-500 hover:bg-green-600 text-white px-4"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Skills List dạng chip */}
                        <div className="flex flex-wrap gap-2 mt-2">
                            {skills.map(skill => (
                                <div
                                    key={skill.id}
                                    className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm gap-2"
                                    style={{ borderColor: '#e5e7eb' }}
                                >
                                    <span>{skill.skill}</span>
                                    {skill.experience && (
                                        <span className="text-gray-500">
                                            ({parseInt(skill.experience) === 1
                                                ? '<1 year'
                                                : parseInt(skill.experience) === 2
                                                    ? '1 year+'
                                                    : `${parseInt(skill.experience) - 1} years+`})
                                        </span>
                                    )}
                                    <button
                                        className="ml-1 text-gray-400 hover:text-red-500"
                                        onClick={() => onRemoveSkill(skill.id)}
                                        type="button"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {skills.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                <div className="w-16 h-16 mb-2">
                                    <svg viewBox="0 0 64 64" fill="currentColor" opacity="0.3">
                                        <path d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8zm0 4c11.1 0 20 8.9 20 20s-8.9 20-20 20-20-8.9-20-20 8.9-20 20-20zm-8 14v16h4V26h-4zm12 0v16h4V26h-4z" />
                                    </svg>
                                </div>
                                <p className="text-sm">No items selected</p>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        variant="outline"
                        onClick={onCancel}
                        className="px-6"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onSave}
                        disabled={!skillType || (skills.length === 0 && !isEditMode)}
                        className="bg-gray-700 hover:bg-gray-800 text-white px-6"
                    >
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
