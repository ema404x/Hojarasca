# Hojarasca 4.16.0 (agente A) — Historia nueva: la mecánica del acto II (capítulos 5 a 8)

Rama `v4160-a`, sobre `main` = 4.15.0. No se subió la versión (se hace al juntar). B escribe sólo `src/historia-escenas-acto2.js` y `src/historia-texto-acto2.js`
(los guiones del acto II como datos); en esta rama hay dos HUECOS con esos nombres para que arme y corra. **Al juntar las ramas se queda el archivo de B
(los míos se descartan; es un conflicto «los dos agregaron»).** Acá está todo lo demás: capítulos, objetivos, decisiones, disparadores, efectos, objetos
del mundo, el acompañante, el clima de la historia y las pruebas.

## IDS DE ESCENA DEL ACTO II (contrato con B)
Los ids son los que dispara `src/historia-disparadores-acto2.js`. Una escena que no está escrita se da por vista (la historia nunca se traba). Cómo se
dispara cada una (el jugador ya está donde ocurre; las anclas de la escena son `jugador`, como en el acto I):

| Cap. | Id | Cómo sale | Qué cambia la mecánica sola |
|---|---|---|---|
| 5 La rueda | `piedras-molino` | auto, a menos de 14 m de las piedras del molino viejo (raíz del coihue grande), 7–20 h | tema `ema:piedras` |
| | `zaino-ramon` | tras `piedras-molino`: E sobre Ramón, o llegar al Puesto Alto | **entrega el zaino** (`cosas.caballo`), `prestado.zaino` |
| | `tito-coihue` | tras `piedras-molino`, con el molino de agua terminado y a menos de 30 m del coihue. **D2**: la elección se llama `coihue` y sus opciones llevan `decision:coihue:a|b|c` | — |
| | `tobias-cantera` | D2 = c: E sobre Tobías con 10 piedras en la mochila (o el acopio) | gasta 10 piedras, `acompanante = tobias`, entrega `tobias:piedra` |
| | `rueda-gira` | con D2 decidida, el aserradero hecho y cerca del molino | — |
| 6 Lo que se pierde | `perdidas-ercilia`, `perdidas-rosa` | E sobre Ercilia / sobre Rosa (`panadera`) | temas `ercilia:perdidas`, `panadera:perdidas` |
| | `devuelve-dedal`, `devuelve-pipa`, `devuelve-cuchara` | E sobre Ercilia / Belisario / Rosa con el objeto levantado | entrega marcada (el aviso sale aunque la escena no esté) |
| | `luces-lago` | E sobre Nicanor | tema `nicanor:luces` |
| | `el-que-vuela` | cerca del faro (≤ 60 m), 23–1 h, tras `luces-lago`; no empieza arriba del kayak: sale al bajar | — |
| | `guardia-molino` | sentado a menos de 22 m de la raíz del coihue (o el tocón), 0:30–2:30 h. **El juego te levanta del asiento antes de empezarla.** Con la espera sentado el reloj corre ×8 | — |
| | `raiz-ramon` | a menos de 10 m de la raíz de la ladera de Ramón, 5:30–10 h, tras `guardia-molino` (siguiendo las huellas) | — |
| 7 La cosecha | `primera-molienda` | 10 medidas molidas desde que empezó el capítulo, cerca del molino propio. **D3**: elección `molienda`, efectos `decision:molienda:a|b|c` (y `ramal:4` en a, `ramal:2` en c: los pone la escena) | — |
| | `minga-vecinos` | algo cocinado desde que empezó el capítulo, en la plaza de la aldea, 9–17 h | — |
| | `galpon-ronda` | al amanecer (5:30–11 h) del día siguiente a `minga-vecinos`, a 16 m de tu galponcito (**PUNTO MEDIO**; el cuaderno queda en el pozo, con E se agarra) | — |
| | `fiado-ercilia` | D3 = b (6 medidas de harina) o c (3): E sobre Ercilia con la harina | gasta la harina, entrega marcada |
| | `harina-raiz` | D3 = c: E en la raíz del coihue con 1 medida | gasta 1, `duendes.convidado +1` |
| 8 El cuaderno | `libreta-ercilia` | E sobre Ercilia | tema `ercilia:cuaderno` |
| | `cuaderno-josefina` | E sobre Josefina (`ema`) | tema `ema:cuaderno` |
| | `los-del-cerro` | E sobre Belisario | tema `belisario:cerro` |
| | `secreto-ramon` | E sobre Ramón, 17–20 h, con lazo de Ramón ≥ 0 | tema `ramon:ceniza` |
| | `fogon-leyenda` | en la plaza, 20:30–23:30 h, tras `libreta-ercilia` y `cuaderno-josefina`. **D4**: elección `cuaderno`, efectos `decision:cuaderno:a|b|c` | — |

Optativas del guion (`trigo-abuelo`, `tablas-tito`, `masa-sola`, `foto-sofia`, `fermin-habla`, `veta-que-vuelve`, `mulas-belisario`, `herminia-noventa`):
**sin disparador en esta versión** (ver «Lo que no se hizo»).

**Efectos y condiciones nuevos** (se suman a la convención del acto I; documentados acá por la prueba del acto I, que pide que cada condición tenga su doc):
- Condición «presente» `{ quien }` (`siPresente('rosa')`, con `no: true` para «todavía no llegó»): esa persona vive en la aldea (Rosa es la panadera). La usa la escena `bolsa-alero`.
- Efecto `quitar:<cosa>:<n>` (gasta harina, piedras…) y `prestado:<id>` (anota lo prestado: `zaino`, `tobias`…). `acompanante` acepta también `tobias`.
- Lo demás del acto II se escribe con los efectos de siempre (`decision:coihue|molienda|cuaderno:<a|b|c>`, `lazo:`, `ramal:`, `raro:`, `objeto:`, `entrega:`, `dar:`, `mundo:`, `duende:`, `optativa:`, `hablado:`). Los lazos de Tito, Tobías y Belisario no se guardan (la historia sólo lleva seis lazos): el efecto `lazo:tito:-1` se ignora, como ya decía la convención.
- **Para B, decisiones**: las tres elecciones se llaman `coihue`, `molienda` y `cuaderno`. La mecánica de cada opción (gastar, entregar, fletes, la pirca) la hace el juego, no la escena. La tarjeta de respaldo (`DEFINICION_DECISIONES`) sale sola si la escena no está o no tomó la decisión.
- **Para B, cuaderno de lo raro**: `TEXTO_ACTO2.raro` con la forma de `TEXTO_ACTO1.raro` (`{ id: { titulo, texto, cap, donde } }`); `historia.js` lo junta en `RAROS`. Si B usa nombres de exportación distintos a `ESCENAS_ACTO2` / `EFECTOS_ACTO2` / `TEXTO_ACTO2`, hay que cambiar tres líneas en `main.js` y `historia.js`.

## Qué se hizo
1. **Los capítulos 5 a 8 con objetivos de verdad** (`src/historia.js`; sin «continuará»):
   - **5 «La rueda»**: piedras del molino viejo (escena), zaino (escena + el zaino queda tuyo y `prestado.zaino`), molino de agua terminado, decisión D2 del coihue, cumplir D2 (A: aserradero a más de 25 m del coihue; B: talado con seis hachazos + aserradero; C: diez piedras para Tobías, él te sigue hasta el coihue, la pirca en la raíz y el aserradero), habas sembradas y, como momento, el puente del arroyo. Premio: 4 medidas de harina y semillas de habas. **Puerta de estación** (otoño, 2 días).
   - **6 «Lo que se pierde, aparece»**: preguntar a Ercilia y a Rosa, escuchar a Nicanor, encontrar las tres cosas perdidas (dedal en un poste del andén, pipa junto al faro, cuchara en una bota en la plaza), devolverlas a sus dueños (Ercilia, Belisario, Rosa), salir de noche en kayak o velero al faro (23 a 1 h, a menos de 40 m), la guardia sentado junto al coihue (el reloj corre ×8) y a la mañana las huellas en la escarcha hasta la raíz de la ladera de Ramón. Premio: el farol y la lámpara de Eusebio (una cosa, sin colgar), yerba.
   - **7 «La cosecha»**: seis cosechas, diez medidas molidas **desde que empezó el capítulo** (el contador `molido` sube cuando sacás la harina de la muela), el galponcito, D3 de la primera molienda, cumplir D3 (A: 3 fletes de la trochita; B: 6 medidas a Ercilia, se gastan; C: 2 fletes + 3 medidas a Ercilia + 1 a la raíz), cocinar algo y llevarlo a la minga (plaza, 9 a 17), el galpón en ronda al amanecer siguiente (punto medio) y el cuaderno del pozo. Premio: yerba y el cuaderno.
   - **8 «El cuaderno de Eusebio»**: tres páginas del cuaderno (E en la mesa del refugio), Ercilia, Josefina, Belisario, Ramón al atardecer (con el lazo de Ramón < 0 alcanza con estar en su puesto de 17 a 20: nunca se traba) y la D4 en el fogón. Premio según D4: leña, el poncho de Ramón o el flete de estudio (hoy sólo el texto: ver límites).
2. **Disparadores del acto II** (`src/historia-disparadores-acto2.js`, puro; se junta con el acto I en `historia-disparadores.js`): 24 ids de escena (tabla de arriba), `EFECTOS_ESCENA_ACTO2` (lo que cambia la mecánica al verlas), `NOTAS_ESCENA_ACTO2` (el aviso en pantalla por si la escena no está escrita) y `OBJETOS_ACTO2` (los objetos del mundo).
3. **Estado y vocabulario nuevos** (`historia.js`): `estadoHistoria` suma `estacionNatural`, `caballo`, `harina`, `piedra` (mochila + acopio), `cocinadas`, `enKayak`, `aserradero { hay, lejos, cerca }`, `fletesHarina`; `CONTADORES_HISTORIA` suma `molido` y `cocinadas`; `PRESTADOS` suma `zaino`; `ACOMPANANTES` (los de lazo + `tobias`); `historia.fletesHarina` y `historia.fletesBase` (los fletes que cuentan para cumplir la molienda son los de después de decidir); `talado(id)`, `paginasLeidas`, `puertaDeEstacion`, `estacionForzada`, `diasEsperados`, `premioDeCapitulo` (con `premioVar`) y `DEFINICION_DECISIONES` con D2, D3 y D4 (las tres con respaldo de tarjeta; `tomarDecision` suma `ramal`).
4. **Puerta de estación y clima de la historia**: con el capítulo 4 cerrado y el calendario todavía en verano, el capítulo 5 muestra una tarjeta corta («Las lengas todavía están verdes») y espera; pasados 2 días arranca igual y el valle se pone en otoño aunque el calendario diga verano (`conClimaDeHistoria` en `main.js`, sólo con la estación en «auto»; vale para el acto II entero). Si ya es otoño o invierno, no hay puerta. (En el año de 12 días el verano natural llega hasta el día 4.)
5. **Esperar sentado**: la espera de una hora de la historia (la guardia) limita el reloj sentado a ×8 (sin historia, o sin una espera pendiente, sigue ×40). `aceleracionDeEspera` ahora está enganchada en `actualizarTiempo`.
6. **El coihue grande**: el coihue más grande cerca de las piedras del molino viejo (el mismo que ya elegía el objeto `raiz-coihue`; **no se mueve ni se suma ningún árbol**) lleva `grande = true`: seis hachazos (sin importar el oficio ni el filo) y la historia se entera (`coihueTalado`: marca `mundo:coihue-talado`; si no habías decidido «talarlo», la decisión pasa a B y Josefina −2, una sola vez). Se le dibujan cuatro puertitas talladas al pie del tronco (decoración) y, con D2 = C, la pirca de piedras.
7. **Objetos de historia con E** (los dibuja `historia-objetos.js` con el material de siempre y mallas chicas; **0 programas de shader nuevos por la historia**): dedal en un poste, pipa, cuchara en una bota, huellas de la escarcha (un rastro de unas 40 manchitas del coihue a la raíz de Ramón), puñado de yerba, ronda de harina con el pozo, cuaderno del pozo, la raíz para dejar una medida de harina, la raíz para levantar la pirca, el cuaderno de la mesa (tres páginas) y los props del acto I que sólo dejaban marca: piñones en el tocón (se juntan), cuchara en el techo y la puertita apoyada en tu puerta a la noche (se levanta y anota lo raro). La ronda de ramitas del umbral es más grande (de lejos no se veía).
8. **Acompañante real** (`historia-acompanante.js`): Graciela (desde el andén del capítulo 4) y Tobías (capítulo 5) te siguen a pie un poco atrás y al costado (con `camino` + `velocidad` de `gente.js`: caminan, apuran o corren según lo lejos que estés), aparecen a tu lado si te alejás más de 42 m y se esconden mientras vas en el tren, el kayak o el velero (aparecen al bajar). **No suben al tren con vos.** Al soltarlos (la pirca, cerrar el capítulo 4) Tobías vuelve a su ruta de la cantera.
9. **Pendientes del acto I** que me tocaban:
   - **(a) Rosa**: la escena `bolsa-alero` ofrece la opción de Rosa sólo si Rosa ya vive en la aldea (condición `presente`; con Rosa ausente la pregunta tiene dos opciones y saltar toma «convidar»). Cambio mínimo en `historia-escenas-acto1.js` (dos pasos de elección con `si`) y `siPresente` en `historia-escenas-util.js`. **Aviso para B**: si reescribe `bolsa-alero`, tiene que conservar esa condición.
   - **(b) Props**: piñones, cuchara en el techo y puertita a la noche ya se dibujan (punto 7). `majada-pasa` y `trochita-parte` siguen sin malla propia (ver «Lo que no se hizo»); `bolsa-se-pierde` es la bolsa del alero que se apaga al decidir.
   - **(c) A ojo**: ver «Lo que se vio a ojo».
10. **Dos arreglos de las escenas del acto I que se vieron a ojo**: **Elsa no se dibujaba** en las escenas (`aparecer` no la sacaba de «a bordo» de la trochita: ahora `escenas-mundo.js` la trae mientras dura la escena y la devuelve) y las escenas **ancladas a algo del refugio** arrancaban con el jugador mirando para cualquier lado: ahora el juego lo pone donde la escena lo necesita (`COLOCACION_ESCENA`: la nota adentro del refugio, la ronda en el umbral, el hacha en el tocón, el alero), y `ronda-umbral` y `hacha-tocon` se disparan cerca de donde están sus props (puntos `refugio-puerta` y `tocon-hacha`).

## API
- `historia-disparadores-acto2.js`: `DISPARADORES_ACTO2`, `ESCENAS_ACTO2_IDS`, `EFECTOS_ESCENA_ACTO2`, `NOTAS_ESCENA_ACTO2`, `PAGINAS_CUADERNO`, `OBJETOS_ACTO2`, `ESCENAS_DESDE_SENTADO`, `LUGARES_ACTO2`, `HARINA_DE_ENTREGA`, `cuadernoVisible`, `leerPagina`, `alTalarCoihue`.
- `historia-acompanante.js`: `crearAcompanante(ctx)`, `puntoDeSeguimiento`, `decidirPaso`, `acompananteActual` y las constantes de distancia.
- `historia-disparadores.js`: `COLOCACION_ESCENA` (dónde se pone al jugador antes de una escena anclada al refugio).
- `historia-ui.js` (lo que usa `main.js`): `valle.aceleracion()`, `valle.estacionForzada()`, `valle.coihueTalado()`, `valle.harinaMolida(n)`; el `ctx` de `crearValleUi` suma `darCosa`, `gastar`, `levantar`, `colocar`.
- `ctx` de `aplicarVistas`: `{ eventos, dar, tieneCaballo, gastar }`.
- Lugares nuevos de `puntosDeHistoria`: `molino-propio`, `galpon-propio` (tus obras terminadas), `coihue`, `raiz-ramon`, `tocon-hacha`.

## Decisiones por criterio mío (sacables o discutibles)
- **El acarreo con el zaino** («tres troncos y seis piedras al molino») no es un objetivo aparte: la obra del molino ya pide sus materiales, y el texto lo dice. Sin «acopio en obra marcada».
- **Los fletes de la molienda A/C** cuentan los fletes de la trochita que hagas después de decidir (los mismos que ya suman al ramal); **la carga no es literalmente harina** y no se gasta harina.
- **La minga** se arma en la plaza de la aldea cuando llevás algo cocinado desde que empezó el capítulo, de 9 a 17: no espera al día 7 del calendario (es la «fiesta guionada»).
- **La guardia** pide estar sentado cerca de la raíz del coihue (o el tocón) de 0:30 a 2:30; hace falta un banco o un asiento (el texto dice «con un banco, O»).
- **Tobías** hay que ir a buscarlo a la cantera (trochita al Puesto de la Cantera): está a unos 500 m del refugio. La pirca se levanta sin hacer falta que te siga (si no lo lográs, la E en la raíz igual la levanta).
- **Los premios** del capítulo 8 por D4 son los del guion; el flete de estudio (C) sólo es texto.
- Lazos secundarios (Tito, Tobías, Belisario): no se guardan.

## Verificación
- `pruebas/verificar-4-16-0-historia-a.mjs` (en el gate): 478 comprobaciones y **36 mutaciones** del código (se rompe una garantía y la prueba tiene que fallar; se atrapan las 36). Cubre: los cuatro capítulos y sus objetivos uno por uno, D2/D3/D4 con las tres opciones, los 24 disparadores (cada uno con su lugar, hora y condición), lo que cambia al ver cada escena (idempotente), los objetos del mundo según el estado, la puerta de estación y el clima, el recorrido de punta a punta de cada capítulo, el acompañante con una persona de mentira y el enganche con el juego (por texto).
- Pruebas viejas ajustadas a propósito: `verificar-4-15-0-historia` (los capítulos 5 a 8 ya no son «continuará»; el zaino está en `prestado`; las puertitas del coihue están siempre a la vista; `ronda-umbral` y `hacha-tocon` salen cerca de sus props), `verificar-4-15-0-escenas-acto1` (la opción de Rosa sólo con Rosa; acepta la documentación de las condiciones nuevas en este archivo) y `verificar-4-2-oficios` (la línea de los hachazos ahora también lleva el coihue grande de seis).
- `npm run verify` de corrido: **320 pasos OK** (con la prueba nueva adentro). En el paralelo bajo carga fallaron una vez, y pasan solas, `construccion-premium-rc6`, `release` y `3-9-2-cantina` (son de tiempo).
- **Partida real** `pruebas/humo-4-16-0-historia.cjs` (Electron con WebGL, monitor externo, perfil propio; secciones sueltas con `HUMO_SOLO=1,4`): todo en orden. 0 puerta de estación y clima; 1 capítulo 5 de punta a punta (molino y aserradero de verdad, Tobías que te sigue, la pirca, el puente, el premio); 2 el coihue grande con seis hachazos (y otro árbol con tres); 3 capítulo 6 (las tres cosas, el kayak al faro, la guardia con el reloj ×8 y una escena de prueba que te levanta del asiento, las huellas); 4 capítulo 7 (la muela suma lo molido, D3, la minga, el galpón, el cuaderno); 5 capítulo 8 (páginas, vecinos, D4, premio); V las escenas del acto I a ojo (hojas de contacto); D los programas de shader en Libre. Las decisiones salen de la escena de B si está (el humo la lee con Enter y contesta la pregunta) o de la tarjeta de respaldo si no (esa rama con escena de B **no se probó**: no existe todavía). Capturas en `pruebas/salidas/historia-4-16-0/`. El humo del acto I (`humo-4-15-0-historia.cjs`) quedó ajustado: la pregunta de la bolsa tiene dos opciones porque Rosa todavía no vive en la aldea (corrió todo en verde salvo eso; no lo volví a correr después del ajuste).
- **Un fallo suelto del humo**: una vez la sección 4 no mostró la tarjeta de entrada del capítulo 7 apenas arrancó (no se repitió en las corridas siguientes). No supe la causa; lo anoto como de tiempo.
- Tiempos aproximados: entender el estado de la historia, 25 min; módulos puros y capítulos, 70 min; objetos del mundo, acompañante, `main.js` y arreglos del acto I, 90 min; humo (escribirlo y pulirlo, con corridas de 5 a 9 min), 110 min; prueba nueva con mutaciones, 30 min; el gate completo, 9 min.

## Lo que se vio a ojo (escenas del acto I; capturas en `pruebas/salidas/historia-4-16-0/`)
Se jugaron 14 escenas (dos cuadros de cada una, en hojas de contacto `hoja-0N.png`). Lo que se vio:
- **Arreglado**: Elsa no se dibujaba en `estacion-llegada` (hablaba fuera de cuadro); `nota-eusebio` y `ronda-umbral` arrancaban con la cámara en el pasto de afuera; ahora la nota se lee adentro del refugio y la ronda se mira desde el umbral.
- **Ok**: `ramon-tranquera` (Ramón de frente, buen plano), `almacen-ercilia` (muy linda, dentro del almacén), `bolsa-coihue`, `anden-graciela`, `derrumbe-puertita` (con su pregunta), `te-graciela`.
- **Queda mal o dudoso (sin arreglar)**:
  - `nota-eusebio`: adentro del refugio la cámara mira la chimenea y no la mesa (no sé dónde está la mesa en coordenadas del refugio; la colocación mira a donde está `nota-mesa`).
  - `fermin-galpon`: la cámara queda pegada a las tablas del galpón y Fermín no sale en cuadro (en la prueba Fermín todavía no estaba armado; si es el muro, hay que acomodar el plano).
  - `bolsa-alero`: la cámara queda pegada al muro, con la bolsa a un costado.
  - `hacha-tocon`: el tocón de la escena (el que se dibuja) se pierde entre los lupinos; el hacha se ve.
  - `algo-cruza`: en los dos cuadros no se vio el duende (puede ser sólo el momento).
  - Las barras de cine tapan arriba y abajo en los planos picados (de diseño del motor).
- **No se vio**: `trochita-boleto`, `cabina-elsa` (no pueden empezar arriba del tren), `ese-no-josefina`, `mesa-visita-*`, `placa-herminia` (corrió, no se miraron los cuadros), el resto de las líneas de cada diálogo.

## Lo que no se hizo / límites (honesto)
- **Las escenas del acto II** (B) no están en esta rama: todo se probó con las escenas «dadas por vistas» y con una escena de prueba para la guardia. Al juntar hay que repetir el humo con las escenas reales (cámara, textos, que ninguna se trabe, saltar con Esc).
- Optativas del guion sin hacer (ver arriba), **la foto guionada** de las luces del lago, **el rastro** sólo es el de la mañana (no brilla: son manchas pálidas), **la lámpara de Eusebio** no se cuelga en el molino (es una cosa), **el horario de invierno** de la trochita, **el arreo**, los **blancos** de práctica y **«Lugares raros» en el mapa**.
- `majada-pasa`, `trochita-parte` y `mundo:bolsa-se-pierde` sólo dejan marca.
- El acompañante **no sube al tren ni al carro con vos**; Graciela y Tobías aparecen al bajar. No probé a caminar con Graciela en el humo (sólo con Tobías).
- El flete de estudio del capítulo 8 (C) no suma al ramal (sólo el texto).
- **Programas de shader**: 110 en la historia, sin ninguno de más por los objetos del acto II. Se ven +1 al ir de día por el molino viejo y +1 al ir al faro de día y +3 al ir al faro de noche en kayak: **pasa igual en el Relax libre** (104 → 105 → 108, medido en la sección D del humo) y no es de la historia.
- No se midieron fps en la Ryzen 5 4600G ni se corrió nada en Desafío (la historia no entra en el Desafío). No hay inglés (se hace al final).
- Los lugares de las cosas perdidas (poste del andén, junto al faro, plaza) se eligieron a ojo; el dedal quedó en el poste junto al andén bajo el techo de la estación. Si molesta el lugar, es una línea en `OBJETOS_ACTO2`.
- Con la estación fijada a mano (no «auto») el clima de la historia no cambia nada (la puerta igual abre a los 2 días).
EOF

## Junta con las escenas de B (actualización)
Con las 37 escenas reales de B enchufadas (`ESCENAS_ACTO2`, 112 efectos en `EFECTOS_ACTO2`, registrados uno por uno por `registrarEfectosActo1`; el «apagón» son pasos comunes y no necesita nada).
- **Ids: manda la tabla de B.** Mis ids mecánicos pasaron a los de B (`tobias-pirca`, `luces-lago-nicanor`, `perdidas-devueltas`, `ramon-raiz`, `molienda-fiado`, `molienda-partir`, `minga-aldea`, `libreta-fiado`, `cuaderno-abuelo`). Se sacaron `preguntar` (capítulo 6: ya no hay objetivo de hablar con Ercilia y Rosa) y las tres devoluciones sueltas: ahora son una sola escena con Ercilia cuando tenés las tres cosas. Sólo queda una mecánica sin escena: `harina-ercilia-c` (las tres medidas a Ercilia con D3 = c; se da por vista con su aviso).
- **Disparan sin que yo los agregue de antes**: `coihue-en-pie` (junto al aserradero lejos del coihue), `coihue-talado` (cerca del tocón), `huellas-escarcha` (junto al molino, 6 a 8:30, tras la guardia) y `ramon-raiz` (en la raíz), `molienda-fletes` (andén, tercer flete), `pluma-umbral`, y las optativas `trigo-abuelo`, `truchas-nicanor`, `masa-crece`, `fermin-mulas`, `veta-vuelve`, `herminia-noventa` (todas por E sobre el vecino, con su condición de decisión). **Sin disparador**: `tablas-tito`, `foto-sofia`, `mulas-belisario` (Tito y Sofía no son vecinos con E; la foto movida y la tropa de mulas no existen). `cuaderno-1`, `cuaderno-2` y `cuaderno-3` salen de la E en la mesa del refugio (si la escena existe se juega; si no, la nota de siempre).
- **D2 = C**: la escena de Tobías levanta la pirca (`mundo:pirca-coihue` la deja marcada como objeto) y gasta las 10 piedras; **ya no hace falta que Tobías te siga** (el seguimiento sigue andando con Graciela y se probó con Tobías puesto a mano). La E en la raíz queda de respaldo.
- **Lazos**: las opciones de B no mueven lazos en la pregunta de D2/D3 (los dan las escenas de cumplir). El respaldo de tarjeta sí los mueve. La tala del coihue con el hacha pone Josefina −2 una sola vez, y la escena `coihue-talado` puede sumar el suyo (tope −2).
- **Pedidos de B**: hechos porque eran baratos: **muelas rotas** del molino viejo, **diez bolsas** junto al molino con la primera molienda, **pluma de cóndor** en el umbral (se levanta con E), huellas en la escarcha y yerba (ya estaban), **duendes**: `lechucero-vuela`, `enjambre-lago`, `siluetas-raiz/saludan/corren` y `pillos-bellotas` con `historia-duendes.js` (si el modelo `volador` o `enjambre` no existe usa el pillo; **no se vieron en pantalla**: las escenas corrieron pero el humo no miró a los duendes). `el-que-vuela` **puede empezar arriba del kayak o el velero** (`ESCENAS_DESDE_VEHICULO`, un permiso sólo para esa escena). **No hechos**: foto movida, llavecita, diez cantos blancos como objetos (los efectos `objeto:` quedan anotados en `temas['obj:…']`), puntos nuevos `molino-historia`/`puesto-alto`/`cantera`/… (las escenas se anclan al jugador y alcanza), el nieve alta, la tropa de mulas, `mundo:fogon-leyenda`, `mundo:minga`.
- **Cámara arreglada a ojo**: la mesa del refugio estaba mal puesta (la nota y el cuaderno se leían en (−1,4; 0,9); la mesa real está en (1,1; −0,98) de su estructura): ahora `nota-eusebio` arranca mirando la mesa, no la chimenea. `bolsa-alero` arranca un metro y medio más atrás (la cámara quedaba contra el muro).

### Lo que se vio a ojo de las escenas del acto II (15 escenas, `hoja-w-0N.png`)
- **Bien**: `zaino-ramon` (Ramón de frente), `el-que-vuela` (faro, luna, el texto), `minga-aldea`, `fogon-leyenda` (de noche, farolitos), `secreto-ramon` (primer plano de Ramón), `pluma-umbral` (el umbral de noche).
- **Dudoso**: `tito-coihue` y `rueda-gira` arrancan con la cámara contra un tronco y sin ver la rueda (en la prueba no había molino armado); `huellas-escarcha` con un helecho pegado a la lente; `guardia-molino` muy oscura (es de noche; no se ve el banco); `ramon-raiz` con Ramón muy chico a la distancia de la escena. Las que quedan en el pasto o contra un muro (`primera-molienda`, `galpon-ronda`, `libreta-fiado`) las puse yo a un lugar cualquiera en la prueba: en el juego se disparan frente al molino, el galpón o Ercilia (no se vieron en su lugar real).
- No se miró el resto de los diálogos de cada escena ni las 22 que quedaron sin muestra.

### Verificación de la junta
- Humo del acto II (`humo-4-16-0-historia.cjs`) con las escenas reales de verdad: todo en orden (secciones 0, 1, 3 y 4, 5 y W; las decisiones salen de las escenas de B, se leen con Enter y se contesta la pregunta). El del acto I también, con la pregunta de la bolsa de dos opciones. Una sola vez falló la sección 4 por una tarjeta que no salió a tiempo (no se repitió).
- `verificar-4-16-0-historia-a.mjs`: 549 comprobaciones y 36 mutaciones, adaptada a los ids de B. `verificar-4-16-0-escenas-acto2.mjs` (B): 1610 en verde.
