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

## Resultado
- `npm run verify` de corrido: **321 pasos OK** (con la prueba nueva adentro y sin la de la noche vieja). `verificar-4-17-0-historia-a.mjs`: 227 comprobaciones y 32 mutaciones atrapadas.
  En el paralelo bajo carga fallan a veces, y pasan solas, `rc6`, `integridad-rc31`, `3-8-5-sonido` y `4-6-0-mate` (de tiempo).
- **Partida real** `pruebas/humo-4-17-0-historia.cjs` (Electron con WebGL, notebook Ryzen 7 7730U, monitor externo, perfil propio; secciones sueltas con `HUMO_SOLO=2,4`): corrió en verde
  la puerta de invierno y la helada, el capítulo 9 (Ramón en cama, D5 por la tarjeta de respaldo, las ovejas siguen y llegan al galpón de esquila), el capítulo 10 (la E dice «Golpear», D6),
  el 11 (cinco blancos de paja con el arco y cinco latas con la honda, por la cámara), el 12 en trato **y** en pelea (la noche empieza sola, ola 1 de 3, defensas prestadas armadas, duendes en escena ≤ 12,
  perder → «Otra vez» / «Que amanezca», ganar aguantando, amanecer a las 6:24 y su escena) y la última corrida con «Que amanezca». **Sin depender del foco**: `window.__sinPausaPorBlur`
  (la primera corrida falló porque la ventana perdía el foco y el juego se pausaba por `blur`).
- Capturas en `pruebas/salidas/historia-4-17-0/` (no van al repositorio). Se vieron a ojo: el capítulo 9 con nieve, la noche de trato (portón con antorchas, estacas y duendes Viejos con ojos verdes) y la práctica de arco.
  **No se vieron a ojo**: las ovejas siguiendo (capturas tomadas, no revisadas), la noche de pelea, la empalizada, las trampas de miel ni la campana; ningún aliado (no se dibujan); los blancos de paja de cerca.
- **fps**, sólo en la notebook y sólo antes/después (4600G sin medir): sin la noche 24,0 ms de media (p95 28), con la noche (7+ duendes, defensas armadas) 24,0 ms (p95 27); una corrida anterior dio +2 ms de media
  y +11 ms de p95: está dentro del ruido de esta máquina. 117 → 118 llamadas de dibujo y +20 mil triángulos.
- **Programas de shader**: la historia, el arreo, los blancos y las noches suman **0** (113 → 113 en las noches). **No resuelto**: en la corrida larga el conteo pasó de 110 a 111 al llegar al galpón
  de esquila de día (pasa igual en el Relax libre: 104 → 105, sección D) y de 111 a 113 al llegar de noche a tu galponcito tras ese paseo diurno; en las secciones sueltas (2 sola) se queda en 110 y
  en el Relax libre de noche en el refugio tampoco sube. Parece el primer cuadro de noche/nieve con algo visto de día, pero no lo aislé.
- Tiempos aproximados: entender el estado y los módulos del acto II y de la noche, 60 min; capítulos, disparadores y estado, 120 min; noche (simulación, mundo, interfaz), 130 min; arreo, blancos y enganche
  con `main.js`, 90 min; pruebas (la nueva con mutaciones y el ajuste de las viejas), 110 min; humo (escribirlo y depurarlo, esperando el candado de Electron), 150 min; el gate completo, 9 min.

---

## Junta con las 56 escenas reales de B (actualización)
**La tabla de ids de B manda** (CAMBIOS_4_17_0_B.md); los ids de la primera tabla de este documento quedan reemplazados por los de B (`galpon-golpe`, `galpon-encuentro`, `galpon-trato`/`galpon-pelea`, `cerro-mirador`, `fermin-tranquera`, `majada-fermin`/`-vos`/`-belisario`, `tito-arco`, `elvira-cuerda`, `anselmo-puntas`, `plumas-*`, `blancos-paso`/`-esquila`, `fermin-paces`/`-honda`, `prestado-herrero|apicultor|maquinista|guarda|tobias`, `deuda-pagada`, `noche-espera`, `noche-entre-1|2`, `noche-tras-ganar|perder`, `carpeta-celeste`, `fiesta-nieve`…). Lo mecánico sin escena de B sigue como escena «dada por vista»: `ramon-sanitario`.

- **Efectos**: `registrarEfectosActo1` entiende ahora los de B (`parsearEfectoActo3`): `duendes:trato|trato-fuerte|pelea` guardan `duendes.trato` **y** la decisión D6 (`a` trato, `b` trato fuerte, `c` pelea), `duendes:perdon|deuda-bolsa|deuda-tablas|deuda-pagada|vistos`, `noche:perdida` (`dejarPerdidaDe`) y `noche:reintentar`, `armas:arco|honda`, `perfil:del-valle` (`historia.perfil`). `quitar:` aplica los nombres de B (`vellon` → lana, `tabla-coihue` → tabla, `pan-casero`, `yerba`, `harina`, `pluma`, `pinon`). Las 185 entradas de `EFECTOS_ACTO3` se registran una por una (lo prueba `verificar-4-17-0-historia-a.mjs`).
- **Condiciones de B** registradas: `trato` (`trato|fuerte|pelea`), `noche`, `ramal-nivel` (`salvado|prueba|traslado`), `deuda` (`pendiente`), `convidado`, `devolver-bolsa`, `perdon`, `amor`, `perro` (`estadoHistoria.perro` = conociste al perro).
- **«Tu pareja»**: la clave `pareja` de las escenas se resuelve a la persona real (casados, comprometidos, novios o saliendo, en ese orden) en `escenas-mundo.js` (`ctx.parejaClave`). La cita sólo se dispara con `amor` (condición del disparador).
- **La noche con las escenas de B**: `noche-espera` abre la defensa; al limpiar la ola 1 y la 2 el simulador avisa (`ola-limpia`, adelanta el reloj para no esperar de balde) y se juega `noche-entre-1|2` con la noche en pausa; al ganar se juega `noche-tras-ganar` y después el amanecer; al perder, `noche-tras-perder` (sus elecciones aplican `noche:reintentar` / `noche:perdida`); **sin esa escena** sale la tarjeta de siempre. Las escenas de la noche se disparan con `forzar` (se repiten con cada «Otra vez»; sin eso el segundo intento se saltaba la escena y reintentaba en silencio: lo agarró el humo).
- **Duendes en pantalla** (`efectoDuendesActo3` en `main.js`, con `historia-duendes.js`; tope subido a 12): los once del galpón (sentados alrededor de tu galponcito), el Mandamás que camina al umbral y sale, la fila que se va a la raíz, los que huyen, los viejos del cerro (variante Viejo), las lucecitas, los ojos verdes del otro lado y el de la gorra torcida. Se sacan solos a los 45 s. Ninguno habla.
- **Ramón convaleciente** (`mundo:ramon-convaleciente`, de `ramon-cama` hasta la noche): camina al 55 % de la velocidad y lleva un bastón (un palo en la mano). **No** se sienta con manta junto a la estufa (sin pose ni asiento en el modelo de la gente).
- **Aliados visibles en la noche**: Ramón, Josefina y Fermín (la gente de siempre) se paran detrás de las defensas al empezar y vuelven a lo suyo al terminar. Fermín **no** va en el techo del galpón. El perro, el de siempre.
- Los `mundo:` de B **no se dibujan** salvo lo que ya existía (el umbral, la bolsa, la pirca, los carteles que ya eran objetos): quedan anotados como temas `mundo:<id>` (≈ 50: faroles en la loma, estacas y miel como props de las escenas, carteles, puertitas nuevas, etc.).
- `galpon-sin-golpear` (abrir sin golpear), `cumple-nevada` y `plumas-gallinero` **no tienen disparador** (el juego no tiene gallinero de plumas ni la E de «abrir» del galpón es una interacción de historia); la escena existe y no se dispara.
- La costumbre (`costumbre-dejar`, `costumbre-regalito`) sigue siendo la mecánica de la bolsa del umbral; las escenas no se disparan solas.

## Humo con las escenas reales
`pruebas/humo-4-17-0-historia.cjs` corre en verde con las escenas de B (la helada, el arreo y su escena de llegada, golpear y D6 por la escena, los blancos, la noche en trato y en pelea con las escenas entre olas, al perder y al amanecer, «Que amanezca», el final A con la tarjeta y la bolsa, los cuadros). Los humos `humo-4-15-0-historia.cjs` y `humo-4-16-0-historia.cjs` siguen en verde: el de 4.15 tal cual; el de 4.16 con tres ajustes de la prueba (ya no espera el «continuará» del acto III; se salta la escena de las piedras del molino que arranca al llegar al coihue; y fija `window.__sinPausaPorBlur`, como el de 4.15).
`pruebas/humo-4-17-0-escenas-ojo.cjs` dispara escenas sueltas y saca cuadros (`OJO_ESCENAS=id1,id2`).

### Lo que se vio a ojo (cuadros en `pruebas/salidas/escenas-4-17-0/`)
- **galpon-encuentro**: la cámara queda bien (la escena se ancla a vos), los pillos con ojos verdes se ven junto al galpón; el galponcito es abierto (sin paredes) y los duendes se sentaban al costado: se movieron adentro de la planta del galpón (sin volver a verlos).
- **noche-espera**: nieve, texto a tiempo; **no se ven** los faroles de la loma ni las lucecitas de las raíces (el ojo no las ve: `mundo:faroles-en-la-loma` no se dibuja).
- **noche-tras-ganar**: la cámara queda mirando un campo de nieve oscuro; sin las defensas (se desarman al terminar) la escena queda desnuda. Aceptable, sin arreglar.
- **umbral-fin**: el picado sobre el umbral del primer capítulo; la ronda y el cartel «Refugio» se ven; no se miraron las variantes de pareja ni del final B.
- **Sin ver**: el resto de las 52 escenas; la pareja; las escenas entre olas.

## Resultado final (con la junta)
- `npm run verify` de corrido: **322 pasos OK**. `verificar-4-17-0-historia-a.mjs`: 237 comprobaciones y 32 mutaciones atrapadas; `verificar-4-17-0-escenas-acto3.mjs` (de B): 22830 comprobaciones.
- Humos de partida real (notebook, monitor externo): `humo-4-17-0-historia.cjs`, `humo-4-15-0-historia.cjs` y `humo-4-16-0-historia.cjs` en verde.
- Programas de shader: 0 nuevos por la historia, el arreo, los blancos, las noches y los duendes del acto III (113 → 113 en las noches). Sigue **sin resolver** el 110 → 111 (galpón de esquila de día, igual que en el Relax libre) y el 111 → 113 al llegar de noche a tu galponcito después de ese paseo; en las secciones sueltas se queda en 110.
- fps (sólo notebook, antes/después): sin la noche 32,6 ms de media (p95 43,9) y con la noche 33,7 (p95 42,7) en la última corrida, con la máquina cargada; otras corridas dieron 22–24 ms y la misma diferencia. 4600G sin medir.
- Tiempos del tramo de la junta: ids, efectos y noche con escenas, 150 min; duendes, aliados, Ramón y el bastón, 70 min; humo y mirada a ojo (con el candado de Electron ocupado por C buena parte del tiempo), 200 min; el gate, 10 min.
