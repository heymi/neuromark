import React from 'react';
import { 
    Layers, 
    Star, 
    Settings,
    User
} from 'lucide-react';
import { getCategoryIcon } from './categoryIcons';

interface SidebarProps {
  categories: { name: string; count: number }[];
  popularTags: { name: string; count: number }[];
  activeCategory: string | 'All';
  activeProject: string | null;
  activeTag: string | null;
  onSelectCategory: (category: string | 'All') => void;
  onSelectTag: (tag: string) => void;
  showFavoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  userEmail: string;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  categories,
  popularTags,
  activeCategory,
  activeProject,
  activeTag,
  onSelectCategory,
  onSelectTag,
  showFavoritesOnly,
  onToggleFavoritesOnly,
  userEmail,
  onOpenSettings
}) => {
  return (
    <aside className="w-[250px] bg-system-sidebar dark:bg-system-dark-sidebar hidden md:flex flex-col h-full flex-shrink-0 pt-6 px-4">
      {/* User / Workspace */}
      <div className="mb-8 px-2">
        <button className="flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 p-2 -ml-2 rounded-xl transition-all duration-300 group w-full">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-black dark:from-indigo-500 dark:to-purple-600 shadow-md flex items-center justify-center text-white font-bold text-xs tracking-tight">
                NM
            </div>
            <div className="flex-1 flex flex-col items-start">
                 <span className="font-semibold text-system-text dark:text-system-dark-text text-sm">NeuroMark</span>
                 <span className="text-[10px] text-system-secondary dark:text-system-dark-secondary">Workspace</span>
            </div>
        </button>
      </div>

      <div className="space-y-8 overflow-y-auto no-scrollbar flex-1 pb-4">
        {/* Main Section */}
        <div className="space-y-1">
            <NavItem 
                active={activeCategory === 'All' && !activeProject && !showFavoritesOnly && !activeTag} 
                onClick={() => { onSelectCategory('All'); if(showFavoritesOnly) onToggleFavoritesOnly(); }}
                icon={<Layers size={18} strokeWidth={2} />}
                label="Library"
            />
            <NavItem 
                active={showFavoritesOnly} 
                onClick={onToggleFavoritesOnly}
                icon={<Star size={18} strokeWidth={2} />}
                label="Favorites"
            />
        </div>

        {/* Collections */}
        <div className="space-y-2 mt-2">
             <SectionHeader label="Collections" />
            {categories.length === 0 ? (
                <div className="px-3 text-[11px] text-system-secondary dark:text-system-dark-secondary">
                    No collections yet.
                </div>
            ) : (
                <div className="space-y-1">
                    {categories.map(category => (
                        <NavItem
                            key={category.name}
                            active={activeCategory === category.name && !activeProject && !activeTag}
                            onClick={() => {
                                onSelectCategory(category.name);
                                if (showFavoritesOnly) onToggleFavoritesOnly();
                            }}
                            icon={
                                <span className="text-indigo-500">
                                    {getCategoryIcon(category.name, 16)}
                                </span>
                            }
                            label={category.name}
                            count={category.count}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Tags */}
        <div className="space-y-2 mt-2">
             <SectionHeader label="Tags" />
            <div className="flex flex-wrap gap-2 px-2">
                {popularTags.map(tag => (
                     <button
                        key={tag.name}
                        onClick={() => onSelectTag(tag.name)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                            activeTag === tag.name
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 text-system-secondary dark:text-system-dark-secondary hover:border-black/10 dark:hover:border-white/10 hover:text-system-text dark:hover:text-system-dark-text'
                        }`}
                    >
                        <span className="opacity-50">#</span>
                        {tag.name}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Account */}
      <div className="mt-auto pt-3 pb-4 px-2 border-t border-black/5 dark:border-white/5">
        <div className="flex items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300">
              <User size={14} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-system-text dark:text-system-dark-text truncate">
                {userEmail || 'Not signed in'}
              </div>
              <div className="text-[10px] text-system-secondary dark:text-system-dark-secondary">Account</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-2 rounded-lg text-system-secondary dark:text-system-dark-secondary hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-system-text dark:hover:text-system-dark-text transition-colors"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
      
    </aside>
  );
};

// Sub-components for Sidebar
const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-3 py-1 text-[11px] font-bold text-system-secondary dark:text-system-dark-secondary uppercase tracking-wider opacity-70">
        {label}
    </div>
);

const NavItem = ({ active, onClick, icon, label, count, children }: any) => (
    <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
                 e.preventDefault();
                 onClick();
             }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 relative cursor-pointer select-none group ${
            active 
            ? 'bg-black/5 dark:bg-white/10 text-system-text dark:text-system-dark-text' 
            : 'text-system-secondary dark:text-system-dark-secondary hover:bg-black/[0.03] dark:hover:bg-white/5 hover:text-system-text dark:hover:text-system-dark-text'
        }`}
    >
        <div className="flex items-center gap-3 truncate max-w-[160px]">
            <span className={`transition-colors ${active ? 'text-system-text dark:text-white' : 'opacity-70 group-hover:opacity-100'}`}>{icon}</span>
            <span className="truncate tracking-tight">{label}</span>
        </div>
        {count !== undefined && (
            <span className={`text-[11px] font-semibold transition-opacity ${active ? 'text-system-text dark:text-white opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>{count}</span>
        )}
        {children}
    </div>
);
