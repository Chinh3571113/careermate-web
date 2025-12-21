import { SquarePlus, Trash2 } from "lucide-react";
import { FiEdit } from "react-icons/fi";
import { HighlightProject } from "./types";

interface HighlightProjectsSectionProps {
    projects: HighlightProject[];
    onAdd: () => void;
    onEdit: (project: HighlightProject) => void;
    onRemove: (id: string) => void;
}

export default function HighlightProjectsSection({
    projects,
    onAdd,
    onEdit,
    onRemove
}: HighlightProjectsSectionProps) {
    const isEmpty = projects.length === 0;
    
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${isEmpty ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    Highlight Project
                </h2>
                <button
                    onClick={onAdd}
                    className="text-gray-600 hover:text-gray-700 p-2"
                >
                    <SquarePlus className="w-4 h-4" />
                </button>
            </div>

            {projects.length === 0 ? (
                <p className="text-gray-400 text-sm italic mt-1">Add your highlight projects to showcase your work</p>
            ) : (
                <div className="space-y-3">
                    {projects.map((project) => (
                        <div key={project.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-base mb-1">
                                        {project.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-2">
                                        {project.startMonth && `${project.startMonth}/`}{project.startYear} - {project.working ? "NOW" : `${project.endMonth && `${project.endMonth}/`}${project.endYear}`}
                                    </p>
                                    <p className="text-sm text-gray-700 mb-2">{project.description}</p>
                                    {project.url && (
                                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                                            {project.url}
                                        </a>
                                    )}
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => onEdit(project)}
                                        className="text-gray-400 hover:text-blue-600 p-1.5"
                                        title="Edit project"
                                    >
                                        <FiEdit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onRemove(project.id)}
                                        className="text-gray-400 hover:text-red-600 p-1.5"
                                        title="Delete project"
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
