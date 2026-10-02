import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from './supabase';
import { deityFileUrl } from './deities';

// Vaara Pooja — the deity worshipped on each day of the week.
// "Vaara" = day of the week. Generic feature name: "Vaara Pooja".

export type WeekdayDeity = {
  day: number; // JS getDay(): 0 = Sunday … 6 = Saturday
  day_name: string;
  deity_name: string | null;
  image_path?: string | null;
  audio_path?: string | null;
  note?: string;
};

// Static fallback (names + day labels) used until the table is set up.
export const WEEKDAY_DEITIES: WeekdayDeity[] = [
  { day: 0, day_name: 'Sunday', deity_name: 'Aditya' },
  { day: 1, day_name: 'Monday', deity_name: 'Shiva' },
  { day: 2, day_name: 'Tuesday', deity_name: 'Hanuman' },
  { day: 3, day_name: 'Wednesday', deity_name: 'Ganesha' },
  { day: 4, day_name: 'Thursday', deity_name: 'Sai Baba' },
  { day: 5, day_name: 'Friday', deity_name: 'Lakshmi' },
  { day: 6, day_name: 'Saturday', deity_name: 'Venkateswara' },
];

/** The Vaara deity (static) for a given date — names only. */
export function todaysDeity(date: Date = new Date()): WeekdayDeity {
  return WEEKDAY_DEITIES[date.getDay()];
}

let cache: WeekdayDeity[] | null = null;
export function clearWeekdayCache() {
  cache = null;
}

// Always fetches fresh (so admin edits show up); updates the cache too.
async function load(): Promise<WeekdayDeity[]> {
  if (!isSupabaseConfigured) return WEEKDAY_DEITIES;
  const { data, error } = await supabase
    .from('weekday_deities')
    .select('day,day_name,deity_name,image_path,audio_path')
    .order('day', { ascending: true });
  cache = error || !data || data.length === 0 ? WEEKDAY_DEITIES : (data as WeekdayDeity[]);
  return cache;
}

/** Hook: the 7 weekday rows (from Supabase, fallback to static) + today's entry.
 *  Refetches on every mount so newly-uploaded images/audio appear. */
export function useWeekdayDeities() {
  const [rows, setRows] = useState<WeekdayDeity[]>(cache ?? WEEKDAY_DEITIES);

  const reload = () => {
    clearWeekdayCache();
    load().then(setRows);
  };

  useEffect(() => {
    let active = true;
    load().then((r) => active && setRows(r));
    return () => {
      active = false;
    };
  }, []);

  const today = (): WeekdayDeity =>
    rows.find((r) => r.day === new Date().getDay()) ?? todaysDeity();

  return { rows, today, fileUrl: deityFileUrl, reload };
}
