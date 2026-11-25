import { Alert, AlertDescription, AlertIcon, CloseButton, Flex, Skeleton, SkeletonText, Text } from '@chakra-ui/react';
import { useEffect, useRef } from 'react';
import PlaceDetail from './PlaceDetail';

const NAMES = { restaurants: 'restaurants and cafes', hotels: 'hotels and guest houses', attractions: 'attractions' };

export default function List({ places, status, notice, onDismissNotice, selectedId, onSelect, type }) {
  const refs = useRef({});

  // Keep the chosen card in view when it is picked on the map.
  useEffect(() => {
    refs.current[selectedId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId]);

  return (
    <>
      <Flex px={4} py={2} borderBottomWidth="1px" borderColor="gray.100" justify="space-between" align="center">
        <Text fontSize="sm" color="gray.600" aria-live="polite">
          {status.loading ? 'Looking for places…' : `${places.length} ${NAMES[type]} in view`}
        </Text>
        <Text fontSize="xs" color="gray.400">Nearest first</Text>
      </Flex>

      {notice && (
        <Alert status="info" fontSize="sm" py={2}>
          <AlertIcon />
          <AlertDescription flex={1}>{notice}</AlertDescription>
          <CloseButton size="sm" onClick={onDismissNotice} />
        </Alert>
      )}
      {status.error && (
        <Alert status="warning" fontSize="sm" py={2}>
          <AlertIcon />
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      )}

      <Flex flex={1} minH={0} overflowY="auto" direction="column" p={3} gap={3}>
        {status.loading && !places.length && [0, 1, 2, 3].map((i) => (
          <Flex key={i} p={4} borderWidth="1px" rounded="lg" direction="column" gap={3}>
            <Skeleton height="18px" width="60%" />
            <SkeletonText noOfLines={2} />
          </Flex>
        ))}
        {!status.loading && !status.error && places.length === 0 && (
          <Text color="gray.500" fontSize="sm" p={4} textAlign="center">
            Nothing mapped here yet. Zoom out a little, move the map, or search another area.
            OpenStreetMap coverage varies by area.
          </Text>
        )}
        {places.map((p) => (
          <div key={p.id} ref={(el) => { refs.current[p.id] = el; }}>
            <PlaceDetail place={p} selected={p.id === selectedId} onSelect={() => onSelect(p.id)} />
          </div>
        ))}
      </Flex>
    </>
  );
}
