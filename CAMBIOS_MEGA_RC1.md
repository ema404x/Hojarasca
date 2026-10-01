# Hojarasca Mega RC1

## Objetivo
Convertir la rama estructural V8 en una base de producto consistente y verificable, sin perder los arreglos de geometría/física ya conseguidos.

## Producto
- Menú de pausa ampliado con guardado manual, controles, créditos/versión y salida del juego.
- Pantalla de controles completa dentro del juego.
- Pantalla de créditos/estado de release.
- Captura de errores del renderer con pantalla visible en lugar de fallar silenciosamente.
- Registro de cierres/crashes del renderer en la carpeta de datos de Electron.
- Confirmación antes de borrar una partida con “Nuevo recorrido”.
- Backup automático del guardado anterior y recuperación si el principal queda ilegible.
- Leyenda del mapa corregida: el mapa ya no promete una mecánica de descubrimiento eliminada.

## Build
- El auto-build ahora vigila **todo `src/`**, no solo `main.js` y `estructuras.js`.
- Si una fuente es más nueva y recompilar falla, Electron no abre silenciosamente un `index.html` viejo.
- `armar.mjs` escribe el bundle de forma atómica para no dejar un HTML truncado.
- El bundle lleva sello de versión.
- Configuración de electron-builder endurecida para una Release Candidate (asar + compresión máxima + nombre de artefacto versionado).

## QA
- Conserva las regresiones de colisiones/estructuras V2–V8.
- Los verificadores geométrico y físico aportados por Claude fueron convertidos a scripts portables del proyecto.
- Nuevo `verificar-release.mjs` busca rutas absolutas, bundles truncados, sintaxis rota, marcas de debug y configuración de release incompleta.

## Cierre de producto añadido
- FOV configurable (60–90) conectado a la cámara real.
- Mirada vertical invertible funcionando.
- Movimiento de cámara reducido para caminar, tren y kayak.
- Backup automático de la partida y recuperación si el save principal falla.
- Guardado manual, controles, créditos/versión y salida limpia desde la UI.
- Confirmación antes de borrar una partida con “Nuevo recorrido”.
- Una sola instancia de la aplicación y log de fallos del renderer.
- El build de desarrollo se invalida ante cualquier cambio de `src/`, evitando abrir un `index.html` viejo.
- QA portable de geometría/flotantes y de discrepancias entre piso visual y físico.

## Features cerradas
- Huellas en nieve: el sistema existente pero desconectado ahora está integrado al shader del terreno, marca los pasos y la nevada los cubre gradualmente.
