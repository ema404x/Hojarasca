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
