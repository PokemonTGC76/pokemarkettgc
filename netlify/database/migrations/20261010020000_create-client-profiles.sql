CREATE TABLE client_profiles (
  identity_id TEXT PRIMARY KEY,
  prenom TEXT NOT NULL CHECK (char_length(prenom) BETWEEN 1 AND 100),
  nom TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 100),
  email TEXT NOT NULL,
  tel TEXT NOT NULL DEFAULT '' CHECK (char_length(tel) <= 40),
  adresse TEXT NOT NULL CHECK (char_length(adresse) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
