# 1.6.1 — Cacería de bugs sobre la 1.6.0

Pasada de lectura sobre lo que trajo la 1.6.0. Cuatro defectos reales, ninguno de diseño:
son cosas que el juego ya prometía y no cumplía.

## 1. La sombra de contacto que se apagaba para siempre
Cada vez que un árbol se mueve —una sacudida de hachazo, no hace falta voltearlo— el juego
lo saca de la malla del chunk y lo dibuja aparte. `ocultarInstancia` apaga dos cosas: el
árbol **y su sombra de contacto**, ese manchón oscuro donde el tronco toca el suelo. Al
terminar la sacudida volvía solamente el árbol.

Resultado: **todo árbol al que le pegaste un hachazo perdía su sombra de contacto por el
resto de la sesión**, quedara en pie o no. Como talar son tres golpes, cada árbol talado
pasaba dos veces por ahí, y cualquier árbol tanteado y abandonado quedaba flotando un poco
sobre el pasto. `crecer()` sí la restauraba, así que el defecto sólo se veía en los árboles
en pie: los que rebrotaban volvían bien.

`terminarAnimado` ahora devuelve las dos matrices (`src/vegetacion.js`).

## 2. El renoval que apuraba el tocón mañana, no ahora
Plantar un renoval al lado de un tocón le saca tres días de rebrote, y el aviso lo dice:
*"además apura el rebrote del tocón de al lado 3 días"*. Pero `revisarRebrote()` se corta
sola si ya revisó hoy (`progreso.dia === diaRebrote`), y `diaRebrote` queda clavado en el
día actual apenas talás algo. O sea: en el caso normal —talás, plantás al lado— la llamada
no hacía nada y **el tocón no cambiaba de etapa hasta el día siguiente**.

El descuento nunca se perdía (queda en `t.dia`), pero el jugador leía una promesa que no
veía. Ahora `plantarRenoval` destraba la revisión antes de pedirla (`src/main.js`).

## 3. El acopio se comía las devoluciones
`conMateriales` le muestra a la obra la suma de mochila más acopio, la deja gastar y después
cobra: primero de la pila, después de la mochila. El cobro salteaba todo saldo que no fuera
positivo (`if (gasto <= 0) continue`), así que si una obra **devolvía** material en vez de
gastarlo, la devolución se descartaba en silencio y el material desaparecía.

Hoy ninguna obra devuelve —`avanzar` sólo gasta—, así que era un defecto latente, no una
pérdida que el jugador estuviera sufriendo. Pero es exactamente la clase de cosa que muerde
la primera vez que alguien agregue un "deshacer etapa" o un desarme que reintegre. Ahora lo
devuelto vuelve a la mochila, y la prueba verifica que no se cree ni se pierda material en
los tres casos (`src/main.js`).

## 4. La descripción del paquete, ilegible
`package.json` tenía la `description` con el encoding roto en varias capas
(`ExploraciÃƒÆ'Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢…` en lugar de `Exploración…`): UTF-8 releído como
Windows-1252 tres veces seguidas. Era el único archivo del proyecto afectado, pero
electron-builder mete ese texto en las propiedades del `.exe` y del instalador, así que se
veía en el Explorador de Windows y en el diálogo de propiedades.

Queda `Exploración contemplativa en un bosque andino patagónico generado por código · modos
Relax y Desafío`, y la prueba rechaza el mojibake para que no vuelva a colarse.

## Lo que NO se tocó
La `version` sigue en `1.6.0`. Cortar la 1.6.1 —bumpear, rearmar los tres artefactos y el
depot— es una decisión de release, no de esta pasada.

## Pruebas
`npm run verify` en verde, ahora **63 pasos**: se sumó `pruebas/verificar-bughunt-1-6-1.mjs`,
que cubre los cuatro puntos (tres por lectura del código, más el cobro del acopio replicado
y ejercitado con números). El build sigue siendo reproducible; el SHA-256 del `index.html`
cambia porque cambiaron las fuentes.
