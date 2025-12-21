import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { WorkExperience } from "./types";

interface WorkExperienceSectionProps {
    workExperiences: WorkExperience[];
    onAdd: () => void;
    onEdit: (experience: WorkExperience) => void;
    onRemove: (id: string) => void;
}

export default function WorkExperienceSection({
    workExperiences,
    onAdd,
    onEdit,
    onRemove
}: WorkExperienceSectionProps) {
    const isEmpty = workExperiences.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Work Experience
                </h2>
                <button
                    onClick={onAdd}
                    className="text-gray-600 hover:text-gray-700 p-2"
                >
                    <SquarePlus className="w-4 h-4" />
                </button>
            </div>

            {workExperiences.length === 0 ? (
                <p className="text-gray-400 text-sm italic mt-1">
                    Highlight detailed information about your job history
                </p>
            ) : (
                <div className="space-y-3">
                    {workExperiences.map((exp) => (
                        <div key={exp.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                                        {exp.jobTitle}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {exp.company}
                                    </p>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {exp.startMonth && `${exp.startMonth}/`}{exp.startYear} - {exp.working ? 'NOW' : `${exp.endMonth && `${exp.endMonth}/`}${exp.endYear}`}
                                    </p>
                                    {exp.description && (
                                        <p className="text-sm text-gray-700 mb-2">{exp.description}</p>
                                    )}
                                    {exp.project && (
                                        <p className="text-sm text-gray-600">Project: {exp.project}</p>
                                    )}
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => onEdit(exp)}
                                        className="text-gray-400 hover:text-blue-600 p-1.5"
                                        title="Edit work experience"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemove(exp.id)}
                                        className="text-gray-400 hover:text-red-600 p-1.5"
                                        title="Delete work experience"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
