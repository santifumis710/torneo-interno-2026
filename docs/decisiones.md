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
- **2026-08-03** — Base de datos vía **Neon** (Marketplace de Vercel; Vercel discontinuó su Postgres propio). Acceso con **`@neondatabase/serverless` y SQL crudo parametrizado** (sin ORM) — proyecto chico, más transparente y fácil de depurar. Esquema en `db/schema.sql`, cliente en `lib/db.ts`.
- **2026-08-03** — Contraseña del admin en la env var **`ADMIN_PASSWORD`** (secreto de servidor).

- **2026-08-04** — **Fecha y hora en partidos** (`scheduled_at TIMESTAMPTZ`, ya existía en el schema): se carga con un `datetime-local` en el admin y el **fixture se ordena por fecha/hora** (partidos sin fecha al final). La hora se interpreta y muestra como **hora local de Argentina (UTC-3, sin DST)** — el offset se fija explícito (`-03:00`) al guardar y con `Intl` + `timeZone: America/Argentina/Buenos_Aires` al mostrar, para evitar dependencia del huso del servidor y mismatch de hidratación. Convive con el campo `matchday` (número de jornada) preexistente.
- **2026-08-04** — **Foto de cada jugador** (`players.photo_url`). Se sube a Vercel Blob pero **NO pasa por el quita-fondo de logos** (arruinaría una foto): `normalizePhoto` hace recorte cuadrado *cover* centrado (con `position: attention`) y devuelve **JPEG** liviano. Se muestra como avatar en el roster (iniciales de fallback).
- **2026-08-04** — **Quitafondo solo en escudos de equipo.** El **logo del torneo** y las **fotos de jugadores** NO pasan por el flood-fill (`normalizeLogo(input, false)` para el torneo, `normalizePhoto` para jugadores): se respeta la imagen tal cual la sube el profe. Además, en la vista pública el escudo de equipo dejó de tener el **círculo gris** (`--surface-2`) de fondo (`.logo-img` → `background: transparent`), para que un escudo con fondo quitado quede limpio sobre las filas doradas de clasificación.
- **2026-08-04** — **Limpieza de blobs huérfanos.** Cada acción que reemplaza, quita o borra una imagen ahora elimina el archivo del Vercel Blob con `del()` (`deleteBlobs`, best-effort). Cubre: reemplazar/quitar logo de equipo, logo del torneo y foto de jugador; y borrar jugador, equipo o zona (junta los blobs de escudos + fotos antes del borrado en cascada). Evita acumular archivos huérfanos en el storage. El almacenamiento a la escala del torneo (~127 imágenes, ~5 MB) está muy por debajo del free tier igual; esto es prolijidad, no necesidad de cupo.
- **2026-08-04** — **Pestaña "Mi equipo"** en la vista pública: el usuario elige un equipo (persistido en `localStorage`) y ve su **posición en la zona**, fila de **estadísticas** (Pts/PJ/G/E/P/GF/GC/DIF), **próximos partidos** y **últimos resultados**. Todo se **calcula en el cliente** con los datos que ya bajan (reusa `computeStandings`): **cero cambios de base** y sin riesgo para lo cargado por el profe.

- **2026-08-04** — **Quitafondo de escudos más robusto.** `removeFlatBackground` dejaba el fondo blanco cuando el escudo tocaba una esquina (la heurística de "4 esquinas deben coincidir" fallaba y no tocaba nada). Ahora muestrea **todo el borde**, saca el color de fondo dominante y solo lo quita si el borde es realmente plano (≥70%, `BORDER_FLAT_RATIO`); si el fondo es variado/complejo se deja la imagen intacta (igual que antes). Se confirmó la política: **fotos de jugadores se guardan tal cual** (sin quitafondo) y **solo los escudos de equipo pasan por el quitafondo**. Para que un escudo ya cargado tome el arreglo hay que **volver a subirlo** desde el admin.
- **2026-08-04** — **Arreglos de layout público.** (a) `.zones` con `align-items: start` para que las cards de zona tomen su alto natural y no queden estiradas/asimétricas (una zona más corta ya no muestra "padding" sobrante abajo). (b) Con la 5ta pestaña ("Mi equipo") las tabs en mobile desbordaban la píldora; se agregó `min-width: 0` + fuente/padding más chicos para que las cinco entren dentro del recuadro.

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
