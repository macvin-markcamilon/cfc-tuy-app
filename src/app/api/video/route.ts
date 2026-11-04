import { NextRequest, NextResponse } from 'next/server';

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
      fetchHeaders['Range'] = rangeHeader;
    }

    const upstreamResponse = await fetch(targetUrl, {
      headers: fetchHeaders,
    });

    if (!upstreamResponse.ok && upstreamResponse.status !== 206) {
      return new NextResponse(`Failed to fetch upstream video (${upstreamResponse.status})`, {
        status: upstreamResponse.status,
      });
    }

    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'video/mp4');
    responseHeaders.set('Accept-Ranges', 'bytes');
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
