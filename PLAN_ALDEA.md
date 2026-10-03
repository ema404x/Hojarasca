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
- **Capilla** de madera con campanario (la campana suena el domingo a la mañana).
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
  pizarrón, bancos y altar de la capilla, estanterías del almacén.
- Paredes, pisos y choques salen de la misma declaración (`piezas.js`).

## 5. Vida de pueblo
- **Horarios por hora** (nuevo: hoy la gente sólo recorre una ruta en vuelta): abren a la
  mañana, almuerzan en casa, plaza a la tarde, luces de las casas a la noche, duermen.
- Vecinos que charlan entre ellos; si pasás cerca, escuchás la charla.
- Chicos jugando en la plaza a la salida de la escuela; perros y gallinas sueltos.
- Humo en las chimeneas, leña apilada, ropa colgada.
- Por estación: nieve en los techos, faroles prendidos temprano en invierno.
- Domingo: campana y gente en la capilla. Sábado: música en la plaza.

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
