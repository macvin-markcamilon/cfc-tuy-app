import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Songbook – Worship & Praise Songs | Couples for Christ Tuy',
  description:
    'Explore authentic chords, lyrics, guitar fingerings, and audio recordings of CFC praise and worship songs for prayer meetings, household gatherings, and Christian Life Programs (CLP).',
};

export default function SongbookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
