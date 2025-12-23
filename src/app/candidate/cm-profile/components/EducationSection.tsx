import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { Education } from "./types";

interface EducationSectionProps {
    educations: Education[];
    onAdd: () => void;
    onEdit: (education: Education) => void;
    onRemove: (id: string) => void;
}

export default function EducationSection({
    educations,
    onAdd,
    onEdit,
    onRemove
}: EducationSectionProps) {
    const isEmpty = educations.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Education
                </h2>
                <button
                    onClick={onAdd}
                    className="text-gray-600 hover:text-gray-700 p-2"
                >
                    <SquarePlus className="w-4 h-4" />
                </button>
            </div>

            {educations.length === 0 ? (
                <p className="text-gray-400 text-sm italic mt-1">
                    Add your education background
                </p>
            ) : (
                <div className="space-y-3">
                    {educations.map((edu) => (
                        <div key={edu.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                                        {edu.school}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {edu.degree} - {edu.major}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {edu.startMonth && `${edu.startMonth}/`}{edu.startYear} - {edu.endMonth && edu.endYear ? `${edu.endMonth}/${edu.endYear}` : 'NOW'}
                                    </p>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => onEdit(edu)}
                                        className="text-gray-400 hover:text-blue-600 p-1.5"
                                        title="Edit education"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemove(edu.id)}
                                        className="text-gray-400 hover:text-red-600 p-1.5"
                                        title="Delete education"
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
