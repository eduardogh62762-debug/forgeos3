-- ============================================================
-- Supabase Trigger: Auto-sync auth.users to public.users
-- ============================================================

-- 1. Create the function that will be executed by the trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'member'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 2. Bind the trigger to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
