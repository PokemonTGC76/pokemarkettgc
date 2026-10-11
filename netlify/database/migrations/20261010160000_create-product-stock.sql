CREATE TABLE product_stock (
  product_name TEXT PRIMARY KEY,
  quantity INTEGER NOT NULL CHECK (quantity >= 0)
);

INSERT INTO product_stock (product_name, quantity) VALUES
  ('Booster 30ᵉ Anniversaire', 10),
  ('Booster Méga-Évolution – Règne Delta', 40),
  ('ETB 30ᵉ Anniversaire', 1),
  ('ETB Méga-Évolution', 1),
  ('Booster Méga-Évolution – Nuit Noire', 40),
  ('ETB Méga-Évolution – Nuit Noire', 1),
  ('ETB Rivalités Destinées', 1),
  ('Booster 30ᵉ Anniversaire – Collection', 10),
  ('Booster Méga-Évolution – Chaos Ascendant', 40),
  ('ETB Origine Perdue – EB11', 1),
  ('ETB Dracaufeu – Flammes Fantasmagoriques ME02', 1),
  ('Booster Pokémon japonais', 40),
  ('Booster japonais premium', 40),
  ('Booster Pokémon chinois', 40),
  ('Booster chinois — collection', 40),
  ('Display Pokémon français', 0),
  ('Display Pokémon japonais', 0);
