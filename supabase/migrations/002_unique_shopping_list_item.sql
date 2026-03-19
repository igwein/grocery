-- Prevent duplicate items in the shopping list
-- First, remove any existing duplicates (keep the oldest entry)
DELETE FROM shopping_list
WHERE id NOT IN (
  SELECT DISTINCT ON (item_name) id
  FROM shopping_list
  ORDER BY item_name, created_at ASC
);

-- Add unique constraint on item_name
ALTER TABLE shopping_list ADD CONSTRAINT shopping_list_item_name_unique UNIQUE (item_name);
