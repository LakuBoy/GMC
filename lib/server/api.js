// One wrapper for our API routes: methods, same-origin check, sign-in, validation, rate limits, errors.
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth';
import { sql } from './db';
import { ApiError, sameOrigin } from './http';

export { ApiError };

export function parse(schema, data) {
  const r = schema.safeParse(data ?? {});
  if (!r.success) throw new ApiError(400, r.error.issues[0]?.message || 'Invalid request');
  return r.data;
}

// Allows `max` actions per user in the last `minutes`.
export async function limit(userId, action, max, minutes) {
  await sql`delete from rate_events where user_id = ${userId} and at < now() - interval '1 day'`;
  const added = await sql`
    insert into rate_events (user_id, action)
    select ${userId}::int, ${action}::text
    where (select count(*) from rate_events
           where user_id = ${userId} and action = ${action}
             and at > now() - make_interval(mins => ${minutes}::int)) < ${max}::int
    returning 1`;
  if (!added.length) throw new ApiError(429, 'Too many changes in a short time. Please try again later.');
}

// handlers: { GET: fn, PUT: fn, ... }. Every method except GET needs a signed-in user.
export function route(handlers) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    try {
      const fn = handlers[req.method];
      if (!fn) {
        res.setHeader('Allow', Object.keys(handlers).join(', '));
        throw new ApiError(405, 'Method not allowed');
      }
      if (!process.env.DATABASE_URL) throw new ApiError(503, 'Accounts are not set up on this server');
      const write = req.method !== 'GET';
      if (write && !sameOrigin(req.headers)) throw new ApiError(403, 'Request blocked');
      const session = await getServerSession(req, res, authOptions);
      const user = session?.user || null;
      if (write && !user) throw new ApiError(401, 'Please sign in first');
      const body = await fn({ req, res, user });
      res.status(200).json(body ?? { ok: true });
    } catch (e) {
      if (e instanceof ApiError) {
        res.status(e.status).json({ error: e.message });
        return;
      }
      console.error(`${req.method} ${req.url?.split('?')[0]} failed:`, e.message);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };
}
