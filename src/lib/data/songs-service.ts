import { MinistryType } from '@/types';
import { createClient } from '@/lib/supabase/client';

export interface WorshipSong {
  id: string;
  title: string;
  artist: string;
  key: string;
  tempo?: string;
  timeSignature?: string;
  category: 'Praise' | 'Worship' | 'Reflection' | 'Offertory' | 'Gathering' | 'Recessional' | 'Marian' | 'Mass Ordinary';
  ministry?: MinistryType | 'ALL';
  lyricsAndChords: string;
  ccliNumber?: string;
  audioUrl?: string; // MP3 URL or base64 data URI
  audioFileName?: string;
  youtubeUrl?: string; // YouTube video or audio link
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Helper to extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeId(url?: string): string | null {
  if (!url) return null;
  const str = url.trim();
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = str.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  return null;
}

/**
 * Checks whether a given URL is a YouTube link
 */
export function isYouTubeUrl(url?: string): boolean {
  return extractYouTubeId(url) !== null;
}

const STORAGE_KEY = 'cfc_tuy_worship_songs_v1';

// Seed CFC Worship Songs Repertoire with authentic chords
export const DEFAULT_CFC_SONGS: WorshipSong[] = [
  {
    id: 'song-1-light-of-christ',
    title: 'The Light of Christ',
    artist: 'Couples for Christ',
    key: 'G',
    tempo: 'Upbeat (110 BPM)',
    timeSignature: '4/4',
    category: 'Gathering',
    ministry: 'CFC',
    tags: ['Gathering', 'Praise', 'Assembly'],
    audioUrl: '',
    youtubeUrl: 'https://www.youtube.com/watch?v=uwKeGjfZbhv',
    createdAt: new Date().toISOString(),
    lyricsAndChords: `[Intro]
[G]  [C]  [D]  [G]

[Verse 1]
[G]The light of Christ has [C]come into the [G]world
The [Em]light of Christ has [C]come into the [D]world
[G]We must all be [C]born again to [G]see the Kingdom of [Em]God
The [C]light of Christ has [D]come into the [G]world.

[Chorus]
[G]All have died and [C]are no more, [D]Christ has won the [G]victory!
[G]All have died and [C]are no more, [D]Christ has won the [G]victory!

[Verse 2]
[G]The Spirit of God breathes [C]wherever it [G]wills
The [Em]Spirit of God breathes [C]wherever it [D]wills
[G]We must all be [C]born again to [G]see the Kingdom of [Em]God
The [C]light of Christ has [D]come into the [G]world.

[Chorus]
[G]All have died and [C]are no more, [D]Christ has won the [G]victory!
[G]All have died and [C]are no more, [D]Christ has won the [G]victory!

[Outro]
[C]The light of Christ has [D]come into the [G]world!`,
  },
  {
    id: 'song-2-ablaze',
    title: 'Ablaze for Jesus',
    artist: 'Youth for Christ / CFC',
    key: 'D',
    tempo: 'Fast Praise (128 BPM)',
    timeSignature: '4/4',
    category: 'Praise',
    ministry: 'YFC',
    tags: ['Fast Praise', 'Youth', 'Energizing'],
    audioUrl: '',
    createdAt: new Date().toISOString(),
    lyricsAndChords: `[Intro]
[D]  [G]  [Bm]  [A]

[Verse 1]
[D]I want to live my [G]life for You
[Bm]In everything I [A]say and do
[D]Your fire burning [G]deep inside
[Bm]I will not run, [A]I will not hide.

[Chorus]
[D]Ablaze! Ablaze for [G]Jesus!
[Bm]Setting the world on [A]fire!
[D]Ablaze! With passion and [G]purpose!
[Bm]Lifting Your name on [A]high!

[Verse 2]
[D]We are the light in the [G]darkest night
[Bm]Walking by faith and [A]not by sight
[D]One generation [G]standing strong
[Bm]Singing the victor's [A]holy song!

[Chorus]
[D]Ablaze! Ablaze for [G]Jesus!
[Bm]Setting the world on [A]fire!
[D]Ablaze! With passion and [G]purpose!
[Bm]Lifting Your name on [A]high!

[Bridge]
[G]No turning back, [A]no backing down
[Bm]We wear the cross, [D/F#]we seek the crown
[G]Jesus, You are [A]Lord of all!`,
  },
  {
    id: 'song-3-god-is-enough',
    title: 'God is Enough',
    artist: 'CFC Music Ministry',
    key: 'G',
    tempo: 'Slow Worship (68 BPM)',
    timeSignature: '4/4',
    category: 'Worship',
    ministry: 'CFC',
    tags: ['Worship', 'Surrender', 'Reflection'],
    audioUrl: '',
    createdAt: new Date().toISOString(),
    lyricsAndChords: `[Intro]
[G]  [D/F#]  [Em]  [C]

[Verse 1]
[G]I hear Your voice, [D/F#]calling my name
[Em]Pulling me close, [C]healing my pain
[G]You are my refuge, [D/F#]You are my shield
[Em]Unto Your love my [C]heart will yield.

[Chorus]
[G]God is enough for [D/F#]me
[Em]His love is all I [C]need
[G]Through every storm, through [D/F#]every trial
[Em]His grace will carry [C]me
God is e[G]nough!

[Verse 2]
[G]When shadows fall and [D/F#]nights are long
[Em]You fill my soul with [C]heaven's song
[G]No earthly treasure, [D/F#]no human praise
[Em]Can match the glory [C]of Your ways.

[Chorus]
[G]God is enough for [D/F#]me
[Em]His love is all I [C]need
[G]Through every storm, through [D/F#]every trial
[Em]His grace will carry [C]me
God is e[G]nough!`,
  },
  {
    id: 'song-4-you-are-near',
    title: 'You Are Near',
    artist: 'Dan Schutte',
    key: 'C',
    tempo: 'Reflective Worship',
    timeSignature: '4/4',
    category: 'Reflection',
    ministry: 'CFC',
    tags: ['Reflection', 'Peace', 'Comfort'],
    audioUrl: '',
    createdAt: new Date().toISOString(),
    lyricsAndChords: `[Chorus]
[C]Yahweh, I [F]know You are [C]near,
[Dm]Standing [G]always at my [C]side.
[Am]You guard me from the [Em]foe,
And You [F]lead me in [G]ways ever[C]lasting.

[Verse 1]
[C]Lord, You have [F]searched my [C]heart,
And You [Dm]know when I [G]sit and when I [C]stand.
[Am]Your hand is u[Em]pon me,
Protec[F]ting me from [G]death,
Keeping me from [C]harm.

[Chorus]
[C]Yahweh, I [F]know You are [C]near,
[Dm]Standing [G]always at my [C]side.
[Am]You guard me from the [Em]foe,
And You [F]lead me in [G]ways ever[C]lasting.`,
  },
  {
    id: 'song-5-offer-my-life',
    title: 'I Offer My Life',
    artist: 'Don Moen',
    key: 'D',
    tempo: 'Gentle Offertory (74 BPM)',
    timeSignature: '4/4',
    category: 'Offertory',
    ministry: 'CFC',
    tags: ['Offertory', 'Consecration', 'Giving'],
    audioUrl: '',
    createdAt: new Date().toISOString(),
    lyricsAndChords: `[Intro]
[D]  [G]  [A]  [D]

[Verse 1]
[D]All that I have, [G]all that I am
[A]All I require to [D]give into Your hands
[Bm]This is my offering, [G]Lord unto You
[Em]All of my days and [A]all I pursue.

[Chorus]
[D]Lord, I offer my [Bm]life to You
Every[G]thing I've been through, use it [A]for Your glory
[D]Lord, I offer my [Bm]days to You
Lifting my [G]praise to You as a [A]pleasing sacrifice
[G]Lord, I offer [A]You my [D]life.

[Verse 2]
[D]Things in the past, [G]things yet unseen
[A]Wishes and dreams that are [D]yet to come true
[Bm]All of my hopes, [G]all of my plans
My [Em]heart and my hands are [A]lifted to You.

[Chorus]
[D]Lord, I offer my [Bm]life to You
Every[G]thing I've been through, use it [A]for Your glory
[D]Lord, I offer my [Bm]days to You
Lifting my [G]praise to You as a [A]pleasing sacrifice
[G]Lord, I offer [A]You my [D]life.`,
  },
];

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function getLocalSongs(): WorshipSong[] {
  if (!isBrowser()) return DEFAULT_CFC_SONGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CFC_SONGS));
      return DEFAULT_CFC_SONGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CFC_SONGS;
  } catch {
    return DEFAULT_CFC_SONGS;
  }
}

function setLocalSongs(songs: WorshipSong[]): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  } catch (err) {
    console.error('Failed to save worship songs to local storage:', err);
    // If quota exceeded (often caused by large base64 data URIs), strip data URIs for local cache
    try {
      const sanitized = songs.map((s) => ({
        ...s,
        audioUrl: s.audioUrl?.startsWith('data:') ? '' : s.audioUrl,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
    } catch (innerErr) {
      console.warn('Could not save sanitized songs to localStorage:', innerErr);
    }
  }
}


export async function fetchWorshipSongs(): Promise<WorshipSong[]> {
  const localSongs = getLocalSongs();
  const localMap = new Map<string, WorshipSong>(localSongs.map((s) => [s.id, s]));

  try {
    const supabase = createClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('worship_songs')
        .select('*')
        .order('title', { ascending: true });

      if (!error && data && data.length > 0) {
        const merged: WorshipSong[] = data.map((d: any) => {
          const local = localMap.get(d.id);
          const supabaseUpdatedAt = d.updated_at ? new Date(d.updated_at).getTime() : 0;
          const localUpdatedAt = local?.updatedAt ? new Date(local.updatedAt).getTime() : 0;

          // If local version has a strictly newer update timestamp, preserve local edits
          if (local && localUpdatedAt > supabaseUpdatedAt) {
            return local;
          }

          return {
            id: d.id,
            title: d.title || local?.title || 'Untitled Worship Song',
            artist: d.artist || local?.artist || 'CFC Music Ministry',
            key: d.key_signature || d.key || local?.key || 'G',
            tempo: d.tempo || local?.tempo,
            timeSignature: d.time_signature || local?.timeSignature,
            category: d.category || local?.category || 'Praise',
            ministry: d.ministry || local?.ministry || 'CFC',
            lyricsAndChords: d.lyrics_and_chords || d.lyricsAndChords || local?.lyricsAndChords || '',
            ccliNumber: d.ccli_number || local?.ccliNumber,
            audioUrl: d.audio_url || d.audioUrl || local?.audioUrl || '',
            audioFileName: d.audio_file_name || local?.audioFileName,
            youtubeUrl: d.youtube_url || d.youtubeUrl || local?.youtubeUrl || '',
            tags: d.tags || local?.tags || [],
            notes: d.notes || local?.notes,
            createdAt: d.created_at || local?.createdAt || new Date().toISOString(),
            updatedAt: d.updated_at || local?.updatedAt,
          };
        });

        // Append any local-only songs that are not present in Supabase database
        const supabaseIds = new Set(merged.map((s) => s.id));
        for (const [id, localSong] of localMap.entries()) {
          if (!supabaseIds.has(id)) {
            merged.push(localSong);
          }
        }

        setLocalSongs(merged);
        return merged;
      }
    }
  } catch {
    // Fall back to local storage
  }

  return localSongs;
}

export async function fetchWorshipSongById(id: string): Promise<WorshipSong | null> {
  const songs = await fetchWorshipSongs();
  return songs.find((s) => s.id === id || encodeURIComponent(s.id) === id) || null;
}

export async function saveWorshipSong(song: Partial<WorshipSong>): Promise<WorshipSong> {
  const current = getLocalSongs();
  const id = song.id || `song-${Date.now()}`;
  const now = new Date().toISOString();

  let finalYoutubeUrl = song.youtubeUrl?.trim() || '';
  let finalAudioUrl = song.audioUrl?.trim() || '';

  // Auto-detect YouTube URL pasted into audioUrl
  if (isYouTubeUrl(finalAudioUrl) && !finalYoutubeUrl) {
    finalYoutubeUrl = finalAudioUrl;
  }

  // If audioUrl is a YouTube link, clean audioUrl so MP3 player doesn't try to play HTML webpage as MP3
  if (isYouTubeUrl(finalAudioUrl)) {
    finalAudioUrl = '';
  }

  const completeSong: WorshipSong = {
    id,
    title: song.title?.trim() || 'Untitled Worship Song',
    artist: song.artist?.trim() || 'CFC Music Ministry',
    key: song.key || 'G',
    tempo: song.tempo || 'Moderate',
    timeSignature: song.timeSignature || '4/4',
    category: song.category || 'Praise',
    ministry: song.ministry || 'CFC',
    lyricsAndChords: song.lyricsAndChords || '',
    ccliNumber: song.ccliNumber || '',
    audioUrl: finalAudioUrl,
    audioFileName: song.audioFileName || '',
    youtubeUrl: finalYoutubeUrl,
    tags: song.tags || [],
    notes: song.notes || '',
    createdAt: song.createdAt || now,
    updatedAt: now,
  };

  const existingIdx = current.findIndex((s) => s.id === id);
  let updatedList: WorshipSong[];

  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = completeSong;
  } else {
    updatedList = [completeSong, ...current];
  }

  setLocalSongs(updatedList);

  // Attempt Supabase sync
  try {
    const supabase = createClient();
    if (supabase) {
      const { error: upsertErr } = await supabase.from('worship_songs').upsert({
        id: completeSong.id,
        title: completeSong.title,
        artist: completeSong.artist,
        key_signature: completeSong.key,
        tempo: completeSong.tempo,
        time_signature: completeSong.timeSignature,
        category: completeSong.category,
        ministry: completeSong.ministry,
        lyrics_and_chords: completeSong.lyricsAndChords,
        ccli_number: completeSong.ccliNumber,
        audio_url: completeSong.audioUrl,
        audio_file_name: completeSong.audioFileName,
        youtube_url: completeSong.youtubeUrl,
        tags: completeSong.tags,
        notes: completeSong.notes,
        updated_at: completeSong.updatedAt,
      });

      if (upsertErr) {
        console.warn('Supabase worship_songs upsert failed:', upsertErr.message);
      }
    }
  } catch (err) {
    console.warn('Supabase worship_songs sync error:', err);
  }


  return completeSong;
}

export async function deleteWorshipSong(id: string): Promise<boolean> {
  const current = getLocalSongs();
  const filtered = current.filter((s) => s.id !== id);
  setLocalSongs(filtered);

  try {
    const supabase = createClient();
    if (supabase) {
      await supabase.from('worship_songs').delete().eq('id', id);
    }
  } catch {
    // Ignored
  }

  return true;
}

/**
 * Upload an MP3 audio file directly to Supabase Storage ('songs' bucket)
 * Returns the public URL of the uploaded audio file
 */
export async function uploadSongAudio(file: File): Promise<{ url: string; fileName: string }> {
  const supabase = createClient();
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // Validate file type
  if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    throw new Error('Please upload an audio file (.mp3, .wav, .ogg, .m4a).');
  }

  // Clean filename and make unique
  const fileExt = file.name.split('.').pop() || 'mp3';
  const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `${Date.now()}-${cleanBase}.${fileExt}`;
  const filePath = `audio/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('songs')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'audio/mpeg',
    });

  if (uploadError) {
    console.error('Supabase Storage upload error:', uploadError);
    throw new Error(
      `Supabase storage error: ${uploadError.message}. Make sure a public bucket named "songs" exists in Supabase Storage.`
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from('songs')
    .getPublicUrl(filePath);

  if (!publicUrlData?.publicUrl) {
    throw new Error('Could not retrieve public URL for uploaded audio file.');
  }

  return {
    url: publicUrlData.publicUrl,
    fileName: file.name,
  };
}

/**
 * Fallback helper to convert an uploaded audio file into a Base64 data URI
 */
export function fileToAudioDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

