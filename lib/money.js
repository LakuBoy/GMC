// Prices are shown in UGX, USD or both. Every converted number is approximate and labelled so.

export const FALLBACK_RATES = { UGX: 3700 }; // only used when the live feed has never answered

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

function perUsd(cur, rates) {
  if (cur === 'USD') return 1;
  return rates?.[cur] || FALLBACK_RATES[cur] || null;
}

// Convert an amount between currencies. Null when a rate is unknown.
export function convert(amount, from, to, rates) {
  if (from === to) return amount;
  const a = perUsd(from, rates);
  const b = perUsd(to, rates);
  if (!a || !b) return null;
  return (amount / a) * b;
}

function show(amount, cur) {
  if (cur === 'USD') return `$${nf.format(Math.round(amount))}`;
  if (cur === 'UGX') return `UGX ${nf.format(amount >= 2000 ? Math.round(amount / 1000) * 1000 : Math.round(amount))}`;
  return `${cur} ${nf.format(Math.round(amount))}`;
}

// price: { amount, currency } as quoted by the venue. display: 'ugx' | 'usd' | 'both'.
// Returns { main, extra } where extra is the approximate second figure (or '').
export function formatPrice(price, display = 'both', rates) {
  if (!price || !(price.amount >= 0)) return null;
  const cur = (price.currency || 'UGX').toUpperCase();
  const mine = show(price.amount, cur);
  const wanted = display === 'ugx' ? 'UGX' : display === 'usd' ? 'USD' : null;

  if (wanted === cur) return { main: mine, extra: '' };
  if (wanted) {
    const v = convert(price.amount, cur, wanted, rates);
    return v == null ? { main: mine, extra: '' } : { main: `about ${show(v, wanted)}`, extra: `quoted ${mine}` };
  }
  const other = cur === 'UGX' ? 'USD' : 'UGX';
  const v = convert(price.amount, cur, other, rates);
  return { main: mine, extra: v == null ? '' : `about ${show(v, other)}` };
}

// Read a price out of an OSM "charge" tag such as "5000 UGX", "$10" or "10 USD".
export function parseCharge(text) {
  if (!text) return null;
  const m = /(?:(UGX|USD|EUR|GBP|KES|TZS)\s*)?(\$)?\s*(\d[\d,]*(?:\.\d+)?)\s*(UGX|USD|EUR|GBP|KES|TZS|\$)?/i.exec(String(text));
  if (!m) return null;
  let currency = (m[1] || m[4] || '').toUpperCase();
  if (m[2] || currency === '$') currency = 'USD';
  const amount = Number(m[3].replace(/,/g, ''));
  if (!currency || !Number.isFinite(amount) || amount <= 0) return null;
  return { amount, currency };
}
