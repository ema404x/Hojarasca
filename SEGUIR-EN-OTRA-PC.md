# Hojarasca — cómo seguir trabajando en la otra PC

Escrito el 2026-10-01 al pasar el trabajo de una PC a la otra. Sirve para vos y para
Claude: en la otra PC, abrí Claude Code en la carpeta del proyecto y decile
**"leé SEGUIR-EN-OTRA-PC.md y seguimos"**.

---

## 1. Para vos (pasos en la otra PC)

1. Copiá **`Hojarasca-3.3.0-completo.zip`** (está en Descargas) a la otra PC.
2. Adentro hay un `Hojarasca-3.3.0-codigo-fuente.zip`. Extraelo con el **Extraer todo** de
   Windows (o `Expand-Archive` en PowerShell) en
   `Documents\Hojarasca\src\` → tiene que quedar `Documents\Hojarasca\src\hojarasca-3.3.0`.
   **No usar `unzip` de Git Bash**: rompe las carpetas de este zip.
3. Necesitás **Node.js** (18 o más nuevo) y **Git Bash**. En la carpeta del proyecto corré
   una vez `npm install` (baja Electron y lo necesario; el zip no trae `node_modules`).
4. Abrí Claude Code en `Documents\Hojarasca\src\hojarasca-3.3.0` y pedile que siga.

**Ojo:** la 3.3.0 está **hecha pero sin verificar del todo**. Lo primero es correr las
pruebas (punto 3.1). La última versión verificada y entregada es la **3.2.0**.

---

## 2. Para Claude: el proyecto

**Hojarasca** es un juego Electron + three.js (r186, incluido local en
`three-r186-inline.js`) en un valle andino-patagónico procedural. Dos modos:
**Relax** (refugio, vecinos, huerta, perro, caballo, kayak, velero, trochita manejable,
comercio, pueblo, historia guiada) y **Desafío** (invasores de noche, arsenal, fortín,
asedio, jefe dentro de la nave, modo sin fin). Todo se arma por código: no hay imágenes ni
audios externos.

- El usuario habla en **castellano rioplatense**. Todo el juego, los comentarios del código
  y los textos están en castellano.
- **No hay git.** El trabajo pasa de una PC a la otra con `Hojarasca-<ver>-completo.zip`
  (instalador, portable, depot de Steam, `codigo-fuente.zip` y `LEEME.txt`).
- Cada versión vive en `Documents\Hojarasca\src\hojarasca-<ver>`. Antes de tocar nada,
  confirmar en `RELEASE_STATUS.md` que la carpeta parte de la última versión.

### Versiones recientes (lo último arriba)
- **3.3.0 (hecha, sin verificar):** árboles lejanos pre-dibujados (`impostores.js`, ~7000
  árboles en un solo dibujo) y bosque en bloques; luces fijas 4+1 (`luces.js`,
  `compileAsync` al cargar: cero compilaciones a mitad de juego); modo fluido opcional
  (resolución dinámica, apagado); sólo se generan las texturas que se usan; segunda vuelta
  del estilo (montañas azules, rayos por los huecos, helechos plumosos, coihue en capas,
  pehuén en paraguas, luz dorada). Detalle en `CAMBIOS_3_3_0.md` y `CAMBIOS_3_3_0_FLUIDEZ.md`.
- **3.2.0:** estilo **HushWood** primera vuelta + ritmo de cuadros **Auto** según el
  monitor + **F3**. (`CAMBIOS_3_2_0.md`, `CAMBIOS_3_2_0_FLUIDEZ.md`)
- **3.1.0:** historia guiada (8 capítulos), eventos del valle con decisiones, carreras
  contrarreloj, desafío del día, torneo semanal, oficios, fundar el pueblo.
- **3.0.1:** auditoría de todas las estructuras (accesos, escaleras, colisiones).
- **3.0.0:** Desafío en grande (asedio, jefe en la nave, puestos, invasores que se
  adaptan, sin fin, mapa por código).
- 2.9 vehículos y construcción · 2.8 personalización (F5) · 2.7 salto visual y sonoro y
  optimizaciones · 2.5/2.6 arsenal y fortín. Todo está en `CAMBIOS_*.md`.

### Lo que quiere el usuario (dirección actual)
- **Que se vea como HushWood** (OoyGames, Steam 4842880; estilo Firewatch): estilizado y
  pintado, coníferas en capas con degradé, sol dorado, rayos de luz, bruma de color
  (verde azulado lejos, cálido cerca), prados con flores blancas y violetas, helechos,
  paleta cohesiva. **No realista.** (En la 2.7 se intentó realismo; se cambió de rumbo.)
- **Que corra fluido en su PC**: Ryzen 5 4600G con **Radeon integrada**, 12 hilos,
  monitor que ahora tiene en **120 Hz** (es de 144). Ideas acordadas: lo mejor de RAGE
  (ritmo fijo, todo calculado de antemano, resolución dinámica opcional) y de Minecraft
  (bloques ya armados, descartar bloques fuera de vista, luz guardada, varios hilos).
- **Regla de optimización:** no se pierde nada del juego. Lo que no debería cambiar la
  imagen se compara con capturas píxel por píxel. Se aceptó una diferencia de ±1 nivel de
  color en unos pocos píxeles a cambio de eliminar tirones (luces fijas).
- **Inglés al final:** no traducir lo nuevo de cada versión; se traduce todo cuando el
  juego esté terminado. Las pruebas de idioma existentes tienen que seguir en verde.
- Le gusta que se vaya **rápido**, con equipos (subagentes) en paralelo, y que le avisen
  al terminar. Pide el porcentaje de avance seguido: darlo honesto.
- Ideas que **rechazó** (no proponerlas de nuevo): vida tranquila/conservas/huellas,
  trineo, globo, trincheras, zorra blindada, arenas, modo pueblo, represa, puerto,
  sabotaje, expediciones, economía del pueblo (que los vecinos consuman o se vayan),
  invasores que roban.

---

## 3. Para Claude: qué hacer ahora

### 3.1 Cerrar la 3.3.0 (primero)
```bash
cd "<carpeta>/hojarasca-3.3.0"
node armar.mjs
bash herramientas/gate-seguir.sh . ../salida-330          # el gate: npm run verify paso a paso
bash herramientas/suite.sh . ../salida-330                 # todas las partidas reales (~45 min)
```
- Si algo falla, repetir esa prueba **sola** antes de creer que es un bug (algunas
  dependen del tiempo y fallan si la máquina está cargada). Si falla siempre, es real.
- Con todo en verde: corregir el `LEEME` (hay uno base en el punto 5) y empaquetar:
```bash
bash herramientas/empaquetar.sh . 3.3.0 ../LEEME-330.txt
```
  Deja `Hojarasca-3.3.0-completo.zip` en Descargas.

### 3.2 Lo que quedó pendiente después de la 3.3
1. **Sotobosque en bloques** (helechos, arbustos, piedras, hojarasca, sombras de contacto
   todavía se dibujan por bloque y tipo): el próximo gran recorte de dibujos.
2. Rayos de sol todavía tenues si no hay un hueco del follaje cerca del sol.
3. Coihue lejano se ve "en platos"; pehuén podría ser más denso de lejos.
4. Cuadros sueltos de más de 50 ms que no son compilaciones (causa sin encontrar).
5. Impostores: cambian de ángulo de golpe (fundir dos ángulos ayudaría desde el mirador).
6. Revisar en F3 el valor "máx" de luces en el pueblo, la estación y las antorchas del
   Desafío: si se juntan más de 4+1 luces, las más lejanas se apagan.
7. Probar el modo fluido en una situación donde la placa no llegue (sólo se probó con prueba).
8. Varios hilos (workers) para la simulación: se dejó porque la fauna cuesta < 0,5 ms.

---

## 4. Para Claude: cómo se trabaja en este proyecto

### Construir y probar
- `node armar.mjs` arma `index.html` (un solo archivo con todo). **Correrlo antes de
  cualquier prueba de Electron.**
- `npm run verify` es el gate (122+ pasos, sólo Node; no necesita `npm install`).
  `herramientas/gate-seguir.sh` lo corre sin frenar en el primer error.
- Pruebas de Electron: `npx electron pruebas/humo-<x>.cjs`. **Comparten el localStorage
  del perfil por defecto: nunca correr dos a la vez.** Para pruebas propias o en paralelo
  usar `npx electron --user-data-dir=<carpeta propia> ...`.
- **Nunca** `taskkill //F //IM electron.exe` si hay otras pruebas corriendo.
- `window.__hojarasca` expone casi todo en `?debug=1`. `__hojarasca.__bucle()` corre un
  cuadro entero; si se llama seguido, poner `ajustes.limiteFps = 'libre'` o el límite de
  cuadros los descarta. `H.desafio.actualizar(0.05, {noche:1, dtReal:0.05})` simula el
  Desafío.
- Medir: `npm run perfil` / `perfil:desafio` / `perfil:carga` / `diag:dibujo` /
  `diag:matrices`. F3 en el juego muestra cuadros, tirones, ritmo, dibujos y placa.
- Nueva prueba al gate: `node herramientas/sumar-prueba.cjs . verificar-x.mjs`
  (sólo el nombre, sin `pruebas/`).

### Reglas del código (cuestan caro si se olvidan)
- `armar.mjs` sólo entiende imports en una línea `import { x } from './y.js';`.
  **No** `import './x.js'` suelto, **no** `export ... from`, **no** `export async function`,
  **no** `export function*`.
- Módulos de reglas **puros** (sin three ni DOM) en `x.js`; lo visual en `x-mundo.js`.
  `guardado.js` importa los puros.
- Identificadores exportados **sin ñ** (las pruebas usan `[\w$]`). Buscar por nombre con
  `Object.hasOwn` (un guardado con `constructor` o `__proto__` rompía cosas).
- Geometría de obras: material **tipo 0 o 4** solamente (hay prueba).
- El three local **no trae** `OctahedronGeometry`, `Vector4` ni `Frustum`: verificar antes
  de usar una clase.
- El terreno tiene una **huella fija** (`pruebas/verificar-2-2.mjs`): nunca cambiar su
  geometría ni alturas.
- Los invasores se reciclan: todo campo nuevo por invasor se limpia en `bajarAlien`.
- La tecla **E** y el **aviso** en pantalla tienen que usar la misma prioridad (hay un
  comentario en main.js): cada interacción nueva va en los dos lugares, en el mismo orden.
- Muchas pruebas verifican **texto exacto** del código: antes de cambiar una línea, buscar
  fragmentos en `pruebas/`. Si una prueba describe algo que se cambia a propósito,
  actualizarla lo mínimo y decirlo.
- Fines de línea **LF** (con Python en Windows: `newline='\n'`).
- Comentarios en castellano con la versión adelante (`3.4:`).
- Subir versión: `package.json` y sólo la raíz de `package-lock.json`
  (`"name": "hojarasca",\s*"version"`); `@noble/hashes` y `@electron/notarize` no se tocan.
- Al copiar carpetas con robocopy: excluir sólo `<carpeta>\dist`
  (`/XD dist` sin ruta borra también `node_modules\electron\dist`).

### Convención de cada versión
Módulo nuevo + prueba `pruebas/verificar-*.mjs` en el gate + `humo-*.cjs` + un
`CAMBIOS_<ver>.md` + línea al principio de `RELEASE_STATUS.md` + `LEEME.txt` del paquete
con "lo que me falta que mires vos" + zip completo en Descargas.

### Lecciones de cómo trabajar
- Repartir en **2 o 3 subagentes en paralelo** con archivos sin pisarse, cada uno con sus
  pruebas; después revisar con capturas y correr el gate y las partidas reales.
- **Mirar las capturas a tamaño completo** antes de entregar: en la 2.7.1 se entregaron
  árboles con pedazos de follaje flotando. Comparar siempre antes y después.
- Probar caminando de verdad (keydown + `jugador.actualizar`), no teletransportando: así
  se descubrió que torres, faros y andenes no se podían alcanzar.
- Una prueba que falla una vez y pasa sola dos veces es de tiempo, no un bug; decirlo igual.

---

## 5. LEEME base para la 3.3.0

```
HOJARASCA 3.3.0 — El bosque en bloques y mas fluidez — Windows x64
==================================================================

QUE HAY EN ESTA CARPETA
  Hojarasca-3.3.0-Setup-x64.exe          Instalador (recomendado: arranca mas rapido).
  Hojarasca-3.3.0-Portable-x64.exe       Un solo archivo, sin instalar.
  Hojarasca-3.3.0-Steam-depot-win64.zip  Carpeta para depot de Steam.
  Hojarasca-3.3.0-codigo-fuente.zip      Proyecto: npm install . npm run verify . npm run dist:win

QUE TRAE
  - Arboles lejanos pre-dibujados y bosque en bloques: mucho menos trabajo para la placa.
  - Sin trabas al aparecer casas, faros o el tren con luces.
  - Modo fluido opcional (Ajustes, video): baja un poco la resolucion si hace falta.
  - Estilo HushWood, segunda vuelta: montanas azules, rayos entre los arboles, helechos
    plumosos, coihue en capas, pehuen en paraguas, luz dorada en el bosque.
  Detalle en CAMBIOS_3_3_0.md dentro del codigo fuente.

LO QUE ME FALTA QUE MIRES VOS
  1. Caminar por el bosque y el pueblo con F3 abierto: cuadros parejos y sin tirones.
  2. Si el estilo va bien encaminado hacia HushWood.

ESTADO DE QA
  - npm run verify en verde.
  - Partidas reales (Electron) en verde, la suite completa.
```
(Corregir "ESTADO DE QA" con lo que dé de verdad.)
