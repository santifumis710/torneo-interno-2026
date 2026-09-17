# Guía del profesor — cómo cargar el torneo

Esta guía explica, en criollo, cómo usar el panel de administración para cargar y
mantener toda la información del torneo. No hace falta saber programar.

## Entrar al panel

1. Andá a **https://utn-torneo-interno-2026.vercel.app/admin**
2. Ingresá la **contraseña** del administrador.
3. Ya estás adentro. Cada cambio se guarda al tocar **Guardar** / **Agregar** y se ve al instante en la web.

> Para salir, usá el botón **Salir** arriba a la derecha.

## Cómo está organizado el panel

El panel está dividido en **secciones que se abren y se cierran** (tocá el título).
Cuando entrás, la única abierta es **Partidos y resultados**, que es lo que vas a usar
todas las semanas. Las demás siguen ahí, pero no estorban:

1. **Partidos y resultados** ← lo de siempre
2. **Zonas y fases**
3. **Equipos y jugadores**
4. **Historial de campeones**
5. **Torneo** (nombre, logo, puntaje)

## 1. Partidos y resultados (¡acá se llena la tabla!)

Arriba de todo hay un selector de **fase** (**Fase 1** / **Fase 2**). Viene puesto en la
**más nueva**, que es donde van los partidos nuevos; tocá la otra solo si necesitás corregir
algo viejo. Después, por cada zona de esa fase:

- **Agregar partido:** elegí equipo local y visitante. Opcional: el **número de fecha/jornada**
  y la **fecha y hora** del partido. El formulario está arriba de la lista.
- Para cargar el resultado, escribí los **goles** de cada lado y tocá **Guardar**.
- Con los dos goles cargados, el partido cuenta como **jugado** y la **tabla de posiciones
  y el fixture se actualizan solos**. Si dejás los goles vacíos, queda como pendiente ("VS").
- El **fixture** se ordena por fecha y hora; los partidos sin fecha van al final.

> Cada fase tiene sus propias fechas: hay una **Fecha 1** en Fase 1 y otra en Fase 2, y no se mezclan.

## 2. Zonas y fases

En **Zonas y fases** las zonas aparecen agrupadas por fase. En cada zona podés:

- **Renombrarla** y fijar **Clasifican**: cuántos equipos de esa zona se pintan de **dorado**
  en la tabla. Si todavía no está definido, dejá **0** y no se pinta ninguno.
- **Elegir qué equipos juegan en esa zona**:
  - **Sumar un equipo que ya existe** → así se arman las zonas de una fase nueva, con los
    mismos equipos de siempre.
  - **Quitar de la zona** → lo saca de esa zona **sin borrar** el equipo ni sus jugadores.
  - **Crear un equipo nuevo en esta zona** → para un equipo que todavía no existe.
- **Ordenar los equipos con las flechas ↑ ↓.** Ese orden decide **quién aparece primero en
  la tabla cuando dos equipos están empatados en todo** (mismos puntos, misma diferencia de
  gol y mismos goles a favor) — por ejemplo al arrancar una fase, con todos en cero.
- **Borrar zona** (se van también sus partidos). Un equipo que además juega en otra fase
  **no se borra**; solo se borran los que no jugaban en ninguna otra zona.

Abajo de todo podés **agregar una zona** eligiendo a qué **fase** pertenece (incluida una
fase nueva, si algún día hace falta una Fase 3).

## 3. Equipos y jugadores

Cada equipo es una fila que se abre al tocarla. Al lado del nombre te dice cuántos jugadores
tiene y en qué zonas juega. Adentro:

- **Cambiar el nombre** del equipo o **Borrarlo**.
- **Subir logo:** elegí una imagen del equipo. Se ajusta sola a un cuadrado y, si tiene
  fondo liso (blanco o color sólido), se lo saca. Si el logo tiene fondo complejo, conviene
  subir un PNG que ya tenga fondo transparente.
- **Jugadores:** poné el **número** (opcional) y el **nombre**, y tocá **Agregar**. Cada uno
  se puede editar o borrar (la **✕**), y podés **Subir foto** (se recorta sola a un cuadrado).
  Se ven en la web, en la pestaña **Equipos**.

> En qué zona juega un equipo **no** se decide acá, sino en **Zonas y fases**.

## 4. Historial de campeones

En la tarjeta **Historial de campeones** cargás los ganadores de las ediciones anteriores:
- Cada fila tiene el **año** y el **campeón**. Tocá **Guardar** para editar una, o **✕** para borrarla.
- Abajo de todo, escribí año y campeón y tocá **Agregar** para sumar una nueva.
- En la web se ven en la pestaña **Historial**, en el mismo orden en que están acá.

El año es texto libre: si hace falta podés escribir algo como *"2020 (no se jugó)"*.

## 5. Datos del torneo

En la sección **Torneo** (la última):
- Cambiá el **nombre** y el **subtítulo**.
- Ajustá los **puntos por victoria y empate** (por defecto 3 y 1).
- Subí el **logo del torneo** (por ejemplo el escudo de la facultad). Este se respeta
  tal cual lo subís (no se le quita el fondo); si lo querés sin fondo, subí un PNG transparente.

## 6. Cómo se ve la web pública

Las pestañas son **Fase 2 · Fase 1 · Equipos · Fixture · Historial**, y al entrar se abre
directo la **fase más nueva**. Cada fase muestra las tablas de sus zonas, calculadas solas
con los partidos de esa fase (la Fase 2 arranca de cero, no arrastra puntos de la Fase 1).

### Ver los partidos de un equipo

En la pestaña **Fixture** hay que **elegir primero la fase** (porque los números de fecha se
repiten) y después se puede agrupar **por zona, por fecha o por día/hora**.

Además hay un desplegable de **equipos**: cualquiera puede elegir uno y ver **solo los partidos
de ese equipo**, ordenados por número de fecha. En ese caso no hace falta elegir fase: se
muestran **todas**, una debajo de la otra. No tenés que cargar nada extra: sale de los partidos
que ya cargaste.

### Las fechas libres salen solas

Si una zona tiene un número impar de equipos, cada fecha deja uno **libre**. No hay que
cargarlo: la web se da cuenta sola. La regla es simple —

> Cuando la fecha tiene **todos sus partidos cargados** (con 7 equipos, los 3 partidos) y
> hay un equipo que no aparece en ninguno, ese equipo figura **Libre** en esa fecha.

Mientras te falte cargar algún partido de la fecha, **no dice nada**, justamente para no
marcar como "libre" a un equipo cuyo partido todavía no cargaste. Se ve en el filtro por
equipo (como una fila más) y al pie de cada fecha cuando agrupás **Por fecha**.

## Preguntas frecuentes

- **Cargué algo y no se ve.** Refrescá la página pública; los cambios son inmediatos.
- **Me equivoqué en un resultado.** Editá los goles y volvé a **Guardar**.
- **Quiero sacar un resultado y dejar el partido pendiente.** Borrá los goles y guardá.
- **El logo no queda bien (fondo raro).** Subí un PNG con fondo transparente.
- **Cambié un logo/foto y sigo viendo el anterior.** Refrescá la página; a veces el navegador
  guarda la imagen vieja un rato.
- **La foto del jugador se ve cortada.** Se recorta a un cuadrado centrado; usá una foto donde
  la cara quede más o menos en el medio.
- **Olvidé la contraseña.** Se cambia en la configuración del proyecto en Vercel
  (variable `ADMIN_PASSWORD`).
