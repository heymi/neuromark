import React from 'react';
import { LayoutGrid, LayoutList, Monitor, Moon, Sun, LogOut, X } from 'lucide-react';
import { ViewMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  theme: 'light' | 'dark' | 'auto';
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  stats: {
    total: number;
    favorites: number;
    categories: number;
    projects: number;
  };
  onSignOut: () => void;
  canSignOut: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  email,
  theme,
  onThemeChange,
  viewMode,
  onViewModeChange,
  stats,
  onSignOut,
  canSignOut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white/90 dark:bg-[#1E1E1E]/90 backdrop-blur-xl rounded-2xl shadow-modal border border-white/20 dark:border-white/10 ring-1 ring-black/5 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-system-secondary dark:text-system-dark-secondary">
              Personal Settings
            </div>
            <div className="text-lg font-semibold text-system-text dark:text-system-dark-text">
              Account & Preferences
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-system-text dark:text-system-dark-text mb-1">Signed in</div>
          <div className="text-sm text-system-secondary dark:text-system-dark-secondary">
            {email || 'Not signed in'}
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-system-text dark:text-system-dark-text mb-2">Visual</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onThemeChange('light')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                theme === 'light'
                  ? 'bg-indigo-500 text-white border-indigo-500/80'
                  : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-system-text dark:text-system-dark-text hover:bg-system-bg/70 dark:hover:bg-white/10'
              }`}
            >
              <Sun size={14} />
              Light
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('dark')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                theme === 'dark'
                  ? 'bg-indigo-500 text-white border-indigo-500/80'
                  : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-system-text dark:text-system-dark-text hover:bg-system-bg/70 dark:hover:bg-white/10'
              }`}
            >
              <Moon size={14} />
              Dark
            </button>
            <button
              type="button"
              onClick={() => onThemeChange('auto')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                theme === 'auto'
                  ? 'bg-indigo-500 text-white border-indigo-500/80'
                  : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-system-text dark:text-system-dark-text hover:bg-system-bg/70 dark:hover:bg-white/10'
              }`}
            >
              <Monitor size={14} />
              Auto
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-system-text dark:text-system-dark-text mb-2">Default View</div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-500 text-white border-indigo-500/80'
                  : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-system-text dark:text-system-dark-text hover:bg-system-bg/70 dark:hover:bg-white/10'
              }`}
            >
              <LayoutGrid size={14} />
              Cards
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-500 text-white border-indigo-500/80'
                  : 'bg-white dark:bg-white/5 border-black/5 dark:border-white/10 text-system-text dark:text-system-dark-text hover:bg-system-bg/70 dark:hover:bg-white/10'
              }`}
            >
              <LayoutList size={14} />
              List
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-semibold text-system-text dark:text-system-dark-text mb-2">Library Stats</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-system-bg/70 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="text-[10px] uppercase tracking-widest text-system-secondary dark:text-system-dark-secondary">Bookmarks</div>
              <div className="text-lg font-semibold text-system-text dark:text-system-dark-text">{stats.total}</div>
            </div>
            <div className="p-3 rounded-xl bg-system-bg/70 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="text-[10px] uppercase tracking-widest text-system-secondary dark:text-system-dark-secondary">Favorites</div>
              <div className="text-lg font-semibold text-system-text dark:text-system-dark-text">{stats.favorites}</div>
            </div>
            <div className="p-3 rounded-xl bg-system-bg/70 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="text-[10px] uppercase tracking-widest text-system-secondary dark:text-system-dark-secondary">Collections</div>
              <div className="text-lg font-semibold text-system-text dark:text-system-dark-text">{stats.categories}</div>
            </div>
            <div className="p-3 rounded-xl bg-system-bg/70 dark:bg-white/5 border border-black/5 dark:border-white/10">
              <div className="text-[10px] uppercase tracking-widest text-system-secondary dark:text-system-dark-secondary">Projects</div>
              <div className="text-lg font-semibold text-system-text dark:text-system-dark-text">{stats.projects}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-[11px] text-system-secondary dark:text-system-dark-secondary">
            Changes are saved automatically.
          </div>
          <button
            type="button"
            onClick={onSignOut}
            disabled={!canSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold disabled:opacity-50"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};
