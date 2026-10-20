# 4.5.0 · Consola de códigos (Ctrl+Mayús+C)

Pedido del usuario (21-10): «que haciendo Ctrl, Shift y C se abra como una ventana de diálogo tipo Sims donde podamos activar trucos».
Rama `trucos-45` (sobre `v392-mejoras`, 4.4.3). Sin push.

## Cómo se usa

1. **Ctrl+Mayús+C** abre la consola (y la cierra). También cierran **Esc** y el código `salir`. Se abre jugando o desde la pausa; con el mapa, el cuaderno,
   el modo foto, una pregunta o durmiendo, no.
2. Se escribe un código y **Enter** lo ejecuta. La respuesta queda en el historial de la ventana («Listo: tenés $50.000», «No entendí «xyz»: probá «ayuda»»).
3. Al escribir salen **sugerencias** (con una línea de ayuda); **Tab** completa (y, apretado de nuevo, da vuelta por las opciones); **↑ ↓** recorren lo que
   escribiste antes (hasta 50 códigos, sólo mientras el juego está abierto).
4. **`ayuda`** lista todos los códigos, uno por línea; **`ayuda plata`** explica uno.
5. Mayúsculas, tildes y espacios de más no importan (`ESTACION   Otoño` y `estacion otono` son lo mismo); alcanza con el comienzo si es único (`plat 5`).
6. Mientras está abierta el juego **queda quieto** (como con el menú de pausa): la hora no corre, el modo del juego pasa a `trucos`, el mouse se suelta. Lo que
   escribís **no dispara acciones**: la consola toma el teclado antes que el resto (oyente en captura sobre la ventana). Al cerrar, vuelve al modo de antes
   (jugando o la pausa) y el mouse se vuelve a atrapar como al salir de cualquier menú.

## Los códigos (34)

Con un número, `+` y `−` suman o restan (`plata +500`, `tablas -20`); sin signo, **fijan** el valor. Los puntos de miles se aceptan (`50.000`).

**Dinero y materiales**
| código | qué hace | rango |
|---|---|---|
| `plata 50000` | fija tus pesos (alias `pesos`, `dinero`) | 0 a 99.999.999 |
| `materiales 100` | troncos, tablas, piedras y lana de la mochila (en el Desafío, sin lana) | 0 a 9.999 |
| `troncos N`, `tablas N`, `piedras N`, `lana N` | uno solo | 0 a 9.999 |
| `depositos` | llena al tope pilas de piedra, depósitos, barracas y silos construidos (no el herramientero) | — |
| `herramientas` | te da hacha, pico, tijera, mosca, farol y botas (las que no tengas; sólo Relax) | — |

**Tiempo y clima** (sólo Relax)
| código | qué hace |
|---|---|
| `hora 18` · `hora 6:30` · `hora 21.5` | pone la hora (no cambia el día); `amanecer` (6:30), `mediodia`, `atardecer` (19), `medianoche` |
| `dia 12` | salta al día (sólo hacia adelante, hasta el 9999; `dia +3` también) |
| `estacion otoño` | verano, otoño, invierno o `auto` |
| `clima lluvia` | despejado, lluvia o variable |
| `congelar` / `descongelar` | detiene / reanuda el reloj del día |

**Jugador y lugares** (también en el Desafío)
| código | qué hace |
|---|---|
| `velocidad 3` | multiplica la velocidad a pie, 0,25 a 6 (`velocidad normal` la deja como siempre) |
| `salto 4` | multiplica el salto, 1 a 6 (`salto normal`) |
| `volar` | prende o apaga el vuelo: Espacio sube, C o Ctrl bajan, W A S D mueven; no atraviesa el suelo |
| `frio` | prende o apaga «no sentir frío» (nada de entumecimiento, tampoco durmiendo sin fuego) |
| `ir faro` | teletransporte por nombre; `ir` sola lista los 25 lugares (16 del valle y 9 de la aldea: `plaza`, `banco`, `cantina`, `biblioteca`, `ramos`, `escuela`, `observatorio`, `te-aldea`, `aldea`); `ir 120 -80` va a un punto |
| `donde` | tu posición y el lugar más cercano |

**Desbloquear y completar**
| código | qué hace |
|---|---|
| `planos todos` | en el Relax dice que ya están todos (ningún plano está bloqueado); en el Desafío no se regalan |
| `oficios maximo` | los siete oficios al nivel 5; `oficios hachero 3` uno solo (0 a 5); `oficios cero` (también en el Desafío) |
| `historia capitulo 5` | te deja al comienzo del capítulo 5 (los anteriores quedan completos, los siguientes sin hacer); `historia completar`; `historia reiniciar` |
| `amigos todos` | todos los vecinos compadres; `amigos todos amigo`; `amigos ercilia compadre` (sólo sube la amistad, nunca baja) |
| `cuaderno completo` | anota todo lo que falta (292 anotaciones); `cuaderno completo flora` sólo una sección |

**La consola**: `ayuda`, `estado` (día, hora, pesos, lugar), `guardar`, `limpiar`, `salir`.

## Consecuencias: ninguna

- **No dejan rastro.** `plata` escribe el saldo directo: no pasa por el libro de movimientos ni suma a lo ganado o gastado. Los materiales y el resto, igual.
- **Logros:** el único código que podría darlos es `cuaderno completo`. Lo anotado así se guarda en una marca chica (`progreso.trucos.entradas`: sólo ids de
  anotaciones, saneada en `guardado.js`) y los logros del Relax ven la partida **sin esas anotaciones** (`vistaParaLogros` envuelve `logrosRelax.revisar`).
  Los demás códigos no tocan nada que cuente para un logro. En el Desafío no hay códigos de cuaderno, planos, historia, etc.
- **Lo del jugador** (velocidad, salto, vuelo, sin frío) y el **reloj congelado** viven sólo en memoria: no se guardan y se apagan al reiniciar el juego
  (`volar`, `frio` y `congelar` se apagan repitiéndolos). Verificado en el guardado real: no aparecen.
- **Clima y estación** son los mismos ajustes del menú de ajustes: se cambian en memoria y se guardan sólo si después se toca algún ajuste.

## En el Desafío

Aplican: materiales (sólo troncos, tablas y piedras), jugador (velocidad, salto, volar, frío), `ir` a los 16 lugares del valle, `oficios`, `depositos`, `donde`,
`estado`, `guardar`, `ayuda`. El resto responde que es del Relax y **no toca nada** (la prueba compara la partida entera antes y después).

## Decisiones (para revisar)

1. **`plata N` fija** el saldo (como pide el mensaje «Listo: tenés $50.000»); con `+` suma. Lo mismo con los materiales.
2. **`dia` sólo avanza.** Volver atrás desordenaría la huerta, los préstamos, los encargos y las citas (guardan días futuros). Los días saltados no se viven.
3. **`planos todos` no regala nada en el Relax** porque ya no hay planos bloqueados; en el Desafío no se regalan porque `planos` cuenta para un logro.
4. **`historia` no entrega premios** de los capítulos saltados y activa la historia aunque la hubieras pausado. Se puede volver atrás de un capítulo ya hecho.
5. **`cuaderno completo` anota lo que un logro suele pedir ver**: por eso la marca. Si después descubrís de verdad una de esas anotaciones, esa no cuenta para el logro.
6. **`amigos`** suma amistad con el mismo mecanismo de los regalos (de a 10 puntos, respeta los rasgos de Bruno); los vecinos quedan «conocidos» del cuaderno.
7. **Ctrl+Mayús+C**: el juego usaba Ctrl y C para agacharse. Al abrir, la consola deja el agachado como estaba antes de apretar Ctrl. Electron no tiene menú
   (`Menu.setApplicationMenu(null)`), así que no hay otro atajo en juego; la consola igual frena la tecla (`preventDefault`) por las herramientas de desarrollo.
8. **Hambre y cansancio no existen** en el juego, así que no hay código para ellos; el frío es el entumecimiento de dormir sin fuego en invierno.
9. Los textos están en **`src/trucos-textos.js`** (todo lo que dice la consola, las líneas de `ayuda` y los nombres de los lugares), listos para editar y,
   al final, para traducir.

## Límites y lo que no se probó

- **Sólo teclado y ratón.** No hay soporte de mando.
- El mouse se vuelve a atrapar al cerrar con `Esc` como en la pausa; con `Ctrl+Mayús+C` seguro (es un gesto del usuario). No se probó el atrapado real del mouse
  con una persona, porque la partida de prueba corre sin ventana.
- Guardar volando guarda la altura: al cargar caés desde ahí (no hay daño por caída en el juego).
- `ir` a un lugar de la aldea te deja en la calle, a 7 m del edificio hacia la plaza (no adentro); los del valle, en su puerta o su centro. Se comprobó que cada
  destino queda sobre el terreno y con espacio libre; no se miró cada uno en una captura.
- Dormir sigue cambiando la hora aunque el reloj esté congelado (el sueño fija la hora de la mañana).

## Archivos

`src/trucos.js` (motor puro), `src/trucos-textos.js` (textos), `src/trucos-pantalla.js` (DOM), `src/trucos-juego.js` (enganche: teclas, modo, mouse, lugares),
`src/jugador.js` (cuatro valores opcionales), `src/main.js` (arma la consola, reloj congelado, logros), `src/guardado.js` (la marca), `src/plantilla.html` (la hoja y su
estilo, con las variables del «Cuaderno de campo»), `pruebas/verificar-trucos.mjs` (en el gate), `pruebas/humo-trucos.cjs` (partida real con las teclas de verdad).
