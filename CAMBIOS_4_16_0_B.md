# Hojarasca 4.16.0 (parte B) — Las escenas y los textos del acto II de la Historia

Rama `v4160-b`, sobre `main` = 4.15.0. No se subió la versión. Esto es la parte B: el CONTENIDO del acto II (capítulos 5 a 8 de `GUION_HISTORIA.md`) como datos para el motor de escenas. La parte A (objetivos, disparadores y aplicador de efectos del acto II) la hace otro agente; acá no se tocó `historia.js`, `historia-ui.js`, `historia-disparadores*.js`, `guardado.js` ni `main.js`. **Esta tabla de ids es la que manda para los guiones**: al juntar con la lista de A se concilia contra ella.

## Qué hay
- `src/historia-escenas-acto2.js` — `ESCENAS_ACTO2` (id → escena), las **37 escenas**, `IDS_ACTO2`, `EFECTOS_ACTO2` (todos los nombres de efecto, para registrarlos uno por uno), `DISPARO_ACTO2` (por escena: capítulo, **dónde tiene que estar parado el jugador**, cuándo y qué objetivo la cuenta) y `POR_DEFECTO_ACTO2` (la opción que vale si se saltea cada decisión). Se arma con cuatro módulos, uno por capítulo: `historia-escenas-acto2-c5.js` … `-c8.js`.
- `src/historia-escenas-acto2-util.js` — ayudas puras que se suman a `historia-escenas-util.js` (que no se tocó): los personajes nuevos (`PERSONAJES_ACTO2` y `pj(...)`), `apagon`, `hora`, `horaMas`, `con`, `no`, `lazoAl`, `FRENTE`.
- `src/historia-texto-acto2.js` — `TEXTO_ACTO2`: tarjetas de entrada (con la puerta de estación del capítulo 5 y una frase por decisión en los capítulos 6, 7 y 8) y de cierre (con variantes por D2, D3 y D4), objetivos y optativas en texto, premios (el del capítulo 8 según D4), las notas que se leen (las tres partes del cuaderno de Eusebio, la libreta, el cuaderno del abuelo de Josefina, la página de tratos), los objetos, el **cuaderno de lo raro** (39 entradas con id) y la **charla «tema de historia»** de 12 vecinos (65 líneas). Funciones: `entradaDe2(n, decisiones, { puerta })`, `cierreDe2(n, decisiones)`, `premioDe2(n, decisiones)`, `paginaTratosDe2(decisiones)`, `charlaDe2(quien, cap, estado)`. Llevan el `2` al final para que `main.js` pueda importar las del acto I y las del acto II sin chocar.
- `pruebas/verificar-4-16-0-escenas-acto2.mjs` — la prueba (en el gate).

Ninguno está enchufado al juego todavía: `node armar.mjs` no los incluye hasta que A los importe. Son seguros para el empaquetador (un `import` por línea, un `export const` por nombre, sin `export … from`) y puros (sin three ni DOM).

## Tabla de ids: id → capítulo → cuándo / dónde
Los ids de elección también son únicos entre todas las escenas (las elecciones guardadas del motor son planas por id), salvo las decisiones `coihue`, `molienda` y `cuaderno`, que llevan el nombre de la decisión.

### Capítulo 5 · La rueda
| id | cuándo / dónde (jugador parado en…) |
|---|---|
| `piedras-molino` | mañana del día 5, con Josefina junto a las muelas rotas del molino viejo (objetivo `piedras`) |
| `zaino-ramon` | frente a Ramón en el Puesto Alto, primera charla del capítulo (objetivo `zaino`) |
| `tito-coihue` | al pie del coihue grande al marcar el aserradero cerca del árbol: **D2** (objetivo `coihue`) |
| `coihue-en-pie` | junto al aserradero terminado, a más de 25 m del coihue, si D2 = a |
| `coihue-talado` | a 5 m del tocón, después del sexto hachazo, si D2 = b |
| `tobias-pirca` | frente a Tobías en la cantera, al entregar las 10 piedras, si D2 = c (la segunda mitad pasa en el coihue tras un apagón) |
| `rueda-gira` | a 2,5 m de la rueda, la primera vez que gira el molino de la historia (objetivo `molino`) |
| `trigo-abuelo` | optativa, frente a Josefina en la seccional, solo si D1 = c |
| `tablas-tito` | optativa, frente a Tito en la carpintería, solo si D2 = b |
| `truchas-nicanor` | optativa, en el muelle con la caña |

### Capítulo 6 · Lo que se pierde, aparece
| id | cuándo / dónde |
|---|---|
| `luces-lago-nicanor` | muelle, 20:30, primera charla de historia con Nicanor |
| `el-que-vuela` | en kayak o velero a menos de 40 m del faro, entre las 23 y la 1 (objetivo `lago`) |
| `guardia-molino` | sentado en el banco del molino entre las 22 y las 2; la escena adelanta la hora (objetivo `guardia`) |
| `huellas-escarcha` | a la mañana siguiente a la guardia, junto al molino, 6:00 a 8:30 |
| `ramon-raiz` | escondido a 15 m de la raíz de la ladera, al final de las huellas, 7:30 |
| `perdidas-devueltas` | frente a Ercilia, al entregar las tres cosas perdidas (objetivo `perdidas`) |
| `masa-crece` | optativa, frente a Rosa en la panadería, solo si D1 = b (pasa la noche) |
| `foto-sofia` | optativa, frente a Sofía en el estudio de fotos, solo si se sacó la foto movida |

### Capítulo 7 · La cosecha (el punto medio)
| id | cuándo / dónde |
|---|---|
| `primera-molienda` | mañana, junto a la puerta del molino, con diez medidas de harina: **D3** |
| `molienda-fletes` | andén de la Estación del Valle, al entregar el tercer flete, si D3 = a |
| `molienda-fiado` | frente a Ercilia, al entregar las seis bolsas, si D3 = b |
| `molienda-partir` | al pie del coihue (o del tocón), al dejar la bolsa de la raíz, si D3 = c |
| `minga-aldea` | camino del refugio a la aldea, al llegar con algo cocinado (objetivo `minga`) |
| `fermin-mulas` | optativa, frente a Fermín en el galpón de esquila, después de la minga |
| `galpon-ronda` | al amanecer siguiente a la minga, en la puerta del galpón del jugador: el **punto medio** (objetivo `galpon`) |

### Capítulo 8 · El cuaderno de Eusebio
| id | cuándo / dónde |
|---|---|
| `cuaderno-1` | desde el diario: primera parte del cuaderno, cuentas y tratos (objetivo `leer`) |
| `cuaderno-2` | desde el diario: segunda parte, puertitas y la lista «lo que dejaron» |
| `cuaderno-3` | desde el diario: tercera parte, la frase subrayada |
| `libreta-fiado` | frente a Ercilia en el almacén, al mostrarle el cuaderno (objetivo `ercilia`) |
| `cuaderno-abuelo` | frente a Josefina en la seccional, a la tarde (objetivo `josefina`) |
| `los-del-cerro` | frente a Belisario junto al fogón del Puesto del Paso (objetivo `belisario`) |
| `secreto-ramon` | banco de la puerta del Puesto Alto, 17 a 20; si el lazo de Ramón es negativo lo ves de lejos y no hay charla (objetivo `ramon`) |
| `fogon-leyenda` | fogón del predio de la aldea, 21:00: **D4** (objetivo `fogon`) |
| `pluma-umbral` | umbral del refugio, esa misma noche al volver del fogón (deja la pluma y la primera nieve) |
| `veta-vuelve` | optativa, frente a Tobías en la cantera de noche, solo si D2 = c |
| `mulas-belisario` | optativa, a caballo con la tropa de Belisario hasta el mallín |
| `herminia-noventa` | optativa, frente a Herminia con la torta |

## Las tres decisiones del acto II
Se toman con una elección de tres opciones cuyos efectos son `decision:<d>:<a|b|c>`. **Pisa la anterior** (la última acción manda), igual que la bolsa del acto I.
| Decisión | Dónde se toma | Dónde se cumple (reafirma y suma lazos) | Por defecto si se saltea |
|---|---|---|---|
| D2 `coihue` | `tito-coihue` | A `coihue-en-pie` · B `coihue-talado` · C `tobias-pirca` | a (en pie) |
| D3 `molienda` | `primera-molienda` | A `molienda-fletes` · B `molienda-fiado` · C `molienda-partir` | b (fiado) |
| D4 `cuaderno` | `fogon-leyenda` (la rama entera pasa dentro de la escena, con sus lazos) | — | b (callar) |

- **D4** se toma y se cumple en la misma escena: las ramas A, B y C son pasos con `si: { eleccion: 'cuaderno', es }`, y sus lazos (A: Ercilia +2, Herminia +1, Josefina −1; B: Josefina +2, Ramón +1; C: Josefina +1, Graciela +1) y el `ramal:1` de C también. **El premio de C (el flete de material de estudio, ramal +1) ya está sumado por la escena: el aplicador no lo tiene que sumar de nuevo.** Las otras dos recompensas del premio (seis troncos secos, el poncho de Ramón) son materiales: las da el premio del capítulo (`premioDe2(8, decisiones)`), no la escena.
- **Variantes por decisiones previas**: la bolsa del acto I (D1) cambia `piedras-molino` (Josefina saca la nota de Eusebio), `cuaderno-abuelo`, la entrada del capítulo 6 y las optativas `trigo-abuelo` y `masa-crece`. D2 cambia `rueda-gira` (los puntitos verdes), `guardia-molino` (saludan o tiran bellotas), `molienda-partir` y las entradas y cierres de los capítulos 6 y 7. D3 cambia la entrada del 8 y el cierre del 7. El lazo de Ramón cambia `secreto-ramon`.

## Convención de efectos (sigue la del acto I, `historia-escenas-util.js`)
Son pasos `{ tipo: 'efecto', nombre, args? }` o el `efecto` de una opción. `EFECTOS_ACTO2` los lista a todos (112, de ellos 39 son `raro:`). Nombres nuevos del acto II, además de `lazo:`, `decision:`, `ramal:`, `raro:`, `objeto:`, `entrega:`, `dar:` y `optativa:` (que se usan como en el acto I):

| Efecto | Qué hace el aplicador |
|---|---|
| `mundo:zaino-prestado` | el zaino queda prestado para acarrear (cap. 5) |
| `mundo:tocon-coihue` | el coihue grande pasa a ser un tocón ancho (la tala la hace el jugador; este es el marcador para la historia) |
| `mundo:pago-tito` | Tito paga la tala; `args = { cosa: 'tabla-coihue', n: 12 }`. El importe lo decide la economía (precio de la tabla fina), no el guion |
| `mundo:vender-tablas` | venta de las seis tablas de coihue a Tito; `args = { cosa: 'tabla-coihue', n: 6 }` |
| `mundo:pirca-coihue` | la pirca de piedras redondas alrededor de la raíz; `args.donde` es una referencia de escena. En la noche cuenta como defensa extra (D6) |
| `mundo:rueda-gira` | la rueda del molino de la historia gira por primera vez (con su sonido de muela) |
| `mundo:puntitos-verdes` | dos puntos verdes que se encienden y se apagan entre las raíces; `args.donde` |
| `mundo:huellas-escarcha` | las huellas chiquitas que brillan en la escarcha, de `args.desde` a `args.hasta` |
| `mundo:yerba-en-raiz` | el puñado de yerba sobre una hoja de nalca en la raíz de la ladera |
| `mundo:horno-se-cierra` | la puerta del horno de la panadería se cierra sola |
| `mundo:receta-pan-casero` | Rosa enseña el pan casero (`p.cocina.sabe`) |
| `mundo:diez-bolsas` | diez bolsas de harina apiladas junto al molino; `args.donde` |
| `mundo:bolsa-a-la-raiz` | una bolsa de harina en el hueco de la raíz del coihue (o sobre el tocón); `args.donde` |
| `mundo:minga` | la minga: vecinos trabajando en el camino; `args.donde` |
| `mundo:fermin-oferta-sabida` | el jugador sabe de la oferta de Belisario a Fermín (abre la opción A de D5 sin penalidad si el lazo de Fermín es ≥ +2) |
| `mundo:galpon-ronda` | la harina en doce montoncitos en ronda, con huellas, en el piso del galpón del jugador; `args.donde` |
| `mundo:pozo-cuaderno` | el pozo del medio con el cuaderno envuelto en hule; `args.donde` |
| `mundo:fogon-leyenda` | el fogón de la aldea encendido con la gente alrededor; `args.donde` |
| `mundo:pluma-en-umbral` | la pluma de cóndor apoyada contra la puerta del refugio; `args.donde` |
| `mundo:nieve-alta` | primera nevada sobre la cordillera (solo la parte alta del cielo/montaña) |
| `mundo:cantos-veta` | la veta de la cantera rellena de cantos blancos; `args.donde` |
| `mundo:tropa-mulas` | la tropa de mulas de Belisario camina hasta `args.hasta` |
| `duende:lechucero-vuela` | silueta de lechuza con un duendecito montado que cruza contra la luna: `args = { tipo: 'volador', desde, hasta, contraLuna: true }` |
| `duende:enjambre-lago` | tres lucecitas ámbar sobre el agua que se apagan de a una: `args = { tipo: 'enjambre', n: 3, sobre, seApagan: true }` |
| `duende:siluetas-raiz` | `n` siluetas que se asoman de a una por las raíces: `args = { tipo: 'rastreador', n: 5, desde, escalonado: true }` |
| `duende:siluetas-saludan` | una de las siluetas levanta la mano una vez (animador `saludar`) |
| `duende:siluetas-corren` | las siluetas huyen y se esconden entre las raíces |
| `duende:pillos-bellotas` | tres duendes tiran bellotas al techo del molino toda la noche: `args = { tipo: 'rastreador', n: 3, tiran: 'bellotas', alTecho: true, desde }` |
| `objeto:cuaderno-eusebio` · `foto-movida` · `pluma-condor` · `llavecita` · `cantos-blancos` | el objeto de historia queda en la mochila (descripción en `TEXTO_ACTO2.objetos`) |
| `entrega:dedal-ercilia` · `pipa-belisario` · `cuchara-rosa` | las tres cosas perdidas salen de la mochila |
| `dar:pan-casero:2` · `dar:tabla-coihue:12` | el jugador recibe esas cosas de la economía |
| `optativa:veta-vuelve` | ofrece la optativa «La veta que vuelve» (aparece en `tobias-pirca`, se juega en el capítulo 8) |

Todos idempotentes. Condiciones (`si: { cond, args }`) las mismas del acto I: `decision` `{ d, es }` (acá con `d` = `bolsa`, `coihue`, `molienda`; `es` = `a`, `b`, `c` o `ninguna`), `lazo` `{ quien, min?, max? }` (la usa `secreto-ramon`: `min: 0` sobre `ramon`; con `no: true` es la contraria) y `evento` `{ id }` (el acto II no la necesita). Una condición no registrada da `false`.

### Importante para el aplicador: los apagones
El director descarta, al saltear una escena, los pasos que iban a correr a mitad de un fundido **cruzado**. Por eso el acto II no usa `fundido: cruzado`: un cambio de hora, un prop nuevo o una aparición se escriben como `...apagon([pasos])` (`fundido` a negro, los pasos como pasos comunes, `fundido` a claro). Al saltear, todos esos pasos se aplican como cualquier otro.

Condición nueva del acto I, agregada por A: la condición «presente» dice si un vecino (por ejemplo Rosa) ya vive en la aldea; la escena bolsa-alero la usa para ofrecer o no llevarle la bolsa a Rosa.

## Pedidos para el agente A (lo que el guion usa y todavía no existe)
Las escenas corren igual sin ellos (el motor ignora al personaje o al lugar que no está), pero lo que dependa de ellos no se ve.
1. **Lugares con nombre**: las escenas se anclan al jugador salvo donde existe el lugar (`estacion`, `muelle`, `faro`, `galpon`, `mallin`); `T.lugares` **no** tiene `molino-viejo` (con el coihue marcado), `molino-historia` (el molino de agua de la historia; `T.lugares.molino` es el de viento), `puesto-alto`, `puesto-paso`, `cantera`, `seccional`, `panaderia`, `casa-te`, `predio-fogon` ni `casa-abuela`. Los dispara A con el jugador parado ahí (`DISPARO_ACTO2[id].jugadorEn`).
2. **El coihue grande** marcado, con su raíz, su hueco para la bolsa y la posibilidad de talarlo (seis hachazos) dejando un tocón. Y la pirca (`mundo:pirca-coihue`) como prop.
3. **El molino de agua de la historia** con rueda, muela y el sonido (ya existe el ruido de muela), el aserradero, y el **galpón** del jugador con un piso de tierra donde caben la ronda de harina y el pozo.
4. **Duendes**: los cinco `duende:*` de arriba con `historia-duendes.js` (`volador`, `enjambre`, `rastreador`); el `volador` nunca se usó en la Historia.
5. **Props**: huellas brillantes en la escarcha, yerba sobre una hoja de nalca, humo de fogón con la gente sentada alrededor (`mundo:fogon-leyenda`), la minga, la tropa de mulas, la pluma, la veta con cantos blancos, la primera nieve alta.
6. **Objetos**: `foto-movida` (una foto guionada con tres manchas doradas), `cuaderno-eusebio`, `pluma-condor`, `llavecita`, `cantos-blancos` (10), y las tres cosas perdidas (`dedal-ercilia`, `pipa-belisario`, `cuchara-rosa`, que aparecen en lugares raros: un poste del andén, la vía cerca del faro, la bota de un tendal). `lampara-eusebio` y `poncho-ramon` los da el premio de los capítulos 6 y 8.
7. **Pantalla del cuaderno**: sus tres partes (`cuaderno-1` a `-3`) y la **página de tratos** (`paginaTratosDe2`). `TEXTO_ACTO2.raro` tiene 39 entradas del capítulo 5 al 8 con `titulo`, `texto`, `cap`, `donde`; la fecha la pone el aplicador.
8. **Personajes que hablan**: Tito (`carpintero`), Tobías, Belisario, Nahuel (`nene`), Lucía (`nena`) y Sofía (`fotografa`) están en `PERSONAJES_ACTO2` con la clave del juego; Graciela, Fermín y los del acto I como antes. El cuaderno de Eusebio y la libreta hablan como la nota (`clave: null`).
9. **Optativas**: sus ids en `TEXTO_ACTO2.capitulos[n].optativas`; cada una se cierra con la escena de su mismo nombre (tabla de arriba). `masa-crece` y `trigo-abuelo` deberían ofrecerse solo con D1 = b / c, `tablas-tito` con D2 = b, `veta-vuelve` con D2 = c (esta última la ofrece `tobias-pirca`).
10. **Premios y desbloqueos** (`TEXTO_ACTO2.capitulos[n].premio`): lo material es de A. Los desbloqueos nombrados son `molino-de-la-historia`, `farol-y-lugares-raros`, `pagina-de-tratos` y `horario-de-invierno`.
11. **Estaciones**: la puerta del capítulo 5 usa `entradaDe2(5, decisiones, { puerta: 'temprano' | 'tarde' })`; si todavía es verano, la tarjeta corta; si el otoño ya pasó, la entrada normal con el párrafo del arroyo crecido adelante. El clima forzado de la guion no está implementado.
12. **Fecha de la minga y la Noche de la Leyenda**: `minga-aldea` y `fogon-leyenda` son escenas guionadas que A puede disparar el día de la fiesta o, si ya pasó, como fiesta de historia; el texto no nombra el día.

## Decisiones de redacción
- El guion está tal cual donde tiene líneas completas; donde las resume, se completaron con líneas nuevas del mismo estilo (por ejemplo la libreta de Ercilia, las tres partes del cuaderno de Eusebio, el recado de Belisario). Los nombres de vecinos que ya no están en el cuaderno (don Aníbal Salazar, la viuda de Prieto) son nuestros.
- Los gestos del guion entre corchetes se traducen con `POSE_DE` a las poses que existen (reír = manos a la cintura; suspirar = manos juntas; tomar mate = brindar). El sombrero de Ramón al agacharse usa la pose `gorro`; la yerba, `tocar`.
- Elecciones: 37 en el acto II, con 89 opciones: 27 con efecto (lazos, decisiones, un duende que huye) y 62 de **sabor declarado** (`sabor: true`: solo cambia el tono).
- Cero inglés, nada religioso (la palabra es «dejar», «convidar»), sin nada explícito, solo teclado y ratón.

## Verificación
- `pruebas/verificar-4-16-0-escenas-acto2.mjs` (en el gate): las 37 escenas pasan el validador del motor; ids exactos; cada una se corre por **todos los caminos de elección** y por **todas las combinaciones de decisiones y lazos** que mira, con un mundo de mentira; se saltan a los 2, 40, 300 y 1500 cuadros; cada elección tiene efecto o es de sabor declarado; los efectos siguen la convención y están registrados; largos de línea (≤ 260), de opción (≤ 96), de pregunta (≤ 72) y de párrafo (≤ 420); sin inglés, sin palabras religiosas ni explícitas, sin nombres propios ni lugares que no existan (claves contra `gente.js`, `aldea.js`, `gente-campo.js`; lugares contra `T.lugares`); ids de elección únicos contra el acto I; tabla de disparo y objetivos consistentes con las tarjetas; esta documentación lista los 37 ids y cada efecto de `mundo:` y `duende:`; y **51 mutaciones** de los datos (se rompe una garantía a propósito) que la prueba atrapa todas.
- Pasos de `npm run verify`: ver el informe de la entrega.

## Lo que no se verificó
- No se miró ninguna escena en Electron: el ritmo de los planos, el largo de los diálogos al leer, los saltos de hora con la luz real y la puesta en el mundo (las anclas relativas al jugador) hay que verlos jugando.
- Los gestos se probaron contra la lista de poses del motor, no a ojo con cada personaje; `gorro` y `tocar` en Ramón son una suposición.
- Los duendes del acto II (`volador`, `enjambre`, varias siluetas) y los props de `mundo:` no existen todavía: las escenas corren, pero esa parte no se ve.
