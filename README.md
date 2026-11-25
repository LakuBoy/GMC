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

## Design system

- Theme tokens live in `theme/index.js` (brand teal, semantic colors for light and dark, radii, shadows). Components use tokens such as `bg="surface"` and `color="muted"`, never raw colors, so dark mode needs no per-component code.
- Font: Plus Jakarta Sans, bundled through `@fontsource-variable` (no request to Google Fonts).
- Phone layout: full-screen map with a draggable bottom sheet (peek, half, full). Desktop: results panel beside the map.
- Map pins are clustered and colored by category; the chosen place is orange. Dark mode darkens the tiles.
- Every place has a shareable page at `/place/<node|way|relation>-<osm id>`, rendered on the server for link previews.
- The browser never asks for location on load; "Use my location" asks only when pressed.

## Notes

- Public OpenStreetMap servers are for light use. For real traffic, self-host them or use a paid provider.
- OpenStreetMap has no ratings or photos, so the old rating filter and photos are gone.
- Coverage varies by area; contribute missing places at openstreetmap.org.
