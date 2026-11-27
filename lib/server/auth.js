// Sign-in setup (Auth.js / NextAuth 4). Sessions are stored in our database.
import PostgresAdapter from '@auth/pg-adapter';
import GoogleProvider from 'next-auth/providers/google';
import { publicName } from '../community';
import { adapterClient, sql } from './db';

const dev = process.env.NODE_ENV === 'development';

// Email sign-in links. In development the link is printed to the server log.
// There is no sending service yet, so this is off in production: a link there must never be logged.
// Written out by hand because next-auth's own email provider requires nodemailer, which we do not use.
const devEmail = {
  id: 'email',
  type: 'email',
  name: 'Email',
  maxAge: 15 * 60,
  options: {},
  async sendVerificationRequest({ identifier, url }) {
    console.log(`\n[sign-in link for ${identifier}] (development only, valid 15 minutes)\n${url}\n`);
  },
};

const google = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })
  : null;

export const authOptions = {
  adapter: PostgresAdapter(adapterClient),
  providers: [google, dev ? devEmail : null].filter(Boolean),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'database' },
  pages: { signIn: '/signin', verifyRequest: '/signin?sent=1', error: '/signin' },
  callbacks: {
    // Send the browser only what it needs.
    async session({ session, user }) {
      const [row] = await sql`select name, display_name from users where id = ${user.id}`;
      return { expires: session.expires, user: { id: Number(user.id), email: user.email, name: publicName(row) } };
    },
  },
};
