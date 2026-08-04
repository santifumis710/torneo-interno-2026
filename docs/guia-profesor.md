# Guía del profesor — cómo cargar el torneo

Esta guía explica, en criollo, cómo usar el panel de administración para cargar y
mantener toda la información del torneo. No hace falta saber programar.

## Entrar al panel

1. Andá a **https://utn-torneo-interno-2026.vercel.app/admin**
2. Ingresá la **contraseña** del administrador.
3. Ya estás adentro. Cada cambio se guarda al tocar **Guardar** / **Agregar** y se ve al instante en la web.

> Para salir, usá el botón **Salir** arriba a la derecha.

## 1. Datos del torneo

En la tarjeta **Torneo**:
- Cambiá el **nombre** y el **subtítulo**.
- Ajustá los **puntos por victoria y empate** (por defecto 3 y 1).
- Subí el **logo del torneo** (por ejemplo el escudo de la facultad). Este se respeta
  tal cual lo subís (no se le quita el fondo); si lo querés sin fondo, subí un PNG transparente.

## 2. Zonas

En **Zonas y equipos**:
- Podés **renombrar** las zonas (poné el nombre real y tocá **Guardar**).
- **Clasifican:** cuántos equipos de esa zona pasan a playoffs (se pintan de dorado en la tabla).
- **Agregar zona** (abajo) o **Borrar zona**. Ojo: borrar una zona borra también sus equipos y partidos.

## 3. Equipos

Dentro de cada zona:
- Escribí el nombre y tocá **Agregar** para sumar un equipo.
- Podés **cambiar el nombre**, **moverlo de zona** (con el desplegable) o **Borrarlo**.
- **Subir logo:** elegí una imagen del equipo. Se ajusta sola a un cuadrado y, si tiene
  fondo liso (blanco o color sólido), se lo saca. Si el logo tiene fondo complejo, conviene
  subir un PNG que ya tenga fondo transparente.

## 4. Jugadores

Dentro de cada equipo, en **Jugadores**:
- Poné el **número** (opcional) y el **nombre**, y tocá **Agregar**.
- Cada jugador se puede editar o borrar (la **✕**).
- **Foto:** en cada jugador podés **Subir foto** (se recorta sola a un cuadrado) y **Quitar**la.
- Se ven en la web, en la pestaña **Equipos**, con su foto (o iniciales si no tiene).

## 5. Partidos (¡acá se llena la tabla!)

En la tarjeta **Partidos**, por cada zona:
- **Agregar partido:** elegí equipo local y visitante. Opcional: el **número de fecha/jornada**
  y la **fecha y hora** del partido.
- Para cargar el resultado, escribí los **goles** de cada lado y tocá **Guardar**.
- Con los dos goles cargados, el partido cuenta como **jugado** y la **tabla de posiciones
  y el fixture se actualizan solos**. Si dejás los goles vacíos, queda como pendiente ("VS").
- El **fixture** se ordena por fecha y hora; los partidos sin fecha van al final.

## 6. Playoffs

En la tarjeta **Playoffs**, separada en **Cuartos / Semifinales / Final**:
- **Agregar cruce:** escribí las referencias (ej. **1°A** vs **4°B**) y tocá **Agregar cruce**.
- Después, en cada cruce podés **asignar el equipo** real (desplegable) y **cargar el resultado**.
- El **cuadro** se ve en la web, en la pestaña **Playoffs**.

## 7. "Mi equipo" (para los que miran la web)

No hay nada que cargar acá: es una pestaña de la web pública. Cualquier persona puede
**elegir su equipo** y ver sus **próximos partidos**, su **posición** y sus **estadísticas**.
Se alimenta solo de lo que vos cargás (equipos, partidos y fechas).

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
