import React from 'react';
import { Bookmark } from '../types';

interface LibraryHeroProps {
    bookmarks: Bookmark[];
}

export const LibraryHero: React.FC<LibraryHeroProps> = ({ 
    bookmarks
}) => {
    if (bookmarks.length === 0) {
        return (
             <div className="mb-4 p-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex flex-col items-center justify-center text-center shadow-lg">
                <h2 className="text-xl font-bold mb-1.5">Welcome to NeuroMark</h2>
                <p className="opacity-90 max-w-md text-sm">Your library is empty. Add your first bookmark.</p>
             </div>
        );
    }

    return null;
};
