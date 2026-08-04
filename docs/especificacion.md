# Especificación — Torneo Interno 2026

Documento del alcance y el diseño técnico. **Estado: implementado y desplegado** (ver `README.md`
para el uso y `CLAUDE.md` para el mapa del código). El modelo de datos de abajo refleja lo que
efectivamente existe en `db/schema.sql`.

## Stack

- **Frontend + Backend:** Next.js (App Router) + TypeScript.
- **Hosting:** Vercel.
- **Base de datos:** Vercel Postgres.
- **Almacenamiento de imágenes:** Vercel Blob (logos de equipos y logo del torneo).
- **Procesamiento de imágenes:** en el servidor al subir (unificar tamaño/formato a PNG cuadrado + quitar fondos planos por heurística).
- **Acceso admin:** contraseña única simple (variable de entorno), protegiendo las rutas `/admin`.

## Dos vistas

### Pública (solo lectura)
- Encabezado con **nombre del torneo** ("Torneo Interno 2026") y **logo del torneo** (editables).
- Institución: **UTN Santa Fe**.
- Las **2 zonas** (o las que existan) con su tabla de posiciones.
- Columnas por equipo: **Pos, Logo, Nombre, PJ, PG, PE, PP, GF, GC, DIF, Pts**.
- Equipos en puestos de clasificación pintados en **dorado semi-opaco**.
- **Cuadro de playoffs** (llaves) con los cruces definidos.
- **Fixture** por fechas/jornadas y sección de **próximos partidos / últimos resultados**.

### Admin (`/admin`, protegida por contraseña)
- Editar **configuración global**: nombre y logo del torneo.
- CRUD de **zonas** (crear/renombrar/borrar; definir cuántos clasifican).
- CRUD de **equipos** dentro de cada zona (nombre + subir logo).
- Cargar **partidos/resultados** → la tabla se recalcula sola.
- Gestionar **fixture** (fechas/jornadas).
- Definir/editar **cruces de playoffs** (ej. 1°A vs 4°B), referenciando posición + zona.

## Modelo de datos (borrador)

> Postgres. Nombres tentativos, se ajustan al implementar.

> **Modelo IMPLEMENTADO** (ver `db/schema.sql` y `lib/queries.ts`):

- **settings**: `id` (siempre 1), `tournament_name`, `subtitle`, `logo_url`, `points_win`, `points_draw`.
- **zones**: `id`, `name`, `qualifiers_count` (cuántos clasifican), `sort_order`.
- **teams**: `id`, `zone_id` (FK, cascade), `name`, `logo_url`, `sort_order`.
- **players**: `id`, `team_id` (FK, cascade), `name`, `number` (opcional), `photo_url` (opcional), `sort_order`.
- **matches**: `id`, `zone_id` (FK, cascade), `home_team_id`, `away_team_id`,
  `home_score`, `away_score`, `played` (bool), `matchday`, `scheduled_at`, `created_at`.
- **playoff_ties**: `id`, `round` (0=cuartos, 1=semi, 2=final), `sort_order`,
  `home_label` / `away_label` (referencia editable, ej. "1°A"), `home_team_id` / `away_team_id`
  (FK opcional, set null), `home_score`, `away_score`, `played`.
  El cruce se resuelve manualmente por el profe (no hay avance automático de ganadores).

### Cálculo de la tabla
La tabla NO se guarda: se **deriva** de `matches` con `played = true` (`computeStandings` en `lib/queries.ts`).
- Puntos: `points_win` por victoria, `points_draw` por empate, 0 por derrota (configurables en `settings`).
- Desempate: **Pts → DIF → GF → nombre**.
- Un partido cuenta como jugado cuando tiene los dos goles cargados.

## Decisiones de negocio (implementadas)
- Puntos por defecto **3 / 1 / 0** (editables desde el admin).
- Desempate **Pts → DIF → GF**.
- Borrar una zona/equipo **borra en cascada** lo que cuelga (equipos, jugadores, partidos).
- Logos: normalización a PNG cuadrado 256px + quita de fondos planos por flood-fill (`lib/logo.ts`).

## Fuera de alcance (implementación actual)
- Tabla de goleadores / estadísticas por jugador (los jugadores solo se listan).
- Tarjetas, sanciones.
- Avance automático de ganadores en el cuadro de playoffs (se carga a mano).
- Multi-idioma (solo español) y roles múltiples de admin.
