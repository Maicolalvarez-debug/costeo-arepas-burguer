-- Ejecuta este archivo UNA VEZ en el editor SQL de Neon (Dashboard -> SQL Editor)
-- antes de desplegar la app. Crea las tablas necesarias.

CREATE TABLE IF NOT EXISTS ingredients (
  id            text PRIMARY KEY,
  nombre        text NOT NULL,
  unidad        text NOT NULL,
  peso_vol      numeric NOT NULL,
  costo_total   numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS recipes (
  id      text PRIMARY KEY,
  nombre  text NOT NULL,
  margen  numeric NOT NULL DEFAULT 100
);

CREATE TABLE IF NOT EXISTS recipe_items (
  id             serial PRIMARY KEY,
  recipe_id      text NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id  text REFERENCES ingredients(id) ON DELETE SET NULL,
  cantidad       numeric NOT NULL
);

CREATE TABLE IF NOT EXISTS params (
  id              int PRIMARY KEY DEFAULT 1,
  comision_rappi  numeric NOT NULL DEFAULT 0.35,
  margen_default  numeric NOT NULL DEFAULT 100
);

INSERT INTO params (id, comision_rappi, margen_default)
VALUES (1, 0.35, 100)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
