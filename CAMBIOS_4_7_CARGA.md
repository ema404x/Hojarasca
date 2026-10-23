# 4.7 carga: el límite de la mochila con casillas (rama `v47-carga`)

La versión no se sube acá: la sube quien junta las ramas.

## Qué hace
- La mochila tiene **24 casillas**. Los **materiales** y la **comida** (lo que está en `materiales`, en `entradas[k].cantidad` y en los contadores de `cosas`) ocupan casillas; cada casilla guarda una pila de **un solo tipo**, con un máximo por pila. Las **herramientas no ocupan** (siguen en la barra de 1 a 8), ni las ramitas (siguen con su tope de 12).
- **El caballo con alforjas suma 12** (36 en total) **mientras vas montado**. Decisión: es lo más simple y consistente (el caballo lleva las alforjas cuando lo montás; al bajarte, volvés a 24 y lo que pase queda como sobrecarga, no se pierde). Sólo cuenta si en «Personalizar el caballo» elegiste «Con alforjas» (`progreso.personal.caballo.conAlforjas`).
- **El carro no existe** en el juego: no se creó. Queda `CASILLAS_CARRO = 0` y `capacidad(...).carro` como gancho. **Pendiente:** cuando haya carro, que `capacidad` lo sume (hoy siempre 0).
- **Las partidas viejas no pierden nada.** Lo que pasa del límite queda como **sobrecarga**: no se puede juntar nada más hasta bajar del límite (se gasta construyendo o se guarda en un depósito). Nunca se recorta ni se borra. No hay nada nuevo que guardar (la capacidad sale de lo que ya existe): `guardado.js` no cambió y una partida con 989 troncos carga igual.
- **Sólo en el Relax.** En el Desafío (`progreso.modo === 'desafio'`) todo sigue por el camino de antes, con su tope de 40 del acopio incluido: `capacidad` da infinito y `lugarPara`/`tratoCabe` dicen siempre que sí.

## El módulo: `src/carga.js` (puro, sin three ni DOM)
```js
CASILLAS_BASE = 24, CASILLAS_ALFORJAS = 12, CASILLAS_CARRO = 0
pilaMax(k)                           // tamaño de pila
esCargable(k)                        // ¿ocupa casillas?
capacidad(progreso, ctx = {})        // { base, alforjas, carro, total }   ctx.montado → alforjas
ocupacion(progreso, ctx = {})        // { casillas: [{ k, n, pilas, max }], usadas, libres, total, sobrecarga: { k: n } }
lugarPara(progreso, k, n, ctx = {})  // cuántas unidades MÁS de k entran (0..n); Desafío: n
// extras (no cambian el contrato):
tratoCabe(progreso, da, quita, ctx)  // un trato entero: { ok, faltan }; entra si queda dentro del límite o si ocupa MENOS casillas que antes
tratoDeEfectos(efectos)              // [{ tipo, k, n }] → { da, quita }
conteos(progreso), textoLugares(n), PILAS, PILA_DEFECTO, COSAS_CONTABLES
```
La sobrecarga se le carga a las pilas más grandes, una casilla por vez (así 989 troncos + 3 manzanas muestran los troncos sobrando, no las manzanas). Una misma clave en dos lugares (la cocina cuenta `entradas` y `cosas`) se junta en una pila.

## La tabla de pilas
| Pila | Cosas |
|---|---|
| 10 | troncos, piedras, piedra de cantera |
| 20 | tablas, arcilla, cuero, ponchos, fardos, cristales (semillas doradas) |
| 30 | juncos, hierbas, lana, cantos, huevos, miel, leche, truchas (frescas y ahumadas), pan, empanadas, dulce, llao llao (fresco y seco), cacao, zapallos, mariscos, carnes, chorizos, **todo lo desconocido** |
| 50 | plumas, piñones, calafate (y seco), frutillas, habas, papas, frutas de frutales, semillas y papa para semilla, yerba, harina, azúcar, sal, maíz, porotos |

## Puntos de entrada conectados
`sumarMaterial` y `sumarEntrada` **no recortan** (si lo hicieran, un trato que no preguntó perdería lo que no cabe): quien suma desde afuera pregunta antes con `cabeJuntar(k, n)` (el mundo: «Mochila llena: no te entra más X») o `cabeTrato(da, quita)` (un trato: «No te entra: te faltan N lugares»), ambos en `main.js`. Los módulos reciben `CARGA_CTX` (`cabeJuntar`, `cabeTrato`, `entraTrato`, `lugarEn`).

**Lo que se junta del mundo (no consume el recurso si no entra):** talar (ni un hachazo; el árbol no cae a medias: se pide lo que rinde, con el oficio), picar piedra (ni un golpe), tronco caído, recursos de zona (juncal, hierbas, arcilla, cuero, veta de cantera: antes del primer golpe; piñones del pehuén), objetos del suelo (frutillas, calafate, piñones, plumas, cantos, llao llao: se quedan en el suelo; el aviso de la E ya dice «Mochila llena»), semilla de árbol, cantero (cosecha, probada en una copia con abejas y oficio), gallinero, colmena, ahumadero, vivero (plantines juntos), molino (harina), aserradero (tablas), talleres de oficio (`usarTaller` probado en una copia), esquila, pesca (si no hay lugar la trucha vuelve al agua), tendal, ordeñe, frutales.

**Cuentas netas:** aserrar (el tronco libera su lugar), horno de barro (con lo que se gasta), telar (la lana libera lugar).

**Se compra, se cobra o se recibe (verifica ANTES de cobrar y rechaza el trato sin cobrar):** comercio de las paradas y de los puestos de ruta (comprar un lote), almacén de Ercilia (trueque de lo que se repite: yerba, harina, semillas, azúcar…), feria, servicios de la aldea (`usarServicio`), «dar una mano» a un vecino, tienda de la gente del campo, trueques de la granja (vaca, chancha, fardos, plantines, carne), cambios de la cocina, lo cocinado (el último paso queda esperando en el fuego), encargos con premio en cosas (el encargo sigue pendiente), carne de Don Ramón (queda esperando y se avisa una vez; llega sola cuando hay lugar).

**Sacar de un depósito (sale sólo lo que entra, el resto queda guardado):** depósitos y silo (E y Supr), acopio, depósito de los puestos de ruta, consigna del puesto de la feria (banco), estantes del negocio propio (Sacar y Sacar toda la mercadería).

## Lo que NO quedó conectado (y por qué)
- **Reintegros al desarmar** (obras, ampliaciones, contenido de depósitos, renovales desalojados al cargar): son devolución de lo tuyo; entran aunque pasen (sobrecarga). Hacer lo contrario perdería cosas.
- **Regalos y premios automáticos** (el compadre que deja algo en la puerta, el regalo de las visitas, los premios de concursos, cartas y foto, el premio de los «Primeros pasos», los huevos de pascua, los frutos de Inés y los regalos del amor, recompensas de eventos del valle): no hay a quién rechazarle el trato ni cómo reintentar sin que se pierda, así que **entran aunque pasen** (sobrecarga). Se podrían diferir como la carne de Don Ramón si se quiere más estricto.
- **El aviso de la H** (texto «Talar el árbol», «Picar piedra»): no dice «llena»; la nota aparece al apretar. Se calcula por cuadro y no valía el costo. La E de los recursos de zona, el cantero, el gallinero, etc., tampoco cambia su aviso (sí el de los objetos del suelo, que se arma a 10 Hz y sólo para el candidato ganador).
- **Desafío** (`desafio*.js`, premios del tutorial, cristales): sin cambios, a propósito.
- **Trucos** (`trucos.js`): son trucos, siguen sin límite.
- **La pantalla de la mochila** (casillas, sobrecarga, alforjas): la hace el otro agente con `ocupacion` y `capacidad`.

## Pruebas
- `pruebas/verificar-4-7-carga.mjs` (en el gate): 115 comprobaciones. Capacidad, pilas, tres lugares, 989 troncos, `lugarPara`, `tratoCabe`, `tratoDeEfectos`, el Desafío intacto, los avisos, las alforjas, y funciones **reales** de `main.js` (`usarHacha`: tala, pico y tronco caído; `aserrar`; `cabeJuntar`; `cabeTrato`) con un mundo de mentira; `sacarDePuesto` real; los enganches de los demás por el texto.
- Rotas a propósito (todas hacen fallar la prueba): quitar el chequeo de la tala, del aserrado y del picado; pila de troncos en 100; las alforjas sin ir montado; `tratoCabe` siempre en sí; el cupo del depósito; la compra de la gente del campo sin chequeo; el chequeo de los objetos; `cabeJuntar` siempre en sí; la capacidad infinita del Desafío.
- `pruebas/humo-4-7-carga.cjs` (partida real en Electron, no está en el gate): tala y pico con la mochila llena y con lugar, el almacén sin lugar (rechaza y no cobra) y con lugar, el juncal, una partida vieja con 989 troncos (carga, sobrecarga, no deja juntar, se gasta), las alforjas montado (36), el Desafío sin límite.
- Ajustes mínimos a pruebas viejas: `verificar-3-7-2-granja.mjs` (el mundo de mentira de `vm` ahora trae `structuredClone`, que el código nuevo usa para probar en una copia); `verificar-3-8-3-relax.mjs` no cambió (la comprobación de las ramitas se respeta: el chequeo nuevo va antes).
- Costo: `lugarEn` mide ~1,2 µs por llamada con 14 entradas (unos pocos cientos en una partida avanzada: no llega al milisegundo) y sólo se llama al juntar, comprar o sacar, o a 10 Hz para el candidato del suelo; nada por cuadro en el bucle.

## Para el otro agente (pantalla)
Lo que lee: `capacidad(progreso, { montado })`, `ocupacion(progreso, { montado })`, `pilaMax(k)`. En depuración: `__hojarasca.__mochilaCarga()` y `__hojarasca.__lugarEn(k, n)`.
