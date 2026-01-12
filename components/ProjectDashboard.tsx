import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { PenLine, PieChart, Star, Hash, LayoutGrid, Plus, ArrowUpRight, Activity, Layers, Zap, Sparkles } from 'lucide-react';

interface ProjectDashboardProps {
    project: Project;
    stats: {
        total: number;
        favorites: number;
        topTags: string[];
    };
    onUpdate: (id: string, updates: Partial<Project>) => void;
    onQuickAdd: () => void;
    onAnalysis: () => void;
}

const PROJECT_COLORS = [
  '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#32ADE6', 
  '#007AFF', '#5856D6', '#AF52DE', '#FF2D55'
];

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ project, stats, onUpdate, onQuickAdd, onAnalysis }) => {
    const [name, setName] = useState(project.name);
    const [description, setDescription] = useState(project.description || '');
    const [isEditingColor, setIsEditingColor] = useState(false);

    // Sync state if project changes from parent
    useEffect(() => {
        setName(project.name);
        setDescription(project.description || '');
    }, [project]);

    const handleBlurName = () => {
        if (name.trim() !== project.name) {
            onUpdate(project.id, { name: name.trim() });
        }
    };

    const handleBlurDesc = () => {
        if (description.trim() !== (project.description || '')) {
            onUpdate(project.id, { description: description.trim() });
        }
    };

    // Calculate a mock "Health/Progress" based on favorites ratio for visual flair
    const healthScore = stats.total > 0 ? Math.round((stats.favorites / stats.total) * 100) : 0;

    return (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="relative group/color">
                            <button 
                                onClick={() => setIsEditingColor(!isEditingColor)}
                                className="w-10 h-10 rounded-xl shadow-sm hover:scale-105 transition-transform ring-4 ring-white dark:ring-[#1C1C1E] flex items-center justify-center text-white"
                                style={{ backgroundColor: project.color }}
                            >
                                <LayoutGrid size={18} className="opacity-80" />
                            </button>
                             {isEditingColor && (
                                <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-[#2C2C2E] rounded-2xl shadow-modal border border-black/[0.05] dark:border-white/[0.1] grid grid-cols-3 gap-2 z-20 w-[120px] animate-in zoom-in-95 duration-100">
                                    {PROJECT_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => { onUpdate(project.id, { color: c }); setIsEditingColor(false); }}
                                            className="w-6 h-6 rounded-full hover:scale-110 transition-transform ring-1 ring-black/5"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <input 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleBlurName}
                            className="text-3xl md:text-4xl font-bold bg-transparent border-none outline-none text-system-text dark:text-system-dark-text placeholder-gray-300 w-full hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-lg px-2 -ml-2 transition-colors tracking-tight"
                        />
                    </div>
                    <div className="relative group/desc pl-1">
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            onBlur={handleBlurDesc}
                            placeholder="Add a mission statement for this project..."
                            className="w-full max-w-2xl bg-transparent border-none outline-none text-system-secondary dark:text-system-dark-secondary resize-none h-auto min-h-[24px] text-base leading-relaxed hover:bg-black/[0.02] dark:hover:bg-white/[0.02] rounded-lg px-2 -ml-2 transition-colors"
                            rows={1}
                        />
                        <PenLine size={14} className="absolute top-1 right-full mr-2 text-gray-300 opacity-0 group-hover/desc:opacity-100 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Main Stats (Big Number) */}
                <div className="md:col-span-1 bg-white dark:bg-system-dark-panel rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.05] shadow-sm relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 rounded-full blur-2xl -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
                     <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="flex items-center gap-2 text-system-secondary dark:text-system-dark-secondary text-xs font-bold uppercase tracking-wider">
                             <Layers size={14} />
                             Resources
                         </div>
                         <div>
                             <span className="text-5xl font-bold text-system-text dark:text-system-dark-text tracking-tighter">
                                 {stats.total}
                             </span>
                             <span className="text-sm text-gray-400 ml-1 font-medium">items</span>
                         </div>
                     </div>
                </div>

                {/* Card 2: Favorites / Impact (Visual Bar) */}
                <div className="md:col-span-1 bg-white dark:bg-system-dark-panel rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.05] shadow-sm relative overflow-hidden group">
                     <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 dark:bg-white/5">
                         <div 
                            className="h-full transition-all duration-1000 ease-out" 
                            style={{ width: `${healthScore}%`, backgroundColor: project.color }}
                         ></div>
                     </div>
                     <div className="flex flex-col h-full justify-between">
                         <div className="flex items-center justify-between text-system-secondary dark:text-system-dark-secondary text-xs font-bold uppercase tracking-wider">
                             <div className="flex items-center gap-2"><Star size={14} /> Curated</div>
                             <span>{healthScore}%</span>
                         </div>
                         <div className="mt-4">
                             <div className="text-2xl font-bold text-system-text dark:text-system-dark-text">
                                 {stats.favorites} <span className="text-sm font-medium text-gray-400">favorites</span>
                             </div>
                             <p className="text-xs text-gray-400 mt-1">High-value resources</p>
                         </div>
                     </div>
                </div>

                {/* Card 3: Top Tags (Interactive Pills) */}
                <div className="md:col-span-1 lg:col-span-2 bg-white dark:bg-system-dark-panel rounded-3xl p-6 border border-black/[0.04] dark:border-white/[0.05] shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 text-system-secondary dark:text-system-dark-secondary text-xs font-bold uppercase tracking-wider mb-4">
                        <Hash size={14} />
                        Focus Areas
                    </div>
                    {stats.topTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {stats.topTags.map((tag, i) => (
                                <span 
                                    key={tag} 
                                    className="px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-white/5 text-sm font-medium text-gray-600 dark:text-gray-300 border border-black/[0.02] dark:border-white/[0.05]"
                                >
                                    #{tag}
                                </span>
                            ))}
                            <button 
                                onClick={onQuickAdd}
                                className="px-3 py-1.5 rounded-lg border border-dashed border-gray-200 dark:border-white/10 text-sm text-gray-400 hover:text-indigo-500 hover:border-indigo-200 transition-colors"
                            >
                                + Add
                            </button>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 text-sm">
                            <span className="italic mb-2">No tags defined yet</span>
                             <button 
                                onClick={onQuickAdd}
                                className="text-xs text-indigo-500 hover:underline"
                            >
                                Add first resource
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};
