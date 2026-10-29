# Hojarasca 4.17.0 (agente A) — Historia nueva: la mecánica del acto III (capítulos 9 a 13)

Rama `v4170-a`, sobre `main` = 4.16.0. No se subió la versión. B escribe sólo `src/historia-escenas-acto3.js` y `src/historia-texto-acto3.js` (guiones como datos); en esta
rama hay dos HUECOS con esos nombres (`ESCENAS_ACTO3`, `IDS_ACTO3`, `EFECTOS_ACTO3`, `POR_DEFECTO_ACTO3`, `DISPARO_ACTO3`; `TEXTO_ACTO3`). **Al juntar queda el archivo de B**
(conflicto «los dos agregaron»). La tabla de ids de B manda: si cambia un id, hay que cambiarlo en `historia-disparadores-acto3.js` (y en la prueba).

El reparto cambió a mitad de trabajo: lo «dudoso» del acto II, los props sin dibujar y los disparadores de `tablas-tito`, `foto-sofia` y `mulas-belisario` quedaron en el agente C
(rama `t4170-c`). **No toqué `historia-escenas-acto1/acto2*.js` ni `historia-disparadores-acto2.js`.**

## IDS DE ESCENA (contrato con B; los dispara `src/historia-disparadores-acto3.js`)
Una escena que no está escrita se da por vista (con su aviso en pantalla si cambia algo): la historia nunca se traba. Las anclas de las escenas son `jugador`, como en los actos I y II.

| Cap. | Id | Cómo sale | Qué cambia la mecánica sola |
|---|---|---|---|
| 9 Los primeros fríos | `ramon-cama` | auto en el Puesto Alto (14 m, 8–20 h) o E sobre Ramón | Ramón pasa a ser tu acompañante (a pie, despacio) |
| | `fermin-puerta` | tras `ramon-cama`, a menos de 40 m del Puesto Alto. **D5**: elección `majada`, efectos `decision:majada:a|b|c` | — |
| | `hojas-canelo` | a la mañana siguiente, cerca del Puesto Alto (6–12 h) | — |
| | `ramon-sanitario` | en la aldea (60 m de la plaza) con Ramón de acompañante, o si pasaron dos días | suelta al acompañante |
| | `papel-elsa`, `ramon-chocolate` | optativas: E sobre Elsa / E sobre Ramón | — |
| 10 Golpeá antes de abrir | `golpe` | E «Golpear» en la puerta de tu galpón (objeto `puerta-galpon`, sólo de noche en el capítulo 10) | — |
| | `encuentro` | tras `golpe`, a 22 m del galpón. **D6**: elección `duendes`, efectos `decision:duendes:a|b|c` (a = sentarte, b = la bolsa, c = «¡fuera!») | a y b → `duendes.trato = 'trato'`; c → `'pelea'`; b suma un convite; la deuda sale de D1 = b o D2 = b |
| | `cerro` | tras `encuentro`, a la mañana siguiente en el mirador | — |
| | `mesa-guerra` | tras `cerro`, con la mesa puesta, 16–21 h, a 35 m del refugio | (trae a los vecinos sin esperar tres días: es la escena la que los pone) |
| | `llave-79`, `pedir-perdon` | optativas: el cajón trabado del molino viejo (trato) / la raíz del coihue (pelea) | `pedir-perdon` → `duendes.perdon = true` |
| 11 El arco y la honda | `carpinteria-arco` | E sobre Tito (`carpintero`) el día después de talar | — |
| | `cuerda-elvira`, `puntas-anselmo` | E sobre Elvira (`tejedora`, con 2 vellones) / Anselmo (`herrero`, con $400) | gasta los vellones / cobra $400 |
| | `plumas-josefina` | E sobre Josefina con lazo ≥ 2 (si no juntaste seis plumas) | Josefina +1 |
| | `paces-fermin`, `honda-fermin` | E sobre Fermín (paces antes si D5 = c o lazo < 0: gasta harina o yerba, Fermín +1) | — |
| | `prestado-anselmo`, `prestado-guido`, `prestado-martin`, `prestado-elsa` | E sobre `herrero`, `apicultor`, `martin`, `guarda` | `prestado.herrero|apicultor|maquinista|guarda` |
| | `recorrer-lado` | atardecer (16:30–20:30), a 28 m del galpón, con tres prestadas | — |
| 12 La noche de la nevada | `ramon-guiso`, `estacion-gente`, `cita-noche` | optativas; `estacion-gente` es mecánica (sin escena: se da por vista); la cita sólo con el amor prendido (`amor`) | — |
| | `espera` | 22:00–23:36 en el galpón. **Al terminar empieza la noche** (ver abajo) | `duendes.noche = 'pendiente'` (y si no hubo D6, trato) |
| | `amanecer-trato-ganada`, `amanecer-trato-perdida`, `amanecer-pelea-ganada`, `amanecer-pelea-perdida` | 5:30–11 h, a 45 m del galpón, según `duendes.trato` y `duendes.noche` | — |
| 13 El deshielo | `carpeta` | en el andén 9–20 h | — |
| | `majada-fin` | en el Puesto Alto o en el galpón de esquila (22 m), 8–19 h | — |
| | `volver-a-subir` | optativa: E sobre Ramón con D5 = c | — |
| | `josefina-fin` | a 26 m del coihue, 14–20 h | — |
| | `umbral-fin` | tras las tres anteriores, a 16 m de la puerta del refugio, 6–10:30 h del día siguiente | `duendes.final = 'trato'|'pelea'`; con trato empieza la costumbre de la bolsa vacía |

## Condiciones nuevas para B (`si: { cond, args }`)
`trato` (`{ es: 'trato'|'pelea' }`; sin elección vale trato), `noche` (`{ es: 'ganada'|'perdida' }`), `convidado` (`{ min }`: convites de D1 = a, D3 = c y D2 = a o c; el guion llama «convidado» a dos o más),
`deuda` (`{ es: 'pagada'|'debe' }`), `perdon`, `prestado` (`{ quien: 'herrero'|'apicultor'|'maquinista'|'guarda' }`), `amor` (hay pareja o salida y el romance está prendido) y `ramal` ahora acepta
`{ min, max }`. Efectos: ninguno nuevo; `decision:duendes:<a|b|c>` es una decisión más (D6) y `DECISIONES` sumó `duendes`. Las demás mecánicas (deuda, perdón, prestado, final) las hace el juego al
ver la escena, no hace falta un efecto. «Condición» y «efecto» sin registrar dan `false` / nada en silencio (ver SKILL).

## Qué se hizo
1. **Capítulos 9 a 13 con objetivos de verdad** (`historia.js`; sin «continuará», `CAPITULOS_COMPLETOS = 13`):
   - **9 «Los primeros fríos»**: puerta de estación (invierno, 2 días; después la historia trae su propia helada), Ramón en cama, **D5** majada (A Fermín la lleva y vos la arreás con las ovejas siguiéndote;
     B la cuidás tres mañanas en el corral del Puesto Alto, una por día, con un vellón cada vez; C se la llevás a Belisario al Puesto del Paso), llevar a Ramón al puesto sanitario, leña, estufa y abrigo.
   - **10 «Golpeá antes de abrir»**: golpear (E «Golpear»), **D6** trato o pelea, el mirador, la mesa de guerra. Premio: la llave del 79 sólo con trato.
   - **11 «El arco y la honda»**: tres cadenas. El arco (talar, Tito, Elvira, Anselmo $400, seis plumas o Josefina, cinco blancos de paja con el arco); la honda (Fermín con las paces si hace falta, veinte cantos, cinco latas);
     lo prestado (tres de cuatro; quien presta y no vive en la aldea cuenta como prestado), la deuda del trato (se paga con una bolsa de harina o seis tablas en la raíz; **no traba**: recorrer el lado la deja pasar)
     y recorrer el lado. Las plumas del bosque enojan a Josefina (−1, una vez).
   - **12 «La noche de la nevada»**: comer, la estación (si D4 ≠ A), la espera a las 22, la noche, el amanecer. Premio según cómo terminó.
   - **13 «El deshielo»**: puerta de dos días, la carpeta de Graciela, la majada, la fiesta, Josefina, el último día. Cierra con la **tarjeta final** (`historia-final.js`: los dos finales A/B y sus piezas: ramal,
     majada, escuela, Graciela, noche perdida, la última) con **Seguir** o **Ver los créditos**; el poncho sale una sola vez.
2. **La noche de la nevada** (`historia-noche.js`, `-mundo.js`, `-ui.js`; reemplaza la noche y los dos finales de la 4.13.0 B): empieza sola al terminar `espera`, en el galpón (tu galponcito o la puerta del refugio),
   con el lado de ataque hacia el arroyo; **tres olas** (0:00, 1:18 y 2:48; 4:30 en total) con la campana avisando antes; **defensas prestadas según `historia.prestado`**: estacas y portón (Anselmo), dos trampas de miel
   (Guido: traban unos 3,5 s a los chicos, no al grandote ni al Mandamás), campana (Martín), empalizada de durmientes (Elsa) y la pirca de Tobías (D2 = c) — la empalizada y la pirca suman aguante al galpón;
   **el Mandamás** (380 de vida) tiene el lomo débil: pegado por la espalda recibe el doble; **aliados** (`aliadosDe`): el perro (si lo conociste), Ramón (lazo ≥ 1 y no vendiste la majada) repara, Josefina (lazo ≥ 1) tira flechas,
   Fermín (lazo ≥ 2) honda desde el techo; **ayudas del trato** (los duendecitos): una lucecita ámbar avisa 2 s antes dónde sale un topo, los hongos del lomo del Mandamás brillan más de espaldas y, con el trato fuerte
   (D6 = b), una vez por noche el enjambre traba al grandote 5 s; **con deuda sin pagar no ayudan**. Con trato es la prueba (siete travesuras pierden; el Mandamás en la puerta cuenta tres) y con pelea la defensa
   real (aire y aguante del galpón; nadie se lastima, nunca hay sangre). **Los del cerro son la variante Viejo** (`crearDuende(tipo, { viejo })`, modelos que ya arma `precalentarDuendes`).
   **Perder**: tarjeta «La noche se te escapó» con **Otra vez** (vuelve a las 22:00, sin castigo) y **Que amanezca** (la noche queda `perdida`). Ganar (parar al Mandamás o aguantar 4:30) o amanecer: 6:24 del día siguiente
   y sale la escena del amanecer que corresponde.
3. **Blancos de práctica** (`crearPractica`, `blancosDe`; mundo en `historia-noche-mundo.js`): cinco blancos de paja a 14–20 m del Puesto del Paso (arco, clic y mantener para tensar) y cinco latas sobre postes en
   el galpón de esquila (honda). Sólo aparecen con las condiciones de la cadena cumplidas; el arco y la honda **sólo se usan ahí y en la noche**.
4. **El arreo** (`historia-arreo.js`, `-mundo.js`): siete ovejas (esferas con los materiales de siempre) salen del corral del Puesto Alto y siguen al que va adelante; si te alejás más de 26 m esperan; llegan cuando vos y la
   mayoría están a menos de 22 m del destino (galpón de esquila con D5 = a; Puesto del Paso con D5 = c). Sin física nueva.
5. **Clima de la historia**: capítulos 9 a 13 en invierno aunque el calendario no lo sea (la helada temprana, tras dos días de espera), y la **nevada forzada** del capítulo 12 de las 17 a las 7 mientras la noche no se resuelva
   (`nevadaForzada`, enganchada al programa del tiempo en `main.js`).
6. **Estado y guardado**: `blancos { paso, esquila }`, `costumbre`, `duendes.deuda/perdon/convidado/final`, `prestado.*`; `estadoHistoria` suma `prestado`, `prestadoN`, `deuda`, `perdon`, `convidado`, `nocheEstado`, `final`, `blancos`, `cuidados`,
   `plumas`, `cantos`, `lana`, `pesos`, `yerba`, `llave79`, `amor`. Todo saneado con tope (`sanearHistoria`).
7. **Costumbre del trato (final A)**: la bolsa vacía en el umbral; la E la llena con una medida de harina; a la mañana siguiente hay un regalito (canto, piñones o pluma) y la bolsa vuelve cada seis cosechas.
8. **Retirado**: la noche de la 4.13.0 B con sus dos finales (`TEXTOS_NOCHE.final`, la tarjeta «Lo que vino de noche», `mostrarFinal` de la noche) y sus pruebas (`verificar-4-13-0-historia-b.mjs`,
   `humo-4-13-0-historia-b.cjs`): la noche nueva las reemplaza y se cubre con `verificar-4-17-0-historia-a.mjs`. **Quedan** (código sin llamadores en la Historia nueva, cubierto por `verificar-4-13-0-historia-a.mjs`):
   el evento `duendes-galpon` y las tarjetas de las armas de la 4.13.0 A; no los saqué para no romper `3-1`, `3-8-7` y las pruebas que los fijan.

## API
- `historia-disparadores-acto3.js`: `DISPARADORES_ACTO3`, `ESCENAS_ACTO3_IDS`, `ESCENAS_SIN_GUION_ACTO3`, `EFECTOS_ESCENA_ACTO3`, `NOTAS_ESCENA_ACTO3`, `OBJETOS_ACTO3`, `LUGARES_ACTO3`, `PRECIO_PUNTAS`, `DEUDA_COSTO`,
  `costumbreDe`, `accionBolsaUmbral`, `amanecerCostumbre`, `llenarBolsa`, `puedePagarDeuda`, `pagarLaDeuda`.
- `historia.js`: `PRESTADOS_NOCHE`, `PRESTAMISTA`, `AMANECERES`, `prestadosContados`, `defensasDeNoche`, `convidadosDe`, `esConvidado`, `arreo`, `necesitaPaces`, `alDecidirDuendes`, `pagarDeuda`, `sumarBlanco`, `blancosNuevos`,
  `alCumplirObjetivo`, `nevadaForzada`, `estacionForzada` (ahora también `'invierno'`), `diasEsperados(h, s, desdeCapitulo)`, `premioDeCapitulo` (variantes por decisión, trato o noche).
- `historia-noche.js`: `GUION` (3 olas por modo), `NOCHE` (+`jefeVida`, `espalda`, `miel`…), `aliadosDe`, `crearNoche(op)` con `defensas`, `aliados`, `ayudas`, `fuerte`, `deuda`; `dejarPerdida`, `crearPractica`, `blancosDe`.
- `historia-noche-mundo.js`: `iniciar({ modo, defensas, aliados, ayudas, fuerte, deuda, … })`, `practicar(dt, donde)`, `cerrarPractica()`.
- `historia-ui.js` (lo que usa `main.js`): `valle.nevada()`, `valle.arreoLlegado(destino)`, `valle.mostrarFinal()`, `valle.contextoNoche(h, modo)`; el `ctx` suma `pagar`, `darMaterial`, `darEntrada`, `tienePerro`, `puntoDe`, `jugadorAlGalpon`.
- `historia-final.js`: `tarjetaFinal(h)`, `FINAL_A`, `FINAL_B`, `PIEZAS_FINAL`.
- Lugares nuevos de `puntosDeHistoria`: `galpon-noche` (tu galponcito o la puerta del refugio), `puesto-paso`. En `?debug=1`: `__arreo()` y la bandera `window.__sinPausaPorBlur`.
- Los bloques de `main.js` propios de esta parte están marcados `4.17.0:` (buscar con grep) para facilitar la junta.

## Decisiones por criterio mío (sacables o discutibles)
- **La cera** de la cuerda (Elvira) **no existe como cosa** en el juego: la cuerda pide sólo los dos vellones. Un ítem nuevo con guardado costaba más que lo que aportaba; la escena de B puede decir que Guido o Elvira ponen la cera.
- **El cuero** de la honda se reemplaza por vellones (la honda no pide nada más que los veinte cantos y la práctica).
- **Plumas**: «del gallinero» no existe como fuente; quedan seis plumas del bosque (Josefina −1) o las de Josefina (+1).
- **Herminia y los chicos de los Jones** a la estación: sin acompañante real, el objetivo es pasar por la estación (escena mecánica `estacion-gente`); con D4 = a se da por hecho.
- **Visita forzada de varios (cap. 10)**: es la escena `mesa-guerra` la que pone a los vecinos (por `aparecer`), no el sistema de visitas del juego.
- **Las ayudas del perro, Ramón, Josefina y Fermín son del simulador** (pegan, reparan y suenan), pero **no se dibujan en la noche**: no pude hacer que se vean sin tocar el movimiento de la gente (ver «No hecho»).
- Daño de los duendes de la pelea ×0,4 (era ×0,55) por la ola de 12; el balance lo tiene que juzgar una persona jugando.
- Retiré el resto del «continuará» pero **dejé** `esContinuara` y el evento de los duendes de la 4.13.0 A (ver arriba).
- Las pruebas de mutación de la 4.16.0 A importan la copia mutada con la misma URL, y **ESM la guarda en caché**: sólo la primera mutación de cada archivo mide algo. La nueva usa `?m=<n>`; la vieja no la toqué (probable falso «atrapada», a revisar).

## No hecho / límites (honesto)
- **Ramón convaleciente** (sentado con manta, bastón al caminar): no se hizo; Ramón te sigue a pie como cualquier acompañante.
- **Aliados visibles en la noche** (Josefina, Ramón y Fermín en su lugar, el perro): sólo existen en la simulación y en el sonido.
- **Logros opcionales** en `STEAM_LOGROS.md`: no (el archivo se genera de `src/steam.js`, que lleva 34 logros fijados por pruebas, con nombres en inglés).
- **«Arreo» a caballo**: anda con el caballo (cuenta la velocidad) pero no se probó montado.
- «Lugares raros» en el mapa y «El horario de invierno» de la trochita: no.
- Las escenas de B no existen en esta rama: todo se probó con las escenas dadas por vistas; **al juntar hay que repetir el humo con las escenas reales** (cámara, textos, decisiones D5 y D6 por la escena, saltar con Esc).
- Textos sólo en castellano (el inglés se hace al final).

## Verificación
- `pruebas/verificar-4-17-0-historia-a.mjs` (en el gate): ver el resultado exacto al final de este archivo.
- Pruebas viejas ajustadas a propósito: `verificar-3-1-historia` (hasta 12 objetivos por capítulo; premios con cosas o por decisión), `verificar-4-15-0-historia` (ya no hay «continuará», un `cap` puede ser una lista, D5 y D6 en las decisiones, el recorrido final),
  `verificar-4-16-0-historia-a` (13 capítulos completos, el invierno forzado, las líneas de `main.js` que cambiaron y sus mutaciones), `verificar-4-15-0-escenas-acto1` y `verificar-4-16-0-escenas-acto2` (las condiciones del acto III se documentan acá).
  Se retiró `verificar-4-13-0-historia-b` (la noche vieja; motivo arriba).
- Humo de partida real: `pruebas/humo-4-17-0-historia.cjs`. La noche corre **sin depender del foco**: el juego se pausaba por `blur` (main.js, el `abrir('pausa')` del `blur`), así que con `?debug=1` la bandera
  `window.__sinPausaPorBlur = true` lo evita (sólo debug).
