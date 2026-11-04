# 4.25.1 · parte C — Cosas pegadas al cuerpo en las cinemáticas

Rama `v4251-c` (sobre `main` = 4.25.0). Del brief `BRIEF_4_25_1.md` (parte C). Capturas en `C:\Users\Andres\AppData\Local\Temp\hx\c4251\` (`base\` = la 4.25.0, `nuevo\` y `r4\` = esta rama; `cmp-base.png` y `cmp-nuevo.png` lado a lado).

## 1. Cómo se miró
Se armó una herramienta nueva (`herramientas/generar-tomas-4-25-1.cjs` → `herramientas/auditoria-visual-4-25-1.json`, para la herramienta de capturas de la 4.20.0): por personaje, **cada pose de escena** (las 26 de `POSES_ESCENA`) en un claro cerca del refugio, con el mismo camino que usan las escenas de verdad (`__escenas.mundo.capturar` y `posar`, y `despuesDeGente` en el bucle). Se corrió con Ramón (el único que lleva el mate en las escenas) y con Graciela (la planilla), antes (4.25.0) y después. De las escenas reales (126) sólo se posan Ramón, Elsa, Josefina, Ercilia, Fermín, Tito y Anselmo: Ramón es el que lleva algo en la mano.

## 2. Reproducido
- **Mate pegado al brazo levantado (Ramón, «señalar» y «saludar»; también «encoger»)**: las poses propias de las escenas (`POSES_PROPIAS`, `src/escenas-mundo.js`) siempre movían el brazo derecho, que en quien toma mate es el del mate (sin codo, con la calabaza fundida en la mano). Con «señalar» la calabaza queda pegada a la cara, en la punta del brazo en alto; con «saludar», el brazo se levanta de costado con la calabaza dada vuelta junto a la cabeza (`cmp-base.png`). Además `gente.js` contra-gira la muñeca para que la calabaza quede derecha **antes** de las poses de escena, así que con «encoger» la muñeca quedaba con el giro viejo y la calabaza torcida. Ramón tiene dos «saludar», un «señalar» no (lo hacen Elsa y Josefina), pero cualquier escena futura con él lo reproduce; en la Historia ya se veía el saludo de Ramón.
- **Planilla de Graciela** (con brazos cruzados y saludando): en las corridas en que se la pudo posar (ver §5) la tabla asoma por detrás del hombro con los brazos cruzados. Ninguna escena actual la posa, así que **no se vio en una escena real**; se arregló de forma defensiva (§3b).

## 3. Arreglado (`src/escenas-mundo.js`, sin tocar dibujo)
a) **`brazoLibre(g)`**: quien lleva el mate hace «saludar» y «señalar» con el otro brazo (el izquierdo, con el signo de «hacia afuera» invertido y su codo), como ya hacían las poses de quietud con `uno`. El brazo del mate no se toca. Quien no lleva nada, igual que antes. **También con la planilla o la caña** (van en la mano derecha): Graciela saludando levantaba el brazo con la tabla pegada; ahora saluda con la izquierda y la tabla queda en su mano (captura `hxc42515q-graciela-saludo.png`). **`rectificarMate(g)`**: «encoger» (que mueve los dos brazos) rehace la contra-rotación de la muñeca. Capturas después: `cmp-nuevo.png` (saluda con la izquierda, la calabaza queda derecha en la derecha).
b) **Objetos en la mano (`planilla`, `caña`)**: durante las poses que ocupan las manos (cruzados, cintura, atrás, delantal, juntas, barba, gorro, aplaudir, palear, hachar, martillar, serruchar, tocar, bailar, contar, brindar) se guardan, y se devuelven al terminar la pose, al cambiar de pose o al soltar al personaje (aunque la escena se corte o se salte). El mate no entra (va fundido en la mano y ya lo cuida el juego).
Sin shaders, sin mallas ni llamadas de dibujo nuevas, sin capas de pantalla completa: sólo rotaciones de huesos y `visible` de dos objetos. La plaza no cambia (no se tocó nada que se dibuje en ella).

## 4. Pruebas
- **Nueva `pruebas/verificar-4-25-1-c.mjs`** (suma a `verify:pasos`; 157 comprobaciones, **11 mutaciones**, todas hacen fallar su comprobación): personajes de mentira (sin three) para las poses propias (el brazo del mate queda quieto y el otro se levanta hacia afuera; sin mate, como antes; «encoger» rehace la muñeca) y el módulo real con un contexto mínimo (`crearEscenasMundo`) para guardar y devolver planilla y caña (al cambiar de pose, al soltar, y que «asentir» no las toque). Mutaciones: saludar con el brazo del mate, sin signo del lado (dos), sin rectificar la muñeca, sin invertir, brazo libre siempre el derecho, brazo libre equivocado, sin guardar la planilla, sin devolverla al soltar, sin devolverla al limpiar la pose. Se cargan como copias en memoria (`data:`), una por import.
- Previas que leen `escenas-mundo.js`: `4-14-0-escenas` (una comprobación «nada religioso» saltó con un nombre mío, `enderezar…` contiene «rezar»; renombrado), `4-17-0-pulido-c`, `4-17-1-escenas-noche`, `4-18-1-pulido`, `4-18-4-c`, `4-19-0-c`, `4-24-1-b`: en verde, sin ajustar ninguna. No se corrió `npm run verify` completo.

## 5. No se pudo reproducir / no se hizo
- Con la herramienta, en tandas largas, la Graciela posada no salió (ella existe sólo durante el capítulo del ramal: el juego la quita y la rearma entre encuadres y la pose caía en otra copia); sólo se la vio posada en corridas de un encuadre.
- **Mate de Ramón con las poses del juego** (palear, hachar, tocar…): con las manos ocupadas el juego lo guarda (`MANOS_OCUPADAS`) sólo en algunas; en las capturas no se vio nada pegado, pero no se miró de perfil.
- Elsa (guarda), Josefina, Ercilia, Fermín, Tito y Anselmo no llevan nada en la mano en las escenas (el arco y el martillo son del Desafío): sin objeto no hay qué pegar.
- Manos nuevas de la 4.25.0 con «cruzados», «cintura», «atrás», «juntas»: se miraron en Ramón (cruzados y juntas: bien; el mate lo agarra una mano y la otra hace la pose). Ningún dedo asoma por el poncho. **Con otros personajes (ropa sin poncho) no se miró de cerca.**
- Huesos torcidos al cortar una animación: las poses propias se vuelven a poner cada cuadro desde `gente.js`; no se reprodujo ningún hueso que quedara torcido al terminar.

## 6. No visto a ojo
Las escenas reales de la Historia con Ramón saludando (se miró con la misma ruta de código y la misma luz, no dentro de la escena con cámara dirigida); lo de Graciela dentro de una escena (ver arriba); calidades Media y Baja, lluvia, invierno con ropa abrigada.

## Claves de guardado
Ninguna.

## Herramientas (no entran al gate)
`herramientas/generar-tomas-4-25-1.cjs` (uso: `node herramientas/generar-tomas-4-25-1.cjs ramon,guarda,graciela`) y `herramientas/auditoria-visual-4-25-1.json`.
