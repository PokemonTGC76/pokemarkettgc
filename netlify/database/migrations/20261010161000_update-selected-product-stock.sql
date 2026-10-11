INSERT INTO product_stock (product_name, quantity) VALUES
  ('ETB Rivalités Destinées', 0),
  ('Coffret Premiers Partenaires – Série 2', 1),
  ('Booster Méga-Évolution – Règne Delta', 0),
  ('ETB Méga-Évolution', 0)
ON CONFLICT (product_name) DO UPDATE SET quantity = EXCLUDED.quantity;
