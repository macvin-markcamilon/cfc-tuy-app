'use client';

import { CLPCouple } from '@/types';
import { DemographicsData, REPORT_AGE_BRACKETS } from './reportHelpers';
import { BARANGAY_COORDINATES } from '@/components/map/TuyMapPicker';

/**
 * Generates a high-resolution Bar Chart showing Husbands vs Wives across Age Brackets.
 * Returns a PNG data URL.
 */
export function generateAgeBarChartImage(demographics: DemographicsData): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 480;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border & Header Bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, 64);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(width, 64);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('AGE BRACKET DEMOGRAPHIC DISTRIBUTION', 32, 38);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Husbands vs Wives count comparison by demographic cohorts', 32, 54);

  // Legend on top right
  const legendItems = [
    { label: 'Husbands', color: '#243c81' },
    { label: 'Wives', color: '#d97706' },
    { label: 'Total', color: '#059669' },
  ];

  let lx = width - 320;
  legendItems.forEach((item) => {
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.roundRect(lx, 26, 14, 14, 3);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(item.label, lx + 20, 38);
    lx += 95;
  });

  // Chart area metrics
  const chartX = 70;
  const chartY = 100;
  const chartW = width - chartX - 50;
  const chartH = height - chartY - 70;

  // Find max value
  let maxVal = 0;
  REPORT_AGE_BRACKETS.forEach((b) => {
    const s = demographics.bracketCounts[b.key] || { husbands: 0, wives: 0, total: 0 };
    if (s.total > maxVal) maxVal = s.total;
  });
  if (maxVal === 0) maxVal = 10;
  const niceMax = Math.ceil(maxVal / 5) * 5 + 5;

  // Grid lines
  const gridSteps = 5;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  for (let i = 0; i <= gridSteps; i++) {
    const val = Math.round((niceMax / gridSteps) * i);
    const y = chartY + chartH - (i / gridSteps) * chartH;

    ctx.strokeStyle = i === 0 ? '#94a3b8' : '#f1f5f9';
    ctx.lineWidth = i === 0 ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(chartX, y);
    ctx.lineTo(chartX + chartW, y);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(String(val), chartX - 10, y);
  }

  // Draw Bars
  const bracketCount = REPORT_AGE_BRACKETS.length;
  const groupWidth = chartW / bracketCount;
  const barWidth = 18;
  const barGap = 4;

  REPORT_AGE_BRACKETS.forEach((b, idx) => {
    const stats = demographics.bracketCounts[b.key] || { husbands: 0, wives: 0, total: 0 };
    const groupCenterX = chartX + idx * groupWidth + groupWidth / 2;

    const hHeight = (stats.husbands / niceMax) * chartH;
    const wHeight = (stats.wives / niceMax) * chartH;
    const tHeight = (stats.total / niceMax) * chartH;

    const xH = groupCenterX - barWidth * 1.5 - barGap;
    const xW = groupCenterX - barWidth * 0.5;
    const xT = groupCenterX + barWidth * 0.5 + barGap;

    const baseY = chartY + chartH;

    // Husband bar
    if (stats.husbands > 0) {
      ctx.fillStyle = '#243c81';
      ctx.beginPath();
      ctx.roundRect(xH, baseY - hHeight, barWidth, hHeight, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(stats.husbands), xH + barWidth / 2, baseY - hHeight - 6);
    }

    // Wife bar
    if (stats.wives > 0) {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(xW, baseY - wHeight, barWidth, wHeight, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(stats.wives), xW + barWidth / 2, baseY - wHeight - 6);
    }

    // Total bar
    if (stats.total > 0) {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(xT, baseY - tHeight, barWidth, tHeight, [4, 4, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#065f46';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(stats.total), xT + barWidth / 2, baseY - tHeight - 6);
    }

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(b.label, groupCenterX, baseY + 20);

    ctx.fillStyle = '#64748b';
    ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(b.sublabel, groupCenterX, baseY + 35);
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates a high-resolution Pie / Donut Chart for Demographic Age Cohort Share.
 * Returns a PNG data URL.
 */
export function generateAgePieChartImage(demographics: DemographicsData): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 480;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Border & Header Bar
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, 64);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);
  ctx.beginPath();
  ctx.moveTo(0, 64);
  ctx.lineTo(width, 64);
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('AGE COHORT PERCENTAGE COMPOSITION', 32, 38);

  ctx.fillStyle = '#64748b';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Share of total cohort individuals represented by each age group', 32, 54);

  // Donut Chart geometry
  const cx = 280;
  const cy = 270;
  const radius = 145;
  const innerRadius = 80;

  const colors = ['#059669', '#2563eb', '#7c3aed', '#d97706', '#e11d48', '#64748b'];

  const slices = REPORT_AGE_BRACKETS.map((b, i) => {
    const s = demographics.bracketCounts[b.key] || { total: 0, percentage: 0 };
    return {
      label: b.label,
      sublabel: b.sublabel,
      total: s.total,
      percentage: s.percentage,
      color: colors[i % colors.length],
    };
  });

  const totalIndividuals = demographics.totalIndividuals || 1;

  let startAngle = -Math.PI / 2;

  slices.forEach((slice) => {
    if (slice.total <= 0) return;
    const sliceAngle = (slice.total / totalIndividuals) * (Math.PI * 2);
    const endAngle = startAngle + sliceAngle;

    // Draw slice
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Slice percentage label if large enough
    if (sliceAngle > 0.25) {
      const midAngle = startAngle + sliceAngle / 2;
      const labelRadius = (radius + innerRadius) / 2;
      const lx = cx + Math.cos(midAngle) * labelRadius;
      const ly = cy + Math.sin(midAngle) * labelRadius;

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${slice.percentage}%`, lx, ly);
    }

    startAngle = endAngle;
  });

  // Center hole text
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(String(demographics.totalIndividuals), cx, cy - 8);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('INDIVIDUALS', cx, cy + 18);

  // Legend on Right side
  const lx = 540;
  let ly = 110;

  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  slices.forEach((slice) => {
    // Color dot
    ctx.fillStyle = slice.color;
    ctx.beginPath();
    ctx.arc(lx + 8, ly + 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // Main label
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${slice.label} (${slice.sublabel})`, lx + 26, ly + 12);

    // Count and percentage
    ctx.fillStyle = '#475569';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${slice.total} individuals • ${slice.percentage}%`, lx + 26, ly + 30);

    // Divider
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(lx, ly + 42);
    ctx.lineTo(width - 40, ly + 42);
    ctx.stroke();

    ly += 54;
  });

  return canvas.toDataURL('image/png');
}

/**
 * Generates a high-resolution Geographic Map canvas of Tuy, Batangas with plotted participant marker pins.
 * Returns a PNG data URL.
 */
export function generateTuyPlottedMapImage(couples: CLPCouple[]): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  const width = 1000;
  const height = 560;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background map surface
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#f0fdf4');
  bgGrad.addColorStop(0.4, '#f8fafc');
  bgGrad.addColorStop(1, '#eff6ff');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Border & Header
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(0, 0, width, height);

  // Decorative Geographic Grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  for (let x = 60; x < width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 60; y < height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Top Header Bar
  ctx.fillStyle = '#243c81';
  ctx.fillRect(0, 0, width, 56);

  ctx.fillStyle = '#d97706';
  ctx.fillRect(0, 56, width, 3);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MUNICIPALITY OF TUY, BATANGAS • PARTICIPANT GEOGRAPHIC DIRECTORY', 24, 34);

  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${couples.length} COUPLES PLOTTED`, width - 24, 34);
  ctx.textAlign = 'left';

  // Coordinate Bounds of Tuy Batangas
  // Longitude range: ~120.700 to 120.760
  // Latitude range: ~14.000 to 14.055
  const minLng = 120.700;
  const maxLng = 120.765;
  const minLat = 14.000;
  const maxLat = 14.055;

  const mapMarginX = 80;
  const mapMarginTop = 80;
  const mapWidth = width - mapMarginX * 2;
  const mapHeight = height - mapMarginTop - 60;

  function toScreenX(lng: number): number {
    const norm = (lng - minLng) / (maxLng - minLng);
    return mapMarginX + norm * mapWidth;
  }

  function toScreenY(lat: number): number {
    const norm = (maxLat - lat) / (maxLat - minLat); // inverted for screen Y
    return mapMarginTop + norm * mapHeight;
  }

  // Draw connecting arterial road lines between major barangays
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([4, 4]);

  const roadPaths = [
    ['Lumbangan', 'Luntal', 'Rizal (Pob.)', 'Burgos (Pob.)', 'Luna (Pob.)', 'Rillo (Pob.)'],
    ['Rizal (Pob.)', 'Tuyon-tuyon (Obispo)', 'Putol', 'Sabang', 'Acle'],
    ['Luna (Pob.)', 'Talon', 'Mataywanac', 'Magahis'],
    ['Rillo (Pob.)', 'Bayudbud', 'Acle'],
    ['Toong', 'Lumbangan', 'San Jose', 'Dao'],
  ];

  roadPaths.forEach((path) => {
    ctx.beginPath();
    let started = false;
    path.forEach((brgy) => {
      const coord = BARANGAY_COORDINATES[brgy];
      if (coord) {
        const x = toScreenX(coord[0]);
        const y = toScreenY(coord[1]);
        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
    });
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Draw Barangay Center Labels
  Object.entries(BARANGAY_COORDINATES).forEach(([name, [bLng, bLat]]) => {
    const bx = toScreenX(bLng);
    const by = toScreenY(bLat);

    ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx - 36, by - 10, 72, 20, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name.replace(' (Pob.)', ''), bx, by);
  });

  // Count participants per barangay to size badges or show cluster count
  const brgyPins: Record<string, CLPCouple[]> = {};
  couples.forEach((c) => {
    const b = c.barangay || 'Rizal (Pob.)';
    if (!brgyPins[b]) brgyPins[b] = [];
    brgyPins[b].push(c);
  });

  // Plot individual participant markers
  couples.forEach((couple, idx) => {
    // If coordinates are valid, use them, otherwise use barangay center
    let lng = couple.coordinates ? couple.coordinates[0] : 0;
    let lat = couple.coordinates ? couple.coordinates[1] : 0;

    if (!lng || !lat || lng < 120 || lat < 13) {
      const bCoord = BARANGAY_COORDINATES[couple.barangay] || [120.7289, 14.0228];
      // small deterministic jitter so pins don't overlap completely
      const jx = ((idx % 5) - 2) * 0.003;
      const jy = ((Math.floor(idx / 5) % 5) - 2) * 0.003;
      lng = bCoord[0] + jx;
      lat = bCoord[1] + jy;
    }

    const px = toScreenX(lng);
    const py = toScreenY(lat);

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(px, py + 12, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pin marker
    ctx.fillStyle = '#243c81';
    ctx.beginPath();
    ctx.arc(px, py - 4, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Initials in center of pin
    const initials = `${couple.husbandFirstName.charAt(0)}${couple.wifeFirstName.charAt(0)}`;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initials, px, py - 4);
  });

  // Bottom Map Legend
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(24, height - 48, width - 48, 36, 8);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#243c81';
  ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📍 Tuy Geographic Density:', 36, height - 30);

  ctx.fillStyle = '#475569';
  ctx.font = '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(
    `${couples.length} participant couples plotted across ${Object.keys(brgyPins).length} barangays in the Municipality of Tuy, Batangas`,
    200,
    height - 30
  );

  return canvas.toDataURL('image/png');
}
