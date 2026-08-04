-- Esquema de la base de datos — Torneo Interno 2026
-- Ejecutar una vez en el SQL Editor de Neon (o vía `npm run db:setup`).
-- Es idempotente: se puede correr de nuevo sin romper nada.

-- Configuración global del torneo (una sola fila, id = 1)
CREATE TABLE IF NOT EXISTS settings (
  id                  INT PRIMARY KEY DEFAULT 1,
  tournament_name     TEXT NOT NULL DEFAULT 'Torneo Interno 2026',
  subtitle            TEXT NOT NULL DEFAULT 'UTN · Facultad Regional Santa Fe',
  logo_url            TEXT,
  points_win          INT  NOT NULL DEFAULT 3,
  points_draw         INT  NOT NULL DEFAULT 1,
  CONSTRAINT settings_single_row CHECK (id = 1)
);
INSERT INTO settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Zonas (configurables por el profesor)
CREATE TABLE IF NOT EXISTS zones (
  id                SERIAL PRIMARY KEY,
  name              TEXT NOT NULL,
  qualifiers_count  INT  NOT NULL DEFAULT 4,
  sort_order        INT  NOT NULL DEFAULT 0
);

-- Equipos, cada uno pertenece a una zona
CREATE TABLE IF NOT EXISTS teams (
  id          SERIAL PRIMARY KEY,
  zone_id     INT  NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  logo_url    TEXT,
  sort_order  INT  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS teams_zone_idx ON teams(zone_id);

-- Partidos de la fase de zonas. La tabla de posiciones se calcula desde acá.
CREATE TABLE IF NOT EXISTS matches (
  id            SERIAL PRIMARY KEY,
  zone_id       INT  NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  home_team_id  INT  NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id  INT  NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  home_score    INT,
  away_score    INT,
  played        BOOLEAN NOT NULL DEFAULT FALSE,
  matchday      INT,                 -- número de fecha/jornada
  scheduled_at  TIMESTAMPTZ,         -- fecha/hora del partido (opcional)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matches_zone_idx ON matches(zone_id);

-- Llaves de playoffs. El profe define los cruces (ej. 1°A vs 4°B) y carga resultados.
-- round: 0 = cuartos, 1 = semifinal, 2 = final (extensible).
CREATE TABLE IF NOT EXISTS playoff_ties (
  id            SERIAL PRIMARY KEY,
  round         INT  NOT NULL,
  sort_order    INT  NOT NULL DEFAULT 0,
  home_label    TEXT,                -- etiqueta editable, ej. "1°A"
  away_label    TEXT,                -- ej. "4°B"
  home_team_id  INT  REFERENCES teams(id) ON DELETE SET NULL,
  away_team_id  INT  REFERENCES teams(id) ON DELETE SET NULL,
  home_score    INT,
  away_score    INT,
  played        BOOLEAN NOT NULL DEFAULT FALSE
);

-- Jugadores de cada equipo (se cargan a mano desde el admin)
CREATE TABLE IF NOT EXISTS players (
  id          SERIAL PRIMARY KEY,
  team_id     INT  NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  number      INT,                 -- número de camiseta (opcional)
  sort_order  INT  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS players_team_idx ON players(team_id);

-- Migraciones aditivas (idempotentes) para bases ya creadas:
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;        -- foto del jugador (Vercel Blob)
ALTER TABLE matches ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ; -- fecha/hora del partido

-- Semilla inicial: dos zonas para empezar (el profe puede renombrar/borrar/agregar).
INSERT INTO zones (name, qualifiers_count, sort_order)
SELECT 'Zona A', 4, 0 WHERE NOT EXISTS (SELECT 1 FROM zones);
INSERT INTO zones (name, qualifiers_count, sort_order)
SELECT 'Zona B', 4, 1 WHERE (SELECT COUNT(*) FROM zones) = 1;
