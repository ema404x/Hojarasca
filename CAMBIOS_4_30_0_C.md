# 4.30.0 (C) — el mundo, la física y lo que quedó de la 4.29.2

Zona C: los puentes, la cascada y el arroyo, la física, cada zona del valle, las calidades y lo que quedó afuera de la 4.29.2. Se cazó en
partida real (`pruebas/humo-4-30-0-c.cjs`, minimizada, con el candado de Electron; capturas en `C:\Users\Andres\AppData\Local\Temp\hx\c4300\`:
`r1` = antes, `r2`…`r11` = después) y leyendo el código. **Ningún programa de shader nuevo**: se cambió el texto de programas que ya existían
(la cortina de la cascada y el agua, en todas las calidades) y lo nuevo de Ultra va dentro del programa de Ultra de la aldea. Sin claves de
guardado nuevas: lo soltado con V guarda además su altura `y` (opcional) en la lista `soltados` que ya existía; las partidas viejas cargan igual.

## Arreglado — rompe la partida (el personaje se cae, se traba o se pierde algo)
| Bug | Causa | Arreglo | Visto |
|---|---|---|---|
| **El puentecito del camino Refugio–Aldea (sobre la cascada) tenía una pared de 2,1 m del lado bajo y un salto al vacío del lado alto.** Viniendo de la Aldea no se podía subir: se pasaba por abajo, al agua (nadando); desde el refugio, al final del tablero te caías 2 m | `sulky.js` `puentesDelCamino`: el tablero era plano a la altura de la orilla **más alta** + 0,25, y ahí el arroyo baja en escalón (orillas a 13,4 y 11,4 m) | El tablero va **en rampa** de orilla a orilla (`y0`, `y1`; `alturaPuente(b, x, z)`), con 35 cm sobre el agua: si no alcanzan, las puntas se corren camino afuera (acá pasó de 12,6 a 26,5 m) y, si igual no, se levanta. `rincones-mundo.js`: la malla inclinada y el piso en tramos de 0,5 m a la altura de la rampa; el sulky (altura e inclinación), la bajada del sulky (`rincones-juego.js`) y los faroles del camino (ya no quedan colgando junto al puente) leen la rampa | Antes (r1): cruzar de vuelta caminando → «nado, caída, desvío 1,48 m». Después (r2): ida y vuelta, caminando y corriendo, sin caída ni agua, 0,011 m por cuadro (`p1-camino-*`, `c-lejos`) |
| **Los puentes de la trochita dejaban la vía colgada 2 a 5 m en el aire** a los dos lados (la vía y el balasto flotando; a pie, a 2 m del puente caías 4 m a la quebrada y no había cómo volver a subir) | `terreno.js` no toca el terreno hasta `luz/2 + 6` del centro y la quebrada sigue más; el tablero medía `luz + 4` | `trochita.js` `largoTableroRiel`: el tablero (malla, caballetes, barandas y piso) sigue de cada lado hasta donde el terraplén llega a la vía (29 → 40 m en el puente del valle). El terreno no se toca (huella fija) | Antes (r1): «caída», 4,4 m bajo el piso. Después (r2): de punta a punta en los dos sentidos sin caída (`p2-riel-encima`) |
| **Lo soltado con V (ramitas, piñones, cantos…) arriba de un puente o en un piso alto caía al terreno de abajo**; y arriba de un puente sobre el agua V decía «Se te va con el agua» | `objetos.js` `soltar` ponía siempre `T.altura(x, z)`; `soltarRanura` miraba el agua sin mirar el tablón | `soltar(id, x, z, guardado, yPie)`: apoya en `alturaDePie` (el tablón, el piso; nunca bajo el terreno) y la partida guarda esa `y` (`guardado.js`); con un tablón bajo los pies, V deja las cosas aunque abajo haya agua (`main.js`) | r6: parado en el puente de troncos, V → la ramita queda a 18,81 (el tablero) y no a 16 (el lecho); `s-ramita-en-el-puente` |

## Arreglado — se ve mal
| Bug | Causa | Arreglo | Visto |
|---|---|---|---|
| **La cortina de la cascada en Alta: con la partida larga los hilos se aplastaban en rayas horizontales y anillos**, y el dibujo subía | `agua.js`: la fase del ruido era reloj × velocidad según la altura (lo mismo que se arregló en Ultra en la 4.29.2) | El dibujo corre parejo en el **tiempo de vuelo** (√ de lo caído) y baja, como el de Ultra. El mismo programa | `c-frente-reloj-grande` con el reloj en 9000 s: r1 rayas y anillos; r2/r3 hilos que caen |
| **El arroyo con rayas y costuras rectas que crecían con el tiempo de juego** (de cerca, hilos estirados de orilla a orilla y cortes entre tramo y tramo; con 2 h de partida, peor) | `agua.js`: el arrastre de las ondas era corriente × reloj (y las vetas de los rápidos, reloj × corriente): la corriente cambia de vértice a vértice, así que con el reloj grande el dibujo se estiraba y se partía en cada unión. Además cada tramo de la cinta (`cinta-arroyo.js`) tenía su propia normal y su corriente: en cada unión, una cuña de agua doble o un salto del dibujo | La onda grande y las vetas corren en **dos fases que se turnan** (cada una vuelve a cero cada ~14 s mientras la otra manda): el arrastre queda acotado; las ondas finas y las cáusticas ya no se arrastran. En Ultra igual (`ultra-agua.js`: espuma, burbujas y chispas). La cinta: en las vueltas suaves (< 0,5 rad) los dos tramos comparten el borde y la corriente; las cerradas siguen con su abanico | `a-95`, `a-190`, `p0-troncos-costado`: r1 con rayas; r2 en adelante, lisas. La costura punteada de `c-lejos`: ver r10 |
| **Los costados de la cortina se metían en las orillas** (de costado se veía su borde de abajo cortado contra la barranca) y **la cortina nacía 20 cm por encima del agua** del labio | La cortina medía 2 veces el semiancho del arroyo y nacía en `arriba + 0,12` | 1,72 veces (8 % más ancha abajo en vez de 14 %); nace al nivel del agua; dos piedras grandes más a cada lado de la caída | `c-poza-costado` (r2 → r8) |
| **Las gotas al pie de la cascada eran cuadraditos blancos** (en Alta) | `PointsMaterial` sin textura | Motas redondas con el material de la bruma de la cascada (ningún programa más; en Ultra siguen escondidas) | `c-poza-costado`, `p1-camino-costado` |
| Las piedras de las cabeceras del puente de troncos, icosaedros de 20 caras | `IcosahedronGeometry(0.34, 0)` | Detalle 1 | `p0-troncos-encima` |

## Lo que quedó de la 4.29.2
| Pedido | Qué se hizo |
|---|---|
| La luz de los hornos que titile con el brillo del material (sin luz nueva, mismos programas en Alta) | `aldea-mundo.js` `brilloBrasas`: el color del material de las brasas (hornos, fraguas, hogares de la aldea) titila de 0,7 a 1 con el mismo pulso que la luz de la fragua y un temblor chico (nunca salta de golpe de un cuadro al otro). Todas las calidades; ninguna luz ni programa nuevo. No se sacó una captura en movimiento (ver «No visto») |
| Otro intento con las huellas en las lajas | **Hecho (Ultra).** El intento de la 4.29.2 no se veía porque las tomas no dejaban pisadas (la herramienta de capturas no tiene el paso `antes`: la textura de huellas quedaba vacía). Ahora `GLSL_ALDEA_ULTRA` lee las huellas finas en la laja y la piedra de la plaza: en seco, polvo claro y terroso del ripio; con lluvia, barro pardo y mate que corta el brillo de la laja mojada y el charco. Leídas sin derivadas (`pisadaLodU`): leídas con derivadas dentro del `if` del material, la placa avisaba «X3595 gradient instruction used in a loop» (visto en la consola en Ultra; ya no sale). Visto: `r9\l-seco-antes` / `l-seco-despues` (la fila de pisadas en el sendero de laja), con lluvia en r11 |
| El borde irregular en el color del suelo y el relieve del ripio, sólo si cuestan < 0,5 ms en la plaza | **No se hicieron.** La 4.29.2 midió el desvío del color del suelo en ~2 ms en la plaza (el césped de la aldea no tiene matas que lo tapen: se pinta cada píxel) y también sacó el relieve del ripio por costo; en esta PC la plaza varía 3 a 5 ms entre corridas, así que no hay cómo probar que una variante cueste menos de 0,5 ms |

## Inventario de la física (desde el código) y qué se probó
«Partida» = probado en la partida real de esta versión; «código» = leído, sin bug a la vista.

| Qué | Dónde | Cómo se probó | Resultado |
|---|---|---|---|
| Caminar y correr (aceleración, frenar contra lo que choca, `paredEntre`) | `jugador.js` `actualizar` | Partida: 70 corridas de 3 s a toda carrera desde puntos al azar del valle (semilla fija), contando subidas solas (> 35 cm en un cuadro sin plataforma), hundidas bajo el terreno y trabadas sin nada cerca | 0 raras |
| Saltar | ídem | Partida: saltar caminando y corriendo en el llano del refugio | 1,03 y 0,78 m sobre el piso (lo de siempre: 4,8²/28 ≈ 0,82) |
| Pendientes (resbalar > 50°, cuesta arriba más lento) | ídem | Partida: las 70 corridas cruzan laderas | Ninguna subió sola ni quedó trabada |
| Plataformas y escalones (subida 0,62 m, tablones, `desencajar`) | `colisiones.js` | Partida: los cuatro puentes (troncos, camino, vía, colgante armado sobre el arroyo), ida y vuelta, caminando y corriendo; empujar contra las barandas | Arreglados el del camino y el de la vía; barandas: nadie pasa (troncos 0,73 de 1,2 m; camino 0,62 de 1; vía 1 de 1,3) |
| Nadar (entrar y salir del agua) | `jugador.js` | Partida: del muelle al lago 9 s y de vuelta | Entra a nadar y sale a la orilla |
| La cámara contra las paredes | `jugador.js` (cerca 0,15 m, cuerpo 0,35 m) | Partida: correr y caminar contra el refugio desde 8 rumbos, con captura | Nunca a menos de 3,3 m del centro (la pared); por la puerta, frena en la pared del fondo; la cámara no atraviesa (`f-pared-*`). Corriendo se desliza por la pared y dobla la esquina (no la atraviesa) |
| A caballo (no entra al agua honda, no pisa el colgante) | `jugador.js`, `caballo.js` | Código | Sin bug a la vista |
| Sulky | `rincones-juego.js`, `rincones-mundo.js` | Código + Node | Arreglado sobre el puentecito (altura e inclinación de la rampa) |
| Tirolesa y puente colgante | `tirolesa.js` | Partida: un colgante armado sobre el arroyo, cruzado en los dos sentidos | Sin bug |
| Kayak, velero, trochita (`enTren`) | sus módulos | Código | Sin bug a la vista |
| Lo que se tira con V (sueltos y bultos) | `main.js` `soltarRanura`, `objetos.js` | Partida + Node | Arreglado (ver arriba) |
| La pelota del fútbol | `futbol.js` `pasoPelota` | Código | Rebota con 0,42, la frena el pasto y sale de la cancha: nada vuela ni atraviesa |
| Las gotitas de Ultra | `ultra-vida.js` | Código | Mueren al tocar el piso |
| Aparecer en un lugar sin altura (`ubicar` sin y) | `jugador.js` | Partida: 24 puntos alrededor de cada lugar del valle | Sólo la torre de avistaje: aparecer justo debajo de su plataforma te pone arriba (7 m). Caminando no pasa (`plataformaBaja` elige el piso más bajo, y bajo la torre no hay otro). **Anotado**: cambiarlo podría dejar en el suelo a quien carga una partida vieja adentro de una casa con pilotes |

## El mundo (zonas, calidades, menús)
- Las 16 zonas con nombre y la Aldea: pararse en 24 puntos alrededor de cada una (nadie queda bajo el piso ni cae en un hueco: sólo la torre, ver
  arriba) y una captura de cada una (`r2\z-*`): nada flotando ni atravesado a la vista.
- Todas las calidades con Ultra prendido y apagado (muy baja 88 programas, baja 91, media 104, alta 104, alta + Ultra 118, media + Ultra 104 =
  Ultra no corre en media): carga sin errores, el mapa (M) y la pausa (Esc) abren y cierran (`r3\q-*`, r11). Con Ultra, antes del arreglo de
  `pisadaLodU`, la consola mostraba el aviso X3595 (la 4.29.2 no lo tenía: medido con la 4.29.2 armada aparte, r7).
- Anotado sin tocar: en las curvas de la vía los cajones de balasto (3,4 m) dejan escalones en el borde; es de forma, no se tocó.
- Invierno (r13): las zonas y la cascada con nieve, nada flotando ni atravesado; las mismas «raras» que en verano (sólo la torre).
- La partida larga (2 h, Alta, minimizada; `largo.json`): de lugar en lugar a pie, midiendo cada minuto. Memoria JS 273 → 313 MB (sube al
  principio y se queda: 326 entre los 22 y los 100 min y 307 al final); geometrías 958 → 1.269 y texturas 64 → 87, casi todo en la primera
  vuelta por el valle (lo que se arma al llegar a cada lugar) y después plano (texturas 86-87 desde el minuto 73, geometrías +8 en la última
  hora); los programas 103 → 106; el cuadro (CPU) 3,5 → 4,8 ms (picos sueltos de hasta 26 ms al llegar a un lugar). No crece sin techo.
- **La gente trabada** (en la partida larga): Ramón, junto al puesto, caminaba en el lugar 12 s en dos de sus tres tramos de cada vuelta y
  después aparecía del otro lado (la red de la 4.25.2). `gente.js` `rodeoEnRuta`: si en 1,2 s casi no se acercó, busca un punto a un
  costado libre (1,7 a 4,4 m, del mismo lado mientras le sirva) y lo rodea. Visto (r14/r15): el tramo del medio ahora lo rodea; **el primero
  no** (sale de detrás del mostrador del puesto y del otro lado no hay paso a un costado: haría falta un punto más en su ruta, que es de la zona
  de A). Dos intentos: anotado. Sigue la red de los 12 s. Una vez cada uno, Ema (al pasar por ahí) y Nene y Nélida en la plaza, caminando en
  el lugar un instante (no se repitió).

## Cuánto cuesta (ms por cuadro con `gl.finish`, ventana minimizada, mediana de 3 rondas, la misma PC)
| | 4.29.2 (r5, r7) | 4.30.0 C (r8) |
|---|---|---|
| Alta, mirando la cascada | 13,8 · 13,8 | 14,3 |
| Alta, mirando el arroyo | 7,6 · 7,4 | 6,3 |
| Alta + Ultra (r4, con la versión de dos fases completa) | — | cascada 27,0 · arroyo 27,6 |
Dentro del ruido de esta PC (la cascada +0,4, el arroyo −1). La plaza no tiene agua. La primera versión de las dos fases (todas las octavas
dos veces) daba +1,1 ms en la cascada (r6): se dejó sólo la onda grande en dos fases.

## No visto a ojo
- Las brasas titilando (las capturas son quietas: el pulso está probado en Node).
- Las huellas en las lajas con lluvia, de cerca y en movimiento (sólo la captura de r11).
- Lo soltado en un piso alto de una casa (se probó sobre el puente; es el mismo `alturaDePie`).
- Los caminantes de la Aldea trabados un instante (Nene, Nélida): una sola vez cada uno en 2 h; no se buscó la causa.

## Pruebas
- Nueva: `pruebas/verificar-4-30-0-c.mjs` (en `verify:pasos`): 47 comprobaciones y 21 mutaciones (un proceso por copia), todas atrapadas.
- Partida real: `pruebas/humo-4-30-0-c.cjs` (secciones `puentes`, `cascada`, `fisica`, `medir`, `soltar`, `lajas`, `refugio`, `zonas`,
  `calidades`, `largo`, `ramon`; `HUMO_PARTES`, `HUMO_ULTRA`, `HTML`, `HUMO_CALIDADES`, `HUMO_MINUTOS`, `HUMO_ESTACION`, `HUMO_GENTE`, `HUMO_RASTRO`). No va en `verify:pasos` (Electron).
- Ajustadas a propósito: `verificar-estructuras-v3` (el piso del puente de la vía mide `tablero`), `verificar-3-8-3-aldea` (la bajada del
  sulky lee la rampa), `verificar-3-8-8-arroyo` (la cortina 1,72 y no 2,0), `verificar-4-12-1-agua` (tope de ruidos +2: las vetas en dos
  fases, condicionadas a donde corre), `verificar-4-29-2-b` (las lajas ahora sí leen las huellas).
- En verde: `verificar-2-2`, `-3-3-bosque`, `-3-7-5-rincones`, `-3-0-1-estructuras`, `-3-8-4-relax`, `-3-8-6-relax`, `-4-25-2-tirar`,
  `-4-25-2-guardado`, `-4-26-5-c`, `-4-28-0-a/b/c`, `-4-29-0-a/b/c`, `-4-29-1-a/b`, `-4-29-2-a/b`, `-4-21-0-c`, `-4-22-0-c` y las que leen
  `soltarRanura`, `alturaDePie` o `soltados` (`3-5-4-ventana`, `3-6-1-aldea`, `3-6-2-juego`, `3-7-0-integracion`, `4-0-1-nucleo`,
  `4-10-4-aldea`, `4-12-2-carro-guardado`, `4-18-4-c`, `4-19-0-c`, `4-24-1-b`, `4-25-1-b`, `4-25-3-restantes`, `4-26-1-b`, `4-26-2-a`,
  `4-26-4-a`, `mando`) y las de la gente (`4-25-2-npc`, `3-6-gente`, `4-11-2-gente`, `4-10-1-npc`, `4-25-1-a`). No se corrió `npm run verify`.
- Choque posible con B: `guardado.js` (una línea de `soltados`) y `main.js` `soltarRanura` (dos líneas), por «tirar con V»; con A: `gente.js` (el rodeo, en la rama de la gente de ruta de `actualizar`).
