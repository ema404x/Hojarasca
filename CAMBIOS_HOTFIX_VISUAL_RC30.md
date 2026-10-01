# HOTFIX VISUAL RC30

Correcciones realizadas a partir de una captura real de gameplay:

- Niebla global reducida: la densidad anterior lavaba casi todo el terreno medio a 250–350 m.
- Perspectiva aérea secundaria de suelo y vegetación suavizada para evitar doble niebla.
- Cordillera con más resolución angular (192 lados / 30 anillos) para reducir facetas visibles.
- Perspectiva atmosférica propia de la cordillera limitada a un máximo menor para conservar volumen y contraste.
- Culling de estructuras estáticas corregido: ya no se ocultan piezas individuales por distancia. Three.js mantiene frustum culling, mientras el sistema propio conserva sólo LOD de sombras. Esto elimina postes, marcos, carteles y vigas flotantes en el horizonte.

Objetivo: recuperar lectura del valle, silueta de montaña y coherencia arquitectónica sin reabrir stutter.
