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
4. **Se ve mal: el fuego del hogar del refugio ardía delante de la boca, sobre el piso** (`casa-detalles-mundo.js`). El hogar es un bloque macizo con la boca pintada; ahora tiene una **boca de verdad hacia adelante**: dos jambas de piedra, el dintel y el techito tiznado, delante de la cara del hogar. El fuego, los leños y la pava quedan adentro, sin tocar `estructuras.js`. Las jambas frenan (dos círculos de choque). Antes `f-s-sillon-sentado.jpg`, después `g-s-sillon-sentado.jpg`.
5. **Molesta: la E de una puerta salía mirando otra cosa** (`puertas.js` `mirada`, `main.js` `puertaCerca`). La puerta de la E era la más cercana a 3,2 m, mirases donde mirases: apuntando desde afuera al marco de la ventana del refugio, se abría la puerta. Ahora es la que tenés adelante, con la vista (en planta) pasando por su vano (medio ancho + 0,4 m); parado en el vano mismo (a menos de 0,9 m) vale cualquier vista. Vale para todas las puertas, portones y postigos del juego. Visto en partida real: de frente, en diagonal y en el vano, «Abrir la puerta del refugio»; de espaldas, nada; al marco de la ventana, ya no. `puertas.cerca` queda igual para lo que la usa por cercanía (golpear puertas, la llave de la luz, la Historia).

## Revisado y bien (sin cambios)
- **La mochila objeto por objeto** (partida real, sección `mochila`): cada ranura elegida con su número, tirada con V y vuelta a juntar con la E. Cámara («La cámara no se suelta»), caña, linterna, yerba, troncos, tablas, piedra y pan casero: se tira de a uno y vuelve lo mismo; nada se pierde ni se duplica. **Comer** el pan con U: 2 → 1.
- **La colmena** con 2 frascos: «Sacar la miel (2 frascos)» → miel 2 en la mochila, y después «Mirar la colmena». **El gallinero**, dos días después: «Juntar huevos (10, el nidal está lleno)» → 10 huevos.
- **La pesca**: una trucha arcoíris de 34 cm queda anotada (cantidad y récord). Sin ahumadero no va a la mochila (es así desde la 2.3).
- **Una venta** en el puesto de cargas de la Aldea (con la trochita parada): «Huevos ×6, te dan $200». Plata 1.000 → 1.200, huevos 10 → 4, la caja del puesto 4.200 → 4.000. No se duplica ni se pierde.
- Lo guardado de la casa vuelve igual al cargar (Relax e Historia), con la hoja de la ventana abierta, el vidrio escondido, el fuego, las velas, el baúl y el cajón como estaban, y sin humo con el hogar apagado.
- Silla y sillón del refugio: no se mueven sentado, se levanta con W o S sin atravesar la mesa ni el hogar.
- En el Desafío no hay casa (`casa` undefined, ni la bomba ni los avisos).
- Los interiores del refugio, el Puesto Alto y las tres casas armadas: nada flotando ni atravesado en las capturas.

## Anotado (no se cambió, y por qué)
- **Historia, capítulo 1**: adentro del refugio antes de abrir con la llave de Eusebio, la E es «Abrir con la llave de Eusebio» (la entrada de la Historia va primero, a propósito); y a mitad de una escena no se guarda (4.14.0), así que lo que tocás en la casa durante una escena se guarda en el próximo guardado. Es de diseño.
- En el Desafío, «El perro marca algo cerca» sale cerca del refugio (de la zona A: el perro).
- **No visto a ojo**: la pesca con la caña de verdad (lanzar y que pique; la presa se probó con `atrapar`), la granja grande (vacas, ovejas, huerta) y la venta en el almacén de Ercilia y en la feria.
- La pava queda con el pico a unos 3 cm de la jamba derecha de la boca.
- `jugador.js`: el bloque del choque quedó dentro de un `if` sin volver a sangrar las líneas (hay pruebas que buscan esas líneas exactas).

## Pruebas
- Nueva `pruebas/verificar-4-31-1-b.mjs` (en `verify:pasos`): 24 comprobaciones (el jugador de verdad sentado en el cuerpo del sillón; la lista de muebles de la casa sin la alacena de la cocina y sin romperse en el Desafío; la vista del sillón que llega al fuego y `sentarEnLaAldea`; la puerta que mirás con `puertas.js` de verdad; la boca del hogar con sus choques) y **14 mutaciones, todas atrapadas**.
- Prueba vieja ajustada a propósito: `verificar-4-31-0-a.mjs` pedía «al menos 4» círculos de choque en el refugio; ahora hay 9 y pide al menos 7 (si no, su mutación «el baúl no frena» ya no se atrapaba).
- Las **pruebas de `verify:pasos` que leen `main.js`, `jugador.js`, `casa-detalles` o `puertas`**: las 312, en verde. Cuatro fallaron sólo en paralelo: tres pasan de a una, y `verificar-3-7-2-granja` midió 1159 ms al crear la granja con la PC cargada (es de tiempo, no un bug: de a una pasó dos veces seguidas). Se corrió con la PC ocupada por las pruebas en paralelo.
- `node armar.mjs` al día.
