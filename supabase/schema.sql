-- AD Journal database schema
-- Safe to run multiple times (every create is guarded with IF NOT EXISTS /
-- OR REPLACE / a preceding DROP). Run this in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query) after creating the two seeded auth
-- accounts (Amatulla, Divy). Then fill in supabase/seed_profiles.sql with
-- their emails and run that too.

-- ── profiles ────────────────────────────────────────────────────────
-- Maps each of the two fixed auth accounts to a stable role + display name,
-- so the daily page can always render "Amatulla" on the left and "Divy" on
-- the right regardless of who's currently signed in.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null unique check (role in ('amatulla', 'divy')),
  display_name text not null,
  username text
);

alter table public.profiles add column if not exists username text;

create unique index if not exists profiles_username_key on public.profiles (lower(username));

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_shared" on public.profiles;
create policy "profiles_select_shared"
  on public.profiles for select
  to authenticated
  using (true);

-- ── username login ─────────────────────────────────────────────────
-- Supabase Auth only knows email/password. The login page asks for a
-- username instead; this function resolves it to the real email
-- server-side (SECURITY DEFINER lets it read auth.users, which the
-- anon/authenticated roles can't do directly) so the app never has to
-- expose email addresses or a service-role key to do the lookup.

create or replace function public.get_email_for_username(p_username text)
returns text
language sql
security definer
set search_path = public, auth
stable
as $$
  select u.email
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(p.username) = lower(p_username)
  limit 1;
$$;

revoke all on function public.get_email_for_username(text) from public;
grant execute on function public.get_email_for_username(text) to anon, authenticated;

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
drop policy if exists "entries_select_shared" on public.entries;
create policy "entries_select_shared"
  on public.entries for select
  to authenticated
  using (true);

-- Each person can only write, edit, or delete their own rows.
drop policy if exists "entries_insert_own" on public.entries;
create policy "entries_insert_own"
  on public.entries for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "entries_update_own" on public.entries;
create policy "entries_update_own"
  on public.entries for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entries_delete_own" on public.entries;
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

-- ── random memory ──────────────────────────────────────────────────

create or replace function public.get_random_entry_date(exclude_date date default null)
returns date
language sql
security invoker
stable
as $$
  select entry_date
  from public.entries
  where exclude_date is null or entry_date <> exclude_date
  order by random()
  limit 1;
$$;

-- ── game_sessions ───────────────────────────────────────────────────
-- One row per game invite/match between the two fixed users. `state` holds
-- the full game-specific board/round data as jsonb. Win/draw is detected
-- client-side (see lib/games/*.ts) and only *recorded* here via
-- game_finish() — never computed in SQL, except Memory Lane's match check,
-- which is free to do server-side since the deck lives here already.

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  game_type text not null check (game_type in ('tic_tac_toe','connect_four','memory_lane','doodle_guess')),
  status text not null default 'pending' check (status in ('pending','active','finished','declined','cancelled')),
  host_id uuid not null references auth.users(id) on delete cascade,
  guest_id uuid not null references auth.users(id) on delete cascade check (guest_id <> host_id),
  turn uuid references auth.users(id),
  state jsonb not null default '{}'::jsonb,
  winner_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists game_sessions_guest_status_idx on public.game_sessions (guest_id, status);
create index if not exists game_sessions_host_status_idx on public.game_sessions (host_id, status);

alter table public.game_sessions enable row level security;

drop policy if exists "game_sessions_select_participant" on public.game_sessions;
create policy "game_sessions_select_participant"
  on public.game_sessions for select to authenticated
  using (auth.uid() in (host_id, guest_id));

drop policy if exists "game_sessions_insert_host" on public.game_sessions;
create policy "game_sessions_insert_host"
  on public.game_sessions for insert to authenticated
  with check (auth.uid() = host_id);

drop policy if exists "game_sessions_update_participant" on public.game_sessions;
create policy "game_sessions_update_participant"
  on public.game_sessions for update to authenticated
  using (auth.uid() in (host_id, guest_id))
  with check (auth.uid() in (host_id, guest_id));

drop trigger if exists game_sessions_set_updated_at on public.game_sessions;
create trigger game_sessions_set_updated_at
  before update on public.game_sessions
  for each row execute function public.set_updated_at();

-- Add game_sessions to the realtime publication so Postgres Changes fires
-- for it. Idempotent guard: a plain ALTER errors if run a second time.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_sessions'
  ) then
    alter publication supabase_realtime add table public.game_sessions;
  end if;
end $$;

-- Accepting an invite sets turn = host_id — a column-to-column assignment
-- the Supabase JS query builder can't express as a plain .update(), hence
-- its own RPC.
create or replace function public.game_accept_invite(p_session_id uuid)
returns public.game_sessions
language plpgsql
security invoker
as $$
declare
  v_session public.game_sessions;
begin
  update public.game_sessions
    set status = 'active', turn = host_id
    where id = p_session_id
      and guest_id = auth.uid()
      and status = 'pending'
    returning * into v_session;

  if not found then
    raise exception 'invite not found or already handled';
  end if;

  return v_session;
end;
$$;

revoke all on function public.game_accept_invite(uuid) from public;
grant execute on function public.game_accept_invite(uuid) to authenticated;

-- Compare-and-swap game-over marker. Either client calls this the instant
-- its own client-side win/draw check fires; whichever call lands first
-- wins, the second is a harmless no-op (guarded by status = 'active').
create or replace function public.game_finish(p_session_id uuid, p_winner_id uuid default null)
returns public.game_sessions
language plpgsql
security invoker
as $$
declare
  v_session public.game_sessions;
begin
  update public.game_sessions
    set status = 'finished', winner_id = p_winner_id
    where id = p_session_id
      and status = 'active'
      and auth.uid() in (host_id, guest_id)
      and (p_winner_id is null or p_winner_id in (host_id, guest_id))
    returning * into v_session;

  if not found then
    select * into v_session from public.game_sessions where id = p_session_id;
  end if;

  return v_session;
end;
$$;

revoke all on function public.game_finish(uuid, uuid) from public;
grant execute on function public.game_finish(uuid, uuid) to authenticated;

-- Single dispatcher RPC for all game moves, called directly from the
-- browser client (not a Server Action) to save a network hop on every
-- move. security invoker means its internal UPDATE is still subject to
-- game_sessions_update_participant RLS above — this is defense in depth,
-- not a bypass. Grows one `elsif game_type = ...` branch per game, added
-- in that game's own phase rather than guessed upfront.
create or replace function public.game_make_move(p_session_id uuid, p_payload jsonb)
returns public.game_sessions
language plpgsql
security invoker
as $$
declare
  v_session public.game_sessions;
  v_board jsonb;
  v_idx int;
  v_mark text;
  v_other uuid;
  v_round int;
  v_scores jsonb;
  v_guesser_key text;
  v_new_score int;
  v_host_score int;
  v_guest_score int;
begin
  select * into v_session from public.game_sessions where id = p_session_id for update;

  if not found then
    raise exception 'session not found';
  end if;
  if v_session.status <> 'active' then
    raise exception 'game is not active';
  end if;
  if auth.uid() not in (v_session.host_id, v_session.guest_id) then
    raise exception 'not a participant';
  end if;

  v_other := case when v_session.host_id = auth.uid() then v_session.guest_id else v_session.host_id end;

  if v_session.game_type = 'tic_tac_toe' then
    if v_session.turn <> auth.uid() then
      raise exception 'not your turn';
    end if;
    v_idx := (p_payload->>'index')::int;
    if v_idx < 0 or v_idx > 8 then
      raise exception 'invalid index';
    end if;
    v_board := coalesce(v_session.state->'board', to_jsonb(array_fill(null::text, array[9])));
    if v_board->v_idx <> 'null'::jsonb then
      raise exception 'cell occupied';
    end if;
    v_mark := case when v_session.host_id = auth.uid() then 'X' else 'O' end;
    v_board := jsonb_set(v_board, array[v_idx::text], to_jsonb(v_mark));
    update public.game_sessions
      set state = jsonb_set(state, '{board}', v_board), turn = v_other
      where id = p_session_id returning * into v_session;

  elsif v_session.game_type = 'doodle_guess' then
    -- The secret word is never stored here — it's a pure function of
    -- (session id, round) computed independently by each client (see
    -- lib/games/doodle-guess.ts). This RPC only ever hears "that guess was
    -- correct" from the guesser's own client and advances state accordingly;
    -- it never receives or validates the guess text itself.
    if auth.uid() = v_session.turn then
      raise exception 'the drawer cannot submit a guess';
    end if;
    if (p_payload->>'action') is distinct from 'correct' then
      raise exception 'invalid action';
    end if;

    v_round := coalesce((v_session.state->>'round')::int, 1);
    v_scores := coalesce(v_session.state->'scores', '{}'::jsonb);
    v_guesser_key := auth.uid()::text;
    v_new_score := coalesce((v_scores->>v_guesser_key)::int, 0) + 1;
    v_scores := jsonb_set(v_scores, array[v_guesser_key], to_jsonb(v_new_score));

    if v_round >= 6 then -- must match DOODLE_ROUNDS in lib/games/doodle-guess.ts
      v_host_score := coalesce((v_scores->>v_session.host_id::text)::int, 0);
      v_guest_score := coalesce((v_scores->>v_session.guest_id::text)::int, 0);
      update public.game_sessions
        set state = jsonb_build_object('round', v_round, 'scores', v_scores),
            status = 'finished',
            turn = null,
            winner_id = case
              when v_host_score > v_guest_score then v_session.host_id
              when v_guest_score > v_host_score then v_session.guest_id
              else null
            end
        where id = p_session_id returning * into v_session;
    else
      update public.game_sessions
        set state = jsonb_build_object('round', v_round + 1, 'scores', v_scores),
            turn = auth.uid()
        where id = p_session_id returning * into v_session;
    end if;

  else
    raise exception 'game_type % not yet supported by game_make_move', v_session.game_type;
  end if;

  return v_session;
end;
$$;

revoke all on function public.game_make_move(uuid, jsonb) from public;
grant execute on function public.game_make_move(uuid, jsonb) to authenticated;

-- ── storage: photos ────────────────────────────────────────────────
-- Private bucket. Upload path convention: {auth.uid()}/{filename}
-- so ownership can be checked from the path alone.

insert into storage.buckets (id, name, public)
values ('entry-photos', 'entry-photos', false)
on conflict (id) do nothing;

drop policy if exists "entry_photos_select_shared" on storage.objects;
create policy "entry_photos_select_shared"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'entry-photos');

drop policy if exists "entry_photos_insert_own" on storage.objects;
create policy "entry_photos_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_update_own" on storage.objects;
create policy "entry_photos_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "entry_photos_delete_own" on storage.objects;
create policy "entry_photos_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'entry-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
