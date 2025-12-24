create extension if not exists "pgcrypto";

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  created_at timestamptz default now()
);

create table if not exists sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  sort_order int not null default 0
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id) on delete cascade,
  section_id uuid references sections(id) on delete cascade,
  prompt text not null,
  type text not null check (type in ('checkbox','number','rating','select','text_short','text_long')),
  options jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create index if not exists questions_person_section_order_idx
  on questions (person_id, section_id, sort_order);

create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  answer_date date not null,
  value_bool boolean,
  value_num numeric,
  value_text text,
  value_json jsonb,
  updated_at timestamptz default now(),
  unique (person_id, question_id, answer_date)
);

create index if not exists answers_person_date_idx
  on answers (person_id, answer_date);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references people(id) on delete cascade,
  title text not null,
  due_date date not null,
  status text not null default 'todo' check (status in ('todo','done')),
  created_at timestamptz default now()
);

create index if not exists tasks_person_due_idx
  on tasks (person_id, due_date);
