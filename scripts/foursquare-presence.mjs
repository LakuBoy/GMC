// Free-tier check: does Foursquare list these Kampala places at all (basic fields only)?
// Run: node --env-file=.env.local scripts/foursquare-presence.mjs
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('./foursquare-spike.mjs', import.meta.url), 'utf8');
const VENUES = eval(src.slice(src.indexOf('const VENUES = ') + 15, src.indexOf('.map(([name')) + '.map(([name, lat, lng]) => ({ name, lat, lng }))');
const h = { Authorization: `Bearer ${process.env.FOURSQUARE_API_KEY}`, Accept: 'application/json', 'X-Places-Api-Version': '2025-06-17' };
const first = (s) => s.toLowerCase().split(/\s+/)[0];
let hit = 0;
const rows = [];
for (const v of VENUES) {
  const r = await fetch(`https://places-api.foursquare.com/places/search?${new URLSearchParams({ query: v.name, ll: `${v.lat},${v.lng}`, radius: '400', limit: '1' })}`, { headers: h });
  const b = r.ok ? await r.json() : {};
  const p = b.results?.[0];
  const match = !!p && p.name.toLowerCase().includes(first(v.name));
  if (match) hit += 1;
  rows.push({ asked: v.name, got: p?.name ?? '-', match, status: r.status });
  await new Promise((x) => setTimeout(x, 250));
}
console.table(rows);
console.log(`Listed by Foursquare (name matches): ${hit}/${VENUES.length}`);
