import React from 'react';
import { Bookmark, Project } from '../types';
import { Folder } from 'lucide-react';
import { getCategoryIcon } from './categoryIcons';
import { ProjectsPanel } from './ProjectsPanel';

interface LibraryHeroProps {
    bookmarks: Bookmark[];
    categories: { name: string; count: number }[];
    activeCategory: string | 'All';
    onSelectCategory: (category: string | 'All') => void;
    showFavoritesOnly: boolean;
    onToggleFavoritesOnly: () => void;
    projects: (Project & { count: number })[];
    activeProject: string | null;
    onSelectProject: (projectId: string) => void;
    onAddProject: (name: string, color: string) => void;
    onUpdateProject: (id: string, name: string, color: string) => void;
    onDeleteProject: (id: string) => void;
}

export const LibraryHero: React.FC<LibraryHeroProps> = ({ 
    bookmarks, 
    categories, 
    activeCategory, 
    onSelectCategory,
    showFavoritesOnly,
    onToggleFavoritesOnly,
    projects,
    activeProject,
    onSelectProject,
    onAddProject,
    onUpdateProject,
    onDeleteProject
}) => {
    if (bookmarks.length === 0) {
        return (
             <div className="mb-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center text-center shadow-lg">
                <h2 className="text-xl font-bold mb-1.5">Welcome to NeuroMark</h2>
                <p className="opacity-90 max-w-md text-sm">Your library is empty. Add your first bookmark.</p>
             </div>
        );
    }

    return (
        <div className="mb-3 grid grid-cols-1 lg:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Collections */}
            <div className="lg:col-span-2 p-3 md:p-4 rounded-2xl bg-white dark:bg-system-dark-panel border border-black/[0.04] dark:border-white/[0.05] shadow-sm flex flex-col justify-center relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-16 bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/20 duration-700"></div>
                 
                 <div className="relative z-10">
                     <div className="flex items-center justify-between gap-3 mb-2">
                         <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                             <Folder size={12} />
                             Collections
                         </div>
                         <span className="text-[10px] text-system-secondary dark:text-system-dark-secondary font-medium">
                             {categories.length} total
                         </span>
                     </div>
                     {categories.length === 0 ? (
                         <p className="text-xs text-system-secondary dark:text-system-dark-secondary">
                             No collections yet. Add categories to organize your library.
                         </p>
                     ) : (
                     <div className="flex flex-wrap gap-2">
                             {categories.map(category => (
                                 <button
                                     key={category.name}
                                     type="button"
                                     onClick={() => {
                                         onSelectCategory(category.name);
                                         if (showFavoritesOnly) onToggleFavoritesOnly();
                                     }}
                                     className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold transition-colors shrink-0 ${
                                         activeCategory === category.name
                                             ? 'bg-indigo-500 text-white border-indigo-500/80 shadow-sm'
                                             : 'bg-system-bg/80 dark:bg-white/5 border-black/5 dark:border-white/10 text-system-text dark:text-system-dark-text hover:bg-white dark:hover:bg-white/10'
                                     }`}
                                 >
                                     <span className={`${activeCategory === category.name ? 'text-white' : 'text-indigo-500'} opacity-90`}>
                                         {getCategoryIcon(category.name, 14)}
                                     </span>
                                     <span className="truncate max-w-[140px]">{category.name}</span>
                                     <span className={`text-[10px] font-semibold ${activeCategory === category.name ? 'text-white/90' : 'text-system-secondary dark:text-system-dark-secondary'}`}>
                                         {category.count}
                                     </span>
                                 </button>
                             ))}
                         </div>
                     )}
                 </div>
            </div>

            <ProjectsPanel
                projects={projects}
                activeProject={activeProject}
                onSelectProject={onSelectProject}
                onAddProject={onAddProject}
                onUpdateProject={onUpdateProject}
                onDeleteProject={onDeleteProject}
            />
        </div>
    );
};
