# Hojarasca RC22 — Optimización Adaptativa

## Objetivo
Reducir stutter y coste redundante en escenas pesadas sin degradar la calidad base ni alterar gameplay. RC22 conserva íntegros construcción/hábitat RC12 y naturaleza RC19; continúa la línea de rendimiento iniciada en RC20/RC21.

## Presupuesto adaptativo por frametime
`src/rendimiento.js` incorpora `crearPresupuestoAdaptativo()`.

- Usa una media exponencial del frametime real, separada del `dt` capado de simulación.
- Sube de nivel sólo ante presión sostenida; no reacciona a un único frame malo.
- Recupera nivel únicamente tras margen sostenido, evitando oscilaciones.
- El nivel afecta primero trabajo secundario: cadencias de vegetación, ambiente, visibilidad, consultas de interacción y regeneración de sombras.
- Controles, movimiento, animación principal y render no se saltan.

## Presupuesto GPU de microdetalle
Bajo presión sostenida:

- el anillo lejano de pasto se acorta progresivamente, manteniendo intacta la calidad cercana;
- suelo/hojarasca/contacto vegetal se cullan algo antes;
- la densidad, especies, modelos y materiales no cambian.

Al recuperar margen, los rangos vuelven automáticamente a 100%.

## Visibilidad estática indexada
Estructuras grandes y chunks de vía usan índices espaciales 2D persistentes.

Antes, cada actualización de visibilidad recorría todas las estructuras/chunks. RC22 consulta sólo celdas próximas y desactiva los elementos que salen de la vecindad activa. Las comparaciones de distancia usan distancia al cuadrado cuando es posible.

## Interacciones vegetales locales
La vegetación construye una sola vez índices estáticos para:

- árboles;
- matas/sotobosque.

`objetivoHacha()` y `despejar()` consultan sólo vecinos locales en vez de recorrer el bosque completo. Los objetos retirados pueden permanecer en el índice porque el flag `sacado` conserva la semántica existente.

## Sombras adaptativas
La regeneración del shadow map mantiene hasta 6 Hz con margen. Si el frametime se degrada de forma sostenida, baja progresivamente hasta un mínimo de 3 Hz. La resolución y configuración del shadow map no se alteran.

## Telemetría F3
F3 añade:

- nivel de presupuesto adaptativo `L0–L3`;
- frametime EMA utilizado por el controlador.

Esto permite verificar en hardware real cuándo el juego está protegiendo los 1% lows.

## QA
Nueva prueba: `pruebas/verificar-optimizacion-adaptativa-rc22.mjs`.

Valida presupuesto con histéresis, recuperación, índices estáticos, integración en visibilidad/interacciones, microdetalle GPU y sombras escalonadas.
