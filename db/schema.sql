-- GMC schema. Safe to run again: every statement is "if not exists".
-- Keep semicolons out of comments and strings: scripts/migrate.mjs splits on them.

-- Sign-in tables. Names and columns are fixed by @auth/pg-adapter.
create table if not exists users (
  id serial primary key,
  name varchar(255),
  email varchar(255) unique,
  "emailVerified" timestamptz,
  image text,
  display_name varchar(40),
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  id serial primary key,
  "userId" integer not null references users(id) on delete cascade,
  type varchar(255) not null,
  provider varchar(255) not null,
  "providerAccountId" varchar(255) not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  id_token text,
  scope text,
  session_state text,
  token_type text,
  unique (provider, "providerAccountId")
);

create table if not exists sessions (
  id serial primary key,
  "userId" integer not null references users(id) on delete cascade,
  expires timestamptz not null,
  "sessionToken" varchar(255) not null unique
);

create table if not exists verification_token (
  identifier text not null,
  expires timestamptz not null,
  token text not null,
  primary key (identifier, token)
);

-- Our own data. place_id is the OpenStreetMap id, such as node/123.
-- A favorite keeps its own copy of the place details, visible only to the person who saved it.
create table if not exists favorites (
  user_id integer not null references users(id) on delete cascade,
  place_id text not null,
  name text not null,
  category text not null,
  kind text,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create table if not exists reviews (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  place_id text not null,
  rating smallint not null check (rating between 1 and 5),
  body text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);
create index if not exists reviews_place on reviews (place_id);

-- Reports are against (author, place), so deleting and re-posting a review does not clear them.
create table if not exists review_reports (
  reporter_id integer not null references users(id) on delete cascade,
  author_id integer not null references users(id) on delete cascade,
  place_id text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  primary key (reporter_id, author_id, place_id)
);
create index if not exists review_reports_target on review_reports (author_id, place_id);

-- One current "still open?" answer per person per place.
create table if not exists confirmations (
  user_id integer not null references users(id) on delete cascade,
  place_id text not null,
  status text not null check (status in ('open', 'gone')),
  confirmed_at timestamptz not null default now(),
  primary key (user_id, place_id)
);
create index if not exists confirmations_place on confirmations (place_id);

create table if not exists fact_votes (
  user_id integer not null references users(id) on delete cascade,
  place_id text not null,
  fact text not null,
  value boolean not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id, fact)
);
create index if not exists fact_votes_place on fact_votes (place_id);

create table if not exists rate_events (
  user_id integer not null references users(id) on delete cascade,
  action text not null,
  at timestamptz not null default now()
);
create index if not exists rate_events_lookup on rate_events (user_id, action, at);
