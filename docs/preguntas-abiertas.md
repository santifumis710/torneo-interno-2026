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

## Definidas en la construcción ✅
- ✅ Puntos por victoria/empate: **3 / 1 / 0** por defecto, **configurables** desde el admin.
- ✅ Criterios de desempate: **Pts → DIF → GF** (luego nombre).
- ✅ Borrar zona/equipo: **borra en cascada** lo que cuelga (equipos, jugadores, partidos).
- ✅ Se agregó **jugadores por equipo** (pestaña Equipos), a pedido del usuario.
- ✅ Store de Blob **público** (requisito para servir logos).

## Sin cerrar (no bloquean; a decisión del usuario)
- [ ] Dominio final (por ahora subdominio de Vercel `utn-torneo-interno-2026.vercel.app`).

> El proyecto está **terminado y desplegado** según el alcance acordado. Ver `README.md`.
