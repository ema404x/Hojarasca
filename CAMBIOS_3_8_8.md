# Hojarasca 3.8.8 — La escalera de casas

Hasta ahora las casas prefabricadas para vivir eran dos: la casilla de tablas (4,4 × 3,6 m) y el puesto de troncos
(5,2 × 4,2 m). Ahora hay tres más, cada una más grande y con más cosas, para tener una progresión de tamaños.

## Casas nuevas (categoría Refugios, en el Relax y en el Desafío)
| Casa | Medidas | Qué trae | Materiales (piedra / tronco / tabla) |
|---|---|---|---|
| Casilla de tablas | 4,4 × 3,6 | (la de siempre) | 10 / 16 / 44 |
| Puesto de troncos | 5,2 × 4,2 | (el de siempre) | 8 / 26 / 30 |
| **Cabaña de tablas y piedra** | 6,0 × 4,6 | zócalo de piedra, hogar con chimenea, 3 ventanas, cama, mesa con banquetas, repisa | 24 / 22 / 58 |
| **Casa con galería** | 7,8 × 5,6 | galería techada con baranda y escalón, 5 ventanas, hogar, 2 camas, mesa y alfombra | 32 / 33 / 100 |
| **Casona de dos cuartos** | 9,6 × 6,4 | sala con 2 hogares, galería, 8 ventanas, 2 dormitorios separados por tabiques | 48 / 50 / 150 |

- Se levantan por etapas (cimientos y zócalo, piso de tablas, paredes y cerramiento, techo, hogar y terminaciones), como
  la casilla. Son habitables: adentro se duerme con **E**, abrigan y tienen confort.
- Se mueven con **Shift+Y**, se desmontan con **Shift+Supr** y las etapas se deshacen con **Retroceso**, como el resto.
- La tecla **T** tiñe paredes, aberturas y techo (el zócalo de piedra, el hogar y el vidrio no se tiñen).
- La galería cuenta en la huella (no se puede colocar con la galería encima de un árbol u otra obra) y cubre de la lluvia.
- La cama, la mesa, los hogares, los postes y las barandas chocan; los dormitorios de la casona se entran por su vano.

## La cama suelta
- **Cama de tablas** (Mobiliario, ambos modos): 1,0 × 2,0 m con cabecera, colchón, frazada y almohada. Es una pieza: se coloca,
  se gira con **R** y se mueve con **Shift+Y**. Duerme (como el catre) y abriga más (confort 4 contra 3). Pide 8 tablas y 2
  troncos (sin lana, para que se pueda hacer también en el Desafío). Choca con su tamaño real.
- El **techo a dos aguas modular ya existía** («Techo modular 3×3», con Shift+Y se mueve): no hizo falta agregar otro.

## El aviso del próximo vecino, el reloj y el almanaque
Pedido del usuario después de jugar en modo libre: el juego no explicaba nada (la aldea sólo decía en la ficha del cuaderno qué
faltaba para el próximo vecino) y la hora y el día sólo se veían en el menú de pausa.
- **Aviso del próximo vecino** (`aldea.js: avisoProximoVecino`, usado en `aldea-gente.js`): al abrir un local y cada vez que cambia lo
  que falta se muestra una nota: «Para que venga el próximo vecino faltan N anotaciones» (con quién viene y que se anota lo que ves en
  el valle), «Ya puede venir» (baja de la próxima trochita), «Primero hay que terminar la obra», «Hay alguien esperando en el
  andén» o «Viene en unos días». Siempre dice lo que falta de anotaciones primero (antes, el día de la apertura, decía sólo «unos
  días»). No se repite lo mismo cada día.
- **Reloj comunitario de la plaza**: un poste con una caja de dos esferas, al lado del mástil. Con **E**: la hora, el momento del día
  y el día de la semana.
- **Almanaque comunitario de la biblioteca**: una hoja de pared a la izquierda, entre la ventana y el estante. Con **E**: el día, la
  fecha del año del juego, la estación, la luna, los próximos cumpleaños y fiestas, y lo que se repite cada semana (cuentos del
  domingo, baile del sábado, club de lectura). Ninguno de los dos le gana a la charla con un vecino al lado (queda en el menú de la
  charla).
- **Reloj de bolsillo y almanaque de pared, propios**: se cambian en el almacén (3 cantos y 2 plumas; 2 piñones y 5 ramitas, una
  vez cada uno, al final de la lista). Muestran la hora y/o el día y la estación en una línea arriba a la izquierda de la pantalla
  (no en el Desafío). Con los de la aldea no hace falta tenerlos: dicen lo mismo.
- Módulo puro `src/reloj-almanaque.js` (los textos y la línea del HUD), inglés en `idioma-en-s.js` (el glosario del juego manda:
  «piñones» y «trochita»).
- Prueba nueva `pruebas/verificar-3-8-8-reloj.mjs` (350 verificaciones) y el helper `pruebas/ayuda-three.mjs`, que presenta el
  `three` del juego a Node: las pruebas nuevas corren sin `node_modules`. La de las mecánicas (`verificar-3-6-mecanicas`) se
  actualizó con los dos avisos nuevos.
- Al probar apareció que el primer lugar elegido para el reloj tapaba el punto de la soga del mástil (la prueba de la plaza lo
  atrapó): se pasó al otro lado del mástil.

## La Cueva de las Manos vuelve (y ahora es una gruta, en la estepa, sin escalera)
Pedido del usuario: el alero del arriero (la ex Cueva de las Manos) era muy cuadrado y de diseño malo. Decisiones: **diseño C, la gruta
redonda**; **sólo las manos** (se saca la historia del abuelo de Martín); **manos en negativo**; **en la zona más árida, junto a los
pastizales y las llanuras**; y **sin escalerilla** («la hace ver artificial»).
- **La gruta** (`estructuras.js`): en vez del techo y los muros de cajas rectas, una bóveda de unos 170 bloques redondeados y abollados
  (siete anillos, una corteza de afuera, la coronación con liquen seco, bloques enterrados que sostienen el conjunto). Unos 14.000
  triángulos. El borde de adentro deja el mismo espacio y las mismas paredes de choque que antes.
- **El lugar**: en la **estepa** (aridez ≥ 85 %, hacia el este, donde el bosque se abre y termina), **en un llano** (pendiente ≤ 0,12; del
  frente al fondo el terreno sube a lo sumo 45 cm), lejos del arroyo y de la vía, sin agua cerca. Hoy queda en (307, 8). El **sorteo no
  cambia** (seis mil vueltas con dos `r()` cada una y las mismas piedras sueltas y fogón): sólo cambia cuál sitio sirve, así el resto
  del valle queda donde estaba.
- **Sin escalerilla**: se sacó la cornisa de caja y los dieciséis peldaños. Se entra caminando: el suelo de adelante, un umbral de lajas
  planas y desparejas a ras del terreno (tope a 11 cm) y el piso de arena de adentro (34 cm), con piedras irregulares en su borde. Sólo
  hay dos pisos de choque (antes, 18).
- **Las manos** (`dibujarPared`): siluetas de manos izquierdas (casi todas) con cuatro dedos separados y el pulgar, el pigmento soplado
  abrazando el contorno (rojo, negro, ocre y blanco), repartidas sin orden y a veces superpuestas, más los guanacos y una hilera de puntos
  rojos. El azar es propio y fijo: la pared es siempre la misma.
- **Se sacó la historia de los arrieros**: `alero-arriero.js`, el menú de Martín, el estado `progreso.aleroArriero` (una partida vieja que
  la traía se carga igual, el campo se descarta), la herradura, la pirca, el fogón renegrido, los nombres tallados y las dos pruebas de
  Electron que la jugaban (`humo-3-8-6-alero.cjs` y `fotos-alero-384.cjs`).
- Los textos de la cueva (cuaderno, visitante, cita, foto, inglés) vuelven a ser los de la Cueva de las Manos; la pista del cuaderno dice
  ahora que está en la estepa, al este.
- Pruebas: `verificar-3-8-8-cueva` (en la estepa, llano, sin agua, sin escalones, mismo lugar siempre; arma el valle de verdad),
  `verificar-3-8-4-alero-sonido` (ahora comprueba la cueva y que no queden rastros de la historia), `verificar-3-8-6-relax`,
  `verificar-3-8-7-mundo` e `implacable-rc4` al día.
- Falta verla en el juego (la luz, la textura de la roca, el sonido adentro, que se entre sin trabarse) y que la historia de Martín
  haya quedado fuera sin dejar opciones sueltas en su charla.

## Cómo está hecho
- `src/planos-casas.js`: una fábrica de casas (`casa()`) con la geometría de las cuatro etapas, la medida y lo que lleva cada
  una; la física por etapa sale de `fisicaCasa(k)`.
- `src/construccion.js`: suma los planos después de la casilla, aplica `fisicaCasa(k)` una vez por etapa y suma la galería a
  `cubiertasLluvia`.
- `src/idioma-en-s.js`: el inglés de nombres, textos y etapas.
- Prueba: `pruebas/verificar-3-8-8-casas.mjs` (en el gate): escalera de tamaños y costos, las cuatro etapas sin números
  rotos (en llano y en pendiente), nombres de etapa para el teñido, huella de la galería, física con el motor real (se entra
  por la puerta, no se atraviesan las paredes, la cama, la mesa, los hogares y los postes frenan, el tabique del medio separa
  los dormitorios) e inglés.

## Mobiliario: 31 piezas nuevas (elegidas por el usuario)
Todas son piezas sueltas de la categoría Mobiliario, sólo en el Relax, con materiales que existen (tabla, tronco, piedra, lana) y dibujadas con madera y piedra.
- **Primera tanda (17, `src/planos-muebles.js`):** baúl, mesa de luz, ropero, cuna; sillón, mesa larga de comedor, aparador, librero; mesada con pileta, barril de agua, escritorio, perchero y botas; reloj de pared, almanaque de pared (se usan con E y dicen lo mismo que los de la aldea), cuadros, cortinas y planta en maceta.
- **Segunda tanda (14, `src/planos-muebles-2.js`):** cama doble y litera (se duermen: confort 5 y 4), tocador con espejo, bañera de chapa con biombo; mecedora, vitrina, mesa ratona, hogar de piedra con repisa; banco de carpintero, tonel con barricas, colgador de hierbas y chorizos; guirnalda de luces, telar con rueca y hamaca paraguaya.
- Lo que se cuelga de la pared (reloj, almanaque, cuadros, cortinas, guirnalda) no choca; el resto tiene su física con los mismos límites que lo que se ve.
- Pruebas: `verificar-3-8-8-muebles.mjs` y `verificar-3-8-8-muebles-2.mjs` (catálogo, geometría dentro de lo que dicen medir, física, inglés y reglas de siempre).
- Honesto: baúl, barril, mesada y escritorio no guardan nada ni dan agua; no se puede uno sentar en lo construido (sillón, mecedora, hamaca); el hogar y la guirnalda no dan luz ni fuego de verdad; el cuadro no muestra fotos del álbum. Nada de esto se vio en el juego real.

## Arreglo: no se podía entrar al taller del tren
Un poste interior del frente del galpón (x 3,02) caía a 2 cm del eje de la puerta chica (x 3,0). Con su choque de 12 cm y el cuerpo del jugador (35 cm), el paso útil quedaba en 30 cm y la escalerita terminaba contra un poste invisible: no se podía entrar. Ahora ese poste no se dibuja ni choca (la cabriada sigue sostenida por las vigas). Prueba nueva en `verificar-3-7-3-taller.mjs`: se camina del pie de la escalerita al banco con el mundo de colisiones real (falla sin el arreglo). Las paredes se barrieron con 1.500 recorridos desde adentro y 600 desde afuera: no se pasa por ninguna, salvo la puerta chica y el portón abierto. No se encontró ninguna causa de atravesar piso o paredes: si sigue pasando, hace falta saber dónde.

Segundo arreglo del taller: **la caída en el portón** (el que entra por la vía). El terraplén caminable del desvío medía 1,9 m, pero la boca del portón mide 2,8 y el balasto que se ve, 2,3 o más; y la zorra, parada sobre los rieles, empuja al que viene por el centro hacia el costado. El cuerpo se salía del borde justo en la entrada, caía al terreno (1,2 m más abajo) y quedaba bajo el piso del galpón. Ahora el paso mide 2,3 m y 2,9 en los últimos 4 m, como la boca. Prueba nueva: hay piso en todo el ancho del portón. Con el choque de la zorra no se pasa por el centro de los rieles: se rodea por el costado.

## Arreglo: el arroyo y la cascada «bugueados»
Eran tres defectos distintos (se midieron y se miraron en una vista previa del valle de verdad, antes y después):
1. **Cinta del agua rota en las vueltas.** El arroyo era una sola tira con dos vértices por punto. En las vueltas cerradas del cauce (16 puntos, radios de 2 a 5 m con una cinta de 5,5 a 7,5 m de semiancho) el lado de adentro se cruzaba y esos triángulos quedaban de espaldas y se descartaban: cortes rectos y dientes de sierra en el agua. Ahora cada tramo es su rectángulo y las vueltas llevan un abanico (`src/cinta-arroyo.js`, sin THREE).
2. **Tramo seco de 14 m.** El terraplén de la vía rellenaba el lecho del arroyo aguas abajo del puente (a 18 m o más de él, fuera de la zona protegida): el agua quedaba hasta 4,5 m por debajo del suelo y el arroyo desaparecía entre dos pedazos. Ahora el terreno no sube sobre el cauce y su orilla (`src/terreno.js`). **Cambia el relieve en ese cruce:** la caché del valle se invalida sola.
3. **La cascada.** Se salteaban dos tramos de cinta (el escalón y el primero de la poza), así que el pie de la caída quedaba seco; la cortina era más angosta que el cauce y de bloques; la espuma era un disco liso. Ahora hay poza hasta la base de la cortina, la cortina cubre todo el labio, los hilos de agua son suaves (con espuma arriba y abajo) y la espuma del pie se deshace hacia afuera.
### La cascada, más realista («parece sacada de lego»)
Era un plano vertical liso con un disco y puntitos. Ahora (`crearCascada` en `src/agua.js`): una cortina **curva** que sale del labio en caída libre (la distancia horizontal crece con la raíz de lo caído), de 36 × 20 vértices, con hilos de agua suaves que aceleran al caer, agua clara arriba y aireada y blanca abajo, bordes deshilachados; en la poza, espuma que se deshace con ondas que se abren; una **bruma blanda** (nubecitas con sprite suave que suben y se van) y gotas finas; y **~40 rocas** (elipsoides abollados con normales suaves, grises y pardas, con musgo arriba) en las orillas del labio, a los lados de la caída y en la poza, que tapan el corte recto del escalón del terreno. Todo es dibujo: no cambia el relieve ni las colisiones. Se miró en la vista previa, no en el juego (la luz de noche y la niebla dependen de los uniformes del juego).

Prueba nueva: `verificar-3-8-8-arroyo.mjs` (la cinta sana y sin triángulos de espaldas, la poza, y el valle de verdad: ningún punto del eje con el lecho sobre el agua, y la vía sin quedar en el aire; falla sin el arreglo). La naciente (los primeros 12 puntos) sigue seca a propósito. No se vio en el juego; la vista previa fue con un terreno de colores simples.

## La casa de té ya no está vacía por dentro
Era sólo piso, paredes y una luz, aunque la galesa (Ceinwen) cocina y duerme adentro (los puntos `cocina` y `cama` de `aldea.js`). Ahora (`amueblarCasaTe` en `src/estructuras.js`): un **hogar de piedra** contra la chimenea que ya salía por afuera (con leños, brasas, repisa con candeleros y tetera), un **sillón** junto al fuego con una manta y un cesto de leña, **dos mesas** con servicio de té, torta y cuatro sillas, la **cocina económica** de hierro con su tubo, pava y ollas, una **mesada con pileta** y estantes con tazas y latas de té, la **cama** de la galesa en la esquina con su cuadrito, un **aparador** con platos azules y blancos, una **alfombra**, tres **faroles** colgados (a más de 2,25 m del piso) y **cortinas** con macetas en las ventanas. Las cinco sillas (el sillón y las cuatro del salón) son asientos de verdad. El mobiliario frena con las colisiones de siempre; se llega a todo desde la puerta, y los puntos de la galesa quedan libres.
**Más galés y más casa de té** (pedido del usuario): las mesas llevan mantel de encaje, torre de tortas (scones, welsh cakes y torta negra), tetera con cubretetera tejida, tazas con platito de sauce, dulce, azucarera y flores; en la mesada, tortas bajo campanas de vidrio y la lata de té; la pava y las ollas, de cobre; el aparador, con platos de sauce y jarras de cobre; la cama, con cubrecama de retazos (patchwork galés); y lo galés: la bandera del dragón rojo (Y Ddraig Goch), la carta del té en la pizarra (*Té Galés / Te Cymreig*: torta negra, bara brith, tortas galesas, scones con dulce), los cucharones de amor (llwy garu) tallados, un arpa galesa (telyn) en la esquina, el sombrero alto galés y el chal rojo junto a la puerta, cortinas de encaje, y el cartel «Croeso · Bienvenidos» sobre la puerta. Los carteles de adentro son planos con textura dibujada en un lienzo.
### La parte de afuera de la casa de té
`exteriorCasaTe` en `src/estructuras.js`: un **mástil** al frente (a la derecha) con la **bandera argentina arriba y la galesa más abajo** (la nacional va más alta; la galesa, algo más chica); **canteros** de tablas a los dos lados del camino con lupinos, margaritas y geranios; **macetones** de barro en las esquinas de la galería y junto al escalón; un **camino de lajas** del escalón hacia el sendero; la **pizarra** de caballete con la carta del día (la misma de adentro); **faroles** colgados sobre las dos mesas de la galería y **canastos colgantes** con flores en los postes; una **mecedora** en el rincón de la galería (es un asiento de verdad). De noche, una luz cálida de la galería (`luzGaleria`, que main.js prende con las demás). El humo de la chimenea ya salía (casa-viva.js): no se tocó. Lo que frena (mástil, canteros, macetones, pizarra, mecedora) tiene su choque y el camino hasta la puerta queda libre (la prueba camina por el frente y por los lados).

Prueba nueva: `verificar-3-8-8-casa-te.mjs` (el valle de verdad con el mundo de colisiones real: se entra y se llega al fuego, las mesas, la cocina y el aparador). No se vio en el juego (vista previa con una luz propia); en el juego, la luz de adentro (`luz`/`interior`) sale de noche.

## Las banderas flamean con el viento y el clima
Todas las banderas de afuera (la de la plaza, la escuela y la seccional de la aldea, y las dos del mástil de la casa de té) usan el mismo material (`src/bandera-viento.js`), que mueve el paño en el vertex shader con lo que ya manda el clima (`uViento`, que incluye las rachas, y `uLluvia`) y el tiempo:
- **calma:** el paño cuelga del mástil, más corto y con pliegues blandos que casi no se mueven;
- **brisa:** se levanta y ondula con una onda que viaja del mástil a la punta;
- **viento fuerte o temporal:** se tiende, aletea rápido y se agita más con cada racha;
- **lluvia:** el paño se moja: pesa, cuelga un poco más y aletea menos;
- y se **orienta con el viento** (el mismo rumbo que el pasto), con un vaivén lento que se afloja cuando hay poco viento.
En la aldea la onda ya no está pintada en la malla (el paño tiene más cortes, 14 en vez de 6) y la bandera se sigue izando y arriando como antes. La bandera galesa de la pared de adentro de la casa de té es un cuadro: no flamea. Prueba nueva: `verificar-3-8-8-banderas.mjs` (rumbo, atributos del paño, material, orientación y conexión de todas); el flameo mismo se miró en una vista previa con calma, brisa, temporal y lluvia, no en el juego.

## Economía, Fase 1: el peso y la billetera (ver `PLAN_ECONOMIA.md`)
- **`src/economia.js`** (módulo puro): saldo en pesos, libro con los últimos 120 movimientos (día, monto, motivo, de quién) y una sola puerta para cobrar y pagar (`cobrar`, `pagar`). Sólo en el Relax; sin saldos negativos ni decimales; con techo.
- **La yerba dejó de ser la moneda.** Lo que ya tenías se convierte a pesos al cargar la partida, **una sola vez**, a **$100 por yerba** (queda anotado en el libro). La yerba sigue existiendo como mercadería (mate, cocina, regalos, trueque del almacén).
- **Todo lo que pagaba en yerba paga pesos:** el puesto de cargas (compras, ventas y fletes: los precios de `comercio.js` siguen en unidades y se pasan a $100), la feria (poncho $1.600, pan $1.000, guiso $800), los concursos, la revista ($1.600), y en la aldea la panadera ($200 los tres panes), la maestra ($400 por mandado), la guardaparque ($100 por avistaje) y la herbolaria ($100 los frutos).
- **La billetera en pantalla:** una línea en el HUD con el saldo (y lo que entra o sale, unos segundos: +$400, −$200) y, en la pausa, «Billetera y movimientos» con los últimos 14 renglones.
- Lo que sigue siendo yerba (regalos de los vecinos, el kilo de Ercilia, el trueque de frutas por yerba de la cocina) no se tocó: ahora es mercadería.
- Pruebas: `verificar-3-8-8-economia.mjs` (100 verificaciones) y los ajustes de las pruebas de la aldea y los concursos. No se vio en el juego.

## Economía, Fase 2: el mercado (ver `PLAN_ECONOMIA.md`)
- **`src/mercado.js`** (módulo puro): cada puesto tiene **existencias** de cada cosa (hasta 14 lotes) y una **caja** de pesos ($4.000 a $8.000 de tope, según el pueblo). Produce lo del pueblo, gasta lo que necesita, vuelve de a poco a su nivel de siempre y la caja se repone $700 por día. Sale de la fecha y del nombre de la parada (dos partidas ven lo mismo) más lo que vos hiciste; al volver después de días se simula hasta un año. Vive en `progreso.comercio.mercado` (saneado, y se va con la parada si cambia de nombre).
- **Oferta y demanda:** el precio se multiplica por un factor de 0,85 a 1,30 según lo que le sobre o le falte al puesto (`factorDe`). Sin existencias no te vende; con el puesto lleno, o sin plata en la caja, no te compra.
- **En el panel del puesto:** cada cosa dice cómo está (escasea, sobra, se les agotó, ya tienen de sobra, lo pagan bien/poco), arriba se ve la caja del puesto y un cartel «hoy pagan bien: …».
- **Ajuste con simulador:** un revendedor goloso (una ruta por día, 6 operaciones) saca de media poco menos que un jornal ($1.500); por eso el rango del factor es corto. Con 0,7 a 1,7 sacaba más del doble.
- Pruebas: `verificar-3-8-8-mercado.mjs` (60 verificaciones). No se vio en el juego.

## Economía, Fases 3, 4, 3b, 5 y 6: trabajos, pedidos, banco, propiedad y aldea viva (ver `PLAN_ECONOMIA.md`)
Todo vive en `progreso.negocios` (módulo puro `src/negocios.js`, saneado al cargar; el Desafío no lo tiene) y funciona sólo en el Relax.
- **Fase 3 · Jornales** (`src/trabajos.js`): los veinte pobladores tienen una changa de su oficio. Un jornal por local por día y **dos por día en total**; pagan de **$700 a $1.300** de base, **+10 % cada tres jornales** hechos en ese oficio (hasta +50 %) y según la demanda del pueblo. El sueldo sale de la caja del local: si no tiene, hoy no puede pagarte. No gasta tiempo del reloj (con la hora de tu reloj no se puede saltar horas): el costo es el cupo diario. Aparece cuando el vecino ya no tiene otro servicio para ofrecerte (`servicioDe` en `aldea.js`).
- **Fase 4 · Pedidos** (`src/pedidos.js`): cada local te pide algo concreto cada tres días (una «ventana»): una cantidad de una cosa del valle, que se entrega al hablarle. Paga entre **10 y 25 % más** de lo que vale (según tu reputación con ese vecino) y 5 % más si lo entregás el primer día. Dos entregas por día. La reputación sube con cada entrega (niveles a las 3, 8 y 16): más cantidad y cosas mejores. Un pedido sin entregar vence sin castigo.
- **Fase 6 · La aldea viva** (`src/aldea-viva.js`): cada local tiene su **caja** ($3.000 al empezar, tope $12.000); todos los días vende, gasta y repone. A un local al que le pedís un jornal todos los días se le acaba la plata. **Eventos del día** (tren demorado, fiesta, helada, buena cosecha, obra grande) mueven ±20 % los precios del puesto de cargas y la demanda del pueblo; el invierno encarece la leña. Las cuentas se ponen al día hasta un año si volvés después de mucho.
- **Fase 3b · El banco del pueblo** (`src/prestamos.js`, `src/banco-mundo.js`): edificio de piedra y cal con galería de columnas, reloj en el tímpano, mostrador de lado a lado con reja de bronce, caja fuerte y el cuarto del gerente atrás (`aldea-arquitectura.js`, `bancoDelPueblo`), en el pasaje de las Chacras, **desde el día 1**. Lo atiende **Amadeo Lezcano**, el gerente (vecino nuevo: casa, rutina de lunes a sábado, charla, vecindad, voces, truco y vestuario propios; los domingos descansa). Hablarle abre el **mostrador** con cuatro solapas: **Préstamos** (uno a la vez; tope $3.000 al principio y hasta $15.000 con la confianza del banco; **2 % por día** sobre lo que debés, un año son 12 días; plazo de 6, 9 o 12 días; si vence, el interés pasa al 3 %, el banco pierde confianza y no presta hasta que saldes; **sin embargos**), **Abastecimiento** (el banco necesita una cantidad de una cosa y la paga **de 25 a 40 % por encima del valor**, un pedido cada dos días), **Casas y alquiler** y **Mi puesto**. «Conseguirle cosas a muy buen precio» se interpretó como ese abastecimiento (**a confirmar**).
- **Fase 5 · Propiedad** (`src/propiedad.js`): levantar las casas prefabricadas cuesta, además de los materiales, **terreno y mano de obra**: cabaña $36.000, casa con galería $66.000, casona $110.000, repartido en las cuatro etapas (la primera lleva el terreno). El lote de la Loma tiene su escritura de $8.000. Las casas terminadas se pueden **poner en alquiler** ($300, $500 y $800 por día, cuarto ocupado el 85 % de los días, según la demanda). El **puesto propio en la feria** ($6.000) vende en consigna hasta dos lotes por día al valor de la plaza menos 10 %; la caja se retira en el mostrador.
- **Pulido (Fase 7)**: diccionario inglés `idioma-en-t.js` (mercado, jornales, pedidos, eventos, banco y casas; las charlas largas de los vecinos sobre dinero quedan en castellano); `herramientas/simulador-negocios.mjs` (cuánto rinde cada ingreso y cuántos días lleva cada casa); pruebas `verificar-3-8-8-negocios.mjs` (566) y `verificar-3-8-8-banco.mjs` (107: sitio, arquitectura, gerente y mostrador con un DOM de mentira, donde apareció un defecto real del abastecimiento).
- **Balance medido** (jugador goloso que hace todo, 240 días): jornales ≈ $2.700 por día, pedidos ≈ $330 y abastecimiento ≈ $200 de ganancia; en total ≈ $3.200 por día → la cabaña (con materiales) en ≈ 15 días (**1,2 años del juego**), la casa con galería en ≈ 26 (2,2 años) y la casona en ≈ 43 (3,5 años). El alquiler se paga solo en unos 140 a 160 días: es un ingreso de largo plazo. Un préstamo de $3.000 a un año devuelve $3.810.
- Guardas viejas de las pruebas que rechazaban «economía» en los textos de los vecinos se actualizaron (ya hay pesos, banco y gerente); la religión sigue prohibida.
- Se agregaron cuatro cuentas en las pruebas de la aldea (doce edificios al empezar, diez vecinos). La mayor parte **no se vio en el juego**: hay que recorrer el banco (luz, escala, que el gerente atienda en su lugar), el mostrador con el mouse y las casas con precio.

## Defecto que apareció al probar
La casona tenía una cantidad impar de postes en la galería y uno caía justo en el centro, delante del escalón y de la puerta.
Ahora la cantidad es siempre par.

## Pendiente (hay que verlo en el juego)
- No se pudo abrir el juego en esta sesión: las casas se miraron en una vista previa propia (Three.js, desde varios ángulos
  y en corte) y se probaron en Node. Falta recorrerlas en la partida: cómo se ven con el terreno y la luz del valle, y el
  confort que marca el HUD adentro.
- Los precios (materiales) son una primera propuesta: ajustarlos jugando.
- Falta ver cómo se ve la cama suelta dentro de las casas nuevas (que no se encime con la cama que ya traen).
- Falta ver en el juego el reloj de la plaza y el almanaque de la biblioteca (la luz, la posición, que no tapen el paso) y que la línea del HUD no choque con otra cosa en 1366×768.
- El almacén tiene ahora 18 cambios (dos páginas): confirmar que se llega al reloj y al almanaque con Tab.
