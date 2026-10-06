import { HouseholdGroup, HouseholdMember, MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateUUID, isValidUUID } from './clp-service';

const STORAGE_KEYS = {
  GROUPS: 'cfc_tuy_prod_household_groups_v1',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const INITIAL_HOUSEHOLD_GROUPS: HouseholdGroup[] = [];

const LEGACY_MOCK_GROUP_IDS = new Set([
  '00000000-0001-0000-0000-000000000001',
  '00000000-0001-0000-0000-000000000002',
  '00000000-0001-0000-0000-000000000003',
  '00000000-0001-0000-0000-000000000004',
  '00000000-0001-0000-0000-000000000005',
]);

function getLocalGroups(): HouseholdGroup[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((g: HouseholdGroup) => !LEGACY_MOCK_GROUP_IDS.has(g.id));
    }
    return [];
  } catch {
    return [];
  }
}

function setLocalGroups(groups: HouseholdGroup[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(groups));
  } catch (err) {
    console.error('Error saving local household groups:', err);
  }
}

/**
 * Fetch all Household / Cell Groups
 */
export async function fetchHouseholdGroups(): Promise<HouseholdGroup[]> {
  const supabase = createClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('household_groups')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: HouseholdGroup[] = data.map((row: Record<string, unknown>) => ({
          id: String(row.id),
          name: String(row.name || ''),
          leaderName: String(row.leader_name || ''),
          leaderContact: String(row.leader_contact || ''),
          coLeaderName: String(row.co_leader_name || ''),
          coLeaderContact: String(row.co_leader_contact || ''),
          ministry: (row.ministry as MinistryType) || 'CFC',
          barangay: String(row.barangay || 'Rizal (Pob.)'),
          meetingSchedule: String(row.meeting_schedule || ''),
          meetingDay: String(row.meeting_day || ''),
          meetingVenue: String(row.meeting_venue || ''),
          membersCount: typeof row.members_count === 'number' ? row.members_count : (Array.isArray(row.members) ? row.members.length : 0),
          members: Array.isArray(row.members) ? (row.members as HouseholdMember[]) : [],
          unitLeaderName: String(row.unit_leader_name || ''),
          status: (row.status as 'Active' | 'On-Break' | 'Inactive') || 'Active',
          notes: String(row.notes || ''),
          createdAt: String(row.created_at || new Date().toISOString()),
          updatedAt: row.updated_at ? String(row.updated_at) : undefined,
        }));

        setLocalGroups(mapped);
        return mapped;
      }

      // If Supabase table exists but empty, seed with initial local groups
      if (!error && data && data.length === 0) {
        const local = getLocalGroups();
        if (local.length > 0) {
          for (const item of local) {
            try {
              await supabase.from('household_groups').upsert({
                id: isValidUUID(item.id) ? item.id : generateUUID(),
                name: item.name,
                leader_name: item.leaderName,
                leader_contact: item.leaderContact || null,
                co_leader_name: item.coLeaderName || null,
                co_leader_contact: item.coLeaderContact || null,
                ministry: item.ministry,
                barangay: item.barangay,
                meeting_schedule: item.meetingSchedule,
                meeting_day: item.meetingDay,
                meeting_venue: item.meetingVenue || null,
                members_count: item.membersCount,
                members: item.members || [],
                unit_leader_name: item.unitLeaderName || null,
                status: item.status || 'Active',
                notes: item.notes || null,
                created_at: item.createdAt || new Date().toISOString(),
              });
            } catch {
              // Ignore seed error
            }
          }
        }
      }
    } catch (err) {
      console.warn('Supabase fetchHouseholdGroups fallback:', err);
    }
  }

  return getLocalGroups();
}

/**
 * Save or update a Household / Cell Group
 */
export async function saveHouseholdGroup(group: Partial<HouseholdGroup>): Promise<HouseholdGroup> {
  const id = group.id && isValidUUID(group.id) ? group.id : generateUUID();
  const now = new Date().toISOString();

  const members = group.members || [];
  const membersCount = group.membersCount !== undefined ? group.membersCount : members.length;

  const savedRecord: HouseholdGroup = {
    id,
    name: group.name?.trim() || 'New Household Group',
    leaderName: group.leaderName?.trim() || 'Unassigned Leader',
    leaderContact: group.leaderContact?.trim() || '',
    coLeaderName: group.coLeaderName?.trim() || '',
    coLeaderContact: group.coLeaderContact?.trim() || '',
    ministry: group.ministry || 'CFC',
    barangay: group.barangay?.trim() || 'Rizal (Pob.)',
    meetingSchedule: group.meetingSchedule?.trim() || 'Every Saturday 7:00 PM',
    meetingDay: group.meetingDay?.trim() || 'Saturday',
    meetingVenue: group.meetingVenue?.trim() || '',
    membersCount: Math.max(membersCount, members.length),
    members,
    unitLeaderName: group.unitLeaderName?.trim() || '',
    status: group.status || 'Active',
    notes: group.notes?.trim() || '',
    createdAt: group.createdAt || now,
    updatedAt: now,
  };

  const current = getLocalGroups();
  const existingIdx = current.findIndex((g) => g.id === id);
  let updatedList: HouseholdGroup[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = savedRecord;
  } else {
    updatedList = [savedRecord, ...current];
  }

  setLocalGroups(updatedList);

  const supabase = createClient();
  if (supabase) {
    try {
      await supabase.from('household_groups').upsert({
        id,
        name: savedRecord.name,
        leader_name: savedRecord.leaderName,
        leader_contact: savedRecord.leaderContact || null,
        co_leader_name: savedRecord.coLeaderName || null,
        co_leader_contact: savedRecord.coLeaderContact || null,
        ministry: savedRecord.ministry,
        barangay: savedRecord.barangay,
        meeting_schedule: savedRecord.meetingSchedule,
        meeting_day: savedRecord.meetingDay,
        meeting_venue: savedRecord.meetingVenue || null,
        members_count: savedRecord.membersCount,
        members: savedRecord.members || [],
        unit_leader_name: savedRecord.unitLeaderName || null,
        status: savedRecord.status,
        notes: savedRecord.notes || null,
        created_at: savedRecord.createdAt,
        updated_at: savedRecord.updatedAt,
      });
    } catch (err) {
      console.warn('Supabase saveHouseholdGroup exception, persisted locally:', err);
    }
  }

  return savedRecord;
}

/**
 * Delete a Household Group
 */
export async function deleteHouseholdGroup(id: string): Promise<void> {
  const current = getLocalGroups();
  const filtered = current.filter((g) => g.id !== id);
  setLocalGroups(filtered);

  const supabase = createClient();
  if (supabase && isValidUUID(id)) {
    try {
      await supabase.from('household_groups').delete().eq('id', id);
    } catch (err) {
      console.warn('Supabase deleteHouseholdGroup exception:', err);
    }
  }
}

/**
 * Add a member to a Household Group
 */
export async function addMemberToGroup(
  groupId: string,
  member: Omit<HouseholdMember, 'id'> & { id?: string }
): Promise<HouseholdGroup | null> {
  const groups = getLocalGroups();
  const target = groups.find((g) => g.id === groupId);
  if (!target) return null;

  const newMember: HouseholdMember = {
    id: member.id || generateUUID(),
    name: member.name.trim(),
    spouseName: member.spouseName?.trim(),
    role: member.role || 'Member',
    contact: member.contact?.trim(),
    email: member.email?.trim(),
    notes: member.notes?.trim(),
  };

  const updatedMembers = [...(target.members || []), newMember];
  const updatedGroup: HouseholdGroup = {
    ...target,
    members: updatedMembers,
    membersCount: Math.max(target.membersCount, updatedMembers.length),
    updatedAt: new Date().toISOString(),
  };

  await saveHouseholdGroup(updatedGroup);
  return updatedGroup;
}

/**
 * Remove a member from a Household Group
 */
export async function removeMemberFromGroup(
  groupId: string,
  memberId: string
): Promise<HouseholdGroup | null> {
  const groups = getLocalGroups();
  const target = groups.find((g) => g.id === groupId);
  if (!target) return null;

  const updatedMembers = (target.members || []).filter((m) => m.id !== memberId);
  const updatedGroup: HouseholdGroup = {
    ...target,
    members: updatedMembers,
    membersCount: Math.max(updatedMembers.length, (target.membersCount || 1) - 1),
    updatedAt: new Date().toISOString(),
  };

  await saveHouseholdGroup(updatedGroup);
  return updatedGroup;
}

/**
 * Export Groups to CSV File
 */
export function exportGroupsToCSV(groups: HouseholdGroup[]): void {
  if (!isBrowser() || groups.length === 0) return;

  const headers = [
    'Group Name',
    'Ministry',
    'Status',
    'Barangay',
    'Meeting Venue',
    'Meeting Schedule',
    'Meeting Day',
    'Household Head / Leader',
    'Leader Contact',
    'Co-Leader',
    'Co-Leader Contact',
    'Unit Leader',
    'Member Count',
    'Pastoral Notes',
  ];

  const escapeCSV = (val?: string | number | null) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = groups.map((g) => [
    escapeCSV(g.name),
    escapeCSV(g.ministry),
    escapeCSV(g.status || 'Active'),
    escapeCSV(g.barangay),
    escapeCSV(g.meetingVenue),
    escapeCSV(g.meetingSchedule),
    escapeCSV(g.meetingDay),
    escapeCSV(g.leaderName),
    escapeCSV(g.leaderContact),
    escapeCSV(g.coLeaderName),
    escapeCSV(g.coLeaderContact),
    escapeCSV(g.unitLeaderName),
    escapeCSV(g.membersCount),
    escapeCSV(g.notes),
  ]);

  const csvContent = [headers.map((h) => `"${h}"`).join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CFC_Tuy_Household_Groups_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
