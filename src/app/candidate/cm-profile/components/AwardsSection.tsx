import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { Award } from "./types";

interface AwardsSectionProps {
    awards: Award[];
    onAdd: () => void;
    onEdit: (award: Award) => void;
    onRemove: (id: string) => void;
}

export default function AwardsSection({
    awards,
    onAdd,
    onEdit,
    onRemove
}: AwardsSectionProps) {
    const isEmpty = awards.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Awards</h2>
                <button
                    onClick={onAdd}
                    className="text-gray-600 hover:text-gray-700 p-2"
                >
                    <SquarePlus className="w-4 h-4" />
                </button>
            </div>

            {awards.length === 0 ? (
                <p className="text-gray-400 text-sm italic mt-1">
                    Highlight your awards or recognitions
                </p>
            ) : (
                <div className="space-y-3">
                    {awards.map((award) => (
                        <div key={award.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                                        {award.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-1">
                                        {award.organization}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {award.month && `${award.month}/`}{award.year}
                                    </p>
                                    {award.description && (
                                        <p className="text-sm text-gray-700 mt-2">{award.description}</p>
                                    )}
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => onEdit(award)}
                                        className="text-gray-400 hover:text-blue-600 p-1.5"
                                        title="Edit award"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemove(award.id)}
                                        className="text-gray-400 hover:text-red-600 p-1.5"
                                        title="Delete award"
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
