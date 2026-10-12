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
