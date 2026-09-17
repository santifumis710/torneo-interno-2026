# Torneo Interno 2026 — UTN Santa Fe

Página web del torneo interno de la UTN Facultad Regional Santa Fe. Muestra las **posiciones**
por zona de cada **fase** (calculadas solas, con los clasificados resaltados en dorado), los
**equipos** con sus planteles y el **fixture**. Toda la información la carga el profesor desde
un **panel de administración** — no hace falta tocar código.

🔗 **Producción:** https://utn-torneo-interno-2026.vercel.app · **Admin:** `/admin`

## Funcionalidades

**Web pública** (`/`), en pestañas:
- **Una pestaña por fase** (Fase 2, Fase 1, …, de la más nueva a la más vieja) — tabla de cada zona de esa fase (Pts, PJ, G, E, P, DIF, GF, GC), ordenada por Pts → DIF → GF → orden del equipo en la zona, con los clasificados en dorado. Las pestañas salen de las fases que existen en la base; la que se abre primero es la más nueva.
- **Equipos** — todos los equipos en una grilla, cada uno con su logo y su plantel (con foto).
- **Fixture** — partidos con resultados (o "VS" si están pendientes). Primero se **elige la fase** (los números de fecha se repiten entre fases) y dentro de ella se agrupa **por zona, por fecha o por día/hora**. Con el **filtro por equipo** no hace falta elegir fase: se ven **todas**, una debajo de la otra, ordenadas por número de fecha. Las **fechas libres** (zonas de equipos impares) se deducen solas y aparecen como una fila más.
- **Historial** — tabla de campeones de las ediciones anteriores.
- Responsive (celular y computadora) y tema claro/oscuro.

**Panel `/admin`** (protegido por contraseña) — el profesor gestiona todo:
Está dividido en secciones plegables; solo **Partidos y resultados** viene abierta, que es lo que se usa semana a semana.
- **Partidos y resultados:** cargar partidos y resultados, número de jornada y **fecha/hora** → la tabla y el fixture se recalculan solos. Arriba hay un selector de **fase**, que arranca en la más nueva.
- **Zonas y fases:** crear/renombrar/borrar zonas, en qué fase está cada una, cuántos clasifican, y qué equipos juegan en cada zona (un mismo equipo puede estar en una zona por fase; sacarlo de una zona no lo borra) y en qué **orden** aparecen, que es el último desempate de la tabla.
- **Equipos y jugadores:** nombre y logo de cada equipo (se normaliza y se le quita el fondo plano), y alta/edición/borrado de jugadores con **foto** opcional.
- **Historial de campeones:** agregar, editar o borrar las filas de años anteriores.
- **Torneo:** nombre, subtítulo, puntaje (victoria/empate) y logo (se respeta tal cual, sin quitafondo).

Al reemplazar, quitar o borrar una imagen (logos y fotos), el archivo anterior se elimina del Vercel Blob para no dejar huérfanos.

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

Tablas: `settings`, `zones` (con `phase`), `teams`, `zone_teams` (qué equipos juegan en cada zona), `players`, `matches`, `champions`.
`playoff_ties` sigue existiendo pero no se usa.
Para crear las zonas de Fase 2 con sus equipos de una, está `db/fase2.sql` (también se puede hacer desde `/admin`).
La tabla de posiciones **no se almacena**: se calcula desde `matches` (ver `lib/queries.ts`).

## Documentación del proyecto

- [`CLAUDE.md`](./CLAUDE.md) — contexto y decisiones clave (leer primero).
- [`docs/guia-profesor.md`](./docs/guia-profesor.md) — **cómo usar el panel de administración** (para el profe).
- [`docs/especificacion.md`](./docs/especificacion.md) — spec técnico y modelo de datos.
- [`docs/decisiones.md`](./docs/decisiones.md) — registro de decisiones.
- [`docs/preguntas-abiertas.md`](./docs/preguntas-abiertas.md) — estado del relevamiento.
- [`docs/mockup.html`](./docs/mockup.html) — mockup visual inicial.

## Posibles mejoras a futuro

Instancia final / playoffs · tabla de goleadores · orden manual de jugadores dentro del equipo.
