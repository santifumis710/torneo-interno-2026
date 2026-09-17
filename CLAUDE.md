# CLAUDE.md — Torneo Interno 2026

> Documento de contexto clave para cualquier agente que trabaje en este proyecto.
> Mantener actualizado a medida que se toman decisiones. **Última actualización: 2026-09-17.**

## Qué es este proyecto

Página web del **torneo interno de la facultad** (UTN Facultad Regional Santa Fe).
El contenido lo carga el **profesor** (no el desarrollador) desde un **panel de administración**
simple. Prioridad #1 del producto: que el profesor cargue datos sin fricción.

Dos audiencias:
- **Público (solo lectura):** ven las posiciones de cada fase, equipos, fixture e historial.
- **Admin (profesor):** carga y edita todo en `/admin`.

🔗 **Producción:** https://utn-torneo-interno-2026.vercel.app · **Repo:** https://github.com/santifumis710/torneo-interno-2026

## Arquitectura

- **Framework:** Next.js 16 (App Router) + TypeScript, en **Vercel** (auto-deploy desde `main`).
- **Base de datos:** **Neon** Postgres (Marketplace de Vercel), vía `@neondatabase/serverless` con SQL parametrizado (sin ORM). Cliente en `lib/db.ts`, consultas en `lib/queries.ts`.
- **Imágenes:** **Vercel Blob** (store **público** `torneo-logos-pub`). Normalización de logos con **sharp** en `lib/logo.ts` (PNG cuadrado 256px + quita de fondos planos por flood-fill).
- **Auth admin:** contraseña única en env `ADMIN_PASSWORD`, cookie de sesión firmada (`lib/auth.ts`).

### Mapa del código
- `app/page.tsx` (server) → lee la base → `app/PublicView.tsx` (cliente) renderiza las pestañas.
- `app/admin/page.tsx` (protegida) → panel; `app/admin/actions.ts` → server actions (ABM).
- `app/tournament.css` (público) y `app/admin/admin.css` (admin); tokens/tema en `app/globals.css`.
- `db/schema.sql` (idempotente) + `db/setup.mjs` (`npm run db:setup`); `db/fase2.sql` arma las zonas de Fase 2.

## Puntos clave del producto (implementado)

- **Todo editable desde el admin:** nombre/subtítulo/logo del torneo, fases, zonas, equipos, jugadores y partidos. Sin nombres de zona ni de equipo hardcodeados.
- **Tabla de posiciones calculada sola** desde `matches` jugados (`computeStandings`). Columnas **Pts PJ G E P DIF GF GC**; desempate **Pts → DIF → GF → orden del equipo en la zona** (`zone_teams.sort_order`, con flechas ↑↓ en el admin). Puntos configurables (3/1/0 por defecto).
- **Estructura configurable:** zonas y cantidad de equipos dinámicas. Cada zona define cuántos clasifican → se pintan en **dorado**.
- **Fases:** `zones.phase` (1, 2, …) y **`zone_teams`** (many-to-many) porque en Fase 2 los mismos equipos se reagrupan en zonas nuevas. `teams.zone_id` queda solo por compatibilidad/cascade: la fuente de verdad de "qué equipos hay en esta zona" es `zone_teams`. Los partidos heredan la fase de su zona (`matches` sin columna nueva). La etiqueta se genera (`Fase N`), no se hardcodea.
- **Interzonal sin cambios de base:** un partido es interzonal si sus dos equipos son de **zonas distintas de la misma fase** (se deduce, no se marca). La tabla de una zona cuenta **todos los partidos de su fase en los que juega un equipo suyo**, sumando solo el lado que le pertenece (`tableMatches` en `getPublicData` + `computeStandings` por lado), así dos zonas de 3 se cruzan y cada una conserva su tabla. Se cargan en el bloque **«Interzonal»** del admin (uno solo por fase, debajo de las zonas) y en el fixture público salen en una tarjeta **Interzonal**.
- **Playoffs eliminados de la UI** (nunca se usaron). La tabla `playoff_ties` sigue en la base, sin uso.
- **Fecha y hora de partidos** (`scheduled_at`): editable en el admin; el **fixture se ordena por fecha/hora** y la muestra en horario de Argentina (UTC-3). Convive con el número de jornada (`matchday`).
- **Fotos de jugadores** (`players.photo_url`): el profe las sube desde el admin; se procesan como recorte cuadrado JPEG (sin quita-fondo) y se ven como avatar en el roster.
- **Vista pública** con pestañas **una por fase (Fase 2, Fase 1, …) / Equipos / Fixture / Historial**, responsive y tema claro/oscuro. Abre en la fase más nueva. **Equipos** va sin agrupar (una sola grilla).
- **Fixture por fase:** el selector de fase es **obligatorio** (los números de fecha se repiten entre fases) y recién dentro se agrupa por zona/fecha/día. Con **filtro por equipo** no hace falta: se muestran todas las fases, una debajo de la otra, ordenadas por número de fecha.
- **Fechas libres deducidas** (`lib/byes.ts`): con zonas impares, si en una fecha juegan `equipos - 1` equipos de la zona y falta exactamente uno, ese equipo figura **Libre**. Fecha incompleta o con interzonales ⇒ no se afirma nada. Se ve en el filtro por equipo y en el agrupado "Por fecha"; **no** en "Por zona" ni "Por día/hora". Sin cambios de base.
- **Admin por secciones plegables** (`<details>`): 1) Partidos y resultados (abierta, con selector de fase vía `?fase=N`), 2) Zonas y fases, 3) Equipos y jugadores, 4) Historial, 5) Torneo. El profe ya no carga equipos/jugadores ni toca Fase 1: sigue todo disponible pero fuera del camino.
- **Historial de campeones** (tabla `champions`): ediciones anteriores, editables desde el admin. `season` es texto y el orden lo da `sort_order`.

## Estado

🟢 **Terminado según el alcance planificado y desplegado en producción.**
Detalle de features y uso en `README.md` y `docs/guia-profesor.md`.

Mejoras futuras posibles (no pedidas): instancia final/playoffs, goleadores, orden manual de jugadores dentro del equipo.

## Notas operativas importantes

- **El store de Blob debe ser PÚBLICO.** Con un store privado la subida de logos falla
  (`Cannot use public access on a private store`). Store en uso: `torneo-logos-pub` (`BLOB_READ_WRITE_TOKEN`).
- **Cambios de esquema:** editar `db/schema.sql` y ejecutarlo en el **SQL Editor de Neon** (es idempotente).
- **Corrido en Neon el 2026-09-17:** `db/schema.sql` (agregó `zones.phase` + `zone_teams` con su backfill) y `db/fase2.sql` (creó las 4 zonas de Fase 2 y les asignó los 14 equipos por nombre, sin ninguno sin matchear). Verificado contra producción.
- **Secretos redactados en el entorno del agente:** al hacer `vercel env pull`, los valores sensibles
  llegan como `[SENSITIVE]`. Por eso no se puede correr `db:setup` ni conectar a la base desde el agente;
  las tablas se crean pegando el SQL en Neon y se prueba vía deploys de Vercel.

## Reglas de trabajo para agentes

1. El usuario habla español; responder en español.
2. Registrar decisiones de diseño/arquitectura en `docs/decisiones.md`.
3. No hardcodear datos del torneo (nombres de zonas, equipos, etc.): todo sale de la base.
4. Verificar cambios con `npm run build` antes de commitear; las escrituras a la base se prueban en el deploy.
5. Confirmar (o probar) con el usuario antes de dar por cerrado algo que toca la base o el deploy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
