# Hojarasca 4.25.0 (parte A) — la caza de bugs de lo nuevo

Rama `v4250-a`, sobre `main` = 4.24.1. No se subió la versión (lo hace el cierre). Parte A de la 4.25.0: caza de bugs en todo lo que entró de la 4.19.0 a la 4.24.1 (guardado y migración, economía nueva, marca del mapa y panel, trochita, perillas del Desafío, logros de la Historia). **No cambia ninguna regla del juego.** 0 programas de shader nuevos (110 a 110 en las partidas reales), 0 texturas, 0 llamadas de dibujo.

## Resumen
Se buscó mucho y se reprodujo poco: lo nuevo aguanta. Lo único reproducido y arreglado es chico (ver «Arreglado»). Todo lo demás se anota como «buscado y no encontrado», para que no se vuelva a buscar igual.

## Arreglado
| qué | cómo se reprodujo | arreglo |
|---|---|---|
| `cantinaNueva()` traía `fuertes: { dia, n }` y `sanearCantina` lo devuelve con `mate: 0`: una libreta de la cantina o de la casa de té nueva y la misma guardada y vuelta a abrir no eran iguales (partidas rotas con `cantina` o `casaTe` inválidos, 3 de 900) | prueba `verificar-4-25-0-a.mjs`, sección guardado (idempotencia de 900 partidas rotas) | `src/cantina.js`: `fuertes: { dia: 0, n: 0, mate: 0 }`. Nada lo leía distinto (`cf.mate \|\| 0`). |

## Buscado y no encontrado (con cómo)
- **Partidas viejas**: se armaron con el código de la 4.18.4 y de la 4.22.0 (`git archive` de las etiquetas) dos partidas de verdad (capítulo 6, plata, flete en curso, mercado, cabaña alquilada, puesto de la feria) y se guardaron en `pruebas/datos-4-25-0-a/`. Cargan, el flete con `yerba` pasa a pesos (12 yerbas = $1.200), la Historia vuelve igual (la de antes de la 4.21.0 queda con `arranqueNuevo` falso), guardar y abrir deja todo igual. También en el juego real (`humo-4-25-0-a.cjs`, sección `viejas`).
- **Historia a mitad de camino**: con el jugador de mentira, motor viejo (4.18.4 y 4.22.0) jugando y volcando el estado cada 150–200 pasos, y motor nuevo tomando cada punto (pasado por `sanearHistoria`) y jugando hasta el final: 62 puntos de 4 semillas, todos terminan (el único atasco es el conocido de la guardia/huellas del capítulo 6, que es del azar del jugador y de la parte B). Ida y vuelta de `sanearHistoria` en 6.000 estados: ninguna diferencia.
- **Guardado hostil**: ~12.000 partidas con 1 a 3 valores raros (null, NaN, ±1e308, `{}`, `[]`, `"__proto__"`, `{toString: null}`…, claves borradas) en las ~740 rutas de una partida cargada, Relax y Desafío: ninguna tira, ninguna se pierde, todas se serializan; la única no idempotencia era la de la cantina. Ajustes: cada clave con 23 valores raros; las perillas siempre quedan en −2..+2 y sin `-0`.
- **Economía**: se instanció el puesto de la trochita real (`crearPuestoDeCargas`) con un mundo de mentira y se le dieron miles de operaciones al azar (comprar, vender, tomar y entregar fletes, días que saltan 0 a 400, estaciones raras, existencias y cajas forzadas a 0/14/30/1e7, plata de $0 a casi el tope, stock 0, bienes sin entrada en el cuaderno, furgón): plata, materiales, cosas, existencias y cajas siempre enteros y en rango, premios de flete redondos, nunca más de 5 fletes. **Ir y venir en el mismo andén nunca gana** (87.480 casos de 15 paradas × días × estaciones × existencias × los dos órdenes).
- **Perillas**: las 125 combinaciones × 4 dificultades × noches 1–40 × vueltas: oleadas de 2 a 80 duendes, multiplicadores finitos y positivos; `castigoDeCaer` entre 20 y 40 %, enteros siempre.
- **Marca del mapa y panel**: sobre 7.000 estados de partidas con el jugador de mentira: nunca más de 4 marcas, sin repetir lugar, sin NaN ni «undefined», con puntos faltantes o NaN; el panel normal y el compacto no pierden ningún objetivo ni pendiente. En el juego real: con la Historia pausada no hay marcas y el rumbo se suelta solo; el clic en la marca no deja chinche guardada; con una escena corriendo la M no abre el mapa.
- **Logros de la Historia**: `cumple` aguanta partidas vacías y raras; jugando una historia entera cada logro se otorga una sola vez, recargando la libreta a mitad de camino no se pierde ninguno y una partida nueva no quita lo ganado.
- **Guardar a mitad de cosas (juego real)**: subido al tren con fletes y plata (vuelve a pie en la estación, todo igual); en medio de una escena `guardar()` dice que no y no toca lo guardado; el premio de un capítulo ($1.000) se cobra una sola vez, también después de volver a abrir; 12 «días» de comercio por el panel y guardar/abrir igual.
- **Paginado del final** (`paginarFinal`): 20.000 casos al azar, ningún párrafo perdido ni fuera de orden.

## Observaciones que no se tocaron (decisión)
- **Pedidos de nivel 3 de cosas de la granja**: desde la 4.23.0 un vecino con el que ya cumpliste 16 pedidos puede pedir leche, carne, chorizo, fruta o mermelada (la cuarta cosa de su lista). Quien no tiene granja no puede comprarlas en la trochita (lo del cuaderno sólo se compra si ya lo conocés) y el pedido vence sin castigo. Es coherente con «el Relax no castiga» y exigiría cambiar a propósito las pruebas de la 4.23.0 (el banco sí las excluye); si se quiere, se filtra por `entradas` en `pedidoDe`.
- `horas` cambia en el último decimal (8,2 → 8,200000000000003) en la primera carga y queda estable.

## Archivos
`src/cantina.js` (una línea y su comentario); `pruebas/verificar-4-25-0-a.mjs`, `pruebas/datos-4-25-0-a/` (dos partidas viejas), `pruebas/humo-4-25-0-a.cjs`, `pruebas/humo-4-25-0-a-largo.cjs`, `herramientas/correr-humo-4-25-0-a.ps1`; `package.json` (la prueba en `verify:pasos`).

## Claves nuevas de guardado
**Ninguna.**

## Pruebas
Ver el informe de resultados al final de este documento.

### Resultados
- `pruebas/verificar-4-25-0-a.mjs`: 486 comprobaciones y 1 mutación atrapada (la del arreglo de la cantina). Previas en verde: `verificar-4-24-1-a`, `verificar-4-23-0-a`, `verificar-release`, `verificar-guardado-rc2`, `verificar-4-10-partidas` y las cuatro de la cantina.
- Partidas reales (Electron, monitor externo, candado, perfil propio): `humo-4-25-0-a.cjs` («Todo en orden»: guardar en el tren, en una escena y con el premio de un capítulo; partidas viejas 4.18.4 y 4.22.0 jugadas de verdad; economía por el panel; mapa con la Historia pausada y con una escena; logros); `humo-4-25-0-a-largo.cjs` dos corridas (8 min con capítulos cambiando y 6 min en el capítulo 12, la noche de la nevada) con comercio, mapa y 12 guardar-y-volver-a-abrir: 0 errores de consola, 0 diferencias reales al reabrir (el guardado no conserva materiales en cero y los logros se revisan tras abrir: es normal), fps 53–60, programas 110 a 113 (los conocidos); `caos-largo.cjs` 6 min: sin problemas. En una corrida vieja (`humo-4-18-4-largo`) el fps cayó a 1 después del minuto 6; no se repitió en ninguna de las tres siguientes (se atribuye a la ventana, no al juego).
- Las pruebas de la parte A **no ajustaron ninguna prueba vieja**.

## Sin ver / no hecho
- No se vio a ojo ninguna captura nueva (esta parte no toca nada visible); sólo `3-mapa-pausada.png`.
- No se repitió `caos-guardados.cjs` (partidas rotas en el juego real): se cubrió en Node con ~12.000 casos.
- El Desafío con perillas extremas no se jugó en Electron (lo hace `humo-4-22-0-a`, de la 4.22.0); acá sólo en Node.
- La pasada de la banderita con lluvia fuerte, Media y Baja, y un viaje de vuelta caminado de verdad siguen sin verse (heredado de la 4.24.1).
