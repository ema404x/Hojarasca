# Hojarasca — cómo seguir en la otra PC (traspaso del 01-10-2026, noche)

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
kayak, velero, trochita, comercio, pueblo, historia guiada) y **Desafío** (invasores de noche,
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

## 3. Para Claude: qué sigue (después de la 3.5)

La 3.5.0 se cerró en la otra PC el 01-10 a la noche: se unieron tres ramas (`v35-vege`,
`v35-paisaje`, `v35-gente`, cada una hecha en su `git worktree`), gate 126/126 y partidas
reales. Lo que quedó anotado para seguir mejorando (el usuario quiere **seguir mejorando lo
visual** y que le muestren capturas):

- **Vegetación:** ciprés muy de cerca (velo verde del desvanecido y alguna faceta de la falda a
  3–5 m); manchas de luz redondas en una ladera lejana; árboles lejanos pálidos en la bruma
  (igualar la desaturación de la bruma de la vegetación con la del terreno); amancay en franja
  en los canteros (marcar los canteros en `marcarPisos`); coihues cercanos con algo menos de
  nieve que los lejanos; el coirón desaparece en invierno junto con las flores (decidir); los
  cuadros lentos cuestan 1–2 ms más de media en el bosque ahora que las tareas pesadas corren.
- **Paisaje:** niebla que sólo depende de la distancia (franja plana desde el mirador al alba:
  hace falta niebla por altura o con ruido); cerros del borde del valle brumosos al mediodía;
  borde estepa-pasto como franja amarilla en una ladera; nieve "a lunares" en el primer
  cordón; río en pendiente como losa inclinada; árboles nevados al sol con mucho brillo; la
  nodriza del Desafío no se revisó (la tapaba el bosque).
- **Gente y animales:** animales viejos de piezas sueltas (jabalí, coipo, cisne, pato, martín
  pescador, bandurria, cauquén, zorzal); cuello del guanaco, cara de la liebre, patas de la
  oveja, patas del pudú algo largas; costura en el hombro de cerca; la bufanda puede leerse
  como corbata; el mate se toma con el brazo estirado; no se revisaron el cuerpo del jugador,
  lo que se tiene en la mano ni los invasores.
- **Medir en la PC del usuario** (nunca se midió allá): pedirle F3 caminando.

## 4. Para Claude: cómo se trabaja

### 4.1 Construir y probar
- `node armar.mjs` arma `index.html` (un solo archivo). Correrlo antes de cualquier prueba.
- `npm run verify` es el gate (125 pasos en la 3.5, sólo Node).
- Partidas reales: `pruebas/humo-*.cjs` (42). **Comparten el perfil de Electron: nunca dos a
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
