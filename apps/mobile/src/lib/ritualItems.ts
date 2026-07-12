import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';

export type RitualItem = {
  item_key: string;
  name: string;
  name_hi: string | null;
  name_te: string | null;
  image_source: 'static' | 'deity';
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
};

/** Public URL for a file in the 'ritual-items' Storage bucket. */
export function ritualItemFileUrl(path: string | null | undefined): string | null {
  if (!path || !isSupabaseConfigured) return null;
  return supabase.storage.from('ritual-items').getPublicUrl(path).data.publicUrl;
}

let cache: RitualItem[] | null = null;

/** Force the next useRitualItems()/load() to re-fetch (call after admin edits). */
export function clearRitualItemsCache() {
  cache = null;
}

async function load(): Promise<RitualItem[]> {
  if (cache) return cache;
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('ritual_items')
    .select('item_key,name,name_hi,name_te,image_source,image_path,sort_order,is_active')
    .order('sort_order', { ascending: true });
  cache = error || !data ? [] : (data as RitualItem[]);
  return cache;
}

/** Active ritual items, ordered — used by the guided pooja palette. */
export function useRitualItems() {
  const [items, setItems] = useState<RitualItem[]>(cache ?? []);
  useEffect(() => {
    let active = true;
    load().then((d) => active && setItems(d));
    return () => {
      active = false;
    };
  }, []);
  return { items: items.filter((i) => i.is_active) };
}
