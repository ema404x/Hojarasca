# Hojarasca — cómo seguir en la otra PC (traspaso del 07-10-2026, 3.7.5 cerrada)

> **ATENCIÓN (07-10, notebook):** la 3.7.5 Tradiciones quedó cerrada en la notebook (etiqueta v3.7.5). **Lo primero:** repetir solas las 6 partidas reales que fallaron en la tanda de a 4 y no se repitieron (humo-2-8-compas, humo-3-0-asedio, humo-3-5-4-caos, humo-3-7-2-granja, humo-3-7-4-rueda, humo-relax-2) con `node herramientas/suite-paralela.cjs <salida> 1 <lista,separada,por,comas>` (con el monitor externo apagado, poner antes la variable HOJ_PANTALLA=no). granja y caos pueden ser fallas reales de la integración. Después: 3.8.0 (PLAN_3_8.md).


Sirve para vos y para Claude. En la otra PC, abrí Claude Code en la carpeta del proyecto y
decile: **"leé SEGUIR-EN-OTRA-PC.md y seguimos"**.

---

## 1. Para vos (pasos en la otra PC)

**Desde el 01-10-2026 el código vive en GitHub: `https://github.com/ema404x/Hojarasca`
(privado).** Ya no hacen falta zips para el código.

1. Instalá Git si no está: `winget install --id Git.Git -e --source winget`.
2. Clonalo en `Documents\Hojarasca`:
   `git clone https://github.com/ema404x/Hojarasca.git hojarasca`
   (la primera vez se abre el navegador para iniciar sesión en GitHub).
3. En `Documents\Hojarasca\hojarasca` corré una vez `npm install`.
4. Abrí Claude Code en esa carpeta y pedile que siga.
5. Para pasar el trabajo entre PCs: al terminar en una, **subir** (`git push`); al empezar en
   la otra, **bajar** (`git pull`). No trabajar en las dos a la vez sin subir/bajar antes.
6. Las capturas de evidencia y los scripts de `herramientas-34` (punto 4.3) no están en el
   repositorio (pesan cientos de MB): vienen en `Hojarasca-traspaso-3.5.zip` (Descargas de la
   PC de origen). El instalador de la 3.4.0 está en `Hojarasca-3.4.0-completo.zip`.

---

## 2. Para Claude: el proyecto

**Hojarasca**: juego Electron + three.js (r186 local en `three-r186-inline.js`) en un valle
andino-patagónico procedural. Modos **Relax** (refugio, vecinos, huerta, perro, caballo,
kayak, velero, trochita, comercio, la Aldea de los Duendes, historia guiada) y **Desafío** (invasores de noche,
arsenal, fortín, asedio, jefe en la nave, sin fin). Todo por código: nada descargado (ni
texturas, ni modelos, ni audio).

- El usuario habla **castellano rioplatense**; juego, textos y comentarios en castellano.
- **Repositorio git** (desde el 01-10-2026): `https://github.com/ema404x/Hojarasca`, rama
  `main`, en `Documents\Hojarasca\hojarasca`. Cada versión cerrada lleva una etiqueta
  (`v3.4.0`). Antes de empezar: `git pull`; al cerrar algo: commit + `git push` (y etiqueta
  `v<ver>` al cerrar una versión). `index.html`, `node_modules`, `dist` y las salidas de
  pruebas no van al repositorio (`.gitignore`). `.gitattributes` fuerza LF.
- Las carpetas viejas `Documents\Hojarasca\src\hojarasca-<ver>` quedan como archivo; se
  trabaja en el repositorio. Confirmar la versión en `RELEASE_STATUS.md`.
- En la PC de origen git se instaló el 01-10 en `C:\Program Files\Git\cmd\git.exe` (si
  Claude no lo encuentra en el PATH, usar esa ruta). Si `git push` falla con "terminal
  prompts disabled", correrlo con `GCM_INTERACTIVE=always` y `GIT_TERMINAL_PROMPT=1` para
  que se abra la ventana de inicio de sesión (la credencial queda guardada).

### Versiones (lo último arriba)
- **3.7.5 (etiqueta v3.7.5): Tradiciones**, cerrada en la notebook el 07-10 (3 equipos + integración). `CAMBIOS_3_7_5.md`. El usuario aprobó todas las decisiones de detalle como las recomendaron los equipos. Gate 165/165; partidas reales 62/68 (6 sin repetir). Sigue: 3.8.0 (PLAN_3_8.md).
- **3.7.4 (etiqueta v3.7.4): Vida social tipo Sims**, cerrada en la PC de escritorio. `CAMBIOS_3_7_4.md`. Sigue: 3.7.5 Tradiciones; después 3.8.0 (PLAN_3_8.md).
- **3.7.3 (etiqueta v3.7.3): La trochita**, cerrada en la PC de escritorio. `CAMBIOS_3_7_3.md`.
- **3.7.2 (etiqueta v3.7.2): La cocina** (cerrada el 06-10 en la notebook). Cocina + granja, `CAMBIOS_3_7_2.md` (tiene preguntas para el usuario). Gate 154/154, 62 partidas reales. En curso: 3.7.3 La trochita (ramas v373-loco y v373-vagones) y un bug de cabezas/cuellos de la gente (rama v372-cabezas).
- **3.7.1 (etiqueta v3.7.1): Amor en la aldea** (cerrada el 06-10 en la notebook). `CAMBIOS_3_7_1.md`; decisiones del usuario en `PLAN_3_7.md` ("Decidido el 06-10"). Incluye los retoques de la 3.7.0 (`CAMBIOS_3_7_0.md`). Gate 152/152, 60 partidas reales. **Partidas reales en paralelo**: `node herramientas/suite-paralela.cjs <salida> 4` (cada una con su perfil vía `herramientas/perfil-propio.cjs`, ventanas al monitor; ~24 min en vez de ~60; repetir solas las que fallen). Sigue: 3.7.2 La cocina.
- **3.7.0 (etiqueta v3.7.0): La aldea crece.** Primera de las 5 versiones de `PLAN_3_7.md` (leelo: siguen 3.7.1 Amor, 3.7.2 Cocina, 3.7.3 La trochita, 3.7.4 Tradiciones). `CAMBIOS_3_7_0.md`. Quedaron sin unir unos retoques de poses: rama `v370-retoques-wip` en GitHub (sin probar). Prototipos aprobados por el usuario en las ramas `proto-personajes` (ya pasado al juego en la 3.7.0) y `proto-tren` (diseño de la 3.7.3, `?debug=1&tren=proto`). Sigue: retoques de la 3.7.0 y la 3.7.1 Amor.
- **3.6.2 (cerrada el 05-10, etiqueta v3.6.2):** lo pendiente de la 3.6 (obras viejas encimadas, clic y mando en el HUD, mapa de la aldea, lluvia bajo techo, etc.). Gate 146/146. `CAMBIOS_3_6_2.md`. **Hay un plan grande en charla con el usuario para la 3.7 (aldea que crece, romance, tradiciones): todavía no está escrito en el repo; preguntarle antes de empezar.**
- **3.6.1 (cerrada el 04-10, etiqueta v3.6.1):** caza de bugs de la 3.6 en 4 equipos, 33 arreglos (el sillón de la biblioteca que no te dejaba salir, etc.). Gate 144/144. Lo que quedó para después, al final de `CAMBIOS_3_6_1.md`.
- **3.6.0 (cerrada el 03-10, etiqueta v3.6.0): la Aldea de los Duendes.** Pueblo fijo en la
  parada sur (sólo Relax), planificado con el usuario en `PLAN_ALDEA.md` (leelo: tiene todas sus
  decisiones). Crece con 11 pobladores y obras del pueblo; biblioteca popular (NADA religioso:
  el usuario lo pidió); el almacén de Ercilia y la casa de té se mudaron a la aldea (en el
  Desafío siguen en el valle); vecinos con horarios, tiempo libre, menú de charla, amistad y
  memoria (`vecindad*.js`); mecánicas en cada lugar (`aldea-mecanicas*.js`); se sacó el
  «fundar el pueblo» de la 3.1. Gate 140/140, 53 partidas reales. `CAMBIOS_3_6_0.md`.
- **3.5.4 (cerrada el 02-10, etiqueta v3.5.4):** estabilidad — fuga grande del contexto 3D
  recuperado (candidata firme a las caídas en la Radeon integrada), ventana blindada, caos de
  ~5 h con 4 arreglos. Gate 133/133, 49 partidas reales. `CAMBIOS_3_5_4.md` (incluye cómo
  correr el soak largo en la PC de escritorio).
- **3.5.3 (etiqueta v3.5.3):** Ctrl+W (agacharse con Ctrl + caminar con W) cerraba el juego:
  sin el menú oculto de Electron. Las ventanas de prueba van al monitor externo con
  `npx electron --no-sandbox -r herramientas/al-monitor.cjs …`.
- **3.5.2 (cerrada el 02-10 en la notebook, etiqueta v3.5.2):** pulido de lo anotado en la
  3.5.0 (paisaje, animales, bosque) en tres ramas juntadas; gate 129/129 y las 46 partidas
  reales a la primera. Detalle y lo que quedó para después en `CAMBIOS_3_5_2.md` (reemplaza
  la lista "Lo visual que quedó anotado de la 3.5.0" del punto 3).
- **3.5.1 (cerrada, etiqueta v3.5.1):** crashes y revisión de todo el juego: cuadro de preguntas propio (no más `prompt`/`confirm`, que en Electron tiraban error), cada sistema del bucle aislado con `fallaSistema`, recuperación del contexto 3D perdido, reapertura sola si la ventana se cae o se cuelga (`recuperacion-main.cjs`), autoguardado cada 20 s reales; 25 arreglos de Relax, 25 de Desafío, dos fugas chicas de memoria. Detalle en `CAMBIOS_3_5_1.md`.
- **3.5.0 (cerrada, etiqueta v3.5.0):** distancia de dibujo configurable + caza de bugs visuales (vegetación, paisaje, gente y animales). Detalle en `CAMBIOS_3_5_0.md`.
- **3.4.0 (cerrada y verificada):** "tal cual HushWood, con la Patagonia de verdad".
  Gate 124/124, las 42 partidas reales en verde. Detalle en `CAMBIOS_3_4_0.md`:
  luz dorada y paleta sin lima, bruma con techo; copas de cartas de hojas pintadas (atlas por
  código) con ramas, troncos con vetas, cada especie real (arrayán canela con manchones,
  coihue en capas, pehuén en pisos, lenga, ñire, maitén, ciprés); helechos plumosos, pasto
  denso, flores reales (lupinos, margaritas, amancay); sotobosque en bloques; cordillera en
  cordones con nieve, lago pintado, nubes; gente y animales rehechos (`formas.js` nuevo, ropa
  de la zona, anatomía real).
- **3.3.0:** árboles lejanos pre-dibujados (impostores), bosque en bloques, luces fijas,
  modo fluido. **3.2.0:** primera vuelta HushWood + ritmo Auto + F3. Resto en `CAMBIOS_*.md`.

### Lo que quiere el usuario (dirección)
- **Gráficos "tal cual" HushWood** (OoyGames, Steam 4842880). Miradas sus capturas: NO es
  low-poly facetado; es pintado con pincelada amplia, corteza rojiza con vetas, coníferas de
  racimos colgantes, pasto denso, matas de flores, rocas grandes redondeadas, bruma fuerte,
  luz suave y cálida.
- **Lo real se respeta**: cada especie patagónica (arrayán, coihue, pehuén…), la gente
  (ropa de la zona) y los animales (pudú, huemul, caballo criollo…) como son en la realidad,
  con el acabado de HushWood.
- **Fluidez** en su PC: Ryzen 5 4600G con Radeon integrada, monitor a 120 Hz. Optimizar sin
  perder nada del juego. **Todavía nunca se midió en su PC** (pedirle que mire F3).
- **Inglés al final**: no traducir lo nuevo; las pruebas de idioma existentes siguen verdes.
- Le gusta ir **rápido con 2 o 3 subagentes en paralelo**, que le muestren **capturas** de
  cómo va quedando y el **porcentaje de avance honesto** (pregunta "¿por dónde vas?" seguido).
- Ideas **rechazadas** (no proponer): vida tranquila/conservas/huellas, trineo, globo,
  trincheras, zorra blindada, arenas, modo pueblo, represa, puerto, sabotaje, expediciones,
  economía del pueblo, invasores que roban.

---

## 3. Para Claude: qué sigue (después de la 3.6.0)

La 3.6.0 se cerró el 03-10 en la PC de escritorio con 9 ramas en worktrees (núcleo,
arquitectura, gente, vecindad, vida, mundo, detalles, mecánicas, optimizar). Módulos nuevos:
`aldea.js` (plano, reglas, horarios, guardado, puro), `aldea-arquitectura.js` (edificios,
etapas de obra, shader de superficies `aSuperficie`), `aldea-mundo.js` (terreno emparejado
después de la vegetación, Worker, manzanas, luces), `aldea-gente.js`, `aldea-mecanicas*.js`,
`aldea-lecturas.js`, `vecindad.js`/`vecindad-voces.js`/`vecindad-juego.js`.

Pendiente o para ofrecerle al usuario:
- **Que la juegue y opine**: el tamaño de las piedras del ripio y el brillo de los charcos, la
  cantidad de gente, el ritmo de llegada de los pobladores (11 en ~64 días de juego).
- **Medir en su PC** (nunca se hizo): F3 en la plaza de la aldea, en el refugio y en el bosque.
- Detalles chicos anotados: las redes de la pescadería sin animación; los chicos sentados en
  los almohadones de la biblioteca quedan un poco altos; la invitación a tomar algo se pierde si
  se recarga a la mitad; la primera carga sin cachés tarda 0,8–0,9 s más (programas de la aldea).
- Lo de la 3.5.4 que sigue: probar con el teclado de verdad Alt+Espacio, F10 y una suspensión;
  el soak largo en la PC de escritorio.
- **Inglés**: todo lo nuevo de la 3.6 está sólo en castellano (se traduce al final).

Ojo con las pruebas: las ventanas ocultas de las pruebas **corren requestAnimationFrame a ~1
cuadro por segundo**. Lo que depende del tiempo de juego necesita esperas o reintentos (ver
`hablarCon` en `humo-3-6-aldea.cjs` y el pudú de `humo-relax-2.cjs`). La suite completa
(`bash herramientas/suite.sh . <salida>`) tarda más de 30 min: correrla en tandas.

## 4. Para Claude: cómo se trabaja

### 4.1 Construir y probar
- `node armar.mjs` arma `index.html` (un solo archivo). Correrlo antes de cualquier prueba.
- `npm run verify` es el gate (150 pasos en la 3.7.0, sólo Node).
- Partidas reales: `pruebas/humo-*.cjs` (57). **Comparten el perfil de Electron: nunca dos a
  la vez.** Para capturas propias usar perfil propio (`app.setPath('userData', …)`).
- **Nunca** matar electron por nombre si hay otras pruebas o capturas corriendo; matar por PID
  o por línea de comandos.
- `window.__hojarasca` en `?debug=1`. `__bucle()` corre un cuadro (con `limiteFps='libre'`).
  `H.desafio.actualizar(0.05,{noche:1,dtReal:0.05})` simula el Desafío.

### 4.2 Reglas del código (cuestan caro si se olvidan)
- `armar.mjs` sólo entiende imports en una línea `import { x } from './y.js';` (no
  `import './x.js'` suelto, no `export ... from`, no `export async function`, no
  `export function*`).
- Módulos de reglas puros en `x.js`; lo visual en `x-mundo.js`.
- Identificadores exportados **sin ñ**; buscar por nombre con `Object.hasOwn`.
- Geometría de obras: material **tipo 0 o 4** (hay prueba).
- El three local **no trae** ShapeGeometry, Shape, OctahedronGeometry, Vector4 ni Frustum.
- El terreno tiene **huella fija** (`pruebas/verificar-2-2.mjs`): no cambiar geometría ni alturas.
- No mover árboles ni cambiar cuántos hay (`pruebas/verificar-3-3-bosque.mjs`).
- Invasores reciclados: todo campo nuevo por invasor se limpia en `bajarAlien`.
- La tecla **E** y el **aviso** comparten prioridad (comentario en main.js).
- Muchas pruebas verifican **texto exacto**: buscar en `pruebas/` antes de cambiar una línea;
  si una prueba describe algo cambiado a propósito, actualizarla lo mínimo y decirlo.
- Fines de línea **LF**; comentarios en castellano con la versión adelante (`3.5:`).
- Subir versión: sólo `package.json` y la raíz de `package-lock.json`
  (`"name": "hojarasca",\s*"version"`). **Nunca tocar package.json desde PowerShell** (usar node).
- robocopy: excluir sólo `<carpeta>\dist` (`/XD dist` sin ruta borra `node_modules\electron\dist`).
- Sin compilaciones de shaders a mitad de juego; no sumar dibujos por cuadro sin medir.

### 4.3 Herramientas (`herramientas-34\` en la PC sin Git Bash; en la otra PC hay Git Bash y se usan los `.sh` de `herramientas/`)
- `verify-todo.cjs <proy>`: corre cada paso del gate y junta las fallas.
- `<proy>\herramientas\suite.ps1 . <salida> [lista]`: todas las partidas reales, una por vez
  (PowerShell; en Git Bash está `suite.sh`). `empaquetar.ps1 <proy> <ver> <LEEME>`: instalador,
  portable, depot, código y `Hojarasca-<ver>-completo.zip` en Descargas (verifica el ASAR).
  Los `.ps1` necesitan **UTF-8 con BOM**.
- `bosque-medir\vistas-bosque.cjs . <salida> <calidad>`: capturas sin carteles con perfil
  propio, **fuerza la vegetación cercana** (la ventana oculta dibuja lento y si no, faltan
  árboles) y mide dibujos/triángulos/ms. Vistas con la variable `VISTAS` (JSON **hecho con
  node**: `ConvertTo-Json` de PowerShell aplana los arreglos y cuelga el script). Listas:
  `lejos-vistas.json`, `bosque-medir\vistas-*.json`.
- `gente-medir\vistas-gente.cjs`: primeros planos de cada vecino y animal (`SOLO=a,b`).
- `bugs-recorrido\recorrido.cjs`: camina de verdad con reloj virtual y dt fijo, detecta lo que
  aparece/desaparece en la vista y junta la consola.
- `subir-version.cjs`, `diferencias.cjs <base> <otra>` (qué archivos cambiaron),
  `estado-340.cjs` (ejemplo de cómo tocar RELEASE_STATUS con node).
- En PowerShell, `node -e "..."` rompe las comillas: escribir scripts en archivos.

### 4.4 Cómo se trabajó la 3.4 (funcionó bien)
- Un subagente por área, cada uno en **su copia** `src\trabajo-<x>` con unión a node_modules
  (`mklink /J`), archivos sin pisarse; juntar copiando sólo los archivos de cada dueño y correr
  el gate con todo junto. Pasarles capturas de HushWood descritas y las reglas de arriba.
- Mirar las capturas a tamaño completo antes de dar algo por bueno; mandarle al usuario
  antes/después con lo que todavía está mal dicho de frente.
- Una prueba que falla una vez y pasa sola dos veces es de tiempo, no un bug; decirlo igual.

---

## 5. Seguridad (pasó hoy)
AnyDesk de esta PC recibió un pedido de conexión (rechazado) desde la red local (192.168.1.21,
ID 576041582). El usuario lo resolvió. Nunca abrir ni configurar AnyDesk ni nada de acceso
remoto.

## 6. Espacio en común entre las dos PC
Elegido por el usuario: **repositorio privado en GitHub** (ver punto 1 y 2). Historial: `v3.4.0` y `v3.5.0` (cerradas). Para trabajar en paralelo con subagentes conviene
`git worktree add -b <rama> ../trabajo/<x> main` + unión a node_modules, y al final `git merge`.
