# 4.10 partidas — «Volver a jugar» (tanda 3, entre partidas y formas de jugar)

Rama `v410-partidas` (sale de `main` = 4.9.0). La versión no se sube. El Relax queda afuera: nada de esto se pasa al Relax.

## Lo que ya existía (revisado antes de tocar)
- Se empieza una partida del Desafío con «Entrar al bosque» en la portada: dificultad (Tranquila/Normal/Implacable), Campaña o Sin fin y código de partida. `desafioNuevo()` es el kit inicial (hacha y pico; el resto se fabrica).
- Tres ranuras por modo (`partidas.js`, `guardado.js`); el sin fin juega en su propia ranura.
- Récords: el sin fin guarda diez por dificultad en `hojarasca-sinfin-v1` (no se sincroniza con la carpeta compartida: sólo se sincronizan las partidas); récords por código en `hojarasca-semillas-v1`; los de la campaña, en los logros.
- Finales: «¡Cayó el Coihue Viejo!» (abre el nido) y «Se derrumbó la cueva»; «Otra vuelta» (`desafio-vuelta.js`) y «las noches después».
- «Semillas doradas» ya es el material `cristal` del bosque: la moneda de entre partidas se llama **semillas del Coihue** para no confundirlas.

## Semillas del Coihue
- **Una por partida terminada, ganada o perdida, con al menos 3 noches resistidas.** Una partida termina al ganar, al terminar la corrida sin fin o al dejarla para empezar otra (nueva partida). Se da una sola vez por partida (`meta.semillaDada`); empezar y abandonar antes de la 3.ª noche no regala nada.
- Se guardan en `hojarasca-meta-v1` (con copia `hojarasca-meta-v1-copia`; si el almacenamiento falla, siguen en memoria toda la sesión). Como los récords del juego, no se sincronizan con la carpeta compartida. Saldo visible en la portada, en la pantalla de nueva partida y en la hoja «Partidas» del cuaderno. Tope 99.

## Pantalla de nueva partida (una sola: modo + ventajas + reglas)
Al «Entrar» a una partida nueva del Desafío (teclado: Tab/flechas, Enter, Esc; ratón: clic). En la depuración se saltea salvo con `&meta=1` (las pruebas viejas entran con un clic).
- **Modo:** Campaña (20), Partida corta (7), Pesadilla (bloqueada hasta ganar la campaña). El Sin fin se sigue eligiendo en la portada.
- **12 ventajas, máximo 2:** arranque (Provisiones: 10 tablas y 4 troncos; Carcaj lleno: 20 flechas; Trampa de miel lista: una trampa armada cerca y 2 frascos), aliados (Perro de pelea: muerde un 50 % más fuerte; Anselmo ya te conoce: ayuda 1; Manos livianas: Anselmo hace un 30 % menos de pausa; Buena puntería: los chicos tiran un 20 % más seguido y un 40 % más fuerte), personaje (+15 salud máxima; correr +8 %; recargar −10 %) y con costo (Filo de riesgo: +25 % daño y −30 de salud máxima; Manos llenas: +50 % de troncos y piedras juntados, pero noches un tercio más largas). Las de los tres primeros tipos cuestan **1 semilla**; las «con costo» no cuestan semillas y **suman puntos al récord** (+0,20 y +0,15).
- **5 reglas, sin límite:** sólo arco (+0,30), sin aliados (+0,25), noches más largas (+0,20), sin reparar (+0,20), sin emplastos (+0,10). Choques que la pantalla traba: sin aliados con cualquier ventaja de aliados; sin reparar con Manos livianas.
- **Multiplicador de puntos** = 1 + reglas + «con costo». Puntos = (noches × 100 + abatidos + 1000 si se ganó) × multiplicador. Récord (diez) **por modo**: campaña, corta, pesadilla y sin fin (`records` de la meta).
- Una nota sobre «perro más rápido»: el perro del Relax tiene la velocidad fija, así que la ventaja es **perro de pelea** (más daño de mordida), sin tocar `perro.js`.

## Partida corta
7 noches; el mandamás (el de siempre) baja a la 7.ª (y sigue hasta que caiga); no hay noche final del Coihue, ni cueva, ni noches después. Ajuste: 0,95 de cantidad y de vida (hay menos noches para armarse). Se gana al caer el mandamás (los demás huyen, se cuenta la noche, final propio y puntos en su récord).

## Pesadilla
Se desbloquea al ganar la **campaña** una vez (la corta no cuenta). 1,3× duendes, 1,15× daño, 1,1× vida (se suma a la dificultad), **sin cofre del alba** y más niebla: la franja de azar entre el 0,49 de siempre y el 0,70 es niebla (el pronóstico acierta porque `nocheEspecial` es la misma). Marca en la portada («Pesadilla desbloqueada») y en el HUD («Pesadilla · …»); récord propio.

## Finales (4, según cómo jugaste; se anotan en el cuaderno)
Ceniza (la base cayó: `derrotas > 0`), La aldea entera (3 o 4 vecinos con ayuda > 0 y ningún lugar de la aldea caído), El guardián solo (0 o 1 vecino) y El valle respira (el resto; con una línea más si las noches fueron limpias: ≥ 70 % sin perder defensas). Cada uno con su texto (la corta tiene los suyos) y un epílogo en la pantalla «Se derrumbó la cueva». No cambia la mecánica de ganar. La hoja «Partidas» del cuaderno muestra cuáles viste y los récords.

## Contrato de bonos (con «guardian»)
Las ventajas de personaje van por `sumarBono(d, 'ventaja', clave, valor)` de `desafio-bonos.js` (claves y unidades del contrato: `saludMax` en puntos, el resto fracciones), una sola vez por partida (`meta.aplicado`; el contrato suma), y se arranca con la salud máxima nueva.

## Archivos
Nuevos: `src/desafio-meta.js` (puro), `src/desafio-meta-juego.js` (enganche), `src/desafio-meta-pantalla.js` (pantalla y hoja del cuaderno), `pruebas/verificar-4-10-partidas.mjs` (253), `pruebas/humo-4-10-partidas.cjs`, `herramientas/mutar-4-10-partidas.cjs` (71 mutaciones, todas atrapadas). Cambios mínimos en bloques `4.10 partidas:` en `desafio.js`, `desafio-reglas.js` (`meta` en el estado de la partida, `fijarPartidaMeta`, `dificultad()`, `esNocheDeJefe`, `nocheFinalCoihue()`), `desafio-aliados.js`, `desafio-vecinos-mundo.js`, `desafio-aldea.js`, `desafio-nido.js`, `meteo.js`, `desafio-ambiente.js`, `main.js` y `plantilla.html`.
Pruebas viejas ajustadas (mínimo): `verificar-3-0-asedio` (dos regex: `NOCHE_FINAL` pasó a `nocheFinalCoihue()`), `verificar-4-8-noches` y `verificar-4-7-carga` (un nombre más en el mundo de mentira) y `verificar-4-2-pico` (la ventana de lectura de `usarHacha` de 4800 a 5400 caracteres).

## Partidas viejas
Sin `meta`: cargan en campaña, sin ventajas ni reglas, y reciben su semilla al terminar como cualquiera.

## No verificado
Rendimiento en la 4600G (no hay nada por cuadro: la hora de noche larga es una multiplicación y `dificultad()` está cacheada); la regla «noches más largas» y «manos llenas» jugadas de verdad; el sin fin con la pantalla (sólo en prueba de Node); la ventaja del perro y de los chicos sólo por texto y por la prueba de conducta de sus números.
