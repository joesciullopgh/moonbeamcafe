-- Run this in Supabase SQL Editor to set up the database

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Profiles table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  first_name text,
  last_name text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  is_active boolean not null default true,
  stars integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

create policy "Admins can update any profile"
  on profiles for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Menu items table
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null,
  category text not null,
  is_available boolean not null default true,
  image_url text,
  customizable boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.menu_items enable row level security;

create policy "Menu items are viewable by everyone"
  on menu_items for select using (true);

create policy "Admins can insert menu items"
  on menu_items for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can update menu items"
  on menu_items for update using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "Admins can delete menu items"
  on menu_items for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Customization options table
create table if not exists public.customization_options (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('size', 'milk', 'shots', 'sweetness', 'temperature', 'extras')),
  price_modifier numeric(10,2) not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.customization_options enable row level security;

create policy "Customization options are viewable by everyone"
  on customization_options for select using (true);

create policy "Admins can manage customization options"
  on customization_options for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Junction table: which items support which customizations
create table if not exists public.menu_item_customizations (
  id uuid primary key default gen_random_uuid(),
  menu_item_id uuid references public.menu_items(id) on delete cascade not null,
  customization_option_id uuid references public.customization_options(id) on delete cascade not null,
  unique(menu_item_id, customization_option_id)
);

alter table public.menu_item_customizations enable row level security;

create policy "Menu item customizations are viewable by everyone"
  on menu_item_customizations for select using (true);

create policy "Admins can manage menu item customizations"
  on menu_item_customizations for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  items jsonb not null default '[]'::jsonb,
  total numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  stars_earned integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Staff and admins can view all orders"
  on orders for select using (
    exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'admin'))
  );

create policy "Authenticated users can create orders"
  on orders for insert with check (auth.uid() = user_id);

create policy "Staff and admins can update orders"
  on orders for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('staff', 'admin'))
  );

-- Favorites table
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  menu_item_id uuid references public.menu_items(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(user_id, menu_item_id)
);

alter table public.favorites enable row level security;

create policy "Users can view own favorites"
  on favorites for select using (auth.uid() = user_id);

create policy "Users can add favorites"
  on favorites for insert with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on favorites for delete using (auth.uid() = user_id);
