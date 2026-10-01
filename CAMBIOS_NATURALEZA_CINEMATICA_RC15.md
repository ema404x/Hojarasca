# Hojarasca RC15 — Naturaleza Cinemática

## Objetivo

Profundizar el realismo visual y de movimiento de la naturaleza patagónica sin convertir la mejora en una subida indiscriminada de polígonos o draw calls.

## Flora

- Las copas del LOD cercano reciben un lóbulo secundario fusionado en la misma geometría para romper siluetas esféricas y ganar profundidad sin sumar draw calls.
- Los árboles usan dos materiales LOD coordinados con crossfade dither por distancia real al jugador. El modelo detallado desaparece gradualmente mientras entra la versión simplificada, evitando el cambio brusco de malla.
- La transición LOD tiene una banda de 32 m y conserva el límite lejano de cada preset de calidad.
- El viento tiene anclaje de raíz, respuesta progresiva por altura y torsión secundaria en ramas/copas durante ráfagas. La base del tronco permanece estable.

## Fauna

- Nueva función `marchaMamifero()` con cuatro marchas: quieto, paso, trote y galope.
- Cada marcha define cadencia, amplitud de patas, rebote corporal y desfase posterior propio.
- Huemul/ciervos, zorro colorado, pudú y guanaco usan la misma gramática de locomoción, adaptada a sus velocidades.
- Se conserva la alineación corporal a pendiente de RC14.

## Rendimiento

- El volumen adicional de las copas se fusiona en la geometría existente.
- El crossfade usa descarte dither, sin transparencia alpha tradicional ni ordenamiento de superficies.
- El LOD bajo permanece simplificado y conserva el presupuesto `calidad.lejos`.

## QA

Nueva regresión `pruebas/verificar-naturaleza-cinematica-rc15.mjs` integrada a `npm run verify`. Verifica copas profundas, LOD dither, respuesta del viento por altura y marchas diferenciadas en los cuatro mamíferos patagónicos principales.
