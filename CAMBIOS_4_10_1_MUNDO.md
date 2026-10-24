# 4.10.1 · bugs del mundo (zona A: mochila con casillas, puestos, recursos de zona, tablón, gente del campo; zona E: consola y pruebas frágiles)

Rama `bugs-410-mundo` (sale de `origin/main` = 4.10.0). Sin subir la versión. Informes de origen: `trabajo\bugs3\zona-A.md` y `zona-E.md`.
Todo hallazgo se reprodujo o se confirmó leyendo el camino completo antes de tocarlo. Cada arreglo tiene su prueba que EJECUTA la conducta con los módulos
reales (`pruebas/verificar-4-10-1-mundo.mjs`, enganchada al gate: 281 → 282 pasos) y, donde hace falta, la partida real.

## Estado de cada hallazgo

### Zona A
| # | Hallazgo | Estado |
|---|---|---|
| A1 | El depósito de un puesto de ruta no se vaciaba con material encima | **Arreglado.** Supr junto al alero saca todo (`puestosJuego.sacarTodoCerca`, como los depósitos comunes); el aviso y la nota de «lleno» lo dicen. Sale sólo lo que entra en la mochila. |
| A2 | Nicanor y Fermín rechazaban «No te entra» con mosca, botas y tijera | **Arreglado.** El chequeo sale de `tratoDeEfectos` (lo que no es contable no ocupa casilla). Lo que sí ocupa (lana, truchas…) sigue rechazándose sin cobrar. |
| A3 | La feria no miraba lo que da como «cuenta» (semillas, harina) | **Arreglado.** `cambiarFeria` pregunta por `materiales` + `cuenta` ANTES de cambiar, descontando lo que dás. |
| A4 | Los rincones (huerta de todos, de los chicos, taller) entregaban sin mirar la mochila | **Arreglado.** La cosecha se mira ANTES de vaciar el cantero (`cosechaDe`, `ingredienteDe` nuevos en `rincones.js`) y la manualidad ANTES de gastar; el módulo recibe `CARGA_CTX`. Probado con los tres. |
| A5 | «Sacar 1 lote» de la consigna chequeaba 1 unidad y entregaba el lote | **Arreglado.** Pregunta por el lote entero (`BIENES[b].lote`); si no entra, sigue en consigna. Probado con el DOM de mentira del banco. |
| A6 | El cuchillo de cuero no hacía nada | **Arreglado con un uso chico** (ver «Decisiones»): con él en la mochila, el cuero que le comprás a Fermín rinde uno más. |
| A7 | El silo no guardaba las frutillas del cantero | **Arreglado.** Guardaba `frutilla-huerta` (sólo la clave de la anotación del cuaderno); ahora `frutilla`. Un silo guardado con la clave vieja no pierde nada (se migra al sanear). Pila de frutillas: 50, no 30. |
| A8 | Al cambiar la estación se rebarajaban los tres papeles del tablón | **Arreglado a medias a propósito.** El azar se reparte entre todos los posibles y la estación sólo saltea los de otra época al elegir: al cruzar la estación cambia, a lo sumo, 1 papel de 3 (antes 108 de 120 días cambiaban los tres; ahora 29 de 120 cambian uno). Siempre 3 papeles. |
| A9 | El tablón abierto no contaba en `panelDelHudAbierto` | **Arreglado** (`|| !!tablonJuego?.abierto()`). Es el mismo hallazgo que E10. |
| A10 | «Te faltan N lugares» cuenta el exceso previo con sobrecarga | **Descartado como bug / pregunta.** Con sobrecarga hay que liberar ese exceso para que el trato entre: el número dice cuánto hay que hacer lugar en total. Cambiarlo es una decisión de texto, no un error. Queda como pregunta. |
| A11 | El cristal del Relax no tenía ranura (nombre crudo) | **Arreglado.** Ranura «Cristales» (en `ranurasZona`, `recursos-zona.js`: `mochila.js` no puede nombrar «cristal» por la prueba de vocabulario del Desafío). |
| A12 | El diario decía «te quedaste la trucha» con la mochila llena | **Arreglado** (la entrada del diario mira `lugarEn('trucha-fresca', 1)`). Probado por texto (la pesca real no se corre en Node). |
| A13 | Texto religioso en la historia de Tobías | **Arreglado.** «la Biblia de la familia» → «el libro de cuentas de la familia»; «capillas» → «galpones». |
| A14 | Ganchos y textos sueltos | **Parcial.** Hecho: los nombres del tablón (`atado de hierbas`, `juncos`) coinciden con el resto. **No hecho (pregunta):** `anotarDiario('campo-conocido')` sin enganche (agregaría una anotación nueva al diario = contenido), el dato de Josefina sobre el Puesto Alto sin encargos del Puesto Alto, y el botón para soltar un papel del tablón (función nueva). |
| A15 | El README nombra los postes de largada | **Arreglado** (una frase). |

### Zona E
| # | Hallazgo | Estado |
|---|---|---|
| E1 | `materiales N` y sus hermanos dejaban la mochila en 52 casillas de 24 | **Arreglado.** Lo que sube se llena hasta donde entra (`lugarPara`) y el mensaje dice cuánto quedó y cuántas casillas son; bajar o dejar igual nunca se limita; el Desafío sigue sin límite; a caballo con alforjas llena las 36. `depositos` llena los depósitos/silos (no toca lo que llevás) y `herramientas` no ocupa casillas: no tenían el problema (probado). |
| E2 | «Otra vuelta» tira a la basura lo de la 4.10 | **No tocado:** es del Desafío (otro agente). |
| E3 | La partida no lleva la versión del juego | **Pregunta** (ver abajo): es una decisión de formato de guardado. |
| E4 | `humo-trucos`: `H.reanudar()` no existe y «Escape devuelve a la pausa» | **Arreglado en la prueba** (3 de 3 corridas seguidas «TODO BIEN»). `H.reanudar()` → `H.volverAlJuego(true)`. «Escape devuelve a la pausa» **no es del juego**: pasa en la ventana oculta. Las fallas intermitentes que quedaban («se vuelve al juego», «`salir` vuelve al juego») eran el modo `valle`: la prueba deja la historia activa (`historia capitulo 5`) y el juego muestra la tarjeta del capítulo cuando le toca (correcto); ahora la prueba apaga la historia. Además aísla el `blur` y el bloqueo del puntero (el juego pausa si la ventana pierde el foco, a propósito, 3.5.4). Y `materiales 100` se ajustó a las casillas (E1). |
| E5 | `humo-4-2-pico` vieja desde la 4.4.2 | **Arreglada la prueba**: ahora prueba la conducta actual (el herrero primero afila y avisa del pico; la charla siguiente lo ofrece). |
| E6 | Pruebas frágiles `humo-3-5-1-desafio`, `humo-4-9-defensas`, `humo-4-6-recursos` | `humo-4-6-recursos`: **3 de 3 verdes**. `humo-4-9-defensas`: **3 de 3 «sin problemas»**, mismo resultado en cada corrida. `humo-3-5-1-desafio`: **mejorada pero todavía intermitente** (2 de 4 corridas verdes; falla siempre en la misma comprobación, «entre tandas no queda nadie colgado en la cola»): la causa que queda no la aislé. Ver abajo. |
| E7 | Semillas del Coihue repetibles exportando/importando | **No tocado:** es del Desafío. |
| E8 | `hora` / `dia` con un turno de empleo cuentan como irse antes | **Arreglado.** El informe lo reprodujo con el jugador lejos del banco (ahí cierra por «te fuiste»); se volvió a reproducir con el jugador en el banco (multa de $150 + falta + abandono) y con el arreglo el turno se cierra «por tiempo», sin multa ni falta (`empleoJuego.alSaltarElTiempo`, enganchado por `m.alSaltarElTiempo`). Un salto que no saca del horario no cierra nada. |
| E9 | `historia …` se deshace al volver a la portada y apretar «Seguir» | **Arreglado.** El código deja también `relaxTipo = 'historia'`. Probado del lado de la consola; el `alEntrar` se confirmó leyendo (no se corrió la portada). |
| E10 | = A9 | **Arreglado.** |
| E11 | Sincronía con relojes desfasados | **No confirmado, no tocado** (el informe mismo lo da como condicional y sin reproducir). |

## Pruebas
- `pruebas/verificar-4-10-1-mundo.mjs` (nueva, en el gate): 206 comprobaciones que ejecutan cada arreglo (puestos, gente del campo, feria, rincones, consigna, cuchillo, silo, tablón, mochila, consola, turno de empleo, historia).
- Ajustes mínimos a pruebas que describían lo cambiado a propósito: `verificar-trucos.mjs` y `verificar-4-6-recursos.mjs` (la consola ya no pasa de 24 casillas con `materiales 100`), `verificar-4-7-carga.mjs` (los dos fragmentos de texto de la feria y la tienda del campo) y `verificar-4-3-negocio.mjs` (la línea de `panelDelHudAbierto`).
- Partidas reales (no están en el gate): ver «Pruebas frágiles» abajo.

## Pruebas frágiles (Electron)
Nueva ayuda `pruebas/ayuda-determinista.cjs` (sin tocar el código del juego; todo desde la página de la prueba): `Math.random` sembrado (`HUMO_SEMILLA`) y vuelto a sembrar al empezar cada orden importante (`__resembrar`, porque los temporizadores del propio juego siguen consumiendo azar entre una orden y otra), `performance.now` falso que sólo avanza con los cuadros de la prueba (`__cuadros(n, ms)`, `__avanzarReloj`; `__bucle()` simulaba `min(0,05, tiempo real)`: con la PC cargada cada cuadro simulaba menos) y `requestAnimationFrame` congelado. Las dos del Desafío además fijan el código de partida (`HUMO_CODIGO`, COIHUE-1234; sin código las noches salen de `Math.random`).
- `humo-4-6-recursos`: determinista + los avisos se esperan por estado (`avisoHasta`: si lo tapa un vecino o el perro, se dan cuadros y se vuelve a mirar). 3/3.
- `humo-4-9-defensas`: determinista; las esperas (`pasar`) adelantan también el reloj falso; las caminatas con la W dan cuadros de 30 ms (antes el juego corría solo mientras se esperaba y se sacaban fotos). Ajustes de tiempo de juego (la recarga de la pala corre con los cuadros): 3/3 sin problemas.
- `humo-3-5-1-desafio`: determinista + esperas por estado (el despertar y la pantalla de victoria). Sigue fallando en ~la mitad de las corridas en «entre tandas no queda nadie colgado en la cola» (`vivos: 1`): con el código, la semilla y el reloj fijos debería dar siempre lo mismo, así que queda algún temporizador real del juego que corre entre una orden y otra. **No está resuelto**; sigue fuera del gate, como antes.
- `humo-trucos` y `humo-4-2-pico`: arregladas (ver E4 y E5). `humo-4-2-pico`: 1/1 verde. Se actualizó la skill `hojarasca-partidas` (ya no figuran como fallas conocidas).

## Cierre
`npm run verify` de corrido: **282 pasos OK** (281 + `verificar-4-10-1-mundo`). `node pruebas/humo-caos.cjs` (con `herramientaslanzar-electron.ps1`): sin errores en 934 pasos.

## Decisiones tomadas sin consultar
1. **Cuchillo de cuero (A6):** hay dos formas de darle uso. Elegí la más conservadora, que NO quita nada: el cuero de Fermín sigue comprándose igual sin el cuchillo (nadie pierde acceso) y con el cuchillo en la mochila cada compra de cuero rinde un cuero más («del recorte te sale otro»), al mismo precio. La otra forma (exigir el cuchillo para comprar cuero, como pide el pico de cantero) le quitaría a las partidas que ya compran cuero una cosa que hoy tienen. Si preferís otra, es cambiar `tiendaDe` en `gente-campo.js`.
2. **Tablón y estación (A8):** en vez de filtrar la estación «después de elegir los tres» (que dejaría menos de tres papeles en verano) se saltean los de otra época al elegir. Cambia a lo sumo 1 de 3 papeles al cruzar la estación (lo de temporada que aparece o se va), nunca los tres.
3. **Consola (E1):** con `materiales N` los materiales se llenan en orden (tronco, tabla, piedra, lana, junco, hierbas, arcilla, cuero, piedra de cantera): los primeros se llevan las casillas y los últimos pueden quedar cortos. El mensaje lo dice.
4. **Consigna (A5):** si el lote entero no entra, no sale nada (no hay entrega parcial): es lo más simple y lo que dice el aviso «no te entra».
5. **Cristal (A11):** nombre «Cristales» y texto propios del Relax; el cristal del Desafío sigue siendo la semilla dorada.
6. **Biblia/capillas (A13):** reemplazos neutros («libro de cuentas», «galpones»); si querés otro matiz, son dos palabras en `gente-campo.js`.

## Preguntas para el usuario
- **A10:** con sobrecarga, ¿el cartel debe decir cuánto hay que liberar en total (hoy) o sólo lo que suma el trato?
- **E3:** ¿guardar la versión del juego dentro de la partida/paquete para avisar «esta partida es de una versión más nueva» y no pisarla? (cambia el formato de guardado y la sincronía.)
- **A14:** ¿agregamos la anotación de diario «conociste a Fermín/Belisario/Tobías», un encargo del Puesto Alto en el tablón (el dato de Josefina lo promete) y un botón para soltar un papel del tablón?
- **E11:** relojes desfasados en la sincronía: sin reproducir; ¿lo dejamos así?
