-- Run this once in the Supabase SQL Editor, after supabase/schema.sql,
-- with the two emails below replaced by the actual seeded account emails
-- (Authentication -> Users in the dashboard).

insert into public.profiles (id, role, display_name)
select id, 'amatulla', 'Amatulla' from auth.users where email = 'amatulla@example.com'
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name;

insert into public.profiles (id, role, display_name)
select id, 'divy', 'Divy' from auth.users where email = 'divy@example.com'
on conflict (id) do update set role = excluded.role, display_name = excluded.display_name;
