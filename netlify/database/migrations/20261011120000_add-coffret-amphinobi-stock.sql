INSERT INTO product_stock (product_name, quantity) VALUES
  ('Coffret Amphinobi – 30 ans', 1)
ON CONFLICT (product_name) DO UPDATE SET quantity = EXCLUDED.quantity;
