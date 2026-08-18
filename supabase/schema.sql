-- AD Journal database schema
-- Run this once in the Supabase SQL Editor (Dashboard -> SQL Editor -> New query)
-- after creating the two seeded auth accounts (Amatulla, Divy).

-- ── entries ─────────────────────────────────────────────────────────
-- One row per (date, person). Each date "page" is two rows, one per user_id.

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  highlight text,
  little_thing text,
  smile_thing text,
  mood smallint check (mood between 1 and 5),
  on_my_mind text,
  photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_date, user_id)
);

create index if not exists entries_entry_date_idx on public.entries (entry_date);

alter table public.entries enable row level security;

-- Both partners can read every entry (it's a shared journal).
create policy "entries_select_shared"
  on public.entries for select
  to authenticated
  using (true);

-- Each person can only write, edit, or delete their own rows.
create policy "entries_insert_own"
  on public.entries for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "entries_update_own"
  on public.entries for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "entries_delete_own"
  on public.entries for delete
  to authenticated
  using (auth.uid() = user_id);

-- Keep updated_at current on every edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
  before update on public.entries
  for each row
  execute function public.set_updated_at();

-- ── storage: photos ────────────────────────────────────────────────
-- Private bucket. Upload path convention: {auth.uid()}/{filename}
-- so ownership can be checked from the path alone.

insert into storage.buckets (id, name, public)
values ('entry-photos', 'entry-photos', false)
on conflict (id) do nothing;

create policy "entry_photos_select_shared"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'entry-photos');

create policy "entry_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "entry_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "entry_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
