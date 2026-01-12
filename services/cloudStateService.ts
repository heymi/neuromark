import type { Bookmark, Project } from '../types';
import { supabase } from './supabaseClient';

export type CloudStateV1 = {
  version: 1;
  bookmarks: Bookmark[];
  categories: string[];
  projects: Project[];
  theme: 'light' | 'dark' | 'auto';
};

const TABLE = 'neuromark_state';

export async function fetchCloudState(userId: string): Promise<CloudStateV1 | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.state) return null;
  return data.state as CloudStateV1;
}

export async function upsertCloudState(userId: string, state: CloudStateV1): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (error) throw error;
}
