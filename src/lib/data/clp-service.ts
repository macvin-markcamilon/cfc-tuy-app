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

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

// ---------------------------------------------------------------------------
// Local Cache Accessors (Synchronous & Safe)
// ---------------------------------------------------------------------------

function getLocalPrograms(): CLPProgram[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    if (!raw) return [];
    const list = JSON.parse(raw) as CLPProgram[];
    return list.filter((p) => !p.id.includes('b29') && !p.id.includes('b30'));
  } catch {
    return [];
  }
}

function setLocalPrograms(programs: CLPProgram[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(programs));
  } catch (err) {
    console.error('Error saving local programs:', err);
  }
}

function getLocalCouples(): CLPCouple[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COUPLES);
    if (!raw) return [];
    const list = JSON.parse(raw) as CLPCouple[];
    return list.filter(
      (c) =>
        !c.id.startsWith('couple-1') &&
        !c.id.startsWith('couple-2') &&
        !c.id.startsWith('couple-3')
    );
  } catch {
    return [];
  }
}

function setLocalCouples(couples: CLPCouple[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.COUPLES, JSON.stringify(couples));
  } catch (err) {
    console.error('Error saving local couples:', err);
  }
}

function getLocalTalks(): CLPTalk[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TALKS);
    if (!raw) return [];
    const list = JSON.parse(raw) as CLPTalk[];
    return list.filter((t) => !t.id.startsWith('talk-1') && !t.id.startsWith('talk-2'));
  } catch {
    return [];
  }
}

function setLocalTalks(talks: CLPTalk[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.TALKS, JSON.stringify(talks));
  } catch (err) {
    console.error('Error saving local talks:', err);
  }
}

function getLocalAttendance(): CLPAttendance[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    if (!raw) return [];
    return JSON.parse(raw) as CLPAttendance[];
  } catch {
    return [];
  }
}

function setLocalAttendance(attendance: CLPAttendance[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(attendance));
  } catch (err) {
    console.error('Error saving local attendance:', err);
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

        setLocalPrograms(mapped);
        return mapped;
      }

      // If Supabase is connected but empty, migrate local programs to cloud once
      if (!error && data && data.length === 0) {
        const validLocal = getLocalPrograms();
        if (validLocal.length > 0) {
          for (const prog of validLocal) {
            const progId = isValidUUID(prog.id) ? prog.id : generateUUID();
            await supabase.from('clp_programs').upsert(
              {
                id: progId,
                name: prog.name,
                venue: prog.venue,
                start_date: prog.startDate,
                end_date: prog.endDate,
                status: prog.status || 'Upcoming',
                batch_number: prog.batchNumber || null,
                team_leader: prog.teamLeader || null,
              },
              { onConflict: 'id' }
            );
          }
          return validLocal;
        }
      }
    } catch (err) {
      console.warn('Supabase fetchCLPPrograms fallback to local:', err);
    }
  }

  return getLocalPrograms();
}

export async function saveCLPProgram(program: CLPProgram): Promise<CLPProgram> {
  const supabase = createClient();
  const progId = isValidUUID(program.id) ? program.id : generateUUID();
  let savedProgram: CLPProgram = { ...program, id: progId };

  // 1. Instantly persist locally so UI is responsive and never loses data
  const existing = getLocalPrograms().filter((p) => p.id !== program.id && p.id !== progId);
  setLocalPrograms([savedProgram, ...existing]);

  // 2. Persist to Supabase
  if (supabase) {
    try {
      const payload: any = {
        id: progId,
        name: program.name,
        venue: program.venue,
        start_date: program.startDate,
        end_date: program.endDate,
        status: program.status || 'Upcoming',
        batch_number: program.batchNumber || null,
        team_leader: program.teamLeader || null,
      };

      const { data, error } = await supabase
        .from('clp_programs')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        savedProgram = {
          ...savedProgram,
          id: data.id,
        };
        const current = getLocalPrograms().map((p) =>
          p.id === program.id || p.id === progId ? savedProgram : p
        );
        setLocalPrograms(current);
      } else if (error) {
        console.warn('Supabase saveCLPProgram error:', error.message || error);
      }
    } catch (err) {
      console.warn('Supabase saveCLPProgram exception, saved locally:', err);
    }
  }

  return savedProgram;
}

export async function deleteCLPProgram(id: string): Promise<void> {
  const current = getLocalPrograms().filter((p) => p.id !== id);
  setLocalPrograms(current);

  const allCouples = getLocalCouples().filter((c) => c.clpId !== id);
  setLocalCouples(allCouples);

  const allTalks = getLocalTalks().filter((t) => t.clpId !== id);
  setLocalTalks(allTalks);

  const supabase = createClient();
  if (supabase && isValidUUID(id)) {
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
      if (clpId && isValidUUID(clpId)) {
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

        const currentLocal = getLocalCouples().filter((c) => !mapped.some((m) => m.id === c.id));
        setLocalCouples([...mapped, ...currentLocal]);

        return clpId ? mapped.filter((c) => c.clpId === clpId) : mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPCouples fallback to local:', err);
    }
  }

  const local = getLocalCouples();
  return clpId ? local.filter((c) => c.clpId === clpId) : local;
}

export async function saveCLPCouple(couple: CLPCouple): Promise<CLPCouple> {
  const supabase = createClient();
  const coupleId = isValidUUID(couple.id) ? couple.id : generateUUID();
  let saved: CLPCouple = { ...couple, id: coupleId };

  // 1. Immediately store in LocalStorage
  const all = getLocalCouples().filter((c) => c.id !== couple.id && c.id !== coupleId);
  setLocalCouples([saved, ...all]);

  // 2. Persist to Supabase if available
  if (supabase) {
    try {
      const payload: any = {
        id: coupleId,
        clp_id: isValidUUID(couple.clpId) ? couple.clpId : null,
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
        latitude: couple.coordinates ? couple.coordinates[1] : null,
        longitude: couple.coordinates ? couple.coordinates[0] : null,
        status: couple.status || 'Active',
      };

      const { data, error } = await supabase
        .from('clp_couples')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        saved = { ...saved, id: data.id };
        const updated = getLocalCouples().map((c) =>
          c.id === couple.id || c.id === coupleId ? saved : c
        );
        setLocalCouples(updated);
      } else if (error) {
        console.warn('Supabase saveCLPCouple error:', error.message || error);
      }
    } catch (err) {
      console.warn('Supabase saveCLPCouple exception, safely saved locally:', err);
    }
  }

  return saved;
}

export async function deleteCLPCouple(id: string): Promise<void> {
  const all = getLocalCouples().filter((c) => c.id !== id);
  setLocalCouples(all);

  const supabase = createClient();
  if (supabase && isValidUUID(id)) {
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
      if (clpId && isValidUUID(clpId)) {
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

        setLocalTalks(mapped);
        return clpId ? mapped.filter((t) => t.clpId === clpId) : mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPTalks fallback to local:', err);
    }
  }

  const list = getLocalTalks();
  return clpId ? list.filter((t) => t.clpId === clpId) : list;
}

export async function saveCLPTalk(talk: CLPTalk): Promise<CLPTalk> {
  const supabase = createClient();
  const talkId = isValidUUID(talk.id) ? talk.id : generateUUID();
  let saved: CLPTalk = { ...talk, id: talkId };

  const current = getLocalTalks().filter((t) => t.id !== talk.id && t.id !== talkId);
  setLocalTalks([...current, saved]);

  if (supabase) {
    try {
      const payload: any = {
        id: talkId,
        clp_id: isValidUUID(talk.clpId) ? talk.clpId : null,
        talk_number: talk.talkNumber,
        title: talk.title,
        speaker: talk.speaker,
        venue: talk.venue,
        talk_date: talk.date || null,
        talk_time: talk.time || '6:30 PM - 9:00 PM',
        module_name: talk.moduleName,
      };

      const { data, error } = await supabase
        .from('clp_talks')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();

      if (!error && data) {
        saved = { ...saved, id: data.id };
        const updated = getLocalTalks().map((t) => (t.id === talk.id || t.id === talkId ? saved : t));
        setLocalTalks(updated);
      } else if (error) {
        console.warn('Supabase saveCLPTalk error:', error.message || error);
      }
    } catch (err) {
      console.warn('Supabase saveCLPTalk exception, safely stored locally:', err);
    }
  }

  return saved;
}

export async function deleteCLPTalk(id: string): Promise<void> {
  const all = getLocalTalks().filter((t) => t.id !== id);
  setLocalTalks(all);

  const supabase = createClient();
  if (supabase && isValidUUID(id)) {
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
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();

  const talksToCreate: CLPTalk[] = CFC_STANDARD_8_TALKS.map((item, i) => {
    const talkDate = new Date(baseDate);
    talkDate.setDate(baseDate.getDate() + i * 7); // weekly

    return {
      id: generateUUID(),
      clpId,
      talkNumber: item.talkNumber,
      title: item.title,
      speaker: 'To be assigned',
      venue: venue || 'Saint Vincent Ferrer Parish Social Hall, Tuy',
      date: !isNaN(talkDate.getTime()) ? talkDate.toISOString().split('T')[0] : '',
      time: '6:30 PM - 9:00 PM',
      moduleName: item.moduleName,
    };
  });

  const createdTalks = await Promise.all(talksToCreate.map((t) => saveCLPTalk(t)));
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
      if (talkId && isValidUUID(talkId)) {
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

        setLocalAttendance(mapped);
        return talkId ? mapped.filter((a) => a.talkId === talkId) : mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchCLPAttendance fallback:', err);
    }
  }

  const list = getLocalAttendance();
  return talkId ? list.filter((a) => a.talkId === talkId) : list;
}

export async function saveCLPAttendance(record: CLPAttendance): Promise<void> {
  const attId = isValidUUID(record.id) ? record.id : generateUUID();
  const savedRecord = { ...record, id: attId };

  const current = getLocalAttendance().filter(
    (a) => !(a.talkId === record.talkId && a.coupleId === record.coupleId)
  );
  setLocalAttendance([...current, savedRecord]);

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('clp_attendance').upsert(
        {
          id: attId,
          talk_id: isValidUUID(record.talkId) ? record.talkId : null,
          couple_id: isValidUUID(record.coupleId) ? record.coupleId : null,
          husband_present: record.husbandPresent,
          wife_present: record.wifePresent,
          remarks: record.remarks || null,
        },
        { onConflict: 'talk_id,couple_id' }
      );
    } catch (err) {
      console.warn('Supabase attendance save error:', err);
    }
  }
}
