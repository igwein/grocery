-- Items catalog: master list of known grocery items
CREATE TABLE items_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  category_emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_items_catalog_name ON items_catalog (name);

-- Purchase history: past purchases (seeded from CSV, grows over time)
CREATE TABLE purchase_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category_emoji text NOT NULL,
  purchased_at date NOT NULL,
  source text NOT NULL DEFAULT 'app',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_purchase_history_item ON purchase_history (item_name);
CREATE INDEX idx_purchase_history_date ON purchase_history (purchased_at);

-- Shopping list: current active list (real-time enabled)
CREATE TABLE shopping_list (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category_emoji text NOT NULL,
  quantity text,
  notes text,
  added_by text NOT NULL DEFAULT 'manager',
  is_checked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  checked_at timestamptz
);

CREATE INDEX idx_shopping_list_checked ON shopping_list (is_checked);

-- Enable realtime on shopping_list
ALTER PUBLICATION supabase_realtime ADD TABLE shopping_list;
