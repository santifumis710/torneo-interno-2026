# Torneo Interno 2026 — UTN Santa Fe

Página web del torneo interno de la UTN Facultad Regional Santa Fe. Muestra las posiciones
por zona (con clasificados a playoffs resaltados), el fixture y el cuadro de playoffs. Toda
la información la carga el profesor desde un panel de administración.

## Stack

- **Next.js** (App Router) + **TypeScript**
- **Vercel** (hosting) · **Vercel Postgres** (base de datos) · **Vercel Blob** (logos)

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

## Documentación del proyecto

- [`CLAUDE.md`](./CLAUDE.md) — contexto y decisiones clave (leer primero).
- [`docs/especificacion.md`](./docs/especificacion.md) — spec técnico y modelo de datos.
- [`docs/decisiones.md`](./docs/decisiones.md) — registro de decisiones.
- [`docs/preguntas-abiertas.md`](./docs/preguntas-abiertas.md) — pendientes.
- [`docs/mockup.html`](./docs/mockup.html) — mockup visual de la vista pública.

> Estado: scaffold inicial con la vista pública usando datos de ejemplo.
> Próximo: base de datos + panel de administración.
