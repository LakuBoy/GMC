import { schemas } from '../../lib/community';
import { limit, parse, route } from '../../lib/server/api';
import { sql } from '../../lib/server/db';

export default route({
  // Change the name shown next to reviews.
  PATCH: async ({ req, user }) => {
    const { displayName } = parse(schemas.profile, req.body);
    await limit(user.id, 'profile', 10, 60);
    await sql`update users set display_name = ${displayName} where id = ${user.id}`;
  },
  // Delete the account. Every table that references users does so with "on delete cascade".
  DELETE: async ({ user }) => {
    await sql`delete from verification_token where identifier = ${user.email}`;
    await sql`delete from users where id = ${user.id}`;
  },
});
