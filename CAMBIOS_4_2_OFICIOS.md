# 4.2 · Edificios de oficio propios (rama `v42-oficios`)

Sale de `v42-pico` (4.0.5 + pico/picapedrero + costo en pesos de las piezas). No se subió la versión. Ocho construcciones de oficio, de **$18.000 a $42.000**, para que la plata tenga un destino con sentido: cada una hace algo real y modesto, y el dinero que dejan es menos que el que cuestan por años. Siguen la receta de `PRECIOS_CONSTRUCCION.md` (archivo propio `planos-oficios.js`, un import y un `PIEZAS.push` en `construccion.js`, `pesos` junto a `pide`, categoría Trabajo que ya existía, `soloRelax`).

## Las ocho piezas

| Pieza | Precio | Materiales | Qué hace (con E) |
|---|---|---|---|
| **Cantería** | $18.000 | 12 tablas, 6 troncos, 12 piedras | Una cuadrilla pica y acarrea **3 piedras por día sin gastar nada** (hasta 4 días juntando; picapedrero 3: 4 por día, picapedrero 5: 5). |
| **Carpintería** | $22.000 | 30 tablas, 10 troncos, 6 piedras | Mientras esté en pie, **al terminar cada etapa de obra sobra un 10 % más de tablas y troncos** (15 % con hachero 3), además del oficio de constructor. No produce nada: es una ventaja. |
| **Quesería** | $24.000 | 14 tablas, 4 troncos, 24 piedras | **8 litros de leche de tu vaca → 2 quesos por día** (hasta 3 tandas). Ercilia los paga $1.100 la tanda; con una tienda de campo se pagan un cuarto más ($1.400). La leche no tenía salida: ahora sí. |
| **Panadería de horno grande** | $27.000 | 10 tablas, 8 troncos, 40 piedras | **8 panes caseros por día** con 4 medidas de harina y un tronco (a mano: 3 panes con 2 medidas). Hasta 3 tandas. Huertero 3: un pan más. |
| **Tienda de campo** | $30.000 | 36 tablas, 10 troncos, 8 piedras | **Vende por vos** hasta 4 lotes por día, lo más caro primero, con 4 % de comisión (el puesto de la feria: 2 lotes y 10 %). Con E dejás ponchos, pan, empanadas, miel, dulce, truchas ahumadas, hongos y calafate y retirás la caja. |
| **Herrería propia** | $32.000 | 8 tablas, 6 troncos, 30 piedras | **Afilar el hacha y el pico en casa**, gratis y cuando quieras (10 usos, como el herrero de la aldea). Una sola vez se pueden **templar** (6 piedras, 2 troncos y $2.500): con filo, **dos golpes menos** en vez de uno. |
| **Telar grande** | $36.000 | 24 tablas, 8 troncos, 6 vellones | **5 vellones → 2 ponchos por día** (a mano: 3 vellones por poncho). Hasta 3 tandas. |
| **Cervecería artesanal** | $42.000 | 40 tablas, 12 troncos, 16 piedras | **Un barril por día** con 3 medidas de harina y un tronco; **Lucrecia lo paga contado ($1.300)**. Huertero 3: $1.500. Además, mientras la tengas, **la cerveza de la cantina te sale un 25 % más barata** ($350 → $260 y $380 → $290). |

Por qué estos precios (todos dentro de los $15.000 a $60.000 de la escala): el más barato es el que rinde sin gastar nada (la cantería) y el más caro el que más rinde y encima abarata la cantina. Los cinco que producen recuperan el precio en **26 a 60 días de juego** (cantería 60, cervecería 54, quesería 44, panadería 28, telar 26; la prueba lo calcula con el valor de cada bien en `comercio.js`, descontando lo que gastan y limitando el telar y la quesería a lo que el juego permite juntar de lana —la majada da ~2,7 vellones por día— y de leche —una vaca, 4 litros por día—). Un año del juego son 12 días: son metas de varios años, como los lujos de la 4.2. La herrería, la carpintería y la tienda no tienen «recupero»: son comodidad y ventaja. Ninguno rinde más por día que el ingreso de un jugador goloso ($3.200); armar los ocho cuesta $231.000.

## Cómo funcionan los talleres que producen

Reglas puras en `src/oficios-propios.js` (se prueban en Node), cableado en `main.js`:

- **Se cargan con E** con lo que pide cada uno y trabajan solos: **una tanda por día**, hasta un **tope de tandas** (3, la cantería 4). Con E se **retira lo hecho y se vuelve a cargar** de una, con lo que haya.
- **No se rompe nada si no volvés**: el estado es un contador de tandas y la hora en que arrancó (`obra.datos.taller = { n, desde }`). A los 30 días de ausencia hay lo que cabía (3 tandas), no 30. El reloj arranca desde el momento en que volvés a cargar.
- **Nada por cuadro**: no hay ningún tick; todo se calcula al apretar E o al mostrar el aviso (que ya corría cada cuadro junto a cualquier obra que trabaja: colmena, ahumadero…). El aviso no recorre las obras (la tienda de campo se mira sólo cuando la quesería la necesita).
- **Lo que sale** es un bien que ya existía (panes, ponchos, piedra) o pesos del comprador de siempre (Lucrecia, Ercilia). **No se agregó ningún bien nuevo a `comercio.js`**: el pan y los ponchos se venden por los canales de siempre (trochita, feria, banco, la tienda de campo nueva).
- **El oficio mejora el rendimiento** donde es natural: huertero (panadería, cervecería), picapedrero (cantería), hachero (carpintería). El telar y la quesería no tienen oficio: la lana y la leche son lo que limita.

## Decisiones mías (revisalas)

1. **Herrería sin pisar al herrero**: el herrero de la aldea sigue afilando (10 usos) y forjando el pico; la herrería propia afila lo mismo pero en casa y **agrega el temple**, que el herrero no tiene. El temple es «un golpe menos más» (no más usos de filo): se aplica sobre el filo que ya existe, sin tocar `aldea.js`. El temple vive en la obra: si desmontás la herrería, se va con ella.
2. **Carpintería como ventaja pasiva**: tablas y troncos ya salían baratos del aserradero de la aldea ($500 de tablas por tronco), así que una carpintería que «produjera tablas» no valía nada. Preferí que ahorre madera al construir, que es justo lo que más va a hacer el jugador con las piezas nuevas de la 4.2.
3. **Pesos directos para lo que no tiene mercado** (barriles y quesos): en vez de crear bienes nuevos (que tocarían los perfiles de las paradas, el banco y los pedidos), el comprador de siempre paga al retirar. Cuesta menos tocar y es predecible. Si querés que los barriles y los quesos se vendan en la trochita, hay que sumarlos a `BIENES` y a los perfiles (no lo hice).
4. **La cervecería abarata la cantina un 25 %**: es un cambio chico en `cantina.js` (`produccionDe` mira si la cervecería está terminada y `cartaDeHoy` rebaja las dos cervezas). Los nombres pasan a «Tu cerveza artesanal» / «Tu cerveza negra». Sin la cervecería terminada la carta es idéntica (probado).
5. **El piso de cada uno es una plataforma baja** (`h.plataforma`): se camina encima y, como los pisos del juego, **limpia el pasto de adentro** (sin eso el pasto alto tapaba todo lo que hay en el piso).
6. **`avisarSobrante` ahora también avisa al armar una pieza** (antes lo sobrante del oficio de constructor se devolvía en silencio en ese camino) y dice «oficio de constructor», «tu carpintería» o las dos. Es el único cambio de comportamiento que no es de las piezas nuevas.
7. **Tienda de campo sin menú**: E deja todo lo que sirva y retira la caja de una (lotes enteros, 12 por cosa, 8 tipos). Si querés elegir qué dejar, hace falta una pantalla (como la del banco): no la hice.
8. **No se agregaron categorías** ni se tocó `CATEGORIAS_CONSTRUCCION`, `CATEGORIAS_TODAS` ni `PLANOS_POR_PAGINA`; Trabajo pasó de 20 a 28 planos (4 páginas).

## Archivos

Nuevos: `src/oficios-propios.js` (reglas), `src/planos-oficios.js` (geometría y lo que se usa con E), `pruebas/verificar-4-2-oficios.mjs` (en el gate), `pruebas/humo-4-2-oficios.cjs` (juego real, no está en el gate).

Compartidos (los toca también otra rama o son de uso general): **`src/construccion.js`** (un import y un `PIEZAS.push`, 3 líneas), **`src/main.js`** (imports; el bloque «4.2: los edificios de oficio propios»; el aviso y la tecla E; `conTemple` en los golpes; `carpinteriaExtra` en `conOficioDeObra`; `avisarSobrante`; dos ganchos de depuración `__golpesParaTalar` y `__golpesParaPicar`), **`package.json`** (sólo la prueba registrada).
Otros: `src/oficios.js` (`ahorroDeObra` con un 4.º parámetro opcional `extraMadera`, por defecto 0), `src/cantina.js` (cerveza propia), `PRECIOS_CONSTRUCCION.md` (la fila «edificio de oficio» ya no dice «por hacer»).

No se tocó: `guardado.js` (el estado vive en cada obra y se guarda solo), `comercio.js`, `aldea.js`, `economia.js`, `propiedad.js`.

## Guardado y partidas viejas

Campo nuevo `obra.datos.taller` por obra, con valor por defecto («sin estado» = recién armada) y saneado al leer. Una partida vieja no tiene ninguna de estas obras, así que no cambia nada; la cantina sólo cambia si hay una cervecería terminada. Probado en Node: ida y vuelta por `escribirPartida`/`leerPartida`, un `taller` roto queda dentro del tope.

## Verificación

**Verificado**
- `pruebas/verificar-4-2-oficios.mjs` (389 comprobaciones, registrada en el gate): las ocho piezas (existen, ids únicos en todo el catálogo, cuestan lo de la escala, materiales que existen, sólo tipo 0 y 4, 560 a 980 triángulos, caben en su ancho/fondo/alto, física sana con el frente abierto y el piso como plataforma baja); cada taller de punta a punta con un mundo simulado (cargar, esperar, retirar, el tope a los 30 y a los 90 días, oficio, tienda, textos sin `undefined`); la herrería (afilar, templar, el golpe de más, y que el herrero de la aldea quede igual); la carpintería (se suma al constructor sólo en madera, el resto se arrastra y nunca sobra todo); la tienda (vender por días, 4 lotes, lo más caro primero, caja, tope de 12 lotes, basura); la cerveza de la cantina (sólo cambia con la cervecería terminada); el guardado (ida y vuelta de `datos.taller`); el cableado de `main.js`; y que ninguno rinda más que el ingreso diario de un jugador goloso.
- `npm run verify` completo y de corrido: **247 pasos OK**.
- **Partida real** (`pruebas/humo-4-2-oficios.cjs`, Electron en el monitor externo, 88 comprobaciones, TODO BIEN): el menú de Trabajo muestra los ocho con su precio y los marca «(no alcanza)»; sin plata Y no construye y avisa; los ocho se construyen con Y y cobran lo suyo; panadería (carga 3 tandas, al día retira 8 panes, a los 30 días retira 24 y no 240), telar (5 vellones → 2 ponchos), cervecería (Lucrecia paga $1.300 por barril, queda en el libro), quesería (con la tienda armada, $1.400 por tanda), cantería (12 piedras a los 6 días sin gastar nada), tienda (deja ponchos y pan, a los 2 días hay caja y la retira), herrería (talar pide 3 golpes sin filo, 2 afilado y 1 templado; el temple cobra $2.500, 6 piedras y 2 troncos), carpintería (armar una vitrina devuelve tablas de más y avisa «tu carpintería»). Sin errores en la consola. El juego sigue corriendo entre un paso y otro, por eso la prueba avanza «n días y una hora y media». Para correr un solo edificio: variable `HUMO_SOLO=canteria` (el lanzador sólo pasa un argumento).
- **Capturas a tamaño completo** (1366 × 768) en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\oficios\` (46): `01` a `03` el menú y el aviso sin plata; `10` a `13` cada edificio desde cuatro ángulos (tres cuartos, por adentro, por atrás y desde arriba); `20` a `30` cada uno haciendo lo suyo con E (con la nota en pantalla). Las miré.

**Lo que encontré y corregí en el juego real**: sin piso, el pasto alto tapaba todo lo que había adentro (ahora el piso es una plataforma y limpia el pasto); al armar una pieza el oficio devolvía material en silencio (ahora avisa); y mis pruebas de tiempo fallaban por minutos (el juego sigue corriendo).

**Razonado, no verificado a ojo**
- Los precios de la cerveza en la carta de la cantina ($260 y $290): probados en Node (`cartaDeHoy`), no abrí la cantina en el juego.
- El golpe de menos del temple: probado el número que da talar (3 → 2 → 1) y la fórmula de picar; no talé un árbol ni piqué una roca con el temple.
- Guardar y recargar una partida real con las obras (sólo ida y vuelta por `escribirPartida`/`leerPartida` en Node).
- Chocar caminando con la fragua, el horno, la olla o el mostrador (la física está probada en sus números, no la pisé).
- Fluidez en la 4600G: no hay nada por cuadro más que el aviso de siempre, y la geometría no pasa de 980 triángulos por pieza (la mediana del juego es ~250: son piezas grandes, pero se arman una vez y son estáticas). No medí fps.

**Lo flojo**: la **cantería** es la que peor se ve (gris sobre gris, el trípode es lo único que se lee); el fondo de la tienda y el de la carpintería son una pared lisa; por adentro, con el techo y las sombras, todo queda oscuro y de bloques; son piezas rectas y de caja (como el resto del juego, pero se nota que son ocho de golpe). Las que más tienen para mirar son el telar, la panadería y la herrería.

## Lo que NO quedó

- **Barriles y quesos no se venden en la trochita ni en la feria**: sólo Lucrecia y Ercilia los pagan al retirar (decisión 3: habría que sumarlos a `BIENES`).
- **La tienda no deja elegir qué dejar** (decisión 7) y no tiene pantalla de ventas.
- **Sin entradas en la guía (F1) ni en el cuaderno** para los ocho (ni sonido propio: usan el de juntar y encender).
- **Sin textos en inglés** (regla del usuario) y sin mando.
- **No están en el Desafío** (son `soloRelax`, como el lujo).
- El **temple** es un solo escalón y no cambia el filo de la aldea; un segundo (por ejemplo un pico de acero) sería la continuación natural.
- No hice un ahumadero grande ni una sala de conservas: ya hay colmena, ahumadero y fuego de dulce a mano, y no encontré una función que no los pisara.
