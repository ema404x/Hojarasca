# 4.2 · Pesos como costo de construcción (rama `v42-pesos`)

Sale de `v405-pruebas` (4.0.5 + el arreglo del trueno). No se subió la versión. Parte 2 de la 4.2: la infraestructura para que cualquier pieza o etapa cueste pesos, la escala de precios y cinco piezas de lujo de ejemplo. La escala y la receta para otros agentes están en `PRECIOS_CONSTRUCCION.md`.

## Qué quedó hecho

1. **Pesos en cualquier plano.** Un plano declara `pesos: N` junto a `pide` (en la etapa, o en el plano con `repartoPesos` si tiene varias etapas) y el juego cobra, avisa, muestra, devuelve y guarda. La maquinaria común es `src/obra-pesos.js` (pura, sólo depende de `economia.js`): un registro de precios por plano, `puedePagarEtapa`, `pagarEtapa`, `devolverEtapasPagadas`, `reintegroAlDesmontar` y los textos del aviso. `propiedad.js` ya no tiene la cuenta: sólo anota los precios de las tres casas en ese registro (mismos precios, mismo reparto, mismos textos y mismo libro) y re-exporta las funciones con los nombres de siempre.
2. **Cobro.** Se paga al hacer cada etapa, en los tres caminos de `main.js`: pieza nueva (Y), pieza de varias etapas a medias y obra grande (el camino de las casas, que quedó igual). Sin plata no se construye. Si faltan materiales y pesos se dice en una sola frase («Faltan 13 tablas y $3.500»); si sólo faltan pesos, «La mano de obra cuesta $4.500 y te faltan $3.500. El banco te puede prestar». Sólo en el Relax: en el Desafío (y en una partida sin economía) los `pesos` se ignoran.
3. **Devolución.** Retirar la marca (Supr) devuelve todo lo pagado (con el texto de siempre en las casas: «del terreno y la mano de obra»). Deshacer una etapa (Retroceso) no devuelve pesos pero deja la etapa pagada (rehacerla no cobra de nuevo), igual que antes. **Desmontar una pieza terminada (Mayús + Supr) devuelve la mitad de los pesos que de verdad se pagaron** (con su propio aviso) (decisión mía, ver abajo).
4. **Guardado.** `datos.pagadas` (que ya guardaba `guardado.js` para las casas, tope 8) ahora también lo anotan las piezas. `guardado.js` **no se tocó**. Una partida vieja no trae `pagadas`: cuenta como «nada pagado» y no se le inventa.
5. **Menú de construcción.** La lista muestra «Vitrina de roble · $4.500» (en rojo, con borde rojo y «(no alcanza)» en el texto si no alcanza para empezar); la ficha muestra el precio de cada etapa junto a los materiales, «faltan $3.500», el costo total en pesos y «Tenés $1.000». Las piezas comunes no muestran nada. Las casas también muestran ahora sus precios en el menú (antes no).
6. **Cinco piezas de lujo** en `src/planos-lujo.js`: alfombra tejida grande $2.400, vitrina de roble $4.500, araña de velas $6.500, reloj de pie $9.000 y fuente de piedra $14.000. Geometría por código, de 650 a 870 triángulos (la mediana del juego es ~250 y el 90 % no pasa de ~760), sin luces dinámicas (las llamas de la araña son sólo color), sin nada por cuadro. El reloj de pie se usa con E y dice la hora (como el de pared).
7. **Escala de precios** documentada con los días de ingreso a $3.200 por día: mueble bueno $800–3.000, lujo $4.000–20.000, edificio de oficio $15.000–60.000, ampliación de casa $20.000–80.000 (la casona, $110.000, sigue siendo lo más caro).

## Archivos

Nuevos: `src/obra-pesos.js`, `src/planos-lujo.js`, `PRECIOS_CONSTRUCCION.md`, `pruebas/verificar-4-2-pesos.mjs`, `pruebas/humo-4-2-pesos.cjs`, este archivo.

**Compartidos (los que otros agentes también tocan):**
- `src/construccion.js`: un import de `planos-lujo.js` y otro de `obra-pesos.js` (junto a los de los muebles), `PIEZAS.push(...PIEZAS_LUJO);` en una línea aparte, la etapa de cada pieza copia `pesos`, y `registrarPreciosDePlano(p)` dentro del bucle final que ya recorre todos los planos.
- `src/propiedad.js`: se reemplazaron `precioDeEtapa`/`puedePagarEtapa`/`pagarEtapa`/`devolverEtapasPagadas` por el registro de las casas y el re-export.
- `src/main.js` (ocho lugares, todos chicos): imports; la lista y la ficha del panel de obra; `pagoDeEtapa`/`cobrarEtapa`/`notaSinPlata` (helpers justo antes de `piezaAMedias`); el cobro en los dos caminos de pieza; el aviso de la obra grande (mismo texto para las casas); el texto de «Marca retirada»; el reintegro al desmontar; el reloj de pie con E (`OBRAS_QUE_TRABAJAN`, `avisoObra24`, `usarObra24`).
- `src/plantilla.html`: tres reglas de CSS para «no alcanza».
- `package.json`: sólo la línea del gate (`sumar-prueba.cjs`) con `verificar-4-2-pesos.mjs`.
- `guardado.js`: **no se tocó**.
- `pruebas/verificar-construccion-premium-rc6.mjs`: la pila de materiales de 999 se rellena en cada plano. Con cinco planos más (y decenas que vienen) las 999 tablas se acababan y la prueba fallaba con «Faltan 8 tablas»: era un límite de la prueba, no del juego.

## Decisiones (cambian fácil: son un número en `obra-pesos.js` o en el plano)

- **Reintegro al desmontar: 50 %** de lo pagado, igual que los materiales (el campo `reintegro` del plano, 0 a 1; las casas 0: no se desmontan). Sólo cuenta lo hecho y pagado: una pieza de partida vieja no regala plata. Si preferís que desmontar no devuelva nada, `reintegro: 0`.
- «No alcanza» en la lista mira la **primera etapa** (las obras por etapas se pagan de a una), no el total.
- Los pesos de una pieza de varias etapas se cobran **al hacer cada etapa**, como las casas.
- Las cinco piezas son `soloRelax` (como los muebles): en el Desafío no hay economía ni lana.

## Verificación

**Verificado:**
- `pruebas/verificar-4-2-pesos.mjs` (408 verificaciones, en el gate): lectura de `pesos` (etapa, plano, reparto, basura), las casas con los mismos precios/libro/textos que antes, el circuito completo con un edificio inventado de tres etapas (cobro, falta, devolución, reintegro, Desafío, partida vieja), las cinco piezas (precio, escala, geometría, triángulos, física), ida y vuelta por el guardado real (`pagadas` vuelve, lo viejo no se toca), y que `main.js` usa todo en los lugares y el orden correctos.
- `pruebas/verificar-3-8-8-negocios.mjs` y `verificar-4-0-3-obras.mjs` (las pruebas de las casas) pasan **sin cambios**.
- **En el juego real** (`pruebas/humo-4-2-pesos.cjs`, Electron en el monitor externo, con las teclas de verdad): menú con precios en rojo/«(no alcanza)»; Y sin plata no construye ni cobra y avisa; materiales y pesos juntos; con plata construye la vitrina, cobra $4.500, anota el libro y guarda `pagadas`; Mayús + Supr la desmonta y devuelve $2.250; las cinco piezas se construyen y cobran; E en el reloj de pie dice la hora; la cabaña: Y marca gratis, la segunda cobra $12.600, deshacer no devuelve, rehacer no cobra, retirar la marca devuelve $12.600, y sin plata el aviso es el de siempre. Sin errores en la consola.
- Capturas a tamaño completo (1366×768) en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\pesos\`.

**Razonado, no probado en el juego:** que en el Desafío se ignoren los `pesos` (lo cubre la prueba de Node con `hayEconomia`; ningún plano con pesos existe en el Desafío porque todos son `soloRelax`); una obra grande no-casa con pesos por etapa (se probó con un edificio inventado en Node; el camino de `main.js` es el mismo de la cabaña, que sí se probó).

**No verificado:** fps en la 4600G (nada nuevo por cuadro: la lista y la ficha se rehacen sólo al abrir o cambiar de plano; las piezas son geometría estática).

## Lo que NO quedó

- Ningún edificio de oficio ni ampliación de casa con precio: sólo la infraestructura y la escala (lo harán otros agentes).
- La araña de velas es sólo de adorno (no da luz) y cuelga a 2,45 m: se ve en el aire si no hay techo; el texto lo dice.
- El tope de `pagadas` en el guardado sigue en 8 etapas.
- `humo-4-2-pesos.cjs` no está en el gate (las pruebas de humo con Electron no lo están).
