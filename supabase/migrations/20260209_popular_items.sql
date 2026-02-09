-- Add is_popular flag to menu_items for admin-controlled "Popular" badges
ALTER TABLE menu_items ADD COLUMN is_popular boolean NOT NULL DEFAULT false;
