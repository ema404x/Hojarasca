# Hojarasca 3.8.5 — Risas de duende y piano de misterio

El usuario pasó tres audios de referencia (dos risas de duende y un piano de misterio). Tienen licencia gratuita no
comercial, así que no entraron al juego: se usaron sólo para medir su carácter, y los sonidos nuevos se sintetizan por
código, como todo el sonido de Hojarasca. Ningún archivo de audio está en el repo (la prueba lo verifica).

## La noche de los duendes
- **Risa de duende nueva** (`src/risa-duende.js`): síntesis de formantes muestra por muestra, con glotis y temblor,
  aire, cinco formantes, nariz, la «j» de soplo y sílabas en Λ que corren y se apagan; a veces un «jm-jm» con la
  boca cerrada antes de largar y un gorjeo final con vibrato. Tres gargantas con 6 variantes cada una:
  - traviesos: agudos y rápidos;
  - viejos oscuros de noche: graves y roncos;
  - Mandamás y Rey: muy graves y lentos.

  Suena en la alerta, el llamado, la travesura, los que asoman, el jinete, el que sale de abajo de la tierra y la
  entrada del Mandamás. Nunca repite la misma variante seguida, y como mucho suenan 3 a la vez. Pasa por la misma
  lejanía y volumen que antes.
- **Piano de misterio** (`src/piano-misterio.js`): piano sintetizado con parciales inarmónicos, martillo, mecánica,
  cuerdas dobles, apagadores, pedal, caja y sala. Tres frases propias en re menor («ronda», «lamento» y
  «escalera»), con pulso de corcheas y crescendo. Suena una vez por noche cuando los duendes empiezan a salir. Mientras
  suena, la música baja, y sigue la perilla y el interruptor de la música.
- Todo se sintetiza de antemano en pedazos chicos, sin tirones. En el Relax no suena nada de esto.

## Herramientas
- `herramientas/analizar-audio.cjs` y `decodificar-audio.cjs` sirven para medir audios de referencia.
- `render-recetas-385.mjs` renderiza las recetas, y `render-sonidos.cjs` tiene las muestras nuevas.

## Pruebas
- Gate con `verificar-3-8-5-sonido` (113 comprobaciones), que además verifica que no haya audio en el repo.
- Partidas reales: `humo-desafio`, `humo-3-0-asedio`, `humo-3-8-3-base` y `humo-relax-2`, todas en verde.

## Queda para después
- El gorjeo de la risa nueva tiene algo menos de vibrato en volumen que la referencia.
- El piano es algo más brillante que la referencia.
- Si se apaga la música, el piano tampoco suena. Es decisión del equipo; si el usuario lo quiere como efecto, es
  una línea.
