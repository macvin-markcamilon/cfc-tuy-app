import React from 'react';
import SongEditorPage from '@/components/music/SongEditorPage';

export const metadata = {
  title: "Add New Worship Song | CFC Tuy Admin",
  description: "Create and publish praise and worship songs with chords, lyrics, and MP3 audio.",
};

export default function AddNewSongPage() {
  return <SongEditorPage isNew={true} />;
}
