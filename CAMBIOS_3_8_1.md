# Hojarasca 3.8.1 — Revisión de bugs de La noche de los duendes

Revisión rápida pedida por el usuario (08-10, menos de 1 hora): tres equipos en paralelo (ramas `v381-b1`
duendes, `v381-b2` Coihue, `v381-b3` textos y Relax) y la rama de integración `v381-integra`. Sin cambios de diseño.

## Duendes, robo y cofre (`desafio.js`, `desafio-reglas.js`)
- Un ladrón que se iba sin morir (guardia del asedio, crías, dormidos de los puestos) se reciclaba con lo robado:
  ahora lo deja tirado antes de irse.
- Al caer o al terminar la corrida sin fin, lo robado quedaba colgado hasta el alba siguiente: ahora vuelve
  (al caer se pierde igual que lo demás).
- El margen de golpe de los duendes chicos dejaba pegar con boleadoras, flechas y rayo a través de paredes finas:
  `margenTapado()` mira que no haya obra en el medio.
- El rayo y el hachazo se salteaban empalizadas delgadas (muestreo de 50/45 cm → 25/20 cm). De antes de la 3.8.
- El cofre del alba brotaba dentro de paredes, árboles o medio enterrado en pendiente: margen 0,6, evita cuerpos
  y prefiere suelo parejo (si no hay lugar, brota como antes).
- El contenido de un cofre guardado se sanea (`sanearContenidoCaja`); `devolverTodo` sólo devuelve lo que un duende
  se puede llevar.

## El Coihue (`desafio-nave-mundo.js`, `desafio-eventos.js`)
- Al bajar por la escalera, las ondas y púas del corazón quedaban congeladas y te pinchaban al volver: se apagan.
- Sin claro, el Coihue de la noche final podía quedar sobre agua, vía u obras: prueba 24 ángulos y descarta esos.
- No se planta sobre un lugar del valle (estación, puestos, casas): deja 22 m en el claro y 14 m en el de reserva.

## Textos, inglés y Relax (`main.js`, `fiestas.js`, `fiestas-juego.js`, `idioma-en-r.js`, `plantilla.html`)
- El Relax decía «semillas doradas» en notas de obras y acopio (el cristal de Parada Alta y el Mirador): en el
  Relax vuelve a decir «cristales».
- Inglés que se había perdido: Red dorada, Cerco dorado, Abrojos dorados y textos con el nombre del modo.
- La leyenda corrida: una partida vieja que ya escuchó el calafate lo repetía y se salteaba la de los duendes.
  Ahora la leyenda de cada año queda fija (`fiestas.leyendaAnios`) y te da la que te falta; migración en el saneado.
- «The Night of the Goblins» se partía en dos renglones en el botón de la portada: `nowrap`.

## QA
- `npm run verify`: 169 de 169 (comprobaciones nuevas en verificar-3-8-duendes, -coihue y -textos; humo nueva
  `humo-3-8-1-textos`).
- Partidas reales: 13 del modo, del idioma y del Relax de a 3: 12 de 13; humo-3-5-1-desafio falló con la PC
  cargada («caer adentro te escupe al valle») y sola pasó dos veces seguidas.

## Visto y no arreglado (de antes o de diseño)
- En el Relax el ícono del cristal en la mochila y en la mano ahora es una semilla (los textos sí dicen cristales).
- La portada a 1024×640 aplasta la columna izquierda; en inglés el resumen de la pausa y el HUD del primer día
  salen en castellano; contenido del cofre, rumores de radio y avisos de munición sin inglés.
- El punto débil del Mandamás cuenta «por detrás» cerca de la mitad de las veces pegándole de frente y alto.
- Un ladrón trabado rompiendo una pared lleva lo robado hasta el alba; el tope de 4 robos se reinicia al recargar.
- El cofre se abre desde arriba de una torre (sólo mira distancia horizontal); un cofre sin abrir se pierde al alba.
- Partidas 3.7.x con la nave plantada en el bosque: la E del pie puede quedar tapada por un coihue del bosque.
- Si el Coihue cambia de sitio en la misma sesión, la subida se rearma sin liberar la anterior (casi nunca pasa).
