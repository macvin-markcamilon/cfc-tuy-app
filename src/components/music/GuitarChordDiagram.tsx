'use client';

import React from 'react';
import { ChordShape, getChordShape } from '@/lib/music/guitarChords';

interface GuitarChordDiagramProps {
  chord: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showName?: boolean;
}

export default function GuitarChordDiagram({
  chord,
  size = 'md',
  className = '',
  showName = true,
}: GuitarChordDiagramProps) {
  const shape = getChordShape(chord);

  const dimensions = {
    sm: { width: 90, height: 110, fontSize: 10, dotRadius: 4.5, nameSize: 12 },
    md: { width: 120, height: 145, fontSize: 11, dotRadius: 5.5, nameSize: 14 },
    lg: { width: 160, height: 190, fontSize: 13, dotRadius: 7, nameSize: 18 },
  }[size];

  if (!shape) {
    return (
      <div className={`p-3 bg-slate-50 rounded-xl border border-slate-200 text-center ${className}`}>
        <span className="font-bold text-slate-800 text-sm">{chord}</span>
        <p className="text-[10px] text-slate-400 mt-1">Diagram N/A</p>
      </div>
    );
  }

  const { frets, fingers, baseFret = 1 } = shape;
  const numFrets = 4;
  const numStrings = 6;

  // Geometry
  const padX = 22;
  const padTop = showName ? 30 : 16;
  const padBottom = 16;
  const gridW = dimensions.width - padX * 2;
  const gridH = dimensions.height - padTop - padBottom;
  const stringSpacing = gridW / (numStrings - 1);
  const fretSpacing = gridH / numFrets;

  const isNutAtTop = baseFret === 1;

  return (
    <div className={`inline-flex flex-col items-center bg-white rounded-2xl p-2.5 border border-slate-200 shadow-md ${className}`}>
      {showName && (
        <div className="font-black text-slate-900 mb-1 text-center tracking-tight" style={{ fontSize: dimensions.nameSize }}>
          {shape.name}
        </div>
      )}

      <svg
        width={dimensions.width}
        height={dimensions.height - (showName ? 0 : 12)}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height - (showName ? 0 : 12)}`}
        className="select-none"
      >
        {/* Nut (Thick line if fret 1) */}
        {isNutAtTop ? (
          <line
            x1={padX}
            y1={padTop}
            x2={padX + gridW}
            y2={padTop}
            stroke="#1e293b"
            strokeWidth={4.5}
            strokeLinecap="round"
          />
        ) : (
          /* Base fret label on the left */
          <text
            x={padX - 8}
            y={padTop + fretSpacing * 0.7}
            textAnchor="end"
            fontSize={dimensions.fontSize}
            fontWeight="bold"
            fill="#64748b"
          >
            {baseFret}fr
          </text>
        )}

        {/* Frets (Horizontal lines) */}
        {Array.from({ length: numFrets + 1 }).map((_, i) => {
          const y = padTop + i * fretSpacing;
          return (
            <line
              key={`fret-${i}`}
              x1={padX}
              y1={y}
              x2={padX + gridW}
              y2={y}
              stroke="#cbd5e1"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Strings (Vertical lines) */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const x = padX + i * stringSpacing;
          return (
            <line
              key={`string-${i}`}
              x1={x}
              y1={padTop}
              x2={x}
              y2={padTop + gridH}
              stroke="#94a3b8"
              strokeWidth={i === 0 || i === 1 ? 1.8 : 1.2}
            />
          );
        })}

        {/* String Indicators (X or O) above the nut */}
        {frets.map((fretVal, strIdx) => {
          const x = padX + strIdx * stringSpacing;
          const y = padTop - 7;

          if (fretVal === -1) {
            // Muted X
            return (
              <text
                key={`mute-${strIdx}`}
                x={x}
                y={y}
                textAnchor="middle"
                fontSize={dimensions.fontSize}
                fontWeight="900"
                fill="#94a3b8"
              >
                ×
              </text>
            );
          }
          if (fretVal === 0) {
            // Open string O
            return (
              <circle
                key={`open-${strIdx}`}
                cx={x}
                cy={y - 3}
                r={dimensions.dotRadius - 1.5}
                fill="none"
                stroke="#64748b"
                strokeWidth={1.5}
              />
            );
          }
          return null;
        })}

        {/* Finger Dots on Frets */}
        {frets.map((fretVal, strIdx) => {
          if (fretVal <= 0) return null;

          const relativeFret = fretVal - (baseFret - 1);
          if (relativeFret < 1 || relativeFret > numFrets) return null;

          const x = padX + strIdx * stringSpacing;
          const y = padTop + (relativeFret - 0.5) * fretSpacing;
          const fingerNum = fingers ? fingers[strIdx] : 0;

          return (
            <g key={`dot-${strIdx}`}>
              {/* Outer shadow */}
              <circle
                cx={x}
                cy={y + 1}
                r={dimensions.dotRadius}
                fill="rgba(0,0,0,0.15)"
              />
              {/* Finger dot */}
              <circle
                cx={x}
                cy={y}
                r={dimensions.dotRadius}
                fill="#243c81"
                stroke="#ffffff"
                strokeWidth={1.5}
              />
              {/* Finger number */}
              {fingerNum > 0 && (
                <text
                  x={x}
                  y={y + 0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={dimensions.fontSize - 3}
                  fontWeight="bold"
                  fill="#ffffff"
                >
                  {fingerNum}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
