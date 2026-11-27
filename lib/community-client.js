// Browser-side access to our own data.
import { useCallback, useEffect, useState } from 'react';
import { MAX_IDS } from './community';

export async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// Ratings, confirmations and facts for the places in the list. The list still works if this fails.
// Change `version` to load again after the visitor adds something.
export function useSummaries(places, version = 0) {
  const [summaries, setSummaries] = useState({});
  const ids = places.slice(0, MAX_IDS).map((p) => p.id).join(',');
  useEffect(() => {
    if (!ids) return undefined;
    let alive = true;
    api(`/api/community/summaries?ids=${encodeURIComponent(ids)}`)
      .then((b) => { if (alive) setSummaries(b.summaries); })
      .catch(() => {});
    return () => { alive = false; };
  }, [ids, version]);
  return summaries;
}

// Everything about one place. `data` is null until it arrives.
export function usePlaceCommunity(placeId, viewerId) {
  const [state, setState] = useState({ id: null, data: null, error: null });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    api(`/api/community/place?id=${encodeURIComponent(placeId)}`)
      .then((data) => { if (alive) setState({ id: placeId, data, error: null }); })
      .catch((e) => { if (alive) setState({ id: placeId, data: null, error: e.message }); });
    return () => { alive = false; };
  }, [placeId, viewerId, version]);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = state.id === placeId; // never show the previous place's reviews
  return { data: current ? state.data : null, error: current ? state.error : null, reload };
}
