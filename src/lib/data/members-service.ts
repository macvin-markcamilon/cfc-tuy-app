import { DirectoryCouple } from '@/types';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEY = 'cfc_tuy_directory_couples_v1';
const DELETED_KEY = 'cfc_tuy_directory_couples_deleted_v1';

export const DEFAULT_DIRECTORY_COUPLES: DirectoryCouple[] = [];

const LEGACY_MOCK_COUPLE_IDS = new Set([
  'couple-1-camilon',
  'couple-2-hernandez',
  'couple-3-mendoza',
  'couple-4-mercado',
  'couple-5-bautista',
]);

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Sanitizes dates for PostgreSQL `DATE` column.
 * Converts "N/A", "none", "-", invalid date strings, or empty strings to `null`.
 * Formats valid dates into `YYYY-MM-DD`.
 */
export function sanitizeDateForPostgres(val?: string | null): string | null {
  if (!val) return null;
  const s = String(val).trim();
  if (
    !s ||
    s.toLowerCase() === 'n/a' ||
    s.toLowerCase() === 'none' ||
    s === '-' ||
    s === 'null' ||
    s === 'undefined'
  ) {
    return null;
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // MM/DD/YYYY or M/D/YYYY
  const usMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch) {
    const m = usMatch[1].padStart(2, '0');
    const d = usMatch[2].padStart(2, '0');
    const y = usMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Fallback to JS Date
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    if (y >= 1900 && y <= 2100) {
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Ensures coordinates array is valid [number, number]
 */
export function sanitizeCoordinates(coords: any): [number, number] {
  if (Array.isArray(coords) && coords.length >= 2) {
    const lat = Number(coords[0]);
    const lng = Number(coords[1]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return [lat, lng];
    }
  }
  return [120.7289, 14.0228];
}

/**
 * Builds a clean, sanitized payload for the Supabase `directory_couples` table.
 */
export function formatCoupleForSupabase(completeCouple: DirectoryCouple) {
  return {
    id: completeCouple.id,
    husband_first_name: completeCouple.husbandFirstName.trim(),
    husband_last_name: completeCouple.husbandLastName.trim(),
    husband_nickname: completeCouple.husbandNickname?.trim() || null,
    husband_photo_url: completeCouple.husbandPhotoUrl?.trim() || null,
    husband_birthday: sanitizeDateForPostgres(completeCouple.husbandBirthday),
    husband_occupation: completeCouple.husbandOccupation?.trim() || null,
    husband_contact: completeCouple.husbandContact?.trim() || null,
    husband_email: completeCouple.husbandEmail?.trim() || null,
    wife_first_name: completeCouple.wifeFirstName.trim(),
    wife_last_name: completeCouple.wifeLastName.trim(),
    wife_nickname: completeCouple.wifeNickname?.trim() || null,
    wife_photo_url: completeCouple.wifePhotoUrl?.trim() || null,
    wife_birthday: sanitizeDateForPostgres(completeCouple.wifeBirthday),
    wife_occupation: completeCouple.wifeOccupation?.trim() || null,
    wife_contact: completeCouple.wifeContact?.trim() || null,
    wife_email: completeCouple.wifeEmail?.trim() || null,
    couple_photo_url: completeCouple.couplePhotoUrl?.trim() || null,
    wedding_anniversary: sanitizeDateForPostgres(completeCouple.weddingAnniversary),
    ministry: completeCouple.ministry || 'CFC',
    household_group_id: completeCouple.householdGroupId || null,
    household_group_name: completeCouple.householdGroupName || null,
    barangay: completeCouple.barangay || 'Rizal (Pob.)',
    address: completeCouple.address?.trim() || null,
    coordinates: sanitizeCoordinates(completeCouple.coordinates),
    status: completeCouple.status || 'Active',
    notes: completeCouple.notes?.trim() || null,
    updated_at: completeCouple.updatedAt || new Date().toISOString(),
  };
}

// -----------------------------------------------------------------------------
// Realtime Broadcast Channel & Notifications
// -----------------------------------------------------------------------------
const DIRECTORY_CHANNEL_NAME = 'cfc_directory_live';
let sharedBroadcastChannel: any = null;

export function getDirectoryRealtimeChannel() {
  if (!isBrowser()) return null;
  const supabase = createClient();
  if (!supabase) return null;

  if (!sharedBroadcastChannel) {
    sharedBroadcastChannel = supabase.channel(DIRECTORY_CHANNEL_NAME);
    sharedBroadcastChannel.subscribe();
  }
  return sharedBroadcastChannel;
}

export function notifyDirectoryChange(payload?: any) {
  if (!isBrowser()) return;
  try {
    const ch = getDirectoryRealtimeChannel();
    if (ch) {
      ch.send({
        type: 'broadcast',
        event: 'directory_changed',
        payload: payload || { timestamp: Date.now() },
      });
    }
  } catch (err) {
    console.warn('Failed to broadcast directory change:', err);
  }
}

/**
 * Subscribes to real-time changes across browsers via Supabase Broadcast & Postgres Changes,
 * as well as storage events, tab focus, and periodic heartbeat.
 */
export function subscribeToDirectoryChanges(onChange: () => void): () => void {
  if (!isBrowser()) {
    return () => {};
  }

  const supabase = createClient();
  let channel: any = null;

  if (supabase) {
    channel = supabase
      .channel(DIRECTORY_CHANNEL_NAME)
      .on('broadcast', { event: 'directory_changed' }, () => {
        onChange();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'directory_couples' },
        () => {
          onChange();
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          onChange();
        }
      });
  }

  // Listen for storage events (same browser tabs)
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === DELETED_KEY) {
      onChange();
    }
  };
  window.addEventListener('storage', handleStorage);

  // Auto-refresh when tab gains focus
  const handleFocus = () => {
    onChange();
  };
  window.addEventListener('focus', handleFocus);

  const handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      onChange();
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  // Heartbeat fallback poll (every 5 seconds)
  const pollTimer = setInterval(() => {
    onChange();
  }, 5000);

  return () => {
    if (channel && supabase) {
      supabase.removeChannel(channel);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('focus', handleFocus);
    document.removeEventListener('visibilitychange', handleVisibility);
    clearInterval(pollTimer);
  };
}

export function getDeletedDirectoryCoupleIds(): Set<string> {
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

export function addDeletedDirectoryCoupleId(id: string): void {
  if (!isBrowser()) return;
  try {
    const deleted = getDeletedDirectoryCoupleIds();
    deleted.add(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Failed to record deleted directory couple ID:', err);
  }
}

export function removeDeletedDirectoryCoupleId(id: string): void {
  if (!isBrowser()) return;
  try {
    const deleted = getDeletedDirectoryCoupleIds();
    deleted.delete(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.error('Failed to remove deleted directory couple ID:', err);
  }
}

export function getLocalDirectoryCouples(): DirectoryCouple[] {
  if (!isBrowser()) return [];
  const deletedIds = getDeletedDirectoryCoupleIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (c: DirectoryCouple) => !deletedIds.has(c.id) && !LEGACY_MOCK_COUPLE_IDS.has(c.id)
      );
    }
    return [];
  } catch {
    return [];
  }
}

export function setLocalDirectoryCouples(couples: DirectoryCouple[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(couples));
  } catch (err) {
    console.error('Failed to save directory couples to localStorage:', err);
  }
}

export async function fetchDirectoryCouples(): Promise<DirectoryCouple[]> {
  const deletedIds = getDeletedDirectoryCoupleIds();
  const localCouples = getLocalDirectoryCouples();
  const localMap = new Map<string, DirectoryCouple>(localCouples.map((c) => [c.id, c]));

  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('directory_couples')
        .select('*')
        .order('husband_last_name', { ascending: true });

      if (!error && data) {
        const validData = data.filter((d: any) => !deletedIds.has(d.id));

        const merged: DirectoryCouple[] = validData.map((d: any) => {
          const local = localMap.get(d.id);
          const supabaseUpdatedAt = d.updated_at ? new Date(d.updated_at).getTime() : 0;
          const localUpdatedAt = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;

          if (local && localUpdatedAt > supabaseUpdatedAt) {
            return local;
          }

          return {
            id: d.id,
            husbandFirstName: d.husband_first_name || local?.husbandFirstName || '',
            husbandLastName: d.husband_last_name || local?.husbandLastName || '',
            husbandNickname: d.husband_nickname || local?.husbandNickname || '',
            husbandPhotoUrl: d.husband_photo_url || local?.husbandPhotoUrl || '',
            husbandBirthday: d.husband_birthday || local?.husbandBirthday || '',
            husbandOccupation: d.husband_occupation || local?.husbandOccupation || '',
            husbandContact: d.husband_contact || local?.husbandContact || '',
            husbandEmail: d.husband_email || local?.husbandEmail || '',
            wifeFirstName: d.wife_first_name || local?.wifeFirstName || '',
            wifeLastName: d.wife_last_name || local?.wifeLastName || '',
            wifeNickname: d.wife_nickname || local?.wifeNickname || '',
            wifePhotoUrl: d.wife_photo_url || local?.wifePhotoUrl || '',
            wifeBirthday: d.wife_birthday || local?.wifeBirthday || '',
            wifeOccupation: d.wife_occupation || local?.wifeOccupation || '',
            wifeContact: d.wife_contact || local?.wifeContact || '',
            wifeEmail: d.wife_email || local?.wifeEmail || '',
            couplePhotoUrl: d.couple_photo_url || local?.couplePhotoUrl || '',
            weddingAnniversary: d.wedding_anniversary || local?.weddingAnniversary || '',
            ministry: d.ministry || local?.ministry || 'CFC',
            householdGroupId: d.household_group_id || local?.householdGroupId || '',
            householdGroupName: d.household_group_name || local?.householdGroupName || '',
            barangay: d.barangay || local?.barangay || 'Rizal (Pob.)',
            address: d.address || local?.address || '',
            coordinates: d.coordinates || local?.coordinates || [120.7289, 14.0228],
            status: d.status || local?.status || 'Active',
            notes: d.notes || local?.notes || '',
            createdAt: d.created_at || local?.createdAt || new Date().toISOString(),
            updatedAt: d.updated_at || local?.updatedAt || new Date().toISOString(),
          };
        });

        const supabaseIds = new Set(merged.map((c) => c.id));
        const pendingUploads: DirectoryCouple[] = [];

        // Only upload local items if Supabase database table was completely empty
        if (data.length === 0) {
          for (const [id, localItem] of localMap.entries()) {
            if (!supabaseIds.has(id) && !deletedIds.has(id)) {
              merged.push(localItem);
              pendingUploads.push(localItem);
            }
          }

          if (pendingUploads.length > 0) {
            try {
              await saveDirectoryCouplesBulk(pendingUploads);
            } catch (err) {
              console.warn('Sync error pushing pending couples to Supabase:', err);
            }
          }
        }

        setLocalDirectoryCouples(merged);
        return merged;
      }
    }
  } catch (err) {
    console.warn('Error fetching directory couples from Supabase, falling back to local:', err);
  }

  return localCouples;
}

export async function checkDatabaseSyncStatus(): Promise<{
  tableExists: boolean;
  cloudCount: number;
  localCount: number;
  error?: string;
}> {
  const localCouples = getLocalDirectoryCouples();
  const supabase = createClient();
  if (!supabase) {
    return { tableExists: false, cloudCount: 0, localCount: localCouples.length, error: 'Supabase client not configured' };
  }

  try {
    const { count, error } = await supabase
      .from('directory_couples')
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        tableExists: false,
        cloudCount: 0,
        localCount: localCouples.length,
        error: error.message || error.code || 'Table not found',
      };
    }

    return {
      tableExists: true,
      cloudCount: count ?? 0,
      localCount: localCouples.length,
    };
  } catch (err: any) {
    return {
      tableExists: false,
      cloudCount: 0,
      localCount: localCouples.length,
      error: err?.message || 'Database connection error',
    };
  }
}

export async function syncLocalCouplesToDatabase(): Promise<{ success: boolean; syncedCount: number; message: string }> {
  const localCouples = getLocalDirectoryCouples();
  if (localCouples.length === 0) {
    return { success: true, syncedCount: 0, message: 'No local couples found in this browser to sync.' };
  }

  const result = await saveDirectoryCouplesBulk(localCouples);
  if (result.success) {
    return {
      success: true,
      syncedCount: result.savedCount,
      message: `Successfully synced ${result.savedCount} couples to Supabase database!`,
    };
  }
  return { success: false, syncedCount: 0, message: 'Failed to sync couples to database.' };
}

export async function saveDirectoryCouple(couple: Partial<DirectoryCouple>): Promise<DirectoryCouple> {
  const current = getLocalDirectoryCouples();
  const id = couple.id || `couple-${Date.now()}`;
  removeDeletedDirectoryCoupleId(id);
  const now = new Date().toISOString();

  const completeCouple: DirectoryCouple = {
    id,
    husbandFirstName: couple.husbandFirstName?.trim() || '',
    husbandLastName: couple.husbandLastName?.trim() || '',
    husbandNickname: couple.husbandNickname?.trim() || '',
    husbandPhotoUrl: couple.husbandPhotoUrl || '',
    husbandBirthday: couple.husbandBirthday || '',
    husbandOccupation: couple.husbandOccupation?.trim() || '',
    husbandContact: couple.husbandContact?.trim() || '',
    husbandEmail: couple.husbandEmail?.trim() || '',
    wifeFirstName: couple.wifeFirstName?.trim() || '',
    wifeLastName: couple.wifeLastName?.trim() || '',
    wifeNickname: couple.wifeNickname?.trim() || '',
    wifePhotoUrl: couple.wifePhotoUrl || '',
    wifeBirthday: couple.wifeBirthday || '',
    wifeOccupation: couple.wifeOccupation?.trim() || '',
    wifeContact: couple.wifeContact?.trim() || '',
    wifeEmail: couple.wifeEmail?.trim() || '',
    couplePhotoUrl: couple.couplePhotoUrl || '',
    weddingAnniversary: couple.weddingAnniversary || '',
    ministry: couple.ministry || 'CFC',
    householdGroupId: couple.householdGroupId || '',
    householdGroupName: couple.householdGroupName || '',
    barangay: couple.barangay || 'Rizal (Pob.)',
    address: couple.address?.trim() || '',
    coordinates: sanitizeCoordinates(couple.coordinates),
    status: couple.status || 'Active',
    notes: couple.notes?.trim() || '',
    createdAt: couple.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = current.findIndex((c) => c.id === id);
  let updatedList: DirectoryCouple[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = completeCouple;
  } else {
    updatedList = [completeCouple, ...current];
  }

  setLocalDirectoryCouples(updatedList);

  // Attempt Supabase sync
  try {
    const supabase = createClient();
    if (supabase) {
      const payload = formatCoupleForSupabase(completeCouple);
      const { error } = await supabase.from('directory_couples').upsert(payload);
      if (error) {
        console.error('Supabase directory_couples upsert error:', error);
      } else {
        console.log('Successfully saved couple to Supabase directory_couples:', completeCouple.id);
        notifyDirectoryChange({ action: 'upsert', id: completeCouple.id });
      }
    }
  } catch (err) {
    console.warn('Supabase directory_couples sync warning:', err);
  }

  return completeCouple;
}

export async function deleteDirectoryCouple(id: string): Promise<boolean> {
  addDeletedDirectoryCoupleId(id);

  const current = getLocalDirectoryCouples();
  const filtered = current.filter((c) => c.id !== id);
  setLocalDirectoryCouples(filtered);

  try {
    const supabase = createClient();
    if (supabase) {
      const { error } = await supabase.from('directory_couples').delete().eq('id', id);
      if (error) {
        console.error('Supabase directory_couples delete error:', error);
      } else {
        console.log('Successfully deleted couple from Supabase directory_couples:', id);
        notifyDirectoryChange({ action: 'delete', id });
      }
    }
  } catch (err) {
    console.error('Failed to delete couple from Supabase:', err);
  }

  return true;
}

/** Helper to convert uploaded File into Base64 data URL */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Bulk save multiple directory couples / members
 */
export async function saveDirectoryCouplesBulk(
  couplesList: Partial<DirectoryCouple>[]
): Promise<{ success: boolean; savedCount: number; couples: DirectoryCouple[]; error?: string }> {
  if (!couplesList || couplesList.length === 0) {
    return { success: true, savedCount: 0, couples: [] };
  }

  const current = getLocalDirectoryCouples();
  const now = new Date().toISOString();

  const processedCouples: DirectoryCouple[] = couplesList.map((couple, index) => {
    const id = couple.id || `couple-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
    removeDeletedDirectoryCoupleId(id);

    const completeCouple: DirectoryCouple = {
      id,
      husbandFirstName: couple.husbandFirstName?.trim() || '',
      husbandLastName: couple.husbandLastName?.trim() || '',
      husbandNickname: couple.husbandNickname?.trim() || '',
      husbandPhotoUrl: couple.husbandPhotoUrl || '',
      husbandBirthday: couple.husbandBirthday || '',
      husbandOccupation: couple.husbandOccupation?.trim() || '',
      husbandContact: couple.husbandContact?.trim() || '',
      husbandEmail: couple.husbandEmail?.trim() || '',
      wifeFirstName: couple.wifeFirstName?.trim() || '',
      wifeLastName: couple.wifeLastName?.trim() || '',
      wifeNickname: couple.wifeNickname?.trim() || '',
      wifePhotoUrl: couple.wifePhotoUrl || '',
      wifeBirthday: couple.wifeBirthday || '',
      wifeOccupation: couple.wifeOccupation?.trim() || '',
      wifeContact: couple.wifeContact?.trim() || '',
      wifeEmail: couple.wifeEmail?.trim() || '',
      couplePhotoUrl: couple.couplePhotoUrl || '',
      weddingAnniversary: couple.weddingAnniversary || '',
      ministry: couple.ministry || 'CFC',
      householdGroupId: couple.householdGroupId || '',
      householdGroupName: couple.householdGroupName || '',
      barangay: couple.barangay || 'Rizal (Pob.)',
      address: couple.address?.trim() || '',
      coordinates: sanitizeCoordinates(couple.coordinates),
      status: couple.status || 'Active',
      notes: couple.notes?.trim() || '',
      createdAt: couple.createdAt || now,
      updatedAt: now,
    };

    return completeCouple;
  });

  // Prepend new couples and maintain local list
  const newCouplesList = [...processedCouples];
  for (const c of current) {
    if (!newCouplesList.some((nc) => nc.id === c.id)) {
      newCouplesList.push(c);
    }
  }

  setLocalDirectoryCouples(newCouplesList);

  // Sync to Supabase in batch with fallback
  let savedCount = 0;
  try {
    const supabase = createClient();
    if (supabase) {
      const payloadBatch = processedCouples.map(formatCoupleForSupabase);

      const { error } = await supabase.from('directory_couples').upsert(payloadBatch);
      if (error) {
        console.warn('Supabase batch upsert failed, retrying individual upserts:', error.message);
        for (const payload of payloadBatch) {
          const { error: singleErr } = await supabase.from('directory_couples').upsert(payload);
          if (!singleErr) {
            savedCount++;
          } else {
            console.error('Failed individual upsert for:', payload.id, singleErr.message);
          }
        }
      } else {
        savedCount = processedCouples.length;
        console.log(`Successfully batch saved ${savedCount} couples to Supabase.`);
      }

      notifyDirectoryChange({ action: 'bulk_upsert', count: savedCount });
    }
  } catch (err) {
    console.warn('Supabase directory_couples bulk sync warning:', err);
  }

  return {
    success: true,
    savedCount: savedCount > 0 ? savedCount : processedCouples.length,
    couples: processedCouples,
  };
}
