-- TITO FONSECA ARCHIVE
-- Paste this entire file into Supabase > SQL Editor > New query > Run.
-- It creates the database, comments, likes and photo storage.

create extension if not exists pgcrypto;

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.photo_likes (
  id bigint generated always as identity primary key,
  photo_id uuid not null references public.gallery_photos(id) on delete cascade,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  unique(photo_id, visitor_id)
);

create table if not exists public.photo_comments (
  id bigint generated always as identity primary key,
  photo_id uuid not null references public.gallery_photos(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

alter table public.gallery_photos enable row level security;
alter table public.journal_entries enable row level security;
alter table public.photo_likes enable row level security;
alter table public.photo_comments enable row level security;

drop policy if exists "public read gallery" on public.gallery_photos;
drop policy if exists "owner manage gallery" on public.gallery_photos;
create policy "public read gallery"
on public.gallery_photos for select
using (true);
create policy "authenticated owner manage gallery"
on public.gallery_photos for all
to authenticated
using (true)
with check (true);

drop policy if exists "public read journal" on public.journal_entries;
drop policy if exists "owner manage journal" on public.journal_entries;
create policy "public read journal"
on public.journal_entries for select
using (true);
create policy "authenticated owner manage journal"
on public.journal_entries for all
to authenticated
using (true)
with check (true);

drop policy if exists "public read likes" on public.photo_likes;
drop policy if exists "public add likes" on public.photo_likes;
create policy "public read likes"
on public.photo_likes for select
using (true);
create policy "public add likes"
on public.photo_likes for insert
with check (true);

drop policy if exists "public read comments" on public.photo_comments;
drop policy if exists "public add comments" on public.photo_comments;
create policy "public read comments"
on public.photo_comments for select
using (true);
create policy "public add comments"
on public.photo_comments for insert
with check (true);

-- Public photo bucket.
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "public view gallery files" on storage.objects;
drop policy if exists "owner upload gallery files" on storage.objects;
drop policy if exists "owner update gallery files" on storage.objects;
drop policy if exists "owner delete gallery files" on storage.objects;

create policy "public view gallery files"
on storage.objects for select
using (bucket_id = 'gallery');

create policy "authenticated owner upload gallery files"
on storage.objects for insert
to authenticated
with check (bucket_id = 'gallery');

create policy "authenticated owner update gallery files"
on storage.objects for update
to authenticated
using (bucket_id = 'gallery')
with check (bucket_id = 'gallery');

create policy "authenticated owner delete gallery files"
on storage.objects for delete
to authenticated
using (bucket_id = 'gallery');
