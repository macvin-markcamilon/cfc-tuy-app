'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Sparkles,
  Heart,
  Palette,
  Calendar as CalendarIcon,
  User,
  Check,
  Share2,
} from 'lucide-react';
import { DirectoryCouple } from '@/types';

interface AnniversaryGreetingCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  couple: DirectoryCouple | null;
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

export default function AnniversaryGreetingCardModal({
  isOpen,
  onClose,
  couple,
}: AnniversaryGreetingCardModalProps) {
  // Form / Card customization state
  const [husbandNick, setHusbandNick] = useState('');
  const [wifeNick, setWifeNick] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateDisplay, setDateDisplay] = useState('');
  const [yearsCount, setYearsCount] = useState<string>('');
  const [customSubtitle, setCustomSubtitle] = useState(
    'May God continue to bless your marriage with love, faith, and joy!'
  );
  const [theme, setTheme] = useState<'CFC_BRAND' | 'ROYAL' | 'ROSE' | 'GOLD' | 'EMERALD'>('CFC_BRAND');
  const [aspectRatio, setAspectRatio] = useState<'SQUARE' | 'LANDSCAPE'>('SQUARE'); // 1200x1200 vs 1200x630
  const [includePhotos, setIncludePhotos] = useState(true);
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

  // 2. Load Couple Photo when couple changes
  useEffect(() => {
    const photoUrl = couple?.couplePhotoUrl || couple?.husbandPhotoUrl || couple?.wifePhotoUrl;
    if (photoUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setPhotoImg(img);
      img.onerror = () => setPhotoImg(null);
      img.src = photoUrl;
    } else {
      setPhotoImg(null);
    }
  }, [couple]);

  // 3. Initialize or update form fields when couple changes
  useEffect(() => {
    if (couple) {
      const hNick = couple.husbandNickname?.trim() || couple.husbandFirstName.split(' ')[0] || '';
      const wNick = couple.wifeNickname?.trim() || couple.wifeFirstName.split(' ')[0] || '';
      setHusbandNick(hNick);
      setWifeNick(wNick);
      setLastName(couple.husbandLastName || couple.wifeLastName || '');

      if (couple.weddingAnniversary) {
        const parts = couple.weddingAnniversary.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const monthIndex = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const dateObj = new Date(year, monthIndex, day);

          const formattedDate = dateObj.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          setDateDisplay(formattedDate);

          const currentYear = new Date().getFullYear();
          if (year > 1900 && currentYear >= year) {
            setYearsCount(`${currentYear - year}`);
          } else {
            setYearsCount('');
          }
        } else {
          setDateDisplay(couple.weddingAnniversary);
          setYearsCount('');
        }
      } else {
        const todayStr = new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        });
        setDateDisplay(todayStr);
        setYearsCount('');
      }
    }
  }, [couple]);

  // 4. Draw Card to Canvas (Used for BOTH Live Preview and Download)
  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !couple) return;

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
    let bgGrad;
    let accentColor = '#f59e0b';
    let badgeFill = 'rgba(245, 158, 11, 0.22)';
    let titleColor = '#fde68a';
    let badgeTextColor = '#fde68a';
    let subTextColor = '#cbd5e1';

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
    } else {
      // ROYAL
      bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0b1329');
      bgGrad.addColorStop(0.5, '#1e293b');
      bgGrad.addColorStop(1, '#111827');
      accentColor = '#f59e0b';
      badgeFill = 'rgba(245, 158, 11, 0.22)';
      titleColor = '#fde68a';
      badgeTextColor = '#fde68a';
      subTextColor = '#cbd5e1';
    }

    // Draw Main Background
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Top Radial Glow
    const topGlow = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, height * 0.75);
    topGlow.addColorStop(
      0,
      theme === 'ROSE'
        ? 'rgba(244, 63, 94, 0.3)'
        : theme === 'EMERALD'
        ? 'rgba(52, 211, 153, 0.25)'
        : theme === 'CFC_BRAND'
        ? 'rgba(36, 60, 129, 0.45)'
        : 'rgba(245, 158, 11, 0.25)'
    );
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, width, height);

    // Outer & Inner Borders (Slightly wider canvas area)
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
    // CALCULATE CONTENT MEASUREMENTS FOR LARGER, PERFECTLY BALANCED LAYOUT
    // ---------------------------------------------------------------------------

    // 1. Logo dimensions (SIGNIFICANTLY LARGER!)
    const logoWidth = isSquare ? 350 : 220;
    let logoHeight = 60;
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      logoHeight = (logoImg.naturalHeight / logoImg.naturalWidth) * logoWidth;
    }
    const logoSpaceAfter = isSquare ? 28 : 14;

    // 2. Years Badge (if any)
    const hasYears = Boolean(yearsCount);
    const yearsHeight = hasYears ? (isSquare ? 54 : 38) : 0;
    const yearsSpaceAfter = hasYears ? (isSquare ? 28 : 14) : 0;

    // 3. Title ("HAPPY ANNIVERSARY") - LARGER!
    const titleHeight = isSquare ? 72 : 44;
    const titleSpaceAfter = isSquare ? 22 : 12;

    // 4. Heart Divider
    const dividerHeight = isSquare ? 20 : 14;
    const dividerSpaceAfter = isSquare ? 32 : 16;

    // 5. Couple Photo (Square mode only) - MUCH LARGER!
    const photoRadius = 140; // 280px diameter!
    const hasPhoto = includePhotos && isSquare && Boolean(photoImg && photoImg.complete && photoImg.naturalWidth > 0);
    const photoHeight = hasPhoto ? photoRadius * 2 : 0;
    const photoSpaceAfter = hasPhoto ? 34 : 0;

    // 6. Couple Names - LARGER!
    const displayHusband = husbandNick.trim() ? `Bro. ${husbandNick.trim()}` : `Bro. ${couple.husbandFirstName}`;
    const displayWife = wifeNick.trim() ? `Sis. ${wifeNick.trim()}` : `Sis. ${couple.wifeFirstName}`;
    const coupleNamesFormatted = `${displayHusband} & ${displayWife}`;
    const namesHeight = isSquare ? (hasPhoto ? 68 : 78) : 48;

    const hasLastName = Boolean(lastName.trim());
    const namesSpaceAfter = hasLastName ? (isSquare ? 14 : 10) : (isSquare ? 26 : 14);

    // 7. Family Surname (if any)
    const surnameHeight = hasLastName ? (isSquare ? 32 : 22) : 0;
    const surnameSpaceAfter = hasLastName ? (isSquare ? 26 : 14) : 0;

    // 8. Date Badge - LARGER!
    const dateBadgeHeight = isSquare ? 54 : 40;

    // 9. Custom Subtitle (if any) - LARGER!
    const hasSubtitle = Boolean(customSubtitle.trim());
    let subtitleLines: string[] = [];
    if (hasSubtitle) {
      ctx.font = `italic ${isSquare ? '28px' : '19px'} sans-serif`;
      subtitleLines = wrapText(ctx, `"${customSubtitle.trim()}"`, width - 200);
    }
    const dateSpaceAfter = hasSubtitle ? (isSquare ? 28 : 16) : 0;
    const subtitleLineHeight = isSquare ? 40 : 28;
    const subtitleHeight = hasSubtitle ? subtitleLines.length * subtitleLineHeight : 0;

    // SUM OF ALL CONTENT HEIGHTS
    const totalContentHeight =
      logoHeight + logoSpaceAfter +
      yearsHeight + yearsSpaceAfter +
      titleHeight + titleSpaceAfter +
      dividerHeight + dividerSpaceAfter +
      photoHeight + photoSpaceAfter +
      namesHeight + namesSpaceAfter +
      surnameHeight + surnameSpaceAfter +
      dateBadgeHeight + dateSpaceAfter +
      subtitleHeight;

    // Available vertical bounds for content
    const topBound = outerMargin + 18;
    const bottomBound = height - outerMargin - 52;
    const availableH = bottomBound - topBound;

    // Calculate starting Y to center content perfectly
    let currentY = topBound + Math.max(0, (availableH - totalContentHeight) / 2);

    // ---------------------------------------------------------------------------
    // RENDER CONTENT AT CALCULATED POSITIONS
    // ---------------------------------------------------------------------------

    // 1. White CFC Logo
    if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, (width - logoWidth) / 2, currentY, logoWidth, logoHeight);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${isSquare ? '40px' : '30px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('COUPLES FOR CHRIST', width / 2, currentY + 36);
    }
    currentY += logoHeight + logoSpaceAfter;

    // 2. Celebrating Years Badge
    if (hasYears) {
      ctx.fillStyle = badgeFill;
      const pillW = isSquare ? 420 : 310;
      const pillH = isSquare ? 52 : 38;
      ctx.beginPath();
      ctx.roundRect((width - pillW) / 2, currentY, pillW, pillH, pillH / 2);
      ctx.fill();
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = badgeTextColor;
      ctx.font = `800 ${isSquare ? '25px' : '17px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`★ CELEBRATING ${yearsCount} YEARS ★`, width / 2, currentY + (isSquare ? 34 : 25));

      currentY += yearsHeight + yearsSpaceAfter;
    }

    // 3. Main Title ("HAPPY ANNIVERSARY")
    ctx.fillStyle = titleColor;
    ctx.font = `900 ${isSquare ? '72px' : '44px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 12;
    ctx.fillText('HAPPY ANNIVERSARY', width / 2, currentY + (isSquare ? 58 : 35));
    ctx.shadowBlur = 0;

    currentY += titleHeight + titleSpaceAfter;

    // 4. Divider Line with Heart
    const lineHalf = isSquare ? 180 : 120;
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(width / 2 - lineHalf, currentY + 10);
    ctx.lineTo(width / 2 + lineHalf, currentY + 10);
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.font = `${isSquare ? '28px' : '20px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('♥', width / 2, currentY + 18);

    currentY += dividerHeight + dividerSpaceAfter;

    // 5. Couple Photo (Square mode only - 280px diameter!)
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

      // Outer border ring around photo
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(photoCenterX, photoCenterY, photoRadius + 4, 0, Math.PI * 2);
      ctx.stroke();

      currentY += photoHeight + photoSpaceAfter;
    }

    // 6. Couple Names
    ctx.fillStyle = '#ffffff';
    const nameFontSize = isSquare ? (hasPhoto ? '68px' : '76px') : '48px';
    ctx.font = `900 ${nameFontSize} sans-serif`;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 16;
    ctx.fillText(coupleNamesFormatted, width / 2, currentY + (isSquare ? (hasPhoto ? 54 : 62) : 38));
    ctx.shadowBlur = 0;

    currentY += namesHeight + namesSpaceAfter;

    // 7. Family Surname
    if (hasLastName) {
      ctx.fillStyle = subTextColor;
      ctx.font = `600 ${isSquare ? '32px' : '22px'} sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`The ${lastName.trim()} Family`, width / 2, currentY + (isSquare ? 26 : 18));

      currentY += surnameHeight + surnameSpaceAfter;
    }

    // 8. Date Badge
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    const dateText = dateDisplay;
    ctx.font = `800 ${isSquare ? '28px' : '19px'} sans-serif`;
    const dateMetrics = ctx.measureText(dateText);
    const datePillW = Math.max(isSquare ? 380 : 270, dateMetrics.width + 90);
    const datePillH = isSquare ? 52 : 38;

    ctx.beginPath();
    ctx.roundRect((width - datePillW) / 2, currentY, datePillW, datePillH, datePillH / 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.textAlign = 'center';
    ctx.fillText(`♥  ${dateText}`, width / 2, currentY + (isSquare ? 35 : 25));

    currentY += dateBadgeHeight + dateSpaceAfter;

    // 9. Custom Subtitle / Blessing
    if (hasSubtitle) {
      ctx.fillStyle = '#f1f5f9';
      ctx.font = `italic ${isSquare ? '28px' : '19px'} sans-serif`;
      ctx.textAlign = 'center';

      for (let l = 0; l < subtitleLines.length; l++) {
        ctx.fillText(subtitleLines[l], width / 2, currentY + l * subtitleLineHeight + (isSquare ? 28 : 20));
      }
    }

    // 10. Footer Brand Tag (STRICTLY TUY CHAPTER)
    const footerY = height - outerMargin - 20;
    ctx.fillStyle = accentColor;
    ctx.font = `800 ${isSquare ? '22px' : '16px'} sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('COUPLES FOR CHRIST • TUY CHAPTER, BATANGAS', width / 2, footerY);
  }, [
    aspectRatio,
    couple,
    customSubtitle,
    dateDisplay,
    husbandNick,
    includePhotos,
    lastName,
    logoImg,
    photoImg,
    theme,
    wifeNick,
    yearsCount,
  ]);

  // Re-draw canvas whenever state or images update
  useEffect(() => {
    if (isOpen) {
      drawCard();
    }
  }, [isOpen, drawCard]);

  if (!isOpen || !couple) return null;

  // Handle JPEG Download (Downloads the exact canvas displayed in preview)
  const handleDownloadJpeg = () => {
    if (!canvasRef.current) return;
    try {
      setIsGenerating(true);
      setDownloadSuccess(false);

      // Export canvas directly as high quality JPEG
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      const link = document.createElement('a');
      const safeHusband = (husbandNick || couple.husbandFirstName).replace(/\s+/g, '_');
      const safeWife = (wifeNick || couple.wifeFirstName).replace(/\s+/g, '_');
      link.download = `Anniversary_Card_Bro_${safeHusband}_and_Sis_${safeWife}.jpg`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error exporting card image:', err);
      alert('Failed to generate card image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 w-full max-w-4xl overflow-hidden my-auto grid grid-cols-1 lg:grid-cols-12 max-h-[92vh]">
        
        {/* ===================================================================== */}
        {/* LEFT / TOP: EXACT LIVE CARD PREVIEW AREA                              */}
        {/* ===================================================================== */}
        <div className="lg:col-span-7 p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center relative overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800">
          
          {/* Top Badge */}
          <div className="w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Exact Card Preview</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              {aspectRatio === 'SQUARE' ? '1200 x 1200 (FB Square)' : '1200 x 630 (FB Banner)'}
            </span>
          </div>

          {/* THE EXACT CARD PREVIEW CANVAS */}
          <div className="w-full max-w-[460px] flex items-center justify-center relative">
            <canvas
              ref={canvasRef}
              className="w-full h-auto rounded-2xl shadow-2xl border-2 border-amber-400/40 object-contain transition-all duration-300"
            />
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT / BOTTOM: CONTROLS & DOWNLOAD PANEL                             */}
        {/* ===================================================================== */}
        <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between space-y-5 bg-slate-900 overflow-y-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Customize Card</span>
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              </h3>
              <p className="text-xs text-slate-400">
                Tailor nicknames, date &amp; theme before export
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
          <div className="space-y-4 text-xs">
            
            {/* Nicknames Input Fields (Husband & Wife) */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Nicknames (Displayed on Card)</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Brother Nickname
                  </label>
                  <input
                    type="text"
                    value={husbandNick}
                    onChange={(e) => setHusbandNick(e.target.value)}
                    placeholder="e.g. Jun"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Sister Nickname
                  </label>
                  <input
                    type="text"
                    value={wifeNick}
                    onChange={(e) => setWifeNick(e.target.value)}
                    placeholder="e.g. Maria"
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Family Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Dela Cruz"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Date & Subtitle Controls */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div>
                <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Anniversary Date Text</span>
                </label>
                <input
                  type="text"
                  value={dateDisplay}
                  onChange={(e) => setDateDisplay(e.target.value)}
                  placeholder="e.g. October 24, 2026"
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Custom Greeting Blessing
                </label>
                <textarea
                  rows={2}
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Theme Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>Card Theme</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('CFC_BRAND')}
                  className={`col-span-2 px-3 py-2 rounded-xl border font-bold text-xs text-left transition-all flex items-center justify-between ${
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
                  className={`px-3 py-2 rounded-xl border font-bold text-xs text-left transition-all ${
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
                  className={`px-3 py-2 rounded-xl border font-bold text-xs text-left transition-all ${
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
                  className={`px-3 py-2 rounded-xl border font-bold text-xs text-left transition-all ${
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
                  className={`px-3 py-2 rounded-xl border font-bold text-xs text-left transition-all ${
                    theme === 'EMERALD'
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  🌿 Emerald Faith
                </button>
              </div>
            </div>

            {/* Social Media Aspect Ratio Toggle */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                <span>Social Media Export Size</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('SQUARE')}
                  className={`px-3 py-2 rounded-xl border font-bold text-xs transition-all ${
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
                  className={`px-3 py-2 rounded-xl border font-bold text-xs transition-all ${
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

          {/* ACTION BUTTON: DOWNLOAD AS JPEG */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            {downloadSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Greeting Card downloaded successfully as JPEG!</span>
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
                  <span>Generating JPEG Image...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 stroke-[2.5]" />
                  <span>Download Card as JPEG (Facebook Post Size)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 font-medium">
              Optimized 1200px High-Res JPEG for Facebook, Instagram, Viber &amp; Social Media
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}


