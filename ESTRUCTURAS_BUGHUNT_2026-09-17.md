# Structure Bug Hunt — 2026-09-17

Pasada enfocada en causas raíz del sistema de estructuras y colisiones.

## Corregido

- `colisiones.resolver`: si el jugador quedaba exactamente sobre el eje de un segmento o el centro de un obstáculo, la distancia era cero y el resolvedor no sabía hacia dónde expulsarlo. Ahora usa una normal estable y evita quedar incrustado.
- `colisiones.plataformaBaja`: ahora distingue correctamente plataformas rectangulares, circulares, anulares y circulares con hueco angular. Antes una plataforma circular podía considerarse válida fuera de su radio por compartir celda espacial.
- El cambio se aplicó también al bundle de `index.html`, que es el archivo que ejecuta Electron.

## Pruebas añadidas

`pruebas/verificar-colisiones-core.mjs` cubre:

1. jugador exactamente sobre un muro;
2. plataforma circular dentro/fuera de radio;
3. anillo con hueco central;
4. plataforma circular con hueco angular.

Esta pasada evita agregar contenido visual nuevo: su objetivo es estabilizar la infraestructura física sobre la que dependen las estructuras.
