# CLAUDE.md — Torneo Interno 2026

> Documento de contexto clave para cualquier agente que trabaje en este proyecto.
> Mantener actualizado a medida que se toman decisiones. **Última actualización: 2026-08-03.**

## Qué es este proyecto

Página web para mostrar la información de un **torneo interno de la facultad** (UTN Santa Fe).
El contenido lo carga el **profesor** (no el desarrollador), por lo que la prioridad es una
**interfaz de administración simple** para gestionar zonas, equipos, logos y estadísticas.

La página tiene dos audiencias:
- **Público (solo lectura):** alumnos/interesados que ven las tablas de posiciones.
- **Admin (profesor):** carga y edita toda la información.

## Requisitos confirmados por el usuario

- Título visible: **"Torneo Interno 2026"**.
- Subtítulo / institución: **UTN Santa Fe**.
- **2 zonas**, **7 equipos por zona** (14 equipos en total) — ver preguntas abiertas sobre si esto es fijo o dinámico.
- Por cada equipo se muestra: **nombre, logo, puntos, partidos jugados (PJ), ganados (PG), empatados (PE), perdidos (PP), goles a favor (GF), goles en contra (GC)**, y afines (diferencia de gol, etc.).
- **El profesor** agrega/edita todo mediante una interfaz fácil: crear zonas, agregar equipos a las zonas, subir logos, cargar estadísticas.
- **Hosting:** Vercel.
- **Base de datos:** sí (proveedor por definir; ver preguntas abiertas).

## Arquitectura (CONFIRMADA)

Ver `docs/decisiones.md` (registro completo) y `docs/especificacion.md` (spec técnico + modelo de datos).

- **Framework:** Next.js (App Router) + TypeScript, en Vercel.
- **Base de datos:** Vercel Postgres.
- **Storage de imágenes:** Vercel Blob (logos de equipos y del torneo).
- **Procesamiento de logos:** en el server al subir (unificar tamaño/formato a PNG cuadrado + quitar fondos planos por heurística; sin IA por ahora).
- **Acceso admin:** contraseña única simple (env var) que protege `/admin`.

### Puntos clave del producto
- **Todo es editable desde el admin**, incluido nombre y logo del torneo.
- Tabla de posiciones **calculada automáticamente** desde los partidos cargados.
- Estructura **configurable** (zonas y cantidad de equipos dinámicas; caso inicial 2×7).
- **Playoffs sí o sí:** cada zona define cuántos clasifican, clasificados en **dorado semi-opaco**, y cruces editables por posición+zona (ej. 1°A vs 4°B).
- Incluye **fixture por fechas** y **próximos partidos / resultados**.

## Estado actual

- 🟢 **Relevamiento cerrado.** Requisitos y arquitectura definidos.
- 🟢 **Scaffold hecho.** App Next.js + TS creada; vista pública (posiciones/fixture/playoffs) con datos de ejemplo. `npm run build` OK.
- 🔗 **Repo:** https://github.com/santifumis710/torneo-interno-2026
- ⏭️ **Próximo:** conectar Vercel Postgres + Blob y construir el panel de administración (`/admin`).

## Reglas de trabajo para agentes

1. **No construir la app** hasta cerrar las preguntas abiertas y tener el OK del usuario.
2. Toda decisión de diseño/arquitectura se registra en `docs/decisiones.md`.
3. El usuario habla español; responder en español.
4. Prioridad #1 del producto: que **el profesor** pueda cargar datos sin fricción.
