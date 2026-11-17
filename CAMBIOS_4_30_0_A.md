# 4.30.0 (A) · personajes y la Historia

Rama `v4300-a`, desde `main` = 4.29.2. 0 programas de shader nuevos, 0 llamadas de dibujo nuevas, ninguna clave de guardado nueva.

## Arreglado

### 1. El anotador pegado en el brazo (lo vio el usuario) — rompe la vista
**Causa:** desde el cuerpo nuevo de la gente (3.7.0), el grupo `mano` donde se cuelga lo que alguien lleva (la planilla, la caña, la copa del casamiento, el arco y el martillo del Desafío) quedaba **a 1 cm del codo** (`gente-cuerpo.js`: `a.position.set(0, -0.01, 0)`), no en la mano. La planilla de Ercilia, Josefina, Graciela, la maestra, el telegrafista y la guardaparque colgaba de canto pegada al antebrazo; anotando, la tabla quedaba de punta junto al codo; la caña de Nicanor salía de la cintura hacia atrás.
**Arreglo (la causa, no el caso):**
- `gente-cuerpo.js`: cada codo guarda dónde cierra el puño (`codo.userData.puno`, sacado de la muñeca y la palma reales del brazo) y `mano` va ahí. Todo lo que se cuelga de `mano` queda en el puño, para todos.
- `gente.js`: `orientarEnMano(g, anotando, pescando)` (exportada, con la tabla `EN_MANO`): la planilla y la caña quedan con el ángulo que les toca **respecto del cuerpo**, sea cual sea el del hombro (sus tres giros) y el del codo (se deshace con la inversa de los dos). Colgando, la tabla va de canto junto a la pierna tomada del borde de arriba; anotando, inclinada hacia la cara a la altura del pecho (brazo -0,55 y codo -1,3, antes el brazo estirado a -1,2); la caña casi derecha y, pescando, tendida hacia el agua con el tirón del brazo.
- La planilla ahora tiene la hoja a la vista (antes estaba entera adentro de la madera) y el broche; la caña, el reel un palmo arriba del puño.
- `amor-mundo.js`: la copa del casamiento, centrada en el puño.
- Capturas antes/después (misma toma, versión 4.29.2 armada aparte): `%TEMP%\hx\a4300-pares2\` (Ercilia y Josefina quietas y anotando, Nicanor quieto, pescando y con los brazos cruzados; de frente y de costado). Antes: la tabla horizontal pegada al codo; después, en la mano.

### 2. Animaciones que se cortan: la quietud pisaba la tarea — se ve mal
La quietud (`gente-cuerpo.js`: manos en la cintura, brazos cruzados, atrás) arrancaba con cualquiera parado, **también anotando o pescando**: Josefina «anotaba» con las manos en la cintura y la tabla en el codo; Nicanor «pescaba» con los brazos cruzados y la caña atravesándole el pecho (visto en las capturas de antes). Ahora:
- anotando o pescando (`g.__tareaMano`, lo pone `gente.js`) no hay quietud;
- con la planilla o la caña a la vista, el brazo que la lleva no entra en la pose (como ya pasaba con el del mate): la hace el otro brazo;
- en una pose de la aldea (hachar en la obra, regar, bailar, sentarse a leer…) la tabla o la caña se guardan y vuelven al terminar (`__enManoDejado`, como `__mateDejado`; lo que guardó una escena o el Desafío no se toca).

### 3. El brazo que sale flotando del poncho (Ramón; en invierno, todos) — rompe la vista
Encontrado en la recorrida de la gente con nombre (cada uno quieto, saludando, señalando y con los brazos cruzados). Con poncho el brazo **nacía en el codo** (debajo del poncho, «se ve sólo desde el antebrazo»): al saludar, Ramón levantaba un antebrazo suelto que flotaba arriba del hombro, sin brazo; señalando o con los brazos cruzados el antebrazo asomaba del poncho cortado. Como en invierno todos van de poncho, pasaba con cualquiera que gesticulara en una escena de invierno.
**Arreglo** (`gente-cuerpo.js`): con poncho el brazo (y el del mate) va entero desde el hombro, más fino arriba: quieto queda adentro del poncho (se ve igual que antes) y al levantarlo sale por el costado, unido. Capturas: `%TEMP%\hx\a4300-pares2\ramon-poncho-antes-despues.jpg` (antes: cruzados, saludo, señalar; después, lo mismo) e `invierno-despues.jpg` (Ercilia, Nicanor y Elsa en invierno saludando, señalando y cruzados).

### Pruebas
- Nueva `pruebas/verificar-4-30-0-a.mjs` (en `verify:pasos`): personas de verdad armadas con `gente-cuerpo.js` en una VM con el three local y la función real de `gente.js`. El puño a 0,22–0,32 m del codo y siguiendo al antebrazo doblado; la tabla y la caña con su ángulo y su centro en 6 posturas del brazo (también las de la quietud, con giro y apertura); la quietud con y sin la tabla, con la tabla guardada y anotando (azar sembrado); con poncho, los dos brazos desde el hombro (y que se arme); el enganche en el bucle de la gente. **14 mutaciones**, todas hacen fallar su comprobación.
- Siguen en verde: `verificar-3-7-0-personajes` (719), `verificar-4-25-1-c` (157, 11 mutaciones), `verificar-4-25-1-a`, `verificar-premium-rc3`, `verificar-3-7-2-cabezas` y las 15 de la Historia, escenas, logros y «Lo vivido» (`verificar-3-1-historia`, `-4-13-0-historia-a`, `-4-14-0-escenas`, `-4-15-0-*`, `-4-16-0-*`, `-4-17-0-*`, `-4-17-1-escenas-noche`, `-4-18-0-escenas-optativas`, `-4-18-2-lazos-escenas`, `-4-25-2-historia`, `verificar-logros`, `verificar-logros-relax`). Ninguna prueba vieja se tocó.

## La Historia de punta a punta (recorrida)
- **Partida real** `humo-4-25-0-a` (Electron, minimizado, candado): partidas viejas (4.18.4 y 4.22.0) que entran con su día, plata y capítulo y vuelven iguales; guardar y abrir con fletes en curso; la economía por el panel de la trochita con días que pasan; el mapa con la Historia pausada y con una escena en curso (la M no abre); los logros de la Historia una sola vez y después de recargar. **Todo en orden**, 110 programas al empezar y al terminar, sin errores en la consola.
- **La Historia simulada** (`herramientas/auditoria-historia-corridas.mjs`, 30 partidas con los módulos reales y elecciones al azar): 29 llegan al final con 0 errores. La semilla 5 queda en «perdido» con la guardia y las huellas pendientes; con el jugador «paciente» (el que va adonde la historia lo espera y espera la hora) la misma semilla termina: es el azar del jugador de mentira (no se sentó en la ventana de la guardia), no un atasco del juego. Anotado.
- Días, objetivos, cinemáticas y saltearlas, decisiones y final: cubiertos por las pruebas de arriba (miles de caminos de escenas por acto, con mutaciones); no se encontró nada nuevo que arreglar.

## Anotado / no visto a ojo
- La maestra, el telegrafista, la guardaparque (planilla) y el pescador de la aldea (caña) usan el mismo `darPlanilla`/`darCaña` y el mismo puño: arreglados por la causa, pero **no se vieron a ojo** (en las tomas no aparecían: la gente de la aldea no estaba armada en ese momento). Graciela tampoco (sólo existe en el capítulo 4).
- El martillo de Anselmo y el arco de Josefina (Desafío) ahora salen del puño; no se les cambió el ángulo y **no se vieron a ojo**.
- **Recorrida de la gente con nombre** (Electron, cada uno en un claro, quieto, saludando, señalando y con los brazos cruzados; verano y, los de poncho, invierno): Ramón, Nicanor, Josefina, Ercilia, Elsa, Graciela, Belisario y Tobías. Fuera del poncho (arreglado arriba) no se vio ropa ni pelo atravesando, ni caras o miradas raras. Fermín quedó con la cámara dentro de una construcción (problema de la toma, no del personaje) y la gente de la aldea (el jefe, la abuela, Nélida, Rosa, Herminia, Tito, Anselmo) no estaba armada en esa partida: **no se vieron a ojo**.
- Con poncho y los brazos cruzados, los antebrazos salen por delante del poncho (el poncho no se abre): se ve unido, pero es un atravesado leve. Anotado.
- Al empezar a anotar, el brazo y el codo pasan a la pose de golpe en un cuadro (como ya pasaba con el brazo en todas las tareas).

## Archivos
`src/gente-cuerpo.js`, `src/gente.js`, `src/amor-mundo.js`, `pruebas/verificar-4-30-0-a.mjs`, `package.json` (`verify:pasos`), `herramientas/correr-4-30-0-a.ps1` (corre un guion de Electron minimizado con el candado tomado sólo durante la corrida).
