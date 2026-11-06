-- OPTIONAL: Run this in the Supabase SQL editor.
-- Enable email magic-link auth and configure allowed redirect URLs in Supabase.
-- Server environment: SUPABASE_URL and SUPABASE_ANON_KEY (public anon key only).
-- NEVER expose a service-role key to the client.
create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 payload jsonb not null,
 created_at timestamptz not null default now()
);
alter table public.reports enable row level security;
create policy "Read own reports" on public.reports for select to authenticated using ((select auth.uid())=user_id);
create policy "Insert own reports" on public.reports for insert to authenticated with check ((select auth.uid())=user_id);
create index if not exists reports_user_created on public.reports(user_id,created_at desc);
