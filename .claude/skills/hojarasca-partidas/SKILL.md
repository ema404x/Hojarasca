---
name: hojarasca-partidas
description: Cómo correr las partidas reales de Hojarasca (pruebas/humo-*.cjs con Electron) sin estorbar al usuario y sin que fallen en silencio. Usala antes de correr cualquier humo-*.cjs, la suite o capturas con Electron.
---

# Correr partidas reales (Electron) en Hojarasca

## Antes
0. **En la notebook (Ryzen 7 7730U): siempre en el monitor externo, nunca en la pantalla de la notebook.** En la PC de escritorio (Ryzen 5 4600G) no se usa el vigilante (oculta las ventanas si no hay segundo monitor); ver `CLAUDE.md`. En la notebook, comprobá que corre el vigilante (PID en `C:\Users\Andres\Documents\Hojarasca\vigilante-monitor.pid`, `Get-Process -Id <pid>`); si no, prendelo como dice el `CLAUDE.md`. El lanzador ya usa `al-monitor.cjs`: no lances Electron de otra forma.
1. `node armar.mjs` en la carpeta del proyecto (el humo carga `index.html`).
2. Que no haya otra partida corriendo en el mismo perfil: comparten el localStorage. Si hay otro agente con Electron, usá un perfil propio.

## Una partida
Usá la herramienta **PowerShell** (no bash: desde bash el `.ps1` falla en silencio por la política de ejecución y por las barras de las rutas):

```powershell
Set-Location <carpeta-del-proyecto>
powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\lanzar-electron.ps1 -Script pruebas\humo-<x>.cjs -Espera 900 -Perfil C:\Users\Andres\AppData\Local\Temp\hx\perfil-<x>
```

- Corre **oculta**, en el monitor externo (`al-monitor.cjs`), con prioridad baja. `-Visible` la muestra, sólo si el usuario lo pide.
- `-ExecutionPolicy Bypass` vale sólo para ese proceso: no cambia la configuración de Windows.
- Imprime lo que escribió la prueba; si dice `TIEMPO`, se cortó por `-Espera`.
- Si la salida viene vacía en segundos, no corrió: revisá la ruta del script y que estés en PowerShell.

## Varias
- **De a una**, nunca dos en el mismo perfil. Como mucho dos Electron a la vez en toda la PC (uno por agente).
- Todas: `powershell -NoProfile -ExecutionPolicy Bypass -File herramientas\suite.ps1 . <carpeta-de-salida> [humo-a,humo-b]`.
- **Nunca** `taskkill //F //IM electron.exe` (mata las de otros agentes). Si hay que cortar una, por PID.

## Al leer el resultado
- Una falla que no se repite al correrla sola dos veces es de tiempo: decirlo igual.
- Antes de decir que una falla «es vieja», compararla con la versión anterior armada en una carpeta temporal.
- Fallas viejas conocidas (4.6.0): `humo-trucos` («Escape devuelve a la pausa») y `humo-4-2-pico` («forjado: pico…» y «el libro anota "Pico forjado"»).
- Mirar las capturas que deja la prueba **a tamaño completo** antes de dar algo por bueno (nada flotando ni atravesado).
