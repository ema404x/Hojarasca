# Hojarasca 4.21.0 (parte B) — la Historia arranca bien

Rama `v4210-b`, sobre `main` = 4.20.0. No se subió la versión (lo hace el cierre). Es la parte B de la 4.21.0: el paquete «La Historia arranca bien» de `AUDITORIA_4_20_0_B.md` (hallazgos 1, 4 y 6 a/c) más lo que `AUDITORIA_4_20_0_A.md` (hallazgo 3) le deja a la Historia: los premios en pesos y las metas con plata. **Cambia el juego.** 0 programas de shader nuevos (base 111: medido en la partida real, 111 → 111), 0 capas de pantalla ni llamadas de dibujo nuevas: todo es lógica, textos y un poco de DOM.

## Resumen de decisiones (lo recomendado por los informes, salvo lo que se anota)
| tema | decisión |
|---|---|
| Estación de fábrica | Una Historia **nueva** ignora el selector de «Estación» y usa las estaciones solas (la opción «mejor» del informe). El chip se apaga con el motivo. Una Historia **empezada antes** conserva lo que se eligió a mano (el informe proponía no tocarla). Terminada la Historia, el selector vuelve a andar («todo sigue abierto»). |
| «Hora de tu reloj» | Se apaga el chip en cualquier Historia en marcha y, al empezar o retomar la Historia, un día vuelve a durar 30 minutos (aviso en pantalla). Vale también para las Historias viejas: con ese ajuste 27 objetivos sólo valen a la hora real. |
| Panel de objetivos | Con la Historia en marcha (o una Historia nueva en pausa o terminada) no se muestra «Primeros pasos»: el panel del capítulo es el único. |
| Espera | Línea gris debajo del objetivo cuando sólo falta la hora (o pasar la noche): «Falta esperar hasta las 17:00 (R te sienta y el reloj corre más rápido)». |
| Un indicio antes | La risa de la primera noche, anotada al despertar (capítulo 1). No se tocó ninguna escena. |
| Premios | Los 13 capítulos pagan pesos (total **$23.600**); las 26 yerbas ($2.600) quedan adentro. |
| Metas con plata | Tres optativas («De paso»), una por acto: el puesto de la feria, el establo del zaino y el cobertizo de heno. Nunca traban, no cruzan de acto, no dan lazo. |

## 1. La estación propia de la Historia (hallazgo 1)
**Qué pasaba:** `AJUSTES_BASE.estacion = 'verano'` y `conClimaDeHistoria` sólo aplicaba el otoño y la helada de la historia con la estación en «Que pasen solas». Del capítulo 5 al 13 la Historia se jugaba en un valle verde mientras los textos hablaban de lengas coloradas, hielo y nevada.

**Cómo quedó:** `src/historia-ajustes.js` (módulo puro, nuevo). `estacionEfectiva(ajustes, h, esDesafio)` devuelve `'auto'` cuando rige la estación propia y, si no, el ajuste del jugador. Rige en una Historia **por empezar** (con «Historia» elegida en la portada) o **empezada con la bandera `arranqueNuevo`**; no rige en Libre, en el Desafío, ni con la Historia terminada.
- `main.js`: la función `estacionAjuste()` reemplaza a **todos** los `ajustes.estacion` del archivo (había nueve: el arranque del mundo, el cuadro, la ropa de la gente, el invierno de la aldea, el pronóstico, el nombre de la estación, `conClimaDeHistoria`…). Ya no queda ningún `ajustes.estacion` en `main.js` (la prueba lo vigila).
- El chip marcado de «Estación» es el que rige («Que pasen solas»), no el «Verano» guardado, y los chips quedan apagados con el motivo debajo («En la Historia las estaciones pasan solas: el otoño y la nevada son parte del cuento.»), en la portada y en los ajustes de la pausa.
- Las puertas de estación (capítulos 5, 9 y 13) dejaron de decir «cuando cambie la estación» (con el verano fijo nunca cambiaba): ahora «el capítulo empieza solo en un par de días, o antes si cambia la estación: dormir (E) o esperar sentado (R) lo adelanta». El botón de la tarjeta dice lo mismo.
- **Partidas viejas:** la bandera `progreso.historia.arranqueNuevo` (booleana) la pone `empezarHistoria` sólo cuando la Historia es nueva; una Historia guardada sin ella (todas las de antes) sigue usando `ajustes.estacion`. `sanearHistoria` la lee (`=== true`) y una bandera retocada vale falso.
- **Visto en la partida real** (`humo-4-21-0-b`, capítulo 9 con «Verano» en los ajustes): con la bandera, el invierno de la historia llega a 1 y el valle tiene nieve (captura `2a`); sin la bandera (el «antes», una Historia vieja) queda verde con el invierno en 0 (captura `2b`).

## 2. La hora de tu reloj (hallazgo 4 d)
`relojApagado` / `duracionAlEntrar` en `historia-ajustes.js`. En `main.js`, `alEntrarEnLaHistoria()` se llama desde `alActivarHistoria` (el gancho que ya usaban `empezar()` y `alEntrar()`): si el ajuste era «Hora de tu reloj», pasa a 30 minutos, se guarda, repinta los chips y avisa («El día vuelve a durar 30 minutos»). El chip «Hora de tu reloj» queda apagado con su motivo mientras haya Historia en marcha.

## 3. La línea de espera y la guardia (hallazgo 4 a, b y c)
- `src/historia-espera.js` (módulo puro, nuevo): `esperasDelCapitulo(h, s)` da `{ idObjetivo: texto }` para los objetivos visibles, sin cumplir, **cuya escena sólo vale en una ventana de hora** y a los que sólo les falta la hora (o pasar la noche): las escenas previas (`requiere`) tienen que estar vistas y las excluyentes (`no`) sin ver; si falta otra cosa no se anuncia. Si alguno de los disparadores de la escena no tiene ventana, se puede a cualquier hora y no hay línea. El texto distingue «hasta las 17:00» (hoy), «hasta las 0:30 (de madrugada)» y «hasta mañana a las 5:30».
- El objetivo se une a su escena con `escena(id)` (la función ahora lleva `f.escena = id`) o con el campo nuevo `escena:` en cuatro objetivos que no usan el ayudante (`cuaderno:ramon`, `cuaderno:fogon`, `nevada:estacion`, `deshielo:fiesta`).
- **20 objetivos** arman su línea (la prueba lo cuenta armando cada uno con lo estructural a favor y una hora afuera de la ventana). Las dos excepciones anotadas: `arco:plumas` y `arco:deuda` (se cumplen por varias escenas, algunas de día y otras sin ventana: no hay una sola hora que esperar). El informe contaba 27 con ventana porque incluía los de otras formas (el faro de noche, las decisiones); esos no son «sólo la hora».
- El panel (`historia-ui.js`) dibuja la línea debajo del objetivo, en gris cursiva (`p.espera`). Visto en la partida real (captura `3`): «Falta esperar hasta las 0:30 (de madrugada) (R te sienta y el reloj corre más rápido)»; y la medición: de pie el reloj avanza +0,042 h en 3 s, sentado (R) +0,331 h (×8), o sea que la línea dice la verdad.
- **El texto de la guardia** decía «entre las 22 y las 2» y la escena arranca entre las 0:30 y las 2:30. Ahora: «Hacé guardia en el molino viejo, pasada la medianoche: sentate cerca del coihue (con un banco, O) y esperá; la guardia es entre las 0:30 y las 2:30». También el objetivo del fogón (capítulo 8) dice «(de 20:30 a 23:30)», que es su ventana.

## 4. El panel único (hallazgo 6 a)
`sinPrimerosPasos(h)` (en `historia-ajustes.js`) y `revisarGuiaRelax` (`main.js`): «Primeros pasos» no se muestra ni avanza con la Historia en marcha, ni en una Historia nueva en pausa o terminada (para que el premio de «Ya sabés lo básico» no llegue doble). Una Historia vieja en pausa sigue con su guía de siempre. Visto en la partida real (captura `1`): al minuto 1, un solo panel, el del capítulo 1, arriba a la izquierda a 92 px.

## 5. Un indicio antes (hallazgo 6 c)
Indicio nuevo `risa-primera-noche` («Una risa la primera noche», capítulo 1, en `historia-texto-acto1.js`). `alCumplirObjetivo(h, 'llave', 'noche', s)` lo anota al cumplirse «Pasá tu primera noche» (una sola vez) y la UI avisa con «El cuaderno anota algo raro» y lo deja en el diario. Así la pregunta de Ercilia en el capítulo 2 («¿no oíste nada?») tiene un porqué, y el cuaderno de lo raro ya tiene su tercer indicio antes de salir de la primera mañana. La opción «Una risa, lejos» de esa charla sigue anotando `risa-lejos` (otro texto, el de Ercilia). Una sola entrada: no toca escenas ni disparadores.

## 6. Los premios en pesos (hallazgo 3 de A)
`CAPITULOS[...].premio.pesos` (la clave ya existía: `cobrarPremio` ya cobraba `premio.pesos`; el capítulo 9 con la majada vendida ya daba $3.000). Nada se cambió de las cosas y los materiales.

| cap. | título | pesos | de los cuales, yerba convertida |
|---|---|---|---|
| 1 | La llave del molinero | $1.000 | |
| 2 | La bolsa del molinero | $1.000 | |
| 3 | La mesa larga | $1.400 | $400 (4 yerbas) |
| 4 | La señora del ramal | $1.800 | $800 (8) |
| 5 | La rueda | $1.500 | |
| 6 | Lo que se pierde, aparece | $1.900 | $400 (4) |
| 7 | La cosecha | $1.700 | $200 (2) |
| 8 | El cuaderno de Eusebio | $1.900 | $400 (4) |
| 9 | Los primeros fríos | $2.400 (+ $3.000 con la majada vendida) | $400 (4) |
| 10 | Golpeá antes de abrir | $2.000 | |
| 11 | El arco y la honda | $2.000 | |
| 12 | La noche de la nevada | $2.500 (las cuatro variantes) | |
| 13 | El deshielo | $2.500 | |

Total **$23.600** (el informe pedía $15.000 a $25.000 y «uno por capítulo del orden de un día de ingreso tranquilo»): el acto I entre $1.000 y $1.800, el II entre $1.500 y $1.900, el III entre $2.000 y $2.500. Los textos de cada premio dicen la plata. El libro de pesos ya no lleva el texto largo del premio: `cobrarPremio` acepta `premio.motivo` y `premio.con` (la tarjeta pasa «La historia del valle · <capítulo>» y «Los vecinos del valle»); los premios de siempre (sin motivo) quedan igual. Visto en la partida real: pesos 0 → 1.400 al cerrar el capítulo 3, con ese renglón (captura `5a`).

## 7. Las metas con plata (hallazgo 3 c de A)
Tres optativas nuevas en `historia-optativas.js` (con su tablón en `historia-texto-optativas.js`): nunca traban, no cruzan de acto, `premio: null` (lo que se gana es la obra o el puesto).
- `puesto-feria` (capítulos 3 y 4, Ercilia): comprar el puesto propio en la feria. El panel dice «cuesta $6.000, en el banco del pueblo» (el número sale de `PROPIEDAD.puesto.precio`). Se cumple con `negocios.casas.puesto` (dato nuevo en `estadoHistoria`: `puestoFeria`).
- `establo-zaino` (capítulos 5 a 8, Ramón): un establo para el caballo. Se ofrece con el zaino prestado (`zaino-ramon` vista) y se cumple con el plano `establo-caballo` terminado.
- `heno-majada` (capítulos 9 a 11, Fermín): un cobertizo de heno junto al refugio. Se ofrece con Ramón ya en cama (`ramon-cama` vista) y se cumple con el plano `cobertizo-heno` terminado.
El informe también nombraba «arreglar el techo con teja»: ese plano no existe, no se inventó. Hay 34 optativas en total (eran 31).

## Lo que **no** se hizo (y por qué)
- El primer viaje en trochita sin espera (hallazgo 6 b): toca el tren, es de otra versión.
- La marca de objetivo en el mapa y el agrupar las cadenas del capítulo 11 (hallazgo 5), los logros y los contadores (hallazgo 3 de B), las consecuencias (hallazgo 2): son de las versiones que sigue el informe.
- Más indicios en los capítulos 2 a 4 (hallazgo 7): se hizo uno; falta un pase de guion.

## Qué **no** se vio a ojo
- La línea de espera en los otros 19 objetivos (la prueba los arma uno por uno, pero sólo se vio a ojo la de la guardia).
- Los avisos bajo los chips en el idioma inglés (no se traduce todavía) y en pantallas angostas.
- El indicio de la primera noche en una partida jugada de punta (se disparó con el día adelantado, no durmiendo).
- La meta con plata terminada de verdad (el humo anota el puesto comprado a mano; el establo y el cobertizo se prueban con el plano terminado de mentira).

## Guardado
**Clave nueva:** `progreso.historia.arranqueNuevo` (booleana). Nada más: los ajustes no ganan claves; las optativas nuevas se anotan en `historia.optativas` como las demás. Una partida guardada sin la clave vale `false` (queda como estaba).

## Archivos
Nuevos: `src/historia-ajustes.js`, `src/historia-espera.js`, `pruebas/verificar-4-21-0-b.mjs`, `pruebas/humo-4-21-0-b.cjs`, este documento.
Tocados: `src/historia.js`, `src/historia-ui.js`, `src/historia-optativas.js`, `src/historia-texto-acto1.js`, `src/historia-texto-optativas.js`, `src/main.js` (quirúrgico: ver arriba), `src/plantilla.html` (dos avisos bajo los chips y el estilo del chip apagado), `package.json` (sólo `verify:pasos`).

## Pruebas
- **`pruebas/verificar-4-21-0-b.mjs`**: 115 comprobaciones y 24 mutaciones (cada una en su proceso, sobre una copia de `src/`; todas atrapadas): la estación (vieja, nueva, terminada, Libre, Desafío; `conClimaDeHistoria` y `estacionObjetivo` con el código real de `main.js`), el reloj, la espera (cada objetivo con ventana arma su línea, con horas, «mañana» y «de madrugada»; el panel de la UI la dibuja), el panel único, el indicio (también en la UI), los premios (suma, variantes, libro de pesos y la tarjeta de cierre), las tres metas, las puertas y dos recorridos completos del jugador de mentira (los trece capítulos sin atascos).
- **`pruebas/humo-4-21-0-b.cjs`** (partida real, candado de Electron, monitor externo): arranque con Verano y Hora de tu reloj, estación propia con antes y después, línea de espera y R, indicio, premio y meta; programas de shader 111 → 111.
- **Ajustadas a propósito** (valores que cambian): `verificar-3-1-historia`, `verificar-4-15-0-historia` (el «premio concreto» cuenta también los pesos), `verificar-4-16-0-historia-a` (el premio del capítulo 7 y el del 8 ya no son yerba: pesos 1.700 y 1.900), `verificar-4-18-0-optativas-a` y `verificar-4-18-2-lazos-a` (34 optativas), `verificar-4-18-0-escenas-optativas` (el tablón trae 28 del guion y tres metas con plata), `verificar-4-0-5-bajos` (la cuenta de la estación pasa por `estacionAjuste()`).
- En paralelo, `verificar-4-18-0-optativas-a` falló una vez con un `ENOENT` de su carpeta temporal (corrida con otras pruebas a la vez) y pasó sola: es de tiempo, no del juego.
- No se corrió `npm run verify` completo (lo pide el cierre).
