// Guitar Chord Dictionary and Fretboard Data for Ultimate Guitar style display

export interface ChordShape {
  name: string;
  frets: (number | -1)[]; // 6 strings from low E (string 6) to high E (string 1). -1 means muted (X), 0 means open (O)
  fingers?: (number | 0)[]; // Finger numbers 1=Index, 2=Middle, 3=Ring, 4=Pinky, 0=none
  baseFret?: number; // Starting fret (default 1)
  barreFret?: number; // Barre fret if applicable
}

export const GUITAR_CHORD_LIBRARY: Record<string, ChordShape> = {
  // A chords
  A: { name: 'A', frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
  Am: { name: 'Am', frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  A7: { name: 'A7', frets: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 1, 0, 2, 0] },
  Am7: { name: 'Am7', frets: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0] },
  Amaj7: { name: 'Amaj7', frets: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0] },
  Asus2: { name: 'Asus2', frets: [-1, 0, 2, 2, 0, 0], fingers: [0, 0, 1, 2, 0, 0] },
  Asus4: { name: 'Asus4', frets: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0] },

  // B chords
  B: { name: 'B', frets: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2, barreFret: 2 },
  Bm: { name: 'Bm', frets: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], baseFret: 2, barreFret: 2 },
  B7: { name: 'B7', frets: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4] },
  Bm7: { name: 'Bm7', frets: [-1, 2, 0, 2, 0, 2], fingers: [0, 1, 0, 2, 0, 3] },
  Bsus4: { name: 'Bsus4', frets: [-1, 2, 4, 4, 5, 2], fingers: [0, 1, 2, 3, 4, 1], baseFret: 2 },
  Bb: { name: 'Bb', frets: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 2, 3, 4, 1], baseFret: 1, barreFret: 1 },
  Bbm: { name: 'Bbm', frets: [-1, 1, 3, 3, 2, 1], fingers: [0, 1, 3, 4, 2, 1], baseFret: 1, barreFret: 1 },

  // C chords
  C: { name: 'C', frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  Cadd9: { name: 'Cadd9', frets: [-1, 3, 2, 0, 3, 3], fingers: [0, 2, 1, 0, 3, 4] },
  C7: { name: 'C7', frets: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0] },
  Cmaj7: { name: 'Cmaj7', frets: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0] },
  Cm: { name: 'Cm', frets: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], baseFret: 3, barreFret: 3 },
  Cm7: { name: 'Cm7', frets: [-1, 3, 5, 3, 4, 3], fingers: [0, 1, 3, 1, 2, 1], baseFret: 3 },
  'C#m': { name: 'C#m', frets: [-1, 4, 6, 6, 5, 4], fingers: [0, 1, 3, 4, 2, 1], baseFret: 4, barreFret: 4 },

  // D chords
  D: { name: 'D', frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  Dm: { name: 'Dm', frets: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1] },
  D7: { name: 'D7', frets: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3] },
  Dm7: { name: 'Dm7', frets: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1] },
  Dmaj7: { name: 'Dmaj7', frets: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 2, 3] },
  Dsus2: { name: 'Dsus2', frets: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0] },
  Dsus4: { name: 'Dsus4', frets: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 2, 3] },
  'D/F#': { name: 'D/F#', frets: [2, 0, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3] },

  // E chords
  E: { name: 'E', frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  Em: { name: 'Em', frets: [0, 2, 2, 0, 0, 0], fingers: [0, 1, 2, 0, 0, 0] },
  E7: { name: 'E7', frets: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0] },
  Em7: { name: 'Em7', frets: [0, 2, 2, 0, 3, 0], fingers: [0, 1, 2, 0, 3, 0] },
  Emaj7: { name: 'Emaj7', frets: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0] },
  Esus4: { name: 'Esus4', frets: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0] },
  Eb: { name: 'Eb', frets: [-1, 6, 8, 8, 8, 6], fingers: [0, 1, 2, 3, 4, 1], baseFret: 6 },

  // F chords
  F: { name: 'F', frets: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], baseFret: 1, barreFret: 1 },
  Fm: { name: 'Fm', frets: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], baseFret: 1, barreFret: 1 },
  Fmaj7: { name: 'Fmaj7', frets: [-1, -1, 3, 2, 1, 0], fingers: [0, 0, 3, 2, 1, 0] },
  F7: { name: 'F7', frets: [1, 3, 1, 2, 1, 1], fingers: [1, 3, 1, 2, 1, 1], baseFret: 1, barreFret: 1 },
  'F#': { name: 'F#', frets: [2, 4, 4, 3, 2, 2], fingers: [1, 3, 4, 2, 1, 1], baseFret: 2, barreFret: 2 },
  'F#m': { name: 'F#m', frets: [2, 4, 4, 2, 2, 2], fingers: [1, 3, 4, 1, 1, 1], baseFret: 2, barreFret: 2 },
  'F#7': { name: 'F#7', frets: [2, 4, 2, 3, 2, 2], fingers: [1, 3, 1, 2, 1, 1], baseFret: 2, barreFret: 2 },
  'F#m7': { name: 'F#m7', frets: [2, 4, 2, 2, 2, 2], fingers: [1, 3, 1, 1, 1, 1], baseFret: 2, barreFret: 2 },

  // G chords
  G: { name: 'G', frets: [3, 2, 0, 0, 3, 3], fingers: [2, 1, 0, 0, 3, 4] },
  G7: { name: 'G7', frets: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1] },
  Gm: { name: 'Gm', frets: [3, 5, 5, 3, 3, 3], fingers: [1, 3, 4, 1, 1, 1], baseFret: 3, barreFret: 3 },
  Gm7: { name: 'Gm7', frets: [3, 5, 3, 3, 3, 3], fingers: [1, 3, 1, 1, 1, 1], baseFret: 3 },
  Gmaj7: { name: 'Gmaj7', frets: [3, 2, 0, 0, 0, 2], fingers: [2, 1, 0, 0, 0, 3] },
  Gsus4: { name: 'Gsus4', frets: [3, 2, 0, 0, 1, 3], fingers: [3, 2, 0, 0, 1, 4] },
  'G/B': { name: 'G/B', frets: [-1, 2, 0, 0, 3, 3], fingers: [0, 1, 0, 0, 3, 4] },
};

/**
 * Normalizes chord representation (e.g. C# -> Db alias, or handling slash chords)
 */
export function getChordShape(chordName: string): ChordShape | null {
  const clean = chordName.trim();
  if (GUITAR_CHORD_LIBRARY[clean]) {
    return GUITAR_CHORD_LIBRARY[clean];
  }

  // Handle slash chords: e.g. D/F# -> base chord D
  if (clean.includes('/')) {
    const base = clean.split('/')[0];
    if (GUITAR_CHORD_LIBRARY[base]) {
      return GUITAR_CHORD_LIBRARY[base];
    }
  }

  // Handle common aliases: Ab -> G#, Db -> C#, Eb -> D#
  const aliases: Record<string, string> = {
    Ab: 'G',
    Db: 'C#m',
    'A#': 'Bb',
    'A#m': 'Bbm',
  };

  if (aliases[clean] && GUITAR_CHORD_LIBRARY[aliases[clean]]) {
    return GUITAR_CHORD_LIBRARY[aliases[clean]];
  }

  return null;
}

// Semitone musical scale
const CHROMATIC_SCALE_SHARPS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHROMATIC_SCALE_FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Transpose a single chord name by a specified number of semitones
 */
export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0 || !chord) return chord;

  // Handle slash chords e.g. G/B
  if (chord.includes('/')) {
    const [root, bass] = chord.split('/');
    return `${transposeChord(root, semitones)}/${transposeChord(bass, semitones)}`;
  }

  // Match root note and suffix
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  let index = CHROMATIC_SCALE_SHARPS.indexOf(root);
  if (index === -1) {
    index = CHROMATIC_SCALE_FLATS.indexOf(root);
  }
  if (index === -1) return chord;

  let newIndex = (index + semitones) % 12;
  if (newIndex < 0) newIndex += 12;

  // Pick sharp or flat scale
  const isFlatScale = ['F', 'Bb', 'Eb', 'Ab', 'Db'].includes(root) || root.includes('b');
  const scale = isFlatScale ? CHROMATIC_SCALE_FLATS : CHROMATIC_SCALE_SHARPS;

  return scale[newIndex] + suffix;
}

/**
 * Transpose an entire ChordPro or Chord-annotated text by semitones
 */
export function transposeSongContent(content: string, semitones: number): string {
  if (semitones === 0) return content;

  // Bracket notation [G] -> [A]
  const bracketTransposed = content.replace(/\[([A-G][#b]?[^\]]*)\]/g, (_, chord) => {
    return `[${transposeChord(chord, semitones)}]`;
  });

  return bracketTransposed;
}
