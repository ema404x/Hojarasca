# 4.22.0 · parte C — Edificios y materiales

Rama `v4220-c` (sobre `main` = 4.21.0). Del informe `AUDITORIA_4_20_0_C.md` (H1 y H4c): llevar las obras del jugador al nivel de la aldea **con geometría fusionada, detalle y color por vértice**. Cero llamadas de dibujo nuevas, **cero programas de shader nuevos**, ninguna textura, ninguna capa de pantalla completa.

Capturas antes y después (mismos encuadres, 1920x1081 de lienzo, cámara fija): `C:\Users\Andres\AppData\Local\Temp\hx\c4220\` — `f-antes` (4.21.0), `f-final` (esta rama; `f-n2` y `f-n3` son las de las pasadas intermedias). Mediciones crudas: `med-*`, `ord-*` y `fin-*` en la misma carpeta (`resumen.cjs` las junta).

## 0. Cuánto es ruido (primero se volvió a medir `main` contra `v4.20.0`)
Pedido del brief: más muestras y alternadas. 5 rondas × 3 versiones (4.20.0, 4.21.0 y esta rama; el orden rota en cada ronda), PC sin otra cosa corriendo de mi parte (A y B comparten la PC y el candado), 6 s de muestra por captura, lastre de la 4.20.0. Placa = ms de la placa a 1920x1081 con el reloj fijo; CPU = ms del cuadro sin lastre. Mediana de las 5 corridas (entre paréntesis, lo que valió cada una):

| plaza | 4.20.0 | 4.21.0 | 4.21.0 − 4.20.0 |
|---|---|---|---|
| día, placa | 22,22 (24,71 · 22,22 · 21,88 · 22,22 · 21,97) | 22,06 (22,25 · 21,88 · 22,28 · 22,06 · 21,96) | **−0,16** |
| ocaso, placa | 25,64 | 25,68 | **+0,04** |
| día, CPU | 9,9 (12,1 · 9,9 · 9,5 · 9,8 · 10,0) | 9,8 (9,0 · 12,7 · 9,8 · 9,2 · 12,0) | −0,1 |
| ocaso, CPU | 12,4 | 12,4 | 0,0 |

Lectura: **la subida de 0,5 a 0,6 ms de la placa de la plaza que dio la 4.21.0 (`CAMBIOS_4_21_0_C.md`) fue ruido**; medida así, la 4.21.0 no empeora la plaza (−0,16 y +0,04). Cuánto es el ruido:
- **Dentro de una tanda tranquila, la placa se repite a ±0,2 ms** (rondas 2 a 5: 21,88 a 22,28).
- **En los bordes, ±2 ms**: la primera corrida de una tanda salió 2,5 ms arriba (4.20.0, 24,71) y la primera de otra, 1,8 ms abajo (4.21.0, 21,34, la del arranque de la serie `fin-`); y **entre tandas el nivel se movió 1,3 ms** para la misma versión (22,06 contra 23,3: la placa y la PC en otro estado térmico). Por eso sólo se comparan corridas de la misma tanda.
- **La CPU de la plaza de día es bimodal**: 9 a 10 ms o 12 a 12,7 ms según cuánta gente haya a la vista en esa corrida (las dos versiones caen en los dos grupos), así que ahí la diferencia mínima que se puede ver es de ~3 ms. La del ocaso es estable (±0,3).

## 1. Qué cambió (lo que se ve)
Todo sale por `src/detalle-obras.js` (nuevo, puro: sólo le pasa piezas chicas al `Constructor` de `geometria.js`; cada obra sigue siendo **una sola malla**) y se prende **sólo en Media y Alta** (`fijarAsentado({ ..., detalle: !!calidad.post })`, una línea de `main.js`): en Baja y Mínima las obras son EXACTAMENTE las de la 4.21.0 (la prueba 4.12.1 fija sus vértices al número).

| antes | ahora |
|---|---|
| **Casilla**: cuatro paneles lisos marrones | tablas verticales de 19 cm con relieve de 1,6 cm, juntas oscuras entre una y otra, cada tabla con su tono y su degradado, algún nudo (nunca sobre el vidrio ni el marco de la ventana), zócalo y esquineros oscuros; por adentro, tablas de 30 cm. Estufa de bloques de piedra |
| **Cabaña de piedra, casa con galería, casona** (y las ampliaciones que usan su fábrica) | las paredes igual (los cubrejuntas de siempre quedan encima); **zócalo de bloques de piedra a trabazón**, de tamaños distintos, cada uno 1 a 3,5 cm afuera o adentro del plano, juntas hundidas, la pared del frente y del fondo llegan hasta el canto de las de los costados (por la cuenta de las medidas, antes quedaba un rincón vacío de 10 cm en cada esquina; no se vio a ojo); **hogar y chimenea de bloques** |
| **Puesto de troncos**: troncos de CUATRO lados, sin tapas (la pared parecía una pila de listones) | troncos de ocho lados con normales suaves, **las puntas sobresalen en las esquinas** (una hilada sí, la otra no) y llevan su tapa de madera cortada (anillo y centro) |
| **Patas de piedra** (puesto, casilla, galponcito, mirador, cobertizo y casas): cilindro de siete lados | dos cantos rodados apilados (icosaedros abollados con normales suaves, uno al pie en las grandes); el calce de la ladera (`calces.js`) también es un canto |
| **Galponcito**: pared de fondo de cuatro lados; **cobertizo**: pared de fondo de un panel liso | troncos redondos con tapas; tablas con juntas (la cara que se ve es la que mira al frente) |
| **Sombras de contacto** (anillo de una sola tira, pasos de 1,4 m, esquinas de 5 puntos) | anillo fino (`ANILLO_FINO`): tres tiras con caída suave, pasos de 80 cm y esquinas de 6 puntos: sigue el relieve del terreno vértice por vértice y el borde de afuera se desvanece sin escalón |

Los colores de las piezas del detalle van SIEMPRE como texto `#rrggbb`, que es como `estilo-casa.js` reconoce qué es pared, abertura o techo: **«Personalizar» (pintar paredes) sigue funcionando y conserva la veta** (se mide el brillo de cada vértice contra el medio de la pieza): una pared repintada de colorado mantiene tablas claras y oscuras y juntas negras.

### Orden de las piezas (detalle de la placa)
Dentro de una misma malla, las piezas se dibujan en el orden en que se agregaron. En las paredes y en los muros de piedra se agrega **primero la cara de afuera, después el núcleo y al final la cara de adentro**: la placa descarta por profundidad lo que queda detrás (el núcleo detrás de las tablas) en vez de pintarlo y taparlo después. Medido en las tomas de cerca (§3): −0,35 ms en la casilla y −0,32 ms en la cabaña contra la primera versión del detalle.

## 2. Presupuesto
**Triángulos.** Tope del brief: ≤ +400 mil en total. Las **211 obras del juego armadas juntas (una de cada plano) suman +66 mil triángulos** de más (la que más suma, la casona: +12 mil). En la escena de demostración de la herramienta (11 obras del jugador a la vista) el cuadro entero pasa de 1.266.360 a 1.284.288 triángulos: **+18 mil**.

| obra (Media y Alta, ya asentada) | vértices antes → ahora | triángulos antes → ahora | armado (ms, en caliente) antes → ahora |
|---|---|---|---|
| puesto de troncos | 7.620 → 9.228 | 2.540 → 3.076 | 12 → 17 |
| casilla | 5.964 → 9.522 | 1.988 → 3.174 | 7 → 20 |
| galponcito | 4.440 → 5.616 | 1.480 → 1.872 | 7 → 13 |
| mirador | 2.928 → 3.312 | 976 → 1.104 | |
| cobertizo | 6.552 → 8.028 | 2.184 → 2.676 | |
| cabaña de tablas y piedra | 14.076 → 25.713 | 4.692 → 8.571 | 22 → 37 |
| casa con galería | 22.728 → 37.515 | 7.576 → 12.505 | 24 → 52 |
| casona | 13.284 → 49.548 | 4.428 → 16.516 | 31 → 71 |
| dormitorio anexo (ampliación) | 12.540 → 20.400 | 4.180 → 6.800 | |
| salón grande (ampliación) | 13.116 → 47.418 | 4.372 → 15.806 | |

(La casona, el salón grande y otras ya no entraban al teselado de la 4.12.1, que tenía tope en 12.000 vértices; con el detalle los topes suben —teselado 48.000 y oclusión 110.000 vértices, sólo con el detalle prendido— y esas casas ganan el asentado que antes no tenían: por eso sus vértices «antes» no crecen igual.) El armado de una casa grande tarda hasta ~70 ms en caliente (una vez por etapa y al cargar la partida: 20 a 40 ms más que antes por casa).

**Llamadas de dibujo: 0 nuevas.** La prueba cuenta las mallas de cada una de las obras del juego: ninguna cambia. En el cuadro de la demostración (17): 231 → 229 llamadas (las llamadas de gente y animales varían entre corridas; no salen de acá). En la plaza, las corridas de esta rama dan 186 a 202 llamadas y las de la 4.21.0, 187 a 210.
**Shaders: 0 nuevos.** 18 construcciones de `ShaderMaterial` en el código (como en la 4.21.0) y los **programas compilados idénticos en las dos versiones** (150 al empezar, 163 en las tomas de la aldea y 169 a 170 en las de las casas del jugador: la misma cuenta en las dos versiones, en cada corrida de `auditoria-verano.json`). `detalle-obras.js` no menciona shaders, texturas, mallas, instancias ni luces (lo comprueba la prueba).
**Capas de pantalla completa: 0.** El postproceso no se tocó.

**ms (notebook, 1080p, placa con lastre y CPU sin él; mediana de las corridas de cada tanda, siempre alternadas):**

| captura | 4.21.0 | esta rama | diferencia |
|---|---|---|---|
| **05 plaza día**, placa (tanda 1 · tanda 2) | 22,06 · 23,32 | 21,95 · 23,51 | **−0,11 · +0,19** |
| **06 plaza ocaso**, placa | 25,68 · 25,65 | 25,68 · 25,70 | **0,00 · +0,05** |
| 05 plaza día, CPU | 9,8 · 12,3 (bimodal, ver §0) | 12,1 · 12,2 | media de las 8 corridas de cada una: 11,13 contra 11,12 |
| 06 plaza ocaso, CPU | 12,40 · 12,20 | 12,20 · 12,50 | media de las 8 corridas de cada una: 12,28 contra 12,31 (**+0,03**) |
| 17 casas del jugador, día, placa | 14,16 | 14,34 | +0,18 |
| 19 casilla de cerca, placa | 16,37 | 16,58 | +0,21 |
| 20 cabaña de cerca, placa | 17,77 | 18,11 | +0,34 |

**La plaza no empeora: placa entre −0,11 y +0,19 ms (el tope era 0,5) y CPU +0,03 ms (el tope era 0,3).** Es lo esperable por construcción: las obras del jugador no están en la plaza y el único cambio que toca la aldea es el anillo de la sombra de contacto, que se rehace de vez en cuando y no por cuadro (~2 ms para rehacer 40 edificios, medido en Node, contra 1 ms el anillo viejo). **Donde sí cuesta es al mirar una casa de cerca: +0,2 a +0,35 ms de placa y ~0 de CPU** (la geometría chica pesa por relleno, no por llamadas; sin el orden de las piezas del §1 eran +0,56 y +0,66). La tanda de la plaza de la tanda 2 (`fin-`) arrancó con una corrida 1,8 ms más rápida de lo que se mantuvo: sin ella la diferencia de día es +0,15.

## 3. Decisiones (con lo recomendado por el informe)
1. **Sólo Media y Alta** (junto con el asentado). En Baja y Mínima nada cambia, a propósito: la geometría es casi gratis en la placa pero esas calidades existen para que ande en la máquina más débil; así no hay nada que medir allí. *Decisión mía; se puede prender también en Baja si el usuario quiere.*
2. **El suelo verde liso bajo el pasto NO se tocó, pero se encontró de dónde sale.** Ese suelo pálido y chato, con el borde recto y facetado alrededor de cada casa (se ve igual en la 4.21.0 y en esta rama: capturas 19, 21, 63, 68 y 69), es el **terreno sin pasto**: `marcarPisos` (`main.js`) pone el canal azul de la textura de la estepa en 255 sobre cada piso y plataforma más 0,8 m de margen, y el pasto, las flores y los helechos se apagan donde ese canal pasa de 0,4 (`(1.0 - step(0.4, est.b))`, tres veces en `pasto.js`). La textura tiene un texel de 2 m: el contorno del 0,4 de una interpolación bilineal de 2 m es el polígono que se ve. Y lo que queda a la vista es el color del terreno SIN el pasto, que sale entero del fragmento del material del terreno (por píxel, sin color por vértice: `MeshLambertMaterial` blanco + `onBeforeCompile`) y por eso es liso. Arreglarlo es tocar esos shaders (adelgazar el pasto de a poco en vez de cortarlo: probado en papel, rompe las obras chicas, cuyo piso cubre uno o dos texeles y no llega a 1 en el centro: el pasto atravesaría el piso) o sumar vegetación instanciada, que es de la 4.24.0 («Paisaje y vegetación»). Tampoco se puso un «pie de obra» de guijarros y tierra dentro de las obras: ensanchaba la huella de la sombra de contacto (`huellaDe` mide los vértices bajos). Queda para la 4.24.0 con este diagnóstico.
3. **Los «polígonos facetados» de la captura 22 no son las sombras de contacto**: son sombras del sol de los edificios de la aldea (mapa de sombras de resolución fija: su borde es duro y recto porque los casters son cajas). Las dos versiones (4.21.0 y esta, con el anillo nuevo) los dibujan idénticos. Lo que sí se afinó es el anillo de contacto (§1), que además tenía el defecto de cortarse a pedazos contra el relieve.
4. **Las puntas de los troncos del puesto sobresalen 15 cm**: la silueta y la huella de la obra crecen 15 cm de cada lado (la prueba acota la silueta: ≤ 40 cm en cualquier obra); las colisiones no cambian (`obs` y `plats` idénticos en las 211 obras).
5. **Ampliaciones** (`planos-ampliar.js`): heredan lo que usan de la fábrica de casas (patas, hogares) pero sus paredes de tablas (hechas por su propia función `muro`, de tablas de 46 cm con juntas) y de piedra hilada (bloques de 1,2 a 1,9 m) **no se tocaron**: ya tenían detalle propio y el brief pedía el puesto, la casilla y la cabaña. Queda anotado para pulir.
6. **Nada de interiores** (4.23.0). Las tablas de adentro de la casilla y la cabaña son más anchas y sin nudos (menos piezas).

## 4. Lo que no se hizo
- El suelo pálido y chato sin pasto (§3.2), el relieve de los techos (tejas, cumbreras: siguen siendo tablas planas), el interior de las casas, las ampliaciones, las casas de la aldea y los edificios de `estructuras.js` (el refugio de salida, la cabaña, el faro, el molino…: no son «obras del jugador»).
- Medición en la 4600G: descartada por el usuario.

## Claves de guardado
Ninguna. (`fijarAsentado` suma el campo `detalle` a su estado interno; `fijarAsentado` sigue devolviendo `{ ocluir, contacto, halos }` como antes.)

## Pruebas
- Nueva: `pruebas/verificar-4-22-0-c.mjs` (91 comprobaciones; se suma a `verify:pasos`): `detalle-obras.js` pieza por pieza (cajas con sólo las caras que se ven; bloques que salen de la cara sea cual sea el eje y el lado y con los cantos de los extremos mirando hacia afuera; tablas con relieve, tono propio por tabla, nudos que esquivan el rectángulo prohibido, la misma semilla da lo mismo; troncos de ocho lados con tapas hacia afuera; patas de piedra de la altura y la huella del cilindro); las 211 obras con y sin detalle (mismas colisiones y plataformas, **misma cantidad de mallas por obra**, silueta ≤ 40 cm, sin vértices rotos, +66 mil triángulos contra el tope de 400 mil, la que más suma ≤ 30 mil, vértices ≤ 90 mil, etapas intermedias, apagado = vértices de la 4.21.0); el calce en la ladera; la pintura de «Personalizar» en la casilla, la cabaña, la casa con galería y el puesto (todo color es texto, la pared pintable crece, repintada de colorado conserva la veta); el anillo fino (monótono, borde en cero, sin escalones mayores a la mitad de la fuerza, lote nivelado parejo, una sola malla); el presupuesto (18 `ShaderMaterial`; `detalle-obras.js` sin shaders, texturas, mallas, instancias ni luces ni azar del juego). **Mutaciones de verdad** (una copia de `detalle-obras.js` con otro nombre y un proceso por copia, 11): cantos al revés, bloques hundidos, bloques que salen de más, nudos sobre el vidrio, color que no es texto, tablas hundidas, tapa al revés, tronco de cuatro lados, pata aplastada, pata gigante, tablas sin tono propio; la copia sin tocar pasa y las 11 mutadas hacen fallar su comprobación.
- Las previas que tocan lo cambiado (73 archivos que importan `construccion.js`, `planos-casas.js`, `asentado*.js`, `calces.js` o `detalle-obras.js`) siguen en verde, entre ellas `verificar-4-12-1-edificios` (979 pasos, con sus números de oro al vértice), `verificar-4-2-ampliar`, `verificar-3-8-8-casas`, `verificar-3-8-7-obras`, `verificar-4-2-pesos`, `verificar-construccion-*-rc6` a `rc10`, `verificar-4-21-0-c` y `verificar-4-18-0-pulido-c`. **No se ajustó ninguna prueba vieja.** No se corrió `npm run verify` completo.
- Herramientas nuevas (no entran al gate): `herramientas/auditoria-visual-4-22-0.json` (10 encuadres de las obras: puesto de frente y de esquina, casilla de frente, de atrás y por dentro, cabaña, hogar, casa con galería, sombra de contacto), `herramientas/obras-conteo-4-22-0.mjs` (vértices, triángulos y ms de armado de cada obra con y sin detalle), `herramientas/correr-auditoria-4-22-0.ps1` (la auditoría con el candado de Electron por corrida) y `AUD_LIBRE_MS` en `herramientas/auditoria-visual-4-20-0.cjs` (cuánto se mide la CPU sin lastre).

## Efectos que cruzan a otras zonas
Ninguno hacia A ni B: nada de Desafío, Historia, economía ni guardado. Las casas del jugador que aparezcan en una escena de la Historia salen con el detalle (sólo Media y Alta).

## No visto a ojo
Calidad Media y Baja (las capturas son Alta; en Baja las obras son las de siempre por construcción, no se miró); nieve, otoño y lluvia sobre las paredes nuevas; las casas repintadas con «Personalizar» (sólo por números: el brillo de cada vértice); el interior de la cabaña y de la casa con galería; la casona y el salón grande armados en el valle; una obra levantada en una ladera pronunciada (el calce con la pata de canto rodado se vio en ladera suave y se probó en Node en una pendiente fuerte); el hitch de ~70 ms al armar una casa grande en el juego real (medido en Node, no en Electron).
