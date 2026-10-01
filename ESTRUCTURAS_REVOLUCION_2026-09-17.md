# Hojarasca — Revolución estructural

## Objetivo
Subir la calidad de las construcciones sin reescribir el juego ni alterar mecánicas ajenas: una estructura debe explicar visualmente cómo se sostiene y su física debe coincidir con lo que el jugador ve.

## Sistema arquitectónico 2.0
- Cimientos/pilotes adaptados a la altura real del terreno, con apoyos de piedra.
- Cubiertas a dos aguas segmentadas, con pares, fascia, cumbrera, canaletas/bajadas y variante de chapa o madera.
- Cerchas completas reutilizables para edificios de gran luz.
- Zócalos de piedra y entablado vertical con huecos rectangulares reales.
- Detalles agrupados dentro de `Constructor` para mantener bajo el costo de draw calls.

## Correcciones de causa raíz
- Cabañas: eliminado un segundo techo superpuesto que usaba una pendiente distinta.
- Casa de Té: elementos estructurales que antes se agregaban después de `c.geometria()` ahora sí forman parte de la malla; el ventanal ya no funciona físicamente como una puerta invisible.
- Almacén: puertas y vidrieras ya no producen huecos de pared de piso a techo; marco y colisión comparten dimensiones coherentes.
- Galpón: la rampa deja de ser sólo visual y ahora es caminable; paredes y objetos interiores tienen colisiones acotadas en altura; se añadieron cerchas de luz completa.
- Faro: piso y escalones que podían ser invisibles pero caminables ahora nacen con geometría y física antes de materializar la malla. Se eliminó la pared de colisión infinita redundante y el zócalo tiene altura física real.
- Puentes: refuerzo en X, vigas inferiores y estribos; las barandas siguen frenando sólo en su altura real.
- Torre de guardaparques: patas ajustadas al relieve y arriostramiento en X en sus cuatro caras.
- Muelle: largueros, vigas transversales y escalera marinera.

## Robustez del flujo de desarrollo
`npm start` reconstruye `index.html` antes de abrir Electron. Además, `main.cjs` detecta en desarrollo si `src/` es más nuevo que el bundle y trata de regenerarlo. Esto evita probar por accidente una versión vieja del juego después de modificar fuentes.

## Verificación realizada
- `node --check` sobre los 43 módulos de `src/` y sobre `main.cjs`/`preload.cjs`.
- `pruebas/verificar-colisiones-core.mjs`.
- `pruebas/verificar-arquitectura-v2.mjs`, con regresiones para cubiertas, rampa del galpón, Casa de Té y Faro.

## Limitación de esta entrega
En el entorno donde se realizó esta pasada no estaban disponibles localmente Electron/Three/esbuild y no hubo acceso de red para instalarlos. Por eso no se ejecutó una prueba gráfica de Electron ni se regeneró aquí el bundle precompilado. Al arrancar con `npm start`, el proyecto recompila automáticamente desde `src/` y usa estas mejoras.
