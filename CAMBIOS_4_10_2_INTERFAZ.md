# 4.10.2 · interfaz y experiencia (zona U)

Rama `bugs-4-10-2-interfaz`, desde `origin/main` (4.10.1). Sin subir la versión, sin push. Parte del informe `trabajo\bugs4\zona-U.md` (15 hallazgos de lectura): cada uno se confirmó leyendo el camino completo antes de tocarlo. Esta ronda se hizo **sin abrir Electron y sin el gate completo** (la PC estaba ocupada): sólo pruebas sueltas de Node. Lo visual está en «Para mirar en Electron».

## Estado de cada hallazgo

| # | Estado | Qué se hizo |
|---|---|---|
| U1 | **Arreglado** (lo visual, a mirar en Electron) | `.velo` (pausa, cuaderno, mapa, guía, ajustes, logros, victoria…) pasa a `z-index: 31`; `.banco-velo` (banco, cantina/casa de té, local propio) baja de 30 a 20. La pausa y las pantallas se abren **por encima** de esos paneles (también la pausa automática del Alt+Tab). `.build-info` sube a 32 para seguir arriba de los velos como antes. F2 (modo foto) no se prende con uno de esos paneles abiertos. Al cerrar el cuaderno, el mapa o la pausa con un panel abierto debajo, el mouse **no** se atrapa (`volverAlJuego(!!panelDelHudAbierto())`). |
| U2 | **Arreglado y probado en Node** | Regla única en `src/atajos-paneles.js` (`atajoBloqueadoPorPanel`): con un panel abierto, la I y la O no abren otro encima (la I cierra la mochila si es lo único abierto; la O que cierra los planos pasa). La mochila entra a la tabla de interacciones como un panel más (`mochila-abierta`): la E la cierra, ya no sigue hablando ni abriendo el almacén con la mochila encima. Los números 1 a 4 del tablón: el tablón atiende sus teclas antes y ya no se puede abrir la mochila ni los planos encima, así que no hay combinación posible. |
| U3 | **Arreglado** (a mirar en Electron) | Las notas y el cartel «Mochila llena» salen del `#hud` (que es un contexto de apilado) a `#avisos-altos`, `z-index: 25`: encima de los paneles de negocio (20), debajo de la pausa y de los velos (31). Se esconden con el HUD (`#hud.oculto ~ #avisos-altos`), tienen el mismo zoom de la letra que el HUD. |
| U4 | **Arreglado y probado en Node** | `seguirElegida` (pura): la mano sigue a lo elegido sólo si cae en una de las 8 casillas que dibuja la barra; si pasó más allá, queda el hueco en su casilla (como cuando se termina). Nunca queda `elegida >= 8`. |
| U5 | **Arreglado y probado en Node** | Las 13 recetas anotadas siguen listadas en la mochila (se ve lo que cocinaste) pero marcadas `anotada`: sin clic, sin Enter, sin foco, sin marca «en la barra»; el título dice «Está anotada en el cuaderno: no se lleva en la barra». `asignarRanura` además rechaza cualquier id que no sea una casilla de la barra («Eso no se lleva en la barra»). |
| U6 | **Arreglado** | Espacio/Enter sobre una casilla de la mochila o de la lista hace `stopPropagation`: ya no salta el personaje. |
| U7 | **Parcial** | El panel del local (el de ~60 botones) devuelve el foco al mismo botón después de redibujarse. **Pospuesto** lo mismo en la lista de la mochila (`asignar` → `abrirMochila(true)`) y en las pestañas del cuaderno: cada uno tiene su propio redibujo y no es trivial/seguro sin verlo. |
| U8 | **Arreglado** | «Nueva partida» da la vuelta con Tab y Mayús+Tab adentro (como el creador y el prólogo desde la 4.0.2). |
| U9 | **Pospuesto (pregunta)** | El motivo de lo bloqueado sólo está en el `title`. Mostrarlo en pantalla cambia la pantalla «Nueva partida» (es de diseño). Ver preguntas. |
| U10 | **Parcial** | `conTeclasPropias` (pura): «mantené E» (almacén), «(F para hacer fuego)» (recursos) y el pie del tablón siguen la tecla propia. Con las teclas de fábrica el texto queda **idéntico** (así no se pierde nada de la traducción existente). **Pospuesto** los tres pies fijos de `plantilla.html` (banco, carta, local): partirlos en `<kbd>` rompe la clave del traductor; ver preguntas. |
| U11 | **Arreglado** | La victoria y la pantalla de la corrida esperan (reintentan) si la consola de códigos está abierta; la corrida además espera con el cuaderno o el mapa abiertos (la victoria ya lo hacía desde la 4.0.1). |
| U12 | **No tocado** | Es del tablero de trofeos del Desafío (fuera de mi zona por el encargo). |
| U13 | **Arreglado** | El tablón sin papeles ya no dice «1 a 1 o un clic…»; sólo «E o Escape para salir». |
| U14 | **Arreglado** | «cobrás $X (ya descontados $Y por irte antes)», en el cuadro de irse y en el aviso de cierre (el monto ya es el neto). |
| U15 | **Arreglado en dos de tres** | En el Desafío la ficha de Bruno y el panel de Bruno ya no mandan al «espejo del refugio» / a los planos de espejo. **Pospuesto** el tercer texto igual de `personal-personaje.js:170` («se rehacen en el espejo del refugio»): una prueba vieja fija ese texto exacto y es de «Tu personaje». |

Ningún hallazgo se descartó por no confirmarse: los 14 que tocan mi zona se leyeron completos y eran ciertos tal como los describe el informe.

## Decisiones tomadas sin consultar

1. **U1: elevar los velos en vez de cerrar los paneles.** Entre «los paneles ceden» (cerrar el panel al abrir la pausa/J/M/F1) y «las pantallas van por encima», se eligió la segunda: no cierra nada del jugador, la pausa del Alt+Tab queda visible y Esc/J/M devuelven al panel que estaba. Para eso `.banco-velo` bajó de 30 a 20 y `.velo` subió a 31; la prueba de la plantilla fija el orden (banco < avisos < velo < versión).
2. **U2: J, M y F1 siguen valiendo con un panel abierto** (ahora se ven, porque van por encima). La regla bloquea sólo lo que antes quedaba invisible o apilado mal: **I y O**. Es lo más conservador (no le saca a nadie el cuaderno o el mapa desde un panel).
3. **U2: la E cierra la mochila** (como cierra cualquier otro panel y como hace Esc). Antes seguía hablando/abriendo cosas con la mochila encima.
4. **U3: mover `#notas` y `#aviso-llena` fuera del `#hud`** (sólo se podía así: un hijo no sale del apilado de su padre). Costo: las notas quedan sobre el resto del HUD (antes estaban debajo de lo que iba después en el DOM) y sobre los paneles del HUD (almacén, etc.).
5. **U4: el hueco, no «agarrar lo que quedó en la casilla».** Si lo elegido se fue de la barra, la casilla queda vacía hasta que el jugador elija otra cosa (mismo criterio que cuando se termina lo elegido, 3.8.6).
6. **U5: listar pero no ofrecer.** No se las sacó de la mochila (se perdería información); quedan como anotaciones sin acción.
7. **U10: sin cambiar un solo texto de fábrica.** Sólo se reemplaza cuando el jugador cambió la tecla.
8. **U14: «ya descontados»** en vez de cambiar el monto: el monto neto era correcto; lo que engañaba era el «menos».
9. **U7:** el foco vuelve al botón del mismo lugar en la lista (por posición); si el redibujo cambia la cantidad de botones puede caer en el vecino, que es mejor que el principio.

## Preguntas para el usuario

- **U9**: ¿querés que en «Nueva partida» el motivo de lo bloqueado («Sin aliados no hay perro», etc.) se vea escrito debajo del chip (o en el resumen), no sólo al pasar el mouse? Cambia cómo se ve la pantalla.
- **U10 (pies fijos)**: ¿aceptás que los pies «E o Escape para cerrar…» de la carta, el banco y el local pasen a armarse desde el código (con la tecla propia) aunque haya que rehacer su traducción cuando llegue el inglés?
- **U12**: queda el tablero de trofeos que muestra siete trofeos en un aviso de 5,6 s; es del Desafío.
- **U7 (restos)**: foco al redibujar la lista de la mochila y las pestañas del cuaderno.

## Pruebas

- **Nueva**, enganchada al gate con `sumar-prueba.cjs`: `pruebas/verificar-4-10-2-interfaz.mjs` (84 comprobaciones). Ejecuta con un mundo de mentira: la regla de los atajos (tabla de teclas × paneles y un recorrido), la E con la mochila abierta usando la tabla real (`ayuda-interacciones.mjs`, `que`), `fotoPosible`, `seguirElegida` (incluye una secuencia de inserciones), `armarGuardado`/`armarMochila` reales, las casillas reales de `carga-pantalla.js` con un DOM de mentira (Espacio no sube al juego), `conTeclasPropias`, `pagoDelTurno` real. El resto (z-index, estructura de la plantilla, enganches) se comprueba leyendo el texto.
- **Pruebas existentes ajustadas lo mínimo** (cada una fijaba el texto o la forma exacta de algo que se cambió a propósito):
  - `verificar-3-8-3-base.mjs`: la línea de `fotoPosible` pasó a la función pura; ahora prueba su tabla de verdad y que `main.js` la use (con la condición nueva del banco/local/cantina).
  - `verificar-3-8-3-combate.mjs`, `verificar-4-0-1-nucleo.mjs`: la lista de modos de la victoria suma `'trucos'`.
  - `verificar-3-8-7-duendes.mjs`: la corrida suma cuaderno/mapa/trucos; `refrescarBarra` guarda la casilla por `seguirElegida`.
  - `verificar-3-8-6-relax.mjs`: el hueco es `else if (sg.hueco) ranuras.splice(...)`.
  - `verificar-3-8-3-relax.mjs`: el contexto de `asignarRanura` trae `ranuras` (la guarda lo necesita).
  - `verificar-4-3-empleo.mjs`, `verificar-4-4-2-empleo.mjs`: «ya descontados» en lugar de «menos».
- Pruebas sueltas corridas, de a un proceso de Node por vez, sin Electron, **todas en verde (134 + la nueva = 135 archivos, 0 fallas)** después de los ajustes de arriba (la primera pasada tuvo 5 fallas, todas de pruebas que fijaban lo cambiado, ya ajustadas): la nueva `verificar-4-10-2-interfaz` y las 134 que tocan la plantilla, la barra, la mochila, los paneles, el aviso, el tablón, el empleo, la victoria o la tabla de interacciones:

  verificar-2-1, verificar-2-2, verificar-2-4-1, verificar-2-4, verificar-2-5, verificar-2-7-4-carga, verificar-2-8-compas, verificar-2-8-personal, verificar-2-9-maquinas, verificar-2-9-tren, verificar-2-9-vela, verificar-3-0-supervivencia, verificar-3-1-historia, verificar-3-2-fluidez, verificar-3-3-fluidez, verificar-3-5-1-caidas, verificar-3-5-1-relax, verificar-3-5-distancia, verificar-3-6-1-mundo, verificar-3-6-1-vecinos, verificar-3-6-2-juego, verificar-3-6-gente, verificar-3-6-mecanicas, verificar-3-6-vida, verificar-3-7-0-aldea, verificar-3-7-1-amor, verificar-3-7-2-cocina, verificar-3-7-2-granja, verificar-3-7-3-taller, verificar-3-7-3-tren, verificar-3-7-4-rueda, verificar-3-7-5-fiestas, verificar-3-7-5-rincones, verificar-3-8-3-aldea, verificar-3-8-3-base, verificar-3-8-3-combate, verificar-3-8-3-mundo, verificar-3-8-3-relax, verificar-3-8-4-desafio, verificar-3-8-4-pantalla, verificar-3-8-4-relax, verificar-3-8-6-base, verificar-3-8-6-relax, verificar-3-8-7-duendes, verificar-3-8-7-mundo, verificar-3-8-7-progreso, verificar-3-8-8-economia, verificar-3-8-8-reloj, verificar-3-8-9-auditoria, verificar-3-8-textos, verificar-3-9-0-cantina, verificar-3-9-1-pena, verificar-3-9-2-cantina, verificar-4-0-1-cantina, verificar-4-0-1-nucleo, verificar-4-0-3-aldea, verificar-4-0-3-mando-menu, verificar-4-1-bruno-seccion, verificar-4-1-espejo, verificar-4-1-ficha, verificar-4-1-prologo, verificar-4-1-textos, verificar-4-10-1-desafio, verificar-4-10-1-mundo, verificar-4-10-1-npc, verificar-4-10-2-interfaz, verificar-4-10-base, verificar-4-10-guardian, verificar-4-10-partidas, verificar-4-2-almacen, verificar-4-2-pesos, verificar-4-2-pico, verificar-4-3-empleo, verificar-4-3-negocio, verificar-4-4-1-gastos, verificar-4-4-2-construccion, verificar-4-4-2-empleo, verificar-4-4-2-negocio, verificar-4-4-3-venta, verificar-4-4-compra, verificar-4-4-empleados, verificar-4-5-1-sin-carreras, verificar-4-6-0-detalles, verificar-4-6-1-interacciones, verificar-4-6-gente, verificar-4-6-puestos, verificar-4-6-recursos, verificar-4-7-carga, verificar-4-7-pantalla, verificar-4-9-aliados, verificar-4-9-defensas, verificar-4-9-dias, verificar-album, verificar-banco, verificar-base, verificar-caballo, verificar-chinches, verificar-coherencia-rc2, verificar-construccion-ingenieria-rc8, verificar-construccion-multinivel-rc9, verificar-construccion-premium-rc6, verificar-construccion-senior-rc7, verificar-construccion-ultra-rc10, verificar-desafio-2, verificar-dom-rc2, verificar-feria, verificar-foto-valle, verificar-gallinero, verificar-guia, verificar-habitat-premium-rc11, verificar-huerta, verificar-huevos, verificar-idioma, verificar-implacable-rc4, verificar-invasores, verificar-majada, verificar-mando, verificar-mega-rc1, verificar-modo-desafio, verificar-musica, verificar-nido, verificar-ordenes, verificar-parte-construir, verificar-partidas, verificar-premium-rc3, verificar-rastreo, verificar-relax-2, verificar-relax, verificar-release, verificar-telar, verificar-terminacion-v7, verificar-trucos, verificar-visual-v6, verificar-vuelta.

  **No corrí** `npm run verify` ni `verify:paralelo` (la PC estaba ocupada): el gate completo queda para la integración. `node armar.mjs` armó bien (430 módulos).

## Para mirar en Electron (no verificado: sin ventana)

1. **U1**: abrir el panel del local (E), la carta de la cantina y el banco; en cada uno apretar J, M, F1, F5 y hacer Alt+Tab: la pantalla debe verse por encima del panel; Esc la cierra y el panel sigue abierto con el mouse libre. Que el velo de la pausa tape bien el panel (blur incluido).
2. **U1**: con uno de esos paneles, F2 no debe prender el modo foto.
3. **U2**: con el panel del local, I y O no hacen nada; con el tablón abierto, O no abre los planos y los números toman encargos; con la mochila abierta, E la cierra (junto a un vecino y junto al almacén).
4. **U3**: mochila 24/24, estante con mercadería, panel del local, «Sacar»: ver el cartel «Mochila llena» y las notas por encima del panel (y con la ventana en 1024 px). Ver también que las notas, el «✓ Guardado» y el cartel se vean igual que antes en el juego normal y con la letra grande; que se escondan en el modo foto y en la portada; que **no** salgan sobre la pausa.
5. **U3**: que `.build-info` (versión, esquina inferior derecha) se vea como antes.
6. **U4**: Relax con la barra de fábrica: elegir con el 8 la última cosa y juntar un piñón/calafate: la barra debe quedar con la casilla vacía marcada, no sin marca.
7. **U5**: mochila con recetas cocinadas: aparecen sin cursor de mano, sin hover y sin foco por Tab; los títulos dicen «Está anotada…».
8. **U6**: Tab hasta una casilla de la mochila, Espacio: elige y no salta.
9. **U7**: en el panel del local, Tab hasta un «+6» o «Barato», Enter: el foco queda en el mismo botón.
10. **U8**: «Nueva partida» del Desafío: Tab no sale a los botones de la portada; Mayús+Tab da la vuelta al otro extremo.
11. **U10**: cambiar la tecla de interactuar y mirar el aviso de «mantené … para ampliar» en un depósito lleno y el pie del tablón.
12. **U11/U14/U15**: la consola abierta justo al caer el Coihue; el cuadro de «irte antes del turno» y el aviso de cierre; la ficha de Bruno en el Desafío.

## Lo que quedó fuera
U9 (pregunta), U12 (Desafío), restos de U7, pies fijos de U10, tercer texto de U15 (ver arriba).
