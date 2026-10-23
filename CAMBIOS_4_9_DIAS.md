# 4.9.0 · «días»: la aldea de día y preparar la noche (rama `v49-dias`)

Tanda 2 de las mejoras del Desafío. Los días entre noches tenían sólo juntar, reparar y esperar. Ahora la aldea te pide
cosas (y eso decide cuánto te ayuda cada vecino en las noches grandes) y de día se puede ver qué noche viene, por
dónde entran los duendes y dónde conviene armar una trampa de miel. No se sube la versión.

## Lo que ya existía (revisado antes de tocar)
- El ciclo día/noche y `decidirNoche` (`desafio.js`): una hora antes del ataque (19:30) se decide la noche especial
  con `nocheEspecial(n, azarEspecial(d, meteo, n), anterior)` y, en la misma llamada, el lado con `ataques.decidir`.
- La estación meteorológica y la radio ya anunciaban «las noches del Desafío» con `nochesQueVienen` (`meteo.js`), la
  misma cuenta que usa el juego.
- El lado de entrada (4.8, `desafio-lados.js`) es una función pura de (semilla, noche, lados de la base):
  `ladoDeLaNoche` y `puntoDeLaNoche`. El plan de lados de cada base lo guarda `ataques.planActual()`.
- Los materiales del Desafío son tronco, tabla, piedra, semillas doradas, ramitas y frutas del bosque (`cuanto` y
  `gastar` de `main.js`). La miel no existía: la trae la rama de las defensas (frasco de miel, caja del alba, trampa).
- La E sale de la tabla `INTERACCIONES`; el cuaderno tiene pestañas (en el Desafío, el bestiario).

## La aldea de día: los pedidos
- Cuatro vecinos piden: **Anselmo** (el carpintero, desde la primera noche resistida), **la abuela Herminia** y **los
  chicos** (desde la segunda) y **Martín** (desde la tercera). Ramón y Josefina no piden: ya tienen su propio vínculo
  (órdenes y llegada por noches) y no tienen nivel de ayuda en el contrato.
- Uno por vecino y por día, desde que sale el sol hasta una hora antes de la noche; vale **hasta que salen los
  duendes** (20:30). Si se vence, no pasa nada: ese día no suma y mañana piden otra cosa (nunca la misma dos días
  seguidos). Con la ayuda a pleno (nivel 2) ya no piden.
- Catálogo: 19 pedidos (Anselmo 3+2, Herminia 3+3, Martín 2+2, chicos 2+2; «primer tramo»+«segundo tramo»), cada uno
  con su texto en su voz. Lo que piden es lo que ya existe: tablas, troncos, piedras, ramitas, frutas del bosque y
  miel. El primer tramo sube la ayuda de 0 a 1; el segundo, de 1 a 2 (y es más caro).
- **Cuesta**: cada pedido crece con la noche (×1 en la primera, ×2,2 hacia la 20: por ejemplo, el portón de Anselmo
  pide 6 tablas y 3 piedras en la noche 1 y 13 tablas y 6 piedras en la 20). Lo entregado no vuelve. El regalito (a
  veces nada, a veces emplastos, flechas, una piedra, una tabla…) vale como mucho el 45 % de lo entregado (la prueba
  lo comprueba en las 40 primeras noches de los 19 pedidos; el peor caso real es 44 %).
- **Dónde se entrega**: en el **tablón de la aldea**, un tablón de madera junto a la base (a unos 11 m del centro;
  se corre solo si una obra queda encima). Una hoja por vecino que pidió se ve desde lejos. Con **E** parado junto
  al tablón se abre el cuaderno en la pestaña **«La aldea»**: a la derecha, los pedidos de hoy con su voz, lo que piden,
  el regalito, las horas que quedan y el botón *Entregar* (sólo anda junto al tablón y con todo en la mochila); a la
  izquierda, la noche que viene y quién te ayuda (nivel 0, 1 o 2). Se eligió el tablón y no el vecino porque los
  vecinos de la noche son del agente «aliados» y pueden no estar a mano de día; así el pedido no depende de ellos.
- Estado: `D().aldea = { ayuda: { anselmo, herminia, martin, chicos }, pedidos, pidioDia, ultimo, cumplidos, vencidos }`.

### Contrato con «aliados» (`src/desafio-aldea.js`, puro)
`VECINOS_AYUDA = ['anselmo','herminia','martin','chicos']`, `nivelAyuda(d, clave)` (0, 1 o 2; 0 si no existe),
`aldeaNueva()` y `sanearAldea(v)`. `sanearDesafio` y el guardado pasan por ahí: una partida vieja carga con todos en 0.
Al juntar, `nivelDeAyuda` de `desafio-vecinos.js` puede pasar a llamar a `nivelAyuda`.

## Preparar la noche: el pronóstico (`src/desafio-pronostico.js`, puro)
- Mismas funciones que la noche de verdad: la noche sale de `nochesQueVienen` (que usa `nocheEspecial` y
  `azarEspecial`), el lado de `ladoDeLaNoche` y el punto de `puntoDeLaNoche`. No se guarda nada ni se usa un solo
  número del azar de ninguna noche (la prueba lo comprueba: la misma partida con y sin pronóstico sale igual y
  `Math.random` no se toca).
- Lo que se sabe depende de lo que tengas: **sin nada**, la noche del jefe y la final (se saben por número) y, desde
  las 19:30, todo; **radio** (la del refugio o la de la estación): qué noche viene hoy, desde la mañana; **el perro**: desde las 15,
  el lado; **estación meteorológica**: esta noche y la de mañana, noche y lado, desde la mañana.
- Se ve en la pestaña «La aldea» (lado, distancia, qué noche y un consejo corto) y, en el mapa de papel, una marca
  «Por acá entrarían los duendes (el monte)» en el punto de entrada. Si hay un rescate o la trochita varada esa noche,
  lo avisa (los duendes irían a otra parte).
- No cambia nada de la noche. Una diferencia a tener en cuenta: si una obra ocupa el punto exacto de entrada cuando se
  decide al atardecer, el punto se corre unos metros (el lado no cambia); el pronóstico dice el lado y la distancia, y
  marca el punto sin ocupar.
- **Trampa de miel**: desde la pestaña, junto al tablón, *Armar una trampa de miel en el camino de «el monte»*: llama a
  `colocarTrampaMiel` de la rama de las defensas sobre la línea entre el punto de entrada y la base, a 18 m de la
  base (y si ahí no sirve, a 24 y 30 m, con desvíos de 3,5 y 7 m a cada lado). Cuesta lo suyo (2 tablas y 1 frasco de
  miel); sin ellas, el botón dice qué falta. Si el juego no tiene esa función (antes de juntar las ramas), el botón no
  se ofrece. También se puede armar a mano desde el menú de obra.

## Archivos
Nuevos: `src/desafio-aldea.js`, `src/desafio-aldea-mundo.js`, `src/desafio-pronostico.js`,
`pruebas/verificar-4-9-dias.mjs`, `pruebas/humo-4-9-dias.cjs`, `herramientas/mutar-4-9-dias.cjs`.
Con bloques `// 4.9 dias:` en `desafio-reglas.js` (aldea en `desafioNuevo` y `sanearDesafio`), `desafio.js` (arma el
tablón, lo actualiza, lo expone), `main.js` (pestaña, mapa, enganche de la E, trampa) e `interacciones.js` (una entrada
`aldea-tablon`).

## Pruebas
- `verificar-4-9-dias.mjs` (en el gate): el contrato y el saneo de partidas viejas; el catálogo y su equilibrio; plazos
  y reparto; la entrega; el pronóstico contra la noche real en 30 noches × 6 semillas × 6 bases (la noche, el lado y el
  punto, hoy y «mañana»); el tablón con three de verdad; la trampa; el enganche. 40 mutaciones a propósito
  (`herramientas/mutar-4-9-dias.cjs`): todas se atrapan.
- Ajuste mínimo a una prueba vieja: `verificar-3-6-1-aldea.mjs` buscaba la palabra `"aldea"` en cualquier parte del
  guardado de un Desafío; ahora mira sólo la clave de arriba (el Desafío trae su aldea de pedidos adentro de `desafio`).
- `humo-4-9-dias.cjs` (partida real): pedidos a la mañana, el tablón, E, entregar, ayuda 1, el pronóstico con el perro,
  el mapa con la marca, el lado anticipado = el de la noche, guardar y recargar, vencimiento, partida vieja sin aldea.
  Capturas en `pruebas/salidas/dias-49`.
- Rendimiento: un segundo de por medio se revisan los pedidos y el tablón; nada por cuadro.

## Pendiente / no verificado
- Con las ramas de las defensas y de los aliados juntas: el botón de la trampa y los pedidos con miel (la miel todavía
  no existe en esta rama), y que `desafio-vecinos.js` lea `nivelAyuda`.
- No se midió en la 4600G (no suma dibujos ni luces: una malla de nueve piezas con materiales compartidos, a 11 m de la base).
