# Plan 3.7 — La aldea crece, Amor, Cocina, La trochita y Tradiciones

Planificado con el usuario en charla el 05-10-2026 (todas las decisiones son suyas). Se ejecuta en 5 versiones, una detrás de otra. Reglas que siguen valiendo: nada religioso, sin economía nueva (trueque y servicios sí), sólo Relax, inglés al final.

## 3.7.0 — La aldea crece
- Llegan 8 pobladoras nuevas, intercaladas con los 11 de la 3.6, en una calle nueva que sube hacia la loma:
  - Ayelén Catriel, veterinaria;
  - Sofía Haddad, fotógrafa;
  - Rocío Lagos, guía de montaña;
  - Inés Ancalao, herbolaria (frutos del monte y pistas de flora);
  - Abril Moretti, pintora;
  - Malena Jones, ceramista y prima de Mario;
  - Martina Roldán, la del varadero (vive en la loma, trabaja en el muelle);
  - Valentina Ruiz Díaz, astrónoma.
- Llega también Pocha Benítez, modista viuda: forma la pareja fija con Anselmo y nunca es candidata del jugador.
- Ema pasa a llamarse **Josefina** (el id interno queda igual). Es compañera guardaparque de Julia: Josefina recorre el valle y Julia atiende la seccional.
- Cumpleaños de los vecinos, visitantes en el tren, animales de la aldea y una mascota adoptada.
- Las casas suman un cuarto cuando nace alguien.
- El jugador se gana un apodo y recibe visitas de su familia.
- Los chicos crecen una etapa por año. De grandes toman el oficio de con quien más estuvieron, el que guía el jugador con sus hijos, o se van a estudiar y vuelven.

## 3.7.1 — Amor en la aldea
- Romance con las pobladoras adultas solteras. Nunca con chicos ni casados. El personaje del jugador es hombre.
- Coquetear y declararse (ella puede decir que no). Citas.
- Se puede salir con más de una a la vez, pero el chisme corre y se enojan.
- Ñiki ñiki estilo Sims, sin mostrar nada: da descanso y buen ánimo.
- Anillo hecho por Anselmo con un canto rodado. Casamiento civil.
- Vivir juntos en el refugio o en la casa de ella, a elección.
- Habilidades que aprende el jugador según con quién se casa: hasta 3 niveles, uno por estación.
- Hasta 2 hijos.
- Separación si la descuida mucho: los hijos viven con ella y lo visitan. Se puede reconquistar.
- Ajuste para apagar todo el romance.
- Decidido el 06-10 (al hacer el núcleo): candidatas = las 8 pobladoras de la 3.7.0 + Nélida, Ceinwen, Marta y Julia (siempre adultas y solteras; nunca Pocha ni chicos); el romance viene encendido; hijos sólo casados (y si lo hablan); separado sigue contando como casado (no hay romance con otra hasta reconquistarla, no hay divorcio); habilidades "las dos cosas": niveles 1 y 3 rinden algo cada mañana y el nivel 2 es una mejora permanente del jugador según el oficio de ella.

## 3.7.2 — La cocina
- Cocinar en pasos con tiempo, en parrilla con cruz, horno de barro o cocina a leña.
- Asado y cordero, mermeladas, dulce de leche, pan, empanadas, curanto, locro, chocolate.
- Ingredientes de dos fuentes:
  - por trueque con vecinos y almacén;
  - producidos por el jugador: vaca lechera, corderos, chanchos y frutales.
- La comida no se echa a perder.

## 3.7.3 — La trochita (inspirada en el tren de Forest Escape: Last Train; sólo el tren)
- Locomotora: caldera y freno por niveles; farol para la noche y silbatos a elegir; quitanieves (abre la vía en la gran nevada) y arenero (no patina con lluvia o hielo); pintura, guardas, banderines y nombre.
- Vagones: pasajeros con salamandra (viajás calentito, descansás, los vecinos viajan y charlan); comedor (cocinar y matear en viaje, con la cocina de la 3.7.2); carga (más fletes) y para el caballo; mirador abierto para fotos; dormitorio para hacer noche donde quieras.
- Taller ferroviario: galpón junto a la estación de la aldea; llevás materiales, el herrero forja las piezas de hierro y las arman Ernesto (jefe de estación) y Martín, un maquinista retirado nuevo en la aldea, en unos días (como las obras del pueblo).
- Sin combustible: la locomotora anda sola, como ahora.
- **Diseño aprobado por el usuario** ("me encanta"): prototipo en la rama `proto-tren` (`?debug=1&tren=proto`, `src/tren-proto.js`, capturas en `pruebas/salidas/proto-tren/`): Baldwin a vapor "La Hojarasca" con ténder de leña, 13 dibujos (antes 63). Pulir al pasarlo al juego: andenes cortos para 70 m de tren (alargar o limitar vagones), interiores apagados de lejos, el caballo de la jaula es el tuyo, más luz en el dormitorio de noche, poses de Ernesto y Martín, colisiones del taller, el desvío al taller sin cambio de vía, brillo del farol sobre las copas.

## 3.7.4 — Tradiciones
- Fiestas por estación, con baile, juegos, jineteada y mesa larga.
- Día de la aldea, fechas patrias o de calendario, minga, truco y noche de la leyenda.
- Nevada solidaria.
- Radio por horarios, diario de la aldea y cartas de familiares y de antiguos habitantes.
- Taller en el refugio (lo que enseñan los amigos), fútbol que se juega, huerta comunitaria.
- Concursos (dulce, trucha, poncho, foto) con cinta y un regalo útil.
- 12 duendes escondidos, la talla del jugador en la plaza, el cuaderno en la biblioteca, títeres, fuerte del bosque.

Además entran todos los detalles de la charla (1–20) y las ideas 21–32: calendario en el cuaderno, ajuste de ritmo de la aldea, ropa por estación, recetario, lugar favorito de cada pobladora, cumpleaños del jugador, casa en la aldea, sulky, los 90 de la abuela, tren de fiesta, etc.

## Personajes: estilo P
El usuario eligió la variante **P**, prototipo en la rama `proto-personajes` detrás de `?personajes=P`:
- base S/M estilo Sims Medieval;
- atlas pintado por código (2048) con telas, guardas patagónicas, piel pintada y plata;
- costo de +1 ms con 30 personas.

Pulidos pendientes:
- colgantes del trarilonko;
- trenzas finas;
- expresión neutral de Inés;
- más pincelada en la piel;
- guardas en cuello y mangas;
- el resto de los vecinos.


## Detalles y extras elegidos (todos)
- Calendario en el cuaderno (cumpleaños, fiestas, fechas, aniversario, día de la aldea) con aviso el día antes.
- Ajuste "ritmo de la aldea" (tranquilo / normal / animado) para eventos, chismes y visitas.
- Ropa por estación; rendimiento medido en cada versión (unas 30 personas: sólo se animan las cercanas).
- 3.7.0: escena de llegada de cada pobladora con su objeto; los chicos cambian de verdad por etapa.
- 3.7.1: lugar favorito de cada una (declararse/proponer); ramos de flores y cartas de amor por el correo; en público se nota la pareja; ñiki ñiki sólo con los hijos dormidos en su cuarto; chisme con humor en la radio y el diario.
- 3.7.2: recetario en el cuaderno; el humo del asado atrae vecinos y al perro (que roba un chorizo); alacena que se llena; nada se pudre; con lluvia el asado necesita techito.
- 3.7.4: música de cada fiesta (chamamé, loncomeo, folklore del sur); invitados de otras paradas; recuerdo de cada fiesta para colgar; fotos de la fiesta al álbum y al concurso.
- Más: cumpleaños del jugador (fiesta sorpresa); casa propia en la calle de la loma; el camino refugio–aldea con minga, faroles y un sulky; cartas de la aldea si no vas; chinchón, damas y taba; clases de baile con Pocha (chamamé, chacarera); club de lectura; noche de estrellas abierta con Valentina; campamento con tus hijos; huerta de los chicos en la escuela; los 90 de la abuela; tren especial de fiesta.

## Personajes: estilo P (elegido por el usuario)
Prototipo en la rama `proto-personajes` (`?personajes=P`, `src/gente-proto.js`, `src/gente-proto-atlas.js`): base S/M a lo Sims Medieval + atlas pintado por código (telas, guardas patagónicas, piel pintada, plata), +1 ms con 30 personas. Pulidos pendientes: colgantes del trarilonko, trenzas finas, expresión neutral de Inés, más pincelada en la piel, guardas en cuello y mangas, ropa propia de cada vecino, talla de Lucía en aldea.js, liberar los huesos compartidos. Los personajes nuevos de la 3.7 nacen en este estilo.
