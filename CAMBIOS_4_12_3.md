# Hojarasca 4.12.3 — Mejora visual 4: sombras que llegan más lejos

Rama `v4123` (sobre `main` = 4.12.0). **No se subió la versión**, no se tocó `main`, sin etiqueta ni zip. No se tocaron agua, edificios ni animales.

## Hallazgo: el bosque nunca dio sombra
Las siluetas livianas de los árboles (capa 1, `malla.sombra` en `vegetacion.js`) **nunca entraron al mapa de sombras**. En three r186 la pasada de sombras decide qué dibujar con las capas de la **cámara del juego** (no con las de la luz), y esa cámara sólo mira la capa 0. Con `npm run diag` de sombras (`herramientas/diag-sombras-4-12-3.cjs`): 40 dibujos en la pasada, 67 mallas en capa 1 que no se dibujaban. Sólo daban sombra edificios, gente y animales. La captura de la ladera a las 15:30 lo muestra: un bosque entero sin una sombra en el suelo.

## Qué trae (sólo Media y Alta; Baja y Mínima no cambian)
- **El bosque entra al mapa**: `permitirSiluetasEnSombra` (cielo.js) prende la capa 1 en la cámara únicamente mientras se arma el mapa. El dibujo normal no las ve. Sin pasadas ni shaders nuevos.
- **Caja más grande** (`calidad.sombraCaja`): Media ±70 m (antes ±40), Alta ±110 m (antes ±55). Mismo tamaño de mapa (1024 / 2048). La luz se aleja con la caja (los árboles de más allá del borde siguen proyectando), el rango de profundidad crece y el sesgo conserva los mismos metros; el corrimiento por normal crece con el tamaño del téxel (con las cajas de antes da exactamente lo de antes).
- **Alcance de los árboles** (`calidad.sombraArboles`): las siluetas del tramo se prendían sólo si el tramo estaba a menos de 45 m (un empedrado irregular); ahora 65 m en Media y 105 m en Alta.
- **Encaje en téxeles bien hecho** (`encajarEnTexeles`, `src/sombras-alcance.js`): antes se redondeaban x y z del **mundo**, que no coinciden con la grilla del mapa cuando el sol viene de costado (el mapa quedaba entre téxeles y las sombras «nadaban» al rehacerlo). Ahora se encaja en los ejes derecha/arriba de la cámara de la luz.
- **Rehacer menos**: el umbral para rehacer el mapa al caminar crece con la caja (6 m con ±40; 10 m con ±70; 16 m con ±110).
- `?debug=1&sombrasx={json}` pisa claves de la calidad (sólo depuración) y `H.__cielo().reponerSombras()` rehace el mapa en vivo: es lo que usa la medición.

## Opciones evaluadas
| Opción | Resultado |
|---|---|
| (a) caja más grande en Media y Alta | **Elegida.** El muestreo casi no cambia (ver tablas) y la pasada de armado crece poco. |
| (a') mapa 4096 en Alta con ±110 | **Descartada:** +1 ms de placa más por rehecho que 2048 (+2,5 a +2,8 ms en total) y 128 MB; no se ve mejor con el borde suave de 2,6 téxeles. |
| (b) segunda cascada lejana | **No construida.** El three del juego trae el soporte de cascadas en el renderer (luz «sol» con 2 cascadas) pero la clase no está en el paquete que se carga; habría que reescribirla. Además elige la cascada por profundidad de vista con cajas centradas en el jugador (dejaría huecos en los bordes de la pantalla) y comparte un solo corrimiento por normal entre las dos. Su costo sería la suma de dos pasadas de armado (≈ caja 40 + caja 150: +1,5 a +2 ms CPU y +1 a +2 ms de placa por rehecho), sin ahorro de muestreo. Queda como idea; no se dejó código muerto. |
| (c) sombras lejanas «pintadas» | No hizo falta: las siluetas del bosque ya son mallas instanciadas por tramo y llegar a 105 m cuesta unos 60 a 130 dibujos más sólo cuando se rehace el mapa. |
| (d) texel snapping y sesgo | Hecho (arriba). |

## Mediciones (notebook Ryzen 7 7730U, Radeon 680M; **no son las de la 4600G**)
Herramienta `herramientas/medir-sombras-4-12-3.cjs` (+ `.ps1`, configuraciones en `sombras-variantes-4-12-3.json`): una sola página, las configuraciones se alternan en ciclos (nada, 4.12.0, solo bosque, caja grande…), 12 ciclos × 20 cuadros por encuadre y configuración, cuatro encuadres (ladera con árboles a 15:30, plaza de la aldea al ocaso, mirador a la tarde, bosque a mediodía). La PC estaba muy cargada por otros programas: **el tiempo de cuadro de pared varía 4 a 15 ms entre bloques**, por eso se usa la **consulta de tiempo de la placa** (percentil 25 de todos los cuadros) y la CPU de la pasada. `gl.finish()` no espera a la placa en esta Electron: el «cuadro» es CPU. Ruido estimado: ±0,4 ms en placa.

**Cuadro común (muestrear las sombras), placa, p25, ms** — «nada» es sin sombras:

| Calidad / encuadre | nada | 4.12.0 | final |
|---|---|---|---|
| Media ladera | 7,9 | 8,05 | 8,07 |
| Media plaza ocaso | 14,95 | 15,59 | 15,45 |
| Media bosque mediodía | 7,79 | 8,17 | 8,20 |
| Alta ladera | 10,0 | 10,7 | 10,36 |
| Alta plaza ocaso | 16,25 | 16,61 | 16,73 |
| Alta bosque mediodía | 10,63 | 10,88 | 10,75 |

Muestrear no cuesta más que antes (dentro del ruido): ampliar la caja no suma costo medible por cuadro.

**Cuadro en que se rehace el mapa** (pasada de armado; suma sobre el cuadro común), CPU de la pasada p50 y placa extra:

| | dibujos de la pasada | triángulos | CPU de la pasada | placa extra por rehecho |
|---|---|---|---|---|
| Media 4.12.0 (±40, sin bosque) | 45 a 50 | 46 k a 191 k | 0,9 ms | ~0,2 a 0,3 |
| Media final (±70) | 112 a 127 | 137 k a 309 k | 1,4 a 1,6 ms | ~0,3 a 1,4 (plaza 0,8) |
| Alta 4.12.0 (±55, sin bosque) | 45 a 49 | 46 k a 201 k | 0,8 a 0,9 ms | ~0,2 a 1,0 |
| Alta final (±110) | 165 a 181 | 288 k a 441 k | 1,8 a 1,9 ms | ~1,1 a 2,0 |

El rehecho ocurre de 2 a 6 veces por segundo (tope existente): **promedio por cuadro a 60 fps: +0,05 a +0,2 ms** en Media y Alta, por debajo del ~1 ms. Lo que hay que mirar es el **tirón del cuadro que rehace** (+1 a +2 ms en Alta; +0,5 a +1,4 en Media), y por eso se subió el umbral de recentrado (menos rehaceres). Variantes probadas: Media ±100 (+0,2 ms más por rehecho que ±70), Alta ±150 (+0,3 a +0,6 más que ±110, 232 dibujos); se eligió ±70 y ±110 por relación alcance/costo.

**Dibujos totales** (F3 / `diag-sombras`): sólo cambia la pasada de sombras, que sólo existe en el cuadro que rehace el mapa; el cuadro común mantiene sus dibujos (153 a 170).

## Verificación
- `pruebas/verificar-4-12-3-sombras.mjs` (en el gate): **431 comprobaciones y 49 mutaciones atrapadas** (cielo real con three, interruptor de siluetas con cámara real, encaje en téxeles, configuración de las cuatro calidades, enganche de `main.js` y `vegetacion.js`).
- `pruebas/humo-4-12-3-sombras.cjs` (partida real, monitor externo, perfil propio): **19 pasos OK** en las cuatro calidades: Media (±70) y Alta (±110) proyectan; el bosque suma +62 (Media) y +130 (Alta) dibujos a la pasada de sombras al rehacer el mapa; la cámara vuelve a la capa 0; **ningún programa de shader nuevo en 120 cuadros** con rehaceres (101 → 101); Baja y Mínima sin sombras; sin errores de consola.
- Gate: `npm run verify` de corrido: **verify: 308 pasos OK**.

## Lo que no se pudo verificar
- **La 4600G**: no hay esa PC. Comando: `herramientas\medir-sombras-4-12-3.ps1 -Calidad media|alta -Configs nada,m-base,m-sil,m-c70a ...` (alta: `a-base,a-c110a`). Si en la 4600G el rehecho pasa de ~1 ms en Media, bajar `sombraCaja` a 55 en `config.js`.
- Movimiento (parpadeo al caminar) y noche/lluvia: sólo capturas fijas.
- Capturas: se sacaron ANTES (4.12.0, Media y Alta) y DESPUÉS sólo en **Media** (seis encuadres); las de Alta después no llegaron (plazo). Revisadas con ojo en Media: sombras largas de árboles al ocaso con borde suave, sin acné visible, sin costura (hay un solo mapa); la caja de ±70 m sigue teniendo borde duro más allá de esa distancia (en el horizonte del encuadre de la ladera).
- Alta con ±110: medida y probada por humo, **sin ver en captura**.
