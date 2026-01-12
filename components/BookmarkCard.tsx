import React, { useState, useRef, useEffect } from 'react';
import { Bookmark, Project } from '../types';
import { Star, MoreHorizontal, Folder, Hash, ArrowUpRight, Edit2, Link as LinkIcon, Trash2, ArrowRightCircle, Check, Pin, PinOff } from 'lucide-react';

interface BookmarkCardProps {
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

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ 
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
	  const faviconUrl = `https://www.google.com/s2/favicons?domain=${bookmark.url}&sz=128`;

  // Find all projects this bookmark belongs to
  const linkedProjects = projects.filter(p => bookmark.projectIds.includes(p.id));
  
  // Specific context for the currently active project
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

  // Actions
  const handleCopyLink = () => {
      navigator.clipboard.writeText(bookmark.url);
      setShowMenu(false);
  };

  const handleEdit = () => {
      onEdit?.(bookmark);
      setShowMenu(false);
  };

  const handleDelete = () => {
      onDelete(bookmark.id);
      setShowMenu(false);
  };

	  const handleTogglePin = () => {
	      onTogglePin?.(bookmark.id);
	      setShowMenu(false);
	  }

	  const handleProjectToggle = (projectId: string) => {
	      onToggleProject?.(bookmark.id, projectId);
	  }

	  const handleOpenUrl = () => {
	    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
	  };

	  return (
	    <div
	      role="link"
	      tabIndex={0}
	      onClick={handleOpenUrl}
	      onKeyDown={(e) => {
	        if (e.key === 'Enter' || e.key === ' ') {
	          e.preventDefault();
	          handleOpenUrl();
	        }
	      }}
	      className={`group relative bg-white dark:bg-system-dark-elevated rounded-2xl transition-all duration-400 ease-apple-ease flex flex-col h-full overflow-visible hover:-translate-y-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/30 ${
	        bookmark.isPinned 
	        ? 'shadow-soft ring-1 ring-indigo-500/20' 
	        : 'shadow-soft hover:shadow-soft-hover ring-1 ring-black/[0.02] dark:ring-white/[0.05]'
	    }`}>
      
      {/* Pinned Indicator - Subtle Glow */}
      {bookmark.isPinned && (
          <div className="absolute top-3 right-3 text-indigo-500 z-10 animate-in fade-in duration-500">
              <Pin size={12} fill="currentColor" />
          </div>
      )}

      {/* Card Content Container - No borders between sections */}
      <div className="p-5 flex flex-col h-full">
          
          {/* Header: Icon + Title */}
          <div className="flex items-start gap-4 mb-3">
              {/* Favicon - Squircle */}
              <div className="w-12 h-12 shrink-0 bg-[#F5F5F7] dark:bg-white/5 rounded-2xl flex items-center justify-center border border-black/[0.02] dark:border-white/[0.05]">
                    {bookmark.iconEmoji ? (
                        <span className="text-2xl">{bookmark.iconEmoji}</span>
                    ) : (
                        <img 
                            src={faviconUrl} 
                            alt={domain} 
                            className="w-6 h-6 object-contain opacity-90 mix-blend-multiply dark:mix-blend-normal"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://www.google.com/s2/favicons?domain=google.com&sz=128'; 
                            }}
                        />
                    )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                    <h3 className="font-semibold text-[15px] text-system-text dark:text-system-dark-text truncate leading-snug tracking-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" title={bookmark.title}>
	                        {bookmark.title}
	                    </h3>
                    
                    <div className="flex items-center gap-2">
                        {/* Domain */}
                        <span className="text-[11px] text-system-secondary dark:text-system-dark-secondary truncate font-medium opacity-80 hover:opacity-100 transition-opacity">
                            {domain}
                        </span>

                        {/* Category Dot */}
                         <div className="w-0.5 h-0.5 rounded-full bg-gray-300 dark:bg-gray-600"></div>

                        {/* Primary Category */}
                         <span className="text-[11px] text-system-secondary dark:text-system-dark-secondary truncate font-medium opacity-80">
                            {bookmark.categories[0]}
                        </span>
                    </div>
              </div>
          </div>

          {/* Context/Summary */}
          <div className="mb-4 min-h-[40px]">
               {activeProjectId && currentContext ? (
                    <div className="inline-flex items-start gap-1.5 p-2 rounded-lg bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100/50 dark:border-indigo-500/20 w-full">
                        <div className="mt-0.5 text-indigo-500"><ArrowRightCircle size={10} /></div>
                        <p className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 leading-tight">
                           {currentContext}
                        </p>
                    </div>
                ) : (
                    <p className="text-[13px] text-system-secondary dark:text-system-dark-secondary leading-relaxed line-clamp-2 opacity-90">
                        {bookmark.summary}
                    </p>
                )}
          </div>

          {/* Footer: Tags & Actions - Pushed to bottom */}
          <div className="mt-auto flex items-end justify-between gap-2">
              <div className="flex flex-wrap gap-1.5 flex-1 overflow-hidden h-6">
                {bookmark.tags.slice(0, 3).map(tag => (
                  <span 
                    key={tag}
                    onClick={(e) => { e.stopPropagation(); onSelectTag?.(tag); }}
                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-system-secondary dark:text-system-dark-secondary hover:bg-black/10 dark:hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    <span className="opacity-50 mr-0.5">#</span>
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1">
                  <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(bookmark.id); }}
                      className={`p-1.5 rounded-lg transition-all ${
                          bookmark.isFavorite
                          ? 'text-amber-400 bg-amber-50 dark:bg-amber-900/20 opacity-100'
                          : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 opacity-0 group-hover:opacity-100'
                      }`}
                  >
                      <Star size={14} fill={bookmark.isFavorite ? "currentColor" : "none"} />
                  </button>

                  {/* Action Buttons - Only visible on hover or if menu open */}
                  <div className={`flex items-center gap-1 transition-opacity duration-200 ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {/* Linked Projects Dots */}
                      {!activeProjectId && linkedProjects.length > 0 && (
                          <div className="flex -space-x-1 mr-2">
                              {linkedProjects.slice(0, 3).map(p => (
                                  <div key={p.id} className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#2C2C2E]" style={{backgroundColor: p.color}} title={p.name}></div>
                              ))}
                          </div>
                      )}

                  <a
                    onClick={(e) => e.stopPropagation()}
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors"
                  >
                      <ArrowUpRight size={14} />
                  </a>

                  {/* Dropdown */}
                  <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
	                        <button 
	                            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); setShowProjectSubmenu(false); }}
	                            className={`p-1.5 rounded-lg transition-colors ${showMenu ? 'bg-black/10 dark:bg-white/20 text-black dark:text-white' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10'}`}
	                        >
	                            <MoreHorizontal size={14} />
	                        </button>
                        
                        {/* Elegant Menu */}
                        {showMenu && (
                            <div className="absolute right-0 bottom-full mb-2 w-52 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl rounded-xl shadow-modal ring-1 ring-black/5 dark:ring-white/10 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-bottom-right">
                                 
                                 <button 
                                    onClick={handleTogglePin}
                                    className="w-full text-left px-3 py-2 text-[13px] text-system-text dark:text-system-dark-text hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-2.5 mx-1 rounded-lg w-[calc(100%-8px)]"
                                 >
                                     {bookmark.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                                     {bookmark.isPinned ? 'Unpin' : 'Pin to top'}
                                 </button>

                                 <div className="relative group/submenu">
                                     <button 
                                        onClick={(e) => { e.stopPropagation(); setShowProjectSubmenu(!showProjectSubmenu); }}
                                        className="w-full text-left px-3 py-2 text-[13px] text-system-text dark:text-system-dark-text hover:bg-indigo-500 hover:text-white transition-colors flex items-center justify-between mx-1 rounded-lg w-[calc(100%-8px)]"
                                     >
                                         <span className="flex items-center gap-2.5"><Folder size={14} /> Projects</span>
                                         <span className="text-[10px] opacity-70">›</span>
                                     </button>
                                     
                                     {/* Submenu */}
                                     {(showProjectSubmenu) && (
                                         <div className="absolute right-full bottom-0 mr-2 w-48 bg-white/95 dark:bg-[#1E1E1E]/95 backdrop-blur-xl rounded-xl shadow-modal ring-1 ring-black/5 dark:ring-white/10 py-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                             {projects.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">No projects</div>}
                                             {projects.map(p => {
                                                 const isIncluded = bookmark.projectIds.includes(p.id);
                                                 return (
                                                     <button
                                                        key={p.id}
                                                        onClick={(e) => { e.stopPropagation(); handleProjectToggle(p.id); }}
                                                        className="w-[calc(100%-8px)] mx-1 text-left px-3 py-2 text-[13px] text-system-text dark:text-system-dark-text hover:bg-indigo-500 hover:text-white rounded-lg transition-colors flex items-center gap-2"
                                                     >
                                                         <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${isIncluded ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                             {isIncluded && <Check size={10} className="text-white" />}
                                                         </div>
                                                         <span className="w-1.5 h-1.5 rounded-full" style={{background: p.color}}></span>
                                                         {p.name}
                                                     </button>
                                                 );
                                             })}
                                         </div>
                                     )}
                                 </div>

                                 <button 
                                    onClick={handleEdit}
                                    className="w-full text-left px-3 py-2 text-[13px] text-system-text dark:text-system-dark-text hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-2.5 mx-1 rounded-lg w-[calc(100%-8px)]"
                                 >
                                     <Edit2 size={14} /> Edit
                                 </button>
                                 <button 
                                    onClick={handleCopyLink}
                                    className="w-full text-left px-3 py-2 text-[13px] text-system-text dark:text-system-dark-text hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-2.5 mx-1 rounded-lg w-[calc(100%-8px)]"
                                 >
                                     <LinkIcon size={14} /> Copy Link
                                 </button>
                                 
                                 <div className="h-px bg-black/5 dark:bg-white/10 my-1 mx-2" />
                                 
                                 <button 
                                    onClick={handleDelete}
                                    className="w-full text-left px-3 py-2 text-[13px] text-red-600 hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2.5 mx-1 rounded-lg w-[calc(100%-8px)]"
                                 >
                                     <Trash2 size={14} /> Delete
                                 </button>
                            </div>
                        )}
                  </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
