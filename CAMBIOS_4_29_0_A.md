# 4.29.0 (A) — Ultra en los detalles: el agua y el cielo

Zona A de la 4.29.0 (brief `BRIEF_4_29_0.md`). Todo corre **sólo** con Ultra prendido (`esUltra` + calidad Alta + mundo armado en Alta),
se arma al prender Ultra y se desarma entero al apagarlo o al bajar la calidad (también la autocalidad), en vivo. Con Ultra apagado no existe
ningún material, uniforme ni programa de acá: el agua, el cielo y la composición de Alta no se tocan (otros materiales, otros programas).

## Qué se hizo
1. **El lago** (`src/ultra-agua.js`, composición de Ultra en `ultra-luz-mundo.js`): reflejo **en pantalla**. Cada píxel donde el rayo de la vista
   cruza el espejo del lago antes que el fondo es agua; ahí se busca el rayo reflejado sobre la profundidad de la escena (14 pasos que se alargan,
   con afinado y ruido entrelazado) y, si no pega en nada cerca, se toma lo lejano que se ve en esa dirección (los cerros, la cordillera, el cielo
   con sus nubes de verdad). Ondulado por el viento (`olasVientoU`, más con viento) y por los anillos. Sólo se calcula con la cámara a menos de
   260 m del lago (`lagoCerca`): en la plaza no cuesta nada.
   **Anillos:** los de la lluvia (tres capas de gotas chicas, más cuanto más llueve, además de las grandes de siempre) y **los de tus pasos**:
   caminando por la orilla o por el agua baja (piso entre −1,3 m y +0,12 m del nivel del lago) cada medio metro se abre un anillo que se ensancha
   y se apaga en 3 s (`crearPisadasAgua`, los últimos 6). Parado, en lo hondo o en tierra seca, no. Los mismos anillos inclinan el agua (el cielo
   que espeja se rompe en círculos) y el reflejo.
2. **El río:** el agua de Ultra (el material de siempre con agregados, otro programa) suma donde corre rápido madejas de espuma que bajan con
   la corriente, espuma espesa donde el agua rompe (las olas paradas sobre las piedras del fondo y las bajadas), burbujas sueltas y chispas del
   sol que titilan en el agua batida.
3. **Nubes** (`src/ultra-cielo.js`): **con volumen** en el cielo de Ultra (dos pasos más hacia el sol: la luz se apaga con lo que atraviesa; la
   panza espesa gris azulada, el borde que da al sol encendido, plateado a contraluz, contorno en coliflor) y **sus sombras en el valle**, en la
   pasada de la niebla (que ya tiene la posición de cada píxel: suelo, casas, árboles, todo, sin mallas nuevas): el rayo hacia el sol corta el
   plano de nubes a 1600 m, manchas de unos 500 m en grupos, más con el cielo más cargado, que el viento arrastra a 4–10 m/s. Lo que ya está a la
   sombra del sol no se oscurece dos veces; de noche, con el cielo cubierto, lloviendo o con el sol bajo, se borran; lejos (los cerros) se
   aclaran con el aire.
4. **Noche:** la **Vía Láctea** (banda con nubes de estrellas, polvo fino y franjas oscuras, más ancha y tibia hacia el centro; ruido 3D sobre
   la dirección: sin costuras ni rayas) y estrellas finitas y brillantes que **titilan** cada una a su ritmo (más cerca del horizonte, con un
   dejo de color). **Halo de la luna** con humedad (`humedadLuna`: la niebla de los valles, las nubes sueltas, la lluvia): la corona suave y el
   anillo de 22 grados, rojizo por dentro.
5. **Relámpagos:** el relámpago que ya existía (`clima.actualizarTormenta`, con su trueno) llega a Ultra (`ultraLuz.relampago(fogonazo)` en
   main.js): el cielo se enciende un instante, más del lado donde cae, se ve **el rayo quebrado** bajando de las nubes (otro rumbo en cada
   destello) y el aire húmedo se ilumina. El trueno es el de siempre.

Programas nuevos con Ultra: el agua de Ultra (uno, compilado al prender). El cielo, la niebla y la composición de Ultra ya eran propios de
Ultra (sólo cambia su texto). Con Ultra apagado: **cero** programas nuevos.

## Dónde mirarlo (capturas Ultra / Alta, `C:\Users\Andres\AppData\Local\Temp\hx\a4290\`; `-ultra.jpg` / `-alta.jpg` del mismo cuadro, `-PAR.jpg` lado a lado)
- **Lago a la tarde** `f1\a2-lago-orilla-tarde`: la orilla de enfrente, sus árboles y el cielo se espejan en el agua, ondulados.
- **Tus pasos** `f1p\a3-lago-pasos-par.jpg` (Ultra caminando por el agua baja a la izquierda; Alta a la derecha, otra corrida igual): anillos
  que se abren desde las pisadas (en `r1\a3-lago-pasos.png` se ven más, en el agua más honda); medido: 4 anillos vivos al capturar.
- **Lluvia en el lago** `f5\a4-lago-lluvia`: más anillos y más chicos. La diferencia con Alta (que ya tenía anillos grandes) es moderada.
- **Arroyo rápido** `f1\a5-arroyo-rapido`: espuma blanca que corre y se junta en las bajadas; es lo que más se nota del agua.
- **Nubes y sus sombras** `f1\a1-valle-nubes`, `r5\a1` / `r5\a1b` (dos seguidas: la mancha sobre los cerros se corre), `f1\a0-valle-alto`
  (desde arriba; `r3\a0-valle-alto-TRES.jpg` es el diagnóstico normal / sin sombra / sombra negra).
- **Noche** `f1\a7-noche-via` (la Vía Láctea), `f1\a8-noche-luna` (luna con corona y anillo de 22°). **Es lo que más se nota.**
- **Tormenta** `f5\a9-tormenta`: el cielo encendido y el rayo detrás de los cerros (el relámpago quieto para la captura).

## Rendimiento (placa, 1080p de lienzo, el bucle real con Ultra y Alta alternados en la misma partida, 3 rondas de 60 cuadros tras 200 de
calentamiento, ventana sin freno; la 4.28.0 armada aparte y medida igual, el mismo rato)
| | Alta (4.28.0 / esta) | Ultra 4.28.0 (r1, r2, r3) | Ultra 4.29.0 A (r1, r2, r3) | costo de A |
|---|---|---|---|---|
| Plaza de día (05) | 26,7 / 26,7 | 34,5 · 34,5 · 34,7 → **34,5** | 35,6 · 35,3 · 35,5 → **35,5** | **+1,0** |
| Bosque (02) | 16,5 / 17,0 | 23,5 · 23,4 · 23,2 → 23,4 | 23,7 · 24,7 · 24,0 → 24,0 | +0,6 (Alta +0,5: ruido) |
| Bosque denso (b1) | 25,1 / 24,9 | 31,9 · 32,2 · 32,1 → 32,1 | 32,2 · 33,3 · 31,9 → 32,2 | +0,1 |
| Lago (14, a la tarde) | 14,3 / 14,4 | 20,7 · 21,1 · 21,0 → 21,0 | 26,3 · 26,4 · 26,5 → 26,4 | +5,4 (sólo ahí; 26,4 < 33) |
**Ojo:** hoy la máquina anduvo más lenta que el 13-11 (Alta en la plaza 26,7 contra 24,2): **la 4.28.0 sola ya da 34,5 ms de Ultra en la plaza**,
por encima de 33. Lo de A suma 1,0 ms ahí (dentro del tope de 1 ms de la zona); el exceso sobre 33 es de la base, no de esta zona.

## Ultra apagado = 4.28.0 (partida real)
- Programas de shader con Ultra apagado (claves ordenadas, resumidas): plaza 105 y bosque 104, **idénticas** a la 4.28.0 (mismo resumen).
- Capturas Ultra apagado contra la 4.28.0 (`hxa4290k-nuevo` / `k-base`, corridas distintas): plaza 2,7 de media sobre 255 (6,6 % de píxeles > 8),
  bosque 8,1 (25,6 %): el pasto con viento y las nubes que corren (`kp\02-par.jpg`: misma imagen, otra posición del viento). Con las claves de
  programa idénticas, la imagen sólo puede diferir en la animación.

## Qué quedó afuera / sin ver
- El reflejo del lago es en pantalla: lo que no está en pantalla (detrás tuyo, arriba del cuadro) no se refleja; ahí queda el reflejo pintado de
  siempre. Las rayas verticales que se ven en la orilla con viento son del reflejo pintado de la orilla (también en Alta), no del de Ultra.
- La cascada (la cortina del salto) no cambia: la espuma y el brillo son del arroyo.
- El titileo de las estrellas y el corrimiento de las sombras no se separan de Alta con una diferencia de píxeles de toda la pantalla (el pasto
  y la gente también se mueven); se ven en las capturas seguidas, no hay una medición aparte.
- Las sombras de las nubes no son las de las nubes pintadas del cielo (otro ruido, a otra escala: las del cielo darían manchas de kilómetros
  y el valle entero quedaba al sol o a la sombra).

## Pruebas
- Nueva: `pruebas/verificar-4-29-0-a.mjs` (en `verify:pasos`): reglas, prendido/apagado con el agua de verdad, los programas de Alta intactos,
  el enganche de main.js; 30 mutaciones + 3 de main.js, todas atrapadas.
- Ajustada a propósito: `verificar-4-28-0-a` (la línea de `crearUltraLuz` ahora pasa `agua`).
- En verde las viejas que leen lo tocado: 4-21-0-c, 4-22-0-c, 4-24-0-c, 4-12-1-agua, three-offline, 4-28-0-a/b/c, 3-8-8-arroyo, 2-1, 4-8-ambiente.
- `herramientas/auditoria-visual-4-20-0.cjs`: campo `antes` en las tomas (código que corre justo antes de la captura: caminar por el agua, un
  relámpago quieto). `window.__hojarasca.__ultraLuz` en `?debug=1`.
