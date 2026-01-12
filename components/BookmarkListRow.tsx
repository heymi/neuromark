import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Project } from '../types';
import { Star, Trash2, ArrowUpRight, Hash, Edit2, MoreHorizontal, ArrowRightCircle, Check, Pin, PinOff } from 'lucide-react';

interface BookmarkListRowProps {
  bookmark: Bookmark;
  projects: Project[];
  activeProjectId?: string | null;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onSelectTag?: (tag: string) => void;
  onEdit?: (bookmark: Bookmark) => void;
  onToggleProject?: (bookmarkId: string, projectId: string) => void;
}

export const BookmarkListRow: React.FC<BookmarkListRowProps> = ({ 
    bookmark, 
    projects, 
    activeProjectId,
    onDelete, 
    onToggleFavorite,
    onTogglePin,
    onSelectTag, 
    onEdit, 
    onToggleProject 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showProjectSubmenu, setShowProjectSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const domain = new URL(bookmark.url).hostname.replace('www.', '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=32`;
  
  const linkedProjects = projects.filter(p => bookmark.projectIds.includes(p.id));
  const currentContext = activeProjectId ? bookmark.projectContexts[activeProjectId] : null;

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowProjectSubmenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleProjectToggle = (projectId: string) => {
      onToggleProject?.(bookmark.id, projectId);
  }

  const handleTogglePin = () => {
      onTogglePin?.(bookmark.id);
      setShowMenu(false);
  }

  const getTagStyle = (tag: string) => {
    const lower = tag.toLowerCase();
    if (['prod', 'production', 'live'].some(t => lower.includes(t))) {
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
    if (['dev', 'development', 'test', 'staging'].some(t => lower.includes(t))) {
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20';
    }
    return 'text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400';
  };

  return (
    <div className={`group flex items-start gap-3 px-4 py-3 hover:bg-system-bg/80 dark:hover:bg-white/5 transition-colors bg-white dark:bg-system-dark-panel text-[16px] ${bookmark.isPinned ? 'bg-indigo-50/10' : ''}`}>
      {/* Icon */}
      <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center opacity-90 relative">
         {bookmark.iconEmoji ? (
             <span className="text-base leading-none">{bookmark.iconEmoji}</span>
         ) : (
             <img 
                src={faviconUrl} 
                alt="" 
                className="w-4 h-4 object-contain mix-blend-multiply dark:mix-blend-normal"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'; }}
             />
         )}
         {bookmark.isPinned && (
             <div className="absolute -top-1 -right-1 text-indigo-500 bg-white dark:bg-[#2C2C2E] rounded-full border border-black/5 dark:border-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                 <Pin size={8} fill="currentColor" />
             </div>
         )}
      </div>

      {/* Title & Summary */}
      <div className="flex-1 min-w-0 flex items-start gap-3 pr-4">
         <div className="min-w-0">
           <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="font-medium text-[16px] text-system-text dark:text-system-dark-text truncate hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block leading-snug">
              {bookmark.title}
           </a>
         
         {/* Context Badge in Row View */}
         {activeProjectId && currentContext ? (
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[12px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-500/20 max-w-[120px] truncate">
                 {currentContext}
              </span>
         ) : (
            <span className="hidden sm:block text-[13px] text-system-secondary dark:text-system-dark-secondary opacity-70 font-normal leading-snug max-w-[360px] truncate mt-0.5">
                {bookmark.summary}
            </span>
         )}
         </div>
      </div>

      {/* Meta Information Columns */}
      
      {/* Tags - Compact text view */}
      <div className="hidden md:flex items-center gap-2 max-w-[150px] overflow-hidden justify-end pt-1">
         {bookmark.tags.slice(0, 2).map(tag => (
            <button 
                key={tag} 
                onClick={() => onSelectTag?.(tag)}
                className={`text-[11px] px-1.5 py-0.5 rounded-md transition-colors whitespace-nowrap ${getTagStyle(tag)}`}
            >
                #{tag}
            </button>
         ))}
         {bookmark.tags.length > 2 && <span className="text-[11px] text-gray-300 dark:text-gray-600">...</span>}
      </div>
      
      {/* Domain/Category - Right Aligned */}
      <div className="hidden lg:flex w-24 justify-end flex-shrink-0 pt-1">
        <span className="text-[12px] text-gray-400 dark:text-gray-500 truncate">{domain}</span>
      </div>
      
      {/* Project Dots */}
       <div className="hidden xl:flex w-24 justify-end flex-shrink-0 items-center gap-1.5 pt-1">
        {!activeProjectId && linkedProjects.length > 0 && linkedProjects.map(p => (
             <div key={p.id} className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} title={p.name}></div>
        ))}
      </div>

      {/* Actions (Hover Only) */}
      <div className="flex items-center gap-1 w-20 justify-end pl-2 pt-1">
         <button 
            onClick={(e) => { e.preventDefault(); onToggleFavorite(bookmark.id); }}
            className={`p-1 rounded-md transition-all ${bookmark.isFavorite ? 'text-amber-400 opacity-100' : 'text-gray-300 dark:text-gray-600 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-500 dark:hover:text-gray-300'}`}
         >
            <Star size={13} fill={bookmark.isFavorite ? "currentColor" : "none"} />
        </button>
        <button 
            onClick={() => onEdit?.(bookmark)}
            className="p-1 text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-md transition-all opacity-0 group-hover:opacity-100"
        >
            <Edit2 size={13} />
        </button>
        
        {/* Dropdown Trigger for List Row */}
        <div className="relative" ref={menuRef}>
            <button 
                onClick={() => { setShowMenu(!showMenu); setShowProjectSubmenu(false); }}
                className="p-1 text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
            >
                <MoreHorizontal size={13} />
            </button>
             {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-black/[0.06] dark:border-white/[0.1] py-1 z-50 origin-top-right">
                     <button 
                        onClick={handleTogglePin}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2"
                     >
                         {bookmark.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                         {bookmark.isPinned ? 'Unpin' : 'Pin to top'}
                     </button>
                     <div className="relative group/submenu">
                         <button 
                            onClick={(e) => { e.stopPropagation(); setShowProjectSubmenu(!showProjectSubmenu); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between"
                         >
                             <span>Manage Projects</span>
                             <span>›</span>
                         </button>
                         {(showProjectSubmenu) && (
                             <div className="absolute right-full top-0 mr-1 w-48 bg-white dark:bg-[#252525] rounded-lg shadow-xl border border-black/[0.06] dark:border-white/[0.1] py-1 max-h-40 overflow-y-auto custom-scrollbar">
                                 {projects.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No projects</div>}
                                 {projects.map(p => {
                                     const isIncluded = bookmark.projectIds.includes(p.id);
                                     return (
                                         <button key={p.id} onClick={(e) => { e.stopPropagation(); handleProjectToggle(p.id); }} className="w-full text-left px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center gap-2">
                                             <div className={`w-3 h-3 rounded border flex items-center justify-center ${isIncluded ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                 {isIncluded && <Check size={8} className="text-white" />}
                                             </div>
                                             <span className="w-1.5 h-1.5 rounded-full" style={{background: p.color}}></span>{p.name}
                                         </button>
                                     );
                                 })}
                             </div>
                         )}
                     </div>
                     <button onClick={() => onDelete(bookmark.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">Delete</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
