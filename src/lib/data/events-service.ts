import { ChapterEvent } from '@/types';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'cfc_tuy_events_v1';
const DELETED_KEY = 'cfc_tuy_events_deleted_v1';

export const DEFAULT_CHAPTER_EVENTS: ChapterEvent[] = [];

const LEGACY_MOCK_EVENT_IDS = new Set([
  'evt-1-monthly-assembly',
  'evt-2-clp-session-1',
  'evt-3-marriage-enrichment',
  'evt-4-yfc-youth-camp',
  'evt-5-sfc-worship',
  'evt-6-hold-prayer',
  'evt-7-sold-breakfast',
]);

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getDeletedEventIds(): Set<string> {
  if (!isBrowser()) return new Set();
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

export function addDeletedEventId(id: string): void {
  if (!isBrowser()) return;
  try {
    const deleted = getDeletedEventIds();
    deleted.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Failed to save deleted event ID:', err);
  }
}

export function removeDeletedEventId(id: string): void {
  if (!isBrowser()) return;
  try {
    const deleted = getDeletedEventIds();
    deleted.delete(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Failed to remove deleted event ID:', err);
  }
}

export function getLocalEvents(): ChapterEvent[] {
  if (!isBrowser()) return [];
  const deletedIds = getDeletedEventIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (e: ChapterEvent) => !deletedIds.has(e.id) && !LEGACY_MOCK_EVENT_IDS.has(e.id)
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function setLocalEvents(events: ChapterEvent[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.error('Failed to save events to localStorage:', err);
  }
}

export async function fetchEvents(): Promise<ChapterEvent[]> {
  const deletedIds = getDeletedEventIds();
  const localEvents = getLocalEvents();

  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (!error && data && data.length > 0) {
        const mapped: ChapterEvent[] = data
          .filter((row: any) => !deletedIds.has(String(row.id)))
          .map((row: any) => ({
            id: String(row.id),
            title: String(row.title || ''),
            description: String(row.description || ''),
            date: String(row.date || ''),
            time: String(row.time || ''),
            location: String(row.location || ''),
            locationCoords: row.location_coords || undefined,
            ministry: row.ministry || 'CFC',
            category: row.category || 'Assembly',
            isFeatured: Boolean(row.is_featured),
          }));

        setLocalEvents(mapped);
        return mapped;
      }
    }
  } catch (err) {
    console.warn('Supabase fetchEvents fallback:', err);
  }

  return localEvents;
}

export async function saveEvent(event: Partial<ChapterEvent>): Promise<ChapterEvent> {
  const current = getLocalEvents();
  const id = event.id || `evt-${Date.now()}`;
  removeDeletedEventId(id);

  const completeEvent: ChapterEvent = {
    id,
    title: event.title?.trim() || 'New Chapter Event',
    description: event.description?.trim() || '',
    date: event.date || new Date().toISOString().slice(0, 10),
    time: event.time?.trim() || '6:00 PM',
    location: event.location?.trim() || 'Tuy, Batangas',
    locationCoords: event.locationCoords,
    ministry: event.ministry || 'CFC',
    category: event.category || 'Assembly',
    isFeatured: event.isFeatured || false,
  };

  const idx = current.findIndex((e) => e.id === id);
  let updated: ChapterEvent[];
  if (idx >= 0) {
    updated = [...current];
    updated[idx] = completeEvent;
  } else {
    updated = [completeEvent, ...current];
  }

  setLocalEvents(updated);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from('events').upsert({
        id: completeEvent.id,
        title: completeEvent.title,
        description: completeEvent.description,
        date: completeEvent.date,
        time: completeEvent.time,
        location: completeEvent.location,
        location_coords: completeEvent.locationCoords || null,
        ministry: completeEvent.ministry,
        category: completeEvent.category,
        is_featured: completeEvent.isFeatured,
      });
    }
  } catch (err) {
    console.warn('Supabase saveEvent error:', err);
  }

  return completeEvent;
}

export async function deleteEvent(id: string): Promise<boolean> {
  addDeletedEventId(id);
  const current = getLocalEvents();
  const filtered = current.filter((e) => e.id !== id);
  setLocalEvents(filtered);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from('events').delete().eq('id', id);
    }
  } catch (err) {
    console.warn('Supabase deleteEvent error:', err);
  }

  return true;
}
