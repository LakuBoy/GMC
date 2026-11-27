import { schemas } from '../../../lib/community';
import { limit, parse, route } from '../../../lib/server/api';
import { sql } from '../../../lib/server/db';

export default route({
  PUT: async ({ req, user }) => {
    const { placeId, status } = parse(schemas.confirm, req.body);
    await limit(user.id, 'confirm', 40, 60);
    if (status === null) {
      await sql`delete from confirmations where user_id = ${user.id} and place_id = ${placeId}`;
      return;
    }
    await sql`
      insert into confirmations (user_id, place_id, status) values (${user.id}, ${placeId}, ${status})
      on conflict (user_id, place_id) do update set status = excluded.status, confirmed_at = now()`;
  },
});
