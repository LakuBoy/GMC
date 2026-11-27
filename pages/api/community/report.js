import { schemas } from '../../../lib/community';
import { ApiError, limit, parse, route } from '../../../lib/server/api';
import { sql } from '../../../lib/server/db';

export default route({
  POST: async ({ req, user }) => {
    const { reviewId, reason } = parse(schemas.report, req.body);
    await limit(user.id, 'report', 20, 60);
    const [review] = await sql`select user_id, place_id from reviews where id = ${reviewId}`;
    if (!review) throw new ApiError(404, 'That review no longer exists');
    if (review.user_id === user.id) throw new ApiError(400, 'You cannot report your own review');
    await sql`
      insert into review_reports (reporter_id, author_id, place_id, reason)
      values (${user.id}, ${review.user_id}, ${review.place_id}, ${reason})
      on conflict do nothing`;
  },
});
