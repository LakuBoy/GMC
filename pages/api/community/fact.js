import { schemas } from '../../../lib/community';
import { limit, parse, route } from '../../../lib/server/api';
import { sql } from '../../../lib/server/db';

export default route({
  PUT: async ({ req, user }) => {
    const { placeId, fact, value } = parse(schemas.fact, req.body);
    await limit(user.id, 'fact', 100, 60);
    if (value === null) {
      await sql`delete from fact_votes where user_id = ${user.id} and place_id = ${placeId} and fact = ${fact}`;
      return;
    }
    await sql`
      insert into fact_votes (user_id, place_id, fact, value) values (${user.id}, ${placeId}, ${fact}, ${value})
      on conflict (user_id, place_id, fact) do update set value = excluded.value, updated_at = now()`;
  },
});
