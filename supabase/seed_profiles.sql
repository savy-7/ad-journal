-- Run this once in the Supabase SQL Editor, after supabase/schema.sql,
-- with the two emails and usernames below replaced with the real values
-- (emails: Authentication -> Users in the dashboard; usernames: whatever
-- you want typed into the login page instead of an email).

insert into public.profiles (id, role, display_name, username)
select id, 'amatulla', 'Amatulla', 'superwoman' from auth.users where email = 'amatullajaliwala.522965@gmail.com'
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name, username = excluded.username;

insert into public.profiles (id, role, display_name, username)
select id, 'divy', 'Divy', 'divi' from auth.users where email = 'saraswat.divy@gmail.com'
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name, username = excluded.username;
