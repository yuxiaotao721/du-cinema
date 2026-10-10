export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const SOURCES = {
    'guangsu': 'https://api.guangsuapi.com/api.php/provide/vod/',
    'bdzy': 'https://api.apibdzy.com/api.php/provide/vod/',
    'ffzy': 'https://cj.ffzyapi.com/api.php/provide/vod/',
    'xinlang': 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/'
  };

  const { ac = 'detail', wd = '', t = '', pg = '1', ids = '', source = 'guangsu' } = req.query;
  const upstream = SOURCES[source] || SOURCES['guangsu'];

  const params = new URLSearchParams();
  params.set('ac', ac);
  if (wd) params.set('wd', wd);
  if (t) params.set('t', t);
  if (pg) params.set('pg', pg);
  if (ids) params.set('ids', ids);

  try {
    const upstreamRes = await fetch(`${upstream}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuCinema-Edge/1.0'
      }
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream returned ${upstreamRes.status}`);
    }

    const data = await upstreamRes.json();
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');
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
