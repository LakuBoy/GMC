import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import { IoLocation } from 'react-icons/io5';
import { FeatureIcons, OpenBadge, Price } from './badges';
import { ConfirmedLine, Stars } from './community';
import { SaveButton } from './Favorites';
import { CategoryTile } from './icons';

// Compact list card: what people scan. (Photos arrive later.)
export default function PlaceCard({ place, selected, onSelect, currency, rates }) {
  const { summary } = place;
  const km = place.km < 1 ? `${Math.round(place.km * 1000)} m` : `${place.km.toFixed(1)} km`;
  return (
    <Box
      as="article" role="button" tabIndex={0} aria-pressed={selected} onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      p={3} rounded="card" borderWidth="2px" cursor="pointer" bg="surface" shadow="card"
      borderColor={selected ? 'selectedBorder' : 'transparent'}
      _hover={{ shadow: 'lift', transform: 'translateY(-1px)' }} transition="all .15s"
    >
      <Flex gap={3}>
        <CategoryTile category={place.category} />
        <Box flex={1} minW={0}>
          <Flex justify="space-between" gap={2} align="flex-start">
            <Text fontWeight={700} fontSize="md" lineHeight="short" noOfLines={2}>{place.name}</Text>
            <Flex align="center" gap={1} flexShrink={0}>
              <Text fontSize="xs" color="muted" fontWeight={600} whiteSpace="nowrap">{km}</Text>
              <SaveButton place={place} color="primary" mt="-6px" me="-6px" />
            </Flex>
          </Flex>
          {summary?.count > 0 && (
            <Flex align="center" gap={1.5} fontSize="sm">
              <Text fontWeight={800}>{summary.rating.toFixed(1)}</Text>
              <Stars value={summary.rating} />
              <Text color="muted">({summary.count})</Text>
            </Flex>
          )}
          <Flex gap={1.5} mt={1} wrap="wrap">
            <Badge colorScheme="brand" textTransform="capitalize">{place.kind}</Badge>
            {place.cuisine && <Badge colorScheme="orange" textTransform="capitalize">{place.cuisine}</Badge>}
            {place.stars && <Badge colorScheme="yellow">{place.stars} star</Badge>}
          </Flex>
          {place.address && (
            <Flex align="center" gap={1.5} mt={2} color="muted" fontSize="sm" minW={0}>
              <Box as={IoLocation} flexShrink={0} />
              <Text noOfLines={1}>{place.address}</Text>
            </Flex>
          )}
          <Flex align="center" justify="space-between" gap={2} mt={2} wrap="wrap">
            <OpenBadge status={place.status} />
            <FeatureIcons features={place.features} />
          </Flex>
          <Box mt={1}><ConfirmedLine summary={summary} /></Box>
          {place.price && <Box mt={1}><Price price={place.price} currency={currency} rates={rates} /></Box>}
        </Box>
      </Flex>
    </Box>
  );
}
