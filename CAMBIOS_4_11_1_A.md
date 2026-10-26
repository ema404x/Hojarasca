# 4.11.1 (interfaz y ranuras): pies con la tecla propia, panel de trofeos, semilla del cantero, foco y personal a ranura vacía

Rama `v4111-a` (sale de `main` = 4.11.0). Cinco decisiones de `DECISIONES_DISENO_4_10.md` (puntos 20, 21, 22, 24 y 32). No se subió la versión. Los textos nuevos están sólo en castellano (el inglés se rehace al final: los tres pies fijos y el panel de trofeos quedan sin traducir cuando la tecla está cambiada, y con la de fábrica siguen usando la traducción que ya había).

## 1. Pies fijos con la tecla de interactuar (U10)

**Qué pasaba.** Los pies «E o Escape para cerrar la carta», «… salir del mostrador» y «… cerrar el panel · los clientes se atienden con E» estaban escritos en `plantilla.html`: con la tecla cambiada en Controles seguían diciendo E.

**Qué se hizo.**
- `src/plantilla.html`: los tres `<p class="seguir">` quedan vacíos, con id (`pie-banco`, `pie-carta`, `pie-local`).
- `src/atajos-paneles.js`: `PIES_PANELES` (los textos) y `piesDePaneles(visible)`, que reusa `conTeclasPropias` (la misma que ya usan el tablón y el aviso).
- `src/main.js`: `ponerPiesPropios()` los escribe con `T_(...)` al abrir el juego y en `dibujarTeclas()` (que corre al cambiar una tecla y al restablecerlas).
- **Con las teclas de fábrica el texto es idéntico al de antes**: sigue valiendo la traducción hecha (la clave de `T_` es la misma frase).

## 2. Tablero de trofeos como panel (U12)

**Qué pasaba.** La E junto al tablero tiraba un aviso de 5,6 s con los trofeos ganados.

**Qué se hizo.**
- `src/desafio-trofeos.js`: `filasPanelTrofeos(trofeos)` (pura): los siete en el orden del tablero; el ganado dice su bono y de quién viene, el que falta dice «Todavía no · se gana con … (cuándo)».
- `src/desafio-trofeos-mundo.js`: la E (`usarCerca`) abre un panel `.trueque` en el HUD (se arma la primera vez, sin DOM no rompe: las pruebas de Node lo corren). `panelAbierto`, `cerrarPanel`, `vigilarPanel(pos)` (se cierra solo si te alejás más de 4,9 m o si el tablero desaparece) y `limpiar` lo cierra.
- Patrón de los otros paneles: entrada `trofeos-abierto` en la tabla de `interacciones.js` (la E lo cierra), `trofeos` en `panelesInteraccion`/`cerrarPanelInteraccion`, Escape en la cadena de `main.js` (antes de abrir la pausa), y parte de `panelDelHudAbierto` (mouse suelto, no se ataca, la I y la O no abren otro panel encima: la tabla de la 4.10.2). Pie: «E o Escape para cerrar el tablero» con la tecla propia (`ctx.textoPanel` en `desafio.js`/`main.js`).
- El texto del panel: título, «Tenés N de 7. Dan su bono mientras el tablero esté en pie», una fila por trofeo.

## 3. Semilla del cantero (S5)

**Qué pasaba.** `semillaParaSembrar` devolvía siempre la primera del orden fijo (habas, papas, frutillas, calafates): con habas a mano, los calafates casi nunca se sembraban.

**Qué se hizo.**
- `src/huerta.js`: `semillasDisponibles`, `semillaParaSembrar(tengo, preferida)` (la elegida si todavía la tenés; si no, el orden de siempre), `cambiarSemilla(tengo, actual, paso)` (da la vuelta en los dos sentidos) y `sanearSemillaElegida`.
- `src/main.js`: junto a un cantero **vacío** y con **dos o más** semillas, Tab (Mayús+Tab hacia atrás) o la rueda eligen; el cartel dice «Sembrar calafates (Tab o rueda: otra semilla)» y una nota confirma. Con una sola semilla, con el cantero ocupado, lejos, en el tren, a caballo, con un panel o charlando, la rueda sigue siendo de la barra y Tab no hace nada. La E siembra (y gasta) la elegida.
- `progreso.semillaElegida` se guarda (`guardado.js`, con saneo: sólo un cultivo de verdad; una partida vieja no la trae = como hoy).

## 4. Foco del teclado (U7, restos)

- `src/foco.js` (nuevo, sin DOM propio): `guardarFoco(doc, ids)` anota en qué contenedor, qué lugar y qué cosa (`data-foco`, con su número de pila) tenía el foco; `devolverFoco(doc, marca)` lo repone en la misma cosa, y si ya no está, en el mismo lugar (el vecino; el último si la lista se acortó).
- Mochila: `abrirMochila` anota el foco sólo si ya estaba abierta (es un redibujo: al abrirla no se roba el foco) y lo devuelve al final; las cosas de la lista y las casillas elegibles llevan `data-foco`.
- Cuaderno: `dibujarCuaderno` ahora envuelve al de siempre (`dibujarCuadernoSinFoco`) y devuelve el foco aunque el redibujo falle.

## 5. Recetas y ropa a una ranura vacía (P4)

- `src/personal-partida.js`: `dejarPersonalPendiente(almacen, modo, ranura, personal, ajustes)` y `tomarPersonalPendiente(...)` (sessionStorage; se toma una sola vez).
- `irAPartida` (main.js): si la ranura de destino **no tiene partida** (`infoPartida(...).hay === false`), anota lo personal; al arrancar sin partida se toma y se sanea (`progreso.personal`). Con partida **no se toca nada** (ni ajustes ni anotados).
- **Decisión propia:** va por la sesión (no escribiendo una partida vacía en la ranura) para que la ranura siga figurando «Empezar acá» hasta que de verdad se entre, y no cambie `habiaGuardado` (portada, prólogo, creador de personaje).
- **Decisión propia:** viaja como con «Empezar de nuevo» (`empezarConReceta`): sin el Bruno de la partida vieja (cada partida tiene el suyo) y con `actual` (animales, vecinos) y estación/clima/dificultad según la receta «Tu partida». Si la receta no pide nada («Como está»), los ajustes no cambian.

## Pruebas

- Nueva `pruebas/verificar-4-11-1-interfaz.mjs` (130 comprobaciones, en el gate): un DOM mínimo hecho en la prueba, el módulo del tablero con DOM de mentira, las reglas de huerta, el guardado de verdad (localStorage de mentira), `ponerPiesPropios`, `cambiarSemillaCantero`, `dibujarCuaderno` e `irAPartida` evaluadas con `funcion()` y un mundo de mentira.
- `herramientas/mutar-4-11-1-interfaz.cjs`: 50 mutaciones (una por regla), **las 50 se detectan**. Fallan antes del cambio porque las funciones no existían.
- Ajustadas lo mínimo: `pruebas/verificar-4-10-base.mjs` (la E ya no da una nota: abre el panel) y `pruebas/humo-4-10-base.cjs` (mira el panel y que la segunda E lo cierra).
- Partida real: `pruebas/humo-4-11-1-interfaz.cjs` (Electron): pies con la U y al volver a la de fábrica y tras recargar; foco en la mochila (lista y casillas) y en las pestañas del cuaderno; cartel, Tab, rueda, Mayús+Tab, siembra, guardado y recarga del cantero; ranuras (a una con partida no se pisa, a una vacía viajan las recetas); trofeos (abre con E, sigue a los 7 s, bloquea la I, Escape y E cierran, alejarse y caer el tablero lo cierran).

## Verificación

- `npm run verify` de corrido: **299 pasos OK** (298 de antes + `verificar-4-11-1-interfaz.mjs`). Una vez, bajo `verify:paralelo`, `verificar-construccion-premium-rc6.mjs` cortó por tiempo (carga de la máquina); sola y en el gate de corrido pasa.
- Partidas reales (Electron, monitor externo, perfil propio, de a una): `humo-4-11-1-interfaz` OK completa (con capturas miradas a tamaño completo: pies con la U, mochila con el foco en la linterna antes y después, pestaña del cuaderno, cartel del cantero, ranuras, panel de trofeos); `humo-4-10-1-guardado`, `humo-4-10-base` (con el panel de trofeos), `humo-partidas`, `humo-guardado-roto`, `humo-4-7-pantalla` y `humo-1-10` (cantero; oculta cae por `UnknownVizError` al capturar, visible pasa) OK.
- `humo-4-7-carga` falla con `UnknownVizError` (captura de pantalla) justo después de «en sobrecarga no se puede juntar más»; **falla igual en `main` 4.11.0** armada aparte: es del entorno, no de este cambio.
- Mutaciones: `node herramientas/mutar-4-11-1-interfaz.cjs`: 50 de 50 detectadas.

## Lo que no se verificó

- El foco con el teclado **real** (Tab y Enter nativos): la partida usa `focus()` y eventos de teclado sintéticos sobre el elemento enfocado; el redibujo y la devolución del foco son los de verdad.
- La rueda del mouse real: se probó con eventos `wheel` sintéticos; el `deltaY` del mouse físico entra por el mismo listener.
- Los paneles del banco, la carta y el local se miraron mostrando el panel armado en la página (no yendo caminando a abrirlos con la E): el pie es el mismo elemento.
- El panel de trofeos en inglés y los pies con tecla cambiada en inglés: sin traducir a propósito.
- El mando: nada de lo nuevo se usó con mando (Tab y la rueda de la semilla no tienen botón; sigue la barra).
- Ninguna medición de rendimiento (el panel se arma una vez y sólo hay una distancia por cuadro con el panel abierto).
