# Auditoría 4.20.0 (B): la Historia, su ritmo, su primera hora, sus consecuencias y sus metas

Rama `v4200-b`, sobre `main` = 4.19.0. **No cambia el juego**: sólo herramientas de medición nuevas en `herramientas/`. Todo lo que dice «medido» sale de los módulos reales (`historia.js`, `historia-disparadores*.js`, `historia-final.js`, `historia-noche.js`, el director de escenas, `terreno.js`) o de dos partidas cortas de Electron; todo lo que dice «estimado» lleva su supuesto al lado. El día dura 30 minutos reales (valor de fábrica): **1 hora de juego = 75 s**, caminar 3,2 m/s, correr 6,6 m/s, sentado (R) el reloj corre ×40.

## Resumen: los cinco hallazgos más importantes

1. **Con los ajustes de fábrica, del capítulo 5 al 13 la Historia pasa en un valle verde de verano.** El clima propio de la historia (otoño forzado, helada, nevada) sólo se aplica si la estación está en «Que pasen solas»; de fábrica está en «Verano» y nada la cambia al empezar la Historia. Los textos dicen «las lengas amanecieron coloradas», «el balde amaneció con hielo», «la noche de la nevada» y las tarjetas de espera dicen «la historia sigue sola cuando cambie la estación» (no cambia nunca: sólo pasan los dos días). Costo: bajo.
2. **Las consecuencias están muy desparejas y el lazo se puede lavar.** De las seis decisiones, la D5 (majada) decide por sí sola quién está en la noche (Ramón y Fermín: 100 % / 100 % con A, 100 % / 0 % con B, 0 % / 0 % con C) y la D6 parte la historia en dos; pero la D3 (molienda) A y B no vuelven a aparecer en ninguna escena, la tarjeta del final sólo mira cinco cosas (D4 A, D5 A, ramal, Graciela, noche perdida) y los 28 encargos del Relax suman +1 de lazo cada uno a quien los pide (Ramón 9, Josefina 7, Nicanor 6, Elsa 3, Ercilia 3) sobre un rango de sólo 6 puntos (−2 a 3): se borra cualquier decisión.
3. **La Historia no tiene ni un logro ni una meta a la vista**, siendo el modo que más se juega: los 34 logros de Steam son 16 del Relax y 18 del Desafío. Los datos para disparar al menos 25 logros de Historia **ya se guardan** (propuesta abajo, con cuáles se pueden cumplir y cuáles no) y la guía no muestra ningún contador («X de 117 indicios», «N de 31 de paso»).
4. **El ritmo de las dos primeras horas es de tareas, no de historia.** En los capítulos 1 a 4 (105 min del guion) las escenas suman **5,5 a 12 minutos de lectura (5 a 12 %)**; en los capítulos 10 a 13 suben a 17–59 %. Con la política de reembolso de Steam (2 horas), el enganche tiene que estar antes. Además la trochita, que es el eje de la historia, es **2 a 3 veces más lenta que ir a pie** para el primer mandado (ver 6).
5. **Faltan avisos donde el jugador se queda esperando**: 27 objetivos tienen ventana de hora (4 de menos de 3 horas, 150 a 225 s reales); el panel nunca dice que R acelera el reloj; el objetivo de la guardia dice «entre las 22 y las 2» y la escena arranca a las 0:30; y no hay marca de objetivo en el mapa (32 de los 34 objetivos de escena se podrían marcar con datos que ya existen).

## Cómo se midió (y qué es qué)

| herramienta | qué hace | medido o estimado |
|---|---|---|
| `herramientas/auditoria-historia-b.mjs` (`escenas`, `ventanas`, `ecos`, `lazos`, `corridas`, `logros`, `marcas`) | cuenta escenas, líneas, ventanas, ecos de decisiones, fuentes de lazo y logros con los módulos reales | medido (lectura: estimado, ver abajo) |
| `herramientas/auditoria-historia-corridas.mjs` | 240 partidas completas de mentira (`pruebas/ayuda-4-18-4-historia.mjs`: elecciones y decisiones al azar, hechos del mundo al azar) | medido, pero **un jugador al azar ve más escenas que una persona** (29 a 94 de 124): sirve para alcanzabilidad, no para porcentajes de gente real |
| `herramientas/auditoria-historia-corridas-noche.mjs` | lo mismo, sacando una foto de lazos y decisiones justo cuando la noche queda pendiente (120 partidas, copia de `src/` con una línea de más) | medido |
| `herramientas/medir-puntos-historia-4-20-0.cjs/.ps1` | partida real corta: lugares con nombre, vía, estado de la pantalla en el primer minuto | medido (`herramientas/datos-4-20-0-b/puntos-historia.json`) |
| `herramientas/medir-estacion-historia-4-20-0.cjs/.ps1` | dos capturas del capítulo 9 con el verano fijo y con «Que pasen solas» | ver el hallazgo 1 |

Tiempo de lectura de una escena: **estimado** con dos ritmos, 42 letras por segundo (la máquina de escribir de `CPS`) y 15 letras por segundo (lectura cómoda), más 0,8 s por línea para apretar la tecla. Las tareas de trabajo (talar, construir, cocinar, moler) **no se midieron**: son lo que más tiempo ocupa y no hay forma de saberlo sin jugar.

---

## Hallazgos ordenados por impacto

### 1. La estación de fábrica deja la Historia en verano (alto impacto, costo bajo)
- **Dónde:** `src/guardado.js:250` (`AJUSTES_BASE.estacion = 'verano'`); `src/main.js:2434-2440` (`conClimaDeHistoria` devuelve la estación sin tocar salvo con `ajustes.estacion === 'auto'`) y `src/main.js:11195` (el único lugar donde se usa); `src/historia.js:421-423`, `521`, `628` (las tres puertas: «cuando cambie la estación»); `src/historia-ui.js:654-659` (el texto de la portada de la Historia no dice nada de la estación). El selector de la portada está en `src/plantilla.html:768`.
- **Evidencia:** nada en `main.js`, `historia-ui.js` ni `trucos.js` pone `estacion = 'auto'` al empezar la Historia (las partidas de humo de 4.16 a 4.18 la ponen a mano: `ajustes('historia', { estacion: 'auto' })`). La nevada del capítulo 12 también depende de eso: `main.js:8580` convierte el tramo en `'lluvia'` y «con el invierno forzado la lluvia es nieve»; con verano fijo llueve. Con verano fijo `estacionNatural` es siempre `'verano'`: la puerta del 5 y la del 9 se abren por el tope de 2 días, no por la estación.
- **Capturas (vistas a ojo):** `herramientas/datos-4-20-0-b/capitulo9-verano.png` y `capitulo9-auto.png`: el mismo lugar (el mástil del refugio), capítulo 9 «Los primeros fríos», a las 12, con el mismo panel de objetivos. Con «Verano» hay lupinos en flor y pasto verde; con «Que pasen solas», nieve en el suelo, en los techos y en los pinos, y copos en el aire. La partida confirma que `estacionForzada()` da «invierno» en los dos casos: lo único que cambia es si `main.js` la aplica.
- **Propuesta:** al empezar una Historia nueva, fijar `estacion = 'auto'` (y avisarlo en el texto de la portada), o mejor: que la Historia ignore el selector y use `estacionForzada` siempre, apagando el chip con el motivo debajo (como se hizo con las noches largas y la hora del reloj en 4.11.0). Cambiar también «cuando cambie la estación» por «en un par de días».
- **Costo:** 0,5 jornada (una condición en `conClimaDeHistoria`, un texto, una prueba de conducta con `ayuda-codigo.mjs`). Hay que decidir qué pasa con una partida de Historia ya empezada con verano fijo (propongo no tocarla).

### 2. Consecuencias: qué recuerda el valle de lo que decidiste (alto, costo medio)
Cuántas escenas distintas «saben» de cada opción (variantes `siDecision` + escenas propias + optativas que se ofrecen; medido con `ecos`) y en qué capítulos aparecen:

| decisión | A | B | C | lo que más pesa |
|---|---|---|---|---|
| D1 bolsa (cap. 2) | 4 (cap. 2-3, 13) | 9 (cap. 2-3, 6, 10-11, 13) | 6 (cap. 3, 5, 8) | B: la deuda con los duendes (cap. 10-11) |
| D2 coihue (cap. 5) | **1** (sólo el cap. 5) | 11 (cap. 5-7, 10-11, 13) | 4 (cap. 5, 8, 11) | B: talar cambia medio acto III |
| D3 molienda (cap. 7) | **1** (sólo el cap. 7) | **1** (sólo el cap. 7) | 3 (cap. 7, 13) | A y B: **nada después del capítulo 7**, salvo el ramal (A suma 4) y un lazo de Ercilia |
| D4 cuaderno (cap. 8) | 5 (cap. 12-13) | **1** (cap. 13) | **1** (cap. 13) | A: la aldea entera en la noche |
| D5 majada (cap. 9) | 4 (cap. 9, 11) | 3 (cap. 9, 13) | 8 (cap. 9, 11, 13) | **decide los aliados de la noche** |
| D6 duendes (cap. 10) | a y b casi iguales (`b` sólo suma un convite y una bandera `fuerte`) | | c: la pelea | trato o pelea parte el acto III y el final |

- **Aliados de la noche** (`aliadosDe`, `src/historia-noche.js:36`, 116 partidas de mentira con la noche pendiente): ninguno 3 %, uno 22 %, dos 36 %, los tres 39 %; Ramón 80 %, Josefina 82 %, Fermín 48 %. Por D5: A → Ramón 100 % y Fermín 100 %; B → Ramón 100 % y Fermín 0 %; C → los dos 0 %. Por D2: Josefina 85 % (A), **68 % (B, talaste el coihue)** y 90 % (C). Sólo con las decisiones, sin escenas, de las 243 combinaciones de las cinco primeras: Ramón 126, Josefina 144, Fermín 0.
- **La tarjeta final** (`tarjetaFinal`, `src/historia-final.js`) sólo mira: trato o pelea, estado del ramal, `majada === 'a'`, `cuaderno === 'a'`, Graciela con lazo 3, las líneas de los siete vecinos por lazo y la noche perdida. **No hay una sola línea** para D1, D2, D3, D5 B y C ni D4 B y C (la escena `josefina-fin` sí trae una variante de D4 B y de D4 C, pero la tarjeta que se lleva la persona al terminar, no; el guion prometía para D4 C «llega una científica en el último tren» y «el coihue queda como árbol notable»; para D3 B, «más vecinos en la mesa»: ninguno está).
- **El lazo se lava.** `revisarEncargos` (`src/historia-optativas.js:283-300`) suma +1 por cada encargo del Relax hecho a quien lo pidió: `ENCARGOS` + `ENCARGOS_TEMPORADA` = 28 (Ramón 9, Josefina 7, Nicanor 6, Elsa 3, Ercilia 3). El lazo va de −2 a 3. La D5 C deja a Ramón en −2 (tope) y bastan 5 encargos para volver a +3; la D2 B deja a Josefina en −2 y bastan 4 para volver a +2. Sólo no se lava lo que está escrito sobre la decisión misma (Ramón no viene a la noche con D5 C: `decisiones.majada !== 'c'`).
- **Elecciones sueltas dentro de las escenas:** 130 elecciones en 124 escenas. Sólo 44 tienen un efecto que se guarda (lazo, decisión, ramal, quitar, noche…). 82 sólo cambian la respuesta de esa misma escena (de sabor) y 4 anotan algo en lo raro. Esto está bien como sabor, pero conviene saberlo para no prometerle al jugador peso donde no lo hay: las tarjetas de las decisiones ya lo dicen en palabras y eso es correcto.
- **Propuesta (4.21.x, sobre todo texto, pura y testeable):**
  1. `PIEZAS_FINAL` con una línea por opción de D1, D2, D3, D4 y D5 que hoy no tienen (≈ 12 líneas, una condición cada una en `tarjetaFinal`; la paginación ya está hecha). Prioridad: D3 A/B/C, D5 B/C, D4 B/C.
  2. Una variante de D3 en la escena de la mesa del capítulo 10 (`mesa-guerra`) y en `fogon-leyenda` según haya quedado el fiado o los fletes.
  3. Que los encargos del Relax dejen de sumar lazo a quien quedó «frío» o «tirante» por una decisión de la Historia (tope de +1 mientras `lazo < 0` por decisión), o que el tope por encargos sea +2 por persona. Así el 3 («de la casa») hay que ganarlo en la historia.
  4. D6 A y B: o se distinguen con una escena propia o se funden en una sola opción más clara («Dejar la puerta abierta» y «Dejar la bolsa en el umbral» son el mismo trato para el jugador salvo por la bandera `fuerte`).
- **Costo:** 1 versión corta de textos y pruebas (B), 0,5 jornada de mecánica para el tope del lazo (A).

### 3. Metas y logros internos (alto, costo medio, sirve para Steam)
- **Hoy:** `STEAM_LOGROS.md` lista 34 (16 Relax, 18 Desafío) y `logrosParaSteam()` (`src/steam.js:19-21`) sólo lee `LOGROS_RELAX` y los del Desafío. Dentro del juego la Historia tiene: el panel de objetivos, el cuaderno de lo raro (**117** indicios en `RAROS`; el guion decía 108), 31 optativas («De paso», con una estrellita), 13 lazos en palabras, 124 escenas con `resumen` y la «tarjeta final». Ninguno cuenta cuánto llevás.
- **Cómo se agregan:** `src/logros-relax.js` ya acepta cualquier `cumple(p)` sobre `progreso` y sale solo por `logrosParaSteam()`. Hay que sumar la lista nueva con el prefijo de API `HISTORIA_*`, sin escribir inglés (se traduce al final), y mirar que `vistaParaLogros(p)` (`main.js:3096`) deje pasar `p.historia`.
- **Propuesta de 26 logros** (`LOGROS_HISTORIA` dentro de `herramientas/auditoria-historia-b.mjs`, probados con 240 partidas de mentira: «sí» = alguna partida lo cumplió). Todos usan datos que ya se guardan:

| id | nombre | dato (`progreso.historia`) | ¿alcanzable? |
|---|---|---|---|
| H_LLEGADA / H_VERANO / H_OTONO / H_INVIERNO / H_DEL_VALLE | un logro por acto y uno por terminar | `cerrados.<capitulo>`, `terminada` | sí |
| H_TRATO / H_PELEA | los dos finales | `duendes.trato` al terminar | sí (66 % / 30 % de mentira) |
| H_CONVIDADO | dos convites | `esConvidado(h)` | sí |
| H_RAMAL | ramal salvado | `estadoRamal(h) === 'salvado'` | sí |
| H_NOCHE_UNA / H_NOCHE_OTRA | ganar al primer intento / perder y ganar | `duendes.noche`, `noche.intentos` | sí (la mentira no cuenta intentos) |
| H_DEUDA | pagar la deuda del trato | `duendes.deuda === 0` y la escena `deuda-pagada` | sí |
| H_PERDON | pedir perdón después de la pelea | `duendes.perdon` | sí |
| H_ARMAS / H_PRESTADO | arco y honda; las cuatro defensas prestadas | `duendes.armas`, `prestado` | sí |
| H_CASA_1 / H_CASA_5 | uno / cinco vecinos «de la casa» | `lazos` (>= 3) | sí |
| **H_CASA_TODOS** | los 13 «de la casa» | `lazos` | **no: es imposible.** Tobías sólo sube con D2 = C y Tito sólo llega a 3 con D2 = B (medido en las fuentes de lazo): mejor «5 de 13» y «8 de 13» |
| H_RARO_25 / H_RARO_60 | indicios anotados | `raro.length` | sí (máx. visto 84 de 117: **nadie los ve todos**) |
| H_OPT_10 / H_OPT_20 | optativas hechas | `optativas` | sí. **Máximo posible en una misma partida: 29 de 31** (cinco se excluyen por decisiones: `trigo-abuelo`, `tablas-tito`, `masa-crece`, `veta-vuelve`, `volver-a-subir`); no proponer «todas» |
| H_MAJADA_FERMIN / H_MAJADA_VENDIDA (oculto) / H_ARBOL_NOTABLE / H_TALADO (oculto) | los finales de D5, D4 C y D2 B | `decisiones` | sí |

- **Metas a la vista, sin logros:** en la guía F1 (caja «La historia del valle», `historia-ui.js:674`) sumar contadores: «Lo raro: 31 de 117», «De paso: 12 de 31 (hasta 29 en una partida)», «Vecinos de la casa: 3 de 13». Costo cero de datos.
- **Un cuaderno «Lo vivido»** con las 124 `resumen` ya escritas (171 caracteres de promedio, hoy sólo se muestran al saltar una escena: `escenas-mundo.js:345`), ordenado por capítulo y con el día. Sirve para volver a una partida después de una semana y para el que juega por tandas. Costo: una pestaña, sin texto nuevo.
- **Costo:** 1 versión (A mecánica + B nombres y descripciones) con prueba de que cada logro sea alcanzable por alguna combinación y ninguno se dispare en la primera hora.

### 4. Tiempo muerto: ventanas horarias y puertas (medio-alto, costo bajo)
- **Medido** (`ventanas`): 56 disparadores tienen ventana de hora, 27 de ellos son objetivos del capítulo. Las más cortas: `guardia-molino` 0:30–2:30 (150 s reales), `noche-espera` 21:30–23:36 (158 s), `secreto-ramon` 17–20 (225 s), `fogon-leyenda` 20:30–23:30 (225 s), `recorrer-lado` 16:30–20:30 (300 s). Largo medio 8,4 h.
- **Espera esperada** si una persona llega a cualquier hora del día y se queda quieta hasta la ventana: **146 horas de juego = 183 minutos reales**, sumando los 27 objetivos; con R sentado (×40): **4,6 minutos**. Es un techo (en la práctica se hace otra cosa mientras tanto), pero marca lo que vale avisar.
- **Tres puertas de 2 días** (`historia.js` capítulos 5, 9 y 13): 6 días del año de 12 son espera. Con R y dormir se cruzan en un minuto, pero el panel y la tarjeta no lo dicen (la tarjeta menciona «dormir» y sólo eso).
- **Texto que no coincide con la escena:** `historia.js:457` (`perdido:guardia`) dice «entre las 22 y las 2»; el disparador `guardia-molino` es `[0.5, 2.5]` (`historia-disparadores-acto2.js`). Quien se sienta a las 22 espera 2,5 horas más de las que dice el panel (con ×8 son 23 s, pero sin saber de R son 3 minutos reales).
- **La hora de tu reloj no sirve para la Historia:** con `duracion === 'reloj'` no hay siesta (`main.js:1518`), se duerme una vez por noche, las escenas no cambian la hora (`escenas-mundo.js:185`), las tres puertas son 6 días reales y 27 objetivos sólo valen a la hora real. Se puede elegir igual.
- **Propuesta:** (a) cuando lo único que falta de un objetivo es la hora o el día, el panel agrega una línea gris «Falta esperar hasta las 17:00 (R te sienta y el tiempo corre más rápido)»; el dato ya existe (`hora` del disparador); (b) la tarjeta de la puerta dice «en dos días: dormí o esperá sentado (R)»; (c) arreglar el texto de la guardia (`22 a 2` → `medianoche y media a dos y media`); (d) con Historia, apagar el chip «Hora de tu reloj» con el motivo debajo, como en 4.11.0.
- **Costo:** bajo (A, un día). Una prueba de conducta: cada objetivo con ventana debe poder armar su línea de espera.

### 5. Calidad de vida: marcas de objetivo, mapa y panel (medio, costo medio)
- **Marca de objetivo:** el mapa sólo dibuja de fábrica `T.lugares` + paradas + puestos de ruta + banco + cantina (`main.js:1892-1905`) y una marca automática (`marcasAutomaticas`, `chinches.js:68-105`: el galpón de esquila). No hay ninguna del objetivo actual. De 85 objetivos, 42 nombran un lugar en su texto; 34 se cumplen con una escena y **32 de esos 34** tienen un punto resuelto con datos que ya existen: 22 con `lugar` en su disparador y 10 con un vecino de casa conocida (`marcas`). El motor de la brújula ya sabe ir a una chinche (`rumboHacia`). Propuesta: una tecla (o el clic en la línea del panel) que pone la chinche en el próximo objetivo; costo bajo-medio, sin arte.
- **Lugares que el mapa no nombra** (por lectura del código; no pude ver el mapa dibujado): el molino viejo y el coihue grande (cuatro escenas y el objetivo de entrada del capítulo 5), la panadería, la carpintería, el estudio de fotos y la raíz de Ramón no están en `T.lugares`; 40 de las 67 escenas con lugar apuntan a puntos que `T.lugares` no trae.
- **Panel:** el capítulo 11 tiene **12 objetivos (13 con la deuda)** contra una mediana de 6 (85 en total); propongo agrupar las tres cadenas (arco, honda, prestado) bajo un título con contador. El texto promedia 67 caracteres.
- **Guardado:** el autoguardado va cada 20 s (`main.js:12032`) y al dormir y en cada cambio de la historia; no hay nada que arreglar.
- **Guía:** la F1 de la Historia sólo trae la caja «La historia del valle» (lazos, raros, optativas). Sumarle una línea con las teclas de la historia (E hablar/tomar, R esperar sentado, M mapa, J cuaderno) sirve para la primera hora.

### 6. Primera hora (medio-alto, costo bajo a medio)
- **Pantalla del minuto 1** (medido con Electron, `datos-4-20-0-b/puntos-historia.json`): arranca el día 1 a las **18:17** en la Estación del Valle; el sol se pone a las 20:30 (`cielo.js:523`), o sea **2 h 13 min de juego = 166 s reales de luz**, y se puede dormir desde las 19:30 (92 s). La tarjeta de entrada lista los 6 objetivos; con la tarjeta cerrada el panel de la Historia (6 líneas) y el de «Primeros pasos» (6 líneas, `relax-tutorial.js`) están **a la vez** en pantalla: 12 líneas, y 3 de las 6 de «Primeros pasos» repiten dos del capítulo (juntar ramitas y fuego = «Prendé un fuego»; anotar dos cosas = «Anotá dos cosas»). Además «Abrí los planos y marcá dónde va tu refugio» no corresponde: el refugio ya es tuyo.
- **El capítulo 1 es de 4 a 6 minutos reales, no de 20** (estimado: 1,0–2,2 min de escenas + 42 s a pie de la estación al refugio + fuego, anotar, dormir y el canto). No es malo (es el prólogo), pero conviene que el guion y el plan de capítulos lo sepan.
- **El primer mandado en trochita es lo más lento de la primera hora:** `tren.largo` = 2303 m, `objetivo` = 7 m/s, 5 paradas de 57 s; la vuelta entera son **614 s** (la fórmula del propio cartel de horarios, `aldea-mecanicas-mundo.js:489-493`). Espera media en el andén: 307 s. De la Estación del Valle a la Aldea (pasando por el Mallín): 1002 m ≈ 200 s. Total ≈ **8,4 min** de ida y ≈ **10 min** de vuelta (esperando y con dos paradas en el medio) contra **3,3 min** a pie en línea recta (632 m del refugio a la plaza, sin agua en el camino; 740 m desde la estación). El objetivo del capítulo 2 obliga a un viaje en trochita (`viaje`); con D1 = B o C hay otros dos mandados a la aldea (Rosa, Josefina). **Estimado**, no medido a bordo (la fórmula es la del juego).
- **Propuesta:** (a) con la Historia activa, ocultar «Primeros pasos» o reemplazarlo por una sola línea con lo que falta de verdad; (b) hacer que el primer viaje del capítulo 2 salga sin espera (el tren «de las 9» llega al andén cuando empieza el objetivo, o una escena de Elsa que lo detiene); (c) un gancho antes del minuto 20 (la risa/la ronda ya existen: `algo-cruza`, `ronda-umbral`; moverlos o duplicar un indicio a las primeras horas).
- **Costo:** bajo (a, c) a medio (b, toca el tren).

### 7. Ritmo: densidad de escenas (medio, informa a las otras versiones)
Medido con `escenas` (principales; entre paréntesis las optativas):

| cap. | escenas | líneas | minutos de lectura | % del guion (principal) | optativas |
|---|---|---|---|---|---|
| 1 | 5 | 20 | 1,0–2,2 | 5–11 % | 1 |
| 2 | 7 | 46 | 1,8–3,8 | 6–13 % | 2 |
| 3 | 5 | 41 | 1,7–3,9 | 7–16 % | 1 |
| 4 | **3** | 27 | 1,0–2,3 | 3–8 % | 3 |
| 5 | 7 | 67 | 3,0–6,7 | 9–19 % | 3 |
| 6 | 6 | 43 | 2,5–6,0 | 8–20 % | 2 |
| 7 | 6 | 51 | 2,4–5,6 | 8–19 % | 2 |
| 8 | 9 | 86 | 4,6–10,7 | 15–36 % | 3 |
| 9 | 6 | 55 | 2,9–6,9 | 10–23 % | 5 |
| 10 | 7 | 75 | 4,4–10,6 | 18–42 % | 2 |
| 11 | 17 | 108 | 5,8–13,6 | 17–39 % | 3 |
| 12 | 11 | 115 | 6,2–14,7 | 25–59 % | 0 |
| 13 | 7 | 86 | 5,0–11,9 | 25–59 % | 1 |

- Total: 96 escenas principales y 28 optativas; **99 min de lectura cómoda sobre 365 min de guion** (27 %). Los capítulos 1 a 4 (**el tramo de las dos primeras horas**) suman 22 escenas y 5,5 a 12,2 minutos; el capítulo 4, el primer giro, tiene sólo 3 escenas.
- **Qué significa:** la curva de tensión del guion sube, pero la de escenas arranca baja justo donde se decide si el jugador sigue. Las tareas (talar, construir, cocinar, moler) llenan el hueco. No hay que sacar tareas: hay que poner indicios (sin escena larga) en los capítulos 2 a 4: una silueta, un objeto movido, una charla de vecino con un indicio, que el sistema de presencia (`historia-presencia.js`) ya sabe hacer.
- **Días obligados:** noches y puertas fijan al menos 13 días de espera contra los 12 del guion (1 + 2 + 1 + 1 + 2 + 1 + 1 + 1 + 2 + 1), sin contar el trabajo; con el día de 30 minutos, 13 días son 6,5 horas si se juega sin saltar ni sentarse: el «~6 h» del guion es el tope y no la media.

### 8. Cosas menores (bajo)
- La partida de mentira se «atasca» en el capítulo 6 (`guardia`/`huellas`) en 10 de 240 corridas: son las ventanas más cortas (2 y 2,5 horas). No es un atasco real demostrado (el jugador de mentira salta la hora al azar), pero apunta a lo mismo que el hallazgo 4.
- `TOPE_RARO = 160` con 117 indicios: sin problema (el comentario dice 108).
- `H_NOCHE_OTRA`: los intentos de la noche están en `noche.intentos` y en `duendes.intentos`; antes de armar el logro hay que decidir cuál manda.

---

## Lo que no se pudo mirar
- **Las tareas de trabajo** (talar, construir, cocinar, moler, esquilar): no se midió cuánto tardan, así que los minutos por capítulo son sólo de escenas, caminatas y esperas. No hay estimación de cuánto dura un capítulo entero.
- **Gente real:** todo lo de partidas al azar (porcentajes de finales, aliados, lazos, logros) es de un jugador de mentira que ve más escenas que una persona y no hace encargos. Las cifras sirven para decir «se puede» y «no se puede», no «cuántos lo harán».
- **La trochita a bordo:** los 614 s de la vuelta y las esperas salen de la fórmula del cartel de horarios (largo, velocidad objetivo y paradas), no de viajar medido.
- **El mapa dibujado:** qué lugares de la Historia aparecen con nombre se dedujo del código.
- **Lo que dicen las escenas a ojo:** no se jugó ninguna escena; el estado de las cámaras lo cubren las partidas de 4.18.4.
- **Partidas en la 4600G, Steam, otros idiomas:** fuera de alcance.
- **Partidas viejas** con la estación fija: no se probó qué pasaría con el cambio propuesto en el hallazgo 1.

## Plan de versiones sugerido
| versión | de qué | contenido | costo |
|---|---|---|---|
| 4.20.1 (B + A) | «La Historia arranca bien» | hallazgo 1 (estación propia de la Historia), hallazgo 4 (línea de espera con R, texto de la guardia, apagar «hora de tu reloj» en Historia), hallazgo 6 a y c (panel único y un indicio antes) | 1 a 2 jornadas |
| 4.21.0 (B textos, A mecánica) | «El valle se acuerda» | hallazgo 2: ≈ 12 líneas de final, variantes de D3, tope del lazo por encargos, aclarar D6 A/B | 1 versión corta |
| 4.22.0 (A + B) | «Metas» | hallazgo 3: 26 logros de Historia + contadores en la guía + «Lo vivido» + API de Steam | 1 versión |
| 4.23.0 (A) | «No te pierdas» | hallazgo 5: marca de objetivo (chinche automática), agrupar las cadenas del capítulo 11, línea de teclas en la guía; primer viaje en trochita sin espera | 1 versión |
| después | gráficos (C) y Steam | el panel y el mapa ya quedan listos para las capturas de la tienda | |

Orden de importancia: 4.20.1 > 4.21.0 > 4.22.0 > 4.23.0. Con 3 agentes: A = mecánica de 4.20.1/4.22.0/4.23.0, B = textos de 4.21.0/4.22.0, C = gráficos; las versiones de C no tocan nada de lo de arriba.

## Archivos
- `AUDITORIA_4_20_0_B.md` (este informe)
- `herramientas/auditoria-historia-b.mjs`, `herramientas/auditoria-historia-corridas.mjs`, `herramientas/auditoria-historia-corridas-noche.mjs`
- `herramientas/medir-puntos-historia-4-20-0.cjs` y `.ps1`, `herramientas/medir-estacion-historia-4-20-0.cjs` y `.ps1`
- `herramientas/datos-4-20-0-b/` (`puntos-historia.json`, `corridas-240.json`, `corridas-noche-120.json`, `capitulo9-verano.png`, `capitulo9-auto.png`)
