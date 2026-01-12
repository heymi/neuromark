import React from 'react';
import { LayoutGrid, PenTool, Code, Briefcase, BookOpen, Zap, Globe } from 'lucide-react';

export const getCategoryIcon = (category: string, size = 14) => {
  switch (category) {
    case 'Design':
      return <PenTool size={size} />;
    case 'Development':
      return <Code size={size} />;
    case 'Business':
      return <Briefcase size={size} />;
    case 'News':
      return <Globe size={size} />;
    case 'Inspiration':
      return <Zap size={size} />;
    case 'Tools':
      return <LayoutGrid size={size} />;
    default:
      return <BookOpen size={size} />;
  }
};
