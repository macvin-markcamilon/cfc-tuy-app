import { CLPProgram, CLPCouple, CLPTalk, CLPAttendance } from '@/types';
import { createClient } from '@/lib/supabase/client';

const STORAGE_KEYS = {
  PROGRAMS: 'cfc_tuy_prod_clp_programs',
  COUPLES: 'cfc_tuy_prod_clp_couples',
  TALKS: 'cfc_tuy_prod_clp_talks',
  ATTENDANCE: 'cfc_tuy_prod_clp_attendance',
  LEGACY_PURGED: 'cfc_tuy_sample_purged_v1',
};

export const CFC_STANDARD_8_TALKS = [
  // Module 1: The Basic Truths about Christianity
  { talkNumber: 1, title: "God's Love", moduleName: 'Module 1: Basic Truths' },
  { talkNumber: 2, title: 'Who is Jesus Christ?', moduleName: 'Module 1: Basic Truths' },
  { talkNumber: 3, title: 'Repentance and Faith', moduleName: 'Module 1: Basic Truths' },
  // Module 2: The Authentic & Spirit-Filled Christian Life
  { talkNumber: 4, title: 'Loving God and Neighbor', moduleName: 'Module 2: Spirit-Filled Life' },
  { talkNumber: 5, title: 'The Christian Family', moduleName: 'Module 2: Spirit-Filled Life' },
  { talkNumber: 6, title: 'Empowered by the Holy Spirit', moduleName: 'Module 2: Spirit-Filled Life' },
  { talkNumber: 7, title: 'Growing in the Spirit', moduleName: 'Module 2: Spirit-Filled Life' },
  { talkNumber: 8, title: 'Transformation in Christ', moduleName: 'Module 2: Spirit-Filled Life' },
];

export const CFC_STANDARD_TALKS = CFC_STANDARD_8_TALKS;
export const CFC_STANDARD_12_TALKS = CFC_STANDARD_8_TALKS; // Alias for backward compatibility

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Cleanse old sample data from localStorage so the user starts with clean production data.
 */
export function purgeLegacySampleData(): void {
  if (!isBrowser()) return;
  try {
    const hasPurged = localStorage.getItem(STORAGE_KEYS.LEGACY_PURGED);
    if (!hasPurged) {
      // Remove any previous keys that had mock records
      localStorage.removeItem('cfc_tuy_clp_programs');
      localStorage.removeItem('cfc_tuy_clp_couples');
      localStorage.removeItem('cfc_tuy_clp_talks');
      localStorage.removeItem('cfc_tuy_clp_attendance');
      localStorage.removeItem(STORAGE_KEYS.PROGRAMS);
      localStorage.removeItem(STORAGE_KEYS.COUPLES);
      localStorage.removeItem(STORAGE_KEYS.TALKS);
      localStorage.removeItem(STORAGE_KEYS.ATTENDANCE);
      localStorage.setItem(STORAGE_KEYS.LEGACY_PURGED, 'true');
    }
  } catch (err) {
    console.error('Error purging legacy sample data:', err);
  }
}

// ---------------------------------------------------------------------------
// 1. CLP Programs
// ---------------------------------------------------------------------------

export async function fetchCLPPrograms(): Promise<CLPProgram[]> {
  purgeLegacySampleData();
  const supabase = createClient();

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clp_programs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: CLPProgram[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          venue: row.venue,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.status || 'Upcoming',
          batchNumber: row.batch_number || '',
          teamLeader: row.team_leader || 'Bro. Mark & Sis. Grace Camilon',
          couplesCount: 0,
          talksCount: 8,
        }));

        if (isBrowser()) {
          localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(mapped));
        }
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPPrograms fallback to local:', err);
    }
  }

  // Local storage fallback
  if (isBrowser()) {
    try {
      const local = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
      if (local) {
        const parsed = JSON.parse(local) as CLPProgram[];
        // Filter out legacy mock IDs
        return parsed.filter((p) => !p.id.includes('b29') && !p.id.includes('b30'));
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function saveCLPProgram(program: CLPProgram): Promise<CLPProgram> {
  const supabase = createClient();
  let savedProgram = { ...program };

  // Always persist locally first so state is never lost
  if (isBrowser()) {
    try {
      const existing = (await fetchCLPPrograms()).filter((p) => p.id !== program.id);
      const updated = [savedProgram, ...existing];
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(updated));
    } catch (e) {
      console.error('Local save error:', e);
    }
  }

  // Sync to Supabase if configured
  if (supabase) {
    try {
      // Check if valid UUID or let Postgres generate UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        program.id
      );

      const payload: any = {
        name: program.name,
        venue: program.venue,
        start_date: program.startDate,
        end_date: program.endDate,
        status: program.status,
        batch_number: program.batchNumber,
        team_leader: program.teamLeader,
      };

      if (isUUID) {
        payload.id = program.id;
      }

      const { data, error } = await supabase
        .from('clp_programs')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        savedProgram = {
          ...savedProgram,
          id: data.id,
        };

        // Update local storage with real DB ID
        if (isBrowser()) {
          const current = (await fetchCLPPrograms()).map((p) =>
            p.id === program.id ? savedProgram : p
          );
          localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(current));
        }
      }
    } catch (err) {
      console.warn('Supabase saveCLPProgram error, safely saved locally:', err);
    }
  }

  return savedProgram;
}

export async function deleteCLPProgram(id: string): Promise<void> {
  if (isBrowser()) {
    try {
      const current = (await fetchCLPPrograms()).filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(current));

      // Also remove couples and talks belonging to this program
      const allCouples = (await fetchCLPCouples()).filter((c) => c.clpId !== id);
      localStorage.setItem(STORAGE_KEYS.COUPLES, JSON.stringify(allCouples));

      const allTalks = (await fetchCLPTalks()).filter((t) => t.clpId !== id);
      localStorage.setItem(STORAGE_KEYS.TALKS, JSON.stringify(allTalks));
    } catch (e) {
      console.error('Delete local error:', e);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('clp_programs').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete error:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// 2. CLP Couples / Invitees
// ---------------------------------------------------------------------------

export async function fetchCLPCouples(clpId?: string): Promise<CLPCouple[]> {
  purgeLegacySampleData();
  const supabase = createClient();

  if (supabase) {
    try {
      let query = supabase.from('clp_couples').select('*');
      if (clpId) {
        query = query.eq('clp_id', clpId);
      }
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        const mapped: CLPCouple[] = data.map((row: any) => ({
          id: row.id,
          clpId: row.clp_id,
          husbandFirstName: row.husband_first_name,
          husbandLastName: row.husband_last_name,
          husbandBirthday: row.husband_birthday || '',
          husbandOccupation: row.husband_occupation || '',
          husbandContact: row.husband_contact || '',
          husbandEmail: row.husband_email || '',
          wifeFirstName: row.wife_first_name,
          wifeLastName: row.wife_last_name,
          wifeBirthday: row.wife_birthday || '',
          wifeOccupation: row.wife_occupation || '',
          wifeContact: row.wife_contact || '',
          wifeEmail: row.wife_email || '',
          weddingAnniversary: row.wedding_anniversary || '',
          address: row.address,
          barangay: row.barangay,
          coordinates: [row.longitude || 120.7289, row.latitude || 14.0228],
          status: row.status || 'Active',
        }));

        if (isBrowser()) {
          // Merge with local storage
          const currentLocal = (await fetchCLPCouplesFromLocal()).filter(
            (c) => !mapped.some((m) => m.id === c.id)
          );
          localStorage.setItem(
            STORAGE_KEYS.COUPLES,
            JSON.stringify([...mapped, ...currentLocal])
          );
        }
        return clpId ? mapped.filter((c) => c.clpId === clpId) : mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPCouples fallback to local:', err);
    }
  }

  const local = await fetchCLPCouplesFromLocal();
  return clpId ? local.filter((c) => c.clpId === clpId) : local;
}

async function fetchCLPCouplesFromLocal(): Promise<CLPCouple[]> {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COUPLES);
    if (!raw) return [];
    const list = JSON.parse(raw) as CLPCouple[];
    // Filter out legacy sample couples
    return list.filter((c) => !c.id.startsWith('couple-1') && !c.id.startsWith('couple-2') && !c.id.startsWith('couple-3'));
  } catch {
    return [];
  }
}

export async function saveCLPCouple(couple: CLPCouple): Promise<CLPCouple> {
  const supabase = createClient();
  let saved = { ...couple };

  // 1. Immediately store in LocalStorage
  if (isBrowser()) {
    try {
      const all = (await fetchCLPCouplesFromLocal()).filter((c) => c.id !== couple.id);
      localStorage.setItem(STORAGE_KEYS.COUPLES, JSON.stringify([saved, ...all]));
    } catch (err) {
      console.error('Error saving couple locally:', err);
    }
  }

  // 2. Persist to Supabase if available
  if (supabase) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        couple.id
      );

      const payload: any = {
        clp_id: couple.clpId,
        husband_first_name: couple.husbandFirstName,
        husband_last_name: couple.husbandLastName,
        husband_birthday: couple.husbandBirthday || null,
        husband_occupation: couple.husbandOccupation || null,
        husband_contact: couple.husbandContact || null,
        husband_email: couple.husbandEmail || null,
        wife_first_name: couple.wifeFirstName,
        wife_last_name: couple.wifeLastName,
        wife_birthday: couple.wifeBirthday || null,
        wife_occupation: couple.wifeOccupation || null,
        wife_contact: couple.wifeContact || null,
        wife_email: couple.wifeEmail || null,
        wedding_anniversary: couple.weddingAnniversary || null,
        address: couple.address,
        barangay: couple.barangay,
        latitude: couple.coordinates[1],
        longitude: couple.coordinates[0],
        status: couple.status,
      };

      if (isUUID) {
        payload.id = couple.id;
      }

      const { data, error } = await supabase
        .from('clp_couples')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        saved = {
          ...saved,
          id: data.id,
        };

        if (isBrowser()) {
          const all = (await fetchCLPCouplesFromLocal()).map((c) =>
            c.id === couple.id ? saved : c
          );
          localStorage.setItem(STORAGE_KEYS.COUPLES, JSON.stringify(all));
        }
      }
    } catch (err) {
      console.warn('Supabase saveCLPCouple error, safely stored locally:', err);
    }
  }

  return saved;
}

export async function deleteCLPCouple(id: string): Promise<void> {
  if (isBrowser()) {
    try {
      const all = (await fetchCLPCouplesFromLocal()).filter((c) => c.id !== id);
      localStorage.setItem(STORAGE_KEYS.COUPLES, JSON.stringify(all));
    } catch (err) {
      console.error('Error deleting couple locally:', err);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('clp_couples').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete couple error:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. CLP Talks
// ---------------------------------------------------------------------------

export async function fetchCLPTalks(clpId?: string): Promise<CLPTalk[]> {
  purgeLegacySampleData();
  const supabase = createClient();

  if (supabase) {
    try {
      let query = supabase.from('clp_talks').select('*').order('talk_number', { ascending: true });
      if (clpId) {
        query = query.eq('clp_id', clpId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: CLPTalk[] = data.map((row: any) => ({
          id: row.id,
          clpId: row.clp_id,
          talkNumber: row.talk_number,
          title: row.title,
          speaker: row.speaker,
          venue: row.venue,
          date: row.talk_date || '',
          time: row.talk_time || '6:30 PM - 9:00 PM',
          moduleName: row.module_name || `Module ${Math.ceil(row.talk_number / 4)}`,
        }));

        if (isBrowser()) {
          localStorage.setItem(STORAGE_KEYS.TALKS, JSON.stringify(mapped));
        }
        return clpId ? mapped.filter((t) => t.clpId === clpId) : mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPTalks fallback to local:', err);
    }
  }

  if (isBrowser()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.TALKS);
      if (raw) {
        const list = JSON.parse(raw) as CLPTalk[];
        const filtered = list.filter((t) => !t.id.startsWith('talk-1') && !t.id.startsWith('talk-2'));
        return clpId ? filtered.filter((t) => t.clpId === clpId) : filtered;
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function saveCLPTalk(talk: CLPTalk): Promise<CLPTalk> {
  const supabase = createClient();
  let saved = { ...talk };

  if (isBrowser()) {
    try {
      const current = (await fetchCLPTalks()).filter((t) => t.id !== talk.id);
      localStorage.setItem(STORAGE_KEYS.TALKS, JSON.stringify([...current, saved]));
    } catch (err) {
      console.error('Error saving talk locally:', err);
    }
  }

  if (supabase) {
    try {
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        talk.id
      );

      const payload: any = {
        clp_id: talk.clpId,
        talk_number: talk.talkNumber,
        title: talk.title,
        speaker: talk.speaker,
        venue: talk.venue,
        talk_date: talk.date || null,
        talk_time: talk.time || '6:30 PM - 9:00 PM',
        module_name: talk.moduleName,
      };

      if (isUUID) {
        payload.id = talk.id;
      }

      const { data, error } = await supabase
        .from('clp_talks')
        .upsert(payload)
        .select()
        .single();

      if (!error && data) {
        saved = { ...saved, id: data.id };
        if (isBrowser()) {
          const current = (await fetchCLPTalks()).map((t) => (t.id === talk.id ? saved : t));
          localStorage.setItem(STORAGE_KEYS.TALKS, JSON.stringify(current));
        }
      }
    } catch (err) {
      console.warn('Supabase saveCLPTalk error:', err);
    }
  }

  return saved;
}

export async function deleteCLPTalk(id: string): Promise<void> {
  if (isBrowser()) {
    try {
      const all = (await fetchCLPTalks()).filter((t) => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TALKS, JSON.stringify(all));
    } catch (err) {
      console.error('Error deleting talk locally:', err);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('clp_talks').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase delete talk error:', err);
    }
  }
}

/**
 * Automatically creates the 8 revised CFC CLP Talks for a program.
 */
export async function populateStandardTalksForCLP(
  clpId: string,
  startDateStr: string,
  venue: string = 'Saint Vincent Ferrer Parish Social Hall, Tuy'
): Promise<CLPTalk[]> {
  const createdTalks: CLPTalk[] = [];
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  for (let i = 0; i < CFC_STANDARD_8_TALKS.length; i++) {
    const item = CFC_STANDARD_8_TALKS[i];
    const talkDate = new Date(baseDate);
    talkDate.setDate(baseDate.getDate() + i * 7); // weekly on Saturday

    const talk: CLPTalk = {
      id: `talk-${clpId}-${item.talkNumber}-${Date.now() + i}`,
      clpId,
      talkNumber: item.talkNumber,
      title: item.title,
      speaker: 'To be assigned',
      venue: venue || 'Saint Vincent Ferrer Parish Social Hall, Tuy',
      date: talkDate.toISOString().split('T')[0],
      time: '6:30 PM - 9:00 PM',
      moduleName: item.moduleName,
    };

    const saved = await saveCLPTalk(talk);
    createdTalks.push(saved);
  }

  return createdTalks;
}

// ---------------------------------------------------------------------------
// 4. CLP Attendance
// ---------------------------------------------------------------------------

export async function fetchCLPAttendance(talkId?: string): Promise<CLPAttendance[]> {
  purgeLegacySampleData();
  const supabase = createClient();

  if (supabase) {
    try {
      let query = supabase.from('clp_attendance').select('*');
      if (talkId) {
        query = query.eq('talk_id', talkId);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        const mapped: CLPAttendance[] = data.map((row: any) => ({
          id: row.id,
          talkId: row.talk_id,
          coupleId: row.couple_id,
          husbandPresent: Boolean(row.husband_present),
          wifePresent: Boolean(row.wife_present),
          remarks: row.remarks || '',
        }));

        if (isBrowser()) {
          localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(mapped));
        }
        return talkId ? mapped.filter((a) => a.talkId === talkId) : mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPAttendance fallback:', err);
    }
  }

  if (isBrowser()) {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
      if (raw) {
        const list = JSON.parse(raw) as CLPAttendance[];
        return talkId ? list.filter((a) => a.talkId === talkId) : list;
      }
    } catch {
      return [];
    }
  }

  return [];
}

export async function saveCLPAttendance(record: CLPAttendance): Promise<void> {
  if (isBrowser()) {
    try {
      const current = (await fetchCLPAttendance()).filter(
        (a) => !(a.talkId === record.talkId && a.coupleId === record.coupleId)
      );
      localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify([...current, record]));
    } catch (err) {
      console.error('Local attendance save error:', err);
    }
  }

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('clp_attendance').upsert({
        talk_id: record.talkId,
        couple_id: record.coupleId,
        husband_present: record.husbandPresent,
        wife_present: record.wifePresent,
        remarks: record.remarks || null,
      });
    } catch (err) {
      console.warn('Supabase attendance save error:', err);
    }
  }
}
