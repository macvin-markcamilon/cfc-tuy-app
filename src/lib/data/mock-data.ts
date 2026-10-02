import {
  MinistryInfo,
  HouseholdGroup,
  ChapterEvent,
  MapLocationPin,
  PrayerRequest,
  CLPProgram,
  CLPCouple,
  CLPTalk,
  CLPAttendance,
} from '@/types';

// Tuy, Batangas Center: approx [120.7289, 14.0228]
export const TUY_CENTER_COORDINATES: [number, number] = [120.7289, 14.0228];

export const TUY_BARANGAYS = [
  'Poblacion 1',
  'Poblacion 2',
  'Poblacion 3',
  'Poblacion 4',
  'Putol',
  'Luntal',
  'Malibu',
  'Obispo',
  'Rillo',
  'Guinhawa',
  'Talon',
  'Toong',
  'Dao',
  'Bayudbud',
  'Bolocboc',
  'Burgos',
  'Luna',
  'Mataywanac',
  'Sabang',
  'San Jose',
  'Tuyon-tuyon',
];

export const MINISTRIES_DATA: MinistryInfo[] = [
  {
    code: 'CFC',
    name: 'Couples for Christ',
    tagline: 'Families in the Holy Spirit Renewing the Face of the Earth',
    targetAudience: 'Married Catholic Couples',
    description: 'The core ministry dedicated to strengthening Christian marriage and family life through regular household gatherings, pastoral teachings, and fellowship.',
    colorScheme: {
      primary: '#1E3A8A', // Deep Blue
      secondary: '#3B82F6',
      badgeBg: 'bg-blue-100 dark:bg-blue-950/60',
      badgeText: 'text-blue-800 dark:text-blue-300',
    },
    meetingInfo: 'Bi-weekly Household Meetings & Monthly Chapter Assemblies',
    coordinator: 'Bro. Mark & Sis. Grace Camilon (Chapter Servants)',
  },
  {
    code: 'SFC',
    name: 'Singles for Christ',
    tagline: 'Christ in the Center of Single Life & Profession',
    targetAudience: 'Single Men & Women aged 21-40',
    description: 'Empowering young single professionals and workers to live a Christ-centered lifestyle in their workplace, personal pursuits, and community mission.',
    colorScheme: {
      primary: '#0D9488', // Teal
      secondary: '#14B8A6',
      badgeBg: 'bg-teal-100 dark:bg-teal-950/60',
      badgeText: 'text-teal-800 dark:text-teal-300',
    },
    meetingInfo: 'Weekly Households every Thursday & Monthly Praise and Worship',
    coordinator: 'Bro. Jeric Mendoza & Sis. Diane Perez',
  },
  {
    code: 'YFC',
    name: 'Youth for Christ',
    tagline: 'Young, Vibrant & Passionate for Jesus',
    targetAudience: 'High School & College Youth aged 13-21',
    description: 'Guiding teenagers and students through the challenges of growing up, providing an uplifting peer group rooted in prayer, joy, and dynamic evangelization.',
    colorScheme: {
      primary: '#EA580C', // Vibrant Orange
      secondary: '#F97316',
      badgeBg: 'bg-orange-100 dark:bg-orange-950/60',
      badgeText: 'text-orange-800 dark:text-orange-300',
    },
    meetingInfo: 'Saturday Fellowships & Youth Camps (Tuy Parish Grounds)',
    coordinator: 'Bro. Arjay De Castro & Sis. Katrina Reyes',
  },
  {
    code: 'KFC',
    name: 'Kids for Christ',
    tagline: 'Helping Children Discover Jesus in Love and Joy',
    targetAudience: 'Children aged 4 to 12',
    description: 'Nurturing the early faith of our children through fun Bible storytelling, action songs, arts, crafts, and interactive Christian values workshops.',
    colorScheme: {
      primary: '#EAB308', // Warm Yellow
      secondary: '#FACC15',
      badgeBg: 'bg-yellow-100 dark:bg-yellow-950/60',
      badgeText: 'text-yellow-800 dark:text-yellow-300',
    },
    meetingInfo: 'Monthly Sunday Gatherings & KFC Kids Village Day',
    coordinator: 'Sis. Elena Santos & Sis. Maria Villanueva',
  },
  {
    code: 'HOLD',
    name: 'Handmaids of the Lord',
    tagline: 'Holy Women Dedicated to Prayer and Service',
    targetAudience: 'Widows, Mature Single Women, and Separated Mothers',
    description: 'A compassionate spiritual family providing deep sisterhood, intercessory prayer ministry, and active pastoral care in the church community.',
    colorScheme: {
      primary: '#9333EA', // Purple
      secondary: '#A855F7',
      badgeBg: 'bg-purple-100 dark:bg-purple-950/60',
      badgeText: 'text-purple-800 dark:text-purple-300',
    },
    meetingInfo: 'Every 1st and 3rd Wednesday Afternoon Prayer Meeting',
    coordinator: 'Sis. Rosario "Tita Charing" Mercado',
  },
  {
    code: 'SOLD',
    name: 'Servants of the Lord',
    tagline: 'Courageous Men of Integrity and Prayer',
    targetAudience: 'Widowers and Mature Men',
    description: 'Equipping mature men with brotherhood, spiritual discipline, and leadership opportunities in chapter assemblies and parish activities.',
    colorScheme: {
      primary: '#334155', // Slate
      secondary: '#475569',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-800 dark:text-slate-300',
    },
    meetingInfo: 'Every 2nd and 4th Saturday Morning Fellowship',
    coordinator: 'Bro. Rolando "Tito Lando" Bautista',
  },
];

// Production data initialized to empty arrays so user can upload production data
export const CHAPTER_EVENTS: ChapterEvent[] = [];

export const HOUSEHOLD_GROUPS: HouseholdGroup[] = [];

export const MAP_PINS: MapLocationPin[] = [];

export const PRAYER_REQUESTS_DATA: PrayerRequest[] = [];

export const MOCK_CLP_PROGRAMS: CLPProgram[] = [];

export const MOCK_CLP_COUPLES: CLPCouple[] = [];

export const MOCK_CLP_TALKS: CLPTalk[] = [];

export const MOCK_CLP_ATTENDANCE: CLPAttendance[] = [];
