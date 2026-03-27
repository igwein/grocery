-- Remove duplicate purchase_history rows (keep the earliest created_at per item+date+source)
DELETE FROM purchase_history
WHERE id NOT IN (
  SELECT DISTINCT ON (item_name, purchased_at, source) id
  FROM purchase_history
  ORDER BY item_name, purchased_at, source, created_at ASC
);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX idx_purchase_history_unique
  ON purchase_history (item_name, purchased_at, source);
