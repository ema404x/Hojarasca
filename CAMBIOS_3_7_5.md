# Hojarasca 3.7.5 — Tradiciones

Última versión del plan de la 3.7 (`PLAN_3_7.md`). Sólo Relax; nada religioso; sin economía nueva (trueque y
servicios). Tres equipos en paralelo (ramas `v375-fiestas`, `v375-noticias`, `v375-rincones`) y una rama de
integración. El usuario aprobó todas las decisiones de detalle como las recomendaron los equipos (07-10).

## Fiestas y fechas (`fiestas.js`, `fiestas-juego.js`, `fiestas-mundo.js`, `truco.js`, `juegos-mesa.js`)
- **Calendario del año (12 días):** Fiesta de la Fruta Fina (2), Día de la Aldea (4), Fiesta de la Cosecha (6),
  minga (7), 25 de Mayo (8), noche de la leyenda (9), 9 de Julio (11), Fiesta de la Nieve (12); la nevada solidaria
  (un día entre el 9 y el 10, si es invierno de verdad), tu cumpleaños (día 3) y los 90 de la abuela.
- **El predio de la fiesta**, junto a la estación: ruedo con palenque, tarima y pista de tablas, mesa larga,
  fogón con troncos, mesita de juegos y cancha de taba.
- **Fiestas por estación:** invitados de otras paradas (2, 3 o 5 según el ritmo) y el tren de fiesta con banderines;
  la mesa larga con el menú de la fiesta; la **jineteada** (8 s, A/D, verano y otoño); el **baile** con el músico en
  la tarima y su instrumento, parejas que bailan chamamé o chacarera y el público que aplaude; **música por
  código** (acordeón, guitarra, bombo legüero, violín, quena).
- **Día de la Aldea y fechas patrias:** acto en el mástil, locro y peña. **Minga:** una obra por año (leñera, el
  camino refugio–aldea, los bancos del fogón). **Noche de la leyenda:** fogón y tres leyendas propias (el calafate,
  el cuero, el Nahuelito). **Nevada solidaria:** palear puertas y llevar leña. **Tu cumpleaños:** fiesta sorpresa
  con al menos 2 amigos.
- **Truco de verdad** (mano a mano, a 15, sin flor: envido, real y falta envido, truco, retruco, vale cuatro,
  pardas, irse al mazo); "Jugar un truco" de la rueda de la 3.7.4 abre el partido real. **Chinchón** (a 50),
  **damas** a la española y **taba**.
- **Clases de baile con Pocha** (chamamé y chacarera, 3 niveles), **recuerdos** de cada fiesta para colgar en el
  refugio y una **foto** por fiesta al álbum.

## Noticias, calendario y concursos (`noticias.js`, `calendario.js`, `concursos.js`, `noticias-juego.js`, `concursos-juego.js`)
- **Radio Comunitaria del Valle, FM 89.5** (la conduce Chiche desde la estafeta): el tiempo (7–9), noticias del
  valle (9–12), música del sur (12–14), el chisme (14–17), avisos (17–20); de noche, la radio de siempre.
- **Diario "La Hoja de los Duendes"** cada 4, 3 o 2 días según el ritmo, en la pestaña Noticias del cuaderno.
- **Cartas de lejos** (mamá, tía, abuelo, hermano y antiguos habitantes del valle) por el correo de Benigno.
- **Calendario** con fiestas, aniversarios, concursos, club y estrellas, con aviso el día antes.
- **Concursos** dentro de las fiestas: trucha (verano), dulce (cosecha), poncho (nieve) y foto (Día de la
  Aldea). Nélida atiende la mesa en la plaza; a las 17 un jurado de 3 vecinos da la cinta azul, roja, blanca o la
  verde de mención; los vecinos también compiten; regalo útil para los tres primeros.
- **Club de lectura** (miércoles, con la abuela) y **noche de estrellas** (sábados, con Valentina).

## Rincones, juegos y la casa (`rincones*.js`, `futbol.js`, `sulky.js`, `casa-propia.js`)
- **12 duendes tallados** escondidos (7 en el valle, 5 en la aldea); la abuela da pistas; al encontrar los 12,
  **Tito talla tu figura** para la plaza. **Tu cuaderno en la biblioteca** con 40 anotaciones.
- **Taller en el refugio:** 8 amigos te enseñan una manualidad cada uno (pan, dulce, afilar, poncho, tablas,
  calafates, jarro, cuadrito).
- **El potrero** (pasando la pescadería) con pelota que rueda y rebota: picado a 2 goles con chicos y vecinos.
- **Huerta comunitaria** (calle Norte, mitad de la cosecha para vos) y **huerta de los chicos** en la escuela.
- **Títeres** en la plaza (16 a 19,5), **fuerte del bosque** con los chicos y **campamento con tus hijos**.
- **Tu casa en la calle de la Loma** (2 amigos, 20 tablas, 12 troncos, 16 piedras): lote, obra y casa con interior.
- **El camino refugio–aldea** con puentecito de troncos; con la minga se ensancha, se prenden 20 faroles y el
  **sulky** (lo hace Tito, lo tira tu zaino) anda más rápido.
- **Ropa por estación:** verano en mangas de camisa, otoño con bufanda.

## Integración
- El destino del concurso le gana al de la fiesta (Nélida atiende la mesa; después del fallo vuelven al predio).
- La minga del camino llama a `rinconesJuego.mingaDelCamino()`.
- Partidas viejas que caían en días de fiesta, con su día de prueba corrido (comentado).

## QA
- `npm run verify`: 165 de 165.
- Partidas reales: 62 de 68 en verde (de a 4). **Sin verificar (no se repitieron solas por pedido del usuario):** humo-2-8-compas, humo-3-0-asedio, humo-3-5-4-caos (47 fallas), humo-3-7-2-granja (7 fallas), humo-3-7-4-rueda (falla con el monitor externo apagado) y humo-relax-2. Lo primero en la próxima sesión: repetirlas solas; granja y caos pueden ser fallas reales de la integración.

## Queda para después
- Los 90 de la abuela sin mesa propia; la olla popular de la nevada sólo nombrada; el tren de fiesta no lleva a
  los invitados a bordo; sin toldo para las fiestas con lluvia.
- No hay mesa del concurso ni cinta colgada en el refugio; la música de la radio es texto; la foto ganadora no
  sale en el diario; el diario dice "todos a la plaza" aunque la fiesta es en el predio.
- Los hijos no aparecen en la carpa del campamento; la casa sin luz propia de noche; los chicos miran los
  títeres parados; los vecinos no se acercan solos al potrero.
- `humo-3-7-4-rueda` falla sólo con las ventanas en el monitor externo apagado (la captura de la propia prueba);
  con `HOJ_PANTALLA=no` pasa.
- Inglés: todo lo nuevo sólo en castellano. Medir en la PC del usuario.
