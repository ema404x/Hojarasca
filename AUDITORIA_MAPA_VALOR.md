# Hojarasca — auditoría de valor del mapa (paso 2 de `PLAN_MAPA_VALOR.md`, 21-10-2026)

Rama `v46-auditoria-mapa` (sale de la 4.5.1, `5fabf58`). **No se cambió el juego.** Se agregó sólo este documento, las
capturas de `auditoria-mapa/` y una herramienta de recorrido, `herramientas/recorrido-mapa.cjs` (fuera del gate).

**Cómo se hizo.**
- **Leído en el código:** `config.js`, `terreno.js`, `estructuras.js`, `trochita.js`, `aldea*.js`, `gente.js`, `objetos.js`,
  `vegetacion.js`, `oficios*.js`, `comercio.js`, `mercado.js`, `pedidos.js`, `feria.js`, `fotos.js`, `eventos-valle.js`, etc.
- **Visto en el juego:** un Relax nuevo en Electron (oculto, perfil propio, calidad **media**, otoño, despejado, la aldea
  completa con los 20 pobladores), día 6. La herramienta leyó del juego andando las coordenadas reales de cada lugar,
  qué hay alrededor (bioma, rocas, árboles, pehuenes, piñones, cantos, gente), barrió el valle cada 8 m buscando sitios
  libres para un puesto, sacó 36 capturas teletransportando y caminó nueve tramos de verdad (con la tecla W).
- **Supuesto:** lo que se marca así; sobre todo los números propuestos.

Convención de coordenadas: `x` crece al este, `z` crece al norte; el valle va de −468 a 468 en los dos ejes (`LIMITE`,
`config.js:8`), las montañas empiezan a subir a 395 m del centro. El reloj: un día dura 30 minutos reales
(`ajustes.duracion`), así que **una hora del juego son 75 segundos reales**. Velocidades (`config.js:103`,
`caballo.js:14`): caminar 3,2 m/s, correr 6,6 m/s, caballo al trote 6,2 m/s y al galope 11 m/s.

> **Ojo con la calidad:** el molino, la torre, el galpón y el puesto se sortean evitando los árboles, y los árboles cambian
> con la calidad gráfica (`estructuras.js:1430`, `vegetacion.js:1403`). Las coordenadas de abajo son las de **media** (la
> de fábrica). En **alta** el galpón cae en (−9,7, 259,2), la torre en (−47,6, −145,9) y el molino en (−209,4, −249,4); en
> muy baja el puesto queda en (−242,9, 1,9). **Todo lo nuevo del paquete 1a tiene que ir en coordenadas fijas** (como el
> refugio, el mirador, el mallín y los arrayanes), nunca sorteado, para que no se mueva entre calidades.

---

## 1. El valle por zonas

### 1.1 El dibujo del valle (visto en el juego: bioma dominante cada 32 m)

```
        x = -456 ................. 0 ................... +456
 z=-456  .BBB~Bb..bb.bbbbBB...eeeeeeee      * = plaza del pueblo (Aldea de los Duendes)
  -392   .bbBBBBbbbbbb..*bB...eeeeeeee      R refugio · E Estación del Valle · M mirador · T Puesto Alto
  -328   bbbb.bmbbbb..bBbBbb.eeeeeeeee      L mallín · P puente · G torre · O molino · U muelle
  -264   bbbbbmmGbbb.bbBBBBb.eeeeeeeee      C cabaña · F faro · V cueva · S galpón · Y arrayanes
  -232   bb.bBPmLbbbBbbBBBBBb.eeeeeeee      1 Parada del Mallín · 2 Parada Arrayanes
  -168   bbB1BBbbmbBBbOBBBBBb.eeeeeeee
  -136   ..bbBB.bb~B.bbbbBBBb.Seeeeeee      b bosque abierto · B bosque húmedo · . ecotono
   -72   bbB.BBb..bBB~.bb....eeeeeeeee      m mallín · e estepa · ~ agua (arroyo y lago)
    -8   ..bbbb..bbbBBB~b~~~.FeeVeeeee
    24   bBBbbMbbbbbBBb.~~~~~~~eeeeeee
    56   BBBbbTbbbbbBb..b~~~~~~eeeeeee
   120   BBbbbbbbb.bbbb.~~~~~~~Yeeeeee
   152   BB.bbbbbb.b.b.bU~~~~~~eeeeeee
   216   BBBbbbbb.bRbbb..b.~...eeeeeee
   280   BBb.bbEb.bBBBBbBBBbb2eeeeeeee
   344   bBBBbbb.bBbBB.bbBBBb.eeeeeeee
   440   .Bb.bbbbb.B..b.b.b.eeeeeeeeee
```
(Arriba en el dibujo es el sur, z negativo: ahí está el pueblo. Hay filas salteadas para que entre.)

Lo que dice el dibujo, en números (celdas de 8 m dentro de ±456):
- **Bosque** (abierto, húmedo y ecotono): ~8.700 celdas, el oeste y el centro.
- **Estepa:** 3.563 celdas, **todo el tercio este** (x > ~180, de punta a punta en z). Es la zona más grande y casi vacía.
- **Mallín** como bioma: sólo **78 celdas** (~5.000 m²), una franja angosta pegada al arroyo entre (−296, −416) y
  (−200, −170), más manchitas río abajo. El centro de gravedad está en (−260, −240), junto al puente de troncos.
- **Alto andino:** ninguna celda caminable; sólo en las laderas del borde.
- **Agua:** el lago (centro 150, 110; radio 90–118 m) y el arroyo, que baja del suroeste (−330, −540) y desemboca en el
  lago cerca de (72, 51).

**Los dos centros del jugador están en puntas opuestas:** el pueblo (plaza en 40, −379) en el sur y el Refugio del
Arroyo (−120, 232) en el norte, a 632 m uno del otro. «Lejos del pueblo» no alcanza: hay que mirar también la distancia
al refugio.

### 1.2 Lugares, coordenadas, distancias y cómo se llega

Coordenadas leídas del juego (calidad media). «Corriendo» y «galope» son en línea recta desde la plaza (el camino real
es más largo; ver 1.3). Lago: «sí» si está en la orilla y se llega en kayak desde el muelle.

| Lugar | x, z | a la plaza | al refugio | corriendo / galope desde la plaza | Parada de la trochita más cerca | Cómo se llega |
|---|---|---|---|---|---|---|
| Plaza del pueblo (Aldea de los Duendes) | 40, −379 | 0 | 632 | — | Aldea de los Duendes, 37 m | Tren, a pie, caballo (Moro y Tostado atados en la plaza) |
| Refugio del Arroyo (casa del valle) | −120, 232 | 632 | 0 | 96 s / 57 s | Estación del Valle, 137 m | A pie; el zaino de Don Ramón está atado al lado |
| Estación del Valle | −233, 305 | 737 | 135 | 112 s / 67 s | es parada | Tren, a pie |
| Mirador del Pehuén (pehuenal) | −292, 36 | 532 | 261 | 81 s / 48 s | P. del Mallín, 203 m | A pie o caballo por el sendero; loma de +38 m |
| Puesto Alto (Don Ramón) | −276, 84 | 561 | 215 | 85 s / 51 s | E. del Valle, 228 m | Sendero; 50 m del mirador |
| Mallín | −222, −226 | 304 | 469 | 46 s / 28 s | P. del Mallín, 142 m | Sendero |
| Puente de Troncos | −268, −230 | 343 | 485 | 52 s / 31 s | P. del Mallín, 106 m | Sendero (cruza el arroyo) |
| Torre de Guardaparques | −217, −263 | 282 | 504 | 43 s / 26 s | P. del Mallín, 166 m | Sendero |
| Parada del Mallín | −347, −159 | 445 | 452 | — | es parada | Tren |
| Molino de Viento | −35, −158 | 233 | 399 | 35 s / 21 s | Aldea, 199 m | Sendero |
| Salto del arroyo (cascada) | 13, 5 | 385 | 263 | — | — | A pie |
| Muelle del Lago | 43, 158 | 537 | 179 | 81 s / 49 s | P. Arrayanes, 204 m | A pie; ahí está el kayak |
| Cabaña del Pescador (Nicanor) | 185, 15 | 420 | 374 | 64 s / 38 s | P. Arrayanes, 277 m | A pie, caballo, **kayak** |
| Faro del Lago | 216, 8 | 425 | 404 | 64 s / 39 s | P. Arrayanes, 284 m | A pie, caballo, **kayak** (32 m de la cabaña) |
| Cueva de las Manos | 307, 8 | 470 | 483 | 71 s / 43 s | P. Arrayanes, 304 m | A pie o caballo por la estepa |
| Galpón de Esquila | 228, −110 | 328 | 487 | 50 s / 30 s | Aldea, 298 m | Sendero |
| Bosque de Arrayanes | 266, 150 | 575 | 395 | 87 s / 52 s | P. Arrayanes, 157 m | A pie, **kayak** (orilla este) |
| Parada Arrayanes | 198, 292 | 689 | 323 | — | es parada | Tren |

Lugares que **no existen** como sitio con nombre (leído en el código): **cantera, pehuenal, estepa, costa del lago,
seccional en el valle, pescadería en el valle**. La seccional y la pescadería son locales del pueblo (sección 3.1). El
«pehuenal» es en los hechos el mirador: **los 8 pehuenes del valle** están a menos de 80 m del Mirador del Pehuén. La
«cantera de la loma» sólo aparece en textos (`trueque.js:127`) y en el perfil sin usar «Parada Alta» de `comercio.js`.
La única cantera de verdad es la del mapa del Desafío (`desafio-mapa.js:44`: da 5 piedras y vuelve en 2 días).

**El tren:** un anillo de ~2.300 m alrededor del valle con **sólo cuatro paradas en el Relax** (Aldea, Mallín, Estación
del Valle, Arrayanes). Entre la Aldea (40, −342) y la Parada Arrayanes (198, 292) el riel recorre **todo el borde este
(unos 800 m de estepa) sin parar**: pasa por (226, −286), (322, −166), (346, −10) y (318, 146). **El velero** sólo existe si
el jugador construye un varadero; **el kayak** anda sólo en el lago (no en el arroyo) y se baja en cualquier orilla
firme.

### 1.3 Caminatas de verdad (visto en el juego)

El jugador corrió (W + Mayús) en línea recta hacia cada destino, cuadro a cuadro. «Recorrido» es lo que se movió de
verdad hasta quedar a 8–12 m del destino; el tiempo se estima con ese largo y la velocidad de carrera.

| Tramo | En línea recta | Recorrido | Corriendo (estimado) | ¿Se trabó? |
|---|---|---|---|---|
| Norte de la aldea (−10, −330) → mallín | 236 m | 228 m | ~35 s | No |
| Plaza (60, −360) → galpón de esquila | 288 m | 277 m | ~42 s | No |
| Aldea (60, −330) → puesto D (estepa sur) | 251 m | 244 m | ~37 s | No |
| Mallín → cantera (−395, −300) | 188 m | 180 m | ~27 s | No |
| Galpón → cueva | 126 m | 118 m | ~18 s | No |
| Cueva → puesto C (estepa este) | 69 m | 61 m | ~9 s | No |
| Parada del Mallín → puesto B (oeste) | 130 m | 122 m | ~19 s | No |
| Puesto B → mirador (caminando, en subida) | 77 m | 70 m | ~22 s | Apenas, en la loma |

Dos tramos se trabaron por cómo los tiré, no por el terreno: desde el medio de la plaza hacia el mallín (chocó con las
casas de la aldea) y desde adentro del corral del galpón. Saliendo por la calle, los dos llegan.

**Lo que dicen las caminatas:** no hay barreras naturales entre el pueblo y las zonas (el arroyo se cruza por el puente o
vadeando; la estepa es pareja). **El valle es chico:** cruzarlo entero corriendo son unos 100 s reales, 1,3 horas del
juego; a caballo, menos de un minuto. «El viaje es la barrera» (decisión del 21-10) **hoy casi no pesa**: lo que va a
pesar es la **carga** (paquete 1b) y los **horarios** (la gente y los puestos que atienden a ciertas horas). Esto importa
para los plazos del tablón y para no pagar de más por «lejos» (ver preguntas 6 y 7).

---

## 2. Qué se puede hacer hoy en cada lugar, y cuánto vale

Puntaje: **llena** (más de una razón para ir y volver), **algo** (una razón, o sólo mirar y sacar una foto),
**vacía** (nada que hacer). Entre paréntesis, la captura.

| Zona | Qué hay hoy | Gente | Puntaje |
|---|---|---|---|
| **Pueblo y plaza** ([01](auditoria-mapa/01-plaza-pueblo.jpg), [02](auditoria-mapa/02-pescaderia-seccional.jpg)) | 20 pobladores + 11 vecinos fijos con pedidos, jornales y charla; banco, cantina, casa de té, almacén, biblioteca, escuela, fiestas, negocio propio, casa propia, comercio con Ernesto | Todos | **Llena** — concentra plata, gente y edificios |
| **Refugio del Arroyo** ([03](auditoria-mapa/03-refugio.jpg)) | La casa del valle: construcción, huerta, granja, corral, depósitos; el caballo; foto «refugio nevado» | Tu familia de visita | **Llena** — es la base del jugador |
| **Estación del Valle** ([04](auditoria-mapa/04-estacion-valle.jpg)) | Comercio de la trochita (Don Aurelio: produce harina y tabla), **feria cada 5 días** de 9 a 18 (cuatro trueques), fletes, músicos (evento) | Don Aurelio (sólo texto en el panel) | **Algo** — vale los días de feria |
| **Mirador y pehuenal** ([11](auditoria-mapa/11-mirador-pehuenal.jpg), [33](auditoria-mapa/33-pehuenal-de-cerca.jpg)) | Los únicos 8 pehuenes y **31 piñones** (no vuelven), 12 rocas, foto del cóndor y de la cordillera; los visitantes piden ir | **Josefina** (guardaparque del valle) recorre el sendero; Don Ramón a 50 m | **Algo** — gente con historias, pero los piñones se terminan |
| **Puesto Alto** ([12](auditoria-mapa/12-puesto-alto.jpg), [12b](auditoria-mapa/12b-puesto-alto-cerca.jpg)) | Don Ramón: presta el caballo, cambia vaca y ovejas, historias, encargos de temporada; foto «humo en la cabaña» | **Don Ramón** | **Llena** — ida obligada al principio |
| **Mallín, puente y torre** ([13](auditoria-mapa/13-mallin.jpg), [14](auditoria-mapa/14-puente-troncos.jpg), [15](auditoria-mapa/15-torre.jpg), [28](auditoria-mapa/28-mallin-junco.jpg)) | Pradera con el arroyo; 14–15 cantos rodados; pesca de arroyo; bandurrias; torre para subir (foto); evento «el puente se rompe»; los visitantes piden ir | Nadie fijo | **Algo** — lindo y con fotos, pero sin nada que juntar ni a quién ver |
| **Parada del Mallín** ([17](auditoria-mapa/17-parada-mallin.jpg)) | Comercio de la trochita («la acopiadora del mallín»: lana, huevo, haba), fletes | Sólo texto | **Algo** |
| **Molino** ([16](auditoria-mapa/16-molino.jpg)) | Muele habas en harina (`molino.js`), campo de tulipanes, foto | Nadie | **Algo** — útil para la panadería |
| **Muelle y lago** ([05](auditoria-mapa/05-muelle.jpg)) | Kayak, pesca, foto del atardecer y desde el kayak, cisnes, coipos | **Martina** la botera trabaja ahí de 8 a 17 | **Llena** |
| **Cabaña del Pescador y faro** ([06](auditoria-mapa/06-cabana-pescador.jpg), [06b](auditoria-mapa/06b-cabana-desde-tierra.jpg), [07](auditoria-mapa/07-faro.jpg)) | Nicanor con historias y encargos; el faro con la bitácora para leer; foto del faro de noche | **Nicanor** (pescador del valle) | **Algo** — charla e historias, sin comercio |
| **Cueva de las Manos** ([08](auditoria-mapa/08-cueva.jpg)) | Foto «las manos», guanacos en la estepa (7, con huellas), visitantes piden ir | Nadie | **Algo** — sólo foto |
| **Galpón de Esquila** ([09](auditoria-mapa/09-galpon-esquila.jpg), [09b](auditoria-mapa/09b-galpon-corral.jpg)) | La majada de Don Ramón (8 ovejas, esquila con tijera: 2 vellones, vuelve en 6 días); foto «lana y viento» | **Nadie** (las ovejas son de Ramón, que vive en la otra punta) | **Algo** — da lana, pero el edificio está mudo |
| **Bosque de Arrayanes y su parada** ([10](auditoria-mapa/10-arrayanes.jpg), [18b](auditoria-mapa/18b-parada-arrayanes.jpg)) | 29 calafates alrededor, comercio de la trochita («el apicultor»: miel, frutilla, calafate) | Sólo texto | **Algo** |
| **Centro (entre el molino y el lago)** ([26](auditoria-mapa/26-centro-vacio.jpg)) | Bosque abierto con el sendero; ciervos | Nadie | **Vacía** (de paso) |
| **Desembocadura del arroyo** ([27b](auditoria-mapa/27b-desembocadura-desde-el-lago.jpg)) | Orilla con cantos | Nadie | **Vacía** |
| **Estepa este** (de la cueva a los arrayanes; [23](auditoria-mapa/23-puesto-C-estepa-este.jpg), [25](auditoria-mapa/25-puesto-E-estepa-norte.jpg), [31](auditoria-mapa/31-estepa-ojos.jpg)) | Coirón, neneo, calafate; guanacos; pasa el tren sin parar | Nadie | **Vacía** — un tercio del mapa |
| **Estepa sur y sureste** ([24](auditoria-mapa/24-puesto-D-estepa-sur.jpg), [30](auditoria-mapa/30-sureste-vacio.jpg), [30b](auditoria-mapa/30b-sureste-ojos.jpg)) | Idem; el riel | Nadie | **Vacía** |
| **Oeste (entre la Parada del Mallín y el mirador)** ([22b](auditoria-mapa/22b-puesto-B-desde-arriba.jpg)) | Bosque cerrado con el riel | Nadie | **Vacía** (de paso) |
| **Suroeste (pie de la montaña)** ([20b](auditoria-mapa/20b-cantera-de-cerca.jpg), [32](auditoria-mapa/32-cantera-desde-arriba.jpg)) | **El rincón con más rocas del valle** (hasta 23 en 60 m) | Nadie | **Vacía** |
| **Norte (de la vía al borde)** ([29](auditoria-mapa/29-norte-vacio.jpg)) | Claros en el bosque | Nadie | **Vacía** |

**Resumen:** llenas 4 (pueblo, refugio, Puesto Alto, muelle), algo 9, vacías 7. Las vacías ocupan casi la mitad del
valle: **toda la estepa** (el este entero), el **suroeste rocoso**, el **oeste** entre el tren y el mirador, el **centro**
y el **norte**. Las «algo» casi siempre son «un edificio y una foto»: el valle tiene muchas cosas para mirar y muy
pocas para **hacer o juntar** fuera del pueblo y el refugio.

Datos de lo que hay para juntar (visto en el juego, el valle entero): 665 rocas para picar (432 en bosque abierto, 140 en
las laderas del borde, **sólo 25 en toda la estepa**), 6.926 árboles, 917 calafates, 797 ramitas, 72 cantos rodados, 65
amancay, 64 llao llao, 45 plumas, 39 frutillas y **31 piñones**. **Nada de esto vuelve** salvo los árboles talados
(rebrotan) y los vellones: una roca picada, un piñón o un canto juntado no reaparecen (`bosque.js:46`, `objetos.js:301`).
Es decir: hoy el valle **se agota**. Los recursos de zona que se reponen arreglan eso de paso.

---

## 3. Verificaciones que pide el plan

### 3.1 ¿Existen el pescador y la guardaparque fuera del pueblo? **Sí, y por duplicado.**

Hay **dos pescadores y dos guardaparques**, uno de cada en el pueblo y otro en el valle (leído en el código; posiciones
vistas en el juego):

| | En el pueblo | En el valle |
|---|---|---|
| **Pescador** | **Aurelio Nahuel**, «pescador de red», 7.º poblador en llegar. Local: la **pescadería** (−37, −384). Cambia 2 truchas por 2 troncos una vez por día; pedidos (tronco, lana, pan); jornal «remendar las redes» $1.000; se le puede comprar la pescadería en $85.000 (`aldea.js:767`, `pedidos.js:16`, `trabajos.js:17`, `negocios-vecinos.js:33`) | **Nicanor**, en la **Cabaña del Pescador** (185, 15): va y viene entre la puerta y la orilla, pesca con caña, todo el día. 6 historias, saludos por hora y estación, encargos (e-pesca, e-tren, e-cocina, e-nocheagua) y encargos de temporada; amistad y cumpleaños. **Sin pedidos, sin jornal, sin comercio** (`gente.js:176`, `:1032`). Visto en el juego: estaba a 3 m de su puerta |
| **Guardaparque** | **Julia Antiñir**, 19.ª en llegar. Local: la **seccional** (−22, −394), con la perra Pampa. Paga $100 por avistaje nuevo (hasta 4 por día), mapa del valle con lo que te falta; pedidos (trucha ahumada, tronco, hongos); jornal «marcar senderos» $1.100; candidata al romance (le gusta el faro) (`aldea.js:827`, `:1737`) | **Josefina** (`ema` en el código), recorre el sendero del **Mirador del Pehuén** (−292, 36) con su planilla. 6 historias, encargos (árboles, renovales, nocturno, valle), eventos (incendio, huemul enredado, tobillo de Nicanor), aliada en el Desafío. **Sin pedidos, sin jornal, sin comercio** (`gente.js:173`, `:1052`). Visto en el juego: a 3 m del mirador |

También hay gente que **sólo es un texto**: «la hija del farero» y «el pescador del apeadero» son vendedores de perfiles
de `comercio.js` que **no se usan en el Relax** (no hay parada que se llame así); Don Ezequiel, «el viejo farero», es
sólo una carta (`noticias.js:169`); la Torre de Guardaparques no tiene a nadie. Y un choque de nombres: «Don Aurelio, el
jefe de estación» de la Estación del Valle es otro Aurelio.

**Conclusión:** el pescador y la guardaparque del valle ya existen, con modelo, rutina e historias. **Lo que les falta es
economía:** no piden, no pagan, no venden. Para el paquete 1a conviene **darles pedidos y una tiendita a Nicanor y a
Josefina** (no crear personajes nuevos), y dejar a Aurelio y Julia como están. Un detalle a decidir: si el tablón del
pueblo incluye encargos «para Nicanor» o «para Josefina» que se entregan en el valle.

### 3.2 Materiales: dónde y cómo se consiguen hoy

| Material | ¿Existe? | Cómo y dónde (leído en el código; conteos vistos en el juego) |
|---|---|---|
| **Piedra** | Sí (material) | Picar rocas con el pico, en cualquier parte: 665 rocas sorteadas en laderas (pendiente > 0,55), cerca del agua y en grupos decorativos (`vegetacion.js:1592`, `:1605`, `:1660`). **No vuelven.** También se compra (lote de 4, $400 de base), sale de la feria (6 huevos por 8; 4 de lana por 12) y de la cantería propia (3 por día) |
| **Piñones** | Sí (fruta, «entrada» del cuaderno) | 4 al pie de cada pehuén vivo (`objetos.js:139`): **31 en todo el valle, todos en el mirador**. **No vuelven** y no dependen de la estación |
| **Hierbas** | **No** | Sólo textos: el emplasto del Desafío, un té, el jornal de la herbolaria Inés |
| **Junco** | **No** | Sólo un adorno junto al arroyito del molino (`molino-paisaje.js:215`) |
| **Arcilla** | **No** | Sólo en las charlas de Malena, la ceramista |
| **Lana** | Sí (material) | Esquilar con tijera las 8 ovejas (visto: pastan en el corral, captura 09b) del galpón de esquila (2 vellones cada una, vuelven en 6 días) y las 2 de un corral propio. Se compra en la Parada del Mallín, y sale de la feria |
| **Cuero** | **No** | Sólo nombres (honda de cuero, ropa, la leyenda «el cuero del lago»). No se caza para cuero |

De los cinco recursos de zona del plan, **hoy existen tres** (piedra, piñones, lana) y **faltan cuatro** materiales
(hierbas, junco, arcilla, cuero). Lana y piedra ya están en el mercado de 19 bienes; piñones no (es comida suelta).

### 3.3 El pico de la 4.2, el picapedrero y el «pico de cantero»

**La regla de hoy** (`CAMBIOS_4_2_PICO.md`, `main.js:4463`, `oficios.js:178`):
- Con el pico, H frente a una roca: se pica a golpes como la tala. Golpes: 6, 6, 5, 4, 3, 2 (sin oficio y niveles 1 a 5);
  una roca chica pide el 60 %. El filo del herrero quita un golpe; el temple de la herrería propia, dos.
- **Rinde siempre 4 piedras** (5 desde el nivel 4 de picapedrero), sea la roca grande o chica. La roca no vuelve.
- Todas las rocas son iguales salvo el tamaño; las decorativas también se pican.
- **El picapedrero** sube 1 por golpe y 4 por roca terminada (umbrales 0/40/120/260/480/800: el nivel 5 son ~90 rocas);
  da +1/+2 piedras a la cantería propia y cuenta para el empleo del taller ferroviario.
- Se consigue por trueque (3 cantos + 12 ramitas), forjado por el herrero (3 cantos + $300) o comprado ($1.200).

**El choque de nombres es peor de lo que dice el plan:** el pico común **ya se llama «Pico de cantero»** en el juego
(`mochila.js:508`, `trueque.js:126`), y en el código `cantero` es el cantero de la huerta (por eso el oficio se llamó
`picapedrero`).

**Propuesta (sin implementar):**
1. **Nombres:** el de hoy pasa a llamarse **«Pico»** (o «pico de mano»); el nuevo, **«pico de cantero»**, con otra clave
   en `cosas` (por ejemplo `picoCantero`) para no chocar con los canteros de la huerta.
2. **Qué hace distinto:** el pico común sigue sirviendo para las rocas sueltas de todo el valle (que se agotan). El de
   cantero es **el único que trabaja la veta de la cantera**: un frente de piedra fijo en el suroeste que **se repone**
   (como la cantera del Desafío, `desafio-mapa.js:44`) y que da **«piedra labrada»** o más piedra por golpe. Así cada
   uno tiene su lugar: el común para lo de todos los días, el de cantero para el que se especializa y viaja.
3. **Cómo se consigue:** no se compra en el pueblo. **Lo vende o lo da el cantero** en la cantera, pidiendo picapedrero
   nivel 2 o 3 (el oficio de la 4.2 tiene a dónde llevarte) más pesos o piedra.
4. Opcional: que la piedra labrada sea la que piden las obras grandes (edificios de oficio, puestos de ruta), y que el
   cantero la compre y la venda a precio propio.

Lo que habría que tocar después: `mochila.js` (ranura), `almacen.js:49` (herramientero), la limpieza de `cosas` en
`guardado.js` y `pruebas/verificar-4-2-pico.mjs` (texto exacto del nombre).

### 3.4 Comercio, mercado y pedidos: dónde enganchar el tablón y los puestos

**Comercio entre paradas** (`comercio.js`, `comercio-mundo.js`; sólo Relax): en cada parada, en el galpón de cargas,
E abre un panel con comprar, vender y fletes. El precio de cada bien en cada parada sale de su valor base × 0,62 si la
parada lo produce, × 1,5 si lo pide, × la estación, ± 12 % del día, × el factor del mercado; te pagan el 88 % y te cobran
el 112 % (y cada lote que movés lo empeora un 8 %); tope 6 lotes por bien y día. Fletes de pasajeros y carga se cobran
al llegar manejando el tren. Arbitraje medido en `ECONOMIA_NUMEROS.md`: **$228 por día en promedio**, la mejor ruta $1.350.

**Mercado** (`mercado.js`): cada puesto guarda existencias (tope 14 lotes por bien) y caja ($4.000–8.000, se repone $700
por día); el precio sube cuando hay poco y baja cuando hay mucho (de × 0,85 a × 1,3). Los **19 bienes**: tronco, tabla,
piedra, cristal, lana, huevo, haba, papa, frutilla, miel, trucha fresca, trucha ahumada, frasco de dulce, calafate seco,
hongos secos, pan casero, empanadas, harina y poncho (valores de lote de $300 a $2.000).

**Un hallazgo útil:** `comercio.js` tiene **11 perfiles de parada y el Relax usa 4**. Quedan sin usar siete con
vendedor y gustos ya escritos: «Parada Alta» (**el capataz de la cantera**: produce piedra; pide empanadas, pan, lana,
tronco), «Parada del Mirador» (**el baqueano del mirador**: piedra y hongos), «Apeadero del Faro» (la hija del farero:
truchas), «Apeadero del Pescador» (truchas), «Parada del Bosque» (el hachero), «Parada del Molino» y «Apeadero de la
Casa de Té». **Son puestos de ruta ya escritos**: alcanza con darles un lugar.

**Pedidos** (`pedidos.js`): sólo los 20 pobladores del pueblo; uno por vecino cada 3 días, **tope global 2 entregas
por día**; 1 o 2 lotes (uno más con reputación); paga `lotes × valor × (1,10 + 0,04 × reputación)` (+5 % si entregás el
primer día), **típico $440–880**, máximo ~$7.600; sale de la caja del local. Se ofrecen sólo en la charla: **no hay
lista ni tablón**. Nicanor, Josefina y Don Ramón no piden nada.

**Dónde enganchar:**
- **El tablón de encargos:** el molde más parecido es el abastecimiento del banco (`prestamos.js:99-130`: un pedido
  por ventana con prima). Va en la plaza (`aldea.js:101`) con el patrón «aviso + E + panel» de `main.js:10407`. El pago
  sale de `cobrar()`. El estado nuevo hay que sumarlo a `negociosNuevo`/`sanearNegocios` (`negocios.js:22`, `:62`), que
  tira lo que no conoce. **Nombre del módulo:** no `encargos.js` (ya existe, son los de la historia): `tablon.js`.
- **Los puestos de ruta:** el mercado ya funciona con **cualquier nombre de puesto** (`perfilDe` arma un perfil por hash
  si no está en `PERFILES`, y `comercio.mercado[nombre]` guarda existencias y caja). Lo que hay que tocar: el panel se
  cierra solo si no estás junto a una parada del tren (`vigilar()`, `comercio-mundo.js:155`, usa `tren.puestoCerca`):
  hay que darle un «cerca» propio; sacar la pestaña de fletes; el estado «reparado» en un campo nuevo saneado; y el tope
  de 40 puestos de `sanearMercadoGuardado` alcanza.
- **La reparación por etapas** con la maquinaria de pesos de la 4.2 (`obra-pesos.js`: `pesos` por etapa, se cobra al
  hacerla, retirar devuelve todo): un puesto entra como un plano de 2 o 3 etapas.

---

## 4. Propuesta con datos (sin implementar)

### 4.1 Dónde va cada recurso de zona

| Recurso | Dónde (fijo) | Por qué | Herramienta y quién |
|---|---|---|---|
| **Piedra buena (cantera)** | **Pie de la montaña del suroeste, (−405, −305)** ([20b](auditoria-mapa/20b-cantera-de-cerca.jpg), [32](auditoria-mapa/32-cantera-desde-arriba.jpg)) | Es el rincón con más rocas sueltas del valle (17–23 en 60 m), está vacío, lejos del pueblo (451 m) y del refugio (608 m), a 157 m de la Parada del Mallín y a 140 m del mallín | Pico de cantero; **el cantero** |
| **Piñones (otoño)** | **El mirador, (−292, 36)**, con los 8 pehuenes que ya hay (no se pueden sumar árboles sin cambiar la prueba del bosque) | Ya están ahí los únicos 8 pehuenes; Josefina y Don Ramón al lado. Falta que **vuelvan cada otoño** (hoy no vuelven) y que den algo más que 4 por árbol | Ninguna (a mano); los compra el baqueano |
| **Hierbas y junco** | **El mallín junto al puente, (−260, −240)** ([28](auditoria-mapa/28-mallin-junco.jpg)) | Es donde está la franja de bioma mallín (pradera húmeda pegada al arroyo); ya va gente (visitantes, sendero) pero no hay nada que juntar | Hoz o cuchillo de junco; lo vende la acopiadora del mallín (la parada ya tiene ese perfil) o Josefina |
| **Arcilla** | **Desembocadura del arroyo en el lago, (66, 44)** ([27b](auditoria-mapa/27b-desembocadura-desde-el-lago.jpg)) | Orilla baja con barro donde el arroyo llega al lago; zona vacía; se llega a pie desde el molino o **en kayak** desde el muelle (107 m del centro del lago); 4 m del agua | Pala de arcilla; la vende Malena (la ceramista ya habla de arcilla) o Nicanor |
| **Lana y cuero** | **La estepa del este, alrededor del galpón de esquila (228, −110)** y el puesto de la estepa | La majada ya vive en el galpón; los guanacos ya andan por la estepa; la estepa es el tercio vacío del mapa | Esquiladora o cuchillo de cuero; **el pastor** |

Cuero: hoy no se caza para cuero y los guanacos son fauna para mirar. **Supuesto a decidir por el usuario:** el cuero
puede salir **del pastor** (de su majada, como trueque o compra) y no de cazar guanacos, para no meter caza de fauna
nativa. Ver pregunta 4.

**Que se repongan:** el molde está hecho en el Desafío (`desafio-mapa.js:43`: `da`, `rebrota` en días, aviso y texto de
vacío). Propuesta: cada lugar de recurso es **un punto que da N y vuelve en D días**, no cientos de objetos sueltos (eso
cuida el rendimiento y evita «limpiar» el mapa).

### 4.2 Puestos de ruta abandonados: candidatos

La herramienta barrió el valle cada 16 m y se quedó con los puntos que cumplen todo: tierra firme, pendiente < 0,35,
desnivel < 1,6 m en 6 m alrededor, **ningún árbol a 9 m ni roca a 5 m**, sin agua al costado, a más de 200 m de la plaza
y a más de 70 m de cualquier lugar, parada o edificio. Salieron 528 puntos (408 en la estepa). De esos, los mejores
por zona vacía y por acceso (sendero o vía cerca):

| | Nombre propuesto | x, z | A la plaza / al refugio | Acceso | Bioma y por qué |
|---|---|---|---|---|---|
| **A** | **Puesto de la Cantera** | **−320, −288** ([21b](auditoria-mapa/21b-puesto-A-desde-arriba.jpg)) | 372 / 557 | Riel a 6 m, arroyo a 32 m, 132 m de la Parada del Mallín, 85 m de la veta | Claro en el bosque abierto del suroeste. Sirve a la cantera y al cantero. Perfil de mercado ya escrito: «Parada Alta» (el capataz de la cantera) |
| **B** | **Puesto del Paso** (oeste) | **−350, −20** ([22b](auditoria-mapa/22b-puesto-B-desde-arriba.jpg)) | 530 / 341 | Riel a 0–2 m (correrlo 10 m al este), sendero a 34 m; entre la Parada del Mallín (139 m) y el mirador (80 m) | Bosque abierto del oeste, zona de paso vacía. Puesto del **arriero**; compra piñones. Perfil ya escrito: «Parada del Mirador» (el baqueano) |
| **C** | **Puesto de la Estepa** | **320, 80** ([23](auditoria-mapa/23-puesto-C-estepa-este.jpg)) | 538 / 466 | Sendero a 15 m, riel a 17 m; entre la cueva (74 m) y los arrayanes (95 m) | Estepa abierta, plano. El corazón del tercio vacío. Puesto del **pastor** o su base de verano; lana y cuero |
| **D** | Puesto del Riel Sur | 288, −224 ([24](auditoria-mapa/24-puesto-D-estepa-sur.jpg)) | 292 / 612 | Riel a 1 m (correrlo 10 m) | Estepa sur vacía; podría ser un **apeadero nuevo** del tren (el riel no para en 800 m) |
| **E** | Puesto del Norte de la Estepa | 320, 208 ([25](auditoria-mapa/25-puesto-E-estepa-norte.jpg)) | 650 / 441 | Sendero a 15 m | Estepa norte; queda cerca (148 m) de la Parada Arrayanes, que ya da comercio: rinde menos |

Descartados: el **centro** (entre el molino y el lago) está a 285 m de la plaza y lo cruza el sendero, pero no hay
claro libre de árboles junto al camino; el **norte** queda a 100–150 m del refugio (no es «lejos»); el **sureste
profundo** (330, −380) no tiene sendero ni vía.

### 4.3 Dónde vive la gente nueva

- **El pastor:** en el **Galpón de Esquila (228, −110)**. El galpón ya tiene la majada, el molino australiano, el
  tanque y el corral, y **está mudo** (las ovejas son de Don Ramón, que vive en la otra punta del mapa). Con el pastor,
  la esquila tiene dueño, la lana y el cuero tienen vendedor, y la estepa tiene gente. Si se elige el puesto C, que
  pase ahí parte del día (la arriada hasta la estepa norte).
- **El arriero:** en el **Puesto del Paso (B, −350, −20)**, yendo y viniendo por el oeste entre la Parada del Mallín y el
  Puesto Alto, con caballos. Engancha con Don Ramón (son colegas), con los fletes (lleva carga) y con el evento ya
  escrito «se escapa la oveja de Ramón». Alternativa: sin casa propia, recorriendo el sendero (como Josefina).
- **El cantero:** en la **cantera (−405, −305)** y su puesto (A). Vende el pico de cantero, compra y vende piedra labrada,
  pide comida (pan, empanadas: el perfil «Parada Alta» ya lo dice).
- **Nicanor y Josefina:** se quedan donde están; se les suman pedidos y una tiendita (sección 3.1).

### 4.4 Rendimiento

Todo lo propuesto es **disperso**: cinco puntos de recurso fijos, de 3 a 5 puestos a más de 290 m de la plaza, 3
personas nuevas (una en un edificio que ya existe). **Nada nuevo en la plaza** salvo el tablón, que es un solo objeto
(un cartel con un panel). Los puntos de recurso deberían ser un objeto que «da N cada D días» y no cientos de matas.
Antes de cerrar el 1a: medir con `npm run medir:caminata` en la 4600G, sobre todo en la estepa (hoy vacía y barata) y
en el mallín.

### 4.5 ¿Partir el paquete 1a en dos? **Sí.**

El 1a tiene 4 herramientas, 5 recursos, 3 personajes, un tablón y 3–5 puestos con mercado. Propuesta:

- **1a-1 «Estepa y mallín»:** el pastor en el galpón, lana y cuero, el junco y las hierbas del mallín, la esquiladora y
  la hoz, **el tablón** (que es lo que les da valor a los recursos nuevos) y **un solo puesto** (C, la estepa) para
  probar la reparación por etapas y el mercado fuera del tren. Además, pedidos para Nicanor y Josefina. Es lo que más
  llena de una: la estepa es la zona vacía más grande.
- **1a-2 «Cantera, pehuenal y costa»:** el cantero y la cantera con el pico de cantero (y el cambio de nombre del pico),
  los piñones que vuelven en otoño, la arcilla y la pala, el arriero y los puestos A y B (y D si se quiere un apeadero).

Razón del orden: el 1a-1 toca menos cosas viejas (el pico de la 4.2 y sus pruebas quedan para el 1a-2) y prueba las
piezas nuevas (tablón, puesto reparable, recurso que se repone) con el menor riesgo.

---

## 5. Capturas

Todas en `auditoria-mapa/` (JPG de 1024 px de ancho). Calidad media, otoño, despejado, 11:30 salvo donde se dice.

| Captura | Qué se ve (mirada a tamaño completo) |
|---|---|
| [01-plaza-pueblo](auditoria-mapa/01-plaza-pueblo.jpg) | La aldea desde 8 m de alto: la plaza con los álamos, las casas, el predio de las fiestas. Densa; la plaza no admite más cosas |
| [02-pescaderia-seccional](auditoria-mapa/02-pescaderia-seccional.jpg) | Los locales del oeste de la calle (herrería, carpintería, pescadería, seccional) con humo en las chimeneas |
| [03-refugio](auditoria-mapa/03-refugio.jpg) | El Refugio del Arroyo solo en su claro, con el sendero y la bandera |
| [04-estacion-valle](auditoria-mapa/04-estacion-valle.jpg) | La Estación del Valle con el tanque de agua y la vía (un árbol tapa parte de la izquierda) |
| [05-muelle](auditoria-mapa/05-muelle.jpg) | El muelle y la orilla; Martina, la botera, chiquita junto al cartel |
| [06-cabana-pescador](auditoria-mapa/06-cabana-pescador.jpg) | Desde el agua: la cabaña de Nicanor sobre pilotes y el faro detrás. Las dos cosas están pegadas (32 m) |
| [06b-cabana-desde-tierra](auditoria-mapa/06b-cabana-desde-tierra.jpg) | Desde tierra; un árbol colorado tapa casi toda la cabaña. Nicanor no aparece en cuadro |
| [07-faro](auditoria-mapa/07-faro.jpg) | El faro rayado en la orilla sur del lago; detrás, la estepa |
| [08-cueva](auditoria-mapa/08-cueva.jpg) | La Cueva de las Manos: un peñón oscuro en la estepa abierta, con el faro a lo lejos |
| [09-galpon-esquila](auditoria-mapa/09-galpon-esquila.jpg) | El galpón con el molino australiano y el tanque; desde este lado no se ve la majada |
| [09b-galpon-corral](auditoria-mapa/09b-galpon-corral.jpg) | Desde el corral: **las ovejas de Ramón pastando**, el tren pasando al fondo. Nadie las cuida |
| [10-arrayanes](auditoria-mapa/10-arrayanes.jpg) | El bosquecito de arrayanes en la punta este del lago, rodeado de estepa; la vía a la izquierda |
| [11-mirador-pehuenal](auditoria-mapa/11-mirador-pehuenal.jpg) | La loma del mirador con la baranda y **un pehuén** grande; a la izquierda asoma el Puesto Alto |
| [12-puesto-alto](auditoria-mapa/12-puesto-alto.jpg), [12b](auditoria-mapa/12b-puesto-alto-cerca.jpg) | El Puesto Alto con humo y leña apilada. Don Ramón no está afuera en la toma |
| [13-mallin](auditoria-mapa/13-mallin.jpg) | El mallín desde arriba: la pradera, el arroyo, el puente de troncos y la torre a la derecha, todo en 60 m |
| [14-puente-troncos](auditoria-mapa/14-puente-troncos.jpg) | El puente sobre el arroyo, con nalcas en la orilla |
| [15-torre](auditoria-mapa/15-torre.jpg) | La torre de guardaparques al borde del bosque, el sendero y el arroyo |
| [16-molino](auditoria-mapa/16-molino.jpg) | El molino, la casita y el campo de tulipanes con su arroyito de piedras |
| [17-parada-mallin](auditoria-mapa/17-parada-mallin.jpg) | La Parada del Mallín, metida en el bosque (no se ve el mallín desde ahí: está a 140 m) |
| [18b-parada-arrayanes](auditoria-mapa/18b-parada-arrayanes.jpg) | La Parada Arrayanes, una casilla junto a la vía en el borde del bosque |
| [20b-cantera-de-cerca](auditoria-mapa/20b-cantera-de-cerca.jpg) | **El rincón rocoso del suroeste:** piedras sueltas chicas desparramadas en la ladera, entre lengas. No parece una cantera: hace falta un frente de roca |
| [21b-puesto-A-desde-arriba](auditoria-mapa/21b-puesto-A-desde-arriba.jpg) | **Sitio A:** un claro de pasto junto a la curva de la vía, con bosque alrededor. Entra un puesto chico |
| [22b-puesto-B-desde-arriba](auditoria-mapa/22b-puesto-B-desde-arriba.jpg) | **Sitio B:** la vía cruzando bosque cerrado; el lugar libre es una franja angosta al costado. Justo; habría que correrlo al este |
| [23-puesto-C-estepa-este](auditoria-mapa/23-puesto-C-estepa-este.jpg) | **Sitio C:** estepa abierta y plana con matas, la vía al fondo, un par de árboles sueltos. Mucho lugar y nada encima |
| [24-puesto-D-estepa-sur](auditoria-mapa/24-puesto-D-estepa-sur.jpg) | **Sitio D:** estepa pareja con la vía cruzando; nada en todo el cuadro |
| [25-puesto-E-estepa-norte](auditoria-mapa/25-puesto-E-estepa-norte.jpg) | **Sitio E:** estepa con el tren pasando y el lago a la derecha |
| [26-centro-vacio](auditoria-mapa/26-centro-vacio.jpg) | El centro: una pradera con el sendero y un ciervo; nada que hacer |
| [27b-desembocadura-desde-el-lago](auditoria-mapa/27b-desembocadura-desde-el-lago.jpg) | Desde el lago: la playa de la desembocadura, con el salto del arroyo al fondo. Buen lugar para la arcilla |
| [28-mallin-junco](auditoria-mapa/28-mallin-junco.jpg) | La franja del mallín junto al puente: el arroyo serpenteando entre pradera, nalcas y la torre. Lugar natural para junco y hierbas |
| [29-norte-vacio](auditoria-mapa/29-norte-vacio.jpg) | El norte: claro en el bosque, sin nada |
| [30-sureste-vacio](auditoria-mapa/30-sureste-vacio.jpg), [30b](auditoria-mapa/30b-sureste-ojos.jpg) | El sureste: estepa que sube a la quebrada del borde. Desde 25 m de alto (30) la niebla de la quebrada se ve como una mancha plana verde azulada; a la altura de los ojos (30b) no aparece |
| [31-estepa-ojos](auditoria-mapa/31-estepa-ojos.jpg) | La estepa del este a la altura de los ojos, a las 16: matas y la ladera del borde |
| [32-cantera-desde-arriba](auditoria-mapa/32-cantera-desde-arriba.jpg) | El rincón rocoso desde 40 m: bosque ralo de cipreses y lengas; las piedras casi no se ven |
| [33-pehuenal-de-cerca](auditoria-mapa/33-pehuenal-de-cerca.jpg) | El mirador de cerca: **Josefina** en el sendero con su sombrero, la baranda, el banco, los pehuenes y el Puesto Alto con humo |

---

## 6. Preguntas para el usuario

1. **¿Qué puestos de ruta?**
   (a) A, B y C (cantera, paso del oeste y estepa): uno por cada zona vacía grande. (b) C, D y E: todo en la estepa.
   (c) Los cinco. **Recomiendo (a)**, con D guardado para el día que el tren tenga un apeadero en el este.
2. **¿Partimos el 1a?** (a) 1a-1 «estepa y mallín» (pastor, lana y cuero, junco y hierbas, tablón, puesto C, pedidos
   para Nicanor y Josefina) y 1a-2 «cantera, pehuenal y costa» (cantero, pico, piñones, arcilla, arriero, puestos A y B).
   (b) Todo junto. (c) Otro corte (por ejemplo, primero el tablón y los puestos sin recursos nuevos). **Recomiendo (a).**
3. **Pescador y guardaparque:** ya existen en el valle (Nicanor y Josefina) pero no piden ni venden. (a) Darles pedidos y
   una tiendita a ellos. (b) Crear personajes nuevos. **Recomiendo (a)**: ya tienen modelo, rutina e historias.
4. **¿De dónde sale el cuero?** (a) Del pastor (su majada; se compra o se cambia). (b) Cazando guanacos. (c) Sacar el cuero
   y dejar sólo la lana. **Recomiendo (a)**: el guanaco hoy es fauna para mirar y fotografiar, y cazarlo choca con el tono.
5. **El pico:** el común ya se llama «Pico de cantero». (a) Renombrar el común a «Pico» y que el «pico de cantero» sea el
   nuevo, el único que trabaja la veta que se repone (cambia un texto y la prueba de la 4.2). (b) No tocar el común y llamar
   al nuevo de otra forma («barreta de cantero», «cuña y maceta»). **Recomiendo (a)**, que respeta lo que se decidió; si se
   quiere cero riesgo con las pruebas viejas, (b).
6. **Pago del tablón** (los pedidos del pueblo pagan $440–880 lo típico): (a) × 1,5 a menos de 350 m de la plaza, × 2 hasta
   550 m, × 2,5 más lejos, o sea **$700–2.200 por encargo**. (b) Un × 2 parejo. **Recomiendo (a)**, sabiendo que «lejos» son
   1–2 horas del juego (ver 1.3): el premio paga el viaje de ida y vuelta y, más adelante, la carga.
7. **Cuántos encargos:** (a) 3 a la vista por día, **1 entrega por día**, plazo de 2 días, aparte del tope de 2 pedidos de
   los vecinos. Suma ~$1.000–2.000 por día (+30 a 60 % sobre los $3.200). (b) 2 entregas por día (hasta +130 %: rompe el
   equilibrio). **Recomiendo (a).** Que el tablón lo atienda Benigno (la estafeta está en la plaza) es una opción linda.
8. **Reparar un puesto:** (a) 3 etapas de $3.000 más 10 tablas y 10 piedras en total (~3 días de ingreso); el puesto
   reparado con caja de $5.000 que se repone $700 por día, como una parada. (b) Más barato ($4.500) para que se use antes.
   **Recomiendo (a).** Los perfiles de mercado ya escritos y sin usar (Parada Alta, Parada del Mirador) sirven tal cual.
9. **Recursos que se reponen** (el molde del Desafío: «da N cada D días»): propuesta cantera 6 piedras cada 2 días (con
   el pico de cantero); mallín 3 de junco y 2 de hierbas por día; arcilla 4 cada 2 días; piñones: los 8 pehuenes vuelven a
   dar en cada otoño, 6 por árbol. **¿Te parecen bien de base?**
10. **El pehuenal:** la regla del código prohíbe cambiar cuántos árboles hay (`pruebas/verificar-3-3-bosque.mjs`). (a) Dejar
    los 8 pehuenes y que los piñones vuelvan cada otoño. (b) Sumar pehuenes (hay que cambiar esa prueba y el bosque).
    **Recomiendo (a).**

---

## 7. Lo que no se pudo ver

- **No hablé con nadie ni comercié:** charlas, pedidos, el panel del comercio y la feria son **leídos en el código**.
- **Don Ramón y Nicanor no salieron en cuadro**; los ubiqué con la posición que da el juego (Ramón a 3 m de su puerta,
  Nicanor a 3 m de la suya). **Josefina sí** (captura 33).
- Sólo **calidad media, otoño, 11:30** (y una toma a las 16). Ni invierno, ni noche, ni día de feria. En **alta** el
  galpón, la torre y el molino cambian de lugar (leído en el código), no lo vi.
- **No anduve en kayak, velero ni tren**: los tiempos son corriendo; el tren no lo medí.
- **No medí fps** (la ventana oculta no sirve para eso; hay que correr `npm run medir:caminata` en la 4600G).
- **El Desafío** no se revisó (allí el almacén y la casa de té están en el valle y hay cantera propia).
- **La mancha de la captura 30**: la vi sólo desde 25 m de alto y no en 30b; supongo que es la niebla de la quebrada, no
  lo investigué (no es parte de la auditoría).
- Las capturas salen con la cámara de fotos en la mano y el cartel «Hacé clic para volver a mirar alrededor» (la ventana
  oculta no captura el mouse); no tapan nada importante. Una salió por el lienzo, sin carteles (06b).
