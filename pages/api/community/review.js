import { schemas } from '../../../lib/community';
import { limit, parse, route } from '../../../lib/server/api';
import { sql } from '../../../lib/server/db';

// One review per person per place: PUT creates or replaces it.
export default route({
  PUT: async ({ req, user }) => {
    const r = parse(schemas.review, req.body);
    await limit(user.id, 'review', 10, 60);
    await sql`
      insert into reviews (user_id, place_id, rating, body)
      values (${user.id}, ${r.placeId}, ${r.rating}, ${r.body})
      on conflict (user_id, place_id)
      do update set rating = excluded.rating, body = excluded.body, updated_at = now()`;
  },
  DELETE: async ({ req, user }) => {
    const { placeId } = parse(schemas.removeById, req.body);
    await sql`delete from reviews where user_id = ${user.id} and place_id = ${placeId}`;
  },
});
