# Hojarasca RC24.1 — Hotfix de arranque

## Corrección crítica

Se corrige un `ReferenceError: m is not defined` en `src/fauna.js`.
El actualizador general de fauna llamaba a `actualizarPudu()` con una variable inexistente (`m`) en lugar del contexto `estadoMundo`.
Como la llamada ocurre en el bucle de fauna, el error se repetía cada actualización y podía bloquear la experiencia inmediatamente al iniciar.

## Prevención

- Se agrega `verificar-hotfix-runtime-rc24-1.mjs` al pipeline obligatorio.
- Se mantiene toda la optimización anti-tirones de RC24.
- Además del pipeline Node, la build final se valida ejecutando el bundle real en Chromium/WebGL mediante CDP y comprobando ausencia de excepciones de JavaScript durante el arranque.
