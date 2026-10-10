export default async function handler(req, res) {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const SOURCES = {
    'guangsu': 'https://api.guangsuapi.com/api.php/provide/vod/',
    'bdzy': 'https://api.apibdzy.com/api.php/provide/vod/',
    'ffzy': 'https://cj.ffzyapi.com/api.php/provide/vod/',
    'xinlang': 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/'
  };

  const parsedUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const q = req.query || {};

  const ac = parsedUrl.searchParams.get('ac') || q.ac || 'detail';
  const wd = parsedUrl.searchParams.get('wd') || q.wd || '';
  const t = parsedUrl.searchParams.get('t') || q.t || '';
  const pg = parsedUrl.searchParams.get('pg') || q.pg || '1';
  const source = parsedUrl.searchParams.get('source') || q.source || 'guangsu';

  const upstream = SOURCES[source] || SOURCES['guangsu'];

  const params = new URLSearchParams();
  params.set('ac', ac);
  if (wd) params.set('wd', wd);
  if (t) params.set('t', t);
  if (pg) params.set('pg', pg);

  try {
    const upstreamRes = await fetch(`${upstream}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuCinema-Vercel/1.0'
      }
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream returned ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({
      code: 0,
      msg: 'Upstream gateway error',
      error: err.message,
      list: []
    });
  }
}
