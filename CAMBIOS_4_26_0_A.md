# 4.26.0 · A · Los vecinos piden sólo lo que se puede conseguir

Rama `v4260-a` (sobre `main` = 4.25.3). **0 programas de shader, 0 texturas, 0 llamadas de dibujo** (sólo reglas puras). No se abrió Electron.

## El problema (reproducido)

Desde la 4.23.0, con 16 pedidos cumplidos (nivel 3 de confianza) cada vecino suma a su lista una cuarta cosa de la granja o la cocina (leche, carne, chorizo, fruta, mermelada). La 4.23.0 la daba por conseguible «en algún puesto de la trochita», pero lo comprobaba con los **perfiles** de `comercio.js`, no con las paradas que **existen** en el valle del Relax. El valle es uno solo (semilla fija) y la trochita del Relax para en cuatro paradas: **Aldea de los Duendes, Parada Arrayanes, Estación del Valle y Parada del Mallín** (más el apeadero del Riel Sur y los puestos de ruta, que se arreglan). Ahí sólo se venden, de la granja, la **leche** (Mallín), la **carne de vaca** (Estación) y la **de cerdo** (Arrayanes); el cordero, el chorizo, las seis frutas y las mermeladas no se venden en ningún lado del Relax. Y además el panel de cargas **no vende lo del cuaderno que no conocés** (`conocido` en `comercio-mundo.js`): sin haber tenido nunca leche, tampoco se puede comprar en el Mallín.

Revisando los otros pedidos «del mismo tipo» apareció uno viejo, de la 3.8.8: **los cristales**. La pintora y la fotógrafa los pedían desde el nivel 0, la astrónoma también, y el herrero y la modista desde el nivel 2. En el Relax el cristal no se junta ni se produce; sólo lo venden el puesto de la Cantera y el del Paso, y sólo arreglados (antes de la 4.6.0, en ningún lado).

Con el `pedidos.js` de la 4.25.3, en 2.000 ventanas de vecinos de confianza sin granja hay **711 pedidos imposibles**; en las 8.000 ventanas de la prueba (los cuatro niveles), **1.199**.

## La regla (escrita en `src/pedidos.js`, sobre `seConsigue`)

Un vecino te pide una cosa sólo si en **esa partida** la podés conseguir de verdad, por alguno de estos caminos:

1. **Es del valle**: se junta, se cultiva o se hace con las obras de siempre (huerta, tendal, horno, ahumadero, colmena, gallinero), y casi todo se vende además en las paradas. Son las tres cosas de siempre de cada lista (las de la 3.8.8), **menos los cristales**: troncos, tablas, piedra, lana, harina, ponchos, huevos, miel, pan casero, empanadas, papas, habas, frutillas, truchas ahumadas, llao llao y calafates secos, dulce de frutilla (`DEL_VALLE`).
2. **Te lo vende un puesto a tu alcance**: las cuatro paradas de la trochita del Relax (`PARADAS_DEL_VALLE`) y los puestos de ruta que ya arreglaste (las tres etapas). Lo del cuaderno, como en el panel de cargas, **sólo si ya lo conocés**. Así entran la leche, la carne de vaca y la de cerdo (si las conocés) y los cristales (con la Cantera o el Paso arreglados).
3. **Lo producís vos**: la vaca (leche; carne de vaca también con un ternero o un novillo carneado por llegar), la chancha (carne de cerdo y chorizo; también con un lechón o un capón por llegar), la paridera o un cordero (cordero), el frutal de esa fruta plantado; la mermelada, con el frutal de su fruta **y** si sabés hacerla (la receta de las mermeladas, o ya hiciste esa).

Lo que no entra en ninguno, no se pide. **La paga es la de siempre** (la misma cuenta: valor del lote × 1,1 + 0,04 por nivel + 0,05 el primer día). Cómo se elige: de la lista de siempre, por nivel, sin lo que produce la estación de la aldea (como antes) y **después** se sacan las que no se consiguen; si queda lo mismo que antes, sale exactamente el mismo pedido (con todo a mano, los 8.000 pedidos de la prueba son idénticos a los de la 4.25.3: cosa, cantidad, paga, día límite). Si no queda nada, el vecino no pide (te ofrece el jornal, como cuando no pide); con las listas de hoy no pasa nunca.

### No cambia de idea a mitad de la ventana

Antes la elección salía sólo de la fecha y del vecino. Ahora depende también de lo que tenés, así que si a mitad de una ventana de tres días plantabas un cerezo o conocías la leche, el vecino podía pasar a pedirte otra cosa. Para que no: lo que pide en la ventana queda **fijo la primera vez que se calcula** (`negocios.fijos`). Si a mitad de la ventana perdés la fuente (carneaste la chancha), el pedido sigue: vence sin castigo, como siempre. En la ventana siguiente se vuelve a elegir con lo que tengas.

## Decisiones (para revisar)

- **Los cambios de la cocina con los vecinos no cuentan** como forma de conseguir (Mario Jones da 4 chorizos por día, Don Ramón cordero, Nélida manzanas…). Son uno por día, sirven para cocinar y si contaran casi todo sería «conseguible»: es justo el caso del que se quejó la gente. Si se quiere, se suma como cuarto camino (con lo que se conoce).
- **La mermelada pide saber hacerla**, no la cocina a leña: el que tiene la receta (o ya hizo esa mermelada) ya tuvo dónde hacerla. No se mira si la cocina sigue en pie.
- **Conocer algo vale para comprarlo, no para producirlo**: conocer el chorizo (por un cambio con un vecino) no alcanza, porque nadie lo vende en el Relax.
- **Las paradas del Relax están escritas** en `PARADAS_DEL_VALLE` (el valle es fijo). La prueba arma la trochita con el terreno de verdad y compara: si un día cambian, la prueba avisa.
- **Lo de la Historia**: no hay nada de la Historia que trabe los puestos ni la trochita para comprar (se revisó: el panel de cargas no mira la Historia), así que la regla es la misma en el Relax y en la Historia. Lo que la Historia no deja construir todavía simplemente no lo tenés, y no se pide.
- **Cuántos pedidos cambian** para alguien sin granja ni puestos arreglados: 1.638 de 8.000 ventanas (los 1.199 imposibles y, de rebote, algunos más porque la lista queda más corta y el azar cae en otra cosa). La pintora, sin la Cantera ni el Paso arreglados, pide siempre frutillas (antes cristales o frutillas).

## Qué cambió en los números

`herramientas/auditoria-4-20-a-ritmo.mjs` (el simulador arranca sin nada anotado): la fila C da **pedido $810 por día**, lo mismo que la 4.21.0 y que los niveles 0 a 2 de la 4.23.0 (el +2 % de los días 100 a 140 que la 4.23.0 atribuía a los pedidos de carne y leche del nivel 3 era, justamente, de pedidos que sin granja no se podían cumplir). El tope de la prueba de la 4.23.0 (de $729 a $810) se cumple. La plata por día de los días 100 a 140 (mismo simulador, mismo día, comparado con el `pedidos.js` de la 4.25.3): tranquilo $4.586 → $4.586, medio $7.351 → $7.159 (−2,6 %), a fondo $12.299 → $12.106 (−1,6 %); los días 20 a 40 y las primeras horas no cambian. Es lo que la 4.23.0 había sumado con pedidos que el simulador «cumplía» dándose la mercadería: un jugador con granja los sigue teniendo.

## Claves nuevas de guardado

- `progreso.negocios.fijos` = `{ <vecino>: { id, k } }` (optativa). Se guarda sólo si hay algo; `sanearNegocios` se queda con lo sano (id de texto, un bien que existe) y una partida vieja carga sin la clave.

## Pruebas

- **Nueva `pruebas/verificar-4-26-0-a.mjs`** (al final de `verify:pasos`): **40.230 comprobaciones y 17 de 17 mutaciones atrapadas** (copias `src/pedidos.mut<n>-4-26-0-a.js` y `src/negocios.mut<n>-4-26-0-a.js`, borradas al terminar). Revisa: que las paradas de la regla son las del valle de verdad (trochita armada con el terreno); que la regla del puesto es la del panel de cargas; cada camino cosa por cosa (leche, carnes, chorizo, cordero, seis frutas, seis mermeladas, cristales con cada puesto de ruta y a medio arreglar); los veinte vecinos × 100 ventanas × cuatro niveles sin nada (sólo lo que se consigue, dentro de su lista y su nivel, con la paga de siempre, y el mismo pedido de la 4.25.3 cuando todo lo de su lista se consigue) y con todo (idéntico a la 4.25.3); que la pintora pide cristales sólo con un puesto que los venda; que lo pedido queda fijo en la ventana (también al perder la fuente) y se vuelve a elegir en la siguiente; la entrega y el cobro; el guardado (`fijos` optativo, saneado, ida y vuelta).
- **Antes falla**: la prueba saca el `pedidos.js` de `v4.25.3` con git y comprueba que pide cosas imposibles (711 en 2.000 ventanas de confianza sin granja). Las mutaciones cubren: sacar el filtro, cristales «del valle», el puesto que vende lo que no conocés, una parada que no existe, los puestos de ruta sin arreglar, chorizo sin chancha, cordero sin paridera, cualquier frutal da cualquier fruta, mermelada sin receta, leche sin vaca, cambiar de idea a mitad de la ventana, un fijo de otra ventana, otra paga, filtrar antes del nivel, y en `negocios.js` no guardar lo fijado, guardar cualquier cosa y la clave siempre.
- **Pruebas viejas ajustadas a propósito:**
  - `verificar-4-23-0-a.mjs`, sección 4: fijaba que con confianza **todos** los vecinos piden una cosa de la granja en una partida sin granja, y que esa cosa «se consigue en algún puesto de la trochita» mirando los perfiles (`Apeadero del Pescador`, `Parada Alta`… no son paradas del Relax). Ahora esa sección usa una partida que lo consigue todo (granja entera, receta, puestos de ruta arreglados) —así sigue fijando lo de la 4.23.0 sin aflojarlo— y la comprobación del puesto pasa a ser `seConsigue`. Lo de sin granja lo fija la prueba nueva.
  - `mutaciones-4-23-0-a.mjs` (fuera del gate): la mutación «el nivel 3 no pide lo de la granja» busca la línea con el filtro nuevo; la de «la panadera pide algo que no se consigue» usaba la mermelada de pera, que ahora sí se consigue con el peral: pasa a truchas frescas.
- Corridas en verde: `verificar-4-26-0-a`, `verificar-4-23-0-a`, `verificar-3-8-8-negocios`, `verificar-3-8-8-banco`, `verificar-3-8-9-auditoria`, `verificar-3-9-2-mejoras`, `verificar-4-6-gente`, `verificar-4-6-puestos`, `verificar-4-9-dias`, `verificar-4-10-1-mundo`, `verificar-4-10-2-regresiones`, `verificar-4-10-4-aldea`, `verificar-4-21-0-a`, `verificar-4-25-0-a`, `verificar-4-25-2-guardado`, `verificar-4-4-3-venta`, `verificar-4-4-compra`, `verificar-2-9-tren`, `verificar-3-7-2-granja`; `node armar.mjs` armado. **No se corrió `npm run verify` completo** (lo pide el brief).

## No se vio a ojo

- **No se abrió Electron.** No se cargó una partida real con un vecino de confianza: todo está probado con los módulos reales en Node (y la trochita armada con el terreno de verdad para las paradas). Para mirar jugando: un vecino de nivel 3 sin granja (que no pida leche ni fruta), y con la vaca o un frutal (que sí, desde la ventana siguiente).
- El texto del vecino no cambió (sigue diciendo «Ando necesitando…»): la regla no se explica en pantalla, sólo se nota en que no pide lo imposible.

## Archivos

- `src/pedidos.js` (la regla: `PARADAS_DEL_VALLE`, `DEL_VALLE`, `puestosATuAlcance`, `seCompra`, `loProducis`, `seConsigue`; el filtro y lo fijado en `pedidoDe`)
- `src/negocios.js` (`fijos` en el saneo y en el comentario del estado)
- `pruebas/verificar-4-26-0-a.mjs` (nueva), `pruebas/verificar-4-23-0-a.mjs` y `pruebas/mutaciones-4-23-0-a.mjs` (ajustadas), `package.json` (`verify:pasos`), este documento
