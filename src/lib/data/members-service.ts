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
        for (const [id, localItem] of localMap.entries()) {
          if (!supabaseIds.has(id) && !deletedIds.has(id)) {
            merged.push(localItem);
          }
        }

        setLocalDirectoryCouples(merged);
        return merged;
      }
    }
  } catch {
    // Fall back to local storage
  }

  return localCouples;
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
    coordinates: couple.coordinates || [120.7289, 14.0228],
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
      const payload = {
        id: completeCouple.id,
        husband_first_name: completeCouple.husbandFirstName,
        husband_last_name: completeCouple.husbandLastName,
        husband_nickname: completeCouple.husbandNickname || null,
        husband_photo_url: completeCouple.husbandPhotoUrl || null,
        husband_birthday: completeCouple.husbandBirthday ? completeCouple.husbandBirthday : null,
        husband_occupation: completeCouple.husbandOccupation || null,
        husband_contact: completeCouple.husbandContact || null,
        husband_email: completeCouple.husbandEmail || null,
        wife_first_name: completeCouple.wifeFirstName,
        wife_last_name: completeCouple.wifeLastName,
        wife_nickname: completeCouple.wifeNickname || null,
        wife_photo_url: completeCouple.wifePhotoUrl || null,
        wife_birthday: completeCouple.wifeBirthday ? completeCouple.wifeBirthday : null,
        wife_occupation: completeCouple.wifeOccupation || null,
        wife_contact: completeCouple.wifeContact || null,
        wife_email: completeCouple.wifeEmail || null,
        couple_photo_url: completeCouple.couplePhotoUrl || null,
        wedding_anniversary: completeCouple.weddingAnniversary ? completeCouple.weddingAnniversary : null,
        ministry: completeCouple.ministry,
        household_group_id: completeCouple.householdGroupId || null,
        household_group_name: completeCouple.householdGroupName || null,
        barangay: completeCouple.barangay,
        address: completeCouple.address || null,
        coordinates: completeCouple.coordinates,
        status: completeCouple.status,
        notes: completeCouple.notes || null,
        updated_at: completeCouple.updatedAt,
      };

      const { error } = await supabase.from('directory_couples').upsert(payload);
      if (error) {
        console.error('Supabase directory_couples upsert error:', error);
      } else {
        console.log('Successfully saved couple to Supabase directory_couples:', completeCouple.id);
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
