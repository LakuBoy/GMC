import { HIDE_AFTER_REPORTS, publicName, schemas } from '../../../lib/community';
import { parse, route } from '../../../lib/server/api';
import { summariesFor } from '../../../lib/server/community';
import { sql } from '../../../lib/server/db';

// GET /api/community/place?id=node/1 : everything for one place, plus the viewer's own answers.
export default route({
  GET: async ({ req, user }) => {
    const { id } = parse(schemas.placeId, req.query);
    const viewer = user?.id ?? 0;
    const [summaries, reviews, myCheck, myVotes] = await Promise.all([
      summariesFor([id]),
      sql`
        select r.id, r.user_id, r.rating, r.body, r.updated_at, u.name, u.display_name,
          (select count(*)::int from review_reports x
           where x.author_id = r.user_id and x.place_id = r.place_id) as reports,
          exists (select 1 from review_reports x
                  where x.author_id = r.user_id and x.place_id = r.place_id and x.reporter_id = ${viewer}) as reported
        from reviews r join users u on u.id = r.user_id
        where r.place_id = ${id}
        order by (r.user_id = ${viewer}) desc, r.updated_at desc
        limit 100`,
      sql`select status from confirmations where user_id = ${viewer} and place_id = ${id}`,
      sql`select fact, value from fact_votes where user_id = ${viewer} and place_id = ${id}`,
    ]);

    return {
      summary: summaries[id] || null,
      // Hidden reviews are only sent to their author. Reporters no longer see what they reported.
      reviews: reviews
        .filter((r) => r.user_id === viewer || (r.reports < HIDE_AFTER_REPORTS && !r.reported))
        .map((r) => ({
          id: r.id,
          mine: r.user_id === viewer,
          author: publicName(r),
          rating: r.rating,
          body: r.body,
          updatedAt: r.updated_at,
          hidden: r.reports >= HIDE_AFTER_REPORTS,
        })),
      mine: {
        status: myCheck[0]?.status || null,
        facts: Object.fromEntries(myVotes.map((v) => [v.fact, v.value])),
      },
    };
  },
});
