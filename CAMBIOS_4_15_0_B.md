# Hojarasca 4.15.0 (parte B) — Las escenas y los textos del acto I de la Historia

Rama `v4150-b`, sobre `main` = 4.14.0. No se subió la versión. Esto es la parte B: el CONTENIDO del acto I (capítulos 1 a 4 de `GUION_HISTORIA.md`) como datos para el motor de escenas de la 4.14.0. La parte A (fundación: estado, objetivos, disparadores, panel, reinicio) la hace otro agente; acá no se tocó `historia.js`, `historia-ui.js`, `guardado.js` ni `main.js`.

## Qué hay
- `src/historia-escenas-acto1.js` — `ESCENAS_ACTO1` (id → escena), las **21 escenas** con los ids que dispara A, `IDS_ACTO1`, `EFECTOS_ACTO1` (todos los nombres de efecto que usan, para registrarlos uno por uno) y `DISPARO_ACTO1` (por escena: capítulo, **dónde tiene que estar parado el jugador**, cuándo y qué objetivo la cuenta).
- `src/historia-texto-acto1.js` — `TEXTO_ACTO1`: tarjetas de entrada y de cierre (con variantes por decisión), objetivos en texto, premios, notas y objetos que se leen, el **cuaderno de lo raro** (12 entradas con id) y las líneas de **charla «tema de historia»** de Ramón, Nicanor, Josefina, Ercilia, Fermín, Herminia, Rosa y Elsa (30 líneas, con condiciones por decisión, optativa o escena vista). Funciones: `cierreDe(n, decisiones, { sinGallinero })`, `premioDe(n, decisiones)`, `charlaDe(quien, cap, estado)`.
- `src/historia-escenas-util.js` — ayudas puras: constructores de pasos (`dlg`, `narra`, `plano`, `pose`, `aparece`, `camina`, `eleccion`, `efecto`…), personajes de la Historia con su clave del juego, tabla de gestos del guion → poses que existen, y la **convención de efectos** (`parsearEfecto`, `efectosDe`, `condicionesDe`).
- `pruebas/verificar-4-15-0-escenas-acto1.mjs` — la prueba (en el gate).

Ninguno de los tres módulos está enchufado al juego todavía (A los importa desde `historia.js` / `main.js`); por eso `node armar.mjs` no los incluye. Son seguros para el empaquetador (un `import` por línea, un `export const` por nombre, sin `export … from`) y puros (sin three ni DOM).

## Las 21 escenas
| Capítulo | Escenas |
|---|---|
| 1 · La llave del molinero | `trochita-boleto`, `estacion-llegada`, `algo-cruza`, `nota-eusebio`, `ronda-umbral` |
| 2 · La bolsa del molinero | `ramon-tranquera`, `almacen-ercilia`, `ese-no-josefina`, `bolsa-alero` (la decisión D1), `bolsa-coihue` (D1 = a), `bolsa-rosa` (b), `bolsa-josefina` (c) |
| 3 · La mesa larga | `hacha-tocon`, `placa-herminia`, `mesa-visita-nicanor`, `mesa-visita-ramon`, `fermin-galpon` |
| 4 · La señora del ramal | `anden-graciela`, `cabina-elsa`, `derrumbe-puertita` (ayudar / seguir de largo), `te-graciela` (optativa) |

Cada una trae planos de cámara con el vocabulario del motor (general, medio, primer plano, detalle, sobre el hombro, picado, contrapicado, paneo, fijo), diálogo completo y respuestas del jugador (2 o 3 opciones). Las 18 elecciones del acto I: 6 llevan efecto (lazos o la decisión de la bolsa), el resto son de **sabor declarado** (`sabor: true` en la opción: cambia el tono y nada más). Dos escenas ramifican con etiquetas (`derrumbe-puertita`: ayudar o seguir, y el que sigue igual recibe la puertita a la noche).

- **Anclaje:** casi todas se anclan al `jugador` (o a `{ frente: 'jugador', dist, lado }`). Quien las dispara tiene que dejar al jugador donde ocurre (umbral, tocón, alero, mesa, cabina…); `DISPARO_ACTO1[id].jugadorEn` lo dice. Los lugares con nombre que se usan son `estacion`, `almacen`, `galpon` (existen en `T.lugares`).
- **Saltar (Esc):** lo que tiene que valer aunque se salte (efectos, la decisión por defecto) va en pasos, no en el gesto o el plano de una línea. La prueba salta cada escena a los 2, 40 y 300 cuadros.
- **Variantes:** por la elección de la misma escena (`si: { eleccion, es }`) o por la historia (`si: { cond: 'decision' | 'lazo' | 'evento', args }`, abajo).

## Convención de efectos (para el aplicador de A)
Son pasos `{ tipo: 'efecto', nombre, args? }` o el `efecto` de una opción. El nombre sigue `tipo:parte:parte`. A registra cada nombre de `EFECTOS_ACTO1` con `director.registrarEfecto(nombre, fn)` (o los desarma con `parsearEfecto(nombre)` de `historia-escenas-util.js` y registra una función por tipo). Tienen que ser **idempotentes**: el motor los corre una vez por escena y la escena no se repite (`repetible` ausente), pero una escena saltada los corre todos de golpe.

| Efecto | Qué hace | Usados |
|---|---|---|
| `lazo:<quien>:<n>` | sube o baja el lazo (−3…+3). `quien`: `ramon`, `ema` (Josefina), `ercilia`, `guarda` (Elsa), `fermin`, `graciela`; secundarios `rosa`, `herminia`, `nicanor`, `tito`, `tobias`, `belisario` (si la historia no los lleva, ignorar) | `lazo:ema:-1`, `lazo:ema:2`, `lazo:ercilia:2`, `lazo:ramon:1`, `lazo:rosa:1`, `lazo:graciela:1`, `lazo:graciela:-1`, `lazo:graciela:2`, `lazo:guarda:-1` |
| `decision:<d>:<a\|b\|c>` | guarda la decisión grande (`bolsa`, `coihue`, `molienda`, `cuaderno`, `majada`). **Pisa la anterior**: `bolsa-alero` la toma al elegir y `bolsa-coihue/rosa/josefina` la reafirman al cumplirla (la última acción manda) | `decision:bolsa:a/b/c` |
| `ramal:<n>` | suma a la cuenta del ramal | `ramal:2` (te-graciela) |
| `raro:<id>` | anota el indicio en el cuaderno de lo raro; el texto está en `TEXTO_ACTO1.raro[id]`. No se repite | 12 |
| `objeto:<id>` | el objeto de historia queda a mano / en la mochila (`foto-eusebio`, `nota-eusebio`, `bolsa-eusebio`, `puertita`) | 4 |
| `entrega:<id>` | el objeto sale de la mochila (`bolsa-eusebio`) | 3 |
| `dar:<cosa>:<n>` | el jugador recibe n de una cosa de la economía (`dar:pan-casero:3`) | 1 |
| `mundo:<id>` | pone o cambia algo en el mundo; lleva `args` con el anclaje cuando hace falta (`{ donde: { frente: 'jugador', dist, lado } }`) | ver pedidos |
| `duende:<id>` | un duende de historia hace algo; `args` | `duende:pillo-cruza` |
| `optativa:<id>` | ofrece una optativa (`frasco-masa-madre`, `fermin-pan`) | 2 |
| `hablado:<clave>` | anota que ya hablaste con esa persona (`hablado:fermin`, para el objetivo de conocer a los vecinos) | 1 |

Condiciones (`si: { cond, args }`, las registra A con `registrarCondicion`): `decision` `{ d, es }` (`es` = `a`, `b`, `c` o `ninguna` si todavía no se tomó), `lazo` `{ quien, min?, max? }` (la convención está; el acto I no la necesita todavía) y `evento` `{ id }` (el evento del valle ya pasó: `tobillo`). Ojo: una condición no registrada da `false`, así que la variante no se muestra (la escena sigue).

Las elecciones guardadas del motor son planas por id (el director junta las de todas las escenas): los ids de elección del acto I son únicos y llevan el nombre de la escena (`almacen-oiste`, `graciela-valle`…), salvo `bolsa`, que es la de la decisión.

## Pedidos para el agente A (lo que el guion usa y todavía no existe)
1. **Graciela Pugh** (`clave: 'graciela'`): persona nueva armada con lo que ya hay en `gente.js`/`gente-ropa.js` (sobretodo gris, rodete, botas, portafolios en la mano como la tablilla de Josefina). Las escenas `anden-graciela`, `cabina-elsa`, `derrumbe-puertita` y `te-graciela` la usan (con `aparecer`, así que alcanza con que exista en la lista de gente aunque duerma). Sin ella esas escenas corren igual (el motor ignora al personaje que no está), pero sin la ingeniera. **Alojamiento:** el guion decía «el hospedaje de la aldea», que no existe; el texto dice sólo «se quedó a dormir en la aldea».
2. **Ernesto en la Estación del Valle:** `anden-graciela` lo hace `aparecer` ahí (es el jefe de estación de la aldea).
3. **Prólogo en la trochita:** `trochita-boleto` y `estacion-llegada` suponen al jugador en la trochita / en el andén al empezar. La primera usa `aparecer` a Elsa al lado del jugador (no hay pasillo de vagón).
4. **El coihue grande del molino viejo:** `bolsa-coihue` está anclada al jugador (la dispara A al dejar la bolsa en la raíz). Hace falta el lugar `molino-viejo` y el coihue marcado (el guion lo pide en «necesidades técnicas», punto 10). El texto dice «coihue grande»; la nota de la bolsa nombra «el molino viejo».
5. **Props y objetos de historia** (efectos `mundo:` y `objeto:`): `mundo:ronda-ramitas`, `mundo:hacha-en-tocon`, `mundo:pinones-en-tocon`, `mundo:cuchara-en-techo`, `mundo:bolsa-se-pierde` (la bolsa se esfuma o parpadea; ambiguo a propósito), `mundo:puertita-a-la-noche` (la puertita apoyada contra la puerta del refugio a la noche, `args.donde = 'puerta-del-refugio'`; al encontrarla se anota `raro:puertita-noche`, que no corre solo), `mundo:majada-pasa`, `mundo:trochita-parte`; objetos `foto-eusebio`, `nota-eusebio`, `bolsa-eusebio`, `puertita` (y el `canto-blanco`, que sale de `ronda-umbral`).
6. **El duende de `algo-cruza`:** `duende:pillo-cruza` con `args = { tipo: 'rastreador', desde, hasta, deEspaldas, rie }` (las posiciones son referencias de escena: `{ frente: 'jugador', dist: 15, lado: 5 }`): sale de la ref `desde`, corre hasta `hasta`, se esconde y se ríe una vez (`historia-duendes.js`). Es el único efecto con `args` que A tiene que interpretar.
7. **Cuaderno de lo raro:** la pantalla; las entradas están en `TEXTO_ACTO1.raro` (`titulo`, `texto`, `cap`, `donde`; la fecha la pone el aplicador).
8. **Mirada dirigida de `algo-cruza`:** está hecha como un plano `hombro` de 3,9 s dentro de la escena (la cámara sale del jugador, mira el helecho y vuelve), no con `escenasMundo.mirarA`; si A prefiere la mirada corta sin barras de cine, alcanza con reemplazar los dos primeros pasos.
9. **Optativas:** `frasco-masa-madre` (se abre en `nota-eusebio`) y `fermin-pan` (en `fermin-galpon`) tienen su texto en `TEXTO_ACTO1.capitulos[n].optativas`. `vuelta-ingeniera` la cierra `te-graciela` con Graciela +2 y ramal +2 (A mide los dos lugares).
10. **Gallinero:** la variante B del cierre del capítulo 2 nombra el gallinero; `cierreDe(2, decisiones, { sinGallinero: true })` usa la alterna.
11. **Disparadores:** los campos `disparador: { hora }` de algunas escenas son una sugerencia del guion (por ejemplo `ronda-umbral` a la mañana); si A las dispara por otra vía, que los ignore.

## Decisiones de redacción
- Lo del guion está tal cual, con las líneas que el guion resume completadas en el mismo estilo (por ejemplo la despedida de Elsa, el pan de Rosa, la merienda de Graciela).
- Los gestos del guion entre corchetes se traducen con `POSE_DE` a las poses que de verdad existen (reír = manos a la cintura; suspirar = manos juntas; tomar mate = brindar).
- La **decisión de la bolsa** se toma en `bolsa-alero` (tres opciones) y se cumple en una de las tres escenas siguientes. Si el jugador hace otra cosa que lo que eligió, gana la última acción (la escena de entrega reafirma la decisión).
- Cero inglés, nada religioso (el guion usa «convidar», no ofrenda; la prueba lo mira palabra por palabra), lo sensual no aparece en el acto I, solo teclado y ratón.

## Verificación
- `pruebas/verificar-4-15-0-escenas-acto1.mjs` (en el gate): todas las escenas pasan el validador del motor; ids exactos; se corren por **todos los caminos de elección** (44 caminos) con un mundo de mentira y se saltan a los 2, 40 y 300 cuadros; cada elección tiene efecto o es de sabor declarado; los efectos siguen la convención y están registrados; largos de línea (≤ 260 letras) y de opción (≤ 96); sin inglés, sin palabras religiosas ni explícitas, sin nombres propios ni lugares que no existan (claves de personaje contra `gente.js`/`aldea.js`/`gente-campo.js`, lugares contra `T.lugares`); variantes por decisión (hacha, placa, cierre, premio, charla); y 38 **mutaciones** de los datos (se rompe una garantía a propósito) que la prueba atrapa todas.
- Pasos de `npm run verify`: ver el informe de la entrega.

## Lo que no se verificó
- No se miró ninguna escena en Electron: el ritmo de los planos, el largo de los diálogos al leer y la puesta en el mundo (las anclas relativas al jugador) hay que verlos jugando.
- Los gestos se probaron sólo contra la lista de poses del motor, no a ojo con cada personaje.
- Los pedidos de arriba (Graciela, props, duende, cuaderno) no existen todavía: las escenas corren sin ellos, pero lo que dependa de ellos no se ve.
