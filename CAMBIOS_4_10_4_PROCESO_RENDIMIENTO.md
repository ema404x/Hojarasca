# 4.10.4 · proceso principal, empaquetado y rendimiento

Rama `bugs-4-10-4-proceso-rendimiento` (desde `origin/main` = 4.10.3). Informes: `trabajo\bugs6\zona-M.md` (13 hallazgos) y `zona-H2.md` (5). Eran revisiones de lectura: cada hallazgo se confirmó leyendo el código actual antes de tocarlo. La versión **no se subió** (sigue 4.10.3 en `package.json`).

Sin Electron, sin `verify`, sin empaquetado: todo lo probado es Node (ver «Pruebas»). Lo que sólo se ve en Electron está en «Para mirar en Electron».

## Estado de cada hallazgo

### Rendimiento (H2)
| # | Qué | Estado |
|---|---|---|
| H2-1 (alta) | `guardar()` releía cada guardado con `JSON.parse` + «reviver» | **Arreglado y probado.** `parsear` usa el reviver sólo si el texto trae `toString`, `valueOf` o `\u`; `escribirTexto` valida con parse liso (el resultado sólo se usa como sí/no). Medido acá con una partida chica (9 KB): mediana 1,26 ms → 0,72 ms. Las cifras grandes del informe (150 KB: 13,3 → 2,3 ms) no las repetí con un arnés propio; el mecanismo (cero llamadas con reviver en guardar/cargar normal) sí lo ejecuta la prueba nueva. |
| H2-2 | `armarSitio` (lugares tomados) ~20 ms en un cuadro | **Arreglado y probado en Node.** Se arma en 3 cuadros (suelo, bruma+columnas, hongos), una etapa por cuadro entre todos los lugares. No usé `cola-presupuesto.js` (no la usa nadie en el repo; una máquina de 3 etapas dentro del módulo es más chica y no cambia dependencias). Lo que se ve es lo mismo, ~0,05 s más tarde. |
| H2-3 | Ruta del Coihue en un solo cuadro | **Parcial.** Hecho (a) del informe: si el camino se acaba de crear (partidas de antes de la 4.10) ya no se vuelve a calcular la misma ruta. **No hecho** (b) (distancias por celda compartidas entre los tres intentos) ni (c) (A* repartido en cuadros): ver «Preguntas». |
| H2-4 | `recargaTorreta` y `silencioCampana` retienen obras | **Arreglado y probado.** Pasan a `WeakMap` (sólo se usan con `get`/`set`): se sueltan solas al caer la obra, sin recorrer nada. |
| H2-5 | Las huellas del Coihue se congelan con el rastro lleno | **Arreglado y probado** (parte lógica). La condición mira también el último punto. Alcance real casi nulo (hace falta una ruta de más de ~427 m), pero era un bug. |

### Proceso principal y empaquetado (M)
| # | Qué | Estado |
|---|---|---|
| M1 | `backgroundThrottling:false` en producción | **Arreglado; falta mirarlo en Electron.** `main.cjs` deja el valor por defecto y lo apaga sólo con `HOJ_SIN_ESTRANGULAR=1` o `HUMO_OCULTO=1` (el lanzador `lanzar-electron.ps1` ya pone `HUMO_OCULTO`, y `al-monitor.cjs` además apaga el estrangulado de toda ventana que nace; las herramientas `medir-*`, `soak-*`, etc. crean sus propias ventanas con la opción explícita: no se tocaron). Lo que el juego hace al minimizar: `blur` abre la pausa (`main.js` ~11273), el bucle tiene `dt` recortado a 0,2 s y 0,05 s (volver no da un salto), y `visibilitychange` → `hidden` ahora sí corre y hace `flushGuardadoSuave` (antes no corría al minimizar). El `requestAnimationFrame` se detiene solo con la ventana oculta. |
| M2 | `app.relaunch()` sin `execPath` (portable) | **Arreglado y probado con un Electron de mentira.** `relanzar()` (en `recuperacion-main.cjs`) usa `process.env.PORTABLE_EXECUTABLE_FILE` si existe. Lo usan `graficos-fallaron` y la recuperación por caídas de la GPU. |
| M3 (candado) | relaunch sin soltar el candado de instancia única | **Arreglado y probado.** `relanzar()` llama `app.releaseSingleInstanceLock()` antes (si existe). |
| M3 (parcial, el 6 del informe) | sin `uncaughtException`/`unhandledRejection` | **Arreglado y probado.** `cuidarErroresMain`: cada error se anota en `hojarasca-crash.log` (tipos `main-excepcion` y `main-rechazo`, con el stack) y se le pide guardar a la página (`guardar-ya`). Si hay 5 en 10 s (bucle) se anota y se cierra con `app.exit(1)` a los 1,5 s. Un error suelto no cierra el juego (como el comportamiento de Electron, que seguía vivo tras su cuadro). Ya no sale el cuadro nativo con el stack. |
| M4 | Fuses de Electron | **No se hizo (decisión de Steam).** Cómo se haría abajo. |
| M5 | `steamworks.js` no es dependencia | **No se hizo (decisión de Steam).** Cómo se haría abajo. |
| M6 (el 7 del informe) | `graficos-fallaron` pasa por `d3d9` | **Arreglado** (salta los intentos con `use-angle: 'd3d9'`, como ya hacía la ruta por caídas). Probado por texto en `main.cjs`: ese archivo no corre fuera de Electron. |
| M8 | `escribirSync`: el respaldo escribe sobre la copia buena | **No se tocó.** Ver «Preguntas». |
| M9 | `guardadoEn` no finito traba las escrituras | **Arreglado y probado** (`Infinity`, negativo, texto: dan 0; el conflicto real sigue igual). |
| M10 | `__hojarascaErrores` sin tope | **Arreglado y probado** ejecutando el script de la plantilla con 10 000 errores: queda en 100 (los primeros, que son los que explican un arranque fallido; las pruebas `humo-*` siguen pudiendo mirar si está vacío). |
| M11 | `empaquetar.ps1`/`.sh` | **Parcial.** La parte «agregar un `*-main.cjs` sin sumarlo a `build.files`» queda cubierta por la prueba nueva (cada `require('./x.cjs')` de `main.cjs` tiene que estar en `build.files`). No toqué los scripts (matar un `Hojarasca.exe` abierto y la verificación del asar en el `.sh` son de la cadena de empaquetado; ver «Preguntas»). |
| M12 | `verificar-release` valida con `includes` | **Parcial.** La prueba nueva suma que `build.files` sea una lista cerrada sin comodines, pruebas ni informes y que lleve preload, index e ícono. No reescribí `verificar-release.mjs`. |
| M13 | Cosméticos (LEEME 4.10.3, huella del `index.html`) | **No se hizo.** El LEEME de la 4.10.3 ya salió; corregir su línea 251 («ícono de Electron») conviene hacerlo en el LEEME de la próxima versión. La huella sólo del `index.html` es una decisión de cierre. |

## Decisiones tomadas sin consultar
- **H2-1:** se conserva el reviver tal cual para los textos que pueden traer las claves peligrosas (en vez de un recorrido propio): lo más conservador, el comportamiento de sanear no cambia. El chequeo por `includes('\\u')` manda a la vía lenta a cualquier guardado con escapes (los de verdad no los llevan, `JSON.stringify` no escapa letras comunes).
- **M1:** valor por defecto de Electron (estrangulado prendido) en lugar de «dejarlo apagado y pausar a mano». Es lo que pide el pedido y lo que menos código agrega. Se acepta `HUMO_OCULTO=1` además de una variable nueva (`HOJ_SIN_ESTRANGULAR`) para que las pruebas con `main.cjs` entero (`humo-*`), que ya corren con `HUMO_OCULTO`, no cambien.
- **M3:** un error suelto no cierra el juego; sólo un bucle (5 en 10 s). Cerrar con cada error sería más estricto que lo de hoy (Electron seguía vivo tras su cuadro).
- **M6/7:** se saltea `d3d9` en `graficos-fallaron`, sin sacarlo de `INTENTOS_GRAFICOS` (la prueba de la 2.7.3 sigue viendo «4 formas»).
- **H2-2:** una etapa de armado por cuadro **en total** (no por lugar): con dos lugares a la vez son 6 cuadros, nunca más de ~8 ms en un cuadro.
- **H2-4:** `WeakMap` en lugar de limpiar los mapas en `refrescarDefensas`: no cambia ningún recorrido ni suma trabajo.
- **H2-5:** se compara el último punto del rastro (dos números) en lugar de contar caminadas.
- **Pruebas ajustadas:** `verificar-2-7-3.mjs` (la línea de `main.cjs` ahora es `relanzar(app); app.exit(0);`) y `verificar-4-10-3-visual.mjs` V9 (`limpiar()` ahora saltea el material que falta en un lugar a medio armar; sigue exigiendo que se liberen geometría y material de los tres).

## Preguntas para vos
1. **H2-3 (b) y (c).** Con (a) alcanza para las partidas viejas; el tirón de cada noche (1 a 7 ms con la base despejada, 30 a 60 ms con la base cercada) sigue. Repartir el A* en cuadros obliga a que `c.ruta`/`c.d` cambien unos cuadros después de empezar la noche (hoy pasa en el mismo cuadro). ¿Lo hago así (sin cambiar el resultado, pero con la ruta nueva aplicada 2 a 5 cuadros más tarde) o preferís calcular los tres criterios de `libreCoihue` con un solo recorrido por celda (resultado idéntico, ahorra ~40 % sólo en el caso malo)? No lo hice porque toca el momento en que arranca la noche del asedio y no hay forma de medirlo sin Electron.
2. **M8 (`escribirSync` sin rename).** Dos formas: no escribir directo si el `rename` falla (devolver `false`, queda la copia anterior) o reintentar el `rename` una vez. Cambia qué pasa si el sincronizador tiene el archivo tomado (hoy intenta escribir directo y casi siempre falla igual). Elegí la que prefieras; ninguna es obvia.
3. **M11 (scripts de empaquetado).** ¿Querés que `empaquetar.ps1` pregunte antes de matar un `Hojarasca.exe` abierto y que el `.sh` verifique el `index.html` del asar como el `.ps1`? Es la cadena del cierre, no la toqué.

## Cómo se haría lo que no se hizo (para el cierre de Steam)
**Fuses de Electron (M4).** electron-builder 26 los aplica solo si el `build` del `package.json` lleva:
```json
"electronFuses": {
  "runAsNode": false,
  "enableNodeOptionsEnvironmentVariable": false,
  "enableNodeCliInspectArguments": false,
  "onlyLoadAppFromAsar": true,
  "enableEmbeddedAsarIntegrityValidation": true,
  "grantFileProtocolExtraPrivileges": false
}
```
Cuidados: `main.cjs` usa `ELECTRON_RUN_AS_NODE` en `reconstruirBundleSiHaceFalta` (`spawnSync(process.execPath, [armar.mjs])`), pero sólo cuando existe `src/` (desarrollo: se corre con `electron .` y el fuse de `runAsNode` sólo afecta al exe empaquetado, no a `node_modules/electron`); en el asar no hay `src/`, así que no se ejecuta. `enableEmbeddedAsarIntegrityValidation` exige que el asar no se toque después de firmar/empaquetar (y, en Windows, electron-builder lo calcula en el empaquetado: hay que usar la versión de `@electron/asar` y `afterPack` de la 26 sin pasos intermedios que reescriban el exe). Cuidaría la prueba: una nueva en `verificar-release` que lea `build.electronFuses` y, con el exe armado, `npx @electron/fuses read --app dist/win-unpacked/Hojarasca.exe` y compare. Después de empaquetar hay que correr el exe y comprobar que arranca, que carga la partida, y que `ELECTRON_RUN_AS_NODE=1 Hojarasca.exe -e 1` ya no actúa como Node.

**`steamworks.js` (M5).** Hoy `package.json` no tiene `dependencies`: el asar sólo lleva los `.cjs`, `index.html`, `package.json` y el ícono, y `require('steamworks.js')` falla (los logros quedan sólo dentro del juego). Para el depot de Steam: `npm install steamworks.js` (queda en `dependencies`, no en `devDependencies`, para que electron-builder lo incluya), agregar `"node_modules/steamworks.js/**"` (y su carpeta nativa, `dist/**/*.node`) a `build.files` y `"asarUnpack": ["node_modules/steamworks.js/**/*.node"]` (los `.node` no se cargan desde dentro del asar); `steam_appid.txt` al lado de `Hojarasca.exe` en el depot (lo busca `conectarSteam`); y el cliente de Steam abierto. Cuidaría la prueba: `verificar-release` con una variante «Steam» (activada por una variable de entorno de `empaquetar.ps1`) que exija `steamworks.js` en `dependencies`, el `.node` en `app.asar.unpacked` y el `steam_appid.txt` en `win-unpacked`. Los 34 logros y su nombre de API están en `STEAM_LOGROS.md`.

## Pruebas
Nueva: `pruebas/verificar-4-10-4-proceso-rendimiento.mjs` (enganchada al gate con `sumar-prueba.cjs`). Ejecuta: el guardado con partidas con `toString`, `valueOf` y la clave escapada (espía de `JSON.parse` para ver cuándo entra el reviver); `relanzar()` y la recuperación de la GPU con un Electron de mentira (candado antes, `execPath` portable, orden); `cuidarErroresMain` (anotar, pedir guardar, no cerrar con uno, cerrar con bucle, registro roto); `guardadoEnDe`/`puedePisar`; el script de la plantilla con 10 000 errores; los lugares tomados con el módulo real y el three local (etapas, orden de dibujo, fundido, `limpiar()` a medio armar); `WeakMap`; el rastro lleno; `build.files`. Verificado que falla si se vuelve a la versión anterior de `guardado.js`.

Lo que sólo se mira por texto (porque no corre fuera de Electron): los enganches de `main.cjs` (M1, M2, M3, M7) y `nocheCamino`/la condición de las huellas (`desafio-asedio-mundo.js` necesita el juego entero).

**Pruebas sueltas que corrí (una por vez, solo Node, todas en verde):** `verificar-4-10-4-proceso-rendimiento` (73 comprobaciones), `verificar-2-7-3`, `verificar-4-10-3-visual` (las dos ajustadas, ver decisiones; la segunda falló antes del ajuste), `armar.mjs`, y la tanda de las 165 pruebas `pruebas/verificar-*.mjs` que nombran `main.cjs`, `recuperacion-main`, `sincronia-main`, `desafio-tomadas`, `desafio-asedio-mundo`, `desafio-defensas`, `plantilla.html`, `src/guardado` o `desafio.js` (entre ellas 3-5-1-caidas, 3-5-4-ventana, 4-0-2-bajos, release, sincronia, guardado-rc2, 4-10-coihue, 4-10-base, 4-10-3-ajustes, 3-8-6-base, 3-8-4-relax, 3-8-6-relax): 165 de 165 con código de salida 0. No corrí `npm run verify`, ni `.cjs` de Electron, ni medición.

## Para mirar en Electron (cuando la PC esté libre)
1. **M1:** abrir el juego, ir a Pausa y minimizar: GPU/CPU de `Hojarasca.exe` en el Administrador de tareas tienen que bajar a casi cero (antes seguía dibujando). Alt+Tab a otro juego: el juego se pausa por `blur`. Al volver, que reanude sin salto de tiempo ni de sonido. Con `?debug=1`, `document.visibilityState` pasa a `hidden` al minimizar y el guardado corre (se ve `hojarasca-v1` actualizado en el almacenamiento).
2. **M1 en medición:** `herramientas\lanzar-electron.ps1` (con `HUMO_OCULTO=1`) y los `medir-*` / `soak-*` siguen dibujando con la ventana oculta; si algún `humo-*` se queda sin cuadros, agregar `HOJ_SIN_ESTRANGULAR=1` en su lanzador.
3. **M2/M3:** en el portable (`Hojarasca-4.10.4-Portable-x64.exe`), forzar `graficos-fallaron` (por ejemplo, lanzarlo con `--use-angle=none`) o matar dos veces el proceso GPU en 5 min: el juego tiene que volver solo (no «Hojarasca ya está abierto»).
4. **M3 (errores):** en una consola de `npm start`, `process.emit('uncaughtException', new Error('x'))` (o un error de verdad en un listener) tiene que dejar una línea `main-excepcion` en `%APPDATA%\hojarasca\logs\hojarasca-crash.log` y no mostrar el cuadro de Electron.
5. **H2-1:** con `?debug=1`, `performance.now()` alrededor de `__hojarasca.guardar()` con una partida de ~50 obras y otra de 500+: tiene que dar ~1 ms (antes 4 a 13 ms).
6. **H2-2:** noche 3 o más del Desafío, el amanecer en que los duendes toman un lugar: F3 → el pico del cuadro tiene que bajar, y la mancha oscura, la bruma y los hongos tienen que aparecer igual que antes (con ~0,05 s de demora). Probar también abrir una partida guardada con dos lugares tomados.
7. **H2-5:** sólo si hay una ruta del Coihue de más de ~430 m: las huellas siguen apareciendo.
8. Por las dudas, `npm run verify` completo (yo no lo corrí).
