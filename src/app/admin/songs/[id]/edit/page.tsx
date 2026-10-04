'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import SongEditorPage from '@/components/music/SongEditorPage';

export default function EditSongPage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';

  return <SongEditorPage songId={id} isNew={false} />;
}
