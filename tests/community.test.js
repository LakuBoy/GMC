import { describe, expect, it } from 'vitest';
import { confirmedFacts, publicName, schemas, timeAgo } from '../lib/community.js';
import { fetchWithRetry, sameOrigin } from '../lib/server/http.js';

const ok = (schema, v) => schema.safeParse(v).success;

describe('request rules', () => {
  it('accepts only OpenStreetMap ids', () => {
    expect(ok(schemas.placeId, { id: 'node/123' })).toBe(true);
    for (const id of ['node/abc', 'user/1', "node/1' or 1=1", '../node/1', '']) {
      expect(ok(schemas.placeId, { id })).toBe(false);
    }
  });
  it('splits and limits id lists', () => {
    expect(schemas.idList.parse({ ids: 'node/1,way/2' }).ids).toEqual(['node/1', 'way/2']);
    expect(ok(schemas.idList, { ids: Array(151).fill('node/1').join(',') })).toBe(false);
    expect(ok(schemas.idList, { ids: ['node/1'] })).toBe(false);
  });
  it('keeps ratings between 1 and 5 and reviews short', () => {
    const base = { placeId: 'node/1' };
    expect(ok(schemas.review, { ...base, rating: 5 })).toBe(true);
    for (const rating of [0, 6, 4.5, '5']) expect(ok(schemas.review, { ...base, rating })).toBe(false);
    expect(ok(schemas.review, { ...base, rating: 3, body: 'x'.repeat(2001) })).toBe(false);
  });
  it('rejects unknown facts and report reasons', () => {
    expect(ok(schemas.fact, { placeId: 'node/1', fact: 'generator', value: null })).toBe(true);
    expect(ok(schemas.fact, { placeId: 'node/1', fact: 'free_beer', value: true })).toBe(false);
    expect(ok(schemas.report, { reviewId: 1, reason: 'because' })).toBe(false);
  });
  it('refuses display names that look like emails or markup', () => {
    expect(ok(schemas.profile, { displayName: 'Amina K' })).toBe(true);
    for (const displayName of ['a', 'me@example.com', '<b>x</b>']) {
      expect(ok(schemas.profile, { displayName })).toBe(false);
    }
  });
});

describe('publicName', () => {
  it('never shows a full family name or an email address', () => {
    expect(publicName({ name: 'Sarah Nakato Okello' })).toBe('Sarah O.');
    expect(publicName({ name: 'sarah@example.com' })).toBe('Visitor');
    expect(publicName({})).toBe('Visitor');
    expect(publicName({ name: 'Sarah Okello', display_name: 'SaraO' })).toBe('SaraO');
  });
});

describe('confirmedFacts', () => {
  it('needs more yes than no', () => {
    const tally = { generator: { yes: 2, no: 1 }, wifi: { yes: 1, no: 1 }, cash_only: { yes: 0, no: 3 } };
    expect(confirmedFacts(tally)).toEqual(['generator']);
  });
});

describe('timeAgo', () => {
  it('uses plain words', () => {
    const now = new Date('2026-11-27T12:00:00Z');
    expect(timeAgo('2026-11-27T08:00:00Z', now)).toBe('today');
    expect(timeAgo('2026-11-24T08:00:00Z', now)).toBe('3 days ago');
    expect(timeAgo('2025-01-01T00:00:00Z', now)).toBe('over a year ago');
  });
});

describe('sameOrigin', () => {
  it('blocks writes sent from another site', () => {
    expect(sameOrigin({ host: 'localhost:3100', origin: 'http://localhost:3100' })).toBe(true);
    expect(sameOrigin({ host: 'localhost:3100', origin: 'https://evil.example' })).toBe(false);
    expect(sameOrigin({ host: 'localhost:3100', origin: 'null' })).toBe(false);
  });
});

describe('fetchWithRetry', () => {
  const failing = (code, times) => {
    let calls = 0;
    const send = async () => {
      calls += 1;
      if (calls <= times) throw Object.assign(new TypeError('fetch failed'), { cause: { code } });
      return 'done';
    };
    return { send, calls: () => calls };
  };
  it('tries again when the connection was never made', async () => {
    const f = failing('UND_ERR_CONNECT_TIMEOUT', 2);
    await expect(fetchWithRetry('u', {}, { send: f.send, delayMs: 1 })).resolves.toBe('done');
    expect(f.calls()).toBe(3);
  });
  it('gives up after three tries', async () => {
    const f = failing('ENOTFOUND', 9);
    await expect(fetchWithRetry('u', {}, { send: f.send, delayMs: 1 })).rejects.toThrow('fetch failed');
    expect(f.calls()).toBe(3);
  });
  it('never repeats a request that may have arrived', async () => {
    const f = failing('ECONNRESET', 1);
    await expect(fetchWithRetry('u', {}, { send: f.send, delayMs: 1 })).rejects.toThrow('fetch failed');
    expect(f.calls()).toBe(1);
  });
});
