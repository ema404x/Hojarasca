# Hojarasca — cómo seguir en la otra PC (traspaso del 01-10-2026, tarde)

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
- **3.5.0 (EN CURSO, sin verificar):** distancia de dibujo configurable (ver punto 3).
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

## 3. Para Claude: qué estaba en curso (3.5.0)

El usuario: *"las cosas se van generando como muy cerca de uno cuando va pasando, debería haber
una configuración como en Minecraft para configurar los chunks de distancia"* y *"hay bugs"*.

### 3.1 Lo que ya está hecho en `hojarasca-3.5.0-en-curso` (gate 125/125; NADA más verificado)
Archivos que cambian contra la 3.4.0: `src/config.js`, `src/main.js`, `src/plantilla.html`,
`src/guardado.js`, `src/rendimiento.js`, `src/vegetacion.js`, `src/pasto.js`,
`src/materiales.js`, `src/cielo.js`, `package.json` (sólo el script verify, la versión sigue
3.4.0), `pruebas/verificar-optimizacion-adaptativa-rc22.mjs` (actualizada) y
`pruebas/verificar-3-5-distancia.mjs` (nueva, sumada al gate). Buscar `3.5:` en el código.
- **Ajustes → Video: "Distancia de dibujo"** en bloques de 40 m (o "Según la calidad", el
  valor por defecto) y **"Distancia de plantas"**; se aplican en vivo (se acercan de a poco),
  se guardan (`guardado.js`, un guardado viejo usa la de su calidad) y se ven en F3.
  `aplicarDistancias` en main.js; constantes en config.js.
- **Bug grave arreglado (venía de la 3.3):** si la placa no llegaba al objetivo de cuadros
  (límite fijo o "libre" en una PC que no llega a ~47 fps), `rendimiento.js` marcaba todos los
  cuadros como lentos y **negaba para siempre las tareas pesadas** (vegetación, ambiente,
  visibilidad, refugio, sombras): la vegetación se congelaba y después cambiaba de golpe.
  Ahora ninguna tarea pesada espera para siempre (`esperando`, `reloj` en rendimiento.js).
  **Probablemente era lo que el usuario veía.**
- Pasto que no sale bajo pisos de construcciones (`marcarPisos`, canal azul de la máscara).
- Pasto, flores y sotobosque **crecen desde el suelo** en el borde en vez de aparecer de golpe.

### 3.2 Lo que falta para cerrar la 3.5
1. **Revisar con capturas** lo hecho (el equipo se frenó en la etapa de medir/capturar):
   caminando y girando rápido, con distancia mínima, por defecto y máxima, en media y alta.
   Medir costo con el valor por defecto (tiene que ser igual al de la 3.4) y con el máximo.
   Probar el bug grave con `herramientas-34\bugs-recorrido\recorrido.cjs` a 33 ms por cuadro
   (antes: `veg.actualizar` 0 veces en 400 cuadros).
2. **Bugs pendientes de la 3.4** (evidencia en `herramientas-34\bugs-recorrido\`):
   - **Ramas del ciprés/maitén que tapan la pantalla** al pasar a 2,5–3,5 m: las cartas que
     cuelgan del primer piso del ciprés (`vegetacion.js` ~880-888, tamaño `radio*0.52`) y la
     cortina del maitén (~815-823) quedan a la altura de los ojos y se ven como manchas lisas.
     Reproducir: alta, verano, refugio −133,74/+2,86 mirando a 120°. Capturas
     `s7-ab\bosque-fin-ok\f001.png`, `s9-340\bosque-fin\f000.png` (3.3: `s9-330\...`).
   - **Invierno: copas cercanas verdes y lejanas blancas** (cada árbol cambia al cruzar el
     LOD, 66 m alta / 44 m media). Probable causa: la nieve sale de la normal del vértice
     (`materiales.js` ~181-184) y las cartas cercanas llevan normales de follaje desde el
     centro del racimo (`vegetacion.js` ~518-580). Capturas `s10-invierno-media\`,
     `s14-invierno-alta-340\` contra `s14-invierno-media-330\`.
   - Sospechas (vistas una vez): helechos del sotobosque que no se ponen rojizos en otoño
     (`s10-otono-alta`); una flor naranja sobre la nieve en invierno.
   - Las líneas de los bugs son de la 3.4.0; en la 3.5 pueden haberse corrido.
3. Preguntarle al usuario **qué bugs vio él** (dijo "hay bugs" sin detallar).
4. Cerrar: subir versión a 3.5.0 (`node herramientas-34\subir-version.cjs <proy> 3.4.0 3.5.0`),
   `CAMBIOS_3_5_0.md`, línea en `RELEASE_STATUS.md`, gate, **las 42 partidas reales**, LEEME
   con el QA real y empaquetar.

### 3.3 Otros pendientes (de la 3.3/3.4, para después)
- Cuadros sueltos de más de 50 ms sin causa encontrada; F3 "máx" de luces en pueblo/estación.
- Medir en la Radeon integrada el costo de las hojas recortadas (`discard`) de cerca y a media
  distancia (en esta PC: +0,5–1 ms en alta junto a un ciprés).
- Gente todavía algo rígida (brazos tubo, caras simples), escalones en uniones (cuello del
  perro/huemul, hombros), crin del caballo como lámina.
- Piedemonte pálido al ocaso, alguna faceta en cerros cercanos, amancay en franja de cantero,
  rayos de sol suaves al mediodía, impostores blandos cerca de su límite.
- Workers para la simulación (se dejó: la fauna cuesta < 0,5 ms).

---

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

### 4.3 Herramientas (`herramientas-34\`; en esta PC no hay Git Bash ni git)
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
Elegido por el usuario: **repositorio privado en GitHub** (ver punto 1 y 2). Historial:
`v3.4.0` (cerrada) y encima el commit "3.5.0 en curso".
