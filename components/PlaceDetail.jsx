import { Badge, Box, Flex, Link, Text } from '@chakra-ui/react';
import { IoCall, IoGlobeOutline, IoLocation, IoTimeOutline } from 'react-icons/io5';

const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

function Row({ icon: Icon, children }) {
  return (
    <Flex align="flex-start" gap={2} color="gray.600" fontSize="sm">
      <Box as={Icon} mt="3px" flexShrink={0} />
      <Box minW={0}>{children}</Box>
    </Flex>
  );
}

export default function PlaceDetail({ place, selected, onSelect }) {
  const km = place.km < 1 ? `${Math.round(place.km * 1000)} m` : `${place.km.toFixed(1)} km`;
  return (
    <Box
      as="article" role="button" tabIndex={0} onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
      p={4} rounded="lg" borderWidth="2px" cursor="pointer" bg="white"
      borderColor={selected ? 'red.400' : 'gray.200'} shadow={selected ? 'md' : 'none'}
      _hover={{ borderColor: selected ? 'red.400' : 'blue.300' }} transition="all 0.15s"
    >
      <Flex justify="space-between" gap={3} align="flex-start">
        <Text fontWeight={600} fontSize="lg" lineHeight="short">{place.name}</Text>
        <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">{km}</Text>
      </Flex>
      <Flex gap={2} mt={1} mb={2} wrap="wrap">
        <Badge colorScheme="blue" textTransform="capitalize">{place.kind}</Badge>
        {place.cuisine && <Badge colorScheme="orange" textTransform="capitalize">{place.cuisine}</Badge>}
        {place.stars && <Badge colorScheme="yellow">{place.stars} star</Badge>}
      </Flex>
      <Flex direction="column" gap={1}>
        {place.address && <Row icon={IoLocation}>{place.address}</Row>}
        {place.hours && <Row icon={IoTimeOutline}>{place.hours}</Row>}
        {place.phone && (
          <Row icon={IoCall}>
            <Link href={`tel:${place.phone.replace(/[^+\d]/g, '')}`} onClick={(e) => e.stopPropagation()}>{place.phone}</Link>
          </Row>
        )}
        {place.website && (
          <Row icon={IoGlobeOutline}>
            <Link href={safeUrl(place.website)} isExternal rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              {place.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
            </Link>
          </Row>
        )}
      </Flex>
    </Box>
  );
}
