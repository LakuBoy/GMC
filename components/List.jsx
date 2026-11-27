import { Alert, AlertDescription, AlertIcon, Box, Button, CloseButton, Flex, Select, Skeleton, SkeletonText, Text } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import EmptyState from './EmptyState';
import { LOCAL_FACTS } from '../lib/community';
import { FEATURES, RatesCredit } from './badges';
import PlaceCard from './PlaceCard';

const NAMES = { restaurants: 'restaurants and cafes', hotels: 'hotels and guest houses', attractions: 'attractions' };

function SkeletonCard() {
  return (
    <Flex p={3} gap={3} rounded="card" bg="surface" shadow="card">
      <Skeleton width="56px" height="56px" rounded="14px" flexShrink={0} />
      <Box flex={1}>
        <Skeleton height="16px" width="65%" />
        <SkeletonText mt={3} noOfLines={2} spacing={2} skeletonHeight="3" />
      </Box>
    </Flex>
  );
}

export default function List({
  places, total, status, notice, onDismissNotice, selectedId, onSelect, onRetry, type,
  filters, toggleFilter, clearFilters, currency, setCurrency, rates,
}) {
  const refs = useRef({});

  // Keep the chosen card in view when it is picked on the map.
  useEffect(() => {
    refs.current[selectedId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  const tooLarge = status.code === 'too_large';
  const filtered = Object.values(filters).some(Boolean);
  const showEmpty = !status.loading && places.length === 0;

  return (
    <Flex direction="column" flex={1} minH={0}>
      <Flex px={4} py={2} justify="space-between" align="baseline">
        <Text fontWeight={700} aria-live="polite">
          {status.loading ? 'Looking for places…' : tooLarge ? 'Zoom in to see places' : (places.length === total ? `${places.length} ${NAMES[type]}` : `${places.length} of ${total} ${NAMES[type]}`)}
        </Text>
        <Select
          size="xs" width="auto" rounded="pill" borderColor="line" value={currency} aria-label="Show prices in"
          onChange={(e) => setCurrency(e.target.value)}
        >
          <option value="both">UGX + USD</option>
          <option value="ugx">UGX</option>
          <option value="usd">USD</option>
        </Select>
      </Flex>

      <Flex gap={2} px={3} pb={2} overflowX="auto" sx={{ scrollbarWidth: 'none' }} role="group" aria-label="Filters">
        {[
          { id: 'open', label: 'Open now' },
          ...FEATURES.filter((f) => !f.only || f.only.includes(type)),
          ...LOCAL_FACTS.filter((f) => f.chip).map((f) => ({ id: f.id, label: f.chip })),
        ].map((f) => {
          const on = !!filters[f.id];
          return (
            <Button
              key={f.id} size="xs" flexShrink={0} rounded="pill" aria-pressed={on} onClick={() => toggleFilter(f.id)}
              leftIcon={f.icon ? <f.icon /> : undefined} variant={on ? 'solid' : 'outline'}
              bg={on ? undefined : 'surface'} borderColor="line"
            >
              {f.label}
            </Button>
          );
        })}
      </Flex>

      {notice && (
        <Alert status="info" fontSize="sm" py={2} mx={3} mb={2} rounded="lg" width="auto">
          <AlertIcon />
          <AlertDescription flex={1}>{notice}</AlertDescription>
          <CloseButton size="sm" onClick={onDismissNotice} />
        </Alert>
      )}

      <Flex flex={1} minH={0} overflowY="auto" direction="column" px={3} pb={4} gap={3}>
        {status.loading && !places.length && [0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}

        {showEmpty && tooLarge && (
          <EmptyState kind="zoom" title="Zoom in a little">
            This area is too big to list. Zoom in on the map, or search for a neighbourhood.
          </EmptyState>
        )}
        {showEmpty && status.error && !tooLarge && (
          <EmptyState kind="error" title="Could not load places" action={{ label: 'Try again', onClick: onRetry }}>
            {status.error}
          </EmptyState>
        )}
        {showEmpty && !status.error && !tooLarge && filtered && total > 0 && (
          <EmptyState kind="empty" title="No place matches these filters" action={{ label: 'Clear filters', onClick: clearFilters }}>
            Places without that detail from OpenStreetMap or from visitors are hidden when a filter is on.
          </EmptyState>
        )}
        {showEmpty && !status.error && !(filtered && total > 0) && (
          <EmptyState kind="empty" title="Nothing mapped here yet">
            Move the map, zoom out a little, or search another area. OpenStreetMap coverage varies by area.
          </EmptyState>
        )}

        {places.map((p) => (
          <div key={p.id} ref={(el) => { refs.current[p.id] = el; }}>
            <PlaceCard place={p} selected={p.id === selectedId} onSelect={() => onSelect(p)} currency={currency} rates={rates} />
          </div>
        ))}
        {places.length > 0 && <Box pt={1}><RatesCredit /></Box>}
      </Flex>
    </Flex>
  );
}
