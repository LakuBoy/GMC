// Rules for our own data (reviews, confirmations, local facts), shared by the browser and the server.
import { z } from 'zod';

// Facts visitors need that OpenStreetMap rarely records. Ones with `chip` are offered as list filters.
export const LOCAL_FACTS = [
  { id: 'mobile_money', label: 'Takes Mobile Money', chip: 'Mobile Money' },
  { id: 'cash_only', label: 'Cash only' },
  { id: 'generator', label: 'Has backup power', chip: 'Backup power' },
  { id: 'wifi', label: 'Has Wi-Fi' },
  { id: 'safe_parking', label: 'Safe parking', chip: 'Safe parking' },
  { id: 'boda_access', label: 'Easy to reach by boda-boda' },
  { id: 'safe_after_dark', label: 'Feels safe after dark' },
  { id: 'english_menu', label: 'English menu', only: ['restaurants'] },
  { id: 'vegetarian', label: 'Vegetarian options', only: ['restaurants'] },
];
const FACT_IDS = LOCAL_FACTS.map((f) => f.id);

export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or advertising' },
  { id: 'abuse', label: 'Offensive or abusive' },
  { id: 'false', label: 'False or not about this place' },
  { id: 'private', label: 'Shares private information' },
];

export const HIDE_AFTER_REPORTS = 3; // a review is hidden once this many people report it
export const RECENT_DAYS = 90; // "closed" answers older than this are ignored
export const MAX_IDS = 150;

const placeId = z.string().regex(/^(node|way|relation)\/\d{1,15}$/, 'Unknown place');

export const schemas = {
  placeId: z.object({ id: placeId }),
  idList: z.object({
    ids: z.string().max(4000).transform((s) => s.split(',')).pipe(z.array(placeId).min(1).max(MAX_IDS)),
  }),
  favorite: z.object({
    placeId,
    name: z.string().trim().min(1).max(200),
    category: z.enum(['restaurants', 'hotels', 'attractions']),
    kind: z.string().max(60).nullish(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  removeById: z.object({ placeId }),
  review: z.object({
    placeId,
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().max(2000, 'Keep the review under 2,000 characters').default(''),
  }),
  report: z.object({
    reviewId: z.number().int().positive(),
    reason: z.enum(REPORT_REASONS.map((r) => r.id)),
  }),
  // status null removes the person's answer
  confirm: z.object({ placeId, status: z.enum(['open', 'gone']).nullable() }),
  // value null removes the person's vote
  fact: z.object({ placeId, fact: z.enum(FACT_IDS), value: z.boolean().nullable() }),
  profile: z.object({
    displayName: z.string().trim().min(2, 'Use at least 2 characters').max(40, 'Use at most 40 characters')
      .regex(/^[^@<>]+$/, 'Names cannot contain @, < or >'),
  }),
};

// The name shown next to a review. Never the email address, and never a full family name.
export function publicName({ display_name: chosen, name } = {}) {
  if (chosen) return chosen;
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length || parts.some((p) => p.includes('@'))) return 'Visitor';
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

// A fact counts as confirmed when more people say yes than no.
export const confirmedFacts = (tally) => FACT_IDS.filter((id) => (tally[id]?.yes || 0) > (tally[id]?.no || 0));

export function timeAgo(when, now = new Date()) {
  const days = Math.floor((now - new Date(when)) / 86400000);
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  if (days < 365) return days < 60 ? '1 month ago' : `${Math.floor(days / 30)} months ago`;
  return 'over a year ago';
}
