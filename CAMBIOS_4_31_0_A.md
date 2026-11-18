# 4.31.0 (A) · Hojarasca detallista: adentro (el refugio y tus casas)

Rama `v4310-a`, desde `main` = 4.30.1. **0 programas de shader nuevos** (sólo el material de colores por vértice de siempre y el básico de dos caras de los vidrios), **0 luces nuevas** (la luz cálida, el relleno del día y el farol que ya tenía el refugio, con otra intensidad), una clave de guardado nueva (`progreso.casa`).

## Inventario (desde el código)
Lo que había en el refugio y se podía tocar: la puerta (abrir/cerrar), la cama (dormir), el banco de afuera y los troncos del fogón (sentarse), el tocadiscos de la mesa, el fogón de afuera (F). Lo que había y **no** se podía tocar: la mesa, el hogar de piedra (sin fuego), la estantería con frascos, las dos ventanas, el farol de la puerta (prendido solo de noche), la leña de adentro, la pila de afuera. En tus casas armadas se usaban el reloj de pared y de pie, el almanaque, la gramola, el espejo, la radio y las estufas (F); el resto de los muebles (sillón, mecedora, baúl, ropero, aparador, alacena, librero, mesada con bomba, barril…) era decorado.

## Qué se hizo (todo con la E de siempre; gana lo que mirás de frente y a mano)
En el refugio (cosas nuevas que se ven y se usan; `src/casa-detalles-mundo.js`):
1. **La lámpara de kerosén** de la mesa: «Prender/Apagar la lámpara». El tubo de vidrio brilla; de noche, la luz cálida del cuarto y la ventana vista desde afuera dependen de ella.
2. **El farol de la puerta**: «Prender/Apagar el farol de la puerta» (su vidrio y su luz, de noche).
3. **Las velas** de la repisa del hogar: «Prender/Apagar las velas» (llamita que tiembla; alumbran un poco).
4. **El hogar**: ahora tiene leños, losa de piedra y fuego en la boca. «Prender/Apagar el hogar». Prendido crepita (cerca), da algo de luz de día y humea por la chimenea; apagado, la chimenea del refugio no humea.
5. **La pava** en su trébede junto al fuego: «Poner la pava al fuego» → a los 22 s **silba** (la tapa baila y suena el silbido) → «Sacar la pava y cebar un mate» → «Cebarte otro mate» (2,5 min); sin el hogar prendido no calienta.
6. **La bomba de agua** afuera, contra la pared de la derecha, con su balde: «Bombear agua» → la manija sube y baja, cae el chorro al balde y suena el agua.
7. y 8. **Las dos ventanas**: «Abrir/Cerrar la ventana» (la hoja gira hacia afuera; abierta, adentro se oye lo de afuera: el sonido pasa de «adentro» a «alero»). Con viento la cortina de una ventana abierta se mueve.
9. **Las cortinas** de las dos ventanas: «Correr/Abrir la cortina» (los paños se recogen contra el marco). Corridas entra menos día y de noche la ventana se ve menos desde afuera.
10. **El baúl** contra la pared de la derecha: «Abrir/Cerrar el baúl» (la tapa se levanta; adentro, la frazada y el sombrero) y dice qué tiene.
11. **La alacena** del fondo: «Abrir/Cerrar la alacena» (las dos puertas; adentro yerba, azúcar, frascos, platos) y dice qué hay, **con tus conservas de verdad** (las recetas que tengas).
12. **El cajón de la mesa**: «Abrir/Cerrar el cajón de la mesa» (se desliza; fósforos y un cortaplumas).
13. **La radio a pilas** sobre la alacena: «Prender/Apagar la radio» (el dial se ilumina; estática bajita y una melodía de lejos, sintetizadas; con la radio comunitaria al aire, dice el programa).
14. **Las cartas** atadas sobre la alacena: «Leer las cartas» (cuatro, de gente de lejos inventada; una por vez).
15. **El libro** sobre la cama: «Leer el libro» (*Cuaderno de un baqueano*, un capítulo cada vez, seis).
16. **El reloj de pared** junto a la puerta: el péndulo va y viene y **las agujas marcan la hora del juego**; «Mirar el reloj de pared» dice la hora y el día; **suena a la hora en punto** (de 1 a 12 campanadas, bajito, si estás a menos de 14 m; también tus relojes de pared y de pie armados). De muy cerca, el tic tac.
17. **La silla de la mesa**: «Sentarte a la mesa».
18. **El sillón junto al hogar** (madera y cuero de oveja): «Sentarte en el sillón junto al hogar», mirando el fuego.

En tus casas armadas (los muebles que ya existían; sin piezas nuevas):
19. **Sillón, mecedora y sillón de cuero**: «Sentarte en …», mirando al frente del mueble.
20. **Baúl, ropero, aparador, alacena, armario, mesa de luz y escritorio**: «Abrir …» dice qué hay adentro (la alacena, tus conservas).
21. **Librero y estantería de roble**: «Sacar un libro y leer» (el mismo cuaderno, sigue donde ibas).
22. **La canilla de la mesada y el barril de agua**: «Abrir la canilla» / «Sacar agua del barril»: cae el chorro de la bomba de la mesada a la pileta (o de la canilla del barril) con el sonido del agua.

Se guarda (`progreso.casa`, saneado en `guardado.js`): lámpara, farol, velas, hogar, radio, las dos ventanas, las dos cortinas, baúl, alacena y cajón abiertos, el capítulo del libro y la carta que toca. Una partida vieja no lo trae y sale **el refugio como estaba** (lámpara, farol y hogar prendidos: de noche se ve igual que antes). En el Desafío no hay nada de esto (`casa` es `undefined`). La pava y el chorro no se guardan.

## Dónde
- `src/casa-detalles.js` (reglas puras): lugares, avisos, guardado, la luz (`brillosCasa`), a qué apuntás (`elegirMirado`), la pava, las campanadas, los textos.
- `src/casa-detalles-mundo.js`: lo que se ve (una malla quieta + las piezas que se mueven; cuelga del refugio y el LOD lo apaga con él; lejos ni se mueve).
- `src/casa-detalles-juego.js`: la E, los sonidos, el reloj, la pava.
- `src/interacciones.js`: una entrada `casa` (antes de las obras que trabajan y de la puerta).
- `src/main.js` (quirúrgico): se arma en el Relax; la entrada `casa` en `accionInteraccion`/`limpiarInteraccion` y en lo buscado a 10 Hz; la luz, la ventana y el farol del refugio salen de `brillos`; el humo del refugio con el hogar apagado; el sonido «alero» con la ventana abierta; `__casaDetalles` en la depuración.
- `src/guardado.js`: `casa` saneada.

## Rendimiento
Sin luces ni programas nuevos; todo lo nuevo está adentro y alrededor del refugio (lejos de la plaza y del bosque: a más de 32 m no se actualiza ni se dibuja: en la plaza y el bosque cuesta 0). Partida real: **103 programas al empezar y al terminar** (con todo prendido, abierto y en uso); adentro del refugio 141 → 145 a 155 llamadas según lo abierto (26 mallas chicas). El vidrio de las dos ventanas del refugio está fundido con el resto del edificio: cerca se esconde y cada ventana pone el suyo (mismo color); lejos vuelve el de siempre.

## Verificado
- **Partida real** (`pruebas/humo-4-31-0-a.cjs`, Electron minimizado con el candado): para cada cosa se apunta de frente, se lee el aviso, se aprieta la **E de verdad** (evento de teclado) y se saca captura antes y después. Las 19 cosas del refugio y los 5 muebles armados (mesada, sillón, baúl, librero, barril) hacen lo que dice el aviso; la pava: «Poner la pava al fuego» → «La pava se está calentando» → a los 22 s «Sacar la pava y cebar un mate» → «Cebarte otro mate»; el humo de la chimenea se va con el hogar apagado y vuelve al prenderlo; lo guardado vuelve igual. Sin errores en la consola. Capturas en `%TEMP%\hx\a4310\` (`NN-cosa-antes/despues.jpg`; de noche `20` a `25`; muebles `30` a `34`).
- Vistos a ojo: el hogar con y sin fuego, las velas, la pava en su trébede, la lámpara, el cajón, la alacena abierta con lo de adentro, la radio, el baúl abierto, el reloj con péndulo y agujas, las cortinas corridas y recogidas, la ventana abierta desde adentro (se ve el pasto) y desde afuera, la bomba con el chorro, el farol apagado, la casa de noche con la ventana encendida y con todo apagado, el sillón (sentado mirando el fuego).

## Pruebas
- Nueva `pruebas/verificar-4-31-0-a.mjs` (en `verify:pasos`): 120 comprobaciones (reglas, el juego con un mundo de mentira, lo que se ve con el three local —sólo los dos materiales de siempre—, la tabla de la E y el enganche en main.js y guardado.js); **22 mutaciones, todas atrapadas**.
- Siguen en verde las 181 pruebas de `verify:pasos` que leen lo tocado (interacciones, guardado, estructuras, main.js en la luz, el sonido y la casa viva). Ninguna prueba vieja se tocó.

## Quedó afuera / no visto a ojo
- De noche con todo apagado, **el halo de la ventana** (el de la 4.12.1, común a las estructuras) sigue: la ventana se ve apagada pero con un resplandor suave.
- Con Ultra, cerca del refugio el vidrio de sus ventanas es el básico (sin el reflejo del cielo de Ultra). No se vio con Ultra.
- Los sonidos (fuego, radio, tic tac, campanadas, silbido, agua) se probaron en Node (que se piden, bajito y sólo cerca); **no se escucharon**: las corridas van con el audio apagado.
- **El espejo que refleja la cara**: no hay forma barata sin un render extra (cámara/textura de reflejo = otra pasada de dibujo); no se hizo.
- **Acostarse sin dormir** en la cama del refugio: la cama sigue siendo «Acostarte a dormir». Sentarse en el borde no se agregó.
- Las cortinas, candelabros, arañas y guirnaldas **armadas** (obras) no se corren ni se apagan: son una sola malla y no se pueden mover sin rehacerlas.
- Las casas de los vecinos de la aldea (las luces por quién vive son de B).
- El hogar prendido no abriga más al dormir (el refugio sigue siendo «casa cerrada» como en la 3.8.6).
