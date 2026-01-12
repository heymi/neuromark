import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Loader2, Link as LinkIcon, AlertCircle, Check, FolderOpen, Tag, Plus, Briefcase, FileText } from 'lucide-react';
import { analyzeBookmarkContent, generateBookmarkEmoji } from '../services/geminiService';
import { Bookmark, Project } from '../types';

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'isFavorite'>) => void;
  initialData?: Bookmark | null;
  availableCategories: string[];
  projects: Project[];
  activeProject?: string | null;
  onAddCategory: (name: string) => void;
}

export const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({ 
    isOpen, 
    onClose, 
    onSave, 
    initialData,
    availableCategories,
    projects,
    activeProject,
    onAddCategory 
}) => {
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Other']);
  const [tags, setTags] = useState('');
  const [iconEmoji, setIconEmoji] = useState('');
  const [isEmojiLoading, setIsEmojiLoading] = useState(false);
  
  // New Project State (Multi-select + Context)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [projectContexts, setProjectContexts] = useState<Record<string, string>>({});

  // New Category State
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const isEditing = !!initialData;
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset or Populate state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
          // Editing mode
          setUrl(initialData.url);
          setTitle(initialData.title);
          setSummary(initialData.summary);
          setSelectedCategories(initialData.categories);
          setTags(initialData.tags.join(', '));
          setSelectedProjectIds(initialData.projectIds || []);
          setProjectContexts(initialData.projectContexts || {});
          setIconEmoji(initialData.iconEmoji || '');
          setNotes('');
      } else {
          // Add mode
          setUrl('');
          setNotes('');
          setTitle('');
          setSummary('');
          setSelectedCategories(['Other']);
          setTags('');
          // Default to active project if available
          setSelectedProjectIds(activeProject ? [activeProject] : []);
          setProjectContexts({});
          setIconEmoji('');
      }
      setError(null);
      setIsAnalyzing(false);
      setIsAddingCategory(false);
      setNewCategoryName('');
    }
  }, [isOpen, initialData, activeProject]);

  // Auto-Magic Analysis Logic
  useEffect(() => {
      if (isEditing) return; // Don't auto-analyze in edit mode
      
      if (analysisTimeoutRef.current) {
          clearTimeout(analysisTimeoutRef.current);
      }

      // Simple URL validation regex
      const isValidUrl = (s: string) => {
          try {
              new URL(s);
              return true;
          } catch {
              return false;
          }
      };

      if (url && isValidUrl(url)) {
          analysisTimeoutRef.current = setTimeout(() => {
              triggerAnalysis(url, notes);
          }, 800); // 800ms debounce
      }

      return () => {
          if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
      };
  }, [url, notes, isEditing]);


  if (!isOpen) return null;

  const triggerAnalysis = async (targetUrl: string, targetNotes: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeBookmarkContent(targetUrl, targetNotes);
      setTitle(result.title);
      setSummary(result.summary);
      
      // Ensure categories exist, if not, allow them
      setSelectedCategories(result.categories.length > 0 ? result.categories : ['Other']);
      setTags(result.tags.join(', '));
    } catch (err) {
      // Don't show hard error in UI for auto-trigger, just log or silent fail
      console.warn("Auto-analysis failed", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        if (prev.length === 1) return prev;
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  const toggleProject = (projectId: string) => {
      setSelectedProjectIds(prev => {
          if (prev.includes(projectId)) {
              // Remove project and its context
              const newIds = prev.filter(id => id !== projectId);
              const newContexts = { ...projectContexts };
              delete newContexts[projectId];
              setProjectContexts(newContexts);
              return newIds;
          } else {
              return [...prev, projectId];
          }
      });
  };

  const handleContextChange = (projectId: string, context: string) => {
      setProjectContexts(prev => ({
          ...prev,
          [projectId]: context
      }));
  };

  const commitNewCategory = () => {
      const name = newCategoryName.trim();
      if (!name) return;
      onAddCategory(name);
      setSelectedCategories(prev => (prev.includes(name) ? prev : [...prev, name]));
      setNewCategoryName('');
      setIsAddingCategory(false);
  };

  const handleAddNewCategoryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      commitNewCategory();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url) return;

    onSave({
      url,
      title,
      summary,
      categories: selectedCategories,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      projectIds: selectedProjectIds,
      projectContexts: projectContexts,
      iconEmoji: iconEmoji || undefined
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl rounded-2xl shadow-modal dark:shadow-2xl dark:shadow-black w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] border border-white/20 dark:border-white/10 ring-1 ring-black/5">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/[0.05] dark:border-white/[0.05]">
          <h2 className="text-lg font-semibold text-system-text dark:text-system-dark-text">
              {isEditing ? 'Edit Bookmark' : 'Add Bookmark'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1 rounded-md hover:bg-black/[0.03] dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* URL Input Section */}
          <div className="space-y-4 mb-6">
            <div className="relative">
                 <div className="flex gap-2">
                    <div className="relative flex-grow group">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${isAnalyzing ? 'text-indigo-500' : 'text-gray-400'}`}>
                            {isAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <LinkIcon size={16} />}
                        </div>
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Paste URL here..."
                            className="w-full pl-10 pr-3 py-3 bg-system-bg/50 dark:bg-black/20 border border-black/[0.05] dark:border-white/[0.05] rounded-xl focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium placeholder:font-normal dark:text-system-dark-text"
                            autoFocus={!isEditing}
                        />
                         {isAnalyzing && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <span className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wide animate-pulse">Analyzing...</span>
                            </div>
                        )}
                    </div>
                 </div>
            </div>

            {/* Context Input - Only show for new bookmarks to avoid clutter on edit */}
            {!isEditing && (
                <div>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional context for AI (e.g. 'Useful for React hooks')"
                    className="w-full px-4 py-3 bg-system-bg/50 dark:bg-black/20 border border-black/[0.05] dark:border-white/[0.05] rounded-xl focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm resize-none h-14 min-h-[56px] dark:text-system-dark-text"
                />
                </div>
            )}
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-900/20 p-3 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-black/[0.05] dark:via-white/[0.1] to-transparent mb-6" />

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
                <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 ml-1">Title</label>
                    <input
                        required
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={isAnalyzing ? "Waiting for AI..." : "Bookmark Title"}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-black/[0.1] dark:border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all dark:text-system-dark-text ${isAnalyzing ? 'animate-pulse bg-gray-50 dark:bg-white/5' : ''}`}
                    />
                </div>

                <div>
                    <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 ml-1">Summary</label>
                    <textarea
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        rows={2}
                        placeholder={isAnalyzing ? "Generating summary..." : "Brief description"}
                        className={`w-full px-4 py-2.5 bg-white dark:bg-black/20 border border-black/[0.1] dark:border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm resize-none transition-all dark:text-system-dark-text ${isAnalyzing ? 'animate-pulse bg-gray-50 dark:bg-white/5' : ''}`}
                    />
                </div>

                {isEditing && (
                    <div>
                        <label className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 ml-1">Icon</label>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-system-bg/70 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center text-xl">
                                {iconEmoji || '🔖'}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setIsEmojiLoading(true);
                                        try {
                                            const emoji = await generateBookmarkEmoji({
                                                title: title || url,
                                                summary: summary || '',
                                                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                                                url
                                            });
                                            setIconEmoji(emoji);
                                        } catch (err) {
                                            console.warn('Emoji generation failed', err);
                                        } finally {
                                            setIsEmojiLoading(false);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 text-xs font-semibold text-system-text dark:text-system-dark-text hover:bg-system-bg/70 dark:hover:bg-white/10 transition-colors"
                                    disabled={isEmojiLoading}
                                >
                                    {isEmojiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    AI Pick
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIconEmoji('')}
                                    className="px-3 py-2 rounded-xl text-xs font-semibold text-system-secondary dark:text-system-dark-secondary hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Project Selection (N:M with Context) */}
            <div>
                 <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 ml-1">
                      Projects & Context
                   </label>
                 <div className="space-y-2">
                     {projects.length === 0 && (
                         <div className="text-xs text-gray-400 italic ml-1">No projects created yet.</div>
                     )}
                     {projects.map(p => {
                         const isSelected = selectedProjectIds.includes(p.id);
                         return (
                            <div key={p.id} className={`rounded-xl border transition-all duration-200 overflow-hidden ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white dark:bg-black/20 border-gray-100 dark:border-white/5'}`}>
                                <div 
                                    onClick={() => toggleProject(p.id)}
                                    className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
                                >
                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                        {isSelected && <Check size={10} className="text-white" />}
                                    </div>
                                    <div className="flex-1 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full" style={{ background: p.color }}></span>
                                        <span className={`text-sm font-medium ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-gray-700 dark:text-gray-300'}`}>{p.name}</span>
                                    </div>
                                </div>
                                
                                {isSelected && (
                                    <div className="px-3 pb-3 pt-0 pl-10 animate-in slide-in-from-top-1 duration-200">
                                        <div className="flex items-center gap-2 text-indigo-400/70 mb-1">
                                            <FileText size={10} />
                                            <span className="text-[10px] font-medium uppercase tracking-wide">Context in this project</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={projectContexts[p.id] || ''}
                                            onChange={(e) => handleContextChange(p.id, e.target.value)}
                                            placeholder={`Why is this useful for ${p.name}? (e.g. "Legacy System", "V2 Inspiration")`}
                                            className="w-full text-xs bg-white dark:bg-black/40 border border-indigo-100 dark:border-indigo-500/20 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-system-text dark:text-system-dark-text placeholder:text-gray-400 dark:placeholder:text-gray-600"
                                        />
                                    </div>
                                )}
                            </div>
                         );
                     })}
                 </div>
            </div>

            <div>
               <div className="flex items-center justify-between mb-2">
                   <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide ml-1">
                      Categories
                   </label>
                   {!isAddingCategory && (
                       <button 
                         type="button" 
                         onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddingCategory(true); }}
                         className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
                       >
                           <Plus size={10} /> New Category
                       </button>
                   )}
               </div>

               {isAddingCategory && (
                   <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-left-2 duration-200">
                       <input 
                           type="text"
                           value={newCategoryName}
                           onChange={(e) => setNewCategoryName(e.target.value)}
                           onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   commitNewCategory();
                               }
                           }}
                           className="flex-1 px-3 py-1.5 text-xs border border-indigo-200 dark:border-indigo-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-black/20 text-system-text dark:text-system-dark-text"
                           placeholder="Category name..."
                           autoFocus
                       />
                       <button onClick={handleAddNewCategoryClick} type="button" className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium">Add</button>
                       <button onClick={() => setIsAddingCategory(false)} type="button" className="px-2 py-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
                   </div>
               )}

               <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar p-1">
                 {availableCategories.map(cat => {
                   const isSelected = selectedCategories.includes(cat);
                   return (
                     <button
                       key={cat}
                       type="button"
                       onClick={() => toggleCategory(cat)}
                       className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                         isSelected 
                           ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-md' 
                           : 'bg-white dark:bg-black/20 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/30 hover:bg-gray-50 dark:hover:bg-white/5'
                       }`}
                     >
                       {isSelected && <Check size={12} />}
                       {cat}
                     </button>
                   );
                 })}
               </div>
            </div>

            <div>
                <label className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 ml-1">
                    Tags
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-serif italic text-sm">#</span>
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="design, tool, prod, dev..."
                        className="w-full pl-7 pr-3 py-2.5 bg-white dark:bg-black/20 border border-black/[0.1] dark:border-white/[0.1] rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all dark:text-system-dark-text"
                    />
                </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-black/[0.05] dark:hover:bg-white/10 rounded-lg font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title || !url}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-all text-sm shadow-lg shadow-indigo-500/20 disabled:shadow-none"
              >
                {isEditing ? 'Save Changes' : 'Add Bookmark'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
