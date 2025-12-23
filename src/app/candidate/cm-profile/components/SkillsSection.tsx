import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { SkillGroup, SkillItem } from "./types";

interface SkillsSectionProps {
    coreSkillGroups: SkillGroup[];
    softSkillItems: SkillItem[];
    onAddCoreSkills: () => void;
    onAddSoftSkills: () => void;
    onEditCoreSkills?: (group: SkillGroup) => void;
    onEditSoftSkills?: () => void;
    onDeleteCoreSkills?: () => void;
    onDeleteSoftSkills?: () => void;
    popoverOpen: boolean;
    setPopoverOpen: (open: boolean) => void;
}

export default function SkillsSection({
    coreSkillGroups,
    softSkillItems,
    onAddCoreSkills,
    onAddSoftSkills,
    onEditCoreSkills,
    onEditSoftSkills,
    onDeleteCoreSkills,
    onDeleteSoftSkills,
    popoverOpen,
    setPopoverOpen
}: SkillsSectionProps) {
    const isEmpty = coreSkillGroups.length === 0 && softSkillItems.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                <div className="relative">
                    <button
                        onClick={() => setPopoverOpen(!popoverOpen)}
                        className="text-gray-600 hover:text-gray-700 p-2"
                    >
                        <SquarePlus className="w-4 h-4" />
                    </button>
                    {popoverOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setPopoverOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                                <div className="px-4 py-2 font-semibold text-gray-700 text-sm">Add group:</div>
                                <button
                                    className="flex items-center w-full py-2 px-4 hover:bg-gray-100 text-left text-gray-900 gap-2"
                                    onClick={() => {
                                        setPopoverOpen(false);
                                        onAddCoreSkills();
                                    }}
                                >
                                    <SquarePlus className="w-4 h-4 text-green-500" />
                                    Core skills
                                </button>
                                <button
                                    className="flex items-center w-full py-2 px-4 hover:bg-gray-100 text-left text-gray-900 gap-2"
                                    onClick={() => {
                                        setPopoverOpen(false);
                                        onAddSoftSkills();
                                    }}
                                >
                                    <SquarePlus className="w-4 h-4 text-green-500" />
                                    Soft skills
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Only show hint if no skills exist */}
            {coreSkillGroups.length === 0 && softSkillItems.length === 0 && (
                <p className="text-gray-400 text-sm italic mt-1">
                    Showcase your skills and proficiencies
                </p>
            )}

            {/* Display saved data */}
            {(coreSkillGroups.length > 0 || softSkillItems.length > 0) && (
                <div className="mt-4 space-y-4">
                    {coreSkillGroups.map((group) => (
                        <div key={group.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-gray-900">Core Skills</div>
                                <div className="flex items-center gap-1">
                                    {onEditCoreSkills && (
                                        <button
                                            onClick={() => onEditCoreSkills(group)}
                                            className="text-gray-400 hover:text-blue-600 p-1.5"
                                            title="Edit core skills"
                                        >
                                            <FiEdit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {onDeleteCoreSkills && (
                                        <button
                                            onClick={onDeleteCoreSkills}
                                            className="text-gray-400 hover:text-red-600 p-1.5"
                                            title="Delete all core skills"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Gray divider line */}
                            <div className="border-t border-gray-200"></div>
                            <div className="flex flex-wrap gap-2">
                                {group.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm gap-2"
                                        style={{ borderColor: '#e5e7eb' }}
                                    >
                                        <span>{item.skill}</span>
                                        {item.experience && (
                                            <span className="text-gray-500">
                                                ({parseInt(item.experience) === 1
                                                    ? '<1 year'
                                                    : parseInt(item.experience) === 2
                                                        ? '1 year+'
                                                        : `${parseInt(item.experience) - 1} years+`})
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {softSkillItems.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="font-semibold text-gray-900">Soft Skills</div>
                                <div className="flex items-center gap-1">
                                    {onEditSoftSkills && (
                                        <button
                                            onClick={onEditSoftSkills}
                                            className="text-gray-400 hover:text-blue-600 p-1.5"
                                            title="Edit soft skills"
                                        >
                                            <FiEdit className="w-4 h-4" />
                                        </button>
                                    )}
                                    {onDeleteSoftSkills && (
                                        <button
                                            onClick={onDeleteSoftSkills}
                                            className="text-gray-400 hover:text-red-600 p-1.5"
                                            title="Delete all soft skills"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Gray divider line */}
                            <div className="border-t border-gray-200"></div>
                            <div className="flex flex-wrap gap-2">
                                {softSkillItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm gap-2"
                                        style={{ borderColor: '#e5e7eb' }}
                                    >
                                        <span>{item.skill}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
