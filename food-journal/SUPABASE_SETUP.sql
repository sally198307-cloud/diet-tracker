-- Run once in your private Supabase project's SQL editor.
-- Each authenticated user can read and write only their own food journal records.
create table if not exists public.food_journal_entries (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('meals','waters','library','reports')),
  entry_id text not null,
  payload jsonb,
  version_ms bigint not null,
  is_deleted boolean not null default false,
  primary key(owner_id, entry_type, entry_id),
  constraint journal_entry_id_size check (char_length(entry_id) between 1 and 180)
);
alter table public.food_journal_entries enable row level security;
revoke all on public.food_journal_entries from anon, authenticated;
grant select, insert, update on public.food_journal_entries to authenticated;
drop policy if exists "Journal select own" on public.food_journal_entries;
create policy "Journal select own" on public.food_journal_entries
 for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "Journal insert own" on public.food_journal_entries;
create policy "Journal insert own" on public.food_journal_entries
 for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "Journal update own" on public.food_journal_entries;
create policy "Journal update own" on public.food_journal_entries
 for update to authenticated using ((select auth.uid()) = owner_id)
 with check ((select auth.uid()) = owner_id);
-- No delete grant: deletions are synchronized as tombstones, so another
-- browser cannot restore a removed record by accident.
-- WARNING: Existing uploaded photos are encoded in the record JSON.
-- Stay within your project's database limits and keep local JSON backups.

-- Avoid stale devices replacing a newer edit with an older version.
create or replace function public.food_journal_keep_newer()
returns trigger language plpgsql as $$
begin
  if new.version_ms < old.version_ms then
    return old;
  end if;
  return new;
end;
$$;
drop trigger if exists journal_keep_newer on public.food_journal_entries;
create trigger journal_keep_newer before update on public.food_journal_entries
for each row execute function public.food_journal_keep_newer();
