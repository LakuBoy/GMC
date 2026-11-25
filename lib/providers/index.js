// External data sources sit behind one interface so any of them can be added or dropped
// without touching the UI. Every provider answers:
//   details(place) -> { rating, ratingCount, photos[], priceLevel, source, license } | null
// External ratings are always shown separately from our own reviews, with the source named.

import { foursquare } from './foursquare.js';

// Foursquare is only used when a key is configured. Coverage in Uganda is still unmeasured:
// run `node scripts/foursquare-spike.mjs` once to find out before relying on it.
const providers = process.env.FOURSQUARE_API_KEY ? [foursquare] : [];

export async function enrich(place) {
  for (const p of providers) {
    try {
      const d = await p.details(place);
      if (d) return d;
    } catch (e) {
      console.warn(`provider ${p.name} failed:`, e.message);
    }
  }
  return null;
}

export const activeProviders = () => providers.map((p) => p.name);
