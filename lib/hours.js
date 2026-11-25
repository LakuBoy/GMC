import OpeningHours from 'opening_hours';

// Opening hours are read in East Africa Time, whatever time zone the visitor's phone is set to.
const TZ = 'Africa/Kampala';

// A Date whose local fields (getHours, getDay...) show the wall clock in Kampala.
export function kampalaWallClock(date) {
  return new Date(date.toLocaleString('en-US', { timeZone: TZ }));
}

const pad = (n) => String(n).padStart(2, '0');
const clock = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function when(next, now) {
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (next.toDateString() === now.toDateString()) return clock(next);
  if (next.toDateString() === tomorrow.toDateString()) return `tomorrow ${clock(next)}`;
  return `${DAYS[next.getDay()]} ${clock(next)}`;
}

const parsed = new Map();
function parse(raw) {
  if (!parsed.has(raw)) {
    let oh = null;
    try { oh = new OpeningHours(raw, { address: { country_code: 'ug' } }); } catch { /* not valid OSM syntax */ }
    if (parsed.size > 2000) parsed.clear();
    parsed.set(raw, oh);
  }
  return parsed.get(raw);
}

// -> { state: 'open' | 'closed' | 'unknown', label, soon }
export function openStatus(raw, nowDate = new Date()) {
  if (!raw) return { state: 'unknown', label: '' };
  const oh = parse(raw);
  if (!oh) return { state: 'unknown', label: '' };
  const now = kampalaWallClock(nowDate);
  try {
    if (oh.getUnknown(now)) return { state: 'unknown', label: '' };
    const open = oh.getState(now);
    const next = oh.getNextChange(now);
    if (open) {
      if (!next) return { state: 'open', label: 'Open 24/7', soon: false };
      const mins = Math.round((next - now) / 60000);
      if (mins <= 60) return { state: 'open', label: `Closes in ${Math.max(mins, 1)} min`, soon: true };
      return { state: 'open', label: `Open · closes ${when(next, now)}`, soon: false };
    }
    return { state: 'closed', label: next ? `Closed · opens ${when(next, now)}` : 'Closed', soon: false };
  } catch {
    return { state: 'unknown', label: '' };
  }
}
