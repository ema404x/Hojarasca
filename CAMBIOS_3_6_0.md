# Hojarasca 3.6.0 — La Aldea de los Duendes

Lo planificamos con el usuario antes de tocar código (`PLAN_ALDEA.md`). Él pidió un pueblo
"perfecto": que ya exista en el valle, empiece chico y crezca con la gente que llega, con
interiores, vida de pueblo, aspecto patagónico real y más gente. Es sólo del Relax.

## La aldea
- **Dónde**: escondida en la parada sur de la trochita, a 593 m del refugio, con la cordillera de
  fondo. La primera vez se llega en tren y queda anotada en el cuaderno. En el Relax la parada
  se llama "Aldea de los Duendes"; en el Desafío no hay aldea.
- **Al empezar** tiene:
  - la estación con su galpón y su cartel;
  - la **plaza**, con un duende tallado en un tronco de coihue, lajas, senderos con faroles,
    canteros, aljibe, mástil y álamos;
  - la **Biblioteca Popular**, en lugar de una capilla: el usuario no quiere nada religioso;
  - la escuela a medio hacer;
  - el **almacén de Ercilia** y la **casa de té**, que se mudaron del valle a la aldea (en el
    Desafío siguen donde estaban);
  - las casas del jefe de estación, Ercilia, Nélida, la abuela Herminia y la familia Jones.
- **Crece**:
  - Los 5 pobladores de la 3.1 y 6 nuevos llegan en tren, de a uno:
    - de la 3.1: carpintero, panadera, herrero, pescador y maestra;
    - nuevos: enfermera, telegrafista, tejedora, apicultor, guardaparque y músico.
  - Al aceptar a uno se abre la obra de su local, que tiene 4 etapas (cimientos, estructura,
    paredes y techo, terminaciones). Llevás tablas, piedras y troncos con E, y los vecinos
    trabajan: la etapa queda lista a la mañana siguiente.
  - Al terminar abre el local, el poblador vive ahí y te ofrece lo suyo una vez por día.
  - Aportar a las obras da oficio de constructor.
- **El primer viaje**: el encargo del hacha pasa a ser "Tomá la trochita a la Aldea de los
  Duendes y conseguite el hacha en el almacén", con una tarjeta que explica dónde subir.

## Se sacó el "fundar el pueblo" de la 3.1
Chocaba con la aldea:
- el poblador tenía dos casas posibles;
- había dos nombres y dos carteles;
- había dos estaciones de llegada;
- tus casas quedaban atadas a un poblador.

Se borraron `pueblo.js` y `pueblo-mundo.js`. Los personajes, sus servicios, el ritmo de
llegada, el filo del herrero y los oficios del jugador siguen. En las partidas viejas, los
pobladores que ya tenías se mudan solos a la aldea con su local abierto, y tus casas vuelven a
ser tuyas.

## La gente
- **Horarios**: cada vecino tiene su horario por hora del día y camina por las calles. Los
  locales abren a la mañana; se almuerza en casa; hay siesta en el almacén; los chicos van a
  la escuela; de noche se duerme. Los domingos la abuela lee cuentos en la biblioteca y los
  sábados hay baile en el salón.
- **Vida "tipo Sims sin exagerar"**: cada uno cumple su función, pero en su tiempo libre elige
  qué hacer según sus ganas y su forma de ser: té, plaza, visitar a un amigo, compras, leña,
  regar, palear la nieve, leer o jugar. También reacciona al clima.
- **Charla con menú**: "¿Cómo andás?", "Novedades" (fauna vista, lo que pasó en la aldea) y
  "Tu historia". Además:
  - **regalar**: cada uno tiene gustos;
  - **invitar a tomar algo**: mate en tu mesa o té en la casa de té;
  - **dar una mano** en su oficio.
- **Amistad**: conocido, amigo o compadre, sin números. El compadre te visita y a veces te deja
  un regalo.
- **Memoria**: comentan tus truchas grandes, lo que talaste, tus aportes, tus fotos de fauna.
- **Charlas entre vecinos** cuando pasás cerca: 30 charlas con distintos temas.

## Cada lugar con algo para hacer
- Sentarte en bancos y sillas: 64 asientos.
- **Plaza**:
  - el aljibe;
  - la bandera, que se iza a las 8 y se arría a las 19;
  - la plaquita del duende.
- **Biblioteca**:
  - leer 14 libros (leyendas, historia del valle y del ferrocarril, flora y fauna), que suman
    al cuaderno en la sección "De la aldea";
  - pedir uno prestado;
  - los cuentos del domingo.
- **Escuela**: el pizarrón y los dibujos de los chicos, con lo que anotaste.
- **Estación**: la campana del andén cuando llega el tren y el horario de trenes.
- **Locales**:
  - chispas en la fragua;
  - humo en el horno;
  - la rueca que gira;
  - abejas;
  - el martillo y la sierra.
- **Otros servicios**:
  - la camilla del puesto sanitario;
  - tu casilla de correo;
  - el mapa del valle de la seccional;
  - calentarte en las estufas.
- **Sonido**: murmullo en la plaza y perros a lo lejos.

## Gráficos
- Edificios con interior caminable, en el estilo HushWood con la Patagonia real. Por fuera:
  - chapa acanalada con óxido y musgo;
  - tablas con juntas y veta;
  - zócalo de piedra laja;
  - galerías;
  - ventanas hundidas con cortinas;
  - canaletas;
  - cables.

  Por dentro: machimbre, pisos gastados, estufas y muebles de cada oficio.
- El detalle de las superficies se dibuja en el shader, sin geometría extra: cuesta unos
  0,03 ms por cuadro.
- Ripio con piedritas y huellas de ruedas, charcos después de la lluvia, nieve en los techos y
  no adentro, humo que sube con el viento, faroles y ventanas cálidas de noche.
- Lotes con estacas e hilo, frutales y cercos en el borde de la aldea, álamos cortaviento con
  las hojas pintadas del bosque.

## Rendimiento (medido contra la 3.5.4 en la misma PC: Ryzen 5 4600G con Radeon integrada)
- **Fuera de la aldea, igual que la 3.5.4**: refugio, bosque, Estación del Valle y todo el Desafío
  dentro de ±0,3 ms por cuadro (por ejemplo, refugio en alta 10,1 → 10,2 ms; bosque 10 → 10 ms).
  Desde el refugio la aldea no suma nada: queda fuera de la distancia de dibujo.
- **En la aldea**: la plaza de día, 3,3 ms por cuadro (172 dibujos); la aldea completa de noche,
  unos 12,8 ms en alta y 11,3 en media (258 dibujos), con 4 luces encendidas como máximo.
- **Optimización final**: el humo de las chimeneas de día (casi invisible) se seguía pintando y
  costaba muchísimo cerca de una chimenea: ahora no se dibuja si no se ve (plaza de día: de 13,3 a
  3,3 ms). La gente de la aldea, sus luces y las mecánicas ya no arman nada nuevo en cada cuadro;
  las luces de un edificio rearmado se sueltan; código repetido unificado.
- **Carga**: 115–140 ms más que la 3.5.4 con las cachés hechas. Las texturas del ripio y los
  carteles se preparan en la portada. La primera carga de todas (sin cachés) tarda 0,8–0,9 s más:
  son los programas de la aldea, que se compilan al cargar para que no haya tirones jugando.
- **Memoria**: en el Relax arranca unos 30 MB más arriba (la aldea) y en una sesión larga crece
  igual que la 3.5.4; el Desafío, igual. Perder y recuperar los gráficos no acumula memoria.

## Arreglos de último momento
- Al mostrador del almacén o de la biblioteca, un vecino parado ahí (un cliente, la que atiende) ya no te
  tapa la E: gana lo del lugar, para hablarle hay que mirarlo de frente, y en su menú también está
  lo del lugar ("Ver qué hay en el almacén", "Devolver el libro").

## Pruebas
- Gate 140/140 y las 53 partidas reales en verde. Al gate se sumaron 8 pruebas: aldea, gente, arquitectura, vecindad, vida, mundo, mecánicas y
  oficios (este último reemplaza a la vieja del pueblo).
- También 5 partidas reales nuevas: `humo-3-6-aldea`, `humo-3-6-vida`, `humo-3-6-mundo`,
  `humo-3-6-mecanicas` y `humo-3-1-oficios`.
