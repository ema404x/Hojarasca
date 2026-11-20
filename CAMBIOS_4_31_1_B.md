# 4.31.1 (B) · Cacería de bugs: el refugio, las casas, objetos y economía

Rama `v4311-b`, desde `main` = 4.31.0. 0 programas de shader nuevos, 0 luces, 0 claves de guardado nuevas.

## Cómo se buscó
- Inventario desde el código de lo nuevo de adentro (4.31.0 A, `casa-detalles*.js`): las 19 cosas del refugio, los 14 muebles armados que se usan, `progreso.casa` y la tabla de la E (`interacciones.js`: qué va antes y qué después de `casa`).
- Partida real nueva `pruebas/humo-4-31-1-b.cjs` (Electron minimizado, con el candado, perfil `perfil-4311-b`), con la **E y las teclas de movimiento de verdad**: sentarse y levantarse (W y S) en la silla y el sillón del refugio y en el sillón, la mecedora y el sillón de cuero armados; la alacena armada; la ventana desde afuera (al medio y a los bordes); guardar y **volver a cargar la página** con todo cambiado (ventana abierta, cortina corrida, hogar apagado, baúl/alacena/cajón abiertos, radio, libro y carta); el refugio por dentro desde las cuatro esquinas; el Puesto Alto; la cabaña de piedra, la casa con galería y la casona armadas, por dentro; de noche; en el **Relax**, la **Historia** (con Ultra) y el **Desafío**. Consola a errores: **sin errores** en las cinco corridas.
- Capturas en `%TEMP%\hx\b4311\` (antes: `s-*`; después de arreglar: `f-*`; Desafío `d-*`; Historia `h-*`; casas `k-*`; recarga `r-*`).

## Arreglado (por gravedad)
1. **Se ve mal / molesta: sentarte en tu sillón, mecedora o sillón de cuero armados te dejaba parado detrás del respaldo** (`jugador.js`). El asiento está adentro del cuerpo del mueble y el choque te sacaba 0,8 m en el primer cuadro: quedabas mirando el respaldo de cerca (captura `s-obra-sillon.jpg`). Ahora sentado no se choca (sentado no te movés; al levantarte volvés a la salida de siempre, que está afuera). Después: `f-s-obra-sillon.jpg` (sentado en el sillón, los apoyabrazos a los costados), distancia al asiento 0,05 m en los tres muebles.
2. **Rompe una función: la alacena armada perdió su E de la cocina** (`main.js`, `obrasCerca` de la casa). La entrada `casa` (4.31.0) va antes de las obras que trabajan, y su «Abrir la alacena» (una nota) le ganaba a la de la cocina («Mirar la alacena (N cosas)» / «La alacena está vacía», con lo que hay de verdad y cuántos). La alacena armada vuelve a ser de la cocina; las otras 13 cosas armadas siguen igual. Visto: «La alacena está vacía» en la partida real.
3. **Se ve mal: sentado en el sillón del refugio sólo se veía la chimenea de piedra** (el fuego quedaba abajo, tapado por el aviso). La vista baja al fuego (`pitch` del asiento en `casa-detalles.js`, lo pasa `casa-detalles-mundo.js`, lo usa `sentarEnLaAldea`; los demás asientos, como siempre). Antes `s-sillon-sentado.jpg`, después `f-s-sillon-sentado.jpg` (el fuego, la pava y la repisa).

## Revisado y bien (sin cambios)
- Lo guardado de la casa vuelve igual al cargar (Relax e Historia), con la hoja de la ventana abierta, el vidrio escondido, el fuego, las velas, el baúl y el cajón como estaban, y sin humo con el hogar apagado.
- Silla y sillón del refugio: no se mueven sentado, se levanta con W o S sin atravesar la mesa ni el hogar.
- En el Desafío no hay casa (`casa` undefined, ni la bomba ni los avisos).
- Los interiores del refugio, el Puesto Alto y las tres casas armadas: nada flotando ni atravesado en las capturas.

## Anotado (no se cambió, y por qué)
- **Historia, capítulo 1**: adentro del refugio antes de abrir con la llave de Eusebio, la E es «Abrir con la llave de Eusebio» (la entrada de la Historia va primero, a propósito); y a mitad de una escena no se guarda (4.14.0), así que lo que tocás en la casa durante una escena se guarda en el próximo guardado. Es de diseño.
- **Ventana del frente desde afuera, apuntando al marco**: la E dice «Abrir la puerta del refugio» (la puerta está a 2,2 m y su alcance es por cercanía). Es de la puerta, no de la casa.
- **El fuego del hogar arde delante de la boca**, sobre la losa: el hogar del refugio es un bloque macizo (choque) con la boca pintada; meterlo adentro pide rehacer el edificio (huella de `estructuras.js`).
- En el Desafío, «El perro marca algo cerca» sale cerca del refugio (de la zona A: el perro).
- No se recorrió en partida real la mochila objeto por objeto, la venta, la granja, la colmena ni la pesca: no hubo cambios de la 4.31.0 en eso y las 303 pruebas viejas que los leen siguen en verde. **No visto a ojo**.
- `jugador.js`: el bloque del choque quedó dentro de un `if` sin volver a sangrar las líneas (hay pruebas que buscan esas líneas exactas).

## Pruebas
- Nueva `pruebas/verificar-4-31-1-b.mjs` (en `verify:pasos`): 13 comprobaciones (el jugador de verdad sentado en el cuerpo del sillón, la lista de muebles de la casa sin la alacena de la cocina y sin romperse en el Desafío, la vista del sillón que llega al fuego y `sentarEnLaAldea`) y **8 mutaciones, todas atrapadas**.
- Las **303 pruebas de `verify:pasos` que leen `main.js`, `jugador.js` o `casa-detalles`**: todas en verde (dos fallaron sólo en paralelo, por las copias temporales de mutación de otras pruebas, y pasan de a una). No se tocó ninguna prueba vieja.
- `node armar.mjs` al día.
