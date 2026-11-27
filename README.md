# Places nearby

Find restaurants, hotels and attractions on a map. Built with Next.js (pages router), Chakra UI and
Leaflet. Place data comes from OpenStreetMap; ratings, reviews and local facts come from our own
visitors. No Google Maps.

## Run

```bash
npm install
cp .env.example .env.local     # set OSM_CONTACT, and the account settings if you want sign-in
npm run db:migrate             # creates the tables (safe to run again)
npm run dev -- -p 3100         # http://localhost:3100
```

## Accounts and visitor data

- Sign-in uses NextAuth 4 with database sessions in Neon Postgres. In development, email sign-in prints
  the link in the server log. Production has no email sign-in until a sending service is added, so only
  Google works there.
- Signed-in visitors can save places, write one review per place, report reviews, answer "is it still
  there?" and vote on local facts. Guests can read everything.
- A review is hidden after 3 people report it. There is no admin screen for reviewing reports yet.
- Reviews show a chosen name or "First L.", never the email address.
- `/account` has saved places, the display name and account deletion (which removes all their data).
- API routes share one wrapper (`lib/server/api.js`): same-origin check, sign-in, Zod validation and
  per-user rate limits. Rules shared with the browser are in `lib/community.js`.
- Place ids are checked for format only, not for whether the place exists in OpenStreetMap.

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
