-- Inventory History Table
-- Tracks all inventory changes for products

CREATE TABLE IF NOT EXISTS inventory_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('sale', 'restock', 'adjustment', 'return', 'damaged', 'other')),
  quantity_change INTEGER NOT NULL, -- Positive for restock, negative for sale
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT CHECK (reference_type IN ('order', 'manual', 'system', 'return')),
  reference_id UUID, -- Order ID or other reference
  performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_history_product_id ON inventory_history(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_variant_id ON inventory_history(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_created_at ON inventory_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_history_change_type ON inventory_history(change_type);

-- Function to automatically log inventory changes
CREATE OR REPLACE FUNCTION log_inventory_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if inventory quantity actually changed
  IF OLD.inventory_quantity IS DISTINCT FROM NEW.inventory_quantity THEN
    INSERT INTO inventory_history (
      product_id,
      change_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason,
      reference_type,
      performed_by
    )
    VALUES (
      NEW.id,
      CASE
        WHEN NEW.inventory_quantity > OLD.inventory_quantity THEN 'restock'
        WHEN NEW.inventory_quantity < OLD.inventory_quantity THEN 'sale'
        ELSE 'adjustment'
      END,
      NEW.inventory_quantity - OLD.inventory_quantity,
      OLD.inventory_quantity,
      NEW.inventory_quantity,
      'Automatic inventory update',
      'system',
      NULL -- System update
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log inventory changes
DROP TRIGGER IF EXISTS trigger_log_inventory_change ON products;
CREATE TRIGGER trigger_log_inventory_change
  AFTER UPDATE OF inventory_quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION log_inventory_change();

