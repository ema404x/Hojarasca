# 4.11.5 · el carro del caballo (rama `v4115-carro`, sale de `main` = 4.11.4)

El usuario eligió el carro: algo que se construye, se engancha al caballo y suma casillas de carga. Hasta la 4.11.4 `CASILLAS_CARRO` valía 0 de gancho
(«el carro no existe todavía»). Ahora existe. **No se subió la versión** (sigue 4.11.4 en `package.json`), no se tocó `main`, no hay etiqueta ni zip.

## Qué se hizo

- **Se fabrica en tu carpintería** (el banco de carpintero que se construye desde el menú de obras, $22.000). Con la E en el banco: **14 tablas, 4 troncos y
  $6.000 de «hierro»** (llantas, ejes y herrajes: en el juego no hay hierro como material, así que va en pesos, anotado en la billetera como
  «Hierro para el carro del caballo · Tu carpintería»). El aviso del banco dice qué pide, qué falta o cómo va. Si falta algo no se gasta nada ni se hace nada
  a medias. Una sola vez: con el carro hecho, la E sólo cuenta cómo va. Sin caballo (o en el Desafío) el banco dice lo de siempre (la madera que sobra).
- **Hecho, queda en tu poder y arranca enganchado.** Se engancha o se desengancha en **Personalizar (F5) → Tu caballo → «Carro enganchado (+16 casillas montado)»**,
  el mismo lugar de las alforjas. Sin carro, esa pantalla dice dónde se hace.
- **+16 casillas sólo montado y con el carro hecho y enganchado** (`CASILLAS_CARRO = 16`). Suma con las alforjas: 24 + 12 + 16 = 52. A pie, o desenganchado, no suma.
  Sigue la lógica de `carga.js`: el Desafío sin límite; el tope por pila; si te bajás o lo desenganchás con más carga que casillas queda **sobrecarga** (no se pierde nada:
  sólo no se puede juntar más, como con las alforjas).
- **Pantalla de carga** (`carga-pantalla.js`): el desglose dice «24 de la mochila + 12 de las alforjas + 16 del carro» (o la parte que corresponda); a pie avisa «Montado con
  el carro suma(n) 16 más» / «con las alforjas y el carro suman 28 más». Las casillas del carro son una zona propia («Carro del caballo», color verde apagado). Con 52
  casillas el panel de la mochila tenía las filas de abajo tapando el pie: ahora las casillas se desplazan adentro (barra fina) y el pie queda a la vista.
- **Se ve detrás del caballo** (`caballo-mundo.js`): un carro de campo por código: piso de cinco tablas, baranda baja y postes, chasis, eje, **dos ruedas de rayos con llanta
  de hierro que giran con lo que anda**, dos varas hasta el balancín y una carga (dos bolsas y un cajón). Va **como un remolque**: el eje queda en la línea que lo une con el enganche
  (a 2,05 m), así rezaga en las curvas; se apoya en cuatro puntos del terreno (se inclina con la cuesta, no se hunde) y se acomoda para que la punta de las varas caiga justo en el
  enganche aun en una ladera. Parado al lado del caballo, se ve también. Tres mallas en total (el cuerpo fundido y las dos ruedas), una sola vez en la escena; desenganchado se
  oculta (no se desarma). Atado a las varas del sulky, en la jaula del tren o fuera de vista, no se ve; al volver aparece de una vez detrás del caballo.
- **Se guarda** en `progreso.personal.caballo` (`carro`, `enganchado`). **Migración segura:** una partida de antes no tiene esos campos y abre sin carro, igual que antes (24 / 36
  con alforjas); `enganchado` sólo vale si `carro` es verdadero; valores raros dan «sin carro». **Partida de versión más nueva:** sigue el sólo lectura de siempre (la versión viaja
  con la partida; la humo lo comprueba con un guardado «9.0.0»: se lee con su carro y no se pisa). **La partida nueva no hereda el carro** (se hizo con lo de la partida vieja):
  `empezarConReceta` (que usan «Empezar de nuevo» y «Empezar acá» en otra ranura) lo saca; el caballo, sus colores, nombre y alforjas pasan como siempre.

## Decisiones propias (el usuario no estaba)

1. **El costo:** 14 tablas + 4 troncos + $6.000. Es más que templar el hacha ($2.500) y menos que la carpintería que hace falta ($22.000), y el carro se paga solo en acarreo.
   El «hierro» va en pesos porque no existe como material. Es una sola constante (`CARRO` en `src/carro.js`) y se cambia ahí.
2. **Hace falta tu carpintería y tu caballo.** Es lo que se pidió («en la carpintería»); Tito no lo hace. No hay otra forma de conseguirlo.
3. **Enganchar y desenganchar es por «Personalizar → Tu caballo»**, como las alforjas, no por una tecla nueva (la tabla de la E no se tocó). Desenganchado, el carro se «guarda»: no queda
   tirado en el mundo (así no hay que guardar una posición ni protegerlo de que lo atraviesen).
4. **Hacerlo lo engancha** (lo normal es querer usarlo; si no, hay que ir a F5 para nada).
5. **El carro no pasa a la partida nueva** (decisión nueva; las alforjas y el resto de lo de «Tu caballo» sí).
6. **Enganche detrás de la cola** (1,25 m detrás del centro del caballo), sin tirantes ni arneses dibujados: el carro llega a la cola con el balancín. Es simple a propósito.
7. **Zona «Carro del caballo» después de las alforjas** en la mochila (el orden en que se llenan: mochila, alforjas, carro).
8. **Bug viejo que apareció** (ver abajo): `armar.mjs` sólo exporta el primer nombre de un `export const A = 1, B = 2`; por eso `CASILLAS_ALFORJAS` llegaba como `undefined` a `main.js` y a `personal-caballo.js`
   desde la 4.7 (el panel decía «+undefined casillas» y el aviso de la mochila a pie nunca nombraba las alforjas). Se separaron las tres constantes en `carga.js` (una por línea).
   Se arregló porque el carro dependía de lo mismo, y se agregó una comprobación para que no vuelva.

## Verificación

- **`pruebas/verificar-4-11-5-carro.mjs`** (en el gate con `sumar-prueba.cjs`): **156 comprobaciones**, con el three real, el terreno real (una pendiente y un llano), el guardado real y un DOM de mentira:
  `carro.js` (pedido, falta, estado, avisos); `carga.js` (la matriz montado/hecho/enganchado/alforjas, el Desafío, partidas viejas, 40 casillas de troncos con y sin carro: sobrecarga sin pérdida, no se
  junta, un trato que baja la carga entra); `carga-pantalla.js` (el desglose en todas sus formas, las zonas, los títulos, las marcas, el CSS); `personal-caballo.js` y `personal-partida.js` (saneo, el panel con y
  sin carro, el interruptor, la partida nueva sin carro, «Empezar acá»); `caballo-mundo.js` (distancia, enganche, ladera, rezago en curvas, ruedas, atado al sulky, fuera de vista, salto, reenganche sin sumar
  mallas, colores sin blancos); `main.js` con la función real (`usarCarpinteriaCarro`: cobra y descuenta, justo alcanza, falta tablas/troncos/plata/economía = nada cambia, no cobra dos veces; el aviso del
  banco; la E del banco; el HUD y el desglose de la mochila; las líneas del sulky); y el guardado (ida y vuelta, vieja, basura, versión más nueva).
- **48 mutaciones a propósito** sobre una copia del código (casillas, a pie, sin enganchar, sin haberlo hecho, desglose, zonas, títulos, costos, falta ignorando la plata, saneo, panel, partida nueva que hereda,
  distancia y enganche, hundido, sin inclinación, ruedas quietas, sulky, rezago, malla nueva en cada enganche, fuera de vista, salto, las tres cosas de la fabricación, mochila y HUD, tubo blanco, el CSS del
  desplazamiento y las constantes con comas): **las 48 hacen fallar la prueba**. (La primera tanda dejó pasar una —«el carro no mira al enganche»— y se agregó la comprobación del rezago en las curvas.)
- **Gate:** `npm run verify` de corrido: **305 pasos OK** (salida 0; el de la 4.11.4 tenía 304, se sumó `verificar-4-11-5-carro`). Durante el trabajo, `verify:paralelo` también dio 305 OK. Pruebas existentes: sólo se tocó una línea de `verificar-4-7-carga.mjs`, que fijaba «el carro (que no existe) 0»: ahora dice 16 a propósito.
- **Partida real** `pruebas/humo-4-11-5-carro.cjs` (Electron en el monitor externo, perfil propio, una sola instancia, con `-Visible` para las capturas): 64 pasos OK, sin errores de consola. Construye la carpintería con
  el menú y Y; sin lo que pide, la E dice qué falta y no gasta; con lo justo hace el carro (descuenta 14/4/$6.000, queda hecho y enganchado); a pie 24; montado 40 y con alforjas 52; el desglose y el contador reales
  de la mochila; el carro detrás del caballo (varas al enganche con error 0,0000 m), al trote, girando en círculo y en una cuesta (se inclina −0,12 rad, nada atraviesa el piso, ruedas que giran);
  «Personalizar → Tu caballo» con el clic en No y en Sí; desenganchado con 30 casillas encima: 24 de tope, sobrecarga de 60 troncos, ninguno perdido, no se junta más; bajarse: 24; recargar mantiene todo; una
  partida de antes abre sin carro; una de versión «9.0.0» se lee y no se pisa. **Capturas a tamaño completo, miradas** (están en una carpeta temporal, no en el repositorio): el carro parado, de cerca, al trote, en
  la curva y en la cuesta; la mochila con 40 casillas (30 ocupadas), con 52 (ahora con barra de desplazamiento y el pie visible), el panel «Tu caballo» y la sobrecarga sin carro.
  Se vio y corrigió: **un tubo del carro (eje, cubos y balancín) salía blanco** (se le pasó un material en vez de un color) y **la mochila de 52 casillas tapaba el pie del panel**.

## Lo no verificado

- **Ver el movimiento:** las capturas son fijas; cómo se siente el rezago del carro en una curva cerrada, el rebote de las ruedas y si «parece un carro» en marcha a 30/60 fps no se juzgó en movimiento.
- **Rendimiento del carro:** no se midió (son tres mallas y seis lecturas de altura por cuadro sólo con el carro a la vista; no se midió en la 4600G).
- **Sombras y la noche / la lluvia con el carro**, y el carro con otros pelajes y con el pelaje overo: no se miraron.
- **Un lugar con árboles o paredes cerca:** el carro no colisiona con nada (sólo se apoya en el terreno); atraviesa árboles y cercas como lo hace la cola del caballo. Al montar en un lugar estrecho el carro puede asomar dentro de una obra.
- **Subir el caballo a la jaula del tren y el sulky con el carro enganchado:** se prueba que el carro no se dibuja (lo comprueba la prueba de Node con las mismas condiciones que usa `main.js`), pero no se viajó en el tren ni en el sulky en una partida real.
- **Ventanas bajas:** la mochila de 52 casillas se desplaza adentro; se miró a 1366×768, no a 1280×650 ni con letra grande.
- **El panel «Tu caballo»:** el interruptor del carro queda abajo de todo (la pantalla ya se desplazaba por la letra); se encontró por código, no se miró si a un jugador le cuesta verlo.
- **El inglés:** no se escribió ni se tradujo (se hace al final).
