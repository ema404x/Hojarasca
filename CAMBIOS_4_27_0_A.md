# 4.27.0 (A) · Panales silvestres

## Qué cambió
- **Ocho panales en el valle** (`src/panales.js`, reglas puras). En árboles grandes del bosque (coihue, lenga, ciprés de escala 1,0 o más), uno por árbol, a 150 m o más entre sí, a 40 m o más del sendero y de la vía, fuera de la aldea (30 m) y del agua. El valle se parte en 4 x 4 celdas; el orden sale de la semilla del mundo y la primera celda con un árbol que sirva se queda con un panal. El id de cada panal es su celda: no depende del árbol, así que Alta, Media y Baja eligen las mismas celdas (el árbol exacto puede cambiar entre calidades, porque el bosque de cada una es otro).
- **Cómo se ven**: una rama corta sale del tronco y de su punta cuelga el panal de cera oscura con la tapa más clara, a 2,2 a 3 m del suelo que tiene debajo (en una ladera la rama sale del lado donde el suelo cambia menos). Se ven desde unos 15 m.
- **0 dibujos nuevos, 0 shaders**: los ocho panales y el del tronco hueco van fundidos en la malla del panal de siempre (`bichos.js`, un solo dibujo con el material de la fauna, sólo cuando hay un panal a menos de 70 m; antes eran dos, el panal y su hueco). La nube de abejas es la misma de siempre (26 puntos) y se va al panal con abejas más cercano. Un árbol talado se lleva su panal.
- **Abejas**: de día, con sol y fuera del invierno, a menos de 25 m. La lluvia y la noche las guardan. El zumbido es el canal del panal que ya existía.
- **Sacar miel**: «E · Sacar miel del panal», a 2,5 m o menos y mirándolo (le gana al «Anotar» del tronco). Da 1 frasco de miel (el de la colmena), alborota a las abejas y anota el cuaderno. Se recarga con 55 h de sol (cinco días de 11 h) con el ritmo de la colmena (sin invierno, sin noche, lenta con lluvia), estés donde estés. Vacío: «El panal está vacío. Las abejas necesitan unos días de sol.» Pasar corriendo a menos de 3,2 m, con abejas afuera, también las alborota (aviso, sin picar). Con la mochila llena, la miel queda en el panal.
- **Historia**: la colmena aparece en el menú de obras recién después del primer panal. Aviso: «Te llevás un puñado de abejas. Ya podés armar una colmena (O → Trabajo).» Relax sigue como estaba (siempre) y el Desafío no cambia. La señal es la entrada nueva del cuaderno, así que viaja con la partida.
- **Cuaderno**: «Panal silvestre» (sección de la miel, id `panal-miel`), con la pista pedida. La entrada `miel` y el panal del tronco hueco (fauna) quedan igual.
- **Guardado**: clave nueva `panales`: `{ id de celda: horas de recarga }`, sólo de los panales sacados. Una partida vieja carga sin ninguno sacado; un guardado roto se sanea.

## Archivos
`src/panales.js` (nuevo), `src/bichos.js`, `src/main.js` (quirúrgico: elección, tabla de la E, recarga, alboroto, menú de la Historia, `__panales` de depuración), `src/interacciones.js`, `src/guardado.js`, `src/cuaderno.js`, `pruebas/verificar-4-27-0-a.mjs` (en `verify:pasos`), `pruebas/humo-4-27-0-a.cjs`.

## Qué se vio (partida real, capturas en `pruebas/salidas/humo-4-27-0-a-*`)
- Historia/Media, Relax/Alta e Historia/Baja: panal de cerca (2 y 4 m) y a 15 m de día con abejas; de noche sin abejas (silueta oscura a 4 m, invisible a 15 m); con lluvia sin abejas.
- Sacar miel: aviso, frasco en la mochila, notas del cuaderno y de las abejas; al volver, vacío; los ocho panales se alcanzan parado en el suelo a 1,6 m.
- Historia: colmena fuera del menú antes del primer panal y dentro después; guardar y cargar con un panal sacado (sigue vacío, otro sigue con miel, la colmena sigue en el menú).

## Qué no
- No se midió rendimiento (por decisión). La recarga de cinco días no se corrió en tiempo real: se prueba en Node.
- No se vio a ojo un panal en una ladera fuerte ni con el árbol talado (probado en Node con el bosque real).
- El inglés no se tocó.

## Pruebas
`verificar-4-27-0-a.mjs`: reglas con el bosque real en las tres calidades, malla única y 0 objetos de dibujo nuevos, abejas (día, noche, lluvia, invierno, distancia), talado, guardado, cuaderno, conducta de `sacarMielDelPanal` y del menú con el código de `main.js`, y 33 mutaciones que tienen que hacerla fallar.
