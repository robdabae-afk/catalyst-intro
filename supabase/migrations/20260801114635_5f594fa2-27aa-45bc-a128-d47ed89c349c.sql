insert into public.user_roles (user_id, role)
select p.id, 'admin'::app_role from public.profiles p
where p.email ilike '%test%'
on conflict (user_id, role) do nothing;