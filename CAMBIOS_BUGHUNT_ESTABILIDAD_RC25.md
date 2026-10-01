# Hojarasca RC25 — Bug-hunt de estabilidad

Pasada enfocada en errores de estado que podían sobrevivir a la suite histórica sin lanzar excepciones JavaScript.

## Correcciones
- Nuevo recorrido realmente limpio: reiniciar ya no copia la posición/yaw del jugador anterior a la partida nueva.
- Se bloquean autosave/beforeunload durante el reinicio para evitar que el estado viejo reaparezca por una carrera de cierre.
- Perder foco libera zoom, salto buffered y arrastre de cámara; evita estados pegados tras Alt+Tab.
- La pesca procesa KeyX/mouseup incluso si se abrió pausa/cuaderno/mapa antes de soltar el control.
- Al perder foco o esconder la ventana se corta explícitamente el recogido de la caña.
- Una captura preparada desde el menú se cancela si se abre otro modal antes de realizarla.

## QA
- Nueva regresión: `pruebas/verificar-estabilidad-rc25.mjs`.
- Se conserva toda la suite RC2→RC24 y el hotfix runtime del pudú.
- Bundle recompilado desde `src/` y smoke test WebGL real posterior.
