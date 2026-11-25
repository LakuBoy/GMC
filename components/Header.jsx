import { Box, Button, Flex, Heading, IconButton, Input, InputGroup, InputRightElement, Spinner, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { BiHotel, BiMapAlt, BiRestaurant, BiSearch } from 'react-icons/bi';

const TYPES = [
  { id: 'restaurants', label: 'Restaurants', icon: BiRestaurant },
  { id: 'hotels', label: 'Hotels', icon: BiHotel },
  { id: 'attractions', label: 'Attractions', icon: BiMapAlt },
];

export default function Header({ type, setType, onPick }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null); // null: closed
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Search runs on Enter or the button, not on every key: the public geocoder allows 1 request per second.
  async function search(e) {
    e.preventDefault();
    if (q.trim().length < 3) { setError('Type at least 3 characters'); setResults(null); return; }
    setBusy(true); setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Search failed');
      setResults(body.results);
      if (!body.results.length) setError('No place found. Try a different name.');
    } catch (err) {
      setError(err.message); setResults(null);
    } finally {
      setBusy(false);
    }
  }

  function pick(r) {
    setResults(null); setError(null); setQ(r.name.split(',')[0]);
    onPick(r);
  }

  return (
    <Flex
      as="header" bg="white" borderBottomWidth="1px" borderColor="gray.200" px={4} py={3} gap={3}
      direction={{ base: 'column', lg: 'row' }} align={{ lg: 'center' }} zIndex={1100} position="relative"
    >
      <Heading size="md" color="blue.700" whiteSpace="nowrap">Places nearby</Heading>

      <Box position="relative" flex={{ lg: '0 1 420px' }} width={{ base: 'full', lg: 'auto' }}>
        <form onSubmit={search} role="search">
          <InputGroup>
            <Input
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a place, e.g. Lugogo Mall"
              aria-label="Search a place" bg="gray.50"
            />
            <InputRightElement>
              {busy ? <Spinner size="sm" /> : (
                <IconButton type="submit" aria-label="Search" icon={<BiSearch />} size="sm" variant="ghost" />
              )}
            </InputRightElement>
          </InputGroup>
        </form>
        {error && <Text fontSize="sm" color="red.600" mt={1}>{error}</Text>}
        {results && results.length > 0 && (
          <Box
            position="absolute" top="44px" left={0} right={0} bg="white" shadow="lg" rounded="md"
            borderWidth="1px" borderColor="gray.200" overflow="hidden" zIndex={1200}
          >
            {results.map((r, i) => (
              <Box
                key={i} as="button" type="button" textAlign="left" width="full" px={3} py={2} fontSize="sm"
                _hover={{ bg: 'blue.50' }} onClick={() => pick(r)}
                borderTopWidth={i ? '1px' : 0} borderColor="gray.100"
              >
                {r.name}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Flex gap={2} overflowX="auto" role="tablist" aria-label="Category">
        {TYPES.map(({ id, label, icon: Icon }) => (
          <Button
            key={id} role="tab" aria-selected={type === id} onClick={() => setType(id)} leftIcon={<Icon />}
            rounded="full" size="sm" flexShrink={0}
            colorScheme={type === id ? 'blue' : 'gray'} variant={type === id ? 'solid' : 'outline'}
          >
            {label}
          </Button>
        ))}
      </Flex>
    </Flex>
  );
}
