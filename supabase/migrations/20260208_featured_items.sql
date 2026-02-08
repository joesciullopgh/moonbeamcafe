-- Add featured item support to menu_items
-- Allows admins to select which items appear in the "Signature Creations" homepage section

ALTER TABLE menu_items
  ADD COLUMN is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN featured_tagline text,
  ADD COLUMN featured_order integer NOT NULL DEFAULT 0;

-- Index for efficient homepage query
CREATE INDEX idx_menu_items_featured ON menu_items (is_featured, featured_order)
  WHERE is_featured = true;
