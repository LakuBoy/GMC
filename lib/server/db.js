// Neon Postgres over HTTP. Always pass values as parameters, never build them into the SQL text.
import { neon, neonConfig } from '@neondatabase/serverless';
import { fetchWithRetry } from './http';

// Short network failures happen; try again when the connection was never made.
neonConfig.fetchFunction = (url, options) => fetchWithRetry(url, options);

let client;
function connect() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
  client ||= neon(process.env.DATABASE_URL);
  return client;
}

// sql`select ... where id = ${id}` returns the rows.
export const sql = (strings, ...values) => connect()(strings, ...values);

// The shape @auth/pg-adapter expects from a "pg" client.
export const adapterClient = {
  query: (text, params) => connect().query(text, params, { fullResults: true }),
};
