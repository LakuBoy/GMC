# Foursquare coverage spike (2026-11-25)

Question: can Foursquare supply ratings and photos for places in Kampala?

- **Free tier:** only basic fields (name, location, category). Requesting rating, photos, price, stats or hours
  returns HTTP 429 "Your account has no API credits remaining". Those fields need purchased credits.
- **Coverage (30 well-known Kampala/Entebbe venues, basic search):** about 8 clearly listed
  (Protea Hotel, Serena Hotel, Rubaga Cathedral, Lake Victoria Hotel, Fang Fang, Makerere University,
  Hotel Africana, one Cafe Javas branch). About 20 missing or matched to the wrong place
  (Uganda Museum, Kasubi Tombs, Garden City Mall, Nakasero Market, Namugongo Shrine and others).
- **Decision:** do not build on Foursquare. Rely on our own reviews and photos (Phase C). The adapter in
  `lib/providers/` stays off unless `FOURSQUARE_API_KEY` is set, so a better source can be dropped in later.

Scripts: `scripts/foursquare-spike.mjs` (premium fields) and `scripts/foursquare-presence.mjs` (free fields).
