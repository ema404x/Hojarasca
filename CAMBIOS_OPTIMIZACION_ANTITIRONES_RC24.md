# Hojarasca RC24 · Optimización anti-tirones

Última pasada de optimización centrada en **frametime y frame pacing**, no en elevar un promedio de FPS a costa de calidad.

## Frame pacing corregido

El limitador anterior usaba un umbral fijo sobre `requestAnimationFrame`. En refrescos como 144 Hz o 165 Hz, un límite de 60 FPS podía terminar eligiendo siempre 3 VSyncs y caer a ~48/55 FPS efectivos. RC24 separa el reloj de cadencia del `dt` de simulación y conserva fechas objetivo acumuladas, por lo que 60 FPS se mantiene cerca de 60 sobre 120/144/165/240 Hz.

## Planificador anti-spike

Vegetación, ambiente, visibilidad, refugio vivo y refresco de shadow map ya no pueden concentrar todos sus trabajos pesados en un mismo cuadro. El planificador permite una tarea pesada por frame y difiere trabajo secundario después de un frame claramente lento. Los acumuladores no se descartan: la tarea pendiente conserva su deuda y se ejecuta en el siguiente cuadro disponible.

## Autosave fuera del frame

El autosave periódico dejó de llamar a `localStorage` desde el camino principal del frame. Se programa mediante `requestIdleCallback`, exige al menos una ventana ociosa razonable cuando Chromium la ofrece y conserva un timeout de seguridad. Cerrar la ventana mantiene el guardado síncrono histórico.

## Guardado transaccional más barato

`guardado.js` conserva la última copia principal ya validada para usarla como backup en la escritura siguiente. Se elimina una relectura/parse redundante del save principal sin debilitar recuperación desde backup ni compatibilidad RC2.

## QA

`verificar-optimizacion-antitirones-rc24.mjs` comprueba:

- frame pacing de 60 FPS sobre 120/144/165/240 Hz;
- modo libre = un render por `requestAnimationFrame`;
- una sola tarea pesada por frame;
- bloqueo de trabajo pesado después de un frame lento;
- integración del planificador en vegetación/ambiente/visibilidad/sombras;
- autosave en idle y flush de seguridad;
- cache transaccional del save sin reparse redundante.
