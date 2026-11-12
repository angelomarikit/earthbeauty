-- Earth Beauty & Wellness — promote team accounts to admin (RLS / dashboard)
--
-- PREREQUISITE: Create each user in Supabase first (Auth cannot be fully provisioned here):
--   Dashboard → Authentication → Users → Add user
--   Emails: staff@earthbeauty.com, admin@earthbeauty.com, owner@earthbeauty.com
--   Set passwords, enable "Auto confirm user" if you skip email confirmation.
--
-- Then run this script in the SQL Editor.

begin;

-- 1) Verify the three accounts exist
select id, email, email_confirmed_at, created_at
from auth.users
where lower(email) in (
  'staff@earthbeauty.com',
  'admin@earthbeauty.com',
  'owner@earthbeauty.com'
)
order by email;

-- 2) Grant admin role (same DB role for admin / staff / owner today — app + RLS use `admin` only)
insert into public.user_roles (user_id, role)
select u.id, 'admin'
from auth.users u
where lower(u.email) in (
  'staff@earthbeauty.com',
  'admin@earthbeauty.com',
  'owner@earthbeauty.com'
)
on conflict (user_id) do update
  set role = excluded.role;

-- 3) Optional display names on profiles (created by handle_new_user on signup)
update public.profiles p
set
  full_name = v.full_name,
  updated_at = now()
from auth.users u
join (
  values
    ('admin@earthbeauty.com', 'Store Administrator'),
    ('staff@earthbeauty.com', 'Store Staff'),
    ('owner@earthbeauty.com', 'Store Owner')
) as v(email, full_name) on lower(u.email) = lower(v.email)
where p.id = u.id
  and lower(u.email) in (
    'staff@earthbeauty.com',
    'admin@earthbeauty.com',
    'owner@earthbeauty.com'
  );

-- 4) Confirm roles
select u.email, ur.role, p.full_name
from auth.users u
left join public.user_roles ur on ur.user_id = u.id
left join public.profiles p on p.id = u.id
where lower(u.email) in (
  'staff@earthbeauty.com',
  'admin@earthbeauty.com',
  'owner@earthbeauty.com'
)
order by u.email;

commit;
