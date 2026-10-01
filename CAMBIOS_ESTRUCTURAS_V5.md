# Hojarasca — Auditoría estructural v5

Esta pasada se concentra en fallos físicos difíciles de detectar caminando: techos, cantos de plataformas, puertas móviles, interiores y accesos verticales.

## Correcciones de núcleo
- Las plataformas ya no capturan al jugador desde arriba durante un salto.
- Los pisos tienen intradós físico: no se puede saltar atravesando un entrepiso.
- El jugador no puede ponerse de pie si no cabe bajo una plataforma.
- Los chequeos de techo consideran el radio corporal, no sólo el punto central.
- Los cantos laterales de pisos/andenes elevados son sólidos cuando no se pueden subir ni pasar por debajo.
- Los huecos de escaleras circulares/anulares siguen libres también para la colisión lateral.
- Las puertas y portones usan colisiones dinámicas desacopladas de la grilla estática; pueden cruzar celdas sin dejar fantasmas ni perder colisión.

## Edificios
- Faro: salida superior real hacia la galería mediante vano + peldaños; mesa del farero con volumen físico.
- Molino: eje y muelas grandes dejan de ser atravesables.
- Cabañas: catre, mesita, hogar y chimenea grande participan en la física.
- Galpón: la plataforma de esquila es realmente caminable.

## Validación
- `verificar-colisiones-core.mjs` OK
- `verificar-arquitectura-v2.mjs` OK
- `verificar-estructuras-v3.mjs` OK
- `verificar-estructuras-v4.mjs` OK
- `verificar-estructuras-v5.mjs` OK
- Sintaxis validada en los 43 módulos de `src/`, `main.cjs`, `preload.cjs` y `armar.mjs`.
- `index.html` actualizado con el bundle inline v5.

Los tests antiguos basados en Electron no se ejecutaron en este entorno porque `electron` no está instalado.
