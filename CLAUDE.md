# CLAUDE.md — Torneo Interno 2026

> Documento de contexto clave para cualquier agente que trabaje en este proyecto.
> Mantener actualizado a medida que se toman decisiones. **Última actualización: 2026-08-04.**

## Qué es este proyecto

Página web del **torneo interno de la facultad** (UTN Facultad Regional Santa Fe).
El contenido lo carga el **profesor** (no el desarrollador) desde un **panel de administración**
simple. Prioridad #1 del producto: que el profesor cargue datos sin fricción.

Dos audiencias:
- **Público (solo lectura):** ven posiciones, equipos, fixture y playoffs.
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
- `db/schema.sql` (idempotente) + `db/setup.mjs` (`npm run db:setup`).

## Puntos clave del producto (implementado)

- **Todo editable desde el admin:** nombre/subtítulo/logo del torneo, zonas, equipos, jugadores, partidos y playoffs. Sin nombres de zona hardcodeados.
- **Tabla de posiciones calculada sola** desde `matches` jugados (`computeStandings`). Desempate **Pts → DIF → GF**. Puntos configurables (3/1/0 por defecto).
- **Estructura configurable:** zonas y cantidad de equipos dinámicas. Cada zona define cuántos clasifican → se pintan en **dorado**.
- **Playoffs:** cruces editables por instancia (Cuartos/Semis/Final) con referencia (ej. 1°A), asignación de equipo y resultados. Avance de ganadores **manual**.
- **Fecha y hora de partidos** (`scheduled_at`): editable en el admin; el **fixture se ordena por fecha/hora** y la muestra en horario de Argentina (UTC-3). Convive con el número de jornada (`matchday`).
- **Fotos de jugadores** (`players.photo_url`): el profe las sube desde el admin; se procesan como recorte cuadrado JPEG (sin quita-fondo) y se ven como avatar en el roster.
- **Vista pública** con pestañas **Posiciones / Equipos / Fixture / Playoffs / Mi equipo**, responsive y tema claro/oscuro.
- **Pestaña "Mi equipo":** cada visitante elige un equipo (guardado en el navegador) y ve su posición en la zona, estadísticas, próximos partidos y últimos resultados. Se calcula en el cliente, sin tocar la base.

## Estado

🟢 **Terminado según el alcance planificado y desplegado en producción.**
Detalle de features y uso en `README.md` y `docs/guia-profesor.md`.

Mejoras futuras posibles (no pedidas): 3er puesto/más rondas, goleadores, orden manual de equipos/jugadores.

## Notas operativas importantes

- **El store de Blob debe ser PÚBLICO.** Con un store privado la subida de logos falla
  (`Cannot use public access on a private store`). Store en uso: `torneo-logos-pub` (`BLOB_READ_WRITE_TOKEN`).
- **Cambios de esquema:** editar `db/schema.sql` y ejecutarlo en el **SQL Editor de Neon** (es idempotente).
- **Secretos redactados en el entorno del agente:** al hacer `vercel env pull`, los valores sensibles
  llegan como `[SENSITIVE]`. Por eso no se puede correr `db:setup` ni conectar a la base desde el agente;
  las tablas se crean pegando el SQL en Neon y se prueba vía deploys de Vercel.

## Reglas de trabajo para agentes

1. El usuario habla español; responder en español.
2. Registrar decisiones de diseño/arquitectura en `docs/decisiones.md`.
3. No hardcodear datos del torneo (nombres de zonas, equipos, etc.): todo sale de la base.
4. Verificar cambios con `npm run build` antes de commitear; las escrituras a la base se prueban en el deploy.
5. Confirmar (o probar) con el usuario antes de dar por cerrado algo que toca la base o el deploy.
