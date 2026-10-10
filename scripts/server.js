import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const SOURCES = {
  'guangsu': 'https://api.guangsuapi.com/api.php/provide/vod/',
  'bdzy': 'https://api.apibdzy.com/api.php/provide/vod/',
  'ffzy': 'https://cj.ffzyapi.com/api.php/provide/vod/',
  'xinlang': 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/'
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const server = http.createServer(async (req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  
  // Set global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Proxy Route: /api/vod
  if (reqUrl.pathname === '/api/vod') {
    try {
      const searchParams = reqUrl.searchParams;
      const sourceKey = searchParams.get('source') || 'guangsu';
      const baseApi = SOURCES[sourceKey] || SOURCES['guangsu'];
      
      // Clean internal source param before forwarding to upstream
      searchParams.delete('source');

      if (!searchParams.has('ac')) {
        searchParams.set('ac', 'detail');
      }

      const targetUrl = `${baseApi}?${searchParams.toString()}`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuCinema/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Upstream error: ${response.status}`);
      }

      const data = await response.text();
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=120'
      });
      res.end(data);
      return;
    } catch (err) {
      console.error('API Proxy Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ code: 0, msg: 'Upstream connection failed', error: err.message, list: [] }));
      return;
    }
  }

  // Live TV Stream Proxy Route: /api/live
  if (reqUrl.pathname === '/api/live') {
    const targetUrl = reqUrl.searchParams.get('url');
    if (!targetUrl || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Missing or invalid "url" parameter' }));
      return;
    }

    try {
      const upstreamRes = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': new URL(targetUrl).origin + '/'
        }
      });

      if (!upstreamRes.ok) {
        res.writeHead(upstreamRes.status, { 'Content-Type': 'text/plain' });
        res.end(`Upstream error: ${upstreamRes.status}`);
        return;
      }

      const contentType = upstreamRes.headers.get('content-type') || '';
      const isM3u8 = targetUrl.toLowerCase().includes('.m3u8') ||
                     contentType.toLowerCase().includes('mpegurl') ||
                     contentType.toLowerCase().includes('application/vnd.apple.mpegurl');

      if (isM3u8) {
        const text = await upstreamRes.text();
        if (text.includes('#EXTM3U')) {
          const lines = text.split(/\r?\n/);
          const rewritten = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            if (trimmed.startsWith('#')) {
              if (trimmed.includes('URI=')) {
                return trimmed.replace(/URI="([^"]+)"/g, (m, uri) => {
                  try {
                    const abs = new URL(uri, targetUrl).href;
                    return `URI="/api/live?url=${encodeURIComponent(abs)}"`;
                  } catch { return m; }
                });
              }
              return line;
            }
            try {
              const abs = new URL(trimmed, targetUrl).href;
              return `/api/live?url=${encodeURIComponent(abs)}`;
            } catch { return line; }
          }).join('\n');

          res.writeHead(200, {
            'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
            'Cache-Control': 'no-cache, no-store, must-revalidate'
          });
          res.end(rewritten);
          return;
        }
      }

      // Binary TS chunk or media stream
      let resolvedContentType = 'video/mp2t';
      if (targetUrl.toLowerCase().includes('.ts') || contentType.includes('octet-stream')) {
        resolvedContentType = 'video/mp2t';
      } else if (contentType) {
        resolvedContentType = contentType;
      }

      const headers = {
        'Content-Type': resolvedContentType,
        'Cache-Control': 'public, max-age=3600'
      };
      const len = upstreamRes.headers.get('content-length');
      if (len) headers['Content-Length'] = len;

      res.writeHead(200, headers);
      if (upstreamRes.body) {
        Readable.fromWeb(upstreamRes.body).pipe(res);
      } else {
        res.end();
      }
      return;
    } catch (err) {
      console.error('Live Proxy Error:', err.message);
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Live proxy upstream failed', message: err.message }));
      return;
    }
  }

  // Static File Serving
  const ROOT_DIR = path.join(__dirname, '..');
  let filePath = path.join(ROOT_DIR, reqUrl.pathname === '/' ? 'index.html' : reqUrl.pathname);
  
  // Normalize & prevent path traversal
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA-style routing if file not found
      filePath = path.join(ROOT_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500);
        res.end('Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 渡影 (DuCinema) 服务已启动: http://localhost:${PORT} / http://127.0.0.1:${PORT}`);
  console.log(`📡 渡赏片库 API 接口: http://localhost:${PORT}/api/vod`);
});
