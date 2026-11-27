import { IconButton, useToast } from '@chakra-ui/react';
import { signIn, useSession } from 'next-auth/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { IoHeart, IoHeartOutline } from 'react-icons/io5';
import { api } from '../lib/community-client';

const Context = createContext({ saved: [], ids: new Set(), loading: false, toggle: () => {} });
export const useFavorites = () => useContext(Context);

const asFavorite = (p) => ({
  placeId: p.id, name: p.name, category: p.category, kind: p.kind || null, lat: p.lat, lng: p.lng,
});

export function FavoritesProvider({ children }) {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const [list, setList] = useState({ owner: null, saved: [] });
  const toast = useToast();

  useEffect(() => {
    if (!userId) { setList({ owner: null, saved: [] }); return undefined; }
    let alive = true;
    api('/api/favorites')
      .then((b) => { if (alive) setList({ owner: userId, saved: b.favorites }); })
      .catch(() => { if (alive) setList({ owner: userId, saved: [] }); });
    return () => { alive = false; };
  }, [userId]);

  // Shows the change at once and puts it back if the server refuses.
  const toggle = useCallback(async (place) => {
    if (!userId) { signIn(); return; }
    const item = place.placeId ? place : asFavorite(place);
    const had = list.saved.some((f) => f.placeId === item.placeId);
    const add = (l) => ({ ...l, saved: [item, ...l.saved.filter((f) => f.placeId !== item.placeId)] });
    const drop = (l) => ({ ...l, saved: l.saved.filter((f) => f.placeId !== item.placeId) });
    setList(had ? drop : add);
    try {
      await api('/api/favorites', had ? 'DELETE' : 'PUT', had ? { placeId: item.placeId } : item);
    } catch (e) {
      setList(had ? add : drop);
      toast({ title: e.message, status: 'error', duration: 4000, position: 'top' });
    }
  }, [userId, list.saved, toast]);

  const value = useMemo(() => ({
    saved: list.saved,
    ids: new Set(list.saved.map((f) => f.placeId)),
    loading: status === 'loading' || (!!userId && list.owner !== userId),
    toggle,
  }), [list, status, userId, toggle]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function SaveButton({ place, ...props }) {
  const { ids, toggle } = useFavorites();
  const on = ids.has(place.id);
  return (
    <IconButton
      aria-label={on ? `Remove ${place.name} from saved places` : `Save ${place.name}`} aria-pressed={on}
      icon={on ? <IoHeart size={20} /> : <IoHeartOutline size={20} />} variant="ghost" size="sm" rounded="full"
      onClick={(e) => { e.stopPropagation(); toggle(place); }}
      onKeyDown={(e) => e.stopPropagation()}
      {...props}
    />
  );
}
