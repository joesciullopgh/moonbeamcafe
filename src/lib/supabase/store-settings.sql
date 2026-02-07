-- Run this in Supabase SQL Editor to add the store_settings table
-- This allows admins to manage store info without code changes

create table if not exists public.store_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.store_settings enable row level security;

create policy "Store settings are viewable by everyone"
  on store_settings for select using (true);

create policy "Admins can manage store settings"
  on store_settings for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Seed default values
INSERT INTO public.store_settings (key, value) VALUES
  ('store_name', 'Moonbeam Cafe'),
  ('address_line1', '4621 Liberty Avenue'),
  ('address_line2', 'Pittsburgh, PA'),
  ('phone', '(412) 251-1392'),
  ('hours_weekday', 'Mon–Sat: 7am – 5pm'),
  ('hours_weekend', 'Sunday: 9am – 3pm'),
  ('instagram_url', 'https://instagram.com/moonbeamcafepgh'),
  ('facebook_url', 'https://facebook.com/MoonbeamCafePgh'),
  ('tagline', 'Your neighborhood coffee shop in Pittsburgh, serving handcrafted drinks and fresh food with a warm smile.')
ON CONFLICT (key) DO NOTHING;
