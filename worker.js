/**
 * Cloudflare Worker entry point for DuCinema (渡影)
 * Supports Cloudflare Workers with Static Assets
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Expose-Headers': '*',
};

const SOURCES = {
  'guangsu': 'https://api.guangsuapi.com/api.php/provide/vod/',
  'bdzy': 'https://api.apibdzy.com/api.php/provide/vod/',
  'ffzy': 'https://cj.ffzyapi.com/api.php/provide/vod/',
  'xinlang': 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/'
};

async function handleVod(request) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS
    });
  }

  const searchParams = url.searchParams;
  const sourceKey = searchParams.get('source') || 'guangsu';
  const upstream = SOURCES[sourceKey] || SOURCES['guangsu'];
  searchParams.delete('source');

  if (!searchParams.has('ac')) {
    searchParams.set('ac', 'detail');
  }

  try {
    const upstreamRes = await fetch(`${upstream}?${searchParams.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuCinema-CF/1.0'
      }
    });

    const data = await upstreamRes.text();
    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=120'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ code: 0, msg: 'CF upstream error', error: err.message, list: [] }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

function rewriteM3u8(content, baseUrl, proxyEndpoint = '/api/live') {
  const lines = content.split(/\r?\n/);
  return lines.map(line => {
    const trimmed = line.trim();
    if (!trimmed) return line;

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

    try {
      const abs = new URL(trimmed, baseUrl).href;
      return `${proxyEndpoint}?url=${encodeURIComponent(abs)}`;
    } catch {
      return line;
    }
  }).join('\n');
}

async function handleLive(request) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/vod') {
      return handleVod(request);
    }

    if (url.pathname === '/api/live') {
      return handleLive(request);
    }

    // Serve static assets if binding exists
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('DuCinema Worker active', { status: 200 });
  }
};
