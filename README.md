# Places nearby

Find restaurants, hotels and attractions on a map. Built with Next.js (pages router), Chakra UI and
Leaflet. All data comes from OpenStreetMap: no Google Maps and no paid API keys.

## Run

```bash
npm install
cp .env.example .env.local     # set OSM_CONTACT to your email or URL
npm run dev                    # http://localhost:3000
```

Needs Node 20.9 or newer. `npm run build` then `npm start` for production.

## How it works

- Map: Leaflet with OpenStreetMap tiles.
- `GET /api/search?q=` finds a place by name (Nominatim, cached, max 1 request/second).
- `GET /api/places?type=restaurants|hotels|attractions&south=&west=&north=&east=` lists places in the
  visible map area (Overpass; falls back to Nominatim when the public Overpass servers are down, which
  then returns at most about 40 places). Results are cached for 10 minutes.
- The browser only talks to this app's own `/api` routes.

## Notes

- Public OpenStreetMap servers are for light use. For real traffic, self-host them or use a paid provider.
- OpenStreetMap has no ratings or photos, so the old rating filter and photos are gone.
- Coverage varies by area; contribute missing places at openstreetmap.org.
