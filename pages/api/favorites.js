import { schemas } from '../../lib/community';
import { ApiError, limit, parse, route } from '../../lib/server/api';
import { sql } from '../../lib/server/db';

const MAX_SAVED = 500;

export default route({
  GET: async ({ user }) => {
    if (!user) throw new ApiError(401, 'Please sign in first');
    const rows = await sql`
      select place_id as "placeId", name, category, kind, lat, lng
      from favorites where user_id = ${user.id} order by created_at desc`;
    return { favorites: rows };
  },
  PUT: async ({ req, user }) => {
    const f = parse(schemas.favorite, req.body);
    await limit(user.id, 'favorite', 120, 60);
    const [{ n }] = await sql`select count(*)::int as n from favorites where user_id = ${user.id}`;
    if (n >= MAX_SAVED) throw new ApiError(400, `You can save up to ${MAX_SAVED} places`);
    await sql`
      insert into favorites (user_id, place_id, name, category, kind, lat, lng)
      values (${user.id}, ${f.placeId}, ${f.name}, ${f.category}, ${f.kind ?? null}, ${f.lat}, ${f.lng})
      on conflict (user_id, place_id) do nothing`;
  },
  DELETE: async ({ req, user }) => {
    const { placeId } = parse(schemas.removeById, req.body);
    await sql`delete from favorites where user_id = ${user.id} and place_id = ${placeId}`;
  },
});
