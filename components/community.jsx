import {
  Alert, AlertDescription, AlertIcon, Box, Button, Flex, Menu, MenuButton, MenuItem, MenuList, Portal, Skeleton,
  Text, Textarea, useToast,
} from '@chakra-ui/react';
import { signIn, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { IoStar, IoStarOutline } from 'react-icons/io5';
import { LOCAL_FACTS, REPORT_REASONS, timeAgo } from '../lib/community';
import { api, usePlaceCommunity } from '../lib/community-client';

export function Stars({ value, size = '14px' }) {
  return (
    <Flex as="span" display="inline-flex" gap="1px" color="accent.500" fontSize={size} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Box as={i <= Math.round(value) ? IoStar : IoStarOutline} key={i} aria-hidden="true" />
      ))}
    </Flex>
  );
}

// "Last confirmed open ..." or a warning that people reported it closed. Nothing when nobody has answered.
export function ConfirmedLine({ summary }) {
  if (summary?.goneCount) {
    return (
      <Text fontSize="xs" fontWeight={700} color="red.600" _dark={{ color: 'red.300' }}>
        Reported closed by {summary.goneCount === 1 ? '1 visitor' : `${summary.goneCount} visitors`}
      </Text>
    );
  }
  if (summary?.lastOpenAt) {
    return <Text fontSize="xs" color="muted">Confirmed open {timeAgo(summary.lastOpenAt)}</Text>;
  }
  return null;
}

function Heading({ children }) {
  return <Text as="h2" fontWeight={800} fontSize="md" mb={2}>{children}</Text>;
}

function ReviewForm({ mine, busy, onSave, onDelete }) {
  const [rating, setRating] = useState(mine?.rating || 0);
  const [body, setBody] = useState(mine?.body || '');
  const [editing, setEditing] = useState(!mine);

  useEffect(() => {
    setRating(mine?.rating || 0); setBody(mine?.body || ''); setEditing(!mine);
  }, [mine?.id, mine?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!editing) {
    return (
      <Flex gap={2} mb={3}>
        <Button size="xs" variant="outline" borderColor="line" onClick={() => setEditing(true)}>Edit your review</Button>
        <Button size="xs" variant="ghost" colorScheme="red" isLoading={busy} onClick={onDelete}>Delete it</Button>
      </Flex>
    );
  }

  return (
    <Box
      as="form" mb={4}
      onSubmit={(e) => { e.preventDefault(); onSave(rating, body); }}
    >
      <Flex gap={1} role="radiogroup" aria-label="Your rating">
        {[1, 2, 3, 4, 5].map((i) => (
          <Button
            key={i} type="button" role="radio" aria-checked={rating === i} aria-label={`${i} star${i > 1 ? 's' : ''}`}
            onClick={() => setRating(i)} variant="unstyled" display="grid" placeItems="center" minW="36px" h="36px"
            color="accent.500" fontSize="26px"
          >
            <Box as={i <= rating ? IoStar : IoStarOutline} />
          </Button>
        ))}
      </Flex>
      <Textarea
        mt={2} value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} rows={3} fontSize="sm"
        aria-label="Your review" placeholder="What should other visitors know? (optional)" borderColor="line"
      />
      <Flex gap={2} mt={2}>
        <Button type="submit" size="sm" isDisabled={!rating} isLoading={busy}>{mine ? 'Update review' : 'Post review'}</Button>
        {mine && <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
      </Flex>
    </Box>
  );
}

function Review({ review, onReport }) {
  return (
    <Box py={3} borderTopWidth="1px" borderColor="line">
      <Flex justify="space-between" gap={2} align="center">
        <Flex gap={2} align="center" wrap="wrap">
          <Text fontWeight={700} fontSize="sm">{review.mine ? 'You' : review.author}</Text>
          <Stars value={review.rating} />
          <Text fontSize="xs" color="faint">{timeAgo(review.updatedAt)}</Text>
        </Flex>
        {!review.mine && (
          <Menu placement="bottom-end">
            <MenuButton as={Button} size="xs" variant="ghost" color="muted">Report</MenuButton>
            <Portal>
              <MenuList zIndex={1500} bg="surface" borderColor="line" fontSize="sm">
                {REPORT_REASONS.map((r) => (
                  <MenuItem
                    key={r.id} onClick={() => onReport(review.id, r.id)} bg="surface"
                    _hover={{ bg: 'subtle' }} _focus={{ bg: 'subtle' }}
                  >
                    {r.label}
                  </MenuItem>
                ))}
              </MenuList>
            </Portal>
          </Menu>
        )}
      </Flex>
      {/* Review text comes from other people: React renders it as plain text. */}
      {review.body && <Text fontSize="sm" mt={1} whiteSpace="pre-wrap" wordBreak="break-word" dir="auto">{review.body}</Text>}
      {review.hidden && (
        <Text fontSize="xs" color="muted" mt={1}>Hidden from others after several reports.</Text>
      )}
    </Box>
  );
}

// Everything visitors add to a place: "still open?", local facts and reviews.
export default function CommunitySection({ place, onChanged }) {
  const { data: session } = useSession();
  const { data, error, reload } = usePlaceCommunity(place.id, session?.user?.id);
  const [busy, setBusy] = useState(null);
  const toast = useToast();

  if (error) {
    return (
      <Alert status="warning" rounded="lg" fontSize="sm" my={3}>
        <AlertIcon />
        <AlertDescription flex={1}>Reviews and visitor facts could not be loaded.</AlertDescription>
        <Button size="xs" onClick={reload}>Try again</Button>
      </Alert>
    );
  }
  if (!data) return <Skeleton height="120px" my={3} rounded="lg" />;

  const { summary, reviews, mine } = data;
  const myReview = reviews.find((r) => r.mine);
  const facts = LOCAL_FACTS.filter((f) => !f.only || f.only.includes(place.category));

  // Guests are sent to sign in; they come back to this place's page.
  async function act(key, url, method, body, done) {
    if (!session) {
      signIn(undefined, { callbackUrl: `/place/${place.id.replace('/', '-')}` });
      return;
    }
    setBusy(key);
    try {
      await api(url, method, body);
      reload();
      onChanged?.();
      if (done) toast({ title: done, status: 'success', duration: 2500, position: 'top' });
    } catch (e) {
      toast({ title: e.message, status: 'error', duration: 4000, position: 'top' });
    } finally {
      setBusy(null);
    }
  }

  const confirm = (status) => act(
    `confirm-${status}`, '/api/community/confirm', 'PUT',
    { placeId: place.id, status: mine.status === status ? null : status },
  );

  // yes -> no -> no answer
  const vote = (fact) => {
    const now = mine.facts[fact];
    const value = now === undefined ? true : now ? false : null;
    act(`fact-${fact}`, '/api/community/fact', 'PUT', { placeId: place.id, fact, value });
  };

  return (
    <Box>
      <Box py={4} borderTopWidth="1px" borderColor="line">
        <Heading>Is this place still there?</Heading>
        <Flex gap={2} wrap="wrap" mb={2}>
          <Button
            size="sm" aria-pressed={mine.status === 'open'} variant={mine.status === 'open' ? 'solid' : 'outline'}
            isLoading={busy === 'confirm-open'} onClick={() => confirm('open')}
          >
            Yes, it is open
          </Button>
          <Button
            size="sm" colorScheme="red" aria-pressed={mine.status === 'gone'}
            variant={mine.status === 'gone' ? 'solid' : 'outline'}
            isLoading={busy === 'confirm-gone'} onClick={() => confirm('gone')}
          >
            No, it has closed
          </Button>
        </Flex>
        <ConfirmedLine summary={summary} />
        {!summary?.lastOpenAt && !summary?.goneCount && (
          <Text fontSize="xs" color="muted">No visitor has confirmed this place yet.</Text>
        )}
      </Box>

      <Box py={4} borderTopWidth="1px" borderColor="line">
        <Heading>What visitors say it has</Heading>
        <Flex gap={2} wrap="wrap">
          {facts.map((f) => {
            const t = summary?.tally[f.id];
            const my = mine.facts[f.id];
            return (
              <Button
                key={f.id} size="xs" rounded="pill" isLoading={busy === `fact-${f.id}`} onClick={() => vote(f.id)}
                variant={my === undefined ? 'outline' : 'solid'} colorScheme={my === false ? 'gray' : 'brand'}
                borderColor="line" fontWeight={summary?.facts.includes(f.id) ? 800 : 500}
                aria-label={`${f.label}. ${t?.yes || 0} yes, ${t?.no || 0} no. Your answer: ${my === undefined ? 'none' : my ? 'yes' : 'no'}`}
              >
                {my === true ? '✓ ' : my === false ? '✗ ' : ''}{f.label}
                {t && <Text as="span" ms={1.5} opacity={0.75}>{t.yes} yes · {t.no} no</Text>}
              </Button>
            );
          })}
        </Flex>
        <Text fontSize="xs" color="muted" mt={2}>
          Press once for yes, again for no, and a third time to remove your answer. These are visitor reports, not checked by us.
        </Text>
      </Box>

      <Box py={4} borderTopWidth="1px" borderColor="line">
        <Heading>Reviews</Heading>
        {summary?.count ? (
          <Flex gap={2} align="center" mb={3}>
            <Text fontSize="2xl" fontWeight={800}>{summary.rating.toFixed(1)}</Text>
            <Stars value={summary.rating} size="18px" />
            <Text fontSize="sm" color="muted">{summary.count === 1 ? '1 review' : `${summary.count} reviews`}</Text>
          </Flex>
        ) : (
          <Text fontSize="sm" color="muted" mb={3}>No reviews yet. Be the first.</Text>
        )}

        {session ? (
          <ReviewForm
            key={place.id} mine={myReview} busy={busy === 'review'}
            onSave={(rating, body) => act('review', '/api/community/review', 'PUT', { placeId: place.id, rating, body }, 'Review saved')}
            onDelete={() => act('review', '/api/community/review', 'DELETE', { placeId: place.id }, 'Review deleted')}
          />
        ) : (
          <Button size="sm" mb={3} onClick={() => signIn(undefined, { callbackUrl: `/place/${place.id.replace('/', '-')}` })}>
            Sign in to write a review
          </Button>
        )}

        {reviews.map((r) => (
          <Review
            key={r.id} review={r}
            onReport={(reviewId, reason) => act(
              'report', '/api/community/report', 'POST', { reviewId, reason }, 'Thank you. The review is now hidden for you.',
            )}
          />
        ))}
      </Box>
    </Box>
  );
}
