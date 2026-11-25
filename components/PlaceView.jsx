import { Badge, Box, Button, Flex, IconButton, Link, Text, useToast } from '@chakra-ui/react';
import NextLink from 'next/link';
import { BiArrowBack, BiCopy, BiLinkExternal, BiShareAlt } from 'react-icons/bi';
import { IoCall, IoGlobeOutline, IoLocation, IoLogoWhatsapp, IoCheckmarkCircle, IoNavigate, IoPricetag, IoTimeOutline } from 'react-icons/io5';
import { useEffect, useState } from 'react';
import { openStatus } from '../lib/hours';
import { parseCharge } from '../lib/money';
import { FEATURES, OpenBadge, Price, RatesCredit } from './badges';
import { CategoryIcon, metaOf } from './icons';

export const slugOf = (id) => id.replace('/', '-');

const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : `https://${u}`);

// WhatsApp needs an international number. Accept "+256..." as is, or a Ugandan "07..." number.
function whatsappNumber(phone) {
  const digits = phone.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits.slice(1);
  if (/^0\d{9}$/.test(digits)) return `256${digits.slice(1)}`;
  return null;
}

function Row({ icon: Icon, label, children, action }) {
  return (
    <Flex gap={3} py={3} borderTopWidth="1px" borderColor="line" align="flex-start">
      <Box as={Icon} mt="3px" fontSize="18px" color="primary" flexShrink={0} aria-label={label} />
      <Box flex={1} minW={0} fontSize="sm" wordBreak="break-word">{children}</Box>
      {action}
    </Flex>
  );
}

export default function PlaceView({ place, onBack, standalone, currency = 'both', rates }) {
  const toast = useToast();
  // Computed after mount so the server-rendered page and the browser never disagree about "now".
  const [status, setStatus] = useState(null);
  useEffect(() => {
    const update = () => setStatus(openStatus(place.hours));
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, [place.hours]);
  const price = parseCharge(place.charge);
  const facts = FEATURES.filter((f) => place.features?.[f.id]);
  const m = metaOf(place.category);
  const url = typeof window !== 'undefined' ? `${window.location.origin}/place/${slugOf(place.id)}` : '';
  const wa = place.phone ? whatsappNumber(place.phone) : null;

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: place.name, url });
      else {
        await navigator.clipboard.writeText(url);
        toast({ title: 'Link copied', status: 'success', duration: 2000, position: 'top' });
      }
    } catch { /* user closed the share sheet */ }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(place.address);
      toast({ title: 'Address copied', status: 'success', duration: 2000, position: 'top' });
    } catch { /* clipboard blocked */ }
  }

  return (
    <Box>
      <Box
        position="relative" px={4} pt={4} pb={5} color="white"
        bgGradient={`linear(to-br, ${m.color}, ${m.color}bb)`}
      >
        {onBack && (
          <Button
            onClick={onBack} leftIcon={<BiArrowBack />} size="sm" variant="ghost" color="white" mb={3} ms={-2}
            _hover={{ bg: 'whiteAlpha.300' }}
          >
            Back to results
          </Button>
        )}
        <Flex gap={3} align="flex-start">
          <Box rounded="14px" bg="whiteAlpha.300" p={3} flexShrink={0}><CategoryIcon category={place.category} size={30} /></Box>
          <Box minW={0}>
            <Text as="h1" fontSize="xl" fontWeight={800} lineHeight="short" letterSpacing="-0.01em">{place.name}</Text>
            <Flex gap={1.5} mt={2} wrap="wrap" align="center">
              <Badge bg="whiteAlpha.300" color="white" textTransform="capitalize">{place.kind}</Badge>
              {place.cuisine && <Badge bg="whiteAlpha.300" color="white" textTransform="capitalize">{place.cuisine}</Badge>}
              {place.stars && <Badge bg="whiteAlpha.300" color="white">{place.stars} star</Badge>}
            </Flex>
          </Box>
        </Flex>
      </Box>

      <Flex gap={2} px={4} py={3} overflowX="auto" sx={{ scrollbarWidth: 'none' }}>
        <Button
          as="a" href={`https://www.openstreetmap.org/directions?to=${place.lat}%2C${place.lng}`} target="_blank"
          rel="noopener noreferrer" leftIcon={<IoNavigate />} size="sm" flexShrink={0}
        >
          Directions
        </Button>
        {place.phone && (
          <Button as="a" href={`tel:${place.phone.replace(/[^+\d]/g, '')}`} leftIcon={<IoCall />} size="sm" variant="outline" flexShrink={0}>
            Call
          </Button>
        )}
        {wa && (
          <Button
            as="a" href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            leftIcon={<IoLogoWhatsapp />} size="sm" variant="outline" flexShrink={0}
          >
            WhatsApp
          </Button>
        )}
        <Button onClick={share} leftIcon={<BiShareAlt />} size="sm" variant="outline" flexShrink={0}>Share</Button>
      </Flex>

      <Box px={4} pb={6}>
        {place.address && (
          <Row icon={IoLocation} label="Address" action={
            <IconButton aria-label="Copy address" icon={<BiCopy />} size="xs" variant="ghost" onClick={copyAddress} />
          }>{place.address}</Row>
        )}
        {place.hours && (
          <Row icon={IoTimeOutline} label="Opening hours">
            {status && status.state !== 'unknown' && <Box mb={1}><OpenBadge status={status} /></Box>}
            {place.hours}
          </Row>
        )}
        {price && (
          <Row icon={IoPricetag} label="Entry price">
            <Price price={price} currency={currency} rates={rates} size="md" />
            <Box mt={1}><RatesCredit /></Box>
          </Row>
        )}
        {facts.length > 0 && (
          <Row icon={IoCheckmarkCircle} label="Good to know">
            <Flex gap={2} wrap="wrap">
              {facts.map((f) => (
                <Badge key={f.id} variant="subtle" colorScheme="brand" textTransform="none" display="inline-flex" alignItems="center" gap={1} px={2} py={1} rounded="md">
                  <Box as={f.icon} /> {f.label}
                </Badge>
              ))}
            </Flex>
          </Row>
        )}
        {place.phone && <Row icon={IoCall} label="Phone"><Link href={`tel:${place.phone.replace(/[^+\d]/g, '')}`}>{place.phone}</Link></Row>}
        {place.website && (
          <Row icon={IoGlobeOutline} label="Website">
            <Link href={safeUrl(place.website)} isExternal rel="noopener noreferrer">
              {place.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')}
            </Link>
          </Row>
        )}
        {!place.address && !place.hours && !place.phone && !place.website && (
          <Text fontSize="sm" color="muted" py={3} borderTopWidth="1px" borderColor="line">
            OpenStreetMap has no more details for this place yet.
          </Text>
        )}

        {!standalone && (
          <Button
            as={NextLink} href={`/place/${slugOf(place.id)}`} rightIcon={<BiLinkExternal />} size="sm" variant="ghost" mt={2}
          >
            Open full page
          </Button>
        )}
        <Text fontSize="xs" color="faint" mt={4}>
          Place data &copy;{' '}
          <Link href={`https://www.openstreetmap.org/${place.id}`} isExternal rel="noopener noreferrer" textDecoration="underline">
            OpenStreetMap contributors
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
