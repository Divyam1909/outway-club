-- Outway Club — editorial blog + destination management
-- Run after 0002_launch.sql. Safe to re-run.
--
-- Covers: company-authored blog posts (admins only), public reader comments
-- with an optional star rating and moderation, and a storage bucket for
-- editorial photography that is kept separate from trip photography.

-- ---------------------------------------------------------------------------
-- blog_posts
--
-- content_html is the rendered article body produced by the admin editor. It
-- is sanitised against a tag/attribute allowlist in the API route before it
-- ever reaches this table (src/lib/sanitize-html.ts) — nothing writes here
-- from the browser directly.
-- ---------------------------------------------------------------------------
create table if not exists blog_posts (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  subtitle text,
  excerpt text not null default '',
  content_html text not null default '',
  cover_image text,
  cover_caption text,

  -- Editorial metadata
  author_id uuid references auth.users(id) on delete set null,
  author_name text not null default 'Outway Club',
  author_role text,
  tags jsonb not null default '[]'::jsonb,          -- string[]
  destination_id uuid references destinations(id) on delete set null,
  trip_id uuid references trips(id) on delete set null,
  reading_minutes int not null default 1,

  -- Publishing
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  is_featured boolean not null default false,

  -- SEO overrides. Blank falls back to title / excerpt.
  seo_title text,
  seo_description text,

  -- Derived from approved comments, never hand-set.
  rating numeric(2, 1) not null default 0,
  comment_count int not null default 0,
  view_count int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_idx on blog_posts(status);
create index if not exists blog_posts_published_idx on blog_posts(published_at desc);
create index if not exists blog_posts_destination_idx on blog_posts(destination_id);

-- ---------------------------------------------------------------------------
-- blog_comments
--
-- Open to anyone (signed in or not) but moderated: a comment appears publicly
-- only after an admin approves it, exactly like trip reviews. Writes go
-- through /api/blog/comments (service role, rate limited + honeypot), so no
-- anon insert policy exists here.
-- ---------------------------------------------------------------------------
create table if not exists blog_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references blog_posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  author_name text not null,
  author_email text,
  rating int check (rating between 1 and 5),   -- null = comment without a rating
  body text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists blog_comments_post_idx on blog_comments(post_id);
create index if not exists blog_comments_approved_idx on blog_comments(is_approved);

-- ---------------------------------------------------------------------------
-- Keep blog_posts.rating / comment_count derived from approved comments.
-- ---------------------------------------------------------------------------
create or replace function recompute_post_rating()
returns trigger as $$
declare
  target_post uuid := coalesce(new.post_id, old.post_id);
begin
  update blog_posts set
    rating = coalesce(
      (select round(avg(rating)::numeric, 1) from blog_comments
        where post_id = target_post and is_approved and rating is not null), 0),
    comment_count = (select count(*) from blog_comments
        where post_id = target_post and is_approved)
  where id = target_post;
  return coalesce(new, old);
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists blog_comments_recompute_rating on blog_comments;
create trigger blog_comments_recompute_rating
  after insert or update or delete on blog_comments
  for each row execute procedure recompute_post_rating();

-- Stamp updated_at on every edit so the sitemap reports honest lastModified.
create or replace function touch_blog_post()
returns trigger as $$
begin
  new.updated_at := now();
  -- First transition to published fixes the publication date.
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists blog_posts_touch on blog_posts;
create trigger blog_posts_touch
  before insert or update on blog_posts
  for each row execute procedure touch_blog_post();

-- Increment a post's view counter without granting update rights on the row.
create or replace function increment_post_views(p_slug text)
returns void as $$
  update blog_posts set view_count = view_count + 1
  where slug = p_slug and status = 'published';
$$ language sql security definer set search_path = public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table blog_posts enable row level security;
alter table blog_comments enable row level security;

drop policy if exists "blog_posts: public read published" on blog_posts;
create policy "blog_posts: public read published" on blog_posts
  for select using (status = 'published' or is_admin());

drop policy if exists "blog_posts: admin write" on blog_posts;
create policy "blog_posts: admin write" on blog_posts
  for insert with check (is_admin());

drop policy if exists "blog_posts: admin update" on blog_posts;
create policy "blog_posts: admin update" on blog_posts
  for update using (is_admin());

drop policy if exists "blog_posts: admin delete" on blog_posts;
create policy "blog_posts: admin delete" on blog_posts
  for delete using (is_admin());

drop policy if exists "blog_comments: public read approved" on blog_comments;
create policy "blog_comments: public read approved" on blog_comments
  for select using (is_approved or is_admin());

drop policy if exists "blog_comments: admin update" on blog_comments;
create policy "blog_comments: admin update" on blog_comments
  for update using (is_admin());

drop policy if exists "blog_comments: admin delete" on blog_comments;
create policy "blog_comments: admin delete" on blog_comments
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- Storage — editorial photography, uploaded from the blog editor. Separate
-- from trip-images so a destination shoot and an article illustration never
-- get confused for one another.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update set public = true;

drop policy if exists "blog-images: public read" on storage.objects;
create policy "blog-images: public read" on storage.objects
  for select using (bucket_id = 'blog-images');

drop policy if exists "blog-images: admin upload" on storage.objects;
create policy "blog-images: admin upload" on storage.objects
  for insert with check (bucket_id = 'blog-images' and is_admin());

drop policy if exists "blog-images: admin update" on storage.objects;
create policy "blog-images: admin update" on storage.objects
  for update using (bucket_id = 'blog-images' and is_admin());

drop policy if exists "blog-images: admin delete" on storage.objects;
create policy "blog-images: admin delete" on storage.objects
  for delete using (bucket_id = 'blog-images' and is_admin());
