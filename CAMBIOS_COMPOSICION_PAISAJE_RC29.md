# CAMBIOS_COMPOSICION_PAISAJE_RC29

## Objetivo
Hacer que el valle patagónico se lea como un paisaje compuesto por procesos naturales y no como una distribución uniforme de assets.

## Cambios
- Nuevo módulo `src/paisaje.js` con reglas puras y testeables de composición macro.
- Rodales y claros amplios mediante ruido de baja frecuencia, preservando los biomas de `patagonia.js`.
- Corredor escénico irregular desde el Mirador del Pehuén hacia el lago: reduce densidad de árboles sin abrir una calle artificial.
- Bordes de bosque/ecotono reforzados con notro/calafate en manchas, no de forma uniforme.
- Agrupaciones procedurales de roca en laderas, exposición y ecotono.
- Madera muerta agrupada principalmente en bosque húmedo/maduro.
- Rocas/troncos decorativos continúan registrados como vegetación despejable para no atravesar construcciones del jugador.

## Rendimiento
- La composición se calcula una sola vez durante la generación del mundo.
- Los nuevos elementos usan las mismas mallas instanciadas y materiales existentes.
- No se suman luces, reflection probes, físicas nuevas ni lógica por frame.
- La modulación de rodales reorganiza densidad; no pretende aumentar la carga global del bosque.
