import React from 'react';
import { Bookmark as BookmarkIcon, Star, Folder, Tag } from 'lucide-react';

interface StatsOverviewProps {
  totalBookmarks: number;
  totalFavorites: number;
  totalCollections: number;
  totalTags: number;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  totalBookmarks,
  totalFavorites,
  totalCollections,
  totalTags
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard 
        label="Bookmarks" 
        value={totalBookmarks} 
        icon={<BookmarkIcon size={18} />} 
        color="text-blue-500 dark:text-blue-400" 
      />
      <StatCard 
        label="Favorites" 
        value={totalFavorites} 
        icon={<Star size={18} />} 
        color="text-amber-500 dark:text-amber-400" 
      />
      <StatCard 
        label="Collections" 
        value={totalCollections} 
        icon={<Folder size={18} />} 
        color="text-purple-500 dark:text-purple-400" 
      />
      <StatCard 
        label="Tags" 
        value={totalTags} 
        icon={<Tag size={18} />} 
        color="text-emerald-500 dark:text-emerald-400" 
      />
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-white dark:bg-system-dark-panel p-4 rounded-xl border border-black/[0.04] dark:border-white/[0.05] shadow-soft hover:shadow-soft-hover dark:shadow-none transition-all flex flex-col justify-between h-24">
    <div className={`flex items-center justify-between ${color}`}>
        <div className="opacity-80">{icon}</div>
        {/* Optional decorative element */}
        <div className="w-1.5 h-1.5 rounded-full bg-current opacity-20"></div>
    </div>
    <div>
        <div className="text-2xl font-bold text-system-text dark:text-system-dark-text tracking-tight">{value}</div>
        <div className="text-[11px] font-semibold text-system-secondary dark:text-system-dark-secondary uppercase tracking-wide opacity-80">{label}</div>
    </div>
  </div>
);