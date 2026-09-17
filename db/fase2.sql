-- Fase 2 — crea las 4 zonas nuevas y les asigna los equipos que ya existen.
-- Correr en el SQL Editor de Neon DESPUÉS de db/schema.sql (que agrega `phase` y `zone_teams`).
-- Es idempotente: se puede correr de nuevo sin duplicar nada.
-- Los equipos se buscan por nombre (sin distinguir mayúsculas ni espacios de más).
-- Al final hay una consulta de verificación: si devuelve filas, esos nombres no
-- coinciden con ningún equipo cargado y hay que asignarlos a mano desde /admin.

-- 1) Zonas de Fase 2 (clasifican = 0 hasta que el profe lo defina).
INSERT INTO zones (name, phase, qualifiers_count, sort_order)
SELECT v.name, 2, 0, (SELECT COALESCE(MAX(sort_order), 0) FROM zones) + v.ord
FROM (VALUES
  ('Zona Serie A', 1),
  ('Zona Ligue 1', 2),
  ('Zona Major League', 3),
  ('Zona LaLiga', 4)
) AS v(name, ord)
WHERE NOT EXISTS (SELECT 1 FROM zones z WHERE z.phase = 2 AND z.name = v.name);

-- 2) Equipos de cada zona de Fase 2.
INSERT INTO zone_teams (zone_id, team_id, sort_order)
SELECT z.id, t.id, v.ord
FROM (VALUES
  ('Zona Serie A',      'Galácticos',              0),
  ('Zona Serie A',      'Torino FC',               1),
  ('Zona Serie A',      'Topadora FC',             2),
  ('Zona Serie A',      'Escombro FC',             3),
  ('Zona Ligue 1',      'Puppo FC',                0),
  ('Zona Ligue 1',      'Es lo que hay FC',        1),
  ('Zona Ligue 1',      'Patoñato',                2),
  ('Zona Ligue 1',      'Thevenin FC',             3),
  ('Zona Major League', 'Inter del Gordo Alegre',  0),
  ('Zona Major League', 'Apedreados FC',           1),
  ('Zona Major League', 'Renato FC',               2),
  ('Zona LaLiga',       'SFBC',                    0),
  ('Zona LaLiga',       'La Vinotinto',            1),
  ('Zona LaLiga',       'NTN',                     2)
) AS v(zone, team, ord)
JOIN zones z ON z.phase = 2 AND z.name = v.zone
JOIN teams t ON lower(btrim(t.name)) = lower(btrim(v.team))
ON CONFLICT (zone_id, team_id) DO NOTHING;

-- 3) Verificación: nombres de la lista que NO coinciden con ningún equipo cargado.
--    Si devuelve filas, asignalos a mano desde /admin (o corregí el nombre acá).
SELECT v.team AS equipo_no_encontrado
FROM (VALUES
  ('Galácticos'), ('Torino FC'), ('Topadora FC'), ('Escombro FC'),
  ('Puppo FC'), ('Es lo que hay FC'), ('Patoñato'), ('Thevenin FC'),
  ('Inter del Gordo Alegre'), ('Apedreados FC'), ('Renato FC'),
  ('SFBC'), ('La Vinotinto'), ('NTN')
) AS v(team)
LEFT JOIN teams t ON lower(btrim(t.name)) = lower(btrim(v.team))
WHERE t.id IS NULL;
