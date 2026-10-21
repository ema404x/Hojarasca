---
name: hojarasca-junta
description: Cómo repartir una versión de Hojarasca entre agentes en paralelo (worktrees) y juntar sus ramas después, con los choques que aparecen siempre. Usala al lanzar agentes en paralelo o al hacer git merge de sus ramas.
---

# Repartir y juntar ramas en Hojarasca

## Repartir
1. Rama base: la última (mirá `SEGUIR-EN-OTRA-PC.md` y `RELEASE_STATUS.md`; no es `main`).
2. Un worktree por agente, desde el repositorio:
   ```bash
   cd ~/Documents/Hojarasca/hojarasca
   git worktree add -b v<ver>-<x> ../trabajo/t<ver>-<x> <rama-base>
   ```
   y la unión a `node_modules` (no `ln -s`: en Git Bash copia 466 MB):
   ```powershell
   New-Item -ItemType Junction -Path 'C:\Users\Andres\Documents\Hojarasca\trabajo\t<ver>-<x>\node_modules' -Target 'C:\Users\Andres\Documents\Hojarasca\hojarasca\node_modules'
   ```
3. En cada encargo: los archivos de cada uno (sin pisarse), **quién es dueño de las listas compartidas** (`MATERIALES` de `construccion.js`, `BIENES` de `comercio.js`, etc.) y los **ids exactos** que van a usar todos. Si uno depende de otro, que use los ids como texto protegido (`Object.hasOwn` / `esBien`) y deje anotado el enganche.
4. Pedirles bloques propios comentados en `main.js` y `guardado.js` (`// 4.6 <x>:`), una prueba `pruebas/verificar-<ver>-<x>.mjs` sumada al gate con `node herramientas/sumar-prueba.cjs . verificar-<ver>-<x>.mjs`, su partida real, un `CAMBIOS_<ver>_<X>.md`, y que **no suban la versión**.
5. Electron: como mucho dos agentes con Electron a la vez; el resto, sólo Node (sus partidas las corrés al juntar).

## Juntar
1. Rama de integración `v<ver>-integra` desde la base, en su worktree, y `git merge --no-edit` de cada rama.
2. **Choque que aparece siempre:** `package.json`, la línea `"verify:pasos"`: cada rama sumó su prueba al final. Se resuelve quedándose con un lado y agregando la prueba del otro (con Node, comparando las dos listas). Validar con `JSON.parse`.
3. `guardado.js`: los bloques de saneo de cada rama van uno después del otro; quedarse con los dos.
4. Conectar lo que quedó pendiente entre ramas (ids distintos para lo mismo, constantes provisorias, funciones de respaldo) usando **una sola fuente** de la verdad.
5. Las pruebas de cada rama simulaban «antes de juntar»: al juntar pueden fallar por eso (no por un bug). Ajustarlas para que simulen el «antes» explícitamente.
6. Revisar el equilibrio: precios nuevos contra lo que pagan los puestos del tren (que no convenga comprar para revender).
7. Subir la versión (Node), `npm run verify` **completo de corrido**, y las partidas reales de cada rama **de a una** (skill `hojarasca-partidas`). Las partidas que el agente no pudo correr suelen esconder bugs reales.
8. `CAMBIOS_<ver>.md` con lo que trae, las decisiones de la junta y la verificación con números.
