# Hojarasca — guía para Claude

Juego **Electron + three.js** (r186 local en `three-r186-inline.js`) en un valle andino-patagónico procedural.
Todo se arma por código (sin texturas, modelos ni audio descargados). Dos modos: **Relax** (refugio, vecinos,
aldea, economía en pesos, negocios, trochita, kayak, velero, caballo, historia guiada) y **Desafío**, que en
pantalla se llama «La noche de los duendes» (en el código sigue siendo `desafio`).

El usuario habla **castellano rioplatense**. Juego, textos, comentarios, commits y documentos, en castellano.

## Dónde está cada cosa
- Repositorio: `Documents\Hojarasca\hojarasca` (GitHub `ema404x/Hojarasca`). Las carpetas `Documents\Hojarasca\src\hojarasca-<ver>` son copias viejas: **no se trabaja ahí**.
- **`main` es la línea oficial** (desde la 4.6.0): cada versión cerrada se une a `main` y lleva su etiqueta `v<ver>`. El trabajo en curso va en ramas `v<ver>-<x>` que salen de `main`. El bloque de arriba de `SEGUIR-EN-OTRA-PC.md` dice lo último.
- Planes vigentes: `PLAN_*.md` en la raíz (por ejemplo `PLAN_MAPA_VALOR.md`, `PLAN_DESAFIO_MEJORAS.md`). Lo hecho en cada versión: `CAMBIOS_<ver>.md`.
- Trabajo en paralelo: un worktree por tarea en `Documents\Hojarasca\trabajo\t<ver>-<x>`, con `node_modules` como unión (`New-Item -ItemType Junction`) al del repositorio.

## Construir y probar
- `node armar.mjs` arma `index.html` (un solo archivo). Correrlo antes de cualquier prueba de Electron.
- `npm run verify` es el **gate** (sólo Node). Correrlo **completo y de corrido** antes de dar algo por terminado y decir el número exacto de pasos.
- Durante el trabajo se puede usar `npm run verify:paralelo` (los mismos pasos en un grupo de procesos, ~80 s en vez de ~6 min; `HOJ_VERIFY_HILOS=n` cambia cuántos a la vez; los que miden tiempos van al final, de a uno). Para cerrar una versión, `npm run verify` de corrido.
- Partidas reales: `pruebas/humo-*.cjs`. Ver la skill `hojarasca-partidas` (desde bash fallan en silencio; van por PowerShell).
- Una prueba que falla una vez y pasa sola dos veces es de tiempo, no un bug: decirlo igual.
- `window.__hojarasca` en `?debug=1`; `__bucle()` corre un cuadro (con `ajustes.limiteFps = 'libre'`).

## Reglas del código (cuestan caro si se olvidan)
- `armar.mjs` sólo entiende imports en una línea: `import { x } from './y.js';`. Nada de `import './x.js'` suelto, `export ... from`, `export async function` ni `export function*`.
- Reglas puras (sin three ni DOM) en `x.js`; lo visual en `x-mundo.js`; el enganche con el juego en `x-juego.js`.
- Identificadores exportados **sin ñ**. Buscar por nombre con `Object.hasOwn` (guardados con `constructor` o `__proto__`).
- La tecla **E** y el **aviso** en pantalla salen de **una sola tabla** (desde la 4.6.1): `INTERACCIONES` en `src/interacciones.js` (lo que hace la E y dice el aviso, en orden) y `OTRAS_TECLAS` (F, H, Y, B, T, G y los «·»); lo que la tabla le pide al juego está en `ctxInteraccion` de `main.js`. Una interacción nueva es una entrada nueva en la tabla, en su lugar. Las pruebas la miran con `pruebas/ayuda-interacciones.mjs` (`antes`, `que`, `revisarModulo`).
- Muchas pruebas verifican **texto exacto** del código (unas 165 leen `main.js` como texto): antes de cambiar una línea, buscar el fragmento en `pruebas/`. Si una prueba describe algo cambiado a propósito, ajustarla lo mínimo y decirlo. Para pruebas nuevas, preferir conducta: `pruebas/ayuda-codigo.mjs` (`expresion`, `funcion`: evaluar una línea o función del código con un mundo de mentira; `enUnaLinea`: las partes, no la línea exacta).
- El terreno tiene **huella fija** (`pruebas/verificar-2-2.mjs`): no cambiar su geometría ni alturas. No mover árboles ni cambiar cuántos hay (`pruebas/verificar-3-3-bosque.mjs`).
- Geometría de obras: material tipo 0 o 4. El three local **no trae** ShapeGeometry, Shape, OctahedronGeometry, Vector4 ni Frustum.
- Invasores reciclados: todo campo nuevo por invasor se limpia en `bajarAlien`.
- Rendimiento: el juego anda justo en la plaza (~15 ms de 16,7). Nada de compilar shaders a mitad de juego; luces fijas 4+1; no sumar dibujos por cuadro sin medir; lo nuevo, disperso por el mapa.
- Fines de línea **LF**. Comentarios en castellano con la versión adelante (`4.6.0:`).
- **Barras invertidas:** escribiendo desde bash (heredoc, `node -e`, `sed`) las `\` se pierden y `\b` termina como un retroceso real (0x08). Para código con barras usá Write/Edit o Node con `String.fromCharCode(92)`. Hay un control automático que avisa (`herramientas/revisar-escritura.cjs`).
- Subir versión: `package.json` y sólo la raíz de `package-lock.json` (las dos líneas de `"name": "hojarasca"`), con Node; nunca desde PowerShell.

## Reglas del usuario
- **Planificar no es ejecutar.** Si dice «estamos planificando» o «no arranques nada», sólo se conversa: no lanzar agentes, no crear ramas, no tocar código. Esperar una orden explícita («arrancá», «dale», «avanzá», «hacelo»).
- **Electron SIEMPRE en el monitor externo, nunca en la pantalla de la notebook.** Antes de abrir Electron, comprobá que corre el vigilante (`Documents\Hojarasca\vigilante-monitor.ps1`, PID en `vigilante-monitor.pid`); si no corre (por ejemplo después de reiniciar la PC), prendelo desde PowerShell:
  `Start-Process powershell -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-WindowStyle','Hidden','-File','C:\Users\Andres\Documents\Hojarasca\vigilante-monitor.ps1','-CadaMs','80' -WindowStyle Hidden`
- **Electron no le tiene que estorbar:** siempre oculto, en el monitor externo (`herramientas/al-monitor.cjs`), prioridad baja, una instancia por agente y como mucho dos a la vez. **Nunca** `taskkill //F //IM electron.exe`.
- Sólo **teclado y ratón** (no ampliar el mando).
- **No escribir ni mencionar el inglés**: se traduce todo al final. Las pruebas de idioma existentes siguen en verde.
- Lo sensual, sugerido y nunca explícito. Nada religioso ni figuras sagradas del folclore real.
- El DLC será una zona grande nueva con misiones nuevas: las historias largas van ahí.
- Ideas **rechazadas** (no proponer): vida tranquila/conservas/huellas, trineo, globo, trincheras, zorra blindada, arenas, modo pueblo, represa, puerto, sabotaje, expediciones, invasores que roban. Más las descartadas en cada plan (ver la lista en `PLAN_DESAFIO_MEJORAS.md`).
- Estilo visual: «tal cual HushWood» (pintado, no realista, no low-poly facetado), con la flora, la fauna y la gente patagónicas como son.
- Le gusta ir **rápido con 2 o 3 agentes en paralelo**, ver **capturas** antes/después y que le den el **porcentaje de avance honesto** (pregunta «¿por dónde vas?» seguido). Distinguir siempre verificado de no verificado.

## Skills del proyecto (`.claude/skills/`)
- `hojarasca-planificar`: charlas de plan sin ejecutar y dejarlas escritas.
- `hojarasca-junta`: repartir una versión entre agentes (worktrees) y juntar sus ramas.
- `hojarasca-partidas`: correr las partidas reales con Electron.
- `hojarasca-capturas`: capturas antes/después con la cámara bien puesta, y cómo revisarlas.
- `hojarasca-medir`: rendimiento según la PC (la referencia es la Ryzen 5 4600G; en la notebook, sólo antes/después).
- `hojarasca-cerrar-version`: cerrar, subir y empaquetar.

## Agentes del proyecto (`.claude/agents/`)
- `hojarasca-corredor` (Sonnet): corre el gate, las partidas, mediciones y capturas y devuelve el resultado exacto; no cambia el juego.
- `hojarasca-revisor`: pase de bugs de sólo lectura por zona, con reproducción de cada hallazgo.
- El trabajo delicado (diseñar, juntar ramas, buscar la causa de un bug) se hace con el modelo principal.

## Cerrar una versión
Ver la skill `hojarasca-cerrar-version`: versión, `CAMBIOS_<ver>.md`, línea en `RELEASE_STATUS.md`, traspaso en `SEGUIR-EN-OTRA-PC.md`, commit, push con etiqueta `v<ver>` y zip completo en Descargas.
