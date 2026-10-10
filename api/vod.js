export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const SOURCES = {
    'guangsu': 'https://api.guangsuapi.com/api.php/provide/vod/',
    'bdzy': 'https://api.apibdzy.com/api.php/provide/vod/',
    'ffzy': 'https://cj.ffzyapi.com/api.php/provide/vod/',
    'xinlang': 'https://api.xinlangapi.com/xinlangapi.php/provide/vod/'
  };

  const url = new URL(request.url);
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuCinema-Edge/1.0'
      }
    });

    if (!upstreamRes.ok) {
      throw new Error(`Upstream returned ${upstreamRes.status}`);
    }

    const data = await upstreamRes.text();
    return new Response(data, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      code: 0,
      msg: 'Upstream gateway error',
      error: err.message,
      list: []
    }), {
      status: 502,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
  }
}
