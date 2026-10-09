# Hojarasca 3.8.2 — Cuatro arreglos de La noche de los duendes

Lo que quedó anotado en `CAMBIOS_3_8_1.md` («Visto y no arreglado»), aprobado por el usuario (09-10).

- **El punto débil del Mandamás:** `impactoEn` comparaba el punto de impacto contra el centro del jefe; de frente
  y alto contaba como espalda cerca de la mitad de las veces (doble daño). Ahora `golpePorDetras` (`desafio-reglas.js`)
  compara la dirección del golpe con el rumbo del jefe (cono de ~70°). El mismo cálculo decide el facón por la
  espalda contra todos los duendes: ahora sólo cuenta de verdad desde atrás.
- **El cofre del alba desde una torre:** se abría mirando sólo la distancia horizontal; ahora hay que estar a su
  altura (margen de 2 m, el mismo de las semillas).
- **El cofre sin abrir al alba siguiente:** su contenido se suma al cofre nuevo (`sumarContenidoCaja`, tope 99 por
  cosa); sigue habiendo uno solo y brota en su lugar nuevo.
- **El dibujo del cristal según el modo:** la semilla dorada sólo en La noche de los duendes; con el Relax vuelve el
  rombo celeste de antes (mochila y mano). Nota: en el Relax el cristal no tiene casilla en la mochila (ya era así en
  la 3.7.5), así que lo anotado en la 3.8.1 no se llegaba a ver jugando; queda resuelto igual.

## QA
- `npm run verify`: 169 de 169. Comprobaciones nuevas en verificar-3-8-duendes (500 golpes de frente y alto que
  nunca cuentan como espalda, suma y tope del cofre, guardado) y verificar-3-8-textos.
- Partidas reales: humo-desafio, humo-desafio-premium, humo-invasores, humo-relax-2 y humo-3-8-1-textos en verde.

## Queda para después
- La casilla del cristal en el modo de combate dice «Semillas doradas» con texto de la pistola de luz.
