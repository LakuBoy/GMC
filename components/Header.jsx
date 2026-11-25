import { Box, Button, Flex, IconButton, Input, InputGroup, InputRightElement, Spinner, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { BiCurrentLocation, BiSearch } from 'react-icons/bi';
import ColorModeToggle from './ColorModeToggle';
import { CATEGORY_META, CategoryIcon, Logo } from './icons';

const TYPES = ['restaurants', 'hotels', 'attractions'];

export default function Header({ type, setType, onPick, onLocate, locating, floating }) {
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

  const chips = (
    <Flex gap={2} overflowX="auto" role="tablist" aria-label="Category" py={1} sx={{ scrollbarWidth: 'none' }}>
      {TYPES.map((id) => {
        const active = type === id;
        return (
          <Button
            key={id} role="tab" aria-selected={active} onClick={() => setType(id)}
            leftIcon={<CategoryIcon category={id} size={18} />} size="sm" flexShrink={0}
            variant={active ? 'solid' : 'outline'} bg={active ? undefined : 'surface'} borderColor="line"
            shadow={floating ? 'card' : 'none'} _hover={active ? undefined : { bg: 'subtle' }}
          >
            {CATEGORY_META[id].label}
          </Button>
        );
      })}
    </Flex>
  );

  return (
    <Box
      as="header"
      position={floating ? 'absolute' : 'relative'} top={0} left={0} right={0} zIndex={1100}
      bg={floating ? 'transparent' : 'surface'} borderBottomWidth={floating ? 0 : '1px'} borderColor="line"
      px={{ base: 3, md: 5 }} py={floating ? 3 : 3}
      pointerEvents={floating ? 'none' : 'auto'}
    >
      <Flex direction={{ base: 'column', lg: floating ? 'column' : 'row' }} gap={3} align={{ lg: floating ? 'stretch' : 'center' }}>
        <Flex align="center" gap={2} pointerEvents="auto" display={floating ? 'none' : 'flex'}>
          <Logo />
          <Text fontWeight={800} fontSize="lg" letterSpacing="-0.02em" whiteSpace="nowrap">Places nearby</Text>
        </Flex>

        <Box position="relative" flex={{ lg: '0 1 460px' }} pointerEvents="auto">
          <form onSubmit={search} role="search">
            <InputGroup size="lg">
              <Input
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a place, e.g. Lugogo Mall"
                aria-label="Search a place" bg="surface" rounded="pill" borderColor="line"
                shadow={floating ? 'lift' : 'none'} pl={5} fontSize="md"
              />
              <InputRightElement width="3.2rem">
                {busy ? <Spinner size="sm" color="primary" /> : (
                  <IconButton type="submit" aria-label="Search" icon={<BiSearch size={20} />} size="sm" variant="ghost" rounded="full" />
                )}
              </InputRightElement>
            </InputGroup>
          </form>
          {error && (
            <Text fontSize="sm" color="red.600" _dark={{ color: 'red.300' }} bg="surface" rounded="md" px={3} py={1} mt={1} display="inline-block" shadow="card">
              {error}
            </Text>
          )}
          {results && results.length > 0 && (
            <Box
              position="absolute" top="56px" left={0} right={0} bg="surface" shadow="lift" rounded="xl"
              borderWidth="1px" borderColor="line" overflow="hidden" zIndex={1200} role="listbox"
            >
              {results.map((r, i) => (
                <Box
                  key={i} as="button" type="button" role="option" textAlign="start" width="full" px={4} py={3} fontSize="sm"
                  _hover={{ bg: 'subtle' }} onClick={() => pick(r)} borderTopWidth={i ? '1px' : 0} borderColor="line"
                >
                  {r.name}
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Flex gap={2} align="center" pointerEvents="auto" flex={{ lg: 1 }} overflow="hidden">
          <Box flex={1} minW={0}>{chips}</Box>
          {!floating && (
            <>
              <Button
                onClick={onLocate} isLoading={locating} leftIcon={<BiCurrentLocation size={18} />} size="sm"
                variant="outline" borderColor="line" flexShrink={0}
              >
                Use my location
              </Button>
              <ColorModeToggle size="sm" />
            </>
          )}
          {floating && <ColorModeToggle size="sm" bg="surface" shadow="card" flexShrink={0} />}
        </Flex>
      </Flex>
    </Box>
  );
}
