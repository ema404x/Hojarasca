# Hojarasca 3.3.0 — Fluidez (luces fijas, modo fluido y carga)

La regla cambió: ahora manda la fluidez. Se aceptó lo que hacen RAGE o Minecraft (una
cantidad fija de luces), que mueve ±1 algún píxel suelto. Medido contra la 3.3 sin estos
cambios, en las 25 capturas deterministas (de día y de noche, con obras, estación y tren):
**diferencia máxima 1 nivel, en 6 píxeles en total** (1 o 2 por vista, en 5 vistas; 20 vistas
quedan idénticas).

## Sin tirones por luces (`luces.js`)

- **Presupuesto fijo de luces: 4 puntuales y 1 foco**, siempre en la escena y siempre
  visibles. Las luces del juego siguen donde estaban (el juego las prende, apaga, mueve y
  oculta igual que siempre), pero three ya no las ve: en cada cuadro, justo antes de que three
  junte las luces, las que cuentan (visibles, prendidas y con su alcance dentro de lo que ve
  la cámara) se copian a las fijas, la más cercana primero, con su color, intensidad, alcance,
  caída, y en el foco ángulo, penumbra y hacia dónde apunta. Las que sobran quedan en 0. Una
  fuente que ya tenía lugar lo conserva mientras siga elegida (no salta la luz).
- Como la cantidad de luces no cambia nunca, el juego compila todo al cargar, de una vez y en
  paralelo (`compileAsync`, contra la salida del postproceso). Las variantes de la 2.7.4 quedan
  en el código, pero no trabajan con el presupuesto prendido.
- El cupo es lo mínimo que cubre lo medido: de noche, en todo el recorrido, como mucho 3
  puntuales y 1 foco a la vista a la vez. Si alguna vez hay más, quedan afuera las más
  lejanas (su alcance casi no llega a lo que se ve).

Recorrido determinista por el valle (refugio → galpón → almacén → casa de té → faro → molino
→ cabaña → puesto → mirador → refugio, 14.010 cuadros), calidad media, Radeon integrada:

| | antes, noche | después, noche | antes, día | después, día |
|---|---|---|---|---|
| programas compilados en medio del dibujo | 7 | **0** | 9 | **0** |
| tirones por compilar (ms trabados) | 1 (1.224–1.996 ms) | **0** | 2 (1.554 ms) | **0** |
| programas al terminar | 549 | **57** | 601 | **57** |
| peor cuadro | 1.226–2.006 ms | 472 ms | 1.150 ms | 368 ms |
| programas compilados de antemano en el paseo | 405 (1,6–3 s de CPU) | 0 | 455 | 0 |

Los cuadros de más de 50 ms que quedan (30–55 en el recorrido, de 400 ms el peor) no son
programas: es otra cosa (queda en la lista de abajo).

**Placa.** Medido en el mismo proceso y la misma vista, alternando seis veces entre las luces
de siempre y las fijas (mediana de ~240 cuadros por lado): el presupuesto fijo es **5 a 17%
más barato** (galpón de noche 10,3 → 8,6 ms; almacén 7,6 → 7,1; cabaña 7,5 → 6,2; faro de día
9,0 → 7,6). Antes three evaluaba en cada píxel todas las luces visibles, también las apagadas
(de día, todas las de los edificios cercanos); ahora siempre 5. Con 8+2 la placa pagaba más:
no se usó.

## Modo fluido (opcional, apagado de fábrica)

- En Ajustes → video, «Modo fluido»: si la placa no llega al ritmo, la resolución baja hasta
  70% y vuelve a subir cuando sobra. Mira lo que tarda la placa (si se puede medir; si no, el
  cuadro) contra lo que dura el cuadro en pantalla (el ritmo de la 3.2).
- Con histéresis y sin realocar en cada cuadro: un escalón de 10% a lo sumo cada 2 s para
  bajar y cada 4 s para subir; sube sólo si con el escalón de más (el costo crece con el área)
  igual queda margen; los tirones sueltos no cuentan (se mira el percentil 75). Cambia el
  lienzo y las salidas del postproceso juntos.
- F3 muestra las luces fijas en uso y el modo fluido («fluido 80%» o «apagado»).

## Carga

El estilo pintado de la 3.2 ya no usa la corteza, el suelo, la montaña ni las hojas. La carga
sólo calcula (y guarda en la caché) las manchas del prado y el vegetal (la madera de lo que
llevás en la mano): 2 de 5 generadores. Las otras siguen con los mismos bytes y se calculan
en el momento si algún material vuelve a pedirlas.

Fin de la carga (cuatro cargas por caso, ventana oculta, calidad media): con la caché llena,
mediana 1,90 s → **1,60 s**; con la caché vacía (el Worker calcula), 2,32 s → 2,26 s (el Worker
corre en paralelo con el valle, así que ahí casi no se nota). La carga ahora también espera a
que los programas terminen de compilarse (antes eso caía en los primeros cuadros), y son menos:
51 en vez de 72.

## Modo fluido, en vivo

Con el ajuste prendido, el botón queda marcado, la placa se mide aunque F3 esté cerrado y F3
dice «luces 1/5 fijas · fluido 100%». En esta Radeon la placa tarda 5,6–9,6 ms contra 16,7 de
objetivo, así que (bien) no baja la resolución; la bajada está cubierta por la prueba, no se vio
en vivo.

## Una prueba de humo

`humo-2-9-tren`: el bucle a mano sólo simula el tiempo de reloj que pasa, y sin programas
compilándose en medio los cuadros salen más rápido: 600 llamadas eran menos segundos de juego y
el tren no llegaba a 1 m/s. Se le dan hasta 1.800 cuadros (corta apenas pasa 1 m/s). El tren
acelera igual que antes.

## Pruebas

`pruebas/verificar-3-3-fluidez.mjs` (en `verify`): el reparto de luces con el three del juego
(cantidad constante, las más cercanas, lugares estables, una casa oculta no ilumina, la que
queda atrás de la cámara no ocupa lugar), la escala del modo fluido (escalones, cada cuánto,
tirones sueltos, histéresis), el ajuste y la carga de texturas. `verificar-2-7-4-luces` y
`verificar-2-7-4-carga` se ajustaron a la decisión nueva.
