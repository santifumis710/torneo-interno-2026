# Torneo Interno 2026 — UTN Santa Fe

Página web del torneo interno de la UTN Facultad Regional Santa Fe. Muestra las **posiciones**
por zona (calculadas solas, con clasificados a playoffs resaltados en dorado), los **equipos**
con sus planteles, el **fixture** y el **cuadro de playoffs**. Toda la información la carga el
profesor desde un **panel de administración** — no hace falta tocar código.

🔗 **Producción:** https://utn-torneo-interno-2026.vercel.app · **Admin:** `/admin`

## Funcionalidades

**Web pública** (`/`), en pestañas:
- **Posiciones** — tabla por zona (PJ, G, E, P, GF, GC, DIF, Pts), ordenada por Pts → DIF → GF, con los clasificados en dorado.
- **Equipos** — planteles por zona, cada equipo con su logo y jugadores.
- **Fixture** — partidos por fecha con resultados (o "VS" si están pendientes).
- **Playoffs** — cuadro Cuartos → Semifinales → Final.
- Responsive (celular y computadora) y tema claro/oscuro.

**Panel `/admin`** (protegido por contraseña) — el profesor gestiona todo:
- **Torneo:** nombre, subtítulo, puntaje (victoria/empate) y logo.
- **Zonas:** crear/renombrar/borrar y cuántos equipos clasifican (sin nombres fijos).
- **Equipos:** crear/mover/borrar y subir logo (se normaliza solo).
- **Jugadores:** alta/edición/borrado por equipo.
- **Partidos:** cargar resultados → la tabla y el fixture se recalculan solos.
- **Playoffs:** definir cruces (ej. 1°A vs 4°B), asignar equipos y cargar resultados.

## Stack

- **Next.js 16** (App Router) + **TypeScript**, desplegado en **Vercel**.
- **Base de datos:** **Neon** Postgres (Marketplace de Vercel), vía `@neondatabase/serverless` con SQL parametrizado (sin ORM).
- **Imágenes:** **Vercel Blob** (store **público**), con normalización de logos usando **sharp** (`lib/logo.ts`).
- **Auth admin:** contraseña única en `ADMIN_PASSWORD`, con cookie de sesión firmada (`lib/auth.ts`).

## Variables de entorno

Las inyecta Vercel automáticamente al conectar los servicios:

| Variable | De dónde sale | Para qué |
|----------|---------------|----------|
| `DATABASE_URL` | Integración de Neon | Conexión a la base |
| `BLOB_READ_WRITE_TOKEN` | Store de Blob **público** | Subir logos |
| `ADMIN_PASSWORD` | Definida a mano | Contraseña del panel `/admin` |

> ⚠️ El store de Blob **debe ser público**; si es privado, la subida de logos falla
> (`Cannot use public access on a private store`) porque el sitio necesita URLs públicas.

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

Para conectar a la base en local: `npx vercel link` y `npx vercel env pull .env.local`.

## Base de datos

El esquema está en [`db/schema.sql`](./db/schema.sql) (idempotente). Para crear/actualizar las tablas:

- **Recomendado:** pegar el contenido de `db/schema.sql` en el **SQL Editor de Neon** y ejecutar.
- **Alternativa:** con `DATABASE_URL` en `.env.local`, correr `npm run db:setup`.

Tablas: `settings`, `zones`, `teams`, `players`, `matches`, `playoff_ties`.
La tabla de posiciones **no se almacena**: se calcula desde `matches` (ver `lib/queries.ts`).

## Documentación del proyecto

- [`CLAUDE.md`](./CLAUDE.md) — contexto y decisiones clave (leer primero).
- [`docs/guia-profesor.md`](./docs/guia-profesor.md) — **cómo usar el panel de administración** (para el profe).
- [`docs/especificacion.md`](./docs/especificacion.md) — spec técnico y modelo de datos.
- [`docs/decisiones.md`](./docs/decisiones.md) — registro de decisiones.
- [`docs/preguntas-abiertas.md`](./docs/preguntas-abiertas.md) — estado del relevamiento.
- [`docs/mockup.html`](./docs/mockup.html) — mockup visual inicial.

## Posibles mejoras a futuro

3er puesto / más rondas de playoffs · fecha y hora en el fixture · tabla de goleadores ·
ordenar equipos y jugadores manualmente.
