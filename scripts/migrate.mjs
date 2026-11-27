// Creates the tables in db/schema.sql. Run with: npm run db:migrate
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set (add it to .env.local).');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const text = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const statements = text.replace(/--.*$/gm, '').split(';').map((s) => s.trim()).filter(Boolean);

await sql.transaction(statements.map((s) => sql.query(s)));
console.log(`Ran ${statements.length} statements.`);
