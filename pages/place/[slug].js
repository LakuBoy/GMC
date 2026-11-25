import { Box, Button, Flex, Text } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import NextLink from 'next/link';
import { BiArrowBack } from 'react-icons/bi';
import { useColorMode } from '@chakra-ui/react';
import ColorModeToggle from '../../components/ColorModeToggle';
import EmptyState from '../../components/EmptyState';
import { Logo } from '../../components/icons';
import PlaceView from '../../components/PlaceView';
import { useCurrency, useRates } from '../../lib/hooks';
import { cached, lookupPlace } from '../../lib/osm';

const Map = dynamic(() => import('../../components/Map'), { ssr: false, loading: () => <Box height="full" bg="subtle" /> });

// Server-rendered so a shared link shows the name and details in previews and search results.
export async function getServerSideProps({ params, res }) {
  const m = /^(node|way|relation)-(\d{1,15})$/.exec(params.slug);
  if (!m) return { notFound: true };
  try {
    const place = await cached(`l:${params.slug}`, 3600 * 1000, () => lookupPlace(m[1], m[2]));
    if (!place) return { notFound: true };
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return { props: { place } };
  } catch (e) {
    console.error('place lookup failed:', e.message);
    res.statusCode = 503;
    return { props: { place: null } };
  }
}

const noop = () => {};

export default function PlacePage({ place }) {
  const { colorMode } = useColorMode();
  const [currency] = useCurrency();
  const { rates } = useRates();
  const title = place ? `${place.name} · Places nearby` : 'Place unavailable · Places nearby';
  const description = place
    ? [place.kind, place.address].filter(Boolean).join(' · ') || 'Place details from OpenStreetMap'
    : 'Could not load this place right now.';

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="place" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      <Flex direction="column" minH="100dvh">
        <Flex as="header" align="center" justify="space-between" px={4} py={3} bg="surface" borderBottomWidth="1px" borderColor="line">
          <Button as={NextLink} href="/" leftIcon={<BiArrowBack />} variant="ghost" size="sm">
            <Flex align="center" gap={2}><Logo size={20} /><Text fontWeight={800}>Places nearby</Text></Flex>
          </Button>
          <ColorModeToggle size="sm" />
        </Flex>

        {place ? (
          <Flex flex={1} direction={{ base: 'column', md: 'row' }} minH={0}>
            <Box width={{ base: 'full', md: '480px' }} flexShrink={0} bg="surface" overflowY="auto">
              <PlaceView place={place} standalone currency={currency} rates={rates} />
            </Box>
            <Box flex={1} minH={{ base: '320px', md: 'auto' }} position="relative">
              <Map
                view={{ center: [place.lat, place.lng], zoom: 16, nonce: 0 }} places={[]} selected={place}
                onSelect={noop} onBounds={noop} dark={colorMode === 'dark'}
              />
            </Box>
          </Flex>
        ) : (
          <EmptyState kind="error" title="This place could not be loaded" action={{ label: 'Back to the map', onClick: () => { window.location.href = '/'; } }}>
            The place service is busy. Please try again in a moment.
          </EmptyState>
        )}
      </Flex>
    </>
  );
}
