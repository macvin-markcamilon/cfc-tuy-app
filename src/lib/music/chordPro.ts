/**
 * ChordPro Parser & Formatter utilities
 * Supports standard ChordPro syntax (e.g. {comment: Verse 1}, [E]hope, [C#m] [A] [E] [B] (x2))
 * as well as traditional chord/lyric sheets.
 */

export interface ChordProSegment {
  chord?: string;
  text: string;
}

export interface ChordProWord {
  isSpace?: boolean;
  segments: ChordProSegment[];
}

export type ChordProLineParsed =
  | { type: 'empty' }
  | {
      type: 'section';
      title: string;
      sectionType: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'general';
    }
  | { type: 'end_directive' }
  | {
      type: 'chord_progression';
      items: { isChord: boolean; value: string }[];
    }
  | {
      type: 'chords_and_lyrics';
      words: ChordProWord[];
      cleanText: string;
    }
  | {
      type: 'lyrics_only';
      text: string;
    };

/**
 * Determine section category based on title text
 */
export function getSectionType(
  title: string
): 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'pre-chorus' | 'general' {
  const lower = title.toLowerCase();
  if (lower.includes('verse')) return 'verse';
  if (lower.includes('chorus') || lower.includes('refrain')) return 'chorus';
  if (lower.includes('bridge')) return 'bridge';
  if (lower.includes('intro') || lower.includes('instrumental') || lower.includes('interlude')) return 'intro';
  if (lower.includes('outro') || lower.includes('ending') || lower.includes('coda')) return 'outro';
  if (lower.includes('pre')) return 'pre-chorus';
  return 'general';
}

/**
 * Parse a single line of ChordPro formatted or standard text
 */
export function parseChordProLine(line: string): ChordProLineParsed {
  const trimmed = line.trim();
  if (!trimmed) {
    return { type: 'empty' };
  }

  // 1. ChordPro directives: {comment: Verse 1}, {c: Chorus}, {soc}, {start_of_chorus}, etc.
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    const inside = trimmed.slice(1, -1).trim();
    const colonIdx = inside.indexOf(':');

    if (colonIdx !== -1) {
      const directiveKey = inside.slice(0, colonIdx).trim().toLowerCase();
      const directiveVal = inside.slice(colonIdx + 1).trim();

      if (['comment', 'c', 'comment_italic', 'ci', 'section'].includes(directiveKey)) {
        return {
          type: 'section',
          title: directiveVal,
          sectionType: getSectionType(directiveVal),
        };
      }
      if (['title', 't'].includes(directiveKey)) {
        return {
          type: 'section',
          title: directiveVal,
          sectionType: 'general',
        };
      }
      return {
        type: 'section',
        title: directiveVal || directiveKey,
        sectionType: getSectionType(directiveVal || directiveKey),
      };
    }

    // Directives without colon: {soc}, {eoc}, {start_of_chorus}, etc.
    const directiveKey = inside.toLowerCase();
    if (['soc', 'start_of_chorus'].includes(directiveKey)) {
      return { type: 'section', title: 'Chorus', sectionType: 'chorus' };
    }
    if (['sob', 'start_of_bridge'].includes(directiveKey)) {
      return { type: 'section', title: 'Bridge', sectionType: 'bridge' };
    }
    if (['sov', 'start_of_verse'].includes(directiveKey)) {
      return { type: 'section', title: 'Verse', sectionType: 'verse' };
    }
    if (['eoc', 'end_of_chorus', 'eob', 'end_of_bridge', 'eov', 'end_of_verse'].includes(directiveKey)) {
      return { type: 'end_directive' };
    }

    return {
      type: 'section',
      title: inside,
      sectionType: getSectionType(inside),
    };
  }

  // 2. Bracket Section Headers: [Verse 1], [Chorus], [Bridge], [Intro], etc.
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    const inner = trimmed.slice(1, -1).trim();
    if (/^(verse|chorus|bridge|intro|outro|refrain|interlude|instrumental|ending|tag|coda|pre-?chorus)/i.test(inner)) {
      return {
        type: 'section',
        title: inner,
        sectionType: getSectionType(inner),
      };
    }
  }

  // 3. Plain text section headers: e.g. "VERSE 1:", "• CHORUS •", "Intro:"
  const cleanHeader = trimmed.replace(/^[\s•\*#\-:=]+|[\s:=]+$/g, '').trim();
  const plainHeaderMatch = cleanHeader.match(
    /^(verse\s*\d*|chorus\s*\d*|bridge\s*\d*|intro\s*\d*|outro\s*\d*|pre-?chorus\s*\d*|refrain\s*\d*|interlude\s*\d*|instrumental\s*\d*|ending\s*\d*|tag\s*\d*|coda\s*\d*)$/i
  );
  if (plainHeaderMatch) {
    const rawTitle = plainHeaderMatch[1].trim();
    const title = rawTitle.replace(/\b[a-z]/g, (l) => l.toUpperCase());
    return {
      type: 'section',
      title,
      sectionType: getSectionType(rawTitle),
    };
  }

  const hasBrackets = /\[[A-G][#b]?[^\]]*\]/.test(line);

  // 4. Pure Chord Progression Line: e.g. "[C#m] [A] [E] [B] (x2)" or "[E] [G#m] [C#m] [A]"
  if (hasBrackets) {
    // Strip all bracketed chords and common repetition markers / separators
    const stripped = line
      .replace(/\[[A-G][#b]?[^\]]*\]/g, '')
      .replace(/\((?:x\d+|\d+x|\d+)\)/gi, '')
      .replace(/[0-9xX|/\\()\-:.]/g, '')
      .trim();

    if (stripped.length === 0) {
      // Parse chords and annotations
      const tokens = line.split(/(\[[A-G][#b]?[^\]]*\])/g);
      const items: { isChord: boolean; value: string }[] = [];

      tokens.forEach((tok) => {
        if (!tok) return;
        if (tok.startsWith('[') && tok.endsWith(']')) {
          items.push({ isChord: true, value: tok.slice(1, -1).trim() });
        } else {
          const t = tok.trim();
          if (t) {
            items.push({ isChord: false, value: t });
          }
        }
      });

      return {
        type: 'chord_progression',
        items,
      };
    }
  }

  // 5. Lines without chords: pure lyrics
  if (!hasBrackets) {
    return {
      type: 'lyrics_only',
      text: line,
    };
  }

  // 6. Chord-Over-Lyrics Line: e.g. "My [E]hope is built in [G#m]You Lord", "I de[A]sire to remain in [B]Your arms"
  const parts = line.split(/(\[[A-G][#b]?[^\]]*\])/g);
  const words: ChordProWord[] = [];
  let currentWord: ChordProWord = { segments: [] };
  let pendingChord: string | null = null;
  let lastWasSpace = false;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith('[') && part.endsWith(']')) {
      if (pendingChord) {
        // Two consecutive chords without text: attach previous as standalone
        currentWord.segments.push({ chord: pendingChord, text: '' });
      }
      pendingChord = part.slice(1, -1).trim();
      continue;
    }

    // Text token: split by whitespace
    const tokens = part.split(/(\s+)/);
    for (let t = 0; t < tokens.length; t++) {
      const tok = tokens[t];
      if (!tok) continue;

      if (/^\s+$/.test(tok)) {
        if (currentWord.segments.length > 0) {
          words.push(currentWord);
          currentWord = { segments: [] };
        }
        if (!lastWasSpace) {
          words.push({ isSpace: true, segments: [{ text: ' ' }] });
          lastWasSpace = true;
        }
      } else {
        currentWord.segments.push({
          chord: pendingChord || undefined,
          text: tok,
        });
        pendingChord = null;
        lastWasSpace = false;
      }
    }
  }

  if (pendingChord) {
    currentWord.segments.push({ chord: pendingChord, text: '' });
  }

  if (currentWord.segments.length > 0) {
    words.push(currentWord);
  }

  // Build clean text by extracting all lyric characters
  const cleanParts: string[] = [];
  words.forEach((w) => {
    if (w.isSpace) {
      cleanParts.push(' ');
    } else {
      w.segments.forEach((seg) => {
        cleanParts.push(seg.text);
      });
    }
  });

  return {
    type: 'chords_and_lyrics',
    words,
    cleanText: cleanParts.join('').trim(),
  };
}
