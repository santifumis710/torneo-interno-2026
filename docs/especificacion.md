# Especificación — Torneo Interno 2026

Documento vivo con el alcance y el diseño técnico acordados. Base para construir.

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

- **settings**: `id`, `tournament_name`, `tournament_logo_url`.
- **zones**: `id`, `name` (ej. "Zona A"), `qualifiers_count` (cuántos clasifican), `order`.
- **teams**: `id`, `zone_id` (FK), `name`, `logo_url`.
- **matches**: `id`, `zone_id` (FK, null si es de playoff), `home_team_id`, `away_team_id`,
  `home_score`, `away_score`, `played` (bool), `matchday` (fecha/jornada), `scheduled_at` (fecha/hora opcional).
- **playoff_slots / bracket**: representación de las llaves. Cada cruce referencia
  o bien un **origen por posición+zona** (ej. pos 1 de Zona A) o bien el **ganador de otro cruce**.
  Campos tentativos: `id`, `round` (cuartos/semi/final), `slot_home`, `slot_away`,
  `home_source` (`{type: 'zone_position', zone_id, position}` | `{type: 'winner_of', match_id}`),
  `away_source`, `home_score`, `away_score`, `order`.

### Cálculo de la tabla
La tabla NO se guarda: se **deriva** de `matches` con `played = true`.
- Puntos: victoria = 3, empate = 1, derrota = 0 (ajustable).
- Desempate por defecto: **Pts → DIF → GF** (a confirmar/ajustar).

## Reglas de negocio a confirmar al construir
- Puntos por victoria/empate (asumo 3/1/0).
- Orden de criterios de desempate.
- Qué pasa si un equipo se borra teniendo partidos cargados (bloquear / cascada).

## Fuera de alcance (por ahora)
- Tabla de goleadores / estadísticas por jugador.
- Tarjetas, sanciones.
- Multi-idioma (solo español).
- Roles múltiples de admin.
