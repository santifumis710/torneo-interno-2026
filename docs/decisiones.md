# Registro de decisiones (ADR ligero)

Cada decisión importante se anota aquí con fecha y motivo. Formato: fecha — decisión — motivo.

## Confirmadas

- **2026-08-03** — El contenido lo carga el profesor vía panel de administración, no el desarrollador. — Es el requisito central que define la prioridad del producto.
- **2026-08-03** — Hosting en Vercel con base de datos. — Requisito del usuario.
- **2026-08-03** — La tabla de posiciones se **calcula automáticamente** a partir de los resultados de partidos que carga el profe (Equipo A x - y Equipo B). El profe NO escribe los acumulados a mano. — Menos errores y experiencia más sólida.
- **2026-08-03** — La estructura es **configurable**: el profe puede crear/borrar zonas y definir la cantidad de equipos. El "2 zonas × 7" es el caso inicial, no un límite. — Reusabilidad a futuro.
- **2026-08-03** — **Hay fase eliminatoria (playoffs) sí o sí.** Requisitos:
  - Cada zona tiene una config de **cuántos equipos clasifican**.
  - En la tabla, los equipos clasificados se pintan con un **color dorado semi-opaco**.
  - El profe puede **editar los cruces** manualmente (ej. 1°A vs 4°B), referenciando posición + zona.
  - Hay que mostrar el **cuadro/llave** eliminatorio.
- **2026-08-03** — Acceso admin mediante **contraseña única simple** (una sola clave compartida). — Suficiente para un profe; rápido de implementar.

- **2026-08-03** — Logos: el profe **sube el archivo** desde su compu (requiere storage de imágenes).
- **2026-08-03** — Identidad visual: **UTN, claro, limpio y tabla sencilla.** Los clasificados en dorado semi-opaco deben verse bien sobre fondo claro.
- **2026-08-03** — **Todo editable desde el admin**, incluido: nombre del torneo y logo del torneo (probablemente el logo de la facultad). El profe carga TODO desde la web.
- **2026-08-03** — Alcance inicial incluye, además de tablas y playoffs: **fixture con fechas/jornadas** y **próximos partidos / resultados**. (Goleadores queda fuera por ahora.)
- **2026-08-03** — El usuario tiene cuenta de **Vercel** y **GitHub**, sin nada creado aún para este proyecto.

- **2026-08-03** — **Stack confirmado: Next.js (App Router) + TypeScript**, desplegado en Vercel.
- **2026-08-03** — **Base de datos y storage: ecosistema Vercel** (Vercel Postgres + Vercel Blob para las imágenes), ya que el usuario tiene experiencia subiendo imágenes a Vercel.
- **2026-08-03** — Normalización de logos: **unificar tamaño/formato + quitar fondos planos** (heurística, sin IA). Fondos complejos quedan como estén / se pide PNG transparente.

## Pendientes de confirmar

- Dominio (subdominio Vercel vs propio) — se puede definir al final.
- Detalles finos del diseño (se afinan al construir con feedback visual).

## Nota de viabilidad: normalización de logos

- **Fácil y sin costo:** al subir un logo, procesarlo para dejarlo en tamaño/formato uniforme
  (ej. cuadrado, PNG, con padding, mismo alto). Esto se hace con una librería de imágenes en el server.
- **Quitar el fondo automáticamente:** NO es trivial. Requiere un servicio/modelo de IA
  (ej. API tipo remove.bg, o un modelo tipo `rembg`). Suma costo o dependencia externa y no siempre
  queda perfecto. Alternativa simple: pedir que suban PNG con fondo transparente, o quitar solo fondos
  planos (blanco/color sólido) de forma heurística.
