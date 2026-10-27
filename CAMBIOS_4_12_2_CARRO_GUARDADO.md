# 4.12.2 · carro, guardado, sonido e interfaz (rama `bugs-4-12-2-carro-guardado`)

Sobre 4.12.1 (`aff08bc`). Salen de las revisiones de lectura `zona-C2.md` (carro y banco de sonidos) y `zona-G2.md` (guardado, interfaz y proceso). Cada hallazgo se confirmó leyendo el código antes de tocarlo. No se subió la versión, no se hizo push, no se tocó `main`. Sin Electron, sin `verify`: sólo pruebas sueltas de Node (lista al final).

## Estado de cada hallazgo

| Hallazgo | Estado | Dónde |
|---|---|---|
| G2-1 sonido sigue al minimizar / Alt+Tab | **Arreglado y probado** (con el AudioContext de mentira) | `src/sonido.js` (`dormir`), `src/main.js` (blur, visibilidad, foco, clic, tecla, cuadro) |
| C2-1 caballo y carro en el lecho del arroyo cruzando el puente | **Arreglado y probado** (terreno real, three real) | `src/caballo-mundo.js`, `src/main.js` (`dondeEstaElCaballo`, `crearCaballo`) |
| C2-2 el carro atraviesa árboles, obras, cercas, paredes | **Arreglado (simple y conservador) y probado con la colisión real**; falta mirarlo en pantalla | `src/caballo-mundo.js` (`seguirCarro`) |
| C2-3 «Empezar acá» pisa estación, clima y dificultad de todas las partidas | **Arreglado y probado** | `src/personal-partida.js`, `src/main.js` (`irAPartida`, arranque, `btn-entrar`) |
| G2-2 importar una partida más nueva la recorta; el aviso no dice nada | **Arreglado y probado** (campos conservados + avisos con versión y «sólo lectura») | `src/guardado.js`, `src/sincronia.js`, `src/transferir.js`, `src/main.js` |
| Carpintería con caballo: nunca muestra el bono de madera | **Arreglado y probado** (aviso y E) | `src/main.js` (`avisoOficioPropio`, `usarCarpinteriaCarro`) |
| Banco de sonidos corta la gramola de la casa | **Arreglado y probado** | `src/banco-sonidos.js` |
| Sólo lectura todavía escribe la miniatura desde la pausa | **Arreglado** (probado por forma del código; el lienzo no existe en Node) | `src/main.js` (`abrir('pausa')`) |
| `recuperacion-main.cjs` cierra con `app.exit(1)` sin bajar el localStorage | **Arreglado y probado** (Electron falso) | `recuperacion-main.cjs` |
| Consola de códigos abierta encima del banco de sonidos | **Arreglado y probado** (por forma del código) | `src/main.js` (`ocupado`) |
| «Detener todo» corta sonidos que no son del banco | **Parcial**: ya no apaga la gramola de la casa. Lo demás **no se tocó** (ver abajo) | `src/banco-sonidos.js` |
| «Otra vuelta» no revalida «Noches más largas»/«Avaro» con «Hora de tu reloj» | **No se hizo: pregunta** | `src/desafio-vuelta-nueva.js` |
| G2-3 (miniatura en sólo lectura) y G2-7 (carga estirada al minimizar) | La miniatura, arreglada; la carga estirada, **sin cambio** (es por diseño, sin medir) | |

Hallazgos descartados: ninguno. Todos se confirmaron por lectura (los números del puente de C2-1 coinciden con `c2-puente.mjs`: cubierta 2,82 m sobre el terreno del medio).

## Qué se hizo

### G2-1 · el sonido se duerme sin foco
Al perder el foco (`blur`) o ocultarse la ventana (`visibilitychange: hidden`) el mundo se pausaba pero los bucles de viento, agua, lluvia y la gramola seguían sonando por debajo del otro juego. Ahora `Sonido.dormir(true)` suspende el `AudioContext` **sólo si estaba andando** y se anota que fue por eso (`dormidoPorFoco`); `dormir(false)` lo reanuda sólo en ese caso.
- Despierta con: `focus`, volver a verse la ventana, el primer clic o tecla (captura), `iniciar()` y, por si se pierde el evento, el cuadro del juego (si la ventana tiene el foco y se ve).
- No toca un contexto suspendido por otra cosa (el navegador antes del primer clic, la historia) ni el fuera de línea del banco.
- La pausa normal (Esc, abrir el menú) **no cambia**: no suspende nada, la música sigue como hoy.
- Si algo reanuda el contexto por su cuenta (gramola, banco), perder el foco otra vez lo vuelve a dormir.

### C2-1 · el caballo y el carro sobre el puente
`crearCaballo(T, escena, alturaPie, empujar)` recibe cómo se apoya algo: en `main.js` es `alturaDePie(T, col, x, z, y)` (el mismo criterio que la gente y los NPC: el piso de una obra, el puente o el muelle si hay, y si no el terreno). Montado, `dondeEstaElCaballo` suma `y: js.pos.y` (la altura en que vas). El carro se apoya con la misma función en sus cuatro puntos. Sobre un piso, el caballo va derecho (no hereda la inclinación del lecho de abajo). Sin esa función (pruebas viejas) vale sólo el terreno, como antes.

### C2-2 · el carro y los obstáculos
Elegí lo más simple y conservador: después de ubicar el eje del carro detrás del enganche, se lo pasa por `col.resolver` (la misma colisión que usan el jugador y los animales) con un cuerpo de 0,6 m de radio y 0,7 m de alto. Si cae adentro de algo, la colisión lo saca y el carro **gira alrededor del enganche** hacia donde quedó libre; vuelve a quedar a `ENGANCHE.largo` del enganche, así que el balancín no se despega. Si la salida cae sobre el propio enganche, queda como estaba. Es sólo dibujo: no cambia la mochila, ni el paso del caballo, ni el rendimiento (una llamada por cuadro y sólo con el carro enganchado y a la vista). Una colisión que tira excepción no frena el dibujo.
Límite honesto: en un pasillo más angosto que el carro (más de ~1,2 m de ancho de cuerpo) el carro se aprieta contra las paredes y gira; no se detuvo ni se desengancha. Falta verlo en pantalla (puerta de la cantina, cerca, bosque cerrado).

### C2-3 · «Empezar acá»
`irAPartida` ya no escribe la receta en los ajustes globales. La estación, el clima y la dificultad de la receta se anotan junto a lo personal pendiente (`hojarasca-ajustes-pendientes-<modo>-<ranura>`, sesión) y se aplican (en memoria) al arrancar esa ranura vacía, antes de armar el mundo. Se guardan en disco recién al tocar «Empezar»/«Seguir». Si salís de la ranura nueva sin haberla empezado, los ajustes vuelven a lo que eran. «Empezar de nuevo» no cambió (es una orden explícita).

### G2-2 · partida de una versión más nueva
- `guardado.js` conoce la versión de este juego (`fijarVersionDelJuego`, la fija `main.js`). Al sanear una partida de una versión **más nueva**, los campos desconocidos de los sub-objetos (hasta 3 niveles, p. ej. `desafio.meta.extra`, `personal.caballo.enganche2`, `aldea.nuevoCampo`) se conservan tal cual. Con la misma versión o una menor, o sin versión fijada, el saneo es el de siempre. `__proto__` se ignora.
- La oferta de la carpeta, «Dos cambiaron» y el aviso de importar a mano dicen la versión de la partida y que se abrirá en sólo lectura.

### Los bajos
- **Carpintería con caballo**: el aviso suma « · en cada obra sobra X % más de madera» al del carro, y la E, con el carro hecho, suma `textoCarpinteria` (el % y la pista del 15 %). La E que fabrica el carro no cambió.
- **Banco de sonidos y la gramola**: si la gramola de la casa ya sonaba al abrir, ni abrir/cerrar ni «Detener todo» la cortan. Si el banco prende la suya (o reemplaza la de la casa), la apaga al cerrar, como antes.
- **Sólo lectura y la miniatura**: la pausa no pisa la miniatura de la ranura.
- **`recuperacion-main.cjs`**: como `ventana-main.cjs`, baja el almacenamiento a disco 400 ms después de pedir guardar y otra vez justo antes de `app.exit(1)`.
- **Consola de códigos**: ya no se abre con el banco de sonidos abierto.

## Decisiones tomadas sin consultar
1. **G2-1**: suspender el `AudioContext` entero (no bajar el master). Es lo más simple, corta también la gramola (su `setInterval` sigue, pero sin audio) y no interfiere con las rampas del master. Se despierta por varios caminos a propósito (el evento de vuelta puede perderse).
2. **C2-1**: pasar la altura de apoyo como función opcional a `crearCaballo` (en vez de leer `col` adentro): las pruebas viejas y el Desafío no cambian.
3. **C2-2**: girar el carro alrededor del enganche (en vez de frenarlo o desengancharlo): no hay forma de que quede trabado ni de perder nada.
4. **C2-3**: aplicar la receta en memoria al arrancar la ranura nueva y guardarla al empezar de verdad (en vez de guardarla en la partida nueva): una partida nueva con ajustes globales es como funciona «Empezar de nuevo».
5. **G2-2**: conservar lo desconocido sólo si la partida es más nueva que este juego (sanear de siempre en el resto: una partida vieja trae restos de funciones sacadas que sí deben irse).
6. **Carpintería**: se suma el bono al texto existente (no se reemplaza nada).
7. **Banco de sonidos**: la gramola de la casa no se corta ni con «Detener todo» explícito: el botón es del banco, la casa no la lanzó él.
8. Las pruebas existentes que fijaban lo cambiado se ajustaron lo mínimo: `verificar-4-11-1-interfaz` (ahora dos claves pendientes y los ajustes no cambian), `verificar-4-11-5-carro` (entorno con `textoCarpinteria`, tres fragmentos de mutaciones) y `verificar-caballo` (la firma de `crearCaballo`).

## Preguntas (no se hicieron)
- **«Otra vuelta» con «Hora de tu reloj»**: `nuevaVuelta` copia las ventajas/reglas de la vuelta anterior, y con el reloj real «Noches más largas» no hace nada pero sigue sumando su multiplicador. Revalidar sacaría reglas que elegiste (o impediría la vuelta): cambia cómo se juega. ¿Se quitan solas con aviso, o se deshabilita «Hora de tu reloj» en una vuelta con esas reglas?
- **«Detener todo» y fuentes ajenas**: el banco anota como propia cualquier fuente que nazca en sus 2,5 s de ventana (chasquidos de fogata, tocadiscos, frases de música) y las corta. Arreglarlo bien implica distinguir el origen de cada fuente; propongo acortar la ventana, pero cambia cuándo se cortan las colas de los sonidos del banco. Sin tocar.
- **Fotos en sólo lectura**: `sacarFoto` guarda fotos de la sesión en los archivos de la ranura aunque la partida no se guarde. Cosmético, no se tocó.
- **Pasillos angostos con el carro**: si el apretón visual molesta, el siguiente paso es desenganchar el carro (que quede en el lugar) al entrar a un pasillo de menos de 1,2 m.

## Pruebas
Nueva (enganchada al gate en `verify:pasos`, antes del build reproducible): `pruebas/verificar-4-12-2-carro-guardado.mjs`, 88 comprobaciones que EJECUTAN el comportamiento:
1. Sonido con `FakeCtx`: suspender/reanudar, idempotencia, no despierta lo ajeno, se vuelve a dormir si algo lo reanudó, `iniciar()` despierta, fuera de línea no se duerme, promesa rechazada sin excepción; main.js enganchado a blur, visibilidad, foco, clic, tecla y cuadro; la pausa normal no duerme.
2. Puente real (terreno real, plataforma real de la colisión): sin la altura de apoyo el caballo se dibuja 2,8 m abajo (el defecto), con ella en la cubierta, derecho, con el carro también; fuera del puente, en el terreno; parado sin jinete, en la cubierta.
3. Árbol real en `crearColisiones`: sin colisión el carro pasa por el centro del tronco, con ella queda afuera, sigue enganchado (error del balancín < 0,12 m) y giró; sin obstáculos nada cambia; una colisión que tira no frena el dibujo.
4. Receta: no toca los ajustes que se le pasan, se toma una vez, valida claves y largos, `irAPartida` no cambia ni guarda los ajustes, se restauran si no empezaste la ranura nueva y quedan si ya la empezaste.
5. Guardado: Relax y Desafío con campos nuevos de adentro (incluido `meta`), misma versión/sin versión fijada se sanea como siempre, `__proto__`, los tres avisos con versión y «sólo lectura», `versionNuevaDe`.
6. Carpintería (aviso y E), banco/gramola (cuatro escenarios), miniatura en sólo lectura, `cuidarErroresMain` con Electron falso (flush antes de `app.exit`), consola de códigos.

### Corridas (una a la vez, sólo Node; ninguna con Electron, ni `verify`, ni mediciones)
Todas en verde al final: `verificar-4-12-2-carro-guardado` (88), `verificar-4-11-5-carro` (156 + 48 de 48 mutaciones), `verificar-4-11-1-interfaz` (132), `verificar-4-11-4-banco-sonidos` (2124), `verificar-4-11-3-proceso` (617 + 26 mutaciones), `verificar-4-10-4-proceso-rendimiento` (73), `verificar-4-6-1-interacciones` (20172), `verificar-sincronia`, `verificar-idioma`, `verificar-idioma-1-10`, `verificar-idioma-1-11`, `verificar-idioma-2-3`, `verificar-idioma-2-4`, `verificar-4-10-1-version` (20), `verificar-4-10-2-interfaz` (84), `verificar-4-10-2-regresiones` (120), `verificar-4-10-partidas` (253), `verificar-4-0-1-sincronia`, `verificar-guardado-rc2`, `verificar-persistencia-eventos-rc2`, `verificar-3-5-4-ventana`, `verificar-3-5-1-caidas` (87), `verificar-4-11-1-sonido`, `verificar-3-8-5-sonido` (113), `verificar-4-10-3-sonido`, `verificar-sonido`, `verificar-trucos` (597), `verificar-4-0-1-nucleo`, `verificar-partidas`, `verificar-caballo`, `verificar-4-2-oficios` (404), `verificar-3-8-8-banco` (118). Además `node armar.mjs` (439 módulos) y `herramientas/revisar-escritura.cjs` (sin avisos).
Fallos que hubo en el camino y se arreglaron: `verificar-3-5-1-caidas` fijaba que `bucle` fuera seguido de `if (estadoGraficos.perdidos)` (la red de seguridad del sonido pasó a `cuadroDelJuego`); las otras eran las que fijaban lo cambiado a propósito (ver «Decisiones», punto 8). El resto del gate no se corrió.

## Para mirar/escuchar en Electron (cuando la PC esté libre)
- **Oír (G2-1)**: con lluvia y viento, minimizá y hacé Alt+Tab: no tiene que oírse nada del Hojarasca (el mezclador de volumen de Windows tiene que dejar de mostrar señal de `Hojarasca.exe`). Al volver tiene que retomar viento/agua/lluvia/música sin clic extra. Probá también con la gramola de la casa sonando, y con el banco de sonidos abierto. Probá bloquear la pantalla (Win+L) y volver.
- **Mirar (C2-1)**: montado con el carro, cruzá el Puente de Troncos (-268, -230) y el muelle: caballo y carro sobre la cubierta, no en el lecho; la entrada y la salida del puente (el carro baja la rampa sin saltos feos).
- **Mirar (C2-2)**: giros cerrados cerca de un árbol, una pared de tu casa, una cerca; pasar por una puerta con el carro. Que el carro no atraviese y que el balancín siga en el enganche. Pasillos angostos: cómo se ve el apretón.
- **Mirar (C2-3)**: receta con estación «invierno»; Partidas → ranura vacía → «Empezar acá» → volver a la 1 sin empezar: la 1 sigue en su estación. Y empezar de verdad la nueva: queda invierno y se mantiene tras reiniciar.
- **Mirar (G2-2)**: importar a mano un `.hojarasca.json` con `versionJuego` más nueva (editar el número a 9.0.0): el cuadro dice la versión y «sólo lectura»; la partida abre en sólo lectura y la pausa no cambia la miniatura de la ranura.
- **Oír**: abrir el banco de sonidos con la gramola de la casa sonando y cerrarlo con Esc: sigue sonando.
- **Mirar**: carpintería con caballo, con y sin carro: aviso y E hablan del carro y del % de madera.
- **Cerrar**: provocar errores repetidos del proceso principal es difícil; basta con revisar que `recuperacion-main.cjs` se carga (el juego arranca).
