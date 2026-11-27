// Database reads for ratings, "still open" confirmations and local facts.
import { HIDE_AFTER_REPORTS, RECENT_DAYS, confirmedFacts } from '../community';
import { sql } from './db';

// -> { [placeId]: { rating, count, lastOpenAt, goneCount, facts: [ids], tally: {id: {yes, no}} } }
export async function summariesFor(ids) {
  const [ratings, checks, votes] = await Promise.all([
    sql`
      select place_id, round(avg(rating), 1)::float as rating, count(*)::int as count
      from reviews r
      where place_id = any(${ids})
        and (select count(*) from review_reports x
             where x.author_id = r.user_id and x.place_id = r.place_id) < ${HIDE_AFTER_REPORTS}
      group by place_id`,
    // "gone" answers count only when recent and newer than the latest "open" answer.
    sql`
      with latest as (
        select place_id, max(confirmed_at) filter (where status = 'open') as last_open
        from confirmations where place_id = any(${ids}) group by place_id)
      select l.place_id, l.last_open,
        count(c.user_id) filter (
          where c.status = 'gone' and c.confirmed_at > now() - make_interval(days => ${RECENT_DAYS}::int)
            and (l.last_open is null or c.confirmed_at > l.last_open))::int as gone
      from latest l join confirmations c on c.place_id = l.place_id
      group by l.place_id, l.last_open`,
    sql`
      select place_id, fact, count(*) filter (where value)::int as yes, count(*) filter (where not value)::int as no
      from fact_votes where place_id = any(${ids}) group by place_id, fact`,
  ]);

  const out = {};
  const at = (id) => (out[id] ||= { rating: null, count: 0, lastOpenAt: null, goneCount: 0, facts: [], tally: {} });
  ratings.forEach((r) => Object.assign(at(r.place_id), { rating: r.rating, count: r.count }));
  checks.forEach((c) => Object.assign(at(c.place_id), { lastOpenAt: c.last_open, goneCount: c.gone }));
  votes.forEach((v) => { at(v.place_id).tally[v.fact] = { yes: v.yes, no: v.no }; });
  Object.values(out).forEach((s) => { s.facts = confirmedFacts(s.tally); });
  return out;
}
