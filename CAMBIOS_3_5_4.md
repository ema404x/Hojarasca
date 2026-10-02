# Hojarasca 3.5.4 — Estabilidad: ventana, memoria y caos

Tres equipos en paralelo (ramas `v354-ventana`, `v354-memoria`, `v354-caos`), cada uno con su
prueba de gate y su partida real nueva. Las ventanas de las pruebas ahora salen en el monitor
externo (`herramientas/al-monitor.cjs`, `suite.ps1` lo usa).

## Ventana y teclas (`ventana-main.cjs` nuevo)
- **El juego ya no puede irse de la ventana**: sólo se navega al `index.html` del juego (lo
  bloqueado queda en `hojarasca-crash.log`); soltar archivos sobre la ventana no hace nada.
- **Abrir el juego dos veces**: la segunda copia cargaba la misma partida unos 2,5 s; ahora sale
  en 0,3 s sin abrir ventana y trae la primera al frente.
- **El mouse ya no se pierde para toda la sesión** (Esc para pausar y volver varias veces pasaba
  para siempre a "arrastrar para mirar").
- **Perder el foco pausa** (Alt+Tab no pausaba jugando sin el mouse capturado).
- **Alt+Espacio** ya no abre el menú de la ventana de Windows (donde la C, agacharse, elegía
  "Cerrar"); el Espacio sigue saltando.
- **Cerrar sesión, suspender o bloquear la pantalla** pausan y guardan.
- El historial ya no crece con cada recuperación ("atrás" no reabre el juego viejo).
- El sonido de los animales ya no falla en cada cuadro si se pausa muy al principio.

## Memoria (`herramientas/soak-largo.cjs`, `comparar-snapshots.cjs`)
- **Fuga grande: cada recuperación del 3D retenía ~10 MB para siempre.** three r186 rearma sus
  administradores al volver el contexto, pero lo ya subido conservaba el oyente `dispose` del
  viejo (con ~10 recuperaciones: +50.000 búferes, +2.000 programas). Cada reinicio del driver
  de la placa sumaba memoria; en una Radeon integrada (memoria compartida) es candidata firme a
  las caídas viejas (no verificado en esa PC). `soltarContextoViejo()` en `main.js`.
- Banderita de las torres de vigía y oficio del poblador que se muda: soltaban mal sus geometrías.
- Sesiones de 40 min por modo, calidad alta: Relax heap 110→207 MB antes, 109→117 MB después;
  Desafío 128→305 antes, 128→140 después; memoria de la página en el Desafío 551→1163 antes,
  516→588 después. 24 recargas y más de 1000 días de juego sin crecimiento.

## Caos (`herramientas/caos-largo.cjs`, `caos-guardados.cjs`)
- ~327 min de juego al azar (~25.800 acciones, 183 guardar/cargar comparados, 114 pérdidas del
  3D, 68 cambios de modo) y 286 partidas rotas o viejas: ningún sistema falló solo.
- **Una partida con una obra "lejísimos" colgaba la carga para siempre** (y la reapertura
  volvía a caer): `guardado.js` descarta lo que queda fuera del valle y `colisiones.js` no
  indexa coordenadas imposibles.
- **El clic derecho usaba la ranura dos veces** (dos panes; linterna y caña que se prendían y
  apagaban en el mismo clic).
- **Modo foto**: F1 abría la pausa debajo; la rueda y los clics usaban lo que tenías en la mano.
- Boleadoras del Desafío sin avisos de three en cada carga.

## QA
- `npm run verify`: 133 de 133.
- Partidas reales (Electron): las 49 en verde, a la primera (46 de antes + `humo-3-5-4-ventana`,
  `humo-3-5-4-memoria`, `humo-3-5-4-caos`).

## Queda para después
- Probar con el teclado de verdad: Alt+Espacio, Alt solo, F10; soltar un archivo desde el
  Explorador; una suspensión y un cierre de sesión reales.
- Correr el soak largo en la PC de escritorio (Radeon integrada): `VENTANA=1` con
  `herramientas/soak-largo.cjs` (~90 min) y mandar `resumen.txt`, `log.txt`, `errores.txt`.
- Fugas de una sola vez por partida: el asedio al desarmarse, mover la estación meteorológica,
  la arena de la nave si cambia el sitio.
- Caos: una "pausa visible jugando" en un vehículo que no volvió a aparecer con la misma semilla.
