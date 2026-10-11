INSERT INTO product_stock (product_name, quantity) VALUES
  ('Coffret Fable Nébuleuse', 1)
ON CONFLICT (product_name) DO UPDATE SET quantity = EXCLUDED.quantity;
