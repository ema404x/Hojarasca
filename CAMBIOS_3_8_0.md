# Hojarasca 3.8.0 — La noche de los duendes

Primera versión del plan de la 3.8 (`PLAN_3_8.md`). El modo de combate deja los extraterrestres: ahora son
**duendes del bosque** de la leyenda de la aldea. El Relax no cambia (los duendes sólo aparecen en la leyenda que
cuenta la abuela). Nada religioso; sin figuras sagradas del folclore real. Cuatro equipos en paralelo (ramas
`v38-arreglos`, `v38-duendes`, `v38-coihue`, `v38-textos`) y la rama de integración `v38-integra`. Todas las
decisiones de diseño las tomó el usuario (08-10), detalle en `PLAN_3_8.md`.

## El modo: «La noche de los duendes»
- El nombre visible del modo pasa de «Desafío» a **«La noche de los duendes»** («The Night of the Goblins»); por
  dentro sigue siendo `desafio` (partidas, claves y archivos no cambian).

## Los duendes (`duendes-modelo.js`, `desafio-duendes.js`, `desafio-duendes-reglas.js`)
- **Estilo C, bosque y musgo:** gorro de fieltro musgoso con hongos, cuello de hojas de otoño, capa de musgo o de
  hojas, barba de liquen, piel de corteza. Chiquitos (`TALLA_DUENDE`): pillo 0,75 m, saltarín 0,62, hondero 0,8,
  panzón 0,8, topo 0,7, lechucero 0,7, grandote 1 m, Mandamás 1,3 m. Margen de golpe para las flechas
  (`MARGEN_GOLPE`); vida, daño y velocidades sin cambios.
- **Traviesos al anochecer, viejos de noche:** en las noches grandes (la del jefe, las especiales y desde la 12) el
  60 % sale de viejo: oscuros, encorvados, barba larga, ojos de brasa y filo de luna.
- **Tipos:** Rastreador (pillo), Saltador (saltarín), Tirador (hondero, tira bellotas), Escupidor (panzón, savia
  y esporas), Bruto (grandote), Excavador (topo), **Lechucero** (jinete de lechuza con aleteo), **Mandamás** (jefe
  de nido, hongos de luz en la espalda: el punto débil), **Viejo** (antes mutado), **Baqueano** (antes adaptado).
- **Crecen:** chiquitos las noches 1–3, medianos desde la 4, grandotes desde la 10; los que aprendieron, con lajas
  de corteza.
- **Travesura sin perder nada** (`ROBO`): pillos y saltarines traviesos, 30 % al pegarte, tope 4 por noche; se
  llevan una semilla dorada, una ramita, una tabla o una piedra y salen corriendo riéndose. Si le pegás lo suelta;
  si se escapa lo deja tirado brillando; al alba te devuelven todo. Nunca herramientas ni nada construido. Se
  guarda en la partida (`robados`).
- **Nidos de hongos y musgo** en lugar de capullos; **madrigueras** (tocón hueco con puertita, ventanitas,
  escalera y farol de hongo) en lugar de los puestos.
- **Cofre del alba:** ya no cae en paracaídas: brota del suelo entre raíces, con brillo dorado.
- **Rendimiento:** instanciado por modelo, huesos en textura, LOD a 9 m. Con 30 duendes de noche: de 60 a 22
  dibujos, de 260 k a 88 k triángulos, ~1,5 ms; animar los 30 cuesta 0,22 ms. Armar los modelos suma ~0,75 s a
  la carga del modo.

## El Coihue Viejo y el Rey Duende (`desafio-coihue-formas.js`, `desafio-nave-mundo.js`, `desafio-asedio-mundo.js`)
- **El Coihue Viejo** (opción 3: musgo, puertitas y ventanas encendidas) reemplaza a la nave nodriza: 51 m, copa
  con el follaje del juego, camina con seis raíces. En la noche final se planta a 50–80 m de la base y **es el
  mismo del asedio** (uno solo, se arma en la carga). Si le rompés los tres nudos de ámbar, cruje y cae.
- **El asedio:** raíces con nudo de ámbar (antes agujas), corteza con grietas de ámbar (escudo), fogón (baliza),
  la puerta grande (haz).
- **La subida se camina:** espiral de raíces adentro del tronco hueco con descansos, faroles de hongos y casitas;
  ~33 s caminando; si te caés volvés al último descanso. Arriba, la puerta del corazón. Tres duendes asoman de
  las casitas, se ríen y se esconden (sin pelea). En la noche final el Coihue se planta en un claro.
- **El corazón:** sala de madera roja con el **Rey Duende** (opción 2: gigante de corteza con cuernos de ámbar,
  ×3,5) en su trono; tres piedras de ámbar (ojos), cuatro raíces con su semilla (pilares), la vaina de corteza en
  el pecho (corazón). Cinco poses. La pelea arranca de cero si salís al valle.
- **Semillas doradas** en lugar del cristal (lo que sueltan, mochila, mapa, en la mano). Por dentro el material
  sigue siendo `cristal`: guardado y recetas no cambian.

## Textos, sonidos e inglés
- ~285 textos del modo, guía, cuaderno, bestiario, mapa y radio; 9 logros reescritos y 2 renombrados («Monte
  quieto», «Rastro de aserrín»); `STEAM_LOGROS.md` al día.
- Inglés: tanda nueva `idioma-en-r.js` (goblin / Goblin King / Old Coihue); 190 claves viejas sin uso borradas.
- Sonidos por código: risitas de duende (agudas los chicos, «jo… jo» los viejos), la voz del Rey, la lechuza,
  el crujido y los pisotones del Coihue, el puff de esporas, la puertita que cruje, silbidos de duende en la
  música. Defensas: Campana de musgo, Faro de ámbar, Farol de sanación («Cosa de duendes»).
- **La leyenda:** la abuela Herminia cuenta «La noche en que salieron los duendes» (7 partes) el primer año de la
  noche de la leyenda; las otras tres se corren un año.

## Arreglos
- **Elsa, la guarda del tren,** quedaba con el giro en NaN cuando viajabas en la cabina lejos de ella (nunca
  tuvo `rumboObjetivo`). Nace con él, mira hacia donde va el tren y el giro nunca parte de NaN (`gente.js`).
- La humo 2.8 de la trochita medía piezas del tren viejo: ahora mide el tren de la 3.7.3 (la personalización
  siempre se aplicaba bien).

## QA
- `npm run verify`: 169 de 169 (4 pruebas nuevas: verificar-3-8-0-arreglos, -3-8-textos, -3-8-duendes, -3-8-coihue).
- Partidas reales: suite entera de a 4 sobre la integración: 65 de 68; las 3 que fallaron, solas en verde
  (humo-construir y humo-nido miraban el texto viejo del nido enterrado: ahora «la cueva»; humo-3-6-mundo es
  medición de cuadros con la PC cargada). Después de los últimos cambios del Coihue, las 12 del modo en verde
  (asedio, 3-5-1, desafio, -2, premium, contra, supervivencia, nido, invasores, 1-10, 1-11, idioma).
- humo-3-0-asedio: la prueba no pelea y a veces moría en el corazón (según de qué puertita sale la cría); ahora
  mantiene la salud en ese tramo.
- Intermitente, no de la 3.8: `verificar-3-7-2-granja` («E al lado de la vaca» encontró al ternero) falló una
  vez en el gate; solo pasa siempre, igual que en la 3.7.5. Una vez «la pistola le pega a la aguja (520 → 520)»
  en el asedio; no se repitió.

## Queda para después
- La lechuza todavía tosca; las raíces del cofre de cerca parecen patas.
- Los huesos del Rey son pivotes rígidos (no piel por huesos).
- El nombre largo del modo en el botón de la portada: mirarlo en pantalla.
- Inglés: defensas de la 2.x y rumores de radio del modo siguen sin traducir (nunca lo tuvieron).
- Los sonidos nuevos se generaron sin errores pero nadie los escuchó: oírlos en el juego.
- Medir en la PC del usuario (4600G): la subida, la noche final con 30 duendes, el corazón.
