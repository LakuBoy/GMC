import { Box, Flex, IconButton, useColorMode } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BiCurrentLocation } from 'react-icons/bi';
import BottomSheet from '../components/BottomSheet';
import Header from '../components/Header';
import List from '../components/List';
import PlaceView from '../components/PlaceView';
import { LOCAL_FACTS } from '../lib/community';
import { useSummaries } from '../lib/community-client';
import { useCurrency, useNow, useRates } from '../lib/hooks';
import { openStatus } from '../lib/hours';
import { parseCharge } from '../lib/money';

// Leaflet needs the browser, so the map is never rendered on the server.
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <Box width="full" height="full" bg="subtle" />,
});

const KAMPALA = [0.3476, 32.5825];

function distanceKm(aLat, aLng, bLat, bLng) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export default function Home() {
  const { colorMode } = useColorMode();
  // null until the browser tells us the screen size, so the server and first render agree.
  const [isMobile, setIsMobile] = useState(null);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const [type, setType] = useState('restaurants');
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null, code: null });
  const [retry, setRetry] = useState(0);
  const [bounds, setBounds] = useState(null); // { south, west, north, east, center: [lat, lng] }
  const [view, setView] = useState({ center: KAMPALA, zoom: 14, nonce: 0 }); // commands the map
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [snap, setSnap] = useState('half');
  const [sheetPx, setSheetPx] = useState(0);
  const [filters, setFilters] = useState({});
  const [currency, setCurrency] = useCurrency();
  const { rates } = useRates();
  const now = useNow();
  const toggleFilter = useCallback((id) => setFilters((f) => ({ ...f, [id]: !f[id] })), []);
  const clearFilters = useCallback(() => setFilters({}), []);

  const locate = useCallback(() => {
    if (!navigator.geolocation) { setNotice('This browser cannot share your location.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const c = [coords.latitude, coords.longitude];
        setUserPos(c); setLocating(false); setNotice(null);
        setView((v) => ({ center: c, zoom: 16, nonce: v.nonce + 1 }));
      },
      (err) => {
        setLocating(false);
        setNotice(err.code === 1
          ? 'Location is blocked for this site. Allow it in your browser settings, or search for a place.'
          : 'Could not get your location. Try again, or search for a place.');
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, []);

  // Never pop a permission prompt on load. Only jump to the user's position if they already allowed it.
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' })
      .then((p) => { if (p.state === 'granted') locate(); })
      .catch(() => {});
  }, [locate]);

  // Load places whenever the category or the visible area changes (debounced while the map moves).
  useEffect(() => {
    if (!bounds) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus((s) => ({ ...s, loading: true, error: null, code: null }));
      try {
        const q = new URLSearchParams({
          type, south: bounds.south, west: bounds.west, north: bounds.north, east: bounds.east,
        });
        const res = await fetch(`/api/places?${q}`, { signal: controller.signal });
        const body = await res.json();
        if (!res.ok) {
          setPlaces([]);
          setStatus({ loading: false, error: body.error || 'Could not load places', code: body.code || null });
          return;
        }
        setPlaces(body.places);
        setStatus({ loading: false, error: null, code: null });
      } catch (e) {
        if (e.name !== 'AbortError') setStatus({ loading: false, error: 'Could not reach the server', code: null });
      }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [type, bounds, retry]);

  const sorted = useMemo(() => {
    const [lat, lng] = bounds?.center || view.center;
    return places
      .map((p) => ({ ...p, km: distanceKm(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.km - b.km);
  }, [places, bounds, view.center]);

  // Ratings, confirmations and facts that visitors added.
  const [communityVersion, setCommunityVersion] = useState(0);
  const communityChanged = useCallback(() => setCommunityVersion((v) => v + 1), []);
  const summaries = useSummaries(sorted, communityVersion);

  // Add the open-now status, any price OSM knows and our own data, then apply the filter chips.
  const decorated = useMemo(() => sorted.map((p) => {
    const summary = summaries[p.id];
    // Wi-Fi counts when either the map or visitors say so.
    const features = summary?.facts.includes('wifi') ? { ...p.features, wifi: true } : p.features;
    return { ...p, features, summary, status: openStatus(p.hours, now), price: parseCharge(p.charge) };
  }), [sorted, now, summaries]);

  const visible = useMemo(() => decorated.filter((p) => (
    (!filters.open || p.status.state === 'open')
    && ['wifi', 'wheelchair', 'takeaway', 'outdoor', 'cards'].every((k) => !filters[k] || p.features?.[k])
    && LOCAL_FACTS.every((f) => !f.chip || !filters[f.id] || p.summary?.facts.includes(f.id))
  )), [decorated, filters]);

  const goTo = useCallback((target) => {
    setSelected(null);
    setView((v) => ({ center: [target.lat, target.lng], bbox: target.bbox || null, zoom: 15, nonce: v.nonce + 1 }));
  }, []);

  const select = useCallback((place) => {
    setSelected(place);
    setSnap((s) => (s === 'peek' ? 'half' : s));
  }, []);

  const panel = selected ? (
    <Box flex={1} minH={0} overflowY="auto">
      <PlaceView
        place={selected} onBack={() => setSelected(null)} currency={currency} rates={rates}
        onCommunityChange={communityChanged}
      />
    </Box>
  ) : (
    <List
      places={visible} total={decorated.length} status={status}
      filters={filters} toggleFilter={toggleFilter} clearFilters={clearFilters}
      currency={currency} setCurrency={setCurrency} rates={rates} notice={notice} onDismissNotice={() => setNotice(null)}
      selectedId={selected?.id} onSelect={select} onRetry={() => setRetry((n) => n + 1)} type={type}
    />
  );

  const map = (
    <Map
      view={view} places={visible} selected={selected} onSelect={select} onBounds={setBounds}
      dark={colorMode === 'dark'} userPos={userPos} bottomPad={isMobile ? sheetPx : 0} showZoom={!isMobile}
    />
  );

  return (
    <>
      <Head>
        <title>Places nearby</title>
        <meta name="description" content="Find restaurants, hotels and attractions on the map, with details from OpenStreetMap." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      {isMobile === null ? (
        <Box height="100dvh" bg="canvas" />
      ) : isMobile ? (
        <Box position="relative" height="100dvh" width="100vw" overflow="hidden">
          <Box position="absolute" inset={0}>{map}</Box>
          <Header type={type} setType={setType} onPick={goTo} onLocate={locate} locating={locating} floating />
          <IconButton
            aria-label="Use my location" icon={<BiCurrentLocation size={22} />} onClick={locate} isLoading={locating}
            position="absolute" right={3} zIndex={1040} rounded="full" size="lg" bg="surface" color="primary" shadow="lift"
            style={{ bottom: sheetPx + 12, transition: 'bottom .25s' }}
          />
          <BottomSheet snap={snap} setSnap={setSnap} onCovered={setSheetPx}>{panel}</BottomSheet>
        </Box>
      ) : (
        <Flex direction="column" height="100dvh" width="100vw" overflow="hidden">
          <Header type={type} setType={setType} onPick={goTo} onLocate={locate} locating={locating} />
          <Flex flex={1} minH={0}>
            <Flex
              direction="column" width="440px" flexShrink={0} bg="canvas" borderRightWidth="1px" borderColor="line" minH={0}
            >
              {panel}
            </Flex>
            <Box flex={1} position="relative">{map}</Box>
          </Flex>
        </Flex>
      )}
    </>
  );
}
