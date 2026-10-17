# 4.0.1 — pase de bugs de la 4.0.0

Rama `bugs-4-0-1` (sale de `v392-mejoras`; sin push, sin tocar `main`). Se trabajó sobre los cuatro informes de revisión (`trabajo/bugs/zona-A.md` a `zona-D.md`, 50 hallazgos).
Cada hallazgo se reprodujo o se confirmó antes de tocarlo (con los arneses de los revisores, que recorren el código real con terreno y colisiones reales). Cada arreglo lleva su prueba
y un comentario `4.0.1:` en el código. Nada se quitó del juego. Ningún texto nuevo en inglés (el inglés se hace al final).

## Estado de los hallazgos

Leyenda: **arreglado** (con prueba en el gate) · **no se confirmó** · **pospuesto** (con el motivo) · **pregunta** (decide el usuario).

### Zona A — cantina, peña, banco

| # | Hallazgo | Estado |
|---|---|---|
| A1 | ALTO. Pedido cobrado que nunca se sirve (la carta abierta desde la charla con Lucrecia no la dejaba «tomada»; también con la carta fuera de horario) | **arreglado**. `pedirItem` no cobra si no hay moza que lo sirva; `aceptarOrden` la toma si no la tenías; `abrirCarta` exige local abierto. Prueba `verificar-4-0-1-cantina.mjs` |
| A2 | ALTO. Alejarte más de 40 m con un pedido en camino y volver: excepción en cada cuadro (cantina y casa de té) | **arreglado**. Al volver el pedido se retoma (o, sin moza, se apoya en la mesa): ya no hay `controla` nulo. Misma prueba (las 5 fases) |
| A3 | MEDIO. Sin mando no se puede operar el banco ni las cartas de la cantina y la casa de té | **pospuesto**: ver preguntas. Requiere decidir cómo se navega una carta de ~25 platos con forma de pago, y no se puede probar sin un mando real |
| A4 | BAJO. Vasos de los parroquianos desaparecen entre 40 y 45 m | pospuesto (cosmético; toca la peña y la cantina a la vez) |
| A5 | BAJO. Avisos de «se mueve el mundo» con la borrachera en «apagado» | pospuesto (cosmético) |
| A6 | BAJO. La peña del sábado de madrugada cuenta como «domingo flojo» en `afluencia` | pospuesto (cambia cuánto tarda la moza; es de balance) |

### Zona B — creador de Bruno, guardado, sincronización

| # | Hallazgo | Estado |
|---|---|---|
| B1 | ALTO. Capa beige colgada si falla el segundo contexto WebGL: no se puede entrar | **arreglado**. El dibujante se crea antes de colgar la capa, dentro de `try`; si falla, `abrirCreador` devuelve `null` y `crearABruno` entra con el aspecto que ya había (y avisa). Prueba `verificar-4-0-1-creador.mjs` (con WebGL falso) |
| B2 | MEDIO. Relojes desfasados entre PCs: una hora de juego en la otra PC se ve como 3 ms y sale el aviso «también se siguió jugando acá» | **arreglado**. Cada guardado suma uno a `secuencia` (viaja con la partida); `compararCopia` ofrece también si la de la carpeta tiene más guardados y no es más vieja. Partidas de antes (sin `secuencia`) cargan como 0. Prueba `verificar-4-0-1-sincronia.mjs` (dos «PC» con dos módulos y un reloj +3 h) |
| B3 | MEDIO. Crear a Bruno pisa gorro y bufanda con un solo accesorio | **arreglado** con la opción conservadora: el accesorio elegido se **suma**, no se saca la prenda que ya tenías. Ver decisiones |
| B4 | MEDIO-BAJO. Retrato que pasa de 60 000 caracteres con la escala de Windows en 150-200 % y se descarta sin avisar | **arreglado**: `setPixelRatio(1)` al sacar el retrato. Probado leyendo (no se corrió con `--force-device-scale-factor`) |
| B5 | MEDIO-BAJO. La base de la carpeta se fija antes de saber si la importación anduvo | **arreglado** (se fija después, y no si falla). Prueba de texto en `verificar-4-0-1-sincronia.mjs` |
| B6 | MEDIO. Álbum incompleto (una foto no se pudo leer) se copia a la carpeta y borra fotos en la otra PC | **arreglado** para la carpeta sincronizada: `leerPartida` avisa `fotosIncompletas` y `copiarASync` no deja la copia. El «Exportar» manual no se tocó. Prueba en `verificar-4-0-1-sincronia.mjs` |
| B7 | BAJO. Notas de primera vez gastadas con el primer clic en «Entrar» | pospuesto (cosmético) |
| B8 | BAJO. Efecto del cuaderno asimétrico (−17 % / +25 %) | pospuesto (el jugador no ve porcentajes; es de balance) |
| B9 | BAJO. El afecto de Bruno también escala la amistad del romance, contra lo anotado | **pregunta** (decisión de diseño: o se corrige el texto o el efecto) |
| B10 | BAJO. Un número guardado como objeto raro hace que `cargarProgreso` devuelva null | pospuesto (sólo con un archivo retocado a mano; son muchos saneadores) |
| B11 | BAJO. Escape en el prólogo no recupera el bloqueo del mouse | pospuesto (semántica de Chromium; sin Electron real no se confirma) |
| B12 | BAJO. Enter o Espacio sostenidos pasan las tarjetas del prólogo | **arreglado** (se ignoran las teclas repetidas) |
| B13 | BAJO. Los modales no atrapan el foco con Tab | pospuesto |
| B14 | BAJO. Copia a la carpeta de más de 64 MB falla en silencio y se reintenta | pospuesto |

### Zona C — módulos visuales 4.0 y molino

| # | Hallazgo | Estado |
|---|---|---|
| C1 | MEDIO. El campo de tulipanes y el cerco cortan el sendero (421 de 1926 tulipanes sobre el camino) | **arreglado sin mover el sendero ni el terreno**: no se plantan tulipanes a menos de 1,6 m del sendero (quedan 1400) y el cerco se abre donde el sendero lo cruza (esquina sudeste). Prueba con el terreno real `verificar-4-0-1-molino.mjs` (camina el sendero con las colisiones reales) y humo en Electron `humo-4-0-molino.cjs` |
| C2 | MEDIO. Arroyo del molino hasta 3,9 m en el aire, muros sin colisión, el sendero lo cruza por debajo | **arreglado**: el agua de lo llano sigue la loma (antes se fijaba al punto más alto de todo el tramo). Cruza el sendero a ras del suelo (vado). Mismas pruebas; capturas a tamaño completo vistas (`arroyo`, `cascada`, `molino-aerea`) |
| C3 | MEDIO. Modo foto con la hora congelada: rayos, niebla y pelusa no siguen la hora | **arreglado** (el acumulador del ambiente usa el tiempo real si la hora está congelada). Prueba de texto en `verificar-4-0-1-nucleo.mjs`; no se probó el aspecto en pantalla |
| C4 | MEDIO-BAJO. Los 64 bancos de niebla de valle atraviesan cabaña, galpón y faro | **arreglado**: un banco que cae sobre una construcción no se dibuja (se descartaron 7 de los nuevos; los 104 de siempre no se mueven). Prueba en `verificar-4-0-1-molino.mjs` |
| C5 | MEDIO-BAJO. La galería de la casa del molino no tiene colisión | **arreglado**: el frente y los dos lados de la galería son sólidos (la escalerita queda de adorno, como la casa por dentro) |
| C6–C9 | BAJOS. Halos de la casa de té de día, charco de luz bajo la galería de la cantina, paisaje fijo en los ventanales, orden de dibujo del agua | pospuestos (cosméticos; tocan luces y orden de dibujo) |
| C10 | BAJO. El mapa de sombras no se libera al bajar a calidad baja | pospuesto a propósito (la regla del proyecto es no tocar el sistema de sombras) |
| C11 | BAJO. Lo de calidad media/alta no se retira al bajar la calidad en vivo | pospuesto (de diseño; ver preguntas) |

### Zona D — núcleo, Desafío, construcción

| # | Hallazgo | Estado |
|---|---|---|
| D1 | ALTO. Quedás encajonado cuando el piso de una casa se levanta con vos adentro en una ladera | **arreglado**: al avanzar la obra, `jugador.desencajar()` sube al jugador a la cara de arriba si quedó metido dentro de una plataforma entera. Prueba `verificar-4-0-1-construccion.mjs` (con las colisiones reales) |
| D2 | MEDIO. Caer en el Desafío sobre el kayak, el velero o la trochita no te baja | **arreglado** (`soltar` en cada vehículo, antes de guardar). Prueba (kayak andando; el resto por texto). No se probó una caída real con la trochita |
| D3 | MEDIO. Casas grandes sin entrada si el frente mira cuesta abajo | **arreglado** con la opción conservadora: no se funda (con el motivo «La entrada queda muy alta… girala (R)») donde el escalón quedaría a más de un paso del suelo. No cambia la forma de ninguna casa. Ver decisiones |
| D4 | MEDIO. Escudo pegado si soltás L2 en la pausa | **arreglado** |
| D5 | MEDIO. La fauna acumula el tiempo de la pausa | **arreglado** |
| D6 | MEDIO-BAJO. Banco de pruebas: el informe queda pegado y desde la portada se rompe | **arreglado** |
| D7 | MEDIO. Rehacer a Bruno en el espejo: mouse bloqueado, pausa abierta debajo, teclas pegadas | **arreglado** (suelta el mouse, olvida las teclas y soltar el mouse no abre la pausa). Sólo por texto; no se probó con el mouse bloqueado de verdad |
| D8 | MEDIO-BAJO. La catapulta (y la campana y las trampas) apuntan a las crías del Rey que están 650 m más arriba | **arreglado** |
| D9 | BAJO-MEDIO. La victoria no sale si abrís el cuaderno o el mapa durante los 5,2 s | **arreglado** (se actualizó la expresión de `verificar-3-8-3-combate.mjs`) |
| D10–D19 | BAJOS. Muro en la mano que sostiene un entrepiso, perro trabado al bajar del kayak, tren de pasajero en pausa, puente levadizo, crías sin estados, relámpagos en pausa, «Girar» del cuaderno, radios de golpe, guardias, juntar armas con la altura | pospuestos (raros o de diseño; ninguno bloquea) |

**Resumen:** de 50 hallazgos, 4 altos y 17 más arreglados (con prueba); 1 medio pospuesto (A3, mando); el resto, bajos pospuestos o preguntas. Ninguno se descartó por «no se confirmó».

## Pruebas agregadas (todas en el gate: `npm run verify` da 225 pasos OK, antes 219)

- `verificar-4-0-1-cantina.mjs` — pedido servido desde la charla, cerrado sin cobrar, lejos-y-vuelta en cinco fases.
- `verificar-4-0-1-creador.mjs` — sin WebGL no queda capa colgada; retrato a 240×300 reales; prólogo ignora teclas repetidas.
- `verificar-4-0-1-construccion.mjs` — encajonado en la ladera y entrada cuesta abajo (con `pruebas/ayuda-4-0-1-mundo.mjs`, que carga `src/` con el three local).
- `verificar-4-0-1-nucleo.mjs` — kayak, fauna, escudo, victoria, banco de pruebas, espejo, catapulta, modo foto.
- `verificar-4-0-1-sincronia.mjs` — dos «PC» con relojes desfasados, base de la carpeta, álbum incompleto.
- `verificar-4-0-1-molino.mjs` — con el terreno real: sendero, tulipanes, cerco, arroyo, galería y niebla.
- Humo en Electron (ventana al monitor externo), todos OK: `humo-4-0-molino.cjs`, `fotos-molino-40.cjs` (capturas vistas a tamaño completo), `humo-caos.cjs` (800 pasos), `humo-4-1-creador.cjs` y `humo-3-9-2-cantina.cjs` (la cantina y la casa de té de verdad).

## Decisiones tomadas sin consultar

1. **B3, el accesorio no saca el abrigo.** Dos formas: (a) el accesorio elegido pisa gorro y bufanda (como estaba) o (b) se suma a lo que ya tenías. Elegí (b): cambia menos el juego (la partida con poncho + gorro + bufanda sigue templando igual). Consecuencia: el aspecto del creador muestra un solo accesorio pero «Tu personaje» puede seguir con los dos. Se cambió una línea de `humo-4-1-creador.cjs` (ya no exige `bufanda === false`; ese humo no se corrió).
2. **D3, rechazar el sitio en vez de modificar el escalón.** Dos formas: (a) no dejar fundar con la entrada cuesta abajo o (b) prolongar el escalón con una rampa. Elegí (a): no cambia el aspecto ni la física de ninguna casa. Efecto jugable: en una ladera (casona y casa con galería desde ~4 %, cabaña de piedra ~6 %, casilla y puesto ~9-10 %) hay que girar la casa con R. Los umbrales salen de que el escalón no supere 0,60 m sobre el suelo.
3. **D1, subir al jugador en vez de impedir la etapa.** Elegí subirlo a la cara del piso (ya pasa en el llano, donde el piso es un escalón de 0,62): no cambia lo que podés construir.
4. **C1, hueco en el cerco y franja sin flores.** Como el sendero no se puede mover, el cerco se abre (sólo donde el sendero lo cruza de verdad: el portón y la esquina sudeste) y el campo pierde las plantas a menos de 1,6 m del camino (526 de 1926, el 27 %).
5. **C2, el agua pegada a la loma.** Cambia el aspecto del arroyo en lo llano: ya no hay paredón de piedra de 4 m ni agua colgada; los muros de piedra seca sólo quedan donde la orilla queda más de 0,35 m bajo el agua.
6. **C4, descartar el banco de niebla sobre construcciones** en vez de subirlo: la niebla sigue a ras de suelo en el resto del valle.
7. **C5, galería sólida y escalerita decorativa**, igual que el interior de la casa.
8. **A1, si no hay moza, no se cobra** (en vez de dejar la visita a medias): se avisa «no hay quien atienda» o «todavía no abrimos».
9. **B6, sólo la copia a la carpeta se salta con el álbum incompleto**; el «Exportar» manual sigue exportando lo que haya.
10. **B2, el contador de guardados** convive con el reloj: nada cambia para quien juega en una sola PC.

## Preguntas para el usuario

- **A3, el mando en el banco y las cartas.** ¿Querés que el mando navegue las cartas con la cruceta (elegir plato, elegir forma de pago, A para confirmar)? Hace falta definirlo bien (la carta tiene títulos, platos y botones de pago) y probarlo con un mando.
- **B9.** El afecto de Bruno (±20 %) también escala la amistad que dan las citas y los regalos del romance, aunque `CAMBIOS_4_1_F3.md` dice que el romance no se toca. ¿Dejamos el efecto y corregimos el texto, o lo quitamos del romance?
- **B3.** ¿Preferís que elegir «Nada» o «Anteojos» en el creador te saque el gorro y la bufanda (como antes)? Hoy no los saca.
- **C11.** Al bajar la calidad «en vivo» (la pregunta «¿bajar la calidad?» o tras perder el contexto) siguen todos los efectos de la 4.0 (rayos, niebla extra, halos). ¿Querés que se apaguen al pasar a baja, para aliviar la placa?
- **D3.** ¿Te cierra el mensaje y el límite (0,60 m) de las casas con la entrada cuesta abajo, o preferís una rampa visible?

## No probado

Un mando real; una caída real con la trochita o el velero; el espejo de Bruno con el mouse bloqueado de verdad; `--force-device-scale-factor` para el retrato; fps en la 4600G (nada de lo nuevo suma dibujos por cuadro; los tulipanes y los bancos de niebla bajan).
