# Hojarasca — Ecosistema Dinámico RC17

## Objetivo

Hacer que la naturaleza patagónica deje de reaccionar únicamente al jugador y empiece a mostrar relaciones locales entre especies y ambiente, sin convertir la simulación en un sistema costoso fuera de cámara.

## Cambios principales

- `src/ecosistema.js`: registro de fauna con doble buffer de un frame, consultas de proximidad y rutas de escape con cobertura.
- Zorro colorado ↔ liebre: persecución oportunista corta; la liebre reacciona al predador y mantiene zigzag de escape.
- Huemul: la huida puede buscar cobertura boscosa segura, evitando agua y penalizando pendientes fuertes.
- Aves de suelo: zorzales reaccionan también a zorros; bandurrias usan la firma acústica compartida del jugador.
- Nieve: huemules y zorros dejan rastros cercanos reutilizando la textura de huellas ya existente.
- Estepa: el sistema de partículas incorpora briznas/semillas secas activadas por bioma y viento.
- El trabajo sigue acotado por radio y por las frecuencias de actualización existentes; no se agregan búsquedas globales por frame.

## QA

Nueva regresión `pruebas/verificar-ecosistema-dinamico-rc17.mjs` para red inter-módulo, memoria de un frame, intensidad predador-presa, rutas de escape con cobertura, integración zorro/liebre, aves, rastros y microatmósfera de estepa.
