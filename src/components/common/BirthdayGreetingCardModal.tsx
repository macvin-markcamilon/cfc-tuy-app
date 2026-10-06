'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Sparkles,
  Cake,
  Palette,
  Calendar as CalendarIcon,
  User,
  Check,
  Share2,
  Gift,
} from 'lucide-react';
import { DirectoryCouple } from '@/types';

export interface BirthdayCelebrantData {
  personName: string;
  nickname?: string;
  photoUrl?: string;
  birthdayDate?: string; // YYYY-MM-DD or formatted string
  birthYear?: number;
  month?: number;
  day?: number;
  type?: 'husband' | 'wife' | 'husband_birthday' | 'wife_birthday' | 'individual' | string;
  couple?: DirectoryCouple;
  barangay?: string;
  householdGroupName?: string;
}

interface BirthdayGreetingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebrant: BirthdayCelebrantData | DirectoryCouple | null;
  targetPerson?: 'husband' | 'wife';
}

// Helper to wrap text nicely for canvas rendering
const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  let line = '';
  const lines: string[] = [];

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      lines.push(line.trim());
      line = words[n] + ' ';
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    lines.push(line.trim());
  }
  return lines;
};

// Preset Christian birthday blessings
const BLESSING_PRESETS = [
  'May God continue to bless you with good health, joy, and peace on your special day!',
  'The Lord bless you and keep you, and cause His face to shine upon you always!',
  'Wishing you a day filled with God\'s grace, abundant love, and overflowing blessings!',
  'May your faith grow stronger each day as you celebrate another year of God\'s faithfulness!',
];

export default function BirthdayGreetingCardModal({
  isOpen,
  onClose,
  celebrant,
  targetPerson = 'husband',
}: BirthdayGreetingCardModalProps) {
  // Form state
  const [activeGender, setActiveGender] = useState<'husband' | 'wife' | 'individual'>('husband');
  const [titlePrefix, setTitlePrefix] = useState<'Bro.' | 'Sis.' | ''>('Bro.');
  const [personName, setPersonName] = useState('');
  const [nickname, setNickname] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateDisplay, setDateDisplay] = useState('');
  const [ageDisplay, setAgeDisplay] = useState('');
  const [customMessage, setCustomMessage] = useState(BLESSING_PRESETS[0]);
  const [theme, setTheme] = useState<'CFC_BRAND' | 'ROYAL' | 'ROSE' | 'GOLD' | 'EMERALD' | 'PURPLE'>('CFC_BRAND');
  const [aspectRatio, setAspectRatio] = useState<'SQUARE' | 'LANDSCAPE'>('SQUARE');
  const [includePhoto, setIncludePhoto] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);

  // 1. Load White CFC Logo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setLogoImg(img);
    img.src = '/images/cfc-logo-white.png';
  }, []);

  // 2. Parse input celebrant or DirectoryCouple
  useEffect(() => {
    if (!celebrant) return;

    // Check if celebrant is a DirectoryCouple (has husbandFirstName / wifeFirstName)
    const isCouple = 'husbandFirstName' in celebrant && 'wifeFirstName' in celebrant;

    if (isCouple) {
      const couple = celebrant as DirectoryCouple;
      const isHusband = targetPerson === 'husband';
      setActiveGender(isHusband ? 'husband' : 'wife');

      if (isHusband) {
        setTitlePrefix('Bro.');
        const rawName = couple.husbandFirstName || '';
        const nick = couple.husbandNickname?.trim() || rawName.split(' ')[0] || '';
        setPersonName(rawName);
        setNickname(nick);
        setLastName(couple.husbandLastName || couple.wifeLastName || '');

        if (couple.husbandBirthday) {
          formatBirthday(couple.husbandBirthday);
        } else {
          setDateDisplay(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
          setAgeDisplay('');
        }
      } else {
        setTitlePrefix('Sis.');
        const rawName = couple.wifeFirstName || '';
        const nick = couple.wifeNickname?.trim() || rawName.split(' ')[0] || '';
        setPersonName(rawName);
        setNickname(nick);
        setLastName(couple.wifeLastName || couple.husbandLastName || '');

        if (couple.wifeBirthday) {
          formatBirthday(couple.wifeBirthday);
        } else {
          setDateDisplay(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
          setAgeDisplay('');
        }
      }
    } else {
      // It's a BirthdayCelebrantData object
      const data = celebrant as BirthdayCelebrantData;
      const pName = data.personName || '';

      if (pName.startsWith('Bro.')) {
        setTitlePrefix('Bro.');
        setPersonName(pName.replace(/^Bro\.\s*/, ''));
      } else if (pName.startsWith('Sis.')) {
        setTitlePrefix('Sis.');
        setPersonName(pName.replace(/^Sis\.\s*/, ''));
      } else {
        setTitlePrefix(data.type === 'wife' || data.type === 'wife_birthday' ? 'Sis.' : 'Bro.');
        setPersonName(pName);
      }

      setNickname(data.nickname || data.personName.split(' ')[0] || '');
      setLastName(data.couple?.husbandLastName || data.couple?.wifeLastName || '');

      if (data.birthdayDate) {
        formatBirthday(data.birthdayDate, data.birthYear);
      } else if (data.month && data.day) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        setDateDisplay(`${monthNames[data.month - 1]} ${data.day}`);
        if (data.birthYear) {
          const currentYear = new Date().getFullYear();
          setAgeDisplay(`${currentYear - data.birthYear}`);
        } else {
          setAgeDisplay('');
        }
      } else {
        setDateDisplay(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' }));
        setAgeDisplay('');
      }
    }
  }, [celebrant, targetPerson]);

  const formatBirthday = (dateStr: string, explicitBirthYear?: number) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dateObj = new Date(year, monthIndex, day);

      // Display without year if default/missing year, or full
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      setDateDisplay(`${monthNames[monthIndex]} ${day}`);

      const effectiveYear = explicitBirthYear || (year > 1900 ? year : undefined);
      if (effectiveYear) {
        const currentYear = new Date().getFullYear();
        if (currentYear >= effectiveYear) {
          setAgeDisplay(`${currentYear - effectiveYear}`);
        } else {
          setAgeDisplay('');
        }
      } else {
        setAgeDisplay('');
      }
    } else {
      setDateDisplay(dateStr);
      setAgeDisplay('');
    }
  };

  // 3. Load Person Photo
  useEffect(() => {
    let photoUrl: string | undefined;

    if (celebrant) {
      if ('husbandFirstName' in celebrant) {
        const couple = celebrant as DirectoryCouple;
        photoUrl = activeGender === 'husband'
          ? (couple.husbandPhotoUrl || couple.couplePhotoUrl)
          : (couple.wifePhotoUrl || couple.couplePhotoUrl);
      } else {
        const data = celebrant as BirthdayCelebrantData;
        photoUrl = data.photoUrl || data.couple?.husbandPhotoUrl || data.couple?.wifePhotoUrl || data.couple?.couplePhotoUrl;
      }
    }

    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setPhotoImg(img);
      img.onerror = () => setPhotoImg(null);
      img.src = photoUrl;
    } else {
      setPhotoImg(null);
    }
  }, [celebrant, activeGender]);

  // 4. Toggle target person if couple is provided
  const handleGenderSwitch = (gender: 'husband' | 'wife') => {
    if (!celebrant || !('husbandFirstName' in celebrant)) return;
    const couple = celebrant as DirectoryCouple;
    setActiveGender(gender);

    if (gender === 'husband') {
      setTitlePrefix('Bro.');
      setPersonName(couple.husbandFirstName || '');
      setNickname(couple.husbandNickname?.trim() || couple.husbandFirstName?.split(' ')[0] || '');
      setLastName(couple.husbandLastName || couple.wifeLastName || '');
      if (couple.husbandBirthday) formatBirthday(couple.husbandBirthday);
    } else {
      setTitlePrefix('Sis.');
      setPersonName(couple.wifeFirstName || '');
      setNickname(couple.wifeNickname?.trim() || couple.wifeFirstName?.split(' ')[0] || '');
      setLastName(couple.wifeLastName || couple.husbandLastName || '');
      if (couple.wifeBirthday) formatBirthday(couple.wifeBirthday);
    }
  };

  // 5. Draw Birthday Card to Canvas
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !celebrant) return;

    const isSquare = aspectRatio === 'SQUARE';
    const width = 1200;
    const height = isSquare ? 1200 : 630;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Theme Configuration
    let bgGrad: CanvasGradient;
    let accentColor = '#f59e0b';
    let badgeFill = 'rgba(245, 158, 11, 0.22)';
    let titleColor = '#fde68a';
    let badgeTextColor = '#fde68a';
    let subTextColor = '#cbd5e1';
    let starColor = 'rgba(253, 230, 138, 0.4)';

    if (theme === 'CFC_BRAND') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#09132b');
      bgGrad.addColorStop(0.45, '#243c81');
      bgGrad.addColorStop(0.85, '#152452');
      bgGrad.addColorStop(1, '#0b142d');
      accentColor = '#f59e0b';
      badgeFill = 'rgba(245, 158, 11, 0.28)';
      titleColor = '#fef08a';
      badgeTextColor = '#fde68a';
      subTextColor = '#93c5fd';
      starColor = 'rgba(253, 230, 138, 0.45)';
    } else if (theme === 'ROSE') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#4c0519');
      bgGrad.addColorStop(0.5, '#881337');
      bgGrad.addColorStop(1, '#310413');
      accentColor = '#f43f5e';
      badgeFill = 'rgba(244, 63, 94, 0.25)';
      titleColor = '#fecdd3';
      badgeTextColor = '#ffe4e6';
      subTextColor = '#fecdd3';
      starColor = 'rgba(254, 205, 211, 0.4)';
    } else if (theme === 'GOLD') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#271a00');
      bgGrad.addColorStop(0.5, '#0f172a');
      bgGrad.addColorStop(1, '#3a2500');
      accentColor = '#fbbf24';
      badgeFill = 'rgba(251, 191, 36, 0.25)';
      titleColor = '#fef08a';
      badgeTextColor = '#fef08a';
      subTextColor = '#fde68a';
      starColor = 'rgba(254, 240, 138, 0.5)';
    } else if (theme === 'EMERALD') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#064e3b');
      bgGrad.addColorStop(0.5, '#042f2e');
      bgGrad.addColorStop(1, '#022c22');
      accentColor = '#34d399';
      badgeFill = 'rgba(52, 211, 153, 0.25)';
      titleColor = '#a7f3d0';
      badgeTextColor = '#d1fae5';
      subTextColor = '#a7f3d0';
      starColor = 'rgba(167, 243, 208, 0.4)';
    } else if (theme === 'PURPLE') {
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#3b0764');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#1e0a38');
      accentColor = '#c084fc';
      badgeFill = 'rgba(192, 132, 252, 0.25)';
      titleColor = '#f5d0fe';
      badgeTextColor = '#fae8ff';
      subTextColor = '#e9d5ff';
      starColor = 'rgba(245, 208, 254, 0.4)';
    } else {
      // ROYAL (Default)
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0b1329');
      bgGrad.addColorStop(0.5, '#1e293b');
      bgGrad.addColorStop(1, '#111827');
      accentColor = '#f59e0b';
      badgeFill = 'rgba(245, 158, 11, 0.22)';
      titleColor = '#fde68a';
      badgeTextColor = '#fde68a';
      subTextColor = '#cbd5e1';
      starColor = 'rgba(253, 230, 138, 0.4)';
    }

    // Draw Main Background
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Festive Confetti / Sparkle background effect
    ctx.fillStyle = starColor;
    const sparklePositions = [
      { x: 120, y: 140, r: 4 }, { x: 1080, y: 160, r: 6 },
      { x: 200, y: 340, r: 3 }, { x: 1000, y: 380, r: 5 },
      { x: 150, y: 700, r: 5 }, { x: 1050, y: 720, r: 4 },
      { x: 90, y: 950, r: 6 },  { x: 1110, y: 920, r: 3 },
      { x: 300, y: 1100, r: 4 }, { x: 900, y: 1120, r: 5 }
    ];
    sparklePositions.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Top Radial Glow
    const topGlow = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, height * 0.75);
    topGlow.addColorStop(
      0,
      theme === 'ROSE'
        ? 'rgba(244, 63, 94, 0.3)'
        : theme === 'EMERALD'
        ? 'rgba(52, 211, 153, 0.25)'
        : theme === 'PURPLE'
        ? 'rgba(192, 132, 252, 0.3)'
        : theme === 'CFC_BRAND'
        ? 'rgba(36, 60, 129, 0.45)'
        : 'rgba(245, 158, 11, 0.25)'
    );
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    // Outer & Inner Borders
    const outerMargin = isSquare ? 32 : 24;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = isSquare ? 5 : 4;
    ctx.strokeRect(outerMargin, outerMargin, width - outerMargin * 2, height - outerMargin * 2);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(outerMargin + 12, outerMargin + 12, width - (outerMargin + 12) * 2, height - (outerMargin + 12) * 2);

    // Corner Accents (Double L brackets)
    const cLen = isSquare ? 38 : 28;
    ctx.fillStyle = accentColor;
    // Top Left
    ctx.fillRect(outerMargin - 4, outerMargin - 4, cLen, 5);
    ctx.fillRect(outerMargin - 4, outerMargin - 4, 5, cLen);
    // Top Right
    ctx.fillRect(width - outerMargin - cLen + 4, outerMargin - 4, cLen, 5);
    ctx.fillRect(width - outerMargin, outerMargin - 4, 5, cLen);
    // Bottom Left
    ctx.fillRect(outerMargin - 4, height - outerMargin, cLen, 5);
    ctx.fillRect(outerMargin - 4, height - outerMargin - cLen + 4, 5, cLen);
    // Bottom Right
    ctx.fillRect(width - outerMargin - cLen + 4, height - outerMargin, cLen, 5);
    ctx.fillRect(width - outerMargin, height - outerMargin - cLen + 4, 5, cLen);

    // ---------------------------------------------------------------------------
    // LAYOUT MATHEMATICS
    // ---------------------------------------------------------------------------

    // 1. Logo
    const logoWidth = isSquare ? 350 : 220;
    let logoHeight = 60;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth;
    }
    const logoSpaceAfter = isSquare ? 28 : 14;

    // 2. Age Milestone Badge (if any)
    const hasAge = Boolean(ageDisplay.trim());
    const ageBadgeText = hasAge ? `★ CELEBRATING ${ageDisplay.trim()} YEARS OF GOD'S GRACE ★` : `★ GOD'S ABUNDANT BLESSINGS ★`;
    const ageHeight = isSquare ? 54 : 38;
    const ageSpaceAfter = isSquare ? 28 : 14;

    // 3. Title ("HAPPY BIRTHDAY!")
    const titleHeight = isSquare ? 72 : 44;
    const titleSpaceAfter = isSquare ? 22 : 12;

    // 4. Star / Cake Divider
    const dividerHeight = isSquare ? 20 : 14;
    const dividerSpaceAfter = isSquare ? 32 : 16;

    // 5. Celebrant Photo Frame
    const photoRadius = isSquare ? 135 : 85;
    const hasPhoto = includePhoto && Boolean(photoImg && photoImg.complete && photoImg.naturalWidth > 0);
    const photoHeight = hasPhoto ? photoRadius * 2 : 0;
    const photoSpaceAfter = hasPhoto ? (isSquare ? 32 : 16) : 0;

    // 6. Person Name
    const fullDisplayName = `${titlePrefix ? titlePrefix + ' ' : ''}${nickname.trim() || personName.trim()} ${lastName.trim()}`.trim();
    const nameFontSize = isSquare ? (hasPhoto ? '64px' : '74px') : '44px';
    const namesHeight = isSquare ? (hasPhoto ? 66 : 76) : 44;
    const namesSpaceAfter = isSquare ? 22 : 12;

    // 7. Date Badge
    const dateBadgeHeight = isSquare ? 52 : 38;

    // 8. Custom Message
    const hasSubtitle = Boolean(customMessage.trim());
    let subtitleLines: string[] = [];
    if (hasSubtitle) {
      ctx.font = `italic ${isSquare ? '26px' : '18px'} sans-serif`;
      subtitleLines = wrapText(ctx, `"${customMessage.trim()}"`, width - 220);
    }
    const dateSpaceAfter = hasSubtitle ? (isSquare ? 26 : 14) : 0;
    const subtitleLineHeight = isSquare ? 38 : 26;
    const subtitleHeight = hasSubtitle ? subtitleLines.length * subtitleLineHeight : 0;

    // TOTAL CONTENT HEIGHT
    const totalContentHeight =
      logoHeight + logoSpaceAfter +
      ageHeight + ageSpaceAfter +
      titleHeight + titleSpaceAfter +
      dividerHeight + dividerSpaceAfter +
      photoHeight + photoSpaceAfter +
      namesHeight + namesSpaceAfter +
      dateBadgeHeight + dateSpaceAfter +
      subtitleHeight;

    const topBound = outerMargin + 18;
    const bottomBound = height - outerMargin - 50;
    const availableH = bottomBound - topBound;

    let currentY = topBound + Math.max(0, (availableH - totalContentHeight) / 2);

    // ---------------------------------------------------------------------------
    // RENDER CONTENT
    // ---------------------------------------------------------------------------

    // 1. Logo
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, (width - logoWidth) / 2, currentY, logoWidth, logoHeight);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${isSquare ? '40px' : '30px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('COUPLES FOR CHRIST', width / 2, currentY + 36);
    }
    currentY += logoHeight + logoSpaceAfter;

    // 2. Celebration Milestone Pill
    ctx.fillStyle = badgeFill;
    const pillW = isSquare ? (hasAge ? 540 : 440) : (hasAge ? 380 : 310);
    const pillH = isSquare ? 52 : 38;
    ctx.beginPath();
    ctx.roundRect((width - pillW) / 2, currentY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = badgeTextColor;
    ctx.font = `800 ${isSquare ? '24px' : '16px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(ageBadgeText, width / 2, currentY + (isSquare ? 34 : 25));

    currentY += ageHeight + ageSpaceAfter;

    // 3. Main Title ("HAPPY BIRTHDAY!")
    ctx.fillStyle = titleColor;
    ctx.font = `900 ${isSquare ? '72px' : '44px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 14;
    ctx.fillText('HAPPY BIRTHDAY!', width / 2, currentY + (isSquare ? 58 : 35));
    ctx.shadowBlur = 0;

    currentY += titleHeight + titleSpaceAfter;

    // 4. Divider Line with Birthday Icon / Cake symbol
    const lineHalf = isSquare ? 180 : 120;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineHalf, currentY + 10);
    ctx.lineTo(width / 2 + lineHalf, currentY + 10);
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.font = `${isSquare ? '26px' : '18px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🎂', width / 2, currentY + 18);

    currentY += dividerHeight + dividerSpaceAfter;

    // 5. Celebrant Photo Frame
    if (hasPhoto && photoImg) {
      const photoCenterX = width / 2;
      const photoCenterY = currentY + photoRadius;

      ctx.save();
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      const imgW = photoImg.naturalWidth;
      const imgH = photoImg.naturalHeight;
      const aspect = imgW / imgH;
      let drawW = photoRadius * 2;
      let drawH = photoRadius * 2;
      if (aspect > 1) {
        drawW = drawH * aspect;
      } else {
        drawH = drawW / aspect;
      }
      ctx.drawImage(
        photoImg,
        photoCenterX - drawW / 2,
        photoCenterY - drawH / 2,
        drawW,
        drawH
      );
      ctx.restore();

      // Outer glowing ring around photo
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = isSquare ? 6 : 4;
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius + 4, 0, Math.PI * 2);
      ctx.stroke();

      currentY += photoHeight + photoSpaceAfter;
    }

    // 6. Person Name
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 ${nameFontSize} sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 16;
    ctx.fillText(fullDisplayName, width / 2, currentY + (isSquare ? (hasPhoto ? 52 : 60) : 34));
    ctx.shadowBlur = 0;

    currentY += namesHeight + namesSpaceAfter;

    // 7. Date Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    const dateText = `🎂  ${dateDisplay}`;
    ctx.font = `800 ${isSquare ? '28px' : '19px'} sans-serif`;
    const dateMetrics = ctx.measureText(dateText);
    const datePillW = Math.max(isSquare ? 360 : 260, dateMetrics.width + 80);
    const datePillH = isSquare ? 52 : 38;

    ctx.beginPath();
    ctx.roundRect((width - datePillW) / 2, currentY, datePillW, datePillH, datePillH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.fillText(dateText, width / 2, currentY + (isSquare ? 35 : 25));

    currentY += dateBadgeHeight + dateSpaceAfter;

    // 8. Custom Greeting / Blessing
    if (hasSubtitle) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `italic ${isSquare ? '26px' : '18px'} sans-serif`;
      ctx.textAlign = 'center';

      for (let l = 0; l < subtitleLines.length; l++) {
        ctx.fillText(subtitleLines[l], width / 2, currentY + l * subtitleLineHeight + (isSquare ? 26 : 18));
      }
    }

    // 9. Footer Branding
    const footerY = height - outerMargin - 20;
    ctx.fillStyle = accentColor;
    ctx.font = `800 ${isSquare ? '22px' : '16px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('COUPLES FOR CHRIST • TUY CHAPTER, BATANGAS', width / 2, footerY);

  }, [
    aspectRatio,
    celebrant,
    customMessage,
    dateDisplay,
    ageDisplay,
    includePhoto,
    lastName,
    logoImg,
    nickname,
    personName,
    photoImg,
    theme,
    titlePrefix,
  ]);

  // Re-draw canvas on state update
  useEffect(() => {
    if (isOpen) {
      drawCard();
    }
  }, [isOpen, drawCard]);

  if (!isOpen || !celebrant) return null;

  const isCoupleObject = 'husbandFirstName' in celebrant && 'wifeFirstName' in celebrant;
  const coupleObj = isCoupleObject ? (celebrant as DirectoryCouple) : undefined;

  // Handle Download as JPEG
  const handleDownloadJpeg = () => {
    if (!canvasRef.current) return;
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);

      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const safeName = (nickname || personName).replace(/\s+/g, '_');
      link.download = `Birthday_Card_${titlePrefix}_${safeName}_${lastName}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error downloading birthday card:', err);
      alert('Failed to export card image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-4xl overflow-hidden my-auto grid grid-cols-1 lg:grid-cols-12 max-h-[92vh]">

        {/* ===================================================================== */}
        {/* LEFT / TOP: LIVE CARD PREVIEW CANVAS                                 */}
        {/* ===================================================================== */}
        <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center relative overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Top Badge */}
          <div className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Birthday Card Preview</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              {aspectRatio === 'SQUARE' ? '1200 x 1200 (Square)' : '1200 x 630 (Banner)'}
            </span>
          </div>

          {/* THE CANVAS */}
          <div className="w-full max-w-[460px] flex items-center justify-center relative">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-2xl shadow-2xl border-2 border-amber-400/40 object-contain transition-all duration-300"
            />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT / BOTTOM: CONTROLS & EXPORT PANEL                               */}
        {/* ===================================================================== */}
        <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-4 bg-slate-900 overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Birthday Card</span>
                <Cake className="w-5 h-5 text-amber-400" />
              </h3>
              <p className="text-xs text-slate-400">
                Customize celebrant name, blessing &amp; design
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Controls */}
          <div className="space-y-3.5 text-xs">
            
            {/* Husband / Wife Selector (If couple was passed) */}
            {isCoupleObject && coupleObj && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Select Celebrant</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('husband')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      activeGender === 'husband'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>Bro. {coupleObj.husbandFirstName}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('wife')}
                    className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      activeGender === 'wife'
                        ? 'bg-rose-500 text-white font-black shadow-md'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>Sis. {coupleObj.wifeFirstName}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Name Fields */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Celebrant Details</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Title</label>
                  <select
                    value={titlePrefix}
                    onChange={(e) => setTitlePrefix(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  >
                    <option value="Bro.">Bro.</option>
                    <option value="Sis.">Sis.</option>
                    <option value="">(None)</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">First Name / Nickname</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="e.g. Juan"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Dela Cruz"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">Age (Optional)</label>
                  <input
                    type="text"
                    value={ageDisplay}
                    onChange={(e) => setAgeDisplay(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Date & Message */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Birthday Date Text</span>
                </label>
                <input
                  type="text"
                  value={dateDisplay}
                  onChange={(e) => setDateDisplay(e.target.value)}
                  placeholder="e.g. October 15"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-400">
                    Christian Birthday Blessing
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (BLESSING_PRESETS.indexOf(customMessage) + 1) % BLESSING_PRESETS.length;
                      setCustomMessage(BLESSING_PRESETS[nextIdx]);
                    }}
                    className="text-[10px] text-amber-400 hover:underline font-bold"
                  >
                    Cycle Presets 🔄
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Card Theme</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTheme('CFC_BRAND')}
                  className={`col-span-2 px-2.5 py-2 rounded-xl border font-bold text-[11px] text-left transition-all flex items-center justify-between ${
                    theme === 'CFC_BRAND'
                      ? 'border-amber-400 bg-blue-950/80 text-white ring-2 ring-amber-400/40 shadow-sm'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#243c81] ring-1 ring-amber-400 inline-block" />
                    🛡️ CFC Brand Navy &amp; Gold
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold uppercase tracking-wider border border-amber-500/30">
                    Official
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('ROYAL')}
                  className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] text-left transition-all ${
                    theme === 'ROYAL'
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  👑 Royal Blue &amp; Gold
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('ROSE')}
                  className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] text-left transition-all ${
                    theme === 'ROSE'
                      ? 'border-rose-400 bg-rose-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  🌹 Rose &amp; Crimson
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('GOLD')}
                  className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] text-left transition-all ${
                    theme === 'GOLD'
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  ✨ Golden Elegance
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('EMERALD')}
                  className={`px-2.5 py-1.5 rounded-xl border font-bold text-[11px] text-left transition-all ${
                    theme === 'EMERALD'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  🌿 Emerald Blessing
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('PURPLE')}
                  className={`col-span-2 px-2.5 py-1.5 rounded-xl border font-bold text-[11px] text-left transition-all ${
                    theme === 'PURPLE'
                      ? 'border-purple-400 bg-purple-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  💜 Jubilee Violet &amp; Gold
                </button>
              </div>
            </div>

            {/* Size Toggle */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Export Size</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('SQUARE')}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all ${
                    aspectRatio === 'SQUARE'
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Square (1200x1200px)
                </button>

                <button
                  type="button"
                  onClick={() => setAspectRatio('LANDSCAPE')}
                  className={`px-3 py-1.5 rounded-xl border font-bold text-xs transition-all ${
                    aspectRatio === 'LANDSCAPE'
                      ? 'border-amber-400 bg-amber-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  Landscape (1200x630px)
                </button>
              </div>
            </div>

          </div>

          {/* DOWNLOAD BUTTON */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            {downloadSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Birthday Card downloaded successfully as JPEG!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadJpeg}
              disabled={isGenerating}
              className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-sm hover:from-amber-400 hover:to-yellow-400 transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Generating Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Birthday Card (JPEG)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium">
              High-Res 1200px JPEG output for Facebook, Viber &amp; Social Media
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
