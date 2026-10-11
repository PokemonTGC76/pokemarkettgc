INSERT INTO product_stock (product_name, quantity) VALUES
  ('Booster Méga-Évolution – Règne Delta', 0),
  ('ETB Méga-Évolution', 0)
ON CONFLICT (product_name) DO UPDATE SET quantity = EXCLUDED.quantity;
