# Hojarasca 4.17.0 (agente A) — Historia nueva: la mecánica del acto III (capítulos 9 a 13)

Rama `v4170-a`, sobre `main` = 4.16.0. No se subió la versión. B escribe sólo `src/historia-escenas-acto3.js` y `src/historia-texto-acto3.js` (guiones como datos);
en esta rama hay dos HUECOS con esos nombres. **Al juntar queda el archivo de B** (conflicto «los dos agregaron»). La tabla de ids de B manda al juntar.

## IDS DE ESCENA PROPUESTOS (contrato con B; los dispara `src/historia-disparadores-acto3.js`)
Una escena que no está escrita se da por vista (la historia nunca se traba). Las anclas de las escenas son `jugador`, como en los actos I y II.

| Cap. | Id | Cómo sale | Qué cambia la mecánica sola |
|---|---|---|---|
| 9 Los primeros fríos | `ramon-cama` | auto al llegar al Puesto Alto (14 m, 8–20 h), o E sobre Ramón | Ramón queda convaleciente (sentado con manta) |
| | `fermin-puerta` | tras `ramon-cama`, en el Puesto Alto. **D5**: elección `majada`, efectos `decision:majada:a|b|c` | — |
| | `hojas-canelo` | a la mañana siguiente a D5, cerca del Puesto Alto o de la aldea | ver condiciones `convidado` y `decision` |
| | `ramon-sanitario` | con Ramón de acompañante, al llegar a la aldea | suelta al acompañante |
| | `papel-elsa`, `ramon-chocolate` | optativas: E sobre Elsa / E sobre Ramón en la aldea | — |
| 10 Golpeá antes de abrir | `golpe` | E «Golpear» en la puerta de tu galpón, de noche | — |
| | `encuentro` | tras `golpe`, adentro del galpón. **D6**: elección `duendes`, efectos `decision:duendes:a|b|c` (a = sentarte en el umbral, b = poner la bolsa, c = «¡fuera!») | a y b → `duendes.trato='trato'`; c → `'pelea'`; la bolsa (b) suma `convidado` y la deuda; a la mañana la ventana con barro (pelea) |
| | `cerro` | tras `encuentro`, a la mañana, en el mirador del pehuén | — |
| | `mesa-guerra` | tras `cerro`, con la mesa puesta, 16–21 h (trae a los vecinos sin esperar los 3 días) | visita forzada de varios |
| | `llave-79`, `pedir-perdon` | optativas: la llave en el cajón del molino viejo (sólo trato); la bolsa o piñones en la raíz (sólo pelea) | `pedir-perdon` → `duendes.perdon = true` |
| 11 El arco y la honda | `carpinteria-arco` | la mañana después de talar, en la aldea (8–18 h) | — |
| | `plumas-josefina` | optativa de la cadena del arco: E sobre Josefina (lazo ≥ 2) | pluma fichada |
| | `cuerda-elvira`, `puntas-anselmo` | E sobre la tejedora / el herrero con el material | gasta lo entregado |
| | `honda-fermin` | E sobre Fermín en el galpón de esquila (mediodía) | — |
| | `paces-fermin` | si D5 = c o su lazo < 0: llevarle un regalo antes | gasta el regalo |
| | `prestado-anselmo`, `prestado-guido`, `prestado-martin`, `prestado-elsa` | E sobre cada uno: la defensa prestada | `prestado:herrero|apicultor|maquinista|guarda` |
| | `recorrer-lado` | tras tener `prestado ≥ 3`, atardecer, camino del arroyo al galpón | las defensas se ven armadas |
| 12 La noche de la nevada | `ramon-guiso` | optativa: al comer algo caliente, en el refugio | — |
| | `espera` | 22:00, en el galpón, con las dos armas (variantes trato y pelea). **Al terminar empieza la noche** | — |
| | `amanecer-trato-ganada`, `amanecer-trato-perdida`, `amanecer-pelea-ganada`, `amanecer-pelea-perdida` | al resolverse la noche (6:30) | — |
| | `cita-noche` | optativa, sólo con el amor prendido: la noche antes, sugerida | — |
| 13 El deshielo | `carpeta` | llegar al andén 11:00 (variantes por `ramal`) | — |
| | `majada-fin` | llegar al Puesto Alto o al galpón de esquila | — |
| | `volver-a-subir` | optativa D5 = c | Ramón sube a lazo 0 |
| | `josefina-fin` | junto al coihue (o el tocón), tarde | — |
| | `umbral-fin` | primer día del año (o al despertar tras la fiesta), 7:30, en el refugio | `duendes.final = 'trato'|'pelea'`; trato → la costumbre de la bolsa vacía |

## CONDICIONES Y EFECTOS NUEVOS para B
Condiciones (`si: { cond, args }`): `trato` (`{ es: 'trato'|'pelea' }`), `noche` (`{ es: 'ganada'|'perdida' }`), `convidado` (`{ min: n }`: cuántos convites; D1 = a, D3 = c, D2 = a/c cuentan),
`deuda` (`{ es: 'pagada'|'debe' }`), `perdon`, `prestado` (`{ quien: 'herrero'|'apicultor'|'maquinista'|'guarda' }`), `amor` (hay pareja o salida y el sistema está prendido), `ramal` ahora acepta `{ min, max }`.
Efectos (se suman a la convención de siempre): `trato:<trato|pelea>`, `deuda:<n>` (sube la deuda), `perdon`, `final:<trato|pelea>`, `costumbre`.
