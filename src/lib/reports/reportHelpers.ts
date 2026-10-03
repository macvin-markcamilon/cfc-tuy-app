import { CLPCouple } from '@/types';

export interface AgeBracketInfo {
  key: string;
  label: string;
  sublabel: string;
  range: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentColor: string;
}

export const REPORT_AGE_BRACKETS: AgeBracketInfo[] = [
  {
    key: '20-30',
    label: '20–30 yrs',
    sublabel: 'Young Adults',
    range: 'Ages 20 to 30',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
    badgeBorder: 'border-emerald-200',
    accentColor: '#059669',
  },
  {
    key: '31-40',
    label: '31–40 yrs',
    sublabel: 'Young Couples',
    range: 'Ages 31 to 40',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    badgeBorder: 'border-blue-200',
    accentColor: '#2563eb',
  },
  {
    key: '41-50',
    label: '41–50 yrs',
    sublabel: 'Prime Family',
    range: 'Ages 41 to 50',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-700',
    badgeBorder: 'border-purple-200',
    accentColor: '#7c3aed',
  },
  {
    key: '51-60',
    label: '51–60 yrs',
    sublabel: 'Mature Adults',
    range: 'Ages 51 to 60',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-700',
    badgeBorder: 'border-amber-200',
    accentColor: '#d97706',
  },
  {
    key: '61-plus',
    label: '61+ yrs',
    sublabel: 'Senior Elders',
    range: 'Ages 61 and above',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    badgeBorder: 'border-rose-200',
    accentColor: '#e11d48',
  },
  {
    key: 'unknown',
    label: 'Age N/A',
    sublabel: 'Unspecified',
    range: 'Birthday not provided',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-600',
    badgeBorder: 'border-slate-200',
    accentColor: '#64748b',
  },
];

export function computeAgeNumber(birthdateStr?: string): number | null {
  if (!birthdateStr) return null;
  const birth = new Date(birthdateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age < 130 ? age : null;
}

export function computeAgeString(birthdateStr?: string): string {
  const age = computeAgeNumber(birthdateStr);
  return age !== null ? String(age) : '—';
}

export function getCoupleAgeBracketKey(birthdateStr?: string): string {
  const age = computeAgeNumber(birthdateStr);
  if (age === null) return 'unknown';
  if (age <= 30) return '20-30';
  if (age <= 40) return '31-40';
  if (age <= 50) return '41-50';
  if (age <= 60) return '51-60';
  return '61-plus';
}

export function computeYearsMarried(annivStr?: string): string {
  if (!annivStr) return '—';
  const anniv = new Date(annivStr);
  if (isNaN(anniv.getTime())) return '—';
  const today = new Date();
  let years = today.getFullYear() - anniv.getFullYear();
  const m = today.getMonth() - anniv.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < anniv.getDate())) {
    years--;
  }
  return years >= 0 ? `${years} yrs` : '—';
}

export interface DemographicsData {
  totalCouples: number;
  totalIndividuals: number;
  activeCouplesCount: number;
  avgHusbandAge: number | null;
  avgWifeAge: number | null;
  avgOverallAge: number | null;
  bracketCounts: Record<
    string,
    { husbands: number; wives: number; total: number; percentage: number }
  >;
  sortedBarangays: Array<{ name: string; count: number; percentage: number }>;
}

export function calculateDemographics(couples: CLPCouple[]): DemographicsData {
  const totalCouples = couples.length;
  const totalIndividuals = totalCouples * 2;

  const husbandAges: number[] = [];
  const wifeAges: number[] = [];

  const bracketCounts: Record<
    string,
    { husbands: number; wives: number; total: number; percentage: number }
  > = {
    '20-30': { husbands: 0, wives: 0, total: 0, percentage: 0 },
    '31-40': { husbands: 0, wives: 0, total: 0, percentage: 0 },
    '41-50': { husbands: 0, wives: 0, total: 0, percentage: 0 },
    '51-60': { husbands: 0, wives: 0, total: 0, percentage: 0 },
    '61-plus': { husbands: 0, wives: 0, total: 0, percentage: 0 },
    unknown: { husbands: 0, wives: 0, total: 0, percentage: 0 },
  };

  const barangayCounts: Record<string, number> = {};

  couples.forEach((c) => {
    const hAge = computeAgeNumber(c.husbandBirthday);
    const wAge = computeAgeNumber(c.wifeBirthday);

    if (hAge !== null) husbandAges.push(hAge);
    if (wAge !== null) wifeAges.push(wAge);

    const hBracket = getCoupleAgeBracketKey(c.husbandBirthday);
    const wBracket = getCoupleAgeBracketKey(c.wifeBirthday);

    if (bracketCounts[hBracket]) bracketCounts[hBracket].husbands++;
    if (bracketCounts[wBracket]) bracketCounts[wBracket].wives++;

    const brgy = c.barangay || 'Tuy Proper';
    barangayCounts[brgy] = (barangayCounts[brgy] || 0) + 1;
  });

  Object.keys(bracketCounts).forEach((key) => {
    const b = bracketCounts[key];
    b.total = b.husbands + b.wives;
    b.percentage = totalIndividuals > 0 ? Math.round((b.total / totalIndividuals) * 100) : 0;
  });

  const avgHusbandAge =
    husbandAges.length > 0
      ? Math.round(husbandAges.reduce((a, b) => a + b, 0) / husbandAges.length)
      : null;
  const avgWifeAge =
    wifeAges.length > 0
      ? Math.round(wifeAges.reduce((a, b) => a + b, 0) / wifeAges.length)
      : null;
  const allAges = [...husbandAges, ...wifeAges];
  const avgOverallAge =
    allAges.length > 0 ? Math.round(allAges.reduce((a, b) => a + b, 0) / allAges.length) : null;

  const sortedBarangays = Object.entries(barangayCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalCouples > 0 ? Math.round((count / totalCouples) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const activeCouplesCount = couples.filter((c) => (c.status || 'Active') === 'Active').length;

  return {
    totalCouples,
    totalIndividuals,
    activeCouplesCount,
    avgHusbandAge,
    avgWifeAge,
    avgOverallAge,
    bracketCounts,
    sortedBarangays,
  };
}
