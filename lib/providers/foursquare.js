// Foursquare Places adapter (needs FOURSQUARE_API_KEY). Field names and free-tier limits change,
// so confirm them on Foursquare's developer site before enabling this in production.
const BASE = 'https://places-api.foursquare.com';

async function call(path, params) {
  const res = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, {
    headers: {
      Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY}`,
      Accept: 'application/json',
      'X-Places-Api-Version': '2025-06-17',
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`foursquare ${res.status}`);
  return res.json();
}

export const foursquare = {
  name: 'foursquare',
  async details(place) {
    const found = await call('/places/search', {
      query: place.name, ll: `${place.lat},${place.lng}`, radius: '150', limit: '1',
      fields: 'fsq_place_id,name,rating,stats,price,photos',
    });
    const hit = found.results?.[0];
    if (!hit || (hit.rating == null && !hit.photos?.length)) return null;
    return {
      rating: hit.rating != null ? hit.rating / 2 : null, // Foursquare rates out of 10
      ratingCount: hit.stats?.total_ratings ?? null,
      photos: (hit.photos || []).slice(0, 4).map((p) => `${p.prefix}300x300${p.suffix}`),
      priceLevel: hit.price ?? null,
      source: 'Foursquare',
      license: 'Foursquare terms: show attribution, do not store beyond the cache period',
    };
  },
};
