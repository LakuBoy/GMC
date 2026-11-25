// Server-side helpers for OpenStreetMap services (used by the API routes only).
// Public servers have usage policies: identify ourselves, cache, and stay at low volume.

const CONTACT = process.env.OSM_CONTACT || 'gmc-local-dev';
export const USER_AGENT = `gmc-places/0.2 (${CONTACT})`;

const NOMINATIM = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const OVERPASS = (process.env.OVERPASS_URL ||
  'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter')
  .split(',').map((u) => u.trim()).filter(Boolean);

// Tiny in-memory cache (per server instance).
const cache = new Map();
export function cached(key, ttlMs, load) {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return Promise.resolve(hit.value);
  return load().then((value) => {
    cache.set(key, { value, expires: Date.now() + ttlMs });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return value;
  });
}

// Nominatim allows at most 1 request per second.
let nextSlot = 0;
async function throttle() {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + 1100;
  if (wait) await new Promise((r) => setTimeout(r, wait));
}

export async function searchPlace(q) {
  await throttle();
  const url = `${NOMINATIM}/search?${new URLSearchParams({ q, format: 'jsonv2', limit: '5', addressdetails: '0' })}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const items = await res.json();
  return items.map((i) => ({
    name: i.display_name,
    lat: Number(i.lat),
    lng: Number(i.lon),
    // [south, north, west, east] as strings in Nominatim
    bbox: i.boundingbox ? i.boundingbox.map(Number) : null,
  }));
}

export const CATEGORIES = {
  restaurants: { label: 'Restaurant', filter: '["amenity"~"^(restaurant|fast_food|cafe)$"]' },
  hotels: { label: 'Hotel', filter: '["tourism"~"^(hotel|guest_house|hostel|motel|apartment)$"]' },
  attractions: { label: 'Attraction', filter: '["tourism"~"^(attraction|museum|viewpoint|zoo|theme_park|gallery)$"]' },
};

function describe(tags, type) {
  const raw = tags.amenity || tags.tourism || type;
  return raw.replace(/_/g, ' ');
}

function address(tags) {
  const street = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  return [street, tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ') || null;
}

async function overpassPlaces(type, [south, west, north, east]) {
  const cat = CATEGORIES[type];
  const query = `[out:json][timeout:20];nwr${cat.filter}["name"](${south},${west},${north},${east});out center 120;`;
  let lastError;
  for (const base of OVERPASS) {
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'User-Agent': USER_AGENT, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ data: query }),
        signal: AbortSignal.timeout(7000),
      });
      if (!res.ok) throw new Error(`overpass ${res.status}`);
      const { elements } = await res.json();
      return elements
        .map((e) => {
          const lat = e.lat ?? e.center?.lat;
          const lng = e.lon ?? e.center?.lon;
          if (lat == null || lng == null) return null;
          const t = e.tags || {};
          return {
            id: `${e.type}/${e.id}`,
            category: type,
            name: t.name,
            kind: describe(t, cat.label.toLowerCase()),
            lat, lng,
            cuisine: t.cuisine ? t.cuisine.replace(/;/g, ', ').replace(/_/g, ' ') : null,
            stars: t.stars || null,
            phone: t.phone || t['contact:phone'] || null,
            website: t.website || t['contact:website'] || null,
            hours: t.opening_hours || null,
            address: address(t),
          };
        })
        .filter(Boolean);
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError || new Error('no overpass server configured');
}

// Fallback when the public Overpass servers are down: the geocoder can also list places inside a box.
// It returns at most about 40 places, but its servers are far more reliable.
const NOMINATIM_TERM = { restaurants: 'restaurant', hotels: 'hotel', attractions: 'attraction' };

function categoryOf(i) {
  if (['restaurant', 'fast_food', 'cafe'].includes(i.type)) return 'restaurants';
  if (['hotel', 'guest_house', 'hostel', 'motel', 'apartment'].includes(i.type)) return 'hotels';
  return 'attractions';
}

function shapeNominatim(i, category = categoryOf(i)) {
  const t = i.extratags || {};
  const a = i.address || {};
  return {
    id: `${i.osm_type}/${i.osm_id}`,
    category,
    name: i.name || i.display_name?.split(',')[0],
    kind: (i.type || CATEGORIES[category].label).replace(/_/g, ' '),
    lat: Number(i.lat), lng: Number(i.lon),
    cuisine: t.cuisine ? t.cuisine.replace(/;/g, ', ').replace(/_/g, ' ') : null,
    stars: t.stars || null,
    phone: t.phone || t['contact:phone'] || null,
    website: t.website || t['contact:website'] || null,
    hours: t.opening_hours || null,
    address: [[a.house_number, a.road].filter(Boolean).join(' '), a.suburb, a.city || a.town].filter(Boolean).join(', ') || null,
  };
}

async function nominatimPlaces(type, [south, west, north, east]) {
  await throttle();
  const params = new URLSearchParams({
    q: NOMINATIM_TERM[type], format: 'jsonv2', limit: '40', bounded: '1',
    viewbox: `${west},${north},${east},${south}`, extratags: '1', addressdetails: '1',
  });
  const res = await fetch(`${NOMINATIM}/search?${params}`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const items = await res.json();
  return items.filter((i) => i.name).map((i) => shapeNominatim(i, type));
}

// If Overpass failed recently, skip it for a few minutes so users are not kept waiting.
let overpassDownUntil = 0;

export async function placesIn(type, box) {
  if (Date.now() >= overpassDownUntil) {
    try {
      return await overpassPlaces(type, box);
    } catch (e) {
      overpassDownUntil = Date.now() + 5 * 60 * 1000;
      console.warn('overpass unavailable, using geocoder fallback:', e.message);
    }
  }
  return nominatimPlaces(type, box);
}

// One place by OpenStreetMap id, for the shareable detail page. Returns null when it does not exist.
const OSM_PREFIX = { node: 'N', way: 'W', relation: 'R' };

export async function lookupPlace(osmType, osmId) {
  if (!OSM_PREFIX[osmType] || !/^\d{1,15}$/.test(String(osmId))) return null;
  await throttle();
  const params = new URLSearchParams({
    osm_ids: `${OSM_PREFIX[osmType]}${osmId}`, format: 'jsonv2', extratags: '1', addressdetails: '1',
  });
  const res = await fetch(`${NOMINATIM}/lookup?${params}`, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`nominatim ${res.status}`);
  const [item] = await res.json();
  return item ? shapeNominatim(item) : null;
}
