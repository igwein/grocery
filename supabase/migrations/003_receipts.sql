-- Receipts: stores uploaded receipt images linked to purchase history
CREATE TABLE receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_urls text[] NOT NULL,
  purchased_at date NOT NULL,
  store_name text,
  total text,
  created_at timestamptz DEFAULT now()
);

-- Link purchase history to receipts (nullable — not all purchases have receipts)
ALTER TABLE purchase_history
  ADD COLUMN receipt_id uuid REFERENCES receipts(id);

CREATE INDEX idx_purchase_history_receipt ON purchase_history (receipt_id);
