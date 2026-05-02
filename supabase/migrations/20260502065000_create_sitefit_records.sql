create table if not exists public.sitefit_records (
  id text not null,
  collection text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection, id)
);

create index if not exists sitefit_records_collection_created_at_idx
  on public.sitefit_records (collection, created_at desc);

alter table public.sitefit_records enable row level security;

drop policy if exists "service role manages sitefit records" on public.sitefit_records;

create policy "service role manages sitefit records"
  on public.sitefit_records
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
