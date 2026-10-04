import { HouseholdGroup, HouseholdMember, MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { generateUUID, isValidUUID } from './clp-service';

const STORAGE_KEYS = {
  GROUPS: 'cfc_tuy_prod_household_groups_v1',
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const INITIAL_HOUSEHOLD_GROUPS: HouseholdGroup[] = [
  {
    id: '00000000-0001-0000-0000-000000000001',
    name: 'Household 1 - St. Joseph',
    leaderName: 'Bro. Mark & Sis. Grace Camilon',
    leaderContact: '0917-123-4567',
    coLeaderName: 'Bro. Ronald & Sis. Karen Bautista',
    coLeaderContact: '0918-234-5678',
    ministry: 'CFC',
    barangay: 'Rizal (Pob.)',
    meetingVenue: 'Camilon Residence, Rizal St., Tuy',
    meetingSchedule: 'Every 2nd & 4th Saturday • 7:30 PM',
    meetingDay: 'Saturday',
    membersCount: 8,
    unitLeaderName: 'Bro. Michael Hernandez',
    status: 'Active',
    notes: 'Focusing on family prayer and scripture reflection for married couples.',
    createdAt: '2024-01-10T10:00:00.000Z',
    members: [
      { id: 'm-1', name: 'Bro. Mark Camilon', spouseName: 'Sis. Grace Camilon', role: 'Leader', contact: '0917-123-4567' },
      { id: 'm-2', name: 'Bro. Ronald Bautista', spouseName: 'Sis. Karen Bautista', role: 'Assistant', contact: '0918-234-5678' },
      { id: 'm-3', name: 'Bro. Joel De Castro', spouseName: 'Sis. Mary Ann De Castro', role: 'Member', contact: '0920-456-7890' },
      { id: 'm-4', name: 'Bro. Arjay Reyes', spouseName: 'Sis. Katrina Reyes', role: 'Member', contact: '0922-333-4444' },
    ],
  },
  {
    id: '00000000-0001-0000-0000-000000000002',
    name: 'Household 2 - Holy Family',
    leaderName: 'Bro. Michael & Sis. Joy Hernandez',
    leaderContact: '0919-345-6789',
    coLeaderName: 'Bro. Lito & Sis. Carmen Perez',
    coLeaderContact: '0921-987-6543',
    ministry: 'CFC',
    barangay: 'Putol',
    meetingVenue: 'Hernandez Residence, Brgy. Putol',
    meetingSchedule: 'Every 1st & 3rd Friday • 7:00 PM',
    meetingDay: 'Friday',
    membersCount: 6,
    unitLeaderName: 'Bro. Mark Camilon',
    status: 'Active',
    notes: 'Pastoral household catering to couples in Putol and adjacent barangays.',
    createdAt: '2024-02-15T14:30:00.000Z',
    members: [
      { id: 'm-5', name: 'Bro. Michael Hernandez', spouseName: 'Sis. Joy Hernandez', role: 'Leader', contact: '0919-345-6789' },
      { id: 'm-6', name: 'Bro. Lito Perez', spouseName: 'Sis. Carmen Perez', role: 'Assistant', contact: '0921-987-6543' },
      { id: 'm-7', name: 'Bro. Dennis Ramos', spouseName: 'Sis. Maricar Ramos', role: 'Member', contact: '0925-111-2222' },
    ],
  },
  {
    id: '00000000-0001-0000-0000-000000000003',
    name: 'SFC Cell Group - St. Therese',
    leaderName: 'Bro. Jeric Mendoza',
    leaderContact: '0926-555-8888',
    coLeaderName: 'Sis. Diane Perez',
    coLeaderContact: '0927-444-9999',
    ministry: 'SFC',
    barangay: 'Burgos (Pob.)',
    meetingVenue: 'Tuy Parish Pastoral Center Room 3',
    meetingSchedule: 'Weekly Thursday • 7:30 PM',
    meetingDay: 'Thursday',
    membersCount: 10,
    unitLeaderName: 'Bro. Mark Camilon',
    status: 'Active',
    notes: 'Young professionals and working singles spiritual nourishment circle.',
    createdAt: '2024-03-01T08:00:00.000Z',
    members: [
      { id: 'm-8', name: 'Bro. Jeric Mendoza', role: 'Leader', contact: '0926-555-8888' },
      { id: 'm-9', name: 'Sis. Diane Perez', role: 'Assistant', contact: '0927-444-9999' },
      { id: 'm-10', name: 'Bro. Christian Santos', role: 'Member', contact: '0928-123-9876' },
      { id: 'm-11', name: 'Sis. Bea Dimaculangan', role: 'Member', contact: '0929-321-6543' },
    ],
  },
  {
    id: '00000000-0001-0000-0000-000000000004',
    name: 'HOLD Tuy Circle - St. Anne',
    leaderName: 'Sis. Rosario "Tita Charing" Mercado',
    leaderContact: '0930-111-2233',
    coLeaderName: 'Sis. Elena Santos',
    coLeaderContact: '0931-222-3344',
    ministry: 'HOLD',
    barangay: 'Luna (Pob.)',
    meetingVenue: 'Parish Multipurpose Hall, Luna St.',
    meetingSchedule: '1st & 3rd Wednesday • 2:30 PM',
    meetingDay: 'Wednesday',
    membersCount: 12,
    unitLeaderName: 'Sis. Rosario Mercado',
    status: 'Active',
    notes: 'Intercessory prayer warriors and pastoral sisterhood in Tuy.',
    createdAt: '2024-03-20T11:00:00.000Z',
    members: [
      { id: 'm-12', name: 'Sis. Rosario Mercado', role: 'Leader', contact: '0930-111-2233' },
      { id: 'm-13', name: 'Sis. Elena Santos', role: 'Assistant', contact: '0931-222-3344' },
      { id: 'm-14', name: 'Sis. Teresa Mendoza', role: 'Member', contact: '0921-567-8901' },
    ],
  },
  {
    id: '00000000-0001-0000-0000-000000000005',
    name: 'SOLD Brotherhood - St. Peter',
    leaderName: 'Bro. Rolando "Tito Lando" Bautista',
    leaderContact: '0932-333-4455',
    coLeaderName: 'Bro. Nestor Garcia',
    coLeaderContact: '0933-444-5566',
    ministry: 'SOLD',
    barangay: 'Guinhawa',
    meetingVenue: 'Bautista Residence, Brgy. Guinhawa',
    meetingSchedule: '2nd & 4th Saturday • 8:00 AM',
    meetingDay: 'Saturday',
    membersCount: 7,
    unitLeaderName: 'Bro. Mark Camilon',
    status: 'Active',
    notes: 'Mature men brotherhood, Bible sharing, and church physical service.',
    createdAt: '2024-04-05T09:00:00.000Z',
    members: [
      { id: 'm-15', name: 'Bro. Rolando Bautista', role: 'Leader', contact: '0932-333-4455' },
      { id: 'm-16', name: 'Bro. Nestor Garcia', role: 'Assistant', contact: '0933-444-5566' },
    ],
  },
];

function getLocalGroups(): HouseholdGroup[] {
  if (!isBrowser()) return INITIAL_HOUSEHOLD_GROUPS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GROUPS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.GROUPS, JSON.stringify(INITIAL_HOUSEHOLD_GROUPS));
      return INITIAL_HOUSEHOLD_GROUPS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_HOUSEHOLD_GROUPS;
  } catch {
    return INITIAL_HOUSEHOLD_GROUPS;
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
