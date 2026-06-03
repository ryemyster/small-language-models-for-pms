-- Migration: feedback_vectors
-- Run this in the Supabase dashboard SQL editor, or via:
--   supabase db push
--
-- What this does:
--   1. Enables the pgvector extension (adds vector column type and similarity search)
--   2. Creates the feedback table with a 768-dimensional vector column
--   3. Creates a fast similarity-search index (HNSW)
--   4. Enables Row Level Security (required for tables exposed via the Data API)
--   5. Grants anon read/insert access (this is a local server-side tool)
--   6. Creates the search_feedback function called by src/search.ts

-- Step 1: Enable pgvector
-- The 'extensions' schema keeps extension objects out of public
create extension if not exists vector with schema extensions;

-- Step 2: Feedback table
create table if not exists public.feedback (
  id         bigint generated always as identity primary key,
  text       text    not null,
  label      text    not null,
  confidence real    not null,
  embedding  vector(768),        -- nomic-embed-text produces 768-dimensional vectors
  created_at timestamptz default now()
);

-- Step 3: HNSW index for fast cosine similarity search
-- HNSW works without pre-loaded data (unlike IVFFlat) — better for a tutorial.
-- For large datasets (100k+ rows), tune m and ef_construction for your data size.
create index if not exists feedback_embedding_idx
  on public.feedback
  using hnsw (embedding vector_cosine_ops);

-- Step 4: Enable Row Level Security (required — table is in the public schema)
alter table public.feedback enable row level security;

-- Step 5: Grant Data API access to the anon role
-- Without this, the anon key cannot reach the table at all (separate from RLS).
grant select, insert on public.feedback to anon;
grant usage, select on sequence feedback_id_seq to anon;

-- RLS policies: anon can read all rows and insert new ones.
-- This is appropriate for a local server-side tool.
-- In a multi-user product, replace `to anon` with `to authenticated`
-- and add `using ((select auth.uid()) = user_id)` for row-level ownership.
create policy "anon can read feedback"
  on public.feedback
  for select
  to anon
  using (true);

create policy "anon can insert feedback"
  on public.feedback
  for insert
  to anon
  with check (true);

-- Step 6: Similarity search function
-- Called by src/search.ts via supabase.rpc('search_feedback', {...})
-- Returns feedback rows ordered by cosine similarity to the query embedding.
create or replace function search_feedback(
  query_embedding vector(768),
  match_count     int  default 10,
  filter_label    text default null
)
returns table (
  id         bigint,
  text       text,
  label      text,
  confidence real,
  similarity float
)
language sql stable
security invoker  -- runs as the calling role, not the function owner
as $$
  select
    id,
    text,
    label,
    confidence,
    1 - (embedding <=> query_embedding) as similarity
  from public.feedback
  where
    embedding is not null
    and (filter_label is null or label = filter_label)
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Grant execute to anon so src/search.ts can call it
grant execute on function search_feedback to anon;
