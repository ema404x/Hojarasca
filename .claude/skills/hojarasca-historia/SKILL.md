---
name: hojarasca-historia
description: Cómo se escribe y se conecta la Historia nueva de Hojarasca («El trato del molino»): reparto entre dos agentes, formato de escenas y efectos, disparadores, pruebas y las reglas del usuario. Usala al lanzar o hacer un acto de la Historia, al escribir escenas o al juntar las ramas A y B.
---

# La Historia nueva de Hojarasca

Fuentes: `GUION_HISTORIA.md` (guion de los 13 capítulos), `DECISIONES_HISTORIA_NUEVA.md`, `DECISIONES_HISTORIA_DUENDES.md`, `CAMBIOS_4_14_0.md` (API del motor de escenas), `CAMBIOS_4_15_0*.md` y `CAMBIOS_4_16_0*.md` (cómo quedaron los actos hechos).

## Reparto de un acto (siempre dos agentes, nunca más)
- **A, mecánica:** objetivos, momentos, premios, desbloqueos, disparadores (`src/historia-disparadores*.js`), aplicador de efectos, objetos del mundo, estado y guardado (`historia.js`, `historia-ui.js`, `guardado.js`, `main.js`), humo de partida real.
- **B, guiones (datos puros):** `src/historia-escenas-acto<N>.js` (`ESCENAS`, `IDS`, `EFECTOS`, `DISPARO`), `src/historia-texto-acto<N>.js` (tarjetas, notas, cuaderno de lo raro, charlas), prueba `pruebas/verificar-<ver>-escenas-acto<N>.mjs` con mutaciones. Sin Electron.
- Cada uno en su worktree (`hojarasca-junta`). A deja **archivos hueco** con los nombres exactos de los de B; al juntar queda el de B (`git checkout --theirs` en esos dos, `cerrar-version.cjs juntar` resuelve `package.json`).
- Después de juntar, A (o el agente que sigue con contexto, por `SendMessage`) debe dejar el humo en orden **con las escenas reales**: ahí aparecen siempre los choques (ids de elección, efectos sin registrar, condiciones).

## Formato
- Escena = datos del motor `src/escenas.js` (planos, diálogo, gesto, espera, sonido, hora, clima, elección, efecto, fundido, salto). Ids de elección sin `ñ`. No usar fundido cruzado con pasos adentro: usar `apagon([...])` (baja a negro, corre los pasos, vuelve), porque saltar a mitad del cruce descarta los pasos.
- Efectos con nombre: `lazo:<quién>:<n>`, `raro:<id>`, `decision:<D>:<a|b|c>`, `ramal:<n>`, `objeto:<id>`, `mundo:<id>`, `entrega:`, `dar:`, `duende:`, `optativa:`, `hablado:`, `tema`, `acompanante`, `quitar:`, `prestado:`. Cada clave nueva se documenta en `CAMBIOS_<ver>_B.md` y A la implementa; cada una se aplica **una sola vez** (también si se salteó la escena).
- Condiciones: `decision`, `lazo`, `evento`, `presente`. Una condición sin registrar da `false` en silencio: la variante no se ve pero nada avisa.
- Las escenas se anclan al jugador (el lugar real puede no existir): mirarlas a ojo, no sólo saltarlas con Esc dos veces.

## Reglas del usuario (valen en cada brief)
- Castellano rioplatense; **no escribir ni mencionar el inglés** (se traduce al final).
- Lo sensual, sólo sugerido; nada religioso ni figuras sagradas del folclore real.
- Sólo teclado y ratón. Relax separado del Desafío; la Historia es el Relax con `relaxTipo='historia'`.
- 0 programas de shader nuevos en juego (110; el molino viejo de día suma 1 y es preexistente).
- Electron siempre en el monitor externo, candado `C:\Users\Andres\AppData\Local\Temp\hx\electron.lock`, nunca `taskkill /IM electron.exe`.
- Máximo 2 agentes a la vez. Planificar no es ejecutar: esperar «dale». No mencionar la carpeta scratch.
- Ideas rechazadas (`DECISIONES_DISENO_4_10.md`, `CLAUDE.md`) no se vuelven a proponer.
- Informar siempre: porcentaje honesto, tiempo restante por tramo, qué no se vio a ojo.

## Cierre del acto
`node herramientas/cerrar-version.cjs docs <ver>` (con `herramientas/cierre/<ver>.json`) → `npm run verify` de corrido → en el repo principal `node herramientas/cerrar-version.cjs publicar <ver> <rama>`. Ver `hojarasca-cerrar-version`.
