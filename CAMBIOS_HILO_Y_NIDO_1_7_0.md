# 1.7.0 — El hilo y el nido

Dos cosas que al juego le faltaban, más una pasada de saneo. Ningún cambio de
jugabilidad en lo que ya funcionaba: los encargos son los mismos y el Desafío sigue
igual hasta la noche 20.

## 1. Los encargos dejan de ser una lista suelta

Los diecisiete encargos estaban en una lista plana y cada vecino ofrecía el primero
suyo que no hubieras empezado. Eso ordenaba mal la enseñanza: Don Ramón te mandaba a
**levantar un puesto entero** antes de enseñarte a sacar madera, y recién quinto te
decía *"lo primero que tenés que aprender es sacar madera sin arruinar el monte"*.

Ahora un encargo puede pedir que antes hayas cerrado otros (`requiere`). Once quedaron
encadenados, siguiendo lo que los propios textos dicen:

- **Don Ramón, el oficio:** madera → banco de carpintero → acopio, y el puesto propio
  recién después del banco. Su línea de oficio se movió al frente de la lista, que es
  donde su texto siempre dijo que iba.
- **Ema, el bosque:** los cinco árboles abren todo lo suyo; los renovales piden además
  haber talado con Ramón, porque devolver lo que sacaste supone haber sacado algo.
- **Nicanor, el agua:** las tres truchas antes que la picada de la tarde.
- **Elsa, el tren:** la vuelta completa al anillo pide haberte subido una vez, que es
  justamente lo que te propone Nicanor.

El cuaderno avisa qué falta cerrar antes (*"Antes hay que cerrar «Madera para el
invierno»"*), y la pausa muestra cuántos van sobre el total en vez de sólo los abiertos.

Todo lo que decide qué se ofrece es puro y vive en `src/encargos.js`
(`estadoEncargo`, `faltanPara`, `encargoDe`, `resumenEncargos`, `pistaTrabado`).

## 2. Un cierre para la tanda

Encargo nuevo, **«Lo que aprendiste»**, de Ema —que abrió la lista con los cinco
árboles—. Depende de los otros diecisiete y no pide nada nuevo: pide volver. Deja lo
que te falte del almacén (la mosca, el farol, la manta y la yerba).

La lista de requisitos se arma sola a partir de `ENCARGOS`, así que sumar un encargo
más no deja el cierre desactualizado.

## 3. El Desafío tiene segundo acto: el nido

El modo ya tenía final —la noche 20 baja la nodriza, se le revientan los tres núcleos
y hay pantalla de victoria—, pero después **los invasores seguían bajando sin motivo ni
meta**, y la propia pantalla lo admitía: *"algunas luces siguen en el cielo: podés
seguir resistiendo noche tras noche"*. El juego venía nombrando la respuesta desde la
1.6 sin mostrarla nunca: su jefe se llama **jefe de nido**.

Cuando cae la nodriza aparece el nido, enterrado en algún lado del valle:

- **Se busca.** Los restos de nave siguen cayendo, pero ya no traen planos (a esa
  altura los tenés los tres): traen señales. Cada una achica el cerco —560 m, 300 m,
  130 m— que el mapa dibuja como un redondel a lápiz. Con la tercera queda marcado.
  El cerco se corre al azar pero nunca deja al nido afuera, y eso está probado.
- **Se rompe de día.** De noche el caparazón está cerrado y no le entra nada. Con el
  sol arriba se abre en cinco gajos y quedan a tiro las tres cámaras de cría, 800 de
  vida cada una, que se revientan de a una. Es el primer objetivo del modo que se hace
  **de día**: el jugador pasa de aguantar a atacar.
- **Se termina.** Con el nido abajo no baja nadie más y hay un final propio, con su
  pantalla. Suelta entre 30 y 44 cristales.

Las cámaras entran como blancos por el mismo camino que los núcleos de la nodriza
(`blancos()` / `herirNucleo()`), así que el arco, la honda, la pistola y las ballestas
fijas le pegan sin tocar nada del código de combate.

Módulo puro `src/desafio-nido.js`; el mundo y el daño en `src/desafio-eventos.js`.

### Lo que encontró la prueba de partida real
Las pruebas de Node daban verde con tres cosas rotas, porque las tres dependen del
mundo y la lógica pura no las ve. `pruebas/humo-nido.cjs` las sacó a la luz:

- **Las cámaras estaban enterradas.** Quedaban a 10 cm del suelo, y el rayo de las
  armas se corta en cuanto toca tierra (`y < T.altura`): la pistola le disparaba a
  quemarropa y no le hacía nada. Subieron a 2 m, dentro del hueco de la cúpula.
- **El aviso del HUD no se leía nunca.** La rama del nido caído estaba después de las
  de hora de ataque, así que a las nueve de la noche seguía diciendo "calma".
- **Con sólo el hacha no se podía terminar el juego.** El golpe cuerpo a cuerpo mira
  únicamente la lista de invasores, así que el nido era invulnerable para quien nunca
  hubiera fabricado un arco ni encontrado la pistola: un callejón sin salida al final
  del modo. Ahora el hacha y la lanza también le entran, de cerca y mirándolo.

## 4. Saneo

- **El renoval apuraba sin tope.** Plantar junto a un tocón le saca tres días, pero
  nada impedía plantar diez veces en el mismo lugar y volverlo adulto al instante.
  Ahora cada tocón se apura una sola vez y los ya apurados salen de la búsqueda, así
  que plantar en un rodal ayuda al de al lado. La marca viaja en la partida.
- **Los materiales entraban sin revisar.** Una partida editada a mano con
  `{ tronco: "5" }` rompía la cuenta: `"5" + 1` da `"51"`. Mochila y acopio pasan ahora
  por un saneador que los deja enteros, no negativos y con techo.
- **Las chinches nunca se saneaban.** El guardián estaba al revés —saneaba sólo cuando
  el dato *no* era una lista, que es justo cuando no hay nada que sanear—, así que una
  lista con coordenadas rotas o con más de las que entran pasaba entera. Además el
  guardado ahora las pasa por `sanearChinches` y a los tocones por `sanearTalados`.

## Una fragilidad del gate, aparte

`pruebas/verificar-geometria-headless-rc3.mjs` corre su auditoría dentro de un `vm` con
timeout de 20 segundos y la auditoría tarda **~17**. Con el gate cargado se pasaba y la
prueba se caía sola sin que nada estuviera roto. El timeout es un freno contra un
script colgado, no un presupuesto de rendimiento: quedó en 90 s. La prueba no cambió.

## Pruebas
`npm run verify` en verde, **67 pasos**, más `npm run verify:nido` (23 pasos de
partida real en Electron). También pasan `verify:smoke` (4 combos, 0 errores) y
`verify:desafio` (29 pasos). Cuatro pruebas nuevas:

- `pruebas/verificar-encargos-hilo.mjs` — el grafo no tiene ciclos ni ids inventados,
  cada vecino abre por donde debe, y se juega el hilo entero hasta comprobar que la
  tanda se puede cerrar sin que ninguno quede trabado para siempre.
- `pruebas/verificar-nido.mjs` — saneo, la búsqueda (con el cerco que nunca lo deja
  afuera), el horario, el daño cámara por cámara y el cableado.
- `pruebas/verificar-saneo-1-6-1.mjs` — el tope del renoval y los contadores.
- `pruebas/humo-nido.cjs` (`npm run verify:nido`) — el segundo acto jugado de verdad:
  el cerco en el mapa, la malla que se arma, el caparazón que se abre y se cierra, la
  pistola y el hacha pegándole, las cámaras cayendo de a una, las noches que se
  terminan y todo sobreviviendo a una recarga.
