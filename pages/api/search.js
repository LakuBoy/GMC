import { cached, searchPlace } from '../../lib/osm';

// GET /api/search?q=Lugogo Mall
export default async function handler(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 3 || q.length > 200) return res.status(400).json({ error: 'Type at least 3 characters' });
  try {
    const results = await cached(`s:${q.toLowerCase()}`, 24 * 3600 * 1000, () => searchPlace(q));
    res.status(200).json({ results });
  } catch (e) {
    console.error('search failed:', e.message);
    res.status(502).json({ error: 'Place search is unavailable right now.' });
  }
}
