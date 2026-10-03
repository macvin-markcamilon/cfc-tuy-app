export type MinistryType = 'CFC' | 'SFC' | 'YFC' | 'KFC' | 'HOLD' | 'SOLD';

export interface ChapterEvent {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date or display string
  time: string;
  location: string;
  locationCoords?: [number, number]; // [lng, lat]
  ministry: MinistryType | 'ALL';
  category: 'Assembly' | 'CLP' | 'Household' | 'Service' | 'Fellowship' | 'Conference';
  isFeatured?: boolean;
}

export interface HouseholdGroup {
  id: string;
  name: string;
  leaderName: string;
  leaderContact?: string;
  coLeaderName?: string;
  ministry: MinistryType;
  barangay: string;
  meetingSchedule: string;
  meetingDay: string;
  coordinates: [number, number]; // [lng, lat] in Tuy
  membersCount: number;
}

export interface MapLocationPin {
  id: string;
  name: string;
  category: 'parish' | 'household' | 'event' | 'mission';
  ministry?: MinistryType;
  description: string;
  address: string;
  barangay: string;
  coordinates: [number, number]; // [longitude, latitude]
  schedule?: string;
  contactPerson?: string;
}

export interface PrayerRequest {
  id: string;
  authorName: string;
  barangay?: string;
  intention: string;
  category: 'Health & Healing' | 'Family & Marriage' | 'Thanksgiving' | 'Spiritual Growth' | 'Special Intentions';
  createdAt: string;
  prayerCount: number;
}

export interface MinistryInfo {
  code: MinistryType;
  name: string;
  tagline: string;
  targetAudience: string;
  description: string;
  colorScheme: {
    primary: string;
    secondary: string;
    badgeBg: string;
    badgeText: string;
  };
  meetingInfo: string;
  coordinator: string;
}

// =====================================
// Christian Life Program (CLP) Interfaces
// =====================================

export interface CLPCouple {
  id: string;
  clpId: string;
  husbandFirstName: string;
  husbandLastName: string;
  husbandBirthday: string;
  husbandOccupation: string;
  husbandContact?: string;
  husbandEmail?: string;
  wifeFirstName: string;
  wifeLastName: string;
  wifeBirthday: string;
  wifeOccupation: string;
  wifeContact?: string;
  wifeEmail?: string;
  weddingAnniversary: string;
  address: string;
  barangay: string;
  coordinates: [number, number]; // [longitude, latitude]
  status: 'Active' | 'Graduated' | 'Dropped';
}

export interface CLPTalk {
  id: string;
  clpId: string;
  talkNumber: number;
  title: string;
  speaker: string;
  venue: string;
  date: string;
  time: string;
  moduleName?: string;
}

export interface CLPAttendance {
  id: string;
  talkId: string;
  coupleId: string;
  husbandPresent: boolean;
  wifePresent: boolean;
  remarks?: string;
}

export interface CLPProgram {
  id: string;
  name: string;
  venue: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  batchNumber: string;
  teamLeader: string;
  couplesCount?: number;
  talksCount?: number;
}

// =====================================
// User & Profile Management
// =====================================

export type UserRole = 'admin' | 'chapter_servant' | 'unit_leader' | 'household_head' | 'member';

export interface UserProfile {
  id: string;
  fullName: string;
  spouseName?: string;
  email: string;
  phoneNumber?: string;
  barangay: string;
  ministry: MinistryType;
  role: UserRole;
  clpBatch?: string;
  createdAt?: string;
  updatedAt?: string;
}

// =====================================
// CLP Groupings & Discussion Circles
// =====================================

export interface SavedCLPGroupCouple {
  id: string;
  name: string;
  barangay: string;
  husbandOccupation?: string;
  wifeOccupation?: string;
  address?: string;
  weddingAnniversary?: string;
}

export interface SavedCLPGroup {
  groupNumber: number;
  groupName: string;
  rationale?: string;
  facilitator?: string;
  couples: SavedCLPGroupCouple[];
}

export interface SavedCLPGrouping {
  id: string;
  clpId: string;
  title: string;
  talkId?: string;
  talkTitle?: string;
  prompt?: string;
  summary?: string;
  filterType?: 'all' | 'attended' | 'talk';
  groups: SavedCLPGroup[];
  createdAt: string;
  updatedAt?: string;
}
