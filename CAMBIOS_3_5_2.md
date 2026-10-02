# Hojarasca 3.5.2 — Pulido del paisaje, los animales y el bosque

Lo que quedó anotado al cerrar la 3.5.0, en tres equipos en paralelo (ramas `v352-paisaje`,
`v352-animales`, `v352-vegetacion`).

## Paisaje
- **Niebla por altura**: más espesa en los bajos y sobre el lago, se afina hacia arriba; al alba
  y con lluvia se arma en bancos que se corren despacio. Desde el mirador al alba las lomas
  asoman sobre la niebla del lago (antes era una franja plana). Llega a todo (suelo, árboles,
  árboles lejanos, agua) por la misma cuenta (`cuentaNiebla` en `conTechoNiebla`).
- **Río en pendiente**: donde baja rápido toma un turquesa lechoso, refleja menos y lleva vetas
  que siguen la corriente y espuma (`aCauce`). La cascada se lee como agua que cae.
- **Nieve del primer cordón** en franjas por cumbres y canaletas (`aCresta`), sin lunares.
- **Cerros del borde al mediodía** menos lavados: los rayos de sol ya no nacen del cielo abierto
  del borde de arriba del cuadro.
- **Borde estepa-pasto** quebrado en lenguas, con coirón verdoso de transición.
- De noche lo que brilla conserva su color (antes el postproceso lo pasaba a gris).

## Animales y gente
- Rehechos con formas suaves y su anatomía real: **jabalí** (y la cría bermeja), **coipo**
  (incisivos naranjas, cola con anillos), **cisne de cuello negro** (carúncula roja, pichones),
  **pato de los torrentes**, **martín pescador**, **bandurria**, **cauquén**, **zorzal**.
- Guanaco con el cuello que nace del pecho; liebre con cara nueva (y sin el agujero que tenía en
  el anca); oveja con rodilla, garrón y pezuña partida; pudú más bajo.
- Hombro sin costura de cerca; bufanda con puntas y fleco (ya no parece corbata); **el mate llega
  a la boca** con el codo doblado.
- Mano en primera persona con nudillos, pulgar y puño de manga (2 dibujos en vez de 3); hacha
  con cabeza forjada; invasores sin las bolas de articulación de maniquí.
- Ninguna figura suma dibujos; sin materiales nuevos.

## Bosque
- **Ciprés de cerca** sin el velo verde ni caras planas: la falda se recoge al arrimarse y se ve
  el fuste con sus ramas. **Nevado**, una conífera con nieve y verde (antes una vela blanca).
- **Nieve al sol** sin brillo de más (sin trasluz ni borde de sol sobre la nieve).
- **Árboles lejanos** con la misma bruma que el suelo (ya no se despegan pálidos), también los
  pre-dibujados.
- Sin el **punteado** en las hojas cercanas ni la **masa oscura lisa** del centro de las copas.
- **Amancay** en matas sueltas, no en franja, y nada de flores en los canteros (`marcarPisos`).
- Nieve pareja entre coihues cercanos y lejanos.
- **El coirón y el notro no se veían nunca** (les faltaba un atributo y el material de las matas
  los recortaba enteros). Ahora se ven; el coirón queda en invierno, pajizo, con nieve en las
  puntas.
- **Más fluidez en el bosque**: cada actualización de la vegetación subía a la placa el búfer
  entero de cada especie (250–470 KB); ahora sólo lo usado (35–80 KB). Cuadro medio corriendo en
  alta de ~17–18 a ~14–15 ms; peor 5% de 24–26 a 17–19 ms (notebook Ryzen 7 7730U).

## QA
- `npm run verify`: 129 de 129. Partidas reales (Electron): las 46 en verde, a la primera.

## Queda para después
- Franja de estepa vista desde el lago (dato de la máscara del terreno); río en cuestas suaves.
- Nodriza del Desafío: núcleos salmón en vez de rojos, casco negro liso; alas del volador.
- Oveja con patas muy negras, cuerpo de la liebre facetado, jabalí liso de cerca, brazo de Ramón
  que sale por delante del poncho al tomar mate, bufanda siempre del mismo lado, zorzal que no
  aletea.
- La falda del ciprés se nota cerrarse si se pasa rápido al lado.
- Medir en la Radeon integrada (Ryzen 5 4600G).
