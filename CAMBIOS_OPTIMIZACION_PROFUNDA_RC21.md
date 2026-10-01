# Hojarasca — Optimización Profunda RC21

RC21 continúa la línea de optimización iniciada en RC20. No reduce densidad, fauna, vegetación ni calidad de los sistemas RC12/RC19; cambia cuánto trabajo hace el motor para obtener el mismo resultado perceptivo.

## Índice espacial 2D reutilizable

`src/rendimiento.js` incorpora `crearIndiceEspacial2D()`:

- divide el mundo en celdas;
- permite insertar/reconstruir registros sin crear índices nuevos;
- consulta sólo celdas solapadas por un radio;
- acepta un array de salida reutilizable para evitar basura temporal.

El ecosistema utiliza este índice para consultas predador–presa y alarmas locales. El perro recibe un índice reconstruido únicamente cuando cambia la lista de fauna, por lo que su scan de 8 Hz ya no recorre todos los sujetos del mundo.

## Doble buffer ecológico sin Map por frame

`ecosistema.js` conservaba frame actual/anterior creando un `new Map()` cada ciclo ecológico. RC21 mantiene dos mapas y dos índices persistentes, los intercambia y limpia. La semántica de RC17–RC19 se conserva, pero desaparece una asignación periódica del camino caliente.

## LOD de lógica / IA

`pasoIAPorDistancia()` y `consumirPresupuestoIA()` separan animación/movimiento de las decisiones caras:

- cerca o durante alerta/huida: percepción inmediata;
- media distancia: decisiones a frecuencia reducida;
- larga distancia: hasta ~4 Hz;
- el `dt` se acumula para no perder tiempo de simulación.

Integrado inicialmente en huemul/ciervos, zorro, pudú, liebre y guanaco. El actor sigue moviéndose y animándose normalmente; sólo se espacian percepción, búsqueda de presa y decisiones equivalentes.

## Telemetría F3

El panel de rendimiento, que continúa completamente inactivo al ocultarse, suma:

- conteo de cuadros por encima de 33 ms;
- heap JS usado cuando `performance.memory` está disponible en Chromium;
- delta de heap entre ventanas de muestreo.

Esto permite distinguir FPS promedio aceptable de stutter/crecimiento de memoria durante sesiones largas.

## Compatibilidad

- construcción/hábitat RC12: preservado;
- naturaleza RC19: preservada;
- contratos RC2–RC20: preservados;
- no se cambia la densidad de entidades ni la distancia visual por preset.

## Verificación

Nueva prueba: `pruebas/verificar-optimizacion-profunda-rc21.mjs`.

Comprueba índice espacial, reconstrucción/limpieza, doble buffer ecológico, consulta local del perro, LOD de IA en mamíferos principales y telemetría F3.
