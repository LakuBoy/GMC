import { CATEGORIES, cached, placesIn } from '../../lib/osm';

// GET /api/places?type=restaurants&south=..&west=..&north=..&east=..
export default async function handler(req, res) {
  const { type = 'restaurants' } = req.query;
  if (!CATEGORIES[type]) return res.status(400).json({ error: 'Unknown type' });

  const [south, west, north, east] = ['south', 'west', 'north', 'east'].map((k) => Number(req.query[k]));
  if ([south, west, north, east].some((n) => !Number.isFinite(n)) || south >= north || west >= east
      || south < -90 || north > 90 || west < -180 || east > 180) {
    return res.status(400).json({ error: 'Invalid map bounds' });
  }
  if (north - south > 0.5 || east - west > 0.5) {
    return res.status(400).json({ error: 'Zoom in to see places (area too large)', code: 'too_large' });
  }

  // Round the box so small pans reuse the cached answer (about 1 km grid).
  const r = (n) => Math.round(n * 100) / 100;
  const box = [r(south), r(west), r(north), r(east)];
  try {
    const places = await cached(`p:${type}:${box}`, 10 * 60 * 1000, () => placesIn(type, box));
    res.setHeader('Cache-Control', 'private, max-age=60');
    res.status(200).json({ places });
  } catch (e) {
    console.error('places lookup failed:', e.message);
    res.status(502).json({ error: 'The OpenStreetMap place service is busy. Try again in a moment.' });
  }
}
