import { Box, Flex } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import List from '../components/List';

// Leaflet needs the browser, so the map is never rendered on the server.
const Map = dynamic(() => import('../components/Map'), {
  ssr: false,
  loading: () => <Box width="full" height="full" bg="gray.100" />,
});

const KAMPALA = [0.3476, 32.5825];

function distanceKm(aLat, aLng, bLat, bLng) {
  const rad = (d) => (d * Math.PI) / 180;
  const h = Math.sin(rad(bLat - aLat) / 2) ** 2 +
    Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(rad(bLng - aLng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export default function Home() {
  const [type, setType] = useState('restaurants');
  const [places, setPlaces] = useState([]);
  const [status, setStatus] = useState({ loading: true, error: null });
  const [bounds, setBounds] = useState(null); // { south, west, north, east, center: [lat, lng] }
  const [view, setView] = useState({ center: KAMPALA, zoom: 14, nonce: 0 }); // commands the map
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState(null);

  // Start at the user's position; fall back to Kampala.
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setView((v) => ({ center: [coords.latitude, coords.longitude], zoom: 15, nonce: v.nonce + 1 })),
      () => setNotice('Location is off, so the map starts in Kampala. Use the search box to go elsewhere.'),
      { timeout: 8000 },
    );
  }, []);

  // Load places whenever the category or the visible area changes (debounced while the map moves).
  useEffect(() => {
    if (!bounds) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setStatus({ loading: true, error: null });
      try {
        const q = new URLSearchParams({
          type, south: bounds.south, west: bounds.west, north: bounds.north, east: bounds.east,
        });
        const res = await fetch(`/api/places?${q}`, { signal: controller.signal });
        const body = await res.json();
        if (!res.ok) {
          setPlaces([]);
          setStatus({ loading: false, error: body.error || 'Could not load places' });
          return;
        }
        setPlaces(body.places);
        setStatus({ loading: false, error: null });
      } catch (e) {
        if (e.name !== 'AbortError') setStatus({ loading: false, error: 'Could not reach the server' });
      }
    }, 600);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [type, bounds]);

  const sorted = useMemo(() => {
    const [lat, lng] = bounds?.center || view.center;
    return places
      .map((p) => ({ ...p, km: distanceKm(lat, lng, p.lat, p.lng) }))
      .sort((a, b) => a.km - b.km);
  }, [places, bounds, view.center]);

  const goTo = useCallback((target) => {
    setSelectedId(null);
    setView((v) => ({ center: [target.lat, target.lng], bbox: target.bbox || null, zoom: 15, nonce: v.nonce + 1 }));
  }, []);

  return (
    <>
      <Head>
        <title>Places nearby</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Flex direction="column" height="100dvh" width="100vw" overflow="hidden" bg="gray.50">
        <Header type={type} setType={setType} onPick={goTo} />
        <Flex flex={1} minH={0} direction={{ base: 'column', md: 'row' }}>
          <Box order={{ base: 1, md: 2 }} flex={{ base: 'none', md: 1 }} height={{ base: '42%', md: 'auto' }} minH={0}>
            <Map
              view={view}
              places={sorted}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onBounds={setBounds}
            />
          </Box>
          <Box
            order={{ base: 2, md: 1 }}
            width={{ base: 'full', md: '420px' }}
            flex={{ base: 1, md: 'none' }}
            minH={0}
            bg="white"
            borderRightWidth={{ md: '1px' }}
            borderColor="gray.200"
            display="flex"
            flexDirection="column"
          >
            <List
              places={sorted}
              status={status}
              notice={notice}
              onDismissNotice={() => setNotice(null)}
              selectedId={selectedId}
              onSelect={setSelectedId}
              type={type}
            />
          </Box>
        </Flex>
      </Flex>
    </>
  );
}
