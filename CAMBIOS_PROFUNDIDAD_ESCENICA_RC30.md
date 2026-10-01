# CAMBIOS PROFUNDIDAD ESCÉNICA RC30

## Objetivo
Dar más escala y lectura cinematográfica al valle sin aumentar la geometría ni añadir pases caros de render.

## Cambios
- Nuevo módulo `src/profundidad.js` con factores deterministas de luz rasante y perspectiva aérea.
- Cordillera con perspectiva aérea dependiente de distancia, altura relativa y humedad: los valles acumulan más aire que las crestas.
- Crestas con iluminación rasante sutil al amanecer/atardecer.
- Bosque medio con pérdida de contraste muy leve por distancia, separándolo del primer plano.
- Follaje con recorte cálido de contraluz sólo cuando el sol está bajo.
- Terreno medio con una mezcla atmosférica suave hacia el color del cielo bajo.
- Rayos de sol ligeramente reforzados en luz rasante sin cambiar el número de pases de postproceso.

## Rendimiento
- 0 draw calls nuevos.
- 0 geometría nueva.
- Sin reflection probes, niebla volumétrica ni buffers de profundidad adicionales.
- El coste nuevo está limitado a operaciones escalares simples en shaders ya existentes.
