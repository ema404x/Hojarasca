# 4.18.4 — Búsqueda de bugs, zona C: partida real, caos y recorridos

Agente C. Sólo Electron real (ventana visible en el monitor externo, candado compartido), reloj falso de 50 ms por cuadro donde hizo falta repetir el mismo recorrido (`pruebas/ayuda-determinista.cjs`), y con el reloj real en la corrida larga.
Rama `v4184-c`. Pruebas nuevas: `pruebas/humo-4-18-4-escenas.cjs`, `humo-4-18-4-recorridos.cjs`, `humo-4-18-4-caos.cjs`, `humo-4-18-4-largo.cjs` (partida real, no entran al gate) y `pruebas/verificar-4-18-4-c.mjs` (Node, entra a `verify:pasos`).

## Bugs

| id | gravedad | dónde | cómo se reproduce | estado | prueba |
|---|---|---|---|---|---|
| C-01 | MEDIA | `src/escenas-mundo.js`, `despejarCamara` (la línea `if (!f \|\| !col?.resolver) return c;`) | Al terminar cualquier escena la cámara vuelve al jugador durante ~1 s (fase `saliendo`). Esa pose mezclada no lleva `foco` y la función sale sin ponerle el piso del terreno: si hay una loma entre la cámara de la escena y la del jugador, la cámara pasa por adentro del cerro. En partida real, con el director de verdad: carpeta-celeste (−3,90 m en el barrido, −2,29 / −0,59 m en los recorridos), bolsa-josefina (−1,83 m), piedras-molino (−0,44 / −0,46 m), el-que-vuela, huellas-escarcha. En los recorridos siempre en la fase «saliendo». | **Pregunta / pendiente de A** (es el motor de escenas, zona de A; no se toca): arreglo de tres líneas probado en una copia. Ver «Preguntas». | `node pruebas/verificar-4-18-4-c.mjs`: con el código de hoy la cámara queda 7,14 m bajo una loma de mentira; con la copia parcheada, 0,45 m sobre el terreno (el piso que ya usa el resto de la función). Mientras no se aplique, la prueba avisa «PENDIENTE» sin tumbar el gate; apenas se aplique pasa a exigente sola. |

Un solo bug confirmado (MEDIA). Ninguna ALTA: no hubo pérdida de progreso, trabas, errores de consola, NaN, números negativos, objetos o dinero duplicados en nada de lo que se corrió.

## Sospechas sin confirmar (no se tocó nada)

| id | dónde | qué se vio | por qué no se confirma |
|---|---|---|---|
| S-1 | cámara «metida en un sólido» (la bolita de 0,22 m de `col.resolver` se mueve al medirla en la cámara) en galpon-golpe, galpon-sin-golpear, galpon-encuentro, galpon-pelea, pluma-umbral, amanecer-pelea-ganada/perdida (alrededor del refugio, −117 / 232), piedras-molino, coihue-talado, llave-79, fiesta-nieve (el coihue grande, −21 / 11), galpon-ronda (37 / −372), fiesta-nieve (242 / −103) | Se repite igual entre corridas y entre los dos perfiles. Dos capturas a ojo (galpon-golpe: primer plano de las tablas de la puerta; coihue-talado: el tocón desde arriba) parecen planos de detalle pedidos a propósito, sin ver a través de nada. | Las otras capturas salieron desfasadas respecto de la escena (el cuadro mostraba la escena anterior). Queda como aviso («aviso:») en los informes de las pruebas. Si A quiere mirarlas: `ESC_FOTO=id:cuadro` en `humo-4-18-4-escenas.cjs`. |
| S-2 | `ramon-sanitario` (capítulo 9) | En los tres recorridos la escena «no se pudo disparar» a mano con la colocación puesta (en el barrido de escenas, solo y sin recorrido, sí arranca y termina). | No se averiguó qué condición de `puedeEmpezarEscena` la frena en ese punto del recorrido (a Ramón se lo lleva de acompañante). Hay que mirarlo con la partida de 4.17.0 que ya cubre el capítulo. |

## Lo que sí se probó y anduvo (partida real)

- **`humo-caos.cjs` de siempre (Relax y Desafío)**: 934 pasos, semilla 20240925, sin errores.
- **Barrido de las 122 escenas de la Historia** (`humo-4-18-4-escenas.cjs`), cada una en su lugar, dos perfiles (trato: primera opción, lazos 2; pelea: última opción, lazos −1), leídas enteras con Enter: todas terminan (la más larga, 260 s de reloj falso, es una espera de horas), 0 errores de consola, 0 errores del director, 0 números raros en la partida. Una vez por recarga las escenas que no disparaban eran el primer intento tras cargar (la prueba ahora reintenta).
- **Tres recorridos encadenados** (`humo-4-18-4-recorridos.cjs`): trato, pelea y «el que más cuesta» (bolsa a Rosa, pirca de Tobías, harina partida, contarlo a Josefina en la universidad, cuidar la majada, bolsa en el umbral), con las seis decisiones tomadas por las escenas reales y la noche de la nevada en la simulación real: trato ganando; pelea perdiendo y «Que amanezca»; dura perdiendo, «Otra vez», perdiendo, «Otra vez» y ganando. Los tres llegan a la fase `fin`, con la tarjeta final del trato o de la pelea, y **guardar y volver a cargar con la historia terminada deja todo igual**. Programas de shader de 96 a 99 en esas partidas (calidad «muy baja»); 0 errores de consola.
- **Caos de entrada en plena escena** (`humo-4-18-4-caos.cjs`, 120 acciones por escena con teclas al azar —incluidos Esc, Enter, E, Tab, F1—, clics en el cuadro de diálogo, tamaños de ventana, minimizar y restaurar, perder el foco, cambios de ajustes en vivo, guardar): las nueve escenas elegidas cierran, quedan vistas y se puede caminar después; guardar a mitad de escena y recargar no deja la escena como vista (6 ciclos, la mitad con escena en curso); los 20 menús por tecla y los 14 botones de la pausa abren y cierran bien; **la pausa congela la escena en cada tipo** (diálogo, pregunta, plano, fundido) y **congela la noche de la nevada**, y al volver sigue.

## Lo que NO se miró (y lo que se hizo a medias)

- **No se jugó la Historia de verdad objetivo por objetivo.** Las escenas se dispararon en su lugar (`COLOCACION_ESCENA`) y los objetivos de mundo que no son escena (talar, construir, cosechar seis veces, moler diez medidas, llevar a Graciela en la trochita, kayak de noche, esperar sentado…) se dieron por hechos con la misma marca que deja el juego (`hechos[capítulo:objetivo]`); cada uno que se forzó está impreso («forzado») en el log. De paso quedaron sin probar los disparadores naturales por lugar y hora de la mayoría de las escenas y los premios de esos objetivos. Los cubren las partidas por capítulo de 4.15 a 4.18.
- Cambiar de resolución con `setContentSize` se hizo en plena escena; el cambio de «Resolución» del menú de ajustes no se probó (`modoFluido`, `limiteFps`, `paleta`… sí, con clics en los botones). El cambio de **modo** (Historia↔Relax↔Desafío) a mitad no se hizo (es de A).
- Minimizar y restaurar se hizo con la ventana visible de Electron en el monitor externo, no con el sistema de ventanas del usuario.
- Los recorridos «pelea» y «dura» corrieron en una sola partida cada uno y con una semilla; no se repitieron.
- **Capturas a ojo**: sólo dos (galpon-golpe, coihue-talado) salieron bien; el resto de las capturas pedidas salieron con un cuadro de retraso.
- Memoria y cuadros por segundo: ver «Corrida larga» (abajo).
- No se miró nada de las zonas de A (`historia*.js`) ni de B por dentro; el audio no se escuchó (`--mute-audio`).

## Corrida larga (tiempo acelerado, reloj real, calidad media)

`humo-4-18-4-largo.cjs`, ventana visible, requestAnimationFrame de verdad, calidad media, 20 minutos con 313 saltos a lugares del valle, el día y la noche pasando de a 0,5 a 3 horas cada 2,5 s (33 días de juego, las tres estaciones), «historia capitulo N» cada 100 s y las escenas que se dispararon solas leídas con Enter:

- **Errores de consola: 0. Fallas de sistema: 0.** 10 escenas arrancaron solas por sus disparadores naturales (trochita-boleto, estacion-llegada, placa-herminia, oveja-ramon, anden-graciela, te-graciela, vuelta-faro, vuelta-mirador, derrumbe-puertita, piedras-molino).
- **Memoria de JS** (tras un GC forzado): 289 MB al empezar, 304 a la mitad y 306 al final (pendiente de la segunda mitad: −1,8 MB/h). **Geometrías y texturas de three** suben de 700 a 1206 y de 60 a 72 en la primera mitad (el valle se va cargando al recorrerlo) y después se aplanan (1206 a 1228 y 72 a 77 en la segunda mitad): no hay una fuga que sólo crezca, es la caché de lo recorrido. Nodos del DOM de 974 a 1024 (los de las tarjetas y las notas).
- **Programas de shader: 111 al empezar, 114 desde el minuto 1** (se avisa, como pedía el brief, no se arregla acá; el 113/114 de noche en la aldea ya era conocido).
- **fps**: 57 a 60 durante 18 minutos (medio 54 con la caída de abajo). **Una caída que NO se reproduce**: en la corrida de 20 minutos, a partir del código «historia capitulo 11» (minuto 18) los cuadros bajaron a 8 y luego a 1 por segundo durante los últimos 90 s. Se repitió el capítulo 11 solo, recorriendo los mismos lugares durante 6 minutos más: 60 fps parejos (mínimo 57,8). Por eso no se cuenta como bug: lo más probable es que otro agente corriera algo pesado en la misma PC justo ahí (las tres zonas compartían la máquina; Electron corre con prioridad baja), pero no lo pude comprobar.

## Preguntas para el usuario

1. **C-01**: ¿Aplicamos el arreglo de tres líneas en `escenas-mundo.js` (`despejarCamara`)? La recomendación es que sí, antes de cerrar la 4.18.4: es un cambio mínimo, ya probado en la copia (`verificar-4-18-4-c.mjs`), y sólo afecta a la cámara de salida de las escenas. El texto exacto:
   ```
   if (!f || !col?.resolver) {   // 4.18.4: sin foco (la salida de la escena, un plano `sinDespeje`) igual no se baja del terreno
     const s0 = ctx.T?.altura ? ctx.T.altura(c.x, c.z) : null;
     return Number.isFinite(s0) && c.y < s0 + DESPEJE.bajo ? { ...c, y: s0 + DESPEJE.bajo } : c;
   }
   ```
   (Ya está anotado en el tablero para A.)
2. **S-2** (`ramon-sanitario`): ¿alguien mira por qué no se dispara a mano en ese punto del capítulo 9? No parece trabar el capítulo (el objetivo se completa por la escena de verdad cuando se juega).

## Archivos y resultados

- Pruebas: `pruebas/humo-4-18-4-escenas.cjs`, `pruebas/humo-4-18-4-recorridos.cjs`, `pruebas/humo-4-18-4-caos.cjs`, `pruebas/humo-4-18-4-largo.cjs`, `pruebas/verificar-4-18-4-c.mjs` (esta última en `verify:pasos`; da TODO OK con el aviso «PENDIENTE» de C-01).
- `node armar.mjs`: 486 módulos, sin cambios (no se tocó código del juego).
