# 4.23.0 · parte C — Interiores y CPU de la gente

Rama `v4230-c` (sobre `main` = 4.22.0). Del informe `AUDITORIA_4_20_0_C.md` (H4a y H5): **no dibujar el exterior desde adentro de una casa** y **bajar la CPU de la gente** para dejar margen al paisaje (4.24.0) y a los personajes (4.25.0). Sin shaders nuevos, sin texturas, sin capas de pantalla completa, sin llamadas de dibujo nuevas, sin tocar cómo se ve la gente de cerca.

Capturas y mediciones crudas: `C:\Users\Andres\AppData\Local\Temp\hx\c4230\` (`cap-base-*` y `cap-nuevo-*` son las capturas antes y después; `med-*`, `int-*`, `fin-*` y `conf-*` son las rondas alternadas; `perfil-*` los perfiles de CPU; `equiv-r*` las pruebas de equivalencia de imagen).

## 1. Qué cambió

### a) Adentro de un edificio cerrado no se dibuja lo de afuera (`src/interior-visible.js`, nuevo, puro; enganche en `main.js`)
Con la cámara entre las paredes de un edificio de la aldea (y de la casa de té), `dibujar()` apaga mientras dibuja el cuadro —y lo vuelve a prender en un `finally`—: el terreno y el terreno fino de la aldea, el pasto, los chunks del bosque, el sotobosque, los impostores, todo `InstancedMesh` sin nombre de la raíz de la escena (el paisaje y las piedras), las sombras de contacto, el paisaje del molino, el tren y **la gente que quedó afuera de las paredes**. No se toca lo que decide cada sistema (es el mismo truco que ya usaba `apagarVacias`).

- **Una puerta a la vista lo desactiva.** Se midió que las hojas de las puertas de la aldea se dibujan abiertas contra la jamba **aunque su estado `abierta` sea 0** (la cantina y la seccional, con `abierta: 0`, dejan ver el valle por el vano): por eso el estado no cuenta y **cualquier puerta que caiga en lo que mira la cámara** (medio ancho del cuadro según el campo de visión y la proporción de pantalla, más 14 grados de margen) dibuja todo como siempre; a menos de 1,2 m de una puerta también. Mirando para otro lado se apaga: en la prueba por todos los edificios, con la cámara en el centro girando de a 45 grados, se apaga en 5 de cada 8 direcciones (3 de 8 en la casa de té, que tiene el ventanal a lo ancho del frente).
- **Quedan afuera de la regla** los que no son un cuarto cerrado: el observatorio (se abre al cielo), el varadero (portón abierto), el taller del tren (portones) y los que no tienen ninguna puerta registrada (la herrería y la carpintería, de frente abierto).
- **La casa de té** es una estructura del valle puesta en la aldea, no un edificio de `aldeaMundo`: `estructuras.js` ahora expone su `ancho` y `fondo` (las paredes) y `main.js` arma una caja con el frente (puerta y ventanal) a lo ancho.
- **Sombras:** al salir (o al mirar la puerta) el mapa de sombras se rehace una vez con el exterior prendido, para que no falten las sombras de afuera hasta la próxima vez.
- **Equivalencia de imagen medida** (`equiv-r7`, `equiv-r9`): en el mismo cuadro del mismo proceso, con la regla prendida y apagada, en los 31 edificios de la aldea y la casa de té, 8 direcciones y dos inclinaciones: **0 píxeles de diferencia fuerte salvo donde se mueve una persona** (el panadero, el telegrafista, el banquero, a un metro de la cámara). Antes de llegar a esto aparecieron tres errores de la propia regla que la prueba atrapó: usar el estado `abierta` de las puertas (dejaba ver el valle por el vano), no mirar hacia dónde mira el cuerpo en la herramienta y los edificios sin puertas.

### b) La gente: el choque con los obstáculos, espaciado con la distancia (`gente.js`, `rendimiento.js`)
El perfil de la plaza al ocaso (`perfil-base-r1`) mostró que **lo que costaba de la gente no era la pose sino el choque**: `col.resolver` (nueve celdas de obstáculos por persona por cuadro) y la altura del pie eran el 72 % de `gente.actualizar` (22 de 23 personas andando a esa hora).
- **A menos de 35 m: en cada cuadro** (igual que antes). **De 35 a 80 m: cada tres cuadros. A más de 80 m: cada seis.** Cada persona tiene su fase fija (0 a 5), así que entre todas se reparten (con cada = 3, dos de cada seis por cuadro). La persona se mueve en cada cuadro (la posición y el giro no se espacian); lo que se espacia es resolver el choque y apoyar el pie, que lejos no se ve.
- **Siempre en cada cuadro:** la que charla, la de una escena activa (`enEscena`, 4.19.0) y cualquiera con el cuadro lento (50 ms o más: un paso largo podría atravesar algo).
- **La pose a mitad de frecuencia entre 20 y 38 m** (~30 por segundo: `PASO_POSE_MEDIA` = 1/32 s); a menos de 20 m, charlando o en una escena, en cada cuadro como siempre; de 38 a 85 m y más lejos sigue como estaba (12 y 8 por segundo, RC23).
- **Las gallinas de la aldea** (`aldea-animales-mundo.js`) usan la misma cadencia para el choque.

### c) Lo que se investigó y no hizo falta: «fusionar» la pose
La gente **ya está fusionada** desde la 3.7.0: cada persona es **una sola malla con piel** (de 1 a 2 llamadas) y 20 a 24 huesos en una textura compartida (se contó en el juego: 21 nodos visibles por persona, 1 malla). Con la herramienta de la 4.20.0 el `updateMatrixWorld` de toda la escena entera cuesta 0,3 a 0,6 ms (23 personas incluidas, ~0,15 ms de eso) y el `skeleton.update` de 24 huesos por persona es del orden de 6 µs: no hay un ms ahí. Se probó apagar la visibilidad de los huesos sin mallas (para que `projectObject` no los recorra): la medida salió con demasiado ruido para sostenerlo (3 a 50 ms entre repeticiones) y **un hueso con `visible = false` corta el recorrido de lo que cuelga de él** (el mate, el bastón): no se hizo.

### d) Una idea que se probó y se sacó: la fauna a 30 por segundo
Si no hay ningún bicho a menos de 40 m, la fauna podía actualizarse cada dos cuadros. **No sirvió:** los bichos (mariposas, zorzales) andan siempre a 6 a 20 m de la cámara, nunca da «nada cerca» (medido en la plaza de día y al ocaso). Se sacó (con sus pruebas) para no dejar código muerto.

## 2. Medición (notebook, 1080p, ventana visible en el monitor externo, rondas **alternadas** contra la 4.22.0; el ruido entre tandas es de ±2 ms, por eso se reporta el rango y se compara de a pares)
CPU = ms del cuadro sin lastre (mediana de 6 s; `cpuMedia` = la media, desde esta versión); placa = ms de la placa a 1920x1081 con el reloj fijo (lastre de la 4.20.0). Diferencias nuevo − base, ronda por ronda.

**Plaza (la meta era ≥ 1 ms de CPU y no empeorar la placa):**

| captura | tanda | CPU (mediana) | placa |
|---|---|---|---|
| 05 plaza día | `med` (4 rondas) | −0,5 −0,9 −0,9 −1,0 | −0,38 −0,55 +0,19 −0,20 |
| | `fin` (4 rondas) | −0,2 −0,1 +0,1 −1,2 | −0,13 −0,02 −0,01 −0,10 |
| | `conf` (4 rondas, versión final) | −0,5 −0,3 +0,2 +0,3 (media: −0,58 −0,16 +0,31 +0,11) | +0,12 −0,06 +0,19 −0,07 |
| 06 plaza ocaso | `med` | −0,3 −0,7 −0,8 −0,8 | +0,04 +0,55 −0,02 +0,02 |
| | `fin` | −0,9 −1,1 −0,7 −1,4 | 0,00 +0,07 −0,06 −0,05 |
| | `conf` (versión final) | **−1,2 −1,1 −0,5 −0,5** (media: −1,14 −1,17 −0,51 −0,41) | +0,14 −0,09 +0,14 −0,10 |

- **Al ocaso la CPU baja 0,8 ms en la mediana** (12,25 → 11,45 en la tanda final; rango −0,3 a −1,4 en las 12 rondas) y la gente (`npc/perro`) 1,0 ms (2,67 → 1,64): hay 22 de 24 personas andando. **De día no baja** (−0,05 en la tanda final; −0,2 a −0,9 en las otras): a mediodía hay 3 personas a la vista (0,1 ms de `gente.actualizar` medido directamente) y casi la mitad de la CPU de la plaza es **el envío de dibujo** (`render`: 7,2 ms de ~15; dentro, ~40 % es código nativo del controlador de la placa por cada llamada), que no es de la gente.
- **La placa no empeora:** diferencias de −0,55 a +0,55 ms (el +0,55 y el +0,19 son corridas sueltas del borde de una tanda, como las de `CAMBIOS_4_22_0_C.md` §0; en la mediana de cada tanda, entre −0,29 y +0,03).
- **La meta de 1 ms de CPU en la plaza no se cumplió de día** (sí al ocaso en 2 de las 3 tandas, y siempre en los interiores). Lo que queda de CPU en la plaza es envío de dibujo (~200 llamadas: 73 de chunks del bosque, 37 de instanciados, 13 de sotobosque, 3 de pasto, la pasada de sombras de 270 llamadas cada vez que se rehace) y es de la 4.24.0 (fundir los chunks de vegetación) más que de la gente; cada llamada de la plaza cuesta ~30 µs de CPU.
- Gente medida directo con un cronómetro puesto en `gente.actualizar` (`gente-ms.js`, 3 rondas alternadas, 6 s): ocaso **1,54 · 1,66 · 1,67 ms → 1,33 · 1,06 · 1,18 ms** (−0,2 a −0,6 ms por cuadro); mediodía 0,08 a 0,13 ms en las dos.

**Interiores (lo que pedía el informe: −8 a −10 ms de placa; con la cámara de espaldas a la puerta, 3 rondas alternadas):**

| encuadre | CPU base → nuevo | placa base → nuevo | llamadas |
|---|---|---|---|
| 61 casa de té, centro (cámara al fondo) | 14,8 → 5,7 (**−9,1**; −6,1 a −10,1) | 25,39 → 9,75 (**−15,6**) | 145 → 81 |
| 62 panadería, centro | 11,5 → 7,5 (**−4,1**) | 35,89 → 14,97 (**−20,9**) | 122 → 58 |
| 63 biblioteca, centro | 11,7 → 5,4 (**−6,2**) | 19,74 → 9,14 (**−10,6**) | 217 → 140 |
| 64 cantina, centro | 11,2 → 10,2 (−2,6; −0,9 a −2,6) | 25,08 → 15,08 (**−10,0**) | 206 → 216 (la de la base varía con la gente: 278 en una ronda) |
| 10 cantina de noche (4 rondas) | 12,05 → 8,80 (**−3,3**; −1,5 a −3,6) | 23,23 → 13,48 (**−9,7**) | 236 → 173 |
| 09 casa de té con la cámara EN la puerta (3 rondas) | −0,45 (ruido) | −0,07 | la puerta está a menos de 1,2 m: se dibuja todo, como tiene que ser |

(El 62 se ve a un palmo de la pared del fondo: la placa de la base es altísima ahí por el relleno de lo de afuera; es el caso extremo.) Las capturas de los interiores antes y después son iguales a ojo (`cap-base-b` / `cap-nuevo-b`; la casa de té salió más fría en la corrida nueva: es el clima de esa corrida —se mide con la herramienta en procesos distintos—, no la regla: en el mismo proceso, con la regla prendida y apagada, la diferencia es 0).

## 3. Presupuesto (dejado escrito para 4.24.0 y 4.25.0)
- **Llamadas de dibujo nuevas: 0** (sólo se apagan). **Shaders nuevos: 0** (`interior-visible.js` es puro: sin three, sin imports, sin materiales; la prueba lo comprueba). **Texturas: 0. Capas de pantalla completa: 0.**
- **Placa de la plaza: sin cambios** (±0,2 en la mediana de cada tanda). **Interiores: −10 a −21 ms de placa** y −2,6 a −9 ms de CPU de las casas con el fondo de espaldas a la puerta: eso es lo que sobra para detalle de interiores (paredes, muebles) en versiones siguientes: el cuarto de la casa de té pasa de 25 a 10 ms de placa y el de la panadería de 36 a 15.
- **CPU de la plaza:** 15,3 ms de día y 11,5 al ocaso en esta máquina (mediana, 1080p). Margen para personajes (4.25.0): la gente cuesta ~1,6 ms al ocaso con 24 personas (con +1 mil triángulos y +0 llamadas por persona el costo extra es de GPU, no de CPU); cada **llamada de dibujo de más en la plaza cuesta ~30 µs** (30 llamadas = +1 ms). El próximo ahorro grande de CPU de la plaza es de la 4.24.0: los 73 dibujos de chunks de vegetación y la pasada de sombras (270 llamadas cada vez que se rehace).
- La gente a más de 35 m ya cuesta poco (choque cada tres a seis cuadros, pose a ~30 o menos por segundo); lo que sigue costando es la de cerca (a menos de 20 m todo en cada cuadro, a propósito: 4.19.0).

## 4. Decisiones (con lo recomendado por el informe)
1. **Sólo edificios cerrados de la aldea y la casa de té.** El almacén (también una estructura del valle) y las casas del jugador, el refugio y las cabañas quedan fuera: no se conoce el frente de cada uno y tienen ventanas de verdad o vanos propios; la regla se puede extender cuando se sepa. *Decisión mía.*
2. **Cualquier puerta a la vista cuenta como abierta**, sin mirar su estado: se midió que se dibujan abiertas aunque `abierta` valga 0. Cuesta algo de ahorro (se apaga en ~5 de cada 8 direcciones) y evita cualquier hueco al exterior.
3. **Los `InstancedMesh` sin nombre de la raíz de la escena se apagan adentro** (es el paisaje: piedras, flores, matas). Si algo nuevo tiene que verse adentro y es un `InstancedMesh` suelto, hay que ponerle `name` (queda en el tablero para A y B; ninguno de los existentes, `rincones`, `huerta`, `gallinas`, las vacas de la granja…, se apaga).
4. **El choque espaciado, sin tocar a los que charlan ni a las escenas** (4.19.0), y sin tocar la gente a menos de 35 m: la gente de cerca se ve y se comporta idéntica.
5. **No se espacia la pose de la gente de cerca** (pedido del brief: sólo lejos): la banda nueva es de 20 a 38 m.
6. Los números del «presupuesto» no incluyen la pasada de sombras rehecha (la herramienta fija la hora y la cámara, así que se rehace muy poco); en el juego, caminando, suma ~270 llamadas cada vez.

## 5. Lo que no se hizo
- Interiores del almacén, de las casas del jugador, del refugio, de la cabaña y del tren; la cabina de la trochita (el exterior se ve por las ventanas de verdad).
- La CPU de día en la plaza (no es de la gente: ver §2). Ideas que quedaron: espaciar la pasada de sombras, fundir los chunks de vegetación (4.24.0).
- Medición en la 4600G: descartada por el usuario.

## 6. No visto a ojo
- Una **puerta que se abre y se cierra** en el juego real con la regla prendida (se probó por números y con la cámara girando de a 45 grados; no se jugó el entrar y salir con el mouse). El mapa de sombras que se rehace al salir se probó en Node, no a ojo.
- Calidades Media y Baja (las rondas son Alta); nieve, otoño y lluvia dentro de los edificios; los interiores con la gente charlando, el Desafío (no tiene aldea: la regla no corre) y el modo foto con la cámara adentro.
- La gente a 35 a 80 m **moviéndose** con el choque cada tres cuadros (se midió el costo y se probó la regla; no se vio a ojo caminando por la calle de la Loma ni cerca de un cerco).

## 7. Herramientas (no entran al gate)
`herramientas/auditoria-visual-4-20-0.cjs` suma: `AUD_PERFIL_MS` (perfil de CPU con el perfilador de Chromium por encuadre: `perfil-<id>.json` con el tiempo propio e inclusivo por función), `AUD_EVAL` (un archivo con una expresión que se evalúa en la página por encuadre: `eval-<id>.json`), `cpu.media` en las medidas y el giro del cuerpo del jugador en `A.poner` (la regla lee la mira del juego antes del cuadro). `herramientas/correr-auditoria-4-23-0.ps1` (con el candado por corrida, `-PerfilMs`, `-Eval`), `herramientas/resumen-rondas-4-23-0.cjs` (junta las rondas alternadas y da la diferencia por pares) y `herramientas/auditoria-visual-4-23-0.json` (cuatro encuadres de interiores con la cámara de espaldas a la puerta: casa de té, panadería, biblioteca y cantina).

## Claves de guardado
Ninguna.

## Pruebas
- Nueva: `pruebas/verificar-4-23-0-c.mjs` (**82 comprobaciones**; se suma a `verify:pasos`): `interior-visible.js` (campo de visión, puertas a la vista a 0, 52, 80 y 90 grados y a las espaldas, pegado a la puerta, mirada vertical, edificios abiertos, sin puertas, el estado `abierta` que no cuenta, la caja de la casa de té con su conversión de marco y sus bordes), la cadencia de `rendimiento.js` (35 y 80 m, el cuadro lento, la que charla, las fases y su reparto), `gente.js` con el código de verdad (la pose por banda, `caminarHacia` con y sin choque, la marca `__sinChoque` según la distancia) y `main.js` (`apagarExterior` con un mundo de mentira: apaga lo que tiene que apagar, deja lo de adentro y lo de nombre propio, vuelve a prender todo, rehace las sombras al salir; `interiorDeLaCasaDeTe`; el enganche en `dibujar` con `finally`). **Mutaciones de verdad (copias con otro nombre; un proceso por copia para los módulos puros): 62** (usar `abierta`, el coseno al revés, sin pegado a la puerta, sin margen, el observatorio cerrado, sin puertas apaga, afuera apaga, la caja girada al revés, sin altura, ancho por fondo, el frente al revés, cortes de 20/60 m, fases, sin cuadro lento, la pose entera lejos, la gente adentro apagada, sin prender lo apagado, sin vaciar la lista, sin rehacer sombras…); la copia sin tocar pasa y las 62 mutadas hacen fallar su comprobación.
- Previas que tocan lo cambiado: los **98 archivos** de `pruebas/verificar-*.mjs` que leen `gente.js`, `rendimiento.js`, `aldea-animales-mundo.js`, `aldea-mundo.js`, `estructuras.js` o `aldea-gente.js` corrieron en verde. **Se ajustó a propósito una:** `verificar-3-6-2-visual.mjs` miraba el texto exacto de `dibujar()` (`apagarVacias(); try { … } finally { prenderVacias(); }`); ahora acepta el `apagarExterior()` y el `prenderExterior()` que se suman en el mismo `try/finally` (la comprobación sigue siendo que se vuelve a prender todo aunque falle el dibujo). `verificar-4-19-0-c` (la pose de la escena) y `verificar-optimizacion-autodiagnostica-rc23` (el texto de `pasoPose`) siguen en verde sin ajustarlas: la línea de `pasoPose` conserva el prefijo que miran. No se corrió `npm run verify` completo.

- **Humo de partida real:** `pruebas/humo-3-9-0-cantina.cjs` (entrar a la cantina caminando, sentarse, pedir, tomar, pagar con trueque, guardar) con la versión nueva y con la 4.22.0, en el monitor externo y con el candado: sin errores de consola en ninguna; las capturas del salón y de la puerta son iguales entre las dos versiones (con la puerta abierta a la vista se dibuja el exterior, como en la base). El paso «terminó el vaso» (tomar los dos sorbos con esperas de 45 ms) falló una vez en la versión nueva y una en la base y pasó en la otra corrida de la nueva: es de tiempo, no de esta versión.

## Efectos que cruzan a otras zonas
Ninguno hacia A ni B (nada de economía, Desafío, Historia ni guardado). Aviso en el tablero: un `InstancedMesh` suelto sin `name` en la raíz de la escena se apaga mientras la cámara está adentro de un edificio de la aldea.
