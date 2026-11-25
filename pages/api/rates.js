// Daily exchange rates (USD base) from the free ExchangeRate-API open endpoint.
// It asks for a visible credit link, which the app shows next to prices.
const FEED = 'https://open.er-api.com/v6/latest/USD';
const DAY = 24 * 3600 * 1000;
let last = null; // { rates, fetchedAt, updated }

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  if (!last || Date.now() - last.fetchedAt > DAY) {
    try {
      const r = await fetch(FEED, { signal: AbortSignal.timeout(8000) });
      const body = await r.json();
      if (body.result === 'success' && body.rates?.UGX) {
        last = { rates: body.rates, fetchedAt: Date.now(), updated: body.time_last_update_utc };
      }
    } catch (e) {
      console.warn('rates feed failed:', e.message); // keep the last good answer
    }
  }
  if (!last) return res.status(200).json({ rates: { UGX: 3700 }, stale: true, updated: null });
  return res.status(200).json({ rates: last.rates, stale: Date.now() - last.fetchedAt > DAY, updated: last.updated });
}
