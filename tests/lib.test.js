import { describe, expect, it } from 'vitest';
import { openStatus } from '../lib/hours.js';
import { convert, formatPrice, parseCharge } from '../lib/money.js';

// 2026-11-25 is a Wednesday. Kampala is UTC+3 all year.
const at = (iso) => new Date(iso);

describe('openStatus (Kampala time)', () => {
  it('is open in the afternoon and says when it closes', () => {
    const s = openStatus('Mo-Sa 08:00-19:00', at('2026-11-25T10:00:00Z')); // 13:00 EAT
    expect(s.state).toBe('open');
    expect(s.label).toBe('Open · closes 19:00');
  });
  it('warns when closing within the hour', () => {
    const s = openStatus('Mo-Sa 08:00-19:00', at('2026-11-25T15:20:00Z')); // 18:20 EAT
    expect(s).toMatchObject({ state: 'open', soon: true, label: 'Closes in 40 min' });
  });
  it('is closed in the evening and opens tomorrow', () => {
    const s = openStatus('Mo-Sa 08:00-19:00', at('2026-11-25T17:30:00Z')); // 20:30 EAT
    expect(s).toMatchObject({ state: 'closed', label: 'Closed · opens tomorrow 08:00' });
  });
  it('handles hours that run past midnight', () => {
    expect(openStatus('Mo-Su 18:00-02:00', at('2026-11-25T22:00:00Z')).state).toBe('open'); // 01:00 EAT Thu
  });
  it('handles 24/7', () => {
    expect(openStatus('24/7', at('2026-11-25T10:00:00Z')).label).toBe('Open 24/7');
  });
  it('uses Kampala time, not the server time', () => {
    // 21:30 UTC is already 00:30 Thursday in Kampala, so a Wednesday-only place is closed.
    expect(openStatus('We 08:00-23:00', at('2026-11-25T21:30:00Z')).state).toBe('closed');
  });
  it('stays unknown for missing or invalid text', () => {
    expect(openStatus(null).state).toBe('unknown');
    expect(openStatus('by appointment maybe').state).toBe('unknown');
  });
});

const rates = { UGX: 4000 };

describe('formatPrice', () => {
  it('shows UGX with an approximate dollar figure', () => {
    expect(formatPrice({ amount: 25000, currency: 'UGX' }, 'both', rates)).toEqual({ main: 'UGX 25,000', extra: 'about $6' });
  });
  it('shows a USD price with approximate shillings rounded to 1,000', () => {
    expect(formatPrice({ amount: 80, currency: 'USD' }, 'both', rates)).toEqual({ main: '$80', extra: 'about UGX 320,000' });
  });
  it('converts when the visitor picks one currency', () => {
    expect(formatPrice({ amount: 80, currency: 'USD' }, 'ugx', rates)).toEqual({ main: 'about UGX 320,000', extra: 'quoted $80' });
    expect(formatPrice({ amount: 25000, currency: 'UGX' }, 'ugx', rates)).toEqual({ main: 'UGX 25,000', extra: '' });
  });
  it('falls back to the quoted price when a rate is unknown', () => {
    expect(formatPrice({ amount: 10, currency: 'EUR' }, 'ugx', {})).toEqual({ main: 'EUR 10', extra: '' });
  });
  it('returns null without a price', () => {
    expect(formatPrice(null)).toBeNull();
  });
  it('converts through USD', () => {
    expect(convert(8000, 'UGX', 'USD', rates)).toBe(2);
  });
});

describe('parseCharge', () => {
  it('reads OSM charge tags', () => {
    expect(parseCharge('5000 UGX')).toEqual({ amount: 5000, currency: 'UGX' });
    expect(parseCharge('$10')).toEqual({ amount: 10, currency: 'USD' });
    expect(parseCharge('UGX 20,000')).toEqual({ amount: 20000, currency: 'UGX' });
    expect(parseCharge('free')).toBeNull();
  });
});
