// Coverage test: how many well-known Kampala places does Foursquare know, and with what data?
// Run:  node --env-file=.env.local scripts/foursquare-spike.mjs
import { foursquare } from '../lib/providers/foursquare.js';

const VENUES = [
  ['Protea Hotel Kampala', 0.3288, 32.5879], ['Serena Hotel Kampala', 0.3191, 32.5922],
  ['Sheraton Kampala Hotel', 0.3188, 32.5886], ['Kampala Marriott Hotel', 0.3180, 32.5940],
  ['Cafe Javas Acacia Mall', 0.3350, 32.5900], ['Cafe Javas Lugogo', 0.3260, 32.6020],
  ['Endiro Coffee', 0.3375, 32.5990], ['Mama Mia', 0.3105, 32.5990],
  ['Jinja Road Cafe', 0.3180, 32.5990], ['Lugogo Mall', 0.3262, 32.6007],
  ['Acacia Mall', 0.3349, 32.5902], ['Garden City Mall', 0.3399, 32.6040],
  ['Uganda Museum', 0.3330, 32.5710], ['Kasubi Tombs', 0.3475, 32.5530],
  ['Namugongo Martyrs Shrine', 0.3600, 32.6490], ['Uganda National Mosque', 0.3045, 32.5740],
  ['Rubaga Cathedral', 0.3040, 32.5527], ['Nakasero Market', 0.3170, 32.5810],
  ['Uganda Wildlife Education Centre Entebbe', 0.0570, 32.4830], ['Lake Victoria Hotel Entebbe', 0.0560, 32.4640],
  ['Fang Fang Restaurant', 0.3190, 32.5870], ['Cafe Javas Kampala Road', 0.3140, 32.5810],
  ['Ethiopian Village Restaurant', 0.3230, 32.5990], ['Mackinnon Market', 0.3130, 32.5780],
  ['Pizza Hut Garden City', 0.3399, 32.6040], ['KFC Acacia Mall', 0.3349, 32.5902],
  ['Makerere University', 0.3340, 32.5670], ['Kabalagala Cafe Sambuka', 0.2990, 32.6000],
  ['Hotel Africana', 0.3180, 32.5930], ['Golf Course Hotel', 0.3170, 32.5970],
].map(([name, lat, lng]) => ({ name, lat, lng }));

const rows = [];
let firstError = null;
for (const v of VENUES) {
  try {
    const d = await foursquare.details(v);
    rows.push({ name: v.name, found: !!d, rating: d?.rating ?? null, count: d?.ratingCount ?? null, photos: d?.photos?.length ?? 0 });
  } catch (e) {
    firstError ??= e.message;
    rows.push({ name: v.name, found: false, error: e.message });
  }
  await new Promise((r) => setTimeout(r, 300));
}

console.table(rows);
const ok = rows.filter((r) => r.found);
console.log(`Found with rating or photos: ${ok.length}/${rows.length}`);
console.log(`With a rating: ${rows.filter((r) => r.rating != null).length}`);
console.log(`With photos: ${rows.filter((r) => r.photos > 0).length}`);
if (firstError) console.log('First error:', firstError);
