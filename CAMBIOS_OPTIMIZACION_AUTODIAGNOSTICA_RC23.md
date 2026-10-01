# RC23 · Optimización autodiagnóstica

RC23 continúa la línea RC20–RC22 sin bajar densidad ni calidad base.

## Cambios principales

- Perfilador de subsistemas activado sólo con F3/debug: ambiente, clima, fauna, NPC/perro y render.
- Presupuesto continuo de partículas y aves mediante shader (`uPresupuesto`): se recorta primero trabajo secundario sin recrear geometrías.
- LOD de pose para NPCs lejanos: rutina, posición y orientación siguen continuas; huesos/gestos se recalculan con menor frecuencia bajo distancia/presión.
- Búsqueda de objetos reutiliza arrays scratch y un vector frontal persistente; elimina basura temporal de las consultas frecuentes.
- Construcciones dinámicas usan índice espacial local para búsquedas cercanas de obra, función, interior y cubierta; el índice se reconstruye sólo al fundar/mover/desmontar.
- F3 muestra los subsistemas más caros por EMA para localizar picos sin profiler externo.

## Principio

No se reduce el contenido. RC23 intenta primero quitar trabajo invisible y hacer observable el coste restante.
