# Hojarasca — Auditoría estructural v4

Esta pasada continúa la estabilización de estructuras sin alterar el diseño general del juego.

## Correcciones de núcleo

- Las colisiones verticales consideran el cuerpo completo del jugador, no solo la altura de sus pies.
- La altura física cambia al agacharse, permitiendo pasar por debajo solo cuando existe espacio real.
- Las puertas batientes mantienen una colisión que rota con la hoja durante toda la animación.
- Los portones corredizos desplazan su colisión junto con la hoja: el vano queda libre y la hoja estacionada sigue siendo sólida.
- Los muebles bajos marcados como pisables ya no quedan rodeados por un borde invisible que impide subir.
- Las plataformas pisables pueden declarar una altura de paso específica sin aumentar globalmente la capacidad de trepar.

## Regresión

- `pruebas/verificar-colisiones-core.mjs`
- `pruebas/verificar-arquitectura-v2.mjs`
- `pruebas/verificar-estructuras-v3.mjs`
- `pruebas/verificar-estructuras-v4.mjs`

El `index.html` incluido contiene el bundle inline v4 de estas fuentes. En esta variante inline, Three.js se carga desde unpkg para poder ejecutar el juego sin el proceso local de esbuild.
