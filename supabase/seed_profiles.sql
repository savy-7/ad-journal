-- Run this once in the Supabase SQL Editor, after supabase/schema.sql,
-- with the two emails and usernames below replaced with the real values
-- (emails: Authentication -> Users in the dashboard; usernames: whatever
-- you want typed into the login page instead of an email).

insert into public.profiles (id, role, display_name, username)
select id, 'amatulla', 'Amatulla', 'amatulla' from auth.users where email = 'amatulla@example.com'
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name, username = excluded.username;

insert into public.profiles (id, role, display_name, username)
select id, 'divy', 'Divy', 'divy' from auth.users where email = 'divy@example.com'
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name, username = excluded.username;
