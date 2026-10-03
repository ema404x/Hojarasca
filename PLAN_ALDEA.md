# Plan: Aldea de los Duendes (3.6)

Planificado con el usuario el 03-10-2026. Decisiones de él: el pueblo **ya existe** en el valle,
**escondido** en la parada del sur; **empieza chico y crece**; edificios **con interior**, **vida de
pueblo**, **aspecto patagónico real**, **más gente**; **sólo Relax**; los pobladores de la 3.1
**viven en el pueblo**; crece cuando **llega alguien y vos ayudás a levantar su local**; el nombre
es **Aldea de los Duendes**. Sigue valiendo lo de la 3.1: nadie consume ni se va (sin economía
del pueblo, que el usuario rechazó).

## 1. Lugar
- Parada chica del sur de la trochita: **(40.3, -339.1)**, altura ~25, a **593 m del refugio**.
  49% de terreno parejo en 90 m a la redonda, nada construido cerca, la cordillera de fondo.
- La parada pasa a ser **Estación Aldea de los Duendes** (andén, cartel, galpón chico).
- La primera vez se llega en la trochita (o caminando largo) y se descubre: entrada al cuaderno
  en "lugares".
- Coordenadas **fijas**, elegidas sólo por el terreno: no dependen del bosque (el almacén, el
  molino, la torre y el galpón se mueven según la calidad gráfica; la aldea no).

## 2. Cómo es al empezar (día 1): unos 9 edificios
- Estación con cartel y banco.
- **Plaza**: mástil, bancos, faroles, un duende tallado en un tronco (el que le da el nombre).
- **Biblioteca popular** frente a la plaza (estanterías, mesas de lectura, estufa a leña). El usuario no quiere nada religioso: sin capilla, cura ni misa (03-10).
- **Almacén de ramos generales** con su almacenera.
- **Escuela** (cerrada hasta que llega la maestra).
- **3 o 4 casas** habitadas desde el principio por vecinos de la aldea: el jefe de estación, la
  almacenera, una abuela que cuenta la leyenda de los duendes, una familia con chicos.
- Calles de ripio, veredas de tablas, cercos de palo, pirca, hileras de álamos cortaviento.

## 3. Cómo crece
- Los pobladores de la 3.1 (carpintero, panadera, herrero, pescador, maestra) **bajan del tren
  en la aldea**. Ya no hace falta construirles una casa.
- Cuando aceptás a uno, se marca su **lote** en la aldea y se arma una **obra del pueblo**: llevás
  tablas, piedras y troncos, y en unos días se levanta (los vecinos trabajan en la obra). Al
  terminar abre su local (panadería, herrería, carpintería, pescadería, escuela) y vive ahí.
- **Gente nueva** (6), cada uno con oficio, local, casa e historia:
  enfermera (puesto sanitario), telegrafista (estafeta y correo), tejedora (hilandería, se
  conecta con el telar), apicultor (sala de miel, con la colmena), guardaparque (seccional, con
  la fauna del cuaderno) y un músico (toca en la plaza los sábados a la tarde).
- Al final: unos 25 edificios. El ritmo de llegada usa lo que ya existe (días entre llegadas y
  cuaderno anotado).
- **Partidas viejas**: la aldea aparece en su etapa inicial. Los pobladores que ya viven en una
  casa tuya se quedan ahí, y su local en la aldea aparece abierto.

## 4. Interiores
- Se entra caminando (sin pantalla de carga), como el almacén y la casa de té.
- Cada local con muebles de su oficio, la persona trabajando adentro y luz cálida: horno y
  mostrador de la panadería, fragua y yunque, banco de carpintero, redes y cajones, pupitres y
  pizarrón, estanterías y mesas de lectura de la biblioteca, estanterías del almacén.
- Paredes, pisos y choques salen de la misma declaración (`piezas.js`).

## 5. Vida de pueblo
- **Horarios por hora** (nuevo: hoy la gente sólo recorre una ruta en vuelta): abren a la
  mañana, almuerzan en casa, plaza a la tarde, luces de las casas a la noche, duermen.
- Vecinos que charlan entre ellos; si pasás cerca, escuchás la charla.
- Chicos jugando en la plaza a la salida de la escuela; perros y gallinas sueltos.
- Humo en las chimeneas, leña apilada, ropa colgada.
- Por estación: nieve en los techos, faroles prendidos temprano en invierno.
- Domingo a la mañana: la abuela lee cuentos (y la leyenda de los duendes) en la biblioteca. Sábado: música en la plaza.

## 6. Aspecto patagónico real (con el acabado HushWood)
- Chapa acanalada de colores (rojo óxido, verde, azul), tablas y tejuelas de alerce, zócalo
  de piedra laja, galerías con postes, cercos de palo, pirca, álamos.
- Cartelitos pintados a mano en cada local.
- Duendes sólo como tradición del lugar (tallas en madera, la leyenda, puertitas en raíces):
  nada mágico de verdad.

## 7. Técnico (lo que no se puede romper)
- **Terreno**: no tocar `calcularTerreno` ni `LUGARES` (huella de `verificar-2-2`). La aldea se
  empareja **después** de armar la vegetación (si no, cambia la lista de árboles y se rompen
  los talados guardados), luego `despejar` y recién ahí la malla y las texturas del suelo.
- **Árboles**: sólo `veg.despejar` (los índices no cambian). Los álamos de la aldea son geometría
  propia, no entran en la lista de árboles.
- **Azar propio** (semilla de la aldea): no sumar llamadas a `rng(31)` de `estructuras.js`, que
  movería todos los sitios que vienen después.
- **Rendimiento**: a 593 m del refugio la aldea queda fuera de la distancia de dibujo de todas
  las calidades (no suma nada desde el refugio). En la aldea: cada manzana en una sola pieza,
  muebles y gente de adentro sólo a menos de ~25 m, ventanas que brillan sin gastar luces (el
  motor tiene 4 puntuales + 1 foco), pocas puertas con choque dinámico. Medir en la plaza:
  menos de 520 dibujos por cuadro y cuadros no peores que en el bosque.
- **Guardado**: `progreso.aldea` (lotes, aportes, etapa de cada obra, quién vive dónde) con su
  saneador puro, como `pueblo.js`.
- **Sólo Relax**: en el Desafío la parada del sur sigue siendo chica, sin aldea.
- Inglés: al final, como siempre.

## 8. Pruebas
- `verificar-3-6-aldea.mjs` (Node): crecimiento, lotes, aportes, horarios, guardado y partidas
  viejas.
- `humo-3-6-aldea.cjs` (Electron): llegar en tren, entrar a cada edificio, puertas y choques,
  horarios a 4 horas del día, aceptar un poblador y levantar su obra, dibujos por cuadro.
- Capturas para el usuario en cada etapa.

## 9. Entregas
- **3.6.0 — La aldea**: el lugar, la estación, los 9 edificios con interior, los vecinos de la
  aldea, horarios y vida, aspecto. Tres equipos en paralelo: edificios e interiores; gente y
  horarios; lugar, terreno, guardado y pruebas.
- **3.6.1 — Crece**: los pobladores se instalan en la aldea, obras del pueblo con aportes, los 6
  nuevos con sus locales.

## 10. Se saca el "fundar el pueblo" de la 3.1 (pedido del usuario, 03-10)
El usuario pidió sacar la mecánica vieja para que no choque con la aldea. Lo que chocaba:
- **Dos casas para el mismo poblador**: la 3.1 lo muda a una casa construida por vos
  (`pobladores[].casa`) y su rutina va ahí; la aldea le levanta su local. Rutinas, charla y
  guardado apuntarían a dos lugares.
- **Dos nombres y dos carteles**: el pueblo con nombre puesto por vos (`nombrarPueblo`, cartel,
  `T.lugares['pueblo-propio']` en el mapa) contra "Aldea de los Duendes".
- **Dos estaciones de llegada**: la 3.1 espera la trochita en la Estación del Valle y pide una
  casa libre tuya; la aldea los recibe en la parada del sur.
- **Tus casas atadas a un poblador**: desarmar o mover una casa con alguien adentro
  (`casaOcupada`, `mudarDatosDeObra`) y la casa que deja de contar como "libre".
- Textos viejos: el evento del viajero ("con una casa libre, llega en el próximo tren"), la
  ficha "Tu pueblo" del cuaderno con casas libres, la plaza alrededor del cartel.

Qué se saca: buscar casas libres, mudar a tus casas, ponerle nombre, el cartel y el lugar del
mapa, la ficha vieja. Qué se queda (y pasa a la aldea): los 5 personajes con sus diálogos y sus
servicios del día, el ritmo de llegada (días y cuaderno), el evento que llama al próximo, el
filo del herrero. Los **oficios** del jugador (hachero, pescador…) no son del pueblo: siguen.

**Partidas viejas**: los pobladores que ya tenías se mudan solos a la aldea con su local ya
levantado; tus casas quedan libres (vuelven a ser tuyas); el nombre viejo se descarta.
`progreso.pueblo` se convierte en `progreso.aldea` al cargar.
Se reescriben `verificar-3-1-pueblo.mjs` y `humo-3-1-pueblo.cjs` como pruebas de la aldea.

## 11. Cómo se ejecuta (una sola versión: 3.6.0)
Sacar lo viejo y dejar a los pobladores sin dónde llegar no puede quedar a mitad: la 3.6.0 lleva
todo (la aldea y su crecimiento).
- Fase 1, en paralelo: **núcleo** (`src/aldea.js`, puro: plano, reglas, horarios, guardado,
  migración) y **arquitectura** (`src/aldea-arquitectura.js`: cada edificio con su interior y
  las etapas de obra, sin ubicar en el mapa).
- Fase 2, en paralelo: **mundo** (ubicar, terreno, estación, luces, rendimiento), **gente**
  (horarios, vecinos, pobladores nuevos, charlas) e **integración** (sacar lo viejo, obras del
  pueblo con E, cuaderno, mapa, comercio, pruebas).
- Fase 3: unir, suite completa, capturas, zip y GitHub.

## 12. El almacén y la casa de té se mudan a la aldea (usuario, 03-10)
- **Relax**: el almacén de Ercilia y la casa de té de las galesas (los de siempre, mismo
  edificio de `estructuras.js`) se arman en la aldea. El almacén ocupa el lugar del almacén
  nuevo que estaba planeado. En el valle, donde estaban, no queda nada, pero el sorteo de sitios
  (`rng(31)`, `buscarLlano`, `registrarHuella`) corre igual, para que la torre, la cueva y el
  galpón no se muevan.
- **Ercilia** atiende el almacén en la aldea; **Nélida** es su ayudante. La casa de té tiene
  quien la atienda.
- **Desafío**: los dos quedan en el valle como hoy (el almacén es un lugar del asedio).
- Hay que revisar todo lo que daba por hecho el almacén en el valle: visitas a tu mesa,
  eventos de Ercilia ("ir al pueblo"), encargos, cartas, la historia, las pistas del cuaderno y
  el nombre de la parada "Apeadero de la Casa de Té" con su comercio guardado.

## 13. Vecinos con más vida, "tipo Sims sin exagerar" (usuario, 03-10)
Cada uno sigue cumpliendo su función (abre su local en hora), pero alrededor tiene vida propia.
- **Autonomía**: fuera del trabajo cada vecino elige qué hacer según sus ganas y su forma de
  ser (té, plaza, visitar a un amigo, compras en el almacén, leña, regar), sin barritas a la
  vista. Reaccionan al clima (galería con lluvia, palear nieve, plaza en días lindos). Tienen
  amistades entre ellos, que guían quién visita a quién y quién charla con quién.
- **Interacción** al hablarle (elegido por el usuario: las cuatro):
  1. Charlar de varios temas: cómo anda, novedades (fauna vista, lo que pasó en la aldea),
     su historia.
  2. Regalarle algo: cada uno tiene gustos y lo que le gusta suma amistad.
  3. Invitarlo a tomar algo: mate en tu mesa o té en la casa de té; camina con vos, se sienta
     y charla.
  4. Ayudarlo en su tarea: una ayuda chica de su oficio que suma amistad.
- **Amistad sutil**: tres niveles (conocido, amigo, compadre) que se ven en el cuaderno, sin
  barras ni números. Con más amistad te saludan por tu nombre, te cuentan su historia
  completa, te visitan en el refugio y a veces te dejan un regalo.
- **Memoria**: comentan lo que hacés ("vi que pescaste una trucha enorme", "gracias por las
  tablas de la obra"), el último regalo y tu ayuda en las obras.
- Vale para todos los vecinos del Relax (los de la aldea, los pobladores y los de siempre:
  Ramón, Nicanor, Ema, Ercilia, Elsa); la autonomía completa es de la gente de la aldea, y los
  del valle mantienen su lugar.
- Se hace en dos partes: el módulo puro `src/vecindad.js` (ganas, gustos, amistad, memoria,
  temas) ya, en paralelo, y la conexión con el juego después de la fase de gente.

## 14. Detalles y mecánicas de cada cosa, optimización y rendimiento (usuario, 03-10)
"Trabajá en los detalles también y las mecánicas de cada cosa. Además, al final optimizá el
código y verificá el rendimiento." Después de unir mundo, vida y pulido:
- **Cada lugar con algo para hacer** (sin economía nueva, con los sistemas que ya existen):
  - **Plaza:** sentarse en los bancos; sacar agua del aljibe (llena la cantimplora o el balde si
    existen); la bandera que se iza a la mañana y se arría a la tarde; el duende tallado con su
    plaquita (entrada al cuaderno).
  - **Biblioteca:** sentarse a leer un libro (una página de la leyenda o de la historia del
    valle, que suma al cuaderno); pedir un libro prestado; los cuentos del domingo con la
    abuela, para escucharlos sentado.
  - **Escuela:** el pizarrón con lo que enseñó la maestra ese día (algo del valle); los dibujos
    de los chicos en la pared, que cambian con lo que anotaste.
  - **Estación:** la campana del andén cuando llega el tren; el horario de trenes en un pizarrón.
  - **Casa de té:** sentarse a la mesa y que la galesa traiga el té.
  - **Almacén:** el mostrador de siempre.
  - **Locales:** cada uno con un gesto de su oficio que se puede mirar o ayudar: la fragua que
    chisporrotea, el horno que humea a la mañana, la rueca que gira, las colmenas con abejas,
    la sierra del carpintero, las redes al sol.
  - **Salón:** el sábado se baila, con la música del músico.
  - **Puesto sanitario:** descansar en la camilla.
  - **Estafeta:** las casillas con tus cartas.
  - **Seccional:** el mapa del valle con lo que te falta ver.
  - **En todos:** estufas a leña donde calentarse (si el frío existe en el juego), sillas y
    bancos donde sentarse, puertas que se abren.
- **Detalles vivos**:
  - sonidos propios (la fragua, el horno, las abejas, la campana, el murmullo del salón);
  - humo, chispas y vapor;
  - luces que se prenden de noche;
  - gente que usa las cosas (el panadero amasa, el herrero martilla).
- **Al final**:
  - optimizar el código de la 3.6: duplicados, lo que se calcula de más por cuadro, memoria al
    rearmar los lotes, listeners;
  - medir el rendimiento en la aldea y en el resto del juego contra la 3.5.4: dibujos,
    triángulos, ms por cuadro, carga inicial, memoria tras una sesión larga.
