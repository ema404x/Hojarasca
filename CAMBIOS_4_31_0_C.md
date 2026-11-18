# 4.31.0 · C — la naturaleza que se toca

Pedido: «Hojarasca súper detallista»: que afuera casi todo lo que ves reaccione. Esta parte es la naturaleza y el andar.
Todo con la **E** de siempre (una sola entrada nueva en la tabla, `naturaleza`, al final: no le saca la E a nadie) y sin teclas nuevas.
Sólo en el Relax y la Historia (en el Desafío no se crea nada).

## Inventario (lo que ya había y lo que se podía tocar)
Ya existía y no se tocó: las pisadas por suelo (tierra, pasto, hojas, hojarasca, nieve, escarcha, piedra, madera, agua), el chapuzón
(sonido), las ondas del agua alrededor tuyo cuando estás metido (shader del agua), el pasto que se aparta a tu paso, el zorzal que vuela
si te acercás, la lagartija que huye, el árbol que se estremece con el hacha (`veg.sacudir`), el aliento con frío (sólo Ultra) y la manga
mojada (sólo Ultra). Faltaba todo lo demás de la lista del brief.

## Lo nuevo (14 detalles, todos vistos en el juego salvo donde se dice)
| # | Detalle | Cómo se usa | Dónde |
|---|---|---|---|
| 1 | **Sacudir un arbusto** (chilco, notro, maqui, chaura, calafate, neneo, michay, rosa mosqueta, zarzamora, helechos, nalca, colihue): la mata se mece, caen hojas, a veces salen volando 1–3 pajaritos con su canto; en invierno cae la nieve | E mirándolo (ya anotado: si no, la E anota primero) · «Sacudir el chilco» | `naturaleza-juego.js` `hacer('arbusto')`, `vegetacion.js` `sacudirMata` |
| 2 | **Frutos en temporada**: el calafate, fuera del invierno, suelta un puñado (una vez por mata por día) que va a la mochila si entra | al sacudirlo | `loQueCae` |
| 3 | **Sacudir un árbol chico** (ñire, maitén y arrayán de escala ≤ 0,95: una lenga o un coihue, aun jóvenes, tienen el tronco grueso): el árbol se estremece, llueven hojas (más en otoño), pájaros; en invierno, la nieve de la copa | E al pie · «Sacudir el ñire» | `hacer('arbol')` (usa `veg.sacudir` de siempre) |
| 4 | **Arrancar pasto**: agachado mirando el prado, se arranca un manojo (el pasto desaparece ahí y vuelve a crecer en 6 horas de juego); el coirón se sacude y suelta briznas | agachado (C) y E · «Arrancar un poco de pasto» / «Arrancar un manojo de coirón» | `hacer('pasto')` con `pelarPastoTemporal` |
| 5 | **Arrancar un amancay** ya anotado: pétalos, la flor sale del valle (queda en `tomados`, como lo juntado) | E · «Arrancar un amancay» | `objetos.js` `arrancar` |
| 6 | **Leña suelta**: atados de ramas secas en el piso del bosque cerrado (una de cada tres celdas de 16 m, lejos de caminos y de la aldea); dan dos ramitas (tope 12) y vuelven al otro día | E · «Juntar la leña suelta» | `pilaDeLena`, `juntarLena` |
| 7 | **Tocar el agua** del lago o el arroyo: tres ondas que se abren, unas gotas y el plof; en invierno, «El agua está helada» | agachado mirando el agua en la orilla, o parado en el agua baja mirando abajo | `hacer('tocarAgua')` |
| 8 | **Sapito**: tirar una piedra al agua; rebota de 0 a 9 veces (agachado, más; corriendo, menos), cada pique con su onda, su salpicadura y su sonido, cada salto más corto; nota con el récord | en la orilla mirando al agua (con 7 m de agua libre adelante) · «Tirar una piedra al agua (sapito)» | `saltosSapito`, `piquesSapito`, `moverPiedraEnVuelo` |
| 9 | **Piedritas y piñas** que se patean al andar: en senderos, la vía y las orillas, piedritas; en el bosque, piñas de ciprés. Ruedan, rebotan, suenan, y si caen al agua hacen plof y onda | caminar o correr por encima | `piedritaDe`, `patea`, `moverPiedras` |
| 10 | **El agua salpica** al caminar o correr por el arroyo o la orilla (más corriendo) y al zambullirse (también sin Ultra: partículas baratas) | andar | `alPaso`, `alChapuzon` |
| 11 | **Pisadas de ripio** en las calles de la aldea y sobre el balasto de la vía (sonido sintetizado nuevo, como los demás suelos) | andar | `superficiePaso`, `SUELOS.ripio` |
| 12 | **Ramitas que crujen** bajo el pie en el bosque cerrado (de vez en cuando) | andar | `crujeRama` (sonido; no se ve) |
| 13 | **Mojarse y gotear**: nadando o metido en el agua te empapás (y con lluvia sin techo, de a poco); al salir, «Quedaste empapado» y vas goteando (gotas que caen de la campera, se ven mirando abajo, y un goteo bajito) hasta secarte en unos 2½ minutos (junto al fuego, cuatro veces más rápido) | — | `mojarse`, `secarse` |
| 14 | **Las matas se mueven al pasar**: caminando o corriendo a través de un arbusto, se mece hacia el otro lado, suena el roce y a veces suelta hojas | andar | `rozarMatas` |
| 15 | **Ranas** en las orillas (fuera del invierno): saltan al agua con plof y onda si pasás cerca (agachado no las asustás) | acercarse | `moverRanas` |
| 16 | **Mariposas que se van**: la que tenés a menos de 2 m sube y se aleja más rápido | acercarse | `bichos.js` |

## Guardado (clave nueva saneada)
`progreso.naturaleza = { sapitoRecord, sapitos, lena: { dia, tomadas[] } }` (`sanearNaturaleza` en `guardado.js`): récord con tope 9, la
leña juntada hoy (ids `l<i>_<j>`, tope 64, al cambiar el día vuelve toda). Una partida vieja carga con todo vacío. El amancay arrancado
va a `tomados` (la clave de siempre). El pasto arrancado y el mojado no se guardan (vuelven solos).

## Rendimiento y reglas
- **0 programas nuevos**: todo con `materialVegetal({ flex: 2 })` en mallas instanciadas sin tinte por instancia, el mismo programa que
  las frutillas y los cantos del valle. 10 mallas (hojas, pétalos, gotas, nieve, pajaritos, piedritas, piñas, leña, ranas, ondas); en
  reposo `count` 0 y apagadas. Sin luces nuevas.
- La mata sacudida usa la copia de la mata (como el árbol con el hacha) y el bloque del sotobosque se rehace dos veces por sacudida
  (medido: ~0,1 ms cada vez); nada por cuadro.
- Medido en partida real (`humo-4-31-0-c.cjs`, «medir», caminando 4 s; notebook, sólo como referencia): `naturalezaJuego.actualizar`
  en la **plaza** 0,05 ms de promedio (p95 0,2) con **0 mallas** dibujando; en el **bosque** 0,08 ms (p95 0,2) con 2 mallas (piedritas/piñas
  y leña). El bloque del sotobosque al sacudir: 0,1 a 0,6 ms, dos veces por sacudida.
- Programas: 103 al empezar y 103 después de sacudir, tocar el agua, el sapito, mojarse, la flor y el árbol. Sube a 104 al entrar a la
  zona del arroyo y al ir a la plaza (pasa igual sin tocar nada de esto: es del lugar, no de estas mallas; las gotas ya se habían dibujado
  en el lago sin sumar ninguno).

## Pruebas
- `pruebas/verificar-4-31-0-c.mjs` (en `verify:pasos`): reglas, lo visual con three, el juego con un mundo de mentira, la tabla de la E,
  el guardado, los enganches y 31 mutaciones.
- `pruebas/humo-4-31-0-c.cjs`: partida real con capturas en `pruebas/salidas/humo-4-31-0-c/`.

## Visto en el juego y qué no
Partida real con capturas (`pruebas/salidas/humo-4-31-0-c/`): el aviso de cada E (chilco, arrayán, sapito, tocar el agua, leña, amancay,
pasto), las ondas del sapito y de tocar el agua, la leña antes y después (2 ramitas, la pila se va), el amancay que desaparece, las gotas
al salir del lago, la rana que salta, la piedrita que rueda 1,6 m, el ripio en la calle de la aldea y la vía, la mariposa que se va.
**No se ve bien en las capturas quietas**: las hojas que caen de la mata y del árbol (se comprobó por cuenta: 8 a 16 sueltas, y se ven
algunas, chicas) y la salpicadura del arroyo (52 gotas contadas; la cámara quedó a ras del agua). El crujido de ramitas y los sonidos no se oyen
en la prueba (Electron mudo). El roce al pasar entre matas se probó en Node, no en la partida.

## Pruebas viejas
Corridas las 331 que leen lo tocado (en paralelo de a 3): todas en verde salvo cuatro que fallaron sólo en paralelo y pasan solas
(`verificar-4-24-1-c` contó las copias de mutación de otras pruebas en `src/`; `4-26-5-c`, `4-28-0-c` y `4-29-0-c`: la carpeta temporal
de sus mutaciones, ENOENT) y `verificar-3-7-2-granja` (tiempo de carga, 1076 ms; sola pasa). Ninguna se ajustó.

## Quedó afuera (decidido)
- **El aliento con frío sin Ultra**: ya existe con Ultra (`ultra-aliento.js`); sin Ultra haría falta un material transparente propio
  (programa nuevo) o bolitas opacas que se ven mal. No se hizo.
- **Arrancar flores del prado** (las flores pintadas en el pasto): son parte del shader del pasto; sólo el amancay (que es un objeto) se arranca.
- **Bichos**: las lagartijas y los zorzales ya huían; se sumaron ranas y mariposas. No hay bandadas que se espanten de los árboles
  grandes (las aves lejanas son puntos en el cielo).
- El roce y las pisadas son síntesis bajita; los pájaros que se espantan usan el canto de siempre (`sonido.ave`).
