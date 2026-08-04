# Preguntas abiertas

> Estado al 2026-08-03: el relevamiento principal está **cerrado**. Ver decisiones en
> `docs/decisiones.md` y el spec en `docs/especificacion.md`.

## Resueltas ✅
- ✅ Tabla calculada automáticamente desde resultados cargados.
- ✅ Estructura configurable (zonas/equipos dinámicos).
- ✅ Playoffs con clasificados en dorado y cruces editables por posición+zona.
- ✅ Acceso admin por contraseña única simple.
- ✅ Logos: subida de archivo + normalización (unificar + quitar fondos planos).
- ✅ Identidad UTN, clara y limpia; todo editable desde el admin.
- ✅ Alcance: tablas + playoffs + fixture con fechas + próximos/resultados.
- ✅ Stack Next.js + TS, Vercel Postgres + Vercel Blob.

## A afinar durante la construcción
- [ ] Puntos por victoria/empate (asumo 3/1/0) y criterios de desempate (asumo Pts → DIF → GF).
- [ ] Comportamiento al borrar un equipo con partidos cargados.
- [ ] Detalles visuales finos (afinar con feedback en pantalla).
- [ ] Dominio final (subdominio Vercel vs propio).
