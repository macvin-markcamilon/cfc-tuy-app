import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 2 MB chunk size to stay safely below serverless payload limits (e.g. Vercel 4.5MB)
const MAX_CHUNK_SIZE = 2 * 1024 * 1024;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing video URL parameter', { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get('range');
    const fetchHeaders: Record<string, string> = {};

    if (rangeHeader) {
      // If browser requests open-ended "bytes=X-", cap it to X + MAX_CHUNK_SIZE
      const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
      if (match) {
        const start = parseInt(match[1], 10);
        const endStr = match[2];
        if (!endStr) {
          fetchHeaders['Range'] = `bytes=${start}-${start + MAX_CHUNK_SIZE - 1}`;
        } else {
          const end = parseInt(endStr, 10);
          const cappedEnd = Math.min(end, start + MAX_CHUNK_SIZE - 1);
          fetchHeaders['Range'] = `bytes=${start}-${cappedEnd}`;
        }
      } else {
        fetchHeaders['Range'] = rangeHeader;
      }
    } else {
      fetchHeaders['Range'] = `bytes=0-${MAX_CHUNK_SIZE - 1}`;
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: fetchHeaders,
      cache: 'no-store',
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      // Retry without Range header if upstream didn't support the range
      const fallbackResponse = await fetch(targetUrl, { cache: 'no-store' });
      if (!fallbackResponse.ok) {
        return new NextResponse(`Failed to fetch upstream video (${fallbackResponse.status})`, {
          status: fallbackResponse.status,
        });
      }
      const responseHeaders = new Headers();
      responseHeaders.set('Content-Type', 'video/mp4');
      responseHeaders.set('Accept-Ranges', 'bytes');
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
      const len = fallbackResponse.headers.get('content-length');
      if (len) responseHeaders.set('Content-Length', len);
      return new NextResponse(fallbackResponse.body, {
        status: 200,
        headers: responseHeaders,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');

    const contentRange = upstreamResponse.headers.get('content-range');
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange);
    }

    const contentLength = upstreamResponse.headers.get('content-length');
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength);
    }

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error('Video stream proxy error:', err);
    return new NextResponse('Error streaming video', { status: 500 });
  }
}

