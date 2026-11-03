# 4.22.0 · A · Noches con forma

Rama `v4220-a` (sale de `main` = 4.21.0). Aplica el paquete «4.22.0 · Noches con forma» de `AUDITORIA_4_20_0_A.md`: la curva del Desafío (cantidad, dureza, vueltas), el primer mandamás, las semillas doradas sueltas, el castigo de caer y la dificultad en tres perillas. **No se tocó la cadena grande de las noches (R12, `desafio-noches.js`), ni el Relax, ni la Historia.** Una partida guardada vieja carga igual: no hay claves nuevas en la partida (sólo tres claves de ajustes, que valen 0 si faltan).

Todo se midió con `herramientas/auditoria-4-22-a-noches.mjs` (nueva): toma el árbol de `main` (4.21.0) con `git archive` y el de trabajo, y los mide con la misma cuenta. Las salidas completas están en `C:\Users\Andres\AppData\Local\Temp\hx\a4220\` (`noches-antes-despues.txt`; y `desafio-antes.txt` / `desafio-despues.txt` de la herramienta vieja `auditoria-4-20-a-desafio.mjs`, que sigue andando; ésa no cuenta la escala del mandamás).

## Qué cambió

| Qué | Antes | Ahora | Dónde |
|---|---|---|---|
| Cantidad de la oleada (antes de la dificultad) | `min(18, 3 + 2·(noche−1))`: 18 clavado desde la noche 9 | desde la 10, **uno más cada dos noches**: 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23 (noches 10 a 20) | `cantidadDeLaNoche` en `src/desafio-reglas.js` |
| Dureza por noche | +8 % por noche parejo | +8 % hasta la noche 10 y **+10 % por noche desde la 11** | `multiplicadorNoche`, `DUREZA_NOCHE` |
| Vueltas (cantidad / vida / daño por vuelta) | +20 / +25 / +15 % | **+12 / +15 / +10 %** | `src/desafio-vuelta.js` (`SUBE_POR_VUELTA`) |
| Vida del primer mandamás (noche 5) | 900 × dureza | **la mitad** (594 en Normal; sólo esa noche y no en la partida corta) | `escalaDelJefe` / `ESCALA_PRIMER_JEFE`; se aplica en `src/desafio.js` al bajar |
| Semillas doradas sueltas | bruto 2 a 3, mandamás 14 a 20 | bruto **1 a 2**, mandamás **8 a 12** | `TIPOS_ALIEN` |
| Caer: materiales que se pierden | 30 % parejo | **20 % + 1 % por noche, hasta 40 %** (noche 10: 30 %, igual que antes) | `castigoDeCaer` en `src/desafio-perillas.js`; `caerEnDesafio` de `src/main.js` |
| Caer: semillas doradas | se pierden todas | se pierden todas, **menos en Tranquila: queda un cuarto** | ídem |
| Dificultad | 3 niveles fijos (todo junto) | los mismos + **tres perillas** (cantidad, vida, daño; −2 a +2) | `src/desafio-perillas.js`, ajustes, `src/plantilla.html` |

## Antes y después (`auditoria-4-22-a-noches.mjs`, campaña, Normal)

**La curva** (duendes / vida total de la oleada; todas las noches de 1 a 10 sin cambios salvo la 5):

| Noche | 4 | 5 (mandamás) | 6 | 10 (mandamás) | 11 | 13 | 15 (mandamás) | 17 | 19 | 20 (mandamás) |
|---|---|---|---|---|---|---|---|---|---|---|
| Vida antes | 627 | 2.286 | 1.565 | 4.056 | 2.763 | 2.958 | 4.999 | 3.441 | 3.682 | 5.942 |
| Vida ahora | 627 | **1.692** | 1.565 | 4.056 | **2.903** | **3.291** | **5.685** | **4.257** | **4.677** | **7.265** |
| Duendes antes → ahora | 9 | 11 | 21 | 18 | 18 → 19 | 18 → 20 | 18 → 21 | 18 → 22 | 18 → 23 | 18 → 23 |

- **De la noche 11 a la 19 la vida total de la oleada crece 6,1 % por noche** (era 3,7 %). Las noches comunes dejan de valer menos que la anterior (salvo la que viene detrás de un mandamás: −28 % a −31 %, que es el respiro de siempre). El daño que recibís por segundo sube lo mismo: noche 19, de 326 a 423; noche 20, de 385 a 507.
- **El primer mandamás:** el salto sobre la noche 4 pasa de **x3,6 a x2,7**, y sobre el promedio de las dos noches de al lado de x2,1 a **x1,5**, igual que los mandamases de la 10 y la 15 (x1,5). Se probaron escalas de 1 a 0,4 (tabla en la salida de `--jefe`): con 0,6 queda x1,7 sobre las vecinas y con 0,4, x1,4; se eligió **0,5** porque iguala a los otros mandamases y la noche 5 (1.692) queda por debajo de la 8 (2.265) y de la 7 (1.957) en lugar de ser la más dura hasta la 8. Lo demás de la oleada de la noche 5 (3 brutos, rastreadores…) no cambia: sin el mandamás la noche trae 1.098 de vida, y eso solo ya es x1,75 sobre la noche 4.
- **Vueltas** (noche 20, vida / duendes): vuelta 2, 8.288 → 8.436 (22 → 24 duendes); vuelta 4, 11.894 → 10.637; vuelta 10, **22.088 → 17.239**. En la noche 10 el tope de 24 duendes se alcanza en la **vuelta 4** (antes en la 3); la 10ª vuelta sigue en el tope, pero con 2,35 veces la vida de la primera (antes 3,25).
- **Dificultades y modos:** Tranquila en la noche 20, 11 → 14 duendes (3.707 → 4.369); Implacable ya estaba en el tope de 24 (8.496 → 9.170 sólo por la dureza); Pesadilla en Normal, 23 → 30 (7.404 → 8.952). La partida corta (el mandamás es el de la noche 7) no cambia hasta la noche 10.
- **La noche roja** (x1,8 la cantidad): con 23 de base a partir de la 19 trae hasta ~41 duendes (más el enjambre). Es lo que sale de subir la base y no se tocó (se sigue entrando de a 24 a la vez; el techo de «no se desmadra» de una prueba vieja se ajustó).

**Semillas doradas** (las que sueltan las oleadas si matás a todos; más las cajas del alba):

| Hasta la noche | 3 | 5 | 7 | 10 | 15 | 20 |
|---|---|---|---|---|---|---|
| Antes | 13 | 52 | 93 | 190 | 345 | 499 |
| Ahora | 11 | 39 | 73 | 151 | 292 | 449 |
| Rebaja | −16 % | −25 % | −22 % | −21 % | −15 % | −10 % |

- **Importante: el informe de la 4.20.0 decía «sacan un tercio (499 → 334)» y no es así**: los valores que propone (bruto [1, 2], mandamás [8, 12]) bajan 449, un −10 % a la noche 20 y entre −21 % y −25 % de la 5 a la 10. Se aplicaron los valores del informe (la parte que sale, un mandamás menos y un bruto menos por noche, es la que se pidió) y se dejó anotado: lo que se compra con semillas suma 66 (38 de recetas, 24 de planos, 4 de munición, una vez cada uno) y entre sueltas y cajas del alba se cubre entero hacia la noche **7** (antes, la 6). **Bajar los sueltos no alcanza solo**; para que la semilla valga hasta el final hace falta el segundo escalón de mejoras (contenido, 4.24 del plan del informe). Lo que sí cambia es que caer duele más a medida que avanza la campaña (siguiente).
- No se bajaron más para no dejar sin semillas a un jugador que llega mal parado a las noches 3 a 5 (la primera mejora cuesta 3: con lo que sueltan las tres primeras noches, 11, alcanza).

**Lo que cuesta caer** (de 40 tablas, 40 troncos y 40 piedras y 12 semillas):

| Noche | 1 | 3 | 5 | 8 | 10 | 12 | 15 | 20 |
|---|---|---|---|---|---|---|---|---|
| Materiales que se pierden (antes 30 %) | 21 % | 23 % | 25 % | 28 % | 30 % | 32 % | 35 % | 40 % |
| Quedan de 40 | 31 | 30 | 30 | 28 | 28 | 27 | 26 | 24 |
| Semillas que quedan de 12 (Normal / Implacable) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| Semillas que quedan de 12 (Tranquila) | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |

El aviso al caer cambia en Tranquila («Perdiste parte de las semillas doradas y de los materiales»). La guía («Si caés», en `src/guia.js`) dice ahora «entre un 20 % y un 40 %… más cuanto más avanzada la noche» y «en Tranquila te queda un cuarto».

## Las tres perillas de la dificultad

- **Por qué:** las tres dificultades (Tranquila ×0,6 / ×0,55 / ×0,8, Implacable ×1,4 / ×1,35 / ×1,25 de cantidad, daño y vida) mueven todo junto y no se pueden ajustar a medio camino: ir de Normal a Implacable es un salto de golpe en todo. Es el punto (2) de «Para hacerlo escalable» del informe, y como los tres números nuevos de la curva son perillas de forma y no se pudieron calibrar contra un jugador real (el informe lo dice), conviene que el jugador pueda mover cada cosa.
- **Qué son:** tres filas de cinco botones (−2, −1, 0, +1, +2) debajo de la dificultad, en la portada del Desafío y en Ajustes: **«Cuántos duendes vienen»** (x0,6, x0,8, x1, x1,2, x1,4), **«Cuánto aguantan»** (x0,8, x0,9, x1, x1,1, x1,2) y **«Cuánto pegan»** (x0,6, x0,8, x1, x1,2, x1,4). **Se suman (multiplican) a la dificultad elegida y a lo que ya ponga el modo de la partida** (la pesadilla sigue siendo x1,3 de cantidad: con la perilla de la cantidad en +2, x1,3 × 1,4). Un texto debajo explica lo que quedó («Sobre la dificultad elegida: 40 % más de duendes y 20 % menos de daño…»). Los extremos de cantidad y daño son los de las dificultades extremas, así que «Normal con todo −2» da prácticamente una Tranquila y «Normal con todo +2» queda al nivel de Implacable en la noche 10 (24 duendes, 5.567 contra 5.799 de vida, 464 contra 447 de daño por segundo).
- **Cuándo rigen:** se fijan al abrir la partida y al tocarlas (los duendes que ya bajaron siguen como estaban; los que bajen después, no); en 0 no cambia **nada** (las dificultades son el mismo objeto de siempre). El tope de 24 duendes por oleada (31 en la pesadilla) sigue valiendo: con la cantidad +2 pasada la noche 8 casi no suma.
- **Sin fin:** la corrida sin fin no las usa (sus récords son por dificultad) y las filas se esconden cuando se elige «Sin fin»; tampoco se ven en el Relax.
- **Récords y logros:** con **alguna perilla más fácil que la dificultad** (cualquiera en −1 o −2) **no se anota el récord** de la campaña ni el de la semilla, y el logro de Implacable no cuenta (la noche se evalúa con una dificultad «facilitada»). Si sólo se suben, todo cuenta. El texto lo avisa.
- **Guardado:** tres claves de **ajustes** (`perillaCantidad`, `perillaVida`, `perillaDano`: enteros de −2 a 2, 0 de fábrica y sanean cualquier cosa rara); **no hay claves nuevas en la partida** (`desafioNuevo` no las trae). Una partida o unos ajustes viejos cargan en 0.
- **No hecho:** el nombre de nivel («Tranquila» = 1 de 5) que sugería el informe; las perillas se suman a las tres dificultades en lugar de reemplazarlas (el récord por dificultad, las recetas de «Personalizar» y los logros siguen hablando de Tranquila, Normal e Implacable).

## Lo que se dejó como estaba

- **La cadena grande de las noches (R12)** y todo `desafio-noches.js`.
- **Segundo escalón de mejoras con semillas y tipos nuevos por vuelta** (puntos 4 y 5 de «Para hacerlo escalable»): son contenido (4.24).
- La fórmula de los refuerzos, el enjambre, los tipos y su orden; sólo cambia cuántos vienen y cuánto aguantan y pegan.
- **Sin fin:** su dureza arranca de `multiplicadorNoche(20)` (ahora 2,72, era 2,52) y su base de la noche 19 (23 duendes, eran 18): queda un 8 % más dura desde la noche 20, y llega al tope de 24 enseguida. Lo demás de la corrida sin fin sigue igual.
- **Texto en inglés:** no se escribió (se traduce al final): las líneas nuevas (perillas, aviso de caída en Tranquila, guía) quedan sin traducir.

## Pruebas

- **Nueva:** `pruebas/verificar-4-22-0-a.mjs` (al final de `verify:pasos`): 237 verificaciones. La cantidad noche por noche (1 a 20), la dureza, la vida total de la 11 a la 19 (6,1 ± 0,3 % por noche), las cuatro noches de 1 a 4 intactas, las vueltas (multiplicadores, tope de 24 en la vuelta 4, 17.239 de vida a la vuelta 10), el primer mandamás (escala 0,5 sólo en la noche 5 y no en la partida corta, salto 2,4–3, mismo peso sobre las vecinas que el de la 10 y la 15, y la línea de `desafio.js` que la aplica), las semillas, el castigo de caer (la regla pura contra cuentas a mano y las líneas de `main.js`), las perillas (saneo, multiplicadores, composición con el modo de la partida, que en 0 sean los mismos objetos, textos, récords y logros, las tres filas de la plantilla, ajustes guardados y viejos) y que la sin fin siga siendo continua.
- **Mutaciones:** `pruebas/mutaciones-4-22-0-a.mjs` (fuera del gate): 53 mutaciones sobre copias de `src/` (una carpeta y un proceso por cada una); la copia sin mutar pasa y **53 de 53 fallan** (detalle al final de este documento).
- **Pruebas viejas que se ajustaron a propósito** (contaban valores que cambian): `verificar-2-3` (el techo de 18 de la oleada: ahora `cantidadDeLaNoche`), `verificar-modo-desafio` e `verificar-invasores` (ídem, y el mandamás suelta de 8 a 12 semillas), `verificar-4-8-ataques` (la tabla de cantidades «de siempre» de las tres dificultades, el techo de las noches especiales y la excepción de Tranquila con 12 comunes, donde el lugar del segundo curandero queda de más: uno) y `verificar-3-8-4-desafio` (la caída en el fundido pasa por `castigoDeCaer`; noche 1: 21 %, los 10 troncos siguen quedando en 7).
- **Barrido:** se corrieron las 245 pruebas `verificar-*.mjs` que nombran el Desafío, los ajustes, la plantilla, la guía, el idioma o la dificultad; después de los ajustes de arriba, todas en verde (una primera pasada falló cinco: dos eran un import con comentario atrás en `guardado.js` que el armado no entiende, y tres los valores de arriba). **No se corrió `npm run verify` completo** (lo pide el brief).
- **Partida real:** `pruebas/humo-4-22-0-a.cjs` (Electron, candado, monitor externo, perfil propio): ver «Humo» abajo.

## Humo (Electron)

`pruebas/humo-4-22-0-a.cjs` (partida real con Electron, candado de Electron tomado y soltado, monitor externo, perfil propio `perfil-4220-a`, `-Visible`): **TODO OK**, 22 pasos. La portada y Ajustes tienen las tres filas de perillas (captura de la portada con las perillas en 0 y tocadas, vistas a tamaño completo: las filas entran en el panel, el texto se arma solo y marca el botón); tocar +2 las anota en los ajustes y en el guardado y el botón queda marcado; una partida sin perillas las tiene en 0. Con Normal en la **noche 10**, matando a cada duende al aparecer (así el tope de «a la vez» no cuenta): con la cantidad en +2 bajan 23 comunes y 1 mandamás (18 × 1,4 pasa el tope de 24); con las perillas en 0, **17 comunes y 1 mandamás** y el mandamás nace con 1.548 de vida (900 × 1,72: sin cambios). En la **noche 5**, el mandamás nace con **594** (900 × 1,32 × 0,5) y el resto es el de siempre (10 comunes, 3 brutos). **Caer** (herido de 9.999 de golpe, con el juego real): noche 10 en Normal, 28 de 40 y 0 de 12 semillas; noche 20, 24 de 40; Tranquila, 28 de 40 y 3 de 12 semillas. Recargar conserva la perilla de la vida en +2 y las otras en 0. Sin errores en la consola. La prueba no entra a jugar con la pantalla (las noches corren con el reloj del juego adelantado desde Node, como en los otros humos), así que **no hay captura de una noche**: no se vio a ojo.

## Lo que no se vio

- **A ojo en juego, la sensación:** que la noche 5 con la mitad de vida del mandamás se juegue bien, y que las noches 11 a 20 (+6 % por noche, hasta 41 duendes con la roja) no se vuelvan injugables o aburridas. Los tres números de la curva y la escala del mandamás son **de forma, no de dificultad calibrada** (el informe lo avisa: no se midió cuánto daño por segundo tiene un jugador real en la noche 12): por eso las perillas. Falta una corrida larga (`herramientas/soak-duendes.cjs`) o una partida real de 20 noches.
- **Las perillas en la pantalla de la pausa** con el juego andando (se vieron en la portada, con captura; en Ajustes son las mismas filas con la clase `fila-ajuste`).
- **Claves nuevas de guardado:** sólo de ajustes (`perillaCantidad`, `perillaVida`, `perillaDano`); ninguna en la partida.

## Resultado de las mutaciones (`node pruebas/mutaciones-4-22-0-a.mjs`)

Copia sin mutar: pasa. **53 de 53 atrapadas**: cantidad: se clava en 18 desde la noche 9; cantidad: uno más por noche (y no cada dos); cantidad: sube desde la noche 11; cantidad: el tope base 20; dureza: 8 % parejo otra vez; dureza: 12 % desde la 11; dureza: el 10 % empieza en la noche 13; vuelta: la cantidad vuelve a +20 %; vuelta: la vida vuelve a +25 %; vuelta: el daño vuelve a +15 %; mandamás: sin escala (3,6 veces la noche 4); mandamás: escala 0,7; mandamás: la escala vale para todos los mandamases; mandamás: la escala también en la partida corta; mandamás: al bajar no se aplica la escala; semillas: el bruto vuelve a 2 a 3; semillas: el mandamás vuelve a 14 a 20; caer: vuelve el 30 % plano (base 30, sin suma por noche); caer: no crece con la noche; caer: el tope sube a 50 %; caer: arranca en 30 %; caer: Tranquila no guarda semillas; caer: Tranquila guarda la mitad; caer: todas las dificultades guardan un cuarto; caer: aplicarCastigo no toca los materiales; caer: main.js vuelve a perder todas las semillas y el 30 %; caer: main.js mira siempre la noche 1; caer: la guía sigue diciendo 30 %; perillas: los pasos de la cantidad, más cortos; perillas: la vida con pasos de la cantidad; perillas: el daño sin escala; perillas: el paso no se acota; perillas: un true cuenta como 1; perillas: fijarPerillas no rehace las dificultades; perillas: la cantidad no se aplica; perillas: el daño usa la vida; perillas: se pisa el modo de la partida (pesadilla); perillas: fijarPartidaMeta borra las perillas; perillas: en cero ya no es el objeto de siempre; perillas: facilitan al revés; perillas: el texto no avisa lo de los récords; perillas: el texto dice menos por más; perillas: se leen de las claves equivocadas; perillas: los ajustes guardados no se sanean; perillas: de fábrica no valen cero; perillas: la sin fin las usa; perillas: no se fijan al abrir; perillas: tocar una en Ajustes no las fija; perillas: el valor del botón queda como texto; perillas: con una más fácil se anotan los récords; perillas: con una más fácil vale el logro de Implacable; perillas: falta un botón en Ajustes (la vida); perillas: las filas de Ajustes no se esconden en el Relax.
