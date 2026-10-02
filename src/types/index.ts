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
  wifeFirstName: string;
  wifeLastName: string;
  wifeBirthday: string;
  wifeOccupation: string;
  wifeContact?: string;
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
