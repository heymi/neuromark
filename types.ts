export interface Project {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  summary: string;
  categories: string[]; 
  tags: string[];
  projectIds: string[]; // Changed from single projectId to array
  projectContexts: Record<string, string>; // Map of projectId -> context string (e.g. "Legacy Version")
  createdAt: number;
  isFavorite: boolean;
  isPinned?: boolean;
  iconEmoji?: string;
}

export interface AIAnalysisResult {
  title: string;
  summary: string;
  categories: string[]; 
  tags: string[];
}

export type ViewMode = 'grid' | 'list';

export enum AppState {
  IDLE,
  LOADING,
  ERROR,
  SUCCESS
}
