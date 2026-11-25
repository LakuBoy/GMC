import { useEffect, useState } from 'react';

// Re-renders every `ms` so "Closes in 40 min" stays true while the page is open.
export function useNow(ms = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

// Daily exchange rates from our own /api/rates (which caches the free feed).
export function useRates() {
  const [info, setInfo] = useState({ rates: { UGX: 3700 }, stale: true, updated: null });
  useEffect(() => {
    let alive = true;
    fetch('/api/rates').then((r) => r.json()).then((b) => { if (alive && b.rates) setInfo(b); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  return info;
}

// 'ugx' | 'usd' | 'both', remembered on this device only.
export function useCurrency() {
  const [currency, setCurrency] = useState('both');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('currency');
      if (['ugx', 'usd', 'both'].includes(saved)) setCurrency(saved);
    } catch { /* storage blocked */ }
  }, []);
  const set = (c) => {
    setCurrency(c);
    try { localStorage.setItem('currency', c); } catch { /* storage blocked */ }
  };
  return [currency, set];
}
