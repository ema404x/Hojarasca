# Hojarasca 3.8.3 — Pase de bugs completo

Pedido por el usuario antes de preparar Steam (09-10). Cinco equipos recorrieron todo el juego en paralelo (ramas
`v383-p1` Relax base, `p2` aldea y gente, `p3` vehículos/cocina/mundo, `p4` La noche de los duendes, `p5` guardado,
menús y rendimiento) y la rama de integración `v383-integra`. Unos 80 arreglos; sin cambios de diseño (las decisiones
que dejaron los equipos las tomó el usuario y están en `DECISIONES_3_8_4.md`, para hacer después).

## Lo más grave
- **Historia:** el capítulo 8 no se podía terminar si ya habías oído los 4 cuentos; un temporal al azar tildaba el
  final y la noche del temporal no se jugaba.
- **La noche de los duendes:** las semillas doradas que suelta un duende nunca se juntaban (desde la 3.0: la línea
  estaba dentro de un comentario); con «Hora de tu reloj» salían dos oleadas por noche; las hachuelas y jabalinas
  tiradas se perdían; guardar a mitad de noche salteaba o revivía al Mandamás y perdía la noche especial; cada
  campaña sumaba dos victorias; ganada sin cueva, las noches no terminaban.
- **Portada y menús:** en 1366×768 no se veía «Entrar al bosque» (y en 1920×1080 quedaban afuera Calidad y Salir):
  ahora la portada, la pausa y los velos se desplazan; con el mando solo no se podía salir de la pausa ni del mapa;
  cerrar en la portada de una partida sin jugar la daba por empezada.
- **Lo que se perdía:** al desarmar obras (tendal, vivero, nidal, cantero, y lo que estaba al fuego en la parrilla,
  el horno o la cocina a leña); la ramita 13; un flete entregado se cobraba otra vez; cargar con el caballo en la
  jaula del tren te dejaba en el medio del mapa.
- **Aldea:** se le hablaba a gente invisible (visitas que se habían ido); amistad infinita en el baile y la minga;
  la ex seguía viviendo con vos; citas e invitaciones colgadas al recargar o cerrar la charla.

## Además
- La tecla E y el aviso alineados en la carpa, la casa, la cita, a caballo y con paneles abiertos.
- Tren: la plataforma de atrás, horas «13:60», el taller «a la tarde» a las 11; tirolesa y velero que te dejaban en
  cualquier lado; bajarte del zaino contra una pared; el modo foto que adelantaba asados y mejoras.
- Duendes: abrojos que devolvían dos veces, catapulta rota que se cargaba, forja perdida en «otra vuelta», el fogón
  del asedio, clic que atacaba charlando, emplasto con el mando, la zanja y el fuego del pasto, la rampa de troncos.
- Radeon integradas de las APU viejas arrancan en calidad baja; F11 reservada; avisos repetidos de recuperación.
- Decenas de textos (plurales, géneros, «Faltan una hora», «1 lechones», el chisme de a tres…).

## QA
- `npm run verify`: 174 de 174 (pruebas nuevas verificar-3-8-3-relax, -aldea, -mundo, -combate, -base; humos nuevos
  humo-3-8-3-combate, humo-3-8-3-base, humo-3-8-3-guardado-hondo; ~140 partidas rotas al azar sin romper el juego).
- Partidas reales: suite entera de a 4: 66 de 72; repetidas solas pasan humo-1-11-desafio, humo-3-0-asedio y
  humo-relax-2; humo-3-7-3-taller, humo-3-6-1-vecinos, humo-3-1-historia y humo-relax-2 tenían carreras de tiempo de
  la propia prueba (o miraban un comportamiento que se arregló a propósito): pruebas al día, 4 de 4 OK.
- Intermitente de siempre: `verificar-3-7-2-granja` (tiempo y el ternero al lado de la vaca).

## Queda para después
- Todo lo de `DECISIONES_3_8_4.md` (34 cosas decididas por el usuario, el alero del arriero, las voces, el silbato,
  la calidad que no cambia sola) y los datos de Steam.
- Inglés: ~400 textos de la 3.1 y lo de la 3.7 (al final, antes de Steam).
- En el juego, una nota importante (Martín avisa) puede quedar tapada si se juntan varios avisos al cambiar el día.
