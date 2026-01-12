import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Bookmark, Project, ViewMode } from './types';
import { BookmarkCard } from './components/BookmarkCard';
import { BookmarkListRow } from './components/BookmarkListRow';
import { AddBookmarkModal } from './components/AddBookmarkModal';
import { Sidebar } from './components/Sidebar';
import { LibraryHero } from './components/LibraryHero';
import { SettingsModal } from './components/SettingsModal';
import { ProjectDashboard } from './components/ProjectDashboard';
import { Search, LayoutList, LayoutGrid, Menu, Plus, Tag, Moon, Sun, Star, Sparkles, X, Loader2, Monitor } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { askLibrary } from './services/geminiService';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import { fetchCloudState, upsertCloudState, type CloudStateV1 } from './services/cloudStateService';

declare global {
  interface Window {
    webkit?: {
      messageHandlers?: {
        neuromark?: {
          postMessage: (payload: any) => void;
        };
      };
    };
  }
}

// Mock Data
const INITIAL_PROJECTS: Project[] = [
    { id: 'p1', name: 'Alpha SaaS', color: '#FF3B30', description: 'Resources and moodboards for the Q3 SaaS platform redesign.' },     
    { id: 'p2', name: 'Internal Tools', color: '#007AFF', description: 'Documentation and libraries for our internal dashboarding system.' }, 
    { id: 'p3', name: 'Personal Blog', color: '#AF52DE', description: 'Ideas, inspirations and tech stack for my personal portfolio.' }   
];

const INITIAL_BOOKMARKS: Bookmark[] = [
  {
    id: '1',
    url: 'https://ui.shadcn.com/',
    title: 'Shadcn UI',
    summary: 'Beautifully designed components built with Radix UI and Tailwind CSS.',
    categories: ['Development', 'Design'],
    tags: ['React', 'UI/UX', 'Tailwind', 'prod'],
    projectIds: ['p1'],
    projectContexts: { 'p1': 'Component Library Source' },
    createdAt: Date.now() - 100000,
    isFavorite: true,
    isPinned: true,
  },
  {
    id: '2',
    url: 'https://vercel.com',
    title: 'Vercel',
    summary: 'Develop. Preview. Ship. The best frontend developer experience on the web.',
    categories: ['Development', 'Tools'],
    tags: ['Next.js', 'Deployment', 'Cloud', 'dev'],
    projectIds: ['p1', 'p3'],
    projectContexts: { 'p1': 'Hosting Target', 'p3': 'Reference for Analytics' },
    createdAt: Date.now() - 200000,
    isFavorite: true,
    isPinned: false,
  },
  {
    id: '3',
    url: 'https://figma.com',
    title: 'Figma',
    summary: 'The collaborative interface design tool.',
    categories: ['Design', 'Tools'],
    tags: ['UI/UX', 'Design', 'Free'],
    projectIds: ['p3'],
    projectContexts: {},
    createdAt: Date.now() - 400000,
    isFavorite: true,
    isPinned: false,
  }
];

const DEFAULT_CATEGORIES = ['Design', 'Development', 'Marketing', 'Business', 'News', 'Tools', 'Inspiration', 'Research', 'Other'];

// Helper for migration (handles old single projectId structure)
const migrateData = (data: any[]): Bookmark[] => {
    return data.map(item => ({
        ...item,
        categories: Array.isArray(item.categories) ? item.categories : [item.category || 'Other'],
        projectIds: Array.isArray(item.projectIds) ? item.projectIds : (item.projectId ? [item.projectId] : []),
        projectContexts: item.projectContexts || {},
        isPinned: item.isPinned || false
    }));
};

const mergeById = <T extends { id: string }>(primary: T[], secondary: T[]): T[] => {
    const map = new Map<string, T>();
    primary.forEach(item => map.set(item.id, item));
    secondary.forEach(item => {
        if (!map.has(item.id)) map.set(item.id, item);
    });
    return Array.from(map.values());
};

const mergeUnique = (primary: string[], secondary: string[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];
    primary.forEach(item => {
        if (!seen.has(item)) {
            seen.add(item);
            result.push(item);
        }
    });
    secondary.forEach(item => {
        if (!seen.has(item)) {
            seen.add(item);
            result.push(item);
        }
    });
    return result;
};

const App: React.FC = () => {
  // --- State ---
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
        const saved = localStorage.getItem('neuromark-data');
        return saved ? migrateData(JSON.parse(saved)) : INITIAL_BOOKMARKS;
    } catch (e) {
        return INITIAL_BOOKMARKS;
    }
  });

  const [categories, setCategories] = useState<string[]>(() => {
      try {
          const saved = localStorage.getItem('neuromark-categories');
          return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
      } catch {
          return DEFAULT_CATEGORIES;
      }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
      try {
          const saved = localStorage.getItem('neuromark-projects');
          return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
      } catch {
          return INITIAL_PROJECTS;
      }
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null); 
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // AI Search State
  const [isAiMode, setIsAiMode] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);

  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('neuromark-theme');
          if (saved === 'dark' || saved === 'light' || saved === 'auto') return saved;
          return 'auto';
      }
      return 'light';
  });

  // Cloud Sync (Supabase)
  const [cloudPanelOpen, setCloudPanelOpen] = useState(false);
  const [cloudEmail, setCloudEmail] = useState('');
  const [cloudSession, setCloudSession] = useState<any | null>(null);
  const [cloudStatus, setCloudStatus] = useState<
    'disabled' | 'signedOut' | 'loading' | 'ready' | 'saving' | 'error'
  >(isSupabaseConfigured ? 'signedOut' : 'disabled');
  const [cloudError, setCloudError] = useState<string | null>(null);

  const hasLoadedCloud = useRef(false);
  const skipNextCloudSave = useRef(false);
  const cloudSaveTimer = useRef<number | null>(null);
  const bookmarksRef = useRef(bookmarks);
  const categoriesRef = useRef(categories);
  const projectsRef = useRef(projects);
  const themeRef = useRef(theme);

  useEffect(() => {
      bookmarksRef.current = bookmarks;
  }, [bookmarks]);

  useEffect(() => {
      categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
      projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
      themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) {
          setCloudStatus('error');
          setCloudError(error.message);
          return;
        }
        setCloudSession(data.session);
        setCloudStatus(data.session ? 'loading' : 'signedOut');
      })
      .catch((e) => {
        if (!isMounted) return;
        setCloudStatus('error');
        setCloudError(e instanceof Error ? e.message : String(e));
      });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setCloudSession(session);
      hasLoadedCloud.current = false;
      skipNextCloudSave.current = false;
      setCloudStatus(session ? 'loading' : 'signedOut');
      setCloudError(null);
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;
    const userId = cloudSession?.user?.id as string | undefined;
    if (!userId) return;
    if (hasLoadedCloud.current) return;

    hasLoadedCloud.current = true;
    setCloudStatus('loading');

    (async () => {
      const remote = await fetchCloudState(userId);

      if (remote) {
        const localBookmarks = bookmarksRef.current;
        const localCategories = categoriesRef.current;
        const localProjects = projectsRef.current;
        const localTheme = themeRef.current;
        const remoteBookmarks = migrateData(remote.bookmarks || []);
        const remoteCategories = Array.isArray(remote.categories) ? remote.categories : [];
        const remoteProjects = Array.isArray(remote.projects) ? remote.projects : [];
        const mergedBookmarks = mergeById(remoteBookmarks, localBookmarks);
        const mergedCategories = mergeUnique(remoteCategories, localCategories);
        const mergedProjects = mergeById(remoteProjects, localProjects);

        setBookmarks(mergedBookmarks);
        setCategories(mergedCategories.length ? mergedCategories : DEFAULT_CATEGORIES);
        setProjects(mergedProjects);
        if (remote.theme === 'dark' || remote.theme === 'light' || remote.theme === 'auto') {
          setTheme(remote.theme);
        } else {
          setTheme(localTheme);
        }
      } else {
        const seed: CloudStateV1 = {
          version: 1,
          bookmarks: bookmarksRef.current,
          categories: categoriesRef.current,
          projects: projectsRef.current,
          theme: themeRef.current,
        };
        await upsertCloudState(userId, seed);
      }

      skipNextCloudSave.current = true;
      setCloudStatus('ready');
      setCloudError(null);
    })().catch((e) => {
      setCloudStatus('error');
      setCloudError(e instanceof Error ? e.message : String(e));
    });
  }, [cloudSession?.user?.id]);

  // --- Persistence & Effects ---
  const safeSetItem = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures in restricted environments (e.g. WKWebView file://)
    }
  };

  useEffect(() => {
    safeSetItem('neuromark-data', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    safeSetItem('neuromark-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    safeSetItem('neuromark-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
      const root = window.document.documentElement;
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const applyTheme = (nextTheme: 'light' | 'dark') => {
        root.classList.remove('light', 'dark');
        root.classList.add(nextTheme);
      };

      const resolvedTheme = theme === 'auto' ? (media.matches ? 'dark' : 'light') : theme;
      applyTheme(resolvedTheme);
      safeSetItem('neuromark-theme', theme);

      const handleChange = (event: MediaQueryListEvent) => {
        if (theme !== 'auto') return;
        applyTheme(event.matches ? 'dark' : 'light');
      };

      if (theme === 'auto') {
        if (media.addEventListener) {
          media.addEventListener('change', handleChange);
        } else {
          media.addListener(handleChange);
        }
      }

      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', handleChange);
        } else {
          media.removeListener(handleChange);
        }
      };
  }, [theme]);

  useEffect(() => {
    if (!supabase) return;
    const userId = cloudSession?.user?.id as string | undefined;
    if (!userId) return;
    if (!hasLoadedCloud.current) return;

    if (skipNextCloudSave.current) {
      skipNextCloudSave.current = false;
      return;
    }

    if (cloudSaveTimer.current) window.clearTimeout(cloudSaveTimer.current);

    cloudSaveTimer.current = window.setTimeout(async () => {
      try {
        setCloudStatus((prev) => (prev === 'ready' ? 'saving' : prev));
        const nextState: CloudStateV1 = {
          version: 1,
          bookmarks,
          categories,
          projects,
          theme,
        };
        await upsertCloudState(userId, nextState);
        setCloudStatus('ready');
        setCloudError(null);
      } catch (e) {
        setCloudStatus('error');
        setCloudError(e instanceof Error ? e.message : String(e));
      }
    }, 800);

    return () => {
      if (cloudSaveTimer.current) window.clearTimeout(cloudSaveTimer.current);
    };
  }, [bookmarks, categories, projects, theme, cloudSession?.user?.id]);

  const postToNative = (payload: Record<string, any>) => {
    try {
      window.webkit?.messageHandlers?.neuromark?.postMessage(payload);
    } catch {
      // no-op when running in browser
    }
  };

  useEffect(() => {
    const handleNativeMessage = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (!detail || typeof detail !== 'object') return;
      const type = detail.type;

      if (type === 'setSearchQuery') {
        setSearchQuery(String(detail.value ?? ''));
        return;
      }

      if (type === 'setViewMode') {
        const next = detail.value === 'list' ? 'list' : 'grid';
        setViewMode(next);
        return;
      }

      if (type === 'setFilter') {
        const value = detail.value || {};
        if (typeof value.favoritesOnly === 'boolean') {
          setShowFavoritesOnly(value.favoritesOnly);
        }
        if (typeof value.category === 'string') {
          setActiveCategory(value.category);
          setActiveProject(null);
          setActiveTag(null);
        }
        if (typeof value.projectId === 'string') {
          setActiveProject(value.projectId);
          setActiveCategory('All');
          setActiveTag(null);
          setShowFavoritesOnly(false);
        }
        if (typeof value.tag === 'string') {
          setActiveTag(value.tag);
          setActiveCategory('All');
          setActiveProject(null);
          setShowFavoritesOnly(false);
        }
      }

      if (type === 'setTheme') {
        const next = detail.value;
        if (next === 'light' || next === 'dark' || next === 'auto') {
          setTheme(next);
        }
      }

      if (type === 'openAddBookmark') {
        setEditingBookmark(null);
        setIsModalOpen(true);
      }
    };

    window.addEventListener('nativeMessage', handleNativeMessage as EventListener);
    return () => {
      window.removeEventListener('nativeMessage', handleNativeMessage as EventListener);
    };
  }, []);

  // --- Actions ---
  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const cloudDotColor =
    cloudStatus === 'ready'
      ? 'bg-emerald-500'
      : cloudStatus === 'saving' || cloudStatus === 'loading'
        ? 'bg-amber-500'
        : cloudStatus === 'error'
          ? 'bg-red-500'
          : 'bg-gray-300 dark:bg-gray-600';

  const handleCloudSignIn = async (email: string) => {
    if (!supabase) return;
    setCloudError(null);
    setCloudStatus('loading');
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    setCloudStatus('signedOut');
  };

  const handleCloudSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  const handleCloudSyncNow = async () => {
    if (!supabase) return;
    const userId = cloudSession?.user?.id as string | undefined;
    if (!userId) return;
    try {
      setCloudStatus('saving');
      const nextState: CloudStateV1 = {
        version: 1,
        bookmarks,
        categories,
        projects,
        theme,
      };
      await upsertCloudState(userId, nextState);
      setCloudStatus('ready');
      setCloudError(null);
    } catch (e) {
      setCloudStatus('error');
      setCloudError(e instanceof Error ? e.message : String(e));
    }
  };

  const handleSaveBookmark = (data: Omit<Bookmark, 'id' | 'createdAt' | 'isFavorite'>) => {
    if (editingBookmark) {
        // Update existing
        setBookmarks(prev => prev.map(b => 
            b.id === editingBookmark.id 
            ? { ...b, ...data } 
            : b
        ));
    } else {
        // Add new
        const newBookmark: Bookmark = {
          ...data,
          id: uuidv4(),
          createdAt: Date.now(),
          isFavorite: false,
          isPinned: false,
          // If a project is active, add it to projectIds if not already there
          projectIds: data.projectIds.length > 0 ? data.projectIds : (activeProject ? [activeProject] : [])
        };
        setBookmarks(prev => [newBookmark, ...prev]);
    }
    
    // Process new categories
    data.categories.forEach(cat => {
        if (!categories.includes(cat)) {
            setCategories(prev => [...prev, cat].sort());
        }
    });

    handleCloseModal();
  };

  const handleEditBookmark = (bookmark: Bookmark) => {
      setEditingBookmark(bookmark);
      setIsModalOpen(true);
  };

  // Simplified toggle for context menu (add/remove from single project)
  const handleToggleProject = (bookmarkId: string, projectId: string) => {
      setBookmarks(prev => prev.map(b => {
          if (b.id !== bookmarkId) return b;

          const isPresent = b.projectIds.includes(projectId);
          let newIds = b.projectIds;
          let newContexts = { ...b.projectContexts };

          if (isPresent) {
              newIds = newIds.filter(id => id !== projectId);
              delete newContexts[projectId];
          } else {
              newIds = [...newIds, projectId];
          }

          return { ...b, projectIds: newIds, projectContexts: newContexts };
      }));
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingBookmark(null);
  };

  const deleteBookmark = (id: string) => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      setBookmarks(prev => prev.filter(b => b.id !== id));
    }
  };

  const toggleFavorite = (id: string) => {
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, isFavorite: !b.isFavorite } : b
    ));
  };

  const togglePin = (id: string) => {
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, isPinned: !b.isPinned } : b
    ));
  };

  // Category Management
  const handleAddCategory = (name: string) => {
      if (name && !categories.includes(name)) {
          setCategories(prev => [...prev, name].sort());
      }
  };

  const handleDeleteCategory = (name: string) => {
      if (confirm(`Delete category "${name}"? Bookmarks will remain but be untagged from this category.`)) {
          setCategories(prev => prev.filter(c => c !== name));
          setBookmarks(prev => prev.map(b => ({
              ...b,
              categories: b.categories.filter(c => c !== name)
          })));
          if (activeCategory === name) setActiveCategory('All');
      }
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
      if (!newName || categories.includes(newName)) return;
      
      setCategories(prev => prev.map(c => c === oldName ? newName : c).sort());
      
      // Update all bookmarks
      setBookmarks(prev => prev.map(b => ({
          ...b,
          categories: b.categories.map(c => c === oldName ? newName : c)
      })));

      if (activeCategory === oldName) setActiveCategory(newName);
  };

  // Project Management
  const handleAddProject = (name: string, color: string) => {
      const newProject: Project = { id: uuidv4(), name, color, description: '' };
      setProjects(prev => [...prev, newProject]);
  };

  const handleUpdateProject = (id: string, updates: Partial<Project>) => {
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleDeleteProject = (id: string) => {
      if(confirm("Delete this project? Bookmarks will remain but will be unlinked.")) {
          setProjects(prev => prev.filter(p => p.id !== id));
          setBookmarks(prev => prev.map(b => ({
               ...b, 
               projectIds: b.projectIds.filter(pid => pid !== id),
               // Safety check for projectContexts in case of legacy data
               projectContexts: Object.fromEntries(
                   Object.entries(b.projectContexts || {}).filter(([pid]) => pid !== id)
               )
          })));
          if (activeProject === id) setActiveProject(null);
      }
  }

  const handleProjectAnalysis = (project: Project) => {
      setIsAiMode(true);
      setSearchQuery(`Summarize key insights from the ${project.name} project`);
      // Note: We don't auto-submit here to let user confirm, but the UI state is ready
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategory = (cat: string | 'All') => {
      setActiveCategory(cat);
      setActiveProject(null); // Mutually exclusive
      setActiveTag(null);
      setIsMobileMenuOpen(false);
  };

  const handleSelectProject = (projectId: string) => {
      setActiveProject(projectId);
      setActiveCategory('All'); // Reset category when entering project view
      setActiveTag(null);
      setIsMobileMenuOpen(false);
  };

  const handleTagClick = (tag: string) => {
      if (activeTag === tag) {
          setActiveTag(null); 
      } else {
          setActiveTag(tag);
          setActiveCategory('All'); 
          setActiveProject(null);
          setShowFavoritesOnly(false);
      }
  };

  // AI Search Handler
  const handleSearchSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isAiMode && searchQuery.trim()) {
          setIsAiSearching(true);
          setAiAnswer(null);
          try {
              // Contextually filter bookmarks if inside a project for better AI results
              const contextBookmarks = activeProject 
                ? bookmarks.filter(b => b.projectIds.includes(activeProject))
                : bookmarks;
                
              const answer = await askLibrary(searchQuery, contextBookmarks);
              setAiAnswer(answer);
          } catch (err) {
              setAiAnswer("Sorry, I couldn't reach the intelligence engine.");
          } finally {
              setIsAiSearching(false);
          }
      }
  };

  // --- Derived State ---
  const categoriesStats = useMemo(() => {
    const stats: Record<string, number> = {};
    categories.forEach(cat => stats[cat] = 0);
    bookmarks.forEach(b => {
        b.categories.forEach(cat => {
             if (categories.includes(cat)) {
                stats[cat] = (stats[cat] || 0) + 1;
             }
        });
    });
    return Object.entries(stats)
        .map(([name, count]) => ({ name, count }))
        .filter(item => item.count > 0)
        .sort((a, b) => b.count - a.count);
  }, [bookmarks, categories]);

  const projectsStats = useMemo(() => {
      const stats: Record<string, number> = {};
      projects.forEach(p => stats[p.id] = 0);
      bookmarks.forEach(b => {
          b.projectIds.forEach(pid => {
              if (stats[pid] !== undefined) {
                  stats[pid]++;
              }
          });
      });
      return projects.map(p => ({ ...p, count: stats[p.id] || 0 }));
  }, [bookmarks, projects]);

  const popularTags = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    bookmarks.forEach(b => {
        b.tags.forEach(t => {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
        });
    });
    return Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
  }, [bookmarks]);

  const statsSummary = useMemo(() => {
    const total = bookmarks.length;
    const favorites = bookmarks.filter(b => b.isFavorite).length;
    return {
      total,
      favorites,
      categories: categories.length,
      projects: projects.length,
    };
  }, [bookmarks, categories.length, projects.length]);

  const activeProjectData = projects.find(p => p.id === activeProject);

  useEffect(() => {
    let title = 'All Documents';
    if (showFavoritesOnly) {
      title = 'Favorites';
    } else if (activeTag) {
      title = `Tag: ${activeTag}`;
    } else if (activeProjectData) {
      title = activeProjectData.name;
    } else if (activeCategory && activeCategory !== 'All') {
      title = activeCategory;
    }

    postToNative({
      type: 'stateChanged',
      title,
      counts: {
        bookmarks: bookmarks.length,
        favorites: bookmarks.filter(b => b.isFavorite).length,
        projects: projects.length,
        categories: categories.length,
      },
      projects: projectsStats.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        count: p.count,
      })),
    });
  }, [
    activeCategory,
    activeProjectData,
    activeTag,
    showFavoritesOnly,
    bookmarks,
    categories.length,
    projects.length,
    projectsStats,
  ]);

  const filteredBookmarks = useMemo(() => {
    const result = bookmarks.filter(b => {
      const matchesSearch = 
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = activeCategory === 'All' || b.categories.includes(activeCategory);
      const matchesProject = activeProject ? b.projectIds.includes(activeProject) : true;
      const matchesFavorite = !showFavoritesOnly || b.isFavorite;
      const matchesTag = activeTag ? b.tags.includes(activeTag) : true;

      return matchesSearch && matchesCategory && matchesProject && matchesFavorite && matchesTag;
    });

    // Sorting: Pinned first, then Newest first
    return result.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.createdAt - a.createdAt;
    });
  }, [bookmarks, searchQuery, activeCategory, activeProject, showFavoritesOnly, activeTag]);
  
  // Calculate project specific stats for Dashboard
  const projectSpecificStats = useMemo(() => {
      if (!activeProjectData) return null;
      // Use projectIds array check
      const projectBookmarks = bookmarks.filter(b => b.projectIds.includes(activeProjectData.id));
      const favs = projectBookmarks.filter(b => b.isFavorite).length;
      
      const tagCounts: Record<string, number> = {};
      projectBookmarks.forEach(b => b.tags.forEach(t => tagCounts[t] = (tagCounts[t] || 0) + 1));
      const topTags = Object.entries(tagCounts)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(t => t[0]);

      return {
          total: projectBookmarks.length,
          favorites: favs,
          topTags
      };
  }, [activeProjectData, bookmarks]);

  // --- Render ---
  const isNative = typeof window !== 'undefined' && Boolean(window.webkit?.messageHandlers?.neuromark);

  return (
    <div className="flex h-screen bg-system-sidebar dark:bg-system-dark-sidebar font-sans text-system-text dark:text-system-dark-text overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-200 transition-colors duration-300">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          popularTags={popularTags}
          activeCategory={activeCategory}
          activeProject={activeProject}
          activeTag={activeTag}
          onSelectCategory={handleSelectCategory}
          onSelectTag={handleTagClick}
          showFavoritesOnly={showFavoritesOnly}
          onToggleFavoritesOnly={() => {setShowFavoritesOnly(!showFavoritesOnly); setActiveCategory('All'); setActiveProject(null); setActiveTag(null); setIsMobileMenuOpen(false);}}
          userEmail={cloudSession?.user?.email || ''}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Main Content - Improved with cleaner separation */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative bg-system-bg dark:bg-system-dark-bg md:rounded-l-3xl shadow-2xl md:shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)] overflow-hidden transition-colors duration-300 border-l border-white/50 dark:border-white/5">
        
        {!isNative && (
          <header 
            className="flex-shrink-0 z-30 h-16 px-8 flex items-center justify-between gap-4 sticky top-0 bg-system-bg dark:bg-system-dark-bg backdrop-blur-xl border-b border-black/[0.04] dark:border-white/[0.05] transition-all duration-500 ease-out"
            style={activeProjectData ? { 
                backgroundColor: `${activeProjectData.color}15`, // Hex Alpha ~10%
                borderColor: `${activeProjectData.color}30` 
            } : undefined}
          >
            {/* Header Dark Mode Overlay */}
            <div className={`absolute inset-0 -z-10 ${!activeProjectData ? 'dark:bg-system-dark-bg/80' : ''}`}></div>

            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden text-system-secondary dark:text-system-dark-secondary hover:text-system-text dark:hover:text-system-dark-text p-2 -ml-2 rounded-lg transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center gap-2 text-system-text dark:text-system-dark-text">
                   <span className="text-sm font-semibold tracking-tight">Library</span>
                   <span className="text-gray-300 dark:text-gray-700">/</span>
                   <span className="text-sm font-medium text-system-secondary dark:text-system-dark-secondary flex items-center gap-2">
                        {showFavoritesOnly ? (
                            <span className="flex items-center gap-2 text-amber-500"><Star size={14} fill="currentColor"/> Favorites</span>
                        ) : activeTag ? (
                            <span className="flex items-center gap-1"><Tag size={12}/> {activeTag}</span>
                        ) : activeProjectData ? (
                            <span className="flex items-center gap-2 font-semibold" style={{ color: activeProjectData.color }}>
                                <span className="inline-block w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-white/10 shadow-sm" style={{ background: activeProjectData.color }}></span>
                                {activeProjectData.name}
                            </span>
                        ) : (
                            activeCategory
                        )}
                   </span>
                </div>
            </div>

            <div className="flex-1 max-w-lg px-8 hidden md:block">
                 <form onSubmit={handleSearchSubmit} className="relative group">
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 p-2.5 transition-colors ${isAiMode ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                        {isAiMode ? <Sparkles size={16} /> : <Search size={16} />}
                    </div>
                    <input
                        type="text"
                        placeholder={isAiMode ? "Ask your library..." : "Search..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 bg-gray-100/50 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-0 outline-none transition-all dark:text-system-dark-text placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:bg-white dark:focus:bg-white/10 focus:shadow-sm ${
                            isAiMode 
                            ? 'ring-2 ring-indigo-500/20' 
                            : ''
                        }`}
                    />
                    <button 
                        type="button"
                        onClick={() => { setIsAiMode(!isAiMode); setAiAnswer(null); }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-all ${
                            isAiMode 
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' 
                            : 'text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    >
                        <Sparkles size={14} />
                    </button>
                 </form>
            </div>

	            <div className="flex items-center gap-3">
	                 {isSupabaseConfigured && (
	                    <div className="relative">
	                      <button
	                        type="button"
	                        onClick={() => setCloudPanelOpen((v) => !v)}
	                        className="flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold text-system-secondary dark:text-system-dark-secondary hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
	                      >
	                        <span className={`w-2 h-2 rounded-full ${cloudDotColor}`} />
	                        <span className="hidden md:inline">Cloud</span>
	                      </button>

	                      {cloudPanelOpen && (
	                        <div className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-white dark:bg-system-dark-panel border border-black/[0.06] dark:border-white/[0.08] shadow-xl">
	                          <div className="flex items-start justify-between gap-3">
	                            <div>
	                              <div className="text-xs font-bold text-gray-900 dark:text-gray-100">Cloud Sync</div>
	                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
	                                {cloudStatus === 'disabled'
	                                  ? 'Supabase not configured.'
	                                  : cloudSession?.user?.email
	                                    ? `Signed in as ${cloudSession.user.email}`
	                                    : 'Not signed in.'}
	                              </div>
	                            </div>
	                            <button
	                              type="button"
	                              onClick={() => setCloudPanelOpen(false)}
	                              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
	                            >
	                              <X size={16} />
	                            </button>
	                          </div>

	                          {cloudError && (
	                            <div className="mt-3 text-[11px] text-red-600 dark:text-red-400 whitespace-pre-wrap">
	                              {cloudError}
	                            </div>
	                          )}

	                          {!cloudSession?.user?.id ? (
	                            <form
	                              className="mt-4 flex items-center gap-2"
	                              onSubmit={(e) => {
	                                e.preventDefault();
	                                if (!cloudEmail.trim()) return;
	                                handleCloudSignIn(cloudEmail.trim()).catch((err) => {
	                                  setCloudStatus('error');
	                                  setCloudError(err instanceof Error ? err.message : String(err));
	                                });
	                              }}
	                            >
	                              <input
	                                type="email"
	                                placeholder="you@example.com"
	                                value={cloudEmail}
	                                onChange={(e) => setCloudEmail(e.target.value)}
	                                className="flex-1 px-3 py-2 rounded-xl bg-gray-100/70 dark:bg-white/5 text-xs outline-none placeholder:text-gray-400 dark:placeholder:text-gray-600"
	                              />
	                              <button
	                                type="submit"
	                                className="px-3 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold disabled:opacity-50"
	                                disabled={cloudStatus === 'loading'}
	                              >
	                                Link
	                              </button>
	                            </form>
	                          ) : (
	                            <div className="mt-4 flex items-center gap-2">
	                              <button
	                                type="button"
	                                onClick={() => handleCloudSyncNow()}
	                                className="flex-1 px-3 py-2 rounded-xl bg-black dark:bg-white text-white dark:text-black text-xs font-bold disabled:opacity-50"
	                                disabled={cloudStatus === 'loading' || cloudStatus === 'saving'}
	                              >
	                                {cloudStatus === 'saving' ? 'Saving…' : 'Sync now'}
	                              </button>
	                              <button
	                                type="button"
	                                onClick={() => handleCloudSignOut().catch(() => {})}
	                                className="px-3 py-2 rounded-xl bg-gray-100/70 dark:bg-white/5 text-xs font-bold text-gray-700 dark:text-gray-200"
	                              >
	                                Sign out
	                              </button>
	                            </div>
	                          )}

	                          <div className="mt-3 text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
	                            Stores your library in Supabase and keeps a local cache.
	                          </div>
	                        </div>
	                      )}
	                    </div>
	                 )}
                 <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-system-secondary dark:text-system-dark-secondary hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
                >
                     {theme === 'auto' ? <Monitor size={18} /> : theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                 </button>

                 <div className="hidden sm:flex items-center bg-gray-100/80 dark:bg-white/5 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <LayoutGrid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow-sm text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                    >
                        <LayoutList size={16} />
                    </button>
                 </div>

                 <button 
                    onClick={() => { setEditingBookmark(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black rounded-full text-xs font-bold transition-all shadow-lg shadow-black/10 hover:shadow-xl hover:scale-105 active:scale-95"
                 >
                    <Plus size={16} />
                    <span>Add New</span>
                 </button>
            </div>
          </header>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto pb-20">
                
                {/* Condition: Show Project Dashboard IF in project, else Global Stats */}
                {activeProjectData && projectSpecificStats ? (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <ProjectDashboard 
                            project={activeProjectData} 
                            stats={projectSpecificStats}
                            onUpdate={handleUpdateProject}
                            onQuickAdd={() => setIsModalOpen(true)}
                            onAnalysis={() => handleProjectAnalysis(activeProjectData)}
                        />
                    </div>
                ) : (
                    /* Replaced StatsOverview with LibraryHero for Discovery */
                    <LibraryHero 
                        bookmarks={bookmarks} 
                        categories={categoriesStats} 
                        activeCategory={activeCategory}
                        onSelectCategory={handleSelectCategory}
                        showFavoritesOnly={showFavoritesOnly}
                        onToggleFavoritesOnly={() => setShowFavoritesOnly(false)}
                        projects={projectsStats}
                        activeProject={activeProject}
                        onSelectProject={handleSelectProject}
                        onAddProject={handleAddProject}
                        onUpdateProject={(id, name, color) => handleUpdateProject(id, { name, color })}
                        onDeleteProject={handleDeleteProject}
                    />
                )}

                {/* AI Answer Card */}
                {(isAiSearching || aiAnswer) && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                         <div className="bg-white dark:bg-system-dark-panel rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30 shadow-lg shadow-indigo-500/5 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                             <div className="flex gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                                     {isAiSearching ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
                                 </div>
                                 <div className="flex-1">
                                     <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                         {isAiSearching ? 'Analyzing Library...' : 'AI Insights'}
                                     </h3>
                                     <div className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                         {isAiSearching ? (
                                             <div className="flex items-center gap-1 opacity-50">
                                                 Reading your bookmarks
                                                 <span className="animate-pulse">.</span>
                                                 <span className="animate-pulse delay-75">.</span>
                                                 <span className="animate-pulse delay-150">.</span>
                                             </div>
                                         ) : aiAnswer}
                                     </div>
                                 </div>
                                 <button onClick={() => setAiAnswer(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                     <X size={16} />
                                 </button>
                             </div>
                         </div>
                    </div>
                )}

                <div className="mb-6 flex items-baseline justify-between">
                    <h2 className="text-xl font-bold text-system-text dark:text-system-dark-text tracking-tight flex items-center gap-2">
                         {showFavoritesOnly ? 'Favorites' : activeTag ? `Tag: ${activeTag}` : activeProjectData ? (
                             <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ background: activeProjectData.color }}></span>
                                {activeProjectData.name} Space
                             </span>
                         ) : activeCategory === 'All' ? 'Library' : activeCategory}
                        <span className="text-xs font-semibold text-gray-400 dark:text-gray-600 ml-2">{filteredBookmarks.length}</span>
                    </h2>
                    {activeTag && (
                        <button onClick={() => setActiveTag(null)} className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                            Clear Filter
                        </button>
                    )}
                </div>

                {filteredBookmarks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-system-secondary dark:text-system-dark-secondary">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Search size={28} className="opacity-20" />
                        </div>
                        <p className="text-sm font-medium opacity-60">No bookmarks found</p>
                         {activeTag && <p className="text-xs mt-1 opacity-40">Try clearing the tag filter</p>}
                    </div>
                ) : (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredBookmarks.map(bookmark => (
                                <BookmarkCard 
                                    key={bookmark.id} 
                                    bookmark={bookmark} 
                                    projects={projects}
                                    activeProjectId={activeProject}
                                    onDelete={deleteBookmark} 
                                    onToggleFavorite={toggleFavorite}
                                    onTogglePin={togglePin}
                                    onSelectTag={handleTagClick}
                                    onEdit={handleEditBookmark}
                                    onToggleProject={handleToggleProject}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-system-dark-panel rounded-2xl shadow-sm border border-black/[0.04] dark:border-white/[0.05] overflow-hidden">
                            <div className="flex items-center gap-3 px-5 py-3 bg-gray-50/50 dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.05] text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                <div className="w-5"></div>
                                <div className="flex-1">Resource</div>
                                <div className="hidden md:flex justify-end w-[180px] mr-2">Context</div>
                                <div className="hidden lg:flex w-24 justify-end">Domain</div>
                                <div className="hidden xl:flex w-24 justify-end">Linked</div>
                                <div className="w-20"></div>
                            </div>
                            {filteredBookmarks.map(bookmark => (
                                <BookmarkListRow 
                                    key={bookmark.id} 
                                    bookmark={bookmark} 
                                    projects={projects}
                                    activeProjectId={activeProject}
                                    onDelete={deleteBookmark} 
                                    onToggleFavorite={toggleFavorite}
                                    onTogglePin={togglePin}
                                    onSelectTag={handleTagClick}
                                    onEdit={handleEditBookmark}
                                    onToggleProject={handleToggleProject}
                                />
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
      </main>

      <AddBookmarkModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSave={handleSaveBookmark}
        initialData={editingBookmark}
        availableCategories={categories}
        projects={projects}
        onAddCategory={handleAddCategory}
        activeProject={activeProject}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        email={cloudSession?.user?.email || ''}
        theme={theme}
        onThemeChange={setTheme}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        stats={statsSummary}
        onSignOut={() => handleCloudSignOut().catch(() => {})}
        canSignOut={Boolean(cloudSession?.user?.id)}
      />
    </div>
  );
};

export default App;
