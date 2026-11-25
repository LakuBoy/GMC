import { Badge, Box, Flex, Link, Text } from '@chakra-ui/react';
import { IoCard, IoCafe, IoRestaurant, IoWifi } from 'react-icons/io5';
import { MdAccessible } from 'react-icons/md';
import { formatPrice } from '../lib/money';

// Facts visitors filter by. `only` limits a filter to the categories where it makes sense.
export const FEATURES = [
  { id: 'wifi', label: 'Wi-Fi', icon: IoWifi },
  { id: 'wheelchair', label: 'Wheelchair access', icon: MdAccessible },
  { id: 'takeaway', label: 'Takeaway', icon: IoRestaurant, only: ['restaurants'] },
  { id: 'outdoor', label: 'Outdoor seating', icon: IoCafe, only: ['restaurants'] },
  { id: 'cards', label: 'Pays by card', icon: IoCard },
];

export function OpenBadge({ status }) {
  if (!status || status.state === 'unknown') return null;
  const open = status.state === 'open';
  return (
    <Badge
      colorScheme={open ? (status.soon ? 'orange' : 'green') : 'red'} textTransform="none" fontWeight={700}
      whiteSpace="normal" lineHeight="1.4"
    >
      {open ? '● ' : ''}{status.label}
    </Badge>
  );
}

export function FeatureIcons({ features, max = 4 }) {
  const on = FEATURES.filter((f) => features?.[f.id]).slice(0, max);
  if (!on.length) return null;
  return (
    <Flex gap={2} color="muted" fontSize="16px">
      {on.map((f) => <Box key={f.id} as={f.icon} title={f.label} aria-label={f.label} />)}
    </Flex>
  );
}

export function Price({ price, currency, rates, size = 'sm' }) {
  const p = formatPrice(price, currency, rates);
  if (!p) return null;
  return (
    <Text fontSize={size} fontWeight={700}>
      {p.main}
      {p.extra && <Text as="span" fontWeight={500} color="muted"> · {p.extra}</Text>}
    </Text>
  );
}

export function RatesCredit() {
  return (
    <Text fontSize="xs" color="faint">
      Approximate conversions. <Link href="https://www.exchangerate-api.com" isExternal rel="noopener noreferrer" textDecoration="underline">Rates by Exchange Rate API</Link>
    </Text>
  );
}
