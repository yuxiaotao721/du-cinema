const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
};

function rewriteM3u8(content, baseUrl, proxyEndpoint = '/api/live') {
  const lines = content.split(/\r?\n/);
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    // Handle tag URI attributes, e.g. #EXT-X-KEY:METHOD=...,URI="..."
    if (trimmed.startsWith('#')) {
      if (trimmed.includes('URI=')) {
        return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
          try {
            const abs = new URL(uri, baseUrl).href;
            return `URI="${proxyEndpoint}?url=${encodeURIComponent(abs)}"`;
          } catch {
            return match;
          }
        });
      }
      return line;
    }

    // Media segment or nested playlist
    try {
      const abs = new URL(trimmed, baseUrl).href;
      return `${proxyEndpoint}?url=${encodeURIComponent(abs)}`;
    } catch {
      return line;
    }
  }).join('\n');
}

export async function onRequest(context) {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  const reqUrl = new URL(request.url);
  const targetUrl = reqUrl.searchParams.get('url');

  if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
    return new Response(JSON.stringify({ error: 'Missing or invalid "url" parameter' }), {
      status: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': new URL(targetUrl).origin + '/',
      },
    });

    if (!upstreamRes.ok) {
      return new Response(`Upstream error: ${upstreamRes.status} ${upstreamRes.statusText}`, {
        status: upstreamRes.status,
        headers: CORS_HEADERS,
      });
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    const isM3u8 = targetUrl.toLowerCase().includes('.m3u8') || 
                   contentType.toLowerCase().includes('mpegurl') || 
                   contentType.toLowerCase().includes('application/vnd.apple.mpegurl');

    if (isM3u8) {
      const text = await upstreamRes.text();
      // If it is an M3U8 playlist
      if (text.includes('#EXTM3U')) {
        const proxyEndpoint = reqUrl.pathname || '/api/live';
        const rewritten = rewriteM3u8(text, targetUrl, proxyEndpoint);
        return new Response(rewritten, {
          status: 200,
          headers: {
            ...CORS_HEADERS,
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
      }
    }

    // Binary TS chunk or media stream
    let resolvedContentType = 'video/mp2t';
    if (targetUrl.toLowerCase().includes('.ts') || contentType.includes('octet-stream')) {
      resolvedContentType = 'video/mp2t';
    } else if (contentType) {
      resolvedContentType = contentType;
    }

    const responseHeaders = {
      ...CORS_HEADERS,
      'Content-Type': resolvedContentType,
      'Cache-Control': 'public, max-age=3600',
    };

    const contentLength = upstreamRes.headers.get('content-length');
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength;
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Live proxy request failed', message: err.message }), {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
}
