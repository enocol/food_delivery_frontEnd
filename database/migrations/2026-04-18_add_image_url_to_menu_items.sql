-- Add image_url column to menu_items table
-- Allows menu items to have their own images instead of relying on restaurant images

BEGIN;

-- Add image_url column to menu_items if it doesn't exist
ALTER TABLE menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add a check constraint to ensure non-empty URLs
-- ALTER TABLE menu_items
--   ADD CONSTRAINT menu_items_image_url_not_empty
--   CHECK (image_url IS NULL OR image_url != '');

COMMIT;
