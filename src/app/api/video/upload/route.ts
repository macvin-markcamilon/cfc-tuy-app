import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Supabase environment credentials not configured.' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const key = (formData.get('key') as string) || 'default_visualizer';

    if (!file) {
      return NextResponse.json({ error: 'No video file provided.' }, { status: 400 });
    }

    // Validate video mime or file extension
    const isVideo =
      file.type.startsWith('video/') ||
      file.name.match(/\.(mp4|webm|mov|m4v|ogg)$/i);

    if (!isVideo) {
      return NextResponse.json(
        { error: 'Please upload a valid motion video loop (.mp4, .webm, .mov).' },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${Date.now()}-${cleanBase}.${fileExt}`;
    const filePath = `videos/${fileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload to 'songs' bucket with audio/mpeg to satisfy storage bucket constraints
    const { error: uploadError } = await supabase.storage
      .from('songs')
      .upload(filePath, buffer, {
        cacheControl: '31536000',
        upsert: true,
        contentType: 'audio/mpeg',
      });

    if (uploadError) {
      console.error('Supabase storage server upload error:', uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: publicData } = supabase.storage.from('songs').getPublicUrl(filePath);
    const directUrl = publicData?.publicUrl;

    if (!directUrl) {
      return NextResponse.json(
        { error: 'Failed to retrieve public video URL from storage.' },
        { status: 500 }
      );
    }

    // If uploading chapter default visualizer, update system-visualizer-settings row in Supabase
    if (key === 'default_visualizer') {
      try {
        const payload = {
          defaultVideoUrl: directUrl,
          isBlurred: false,
          blurAmount: 8,
          updatedAt: new Date().toISOString(),
        };

        await supabase.from('worship_songs').upsert({
          id: 'system-visualizer-settings',
          title: '__CHAPTER_VISUALIZER_CONFIG__',
          artist: 'Couples For Christ Tuy Chapter',
          key_signature: 'G',
          category: 'Worship',
          ministry: 'CFC',
          lyrics_and_chords: '{system: visualizer configuration}',
          notes: JSON.stringify(payload),
          updated_at: payload.updatedAt,
        });
      } catch (dbErr) {
        console.warn('Could not auto-update DB row for visualizer:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      url: directUrl,
      fileName: file.name,
      filePath,
    });
  } catch (err: any) {
    console.error('Video upload route unhandled error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error processing video upload.' },
      { status: 500 }
    );
  }
}
