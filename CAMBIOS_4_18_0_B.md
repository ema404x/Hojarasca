# Hojarasca 4.18.0 (parte B) — Las escenas y los textos de las subtramas optativas

Rama `v4180-b`, sobre `main` = 4.17.0. No se subió la versión. Esto es la parte B: el CONTENIDO que faltaba para que las optativas de `GUION_HISTORIA.md` (§6 y los bloques «Optativas» de cada capítulo) se puedan jugar de punta a punta. La parte A (el registro de optativas, el tablón, los disparadores, la mecánica de juntar las ovejas, los premios y el guardado) la hace otro agente; acá no se tocó `historia.js`, `historia-ui.js`, `historia-disparadores*.js`, `historia-escenas-efectos.js`, `guardado.js`, `main.js` ni las escenas o textos de los actos. Las claves nuevas también están anotadas en el tablero compartido.

## Qué hay
- `src/historia-escenas-optativas.js` — `ESCENAS_OPTATIVAS` (las **7 escenas** nuevas), `IDS_OPTATIVAS`, `EFECTOS_OPTATIVAS` (17 nombres, para registrarlos uno por uno con `registrarEfectosActo1`, como los de los actos), `DISPARO_OPTATIVAS` (por escena: capítulo, dónde está parado el jugador, cuándo, qué optativa la cuenta como hecha —`objetivo`— y qué escena la ofrece —`ofrece`—) y `POR_DEFECTO_OPTATIVAS` (vacío: ninguna decide nada grande). Usa los constructores de `historia-escenas-util.js`, `historia-escenas-acto2-util.js` y `historia-escenas-acto3-util.js`, sin tocarlos.
- `src/historia-texto-optativas.js` — `TEXTO_OPTATIVAS` con:
  - `tablon`: **las 28 optativas** que los actos listan (no sólo las nuevas), cada una con `caps`, `quien`, `titulo`, `ofrecida` (la pista mientras está abierta) y `hecha` (la línea tildada). `tablonDe(id, hecha)` devuelve `{ titulo, texto }` o `null`.
  - `objetos`: `frasco-masa-madre` (el frasco de la repisa).
  - `raro`: 6 entradas nuevas del cuaderno de lo raro (ver abajo). **A: sumalas a `RAROS` de `historia.js`** (hoy junta sólo `TEXTO_ACTO1/2/3.raro`).
  - `charla`: 22 líneas «de después» de 11 vecinos (las que faltaban: ver abajo). `charlaOptativas(quien, cap, estado)` con la misma regla que `charlaDe3`: la última cuyo capítulo ya llegó y cuya condición se cumple; en el mismo capítulo, la primera de la lista.
- `pruebas/verificar-4-18-0-escenas-optativas.mjs` — la prueba (sumada a `verify:pasos`).

Son seguros para el empaquetador (un `import` por línea, un `export const` por nombre) y puros. No están enchufados al juego: A los importa en los huecos con estos mismos nombres de archivo.

## Tabla de ids: escena → capítulo → cuándo / dónde → optativa
| id | cap | cuándo / dónde (jugador parado en…) | cuenta como hecha |
|---|---|---|---|
| `frasco-repisa` | 1 | adentro del refugio, frente a la repisa: E en el frasco (capítulos 1 y 2, después de `nota-eusebio`). El frasco va a la mochila. | — (prepara) |
| `frasco-rosa` | 2 | frente a Rosa (panadera) con el frasco en la mochila (capítulos 1 y 2; si se pasa, hasta el fin del acto I) | `frasco-masa-madre` |
| `oveja-ramon` | 2 | Puesto Alto, junto al corral, después del evento del valle `oveja` (forzado en el cap. 2 como momento opcional) | `oveja` |
| `pan-fermin` | 3 | frente a Fermín en el galpón de esquila, con pan casero o harina, después de `fermin-galpon` | `fermin-pan` |
| `vuelta-mirador` | 4 | mirador del pehuén con Graciela de acompañante, después de `anden-graciela` | `vuelta-ingeniera` (un lugar) |
| `vuelta-faro` | 4 | orilla del faro con Graciela de acompañante, después de `anden-graciela` | `vuelta-ingeniera` (un lugar) |
| `juntar-ovejas` | 9 | tranquera del corral del Puesto Alto, al terminar de juntar las ovejas (mecánica de A); sólo si `hojas-canelo` ofreció la optativa | `juntar-ovejas` |

Ids de elección nuevos (únicos entre los tres actos): `frasco-hablar`, `rosa-frasco`, `porfiada-resp`, `fermin-pan-que`, `fermin-pan-resp`, `mirador-graciela`, `faro-graciela`, `ovejas-poste`.

### Cómo es cada una
- **`frasco-repisa`** — plano general del cuarto, detalle de la repisa: el frasco de 1987 «respira». Abajo, otro papelito de Eusebio: «Ya sé que dije que no lo toques… Llevásela a la panadera… Harina y agua tibia los martes. Y gracias.» Elección de sabor (hablarle bajito como a la estufa / ajustarle la tela). Da `objeto:frasco-masa-madre` y `raro:frasco-de-1987`.
- **`frasco-rosa`** — medio y primer plano de Rosa; detalle de la tela levantada («así se huele una carta de alguien que ya no está»). Con D1 = b recuerda la harina («me vas a terminar trayendo al molinero entero, en cuotas»); si no, que Eusebio se la había prometido. Elección de sabor (es suya / cómo era Eusebio / come los martes). Da `entrega:frasco-masa-madre`, `lazo:rosa:1` y `mundo:pan-de-rosa`.
- **`oveja-ramon`** — la majada pasa (`mundo:majada-pasa`, el mismo del cap. 2); la Porfiada vuelve al corral. Si el evento se resolvió **mandando al perro** (`evento { id: 'oveja', opcion: 'perro' }`), Ramón se ríe del perro («arrea como yo bailo»); si la arreaste vos, te mira las botas. Cuenta que Eusebio siempre se la traía «porque iba a visitar a alguien». Elección de sabor. Da `lazo:ramon:1` y `raro:la-porfiada`.
- **`pan-fermin`** — el viento de la estepa, Fermín en el cerco. **Elección con peso**: el pan (`quitar:pan-casero:1`) o la harina (`quitar:harina:1`); la reacción cambia. Insinúa la honda del cap. 11 (espanta un chimango con un cascote sin mirar: «De chico espantaba zorros… No lo andes contando»). Da `lazo:fermin:1` y `raro:pan-en-la-estepa`.
- **`vuelta-mirador`** — plano general desde el mirador (la vía como un piolín); Graciela mide el valle con el lápiz como su abuelo con la pala del carbón; abre la libreta y no anota. Elección de sabor (la aldea / el pehuén / la vía). Da `raro:graciela-en-el-mirador`.
- **`vuelta-faro`** — se le moja una bota y se ríe por primera vez («estas botas eran para oficinas»); si le contás lo de las luces de Nicanor, cuenta que en Trevelin también se contaban cosas del agua. Elección de sabor. Da `raro:graciela-en-el-faro`.
- **`juntar-ovejas`** — la última oveja entra; detalle del poste: un **piolín colorado** con el nudo de la bolsa de Eusebio (el recado de los que no fueron convidados). Según D5: con `a` Fermín las cuenta («Ramón ata con alambre»); con `b` estás solo; con `c` Belisario («las ovejas saben cuándo las venden»). **Elección con peso**: dejar el piolín / dejar un puñado de yerba al pie del poste, como hace Ramón (`quitar:yerba:1`) / guardarlo. Da `mundo:ovejas-juntas`, `lazo:ramon:1` y `raro:ovejas-juntas`.

## Claves nuevas (A las implementa)
Todo lo demás reusa la convención que ya existe (`lazo:`, `raro:`, `quitar:`, `mundo:majada-pasa`, la condición `evento` con `opcion` y `decision`).
- `objeto:frasco-masa-madre` / `entrega:frasco-masa-madre` — el frasco de la repisa a la mochila (`frasco-repisa`) y de la mochila a Rosa (`frasco-rosa`). Texto en `TEXTO_OPTATIVAS.objetos`. El disparador de `frasco-rosa` necesita tenerlo (`objetos.has('frasco-masa-madre')` y que no se haya entregado). La E del frasco en la repisa es de A (un objeto de historia en el refugio, visible en los capítulos 1 y 2 hasta tomarlo).
- `mundo:pan-de-rosa` (args `{ cosa: 'pan-casero', n: 1, dias: 3 }`) — el premio del guion («te devuelve pan cada mañana durante 3 días»): un pan casero cada mañana, tres mañanas (en el umbral o al hablarle). La escena **no** lleva `dar:` para que no se duplique.
- `mundo:ovejas-juntas` (args `{ donde }`) — se cumplió «juntar las ovejas»: la tranquera cierra, se va el `mundo:corral-abierto` de `hojas-canelo` y las ovejas vuelven al corral. La mecánica de juntarlas (A) dispara la escena al terminar; si se saltea, el efecto igual corre.
- Los `raro:` nuevos: `frasco-de-1987` (cap. 1), `la-porfiada` (2), `pan-en-la-estepa` (3), `graciela-en-el-mirador` (4), `graciela-en-el-faro` (4), `ovejas-juntas` (9).

## Lo que A tiene que saber
- **Los premios de lazo van dentro de las escenas** (como en los actos): `frasco-rosa` → `lazo:rosa:1`, `oveja-ramon` → `lazo:ramon:1`, `pan-fermin` → `lazo:fermin:1`, `juntar-ovejas` → `lazo:ramon:1`. El registro de optativas no los repite. Ojo: `rosa` no está en `PERSONAS_LAZO` (el aplicador lo ignora; pasa igual con `bolsa-rosa` y `masa-crece`, que ya daban `lazo:rosa:1`). Si se quiere que cuente, hay que sumar a Rosa a los lazos.
- **Lo que se gasta, se gasta en la escena**: `pan-fermin` gasta en la elección (`quitar:pan-casero:1` o `quitar:harina:1`; el defecto es el pan); `juntar-ovejas` gasta `quitar:yerba:1` sólo si elegís dejar la yerba. El disparador de A no gasta nada. (`gastarCosaHistoria` ya sabe de harina, yerba y pan casero.)
- **«Una vuelta para la ingeniera»**: `vuelta-mirador` y `vuelta-faro` no dan lazo ni ramal. El premio del guion (Graciela +2, ramal +2) ya lo da `te-graciela` (la casa de té). Si los dos lugares elegidos son mirador + faro, que lo dé el registro de A al segundo lugar. Ninguna escena ofrece esta optativa (`anden-graciela` no corre `optativa:vuelta-ingeniera`): la ofrece el capítulo 4.
- **`oveja-ramon`** mira `evento { id: 'oveja', opcion: 'perro' }` (la condición registrada ya compara `ctx.opcionDeEvento`). Sin evento, o con «buscar», sale la variante de las botas.
- **`juntar-ovejas`** mira `decision { d: 'majada' }`: Fermín sólo con `a`, Belisario sólo con `c`. Sin decisión (no debería pasar: la ofrece `hojas-canelo`, que va después de D5) queda la narración sola.
- **La charla de después** (`charlaOptativas`): las líneas miran `{ escena: <id> }` (la escena vista que cumple la optativa). La única que mira `{ optativa: 'concurso' }` es la del concurso del dulce, que no tiene escena; ahí `estado.optativas` tienen que ser las **hechas**. Sugerencia para enchufarla: la línea de optativas gana sobre la del acto si es del mismo capítulo o más nueva. (Aviso: hoy ningún módulo del juego llama a `charlaDe`/`charlaDe2`/`charlaDe3`; sólo se usa el cuaderno de lo raro de los textos.)
- Cobertura que comprueba la prueba: toda optativa que se cumple con una escena (de los actos o de acá) tiene su línea de después, en los actos o acá. Las que ya la tenían en los actos: `truchas`, `masa-crece`, `fermin-habla`, `veta-vuelve`, `noventa`. Las nuevas: `frasco-masa-madre` (Rosa), `oveja` (Ramón), `fermin-pan` (Fermín), `vuelta-ingeniera` (Graciela ×2), `te-graciela` (Elsa), `trigo-abuelo` (Josefina), `tablas-tito` (Tito), `foto-sofia` (Sofía), `concurso` (Ercilia), `mulas` (Belisario y Ramón), `papel-elsa` (Elsa), `visita-ramon` (Ramón), `juntar-ovejas` (Ramón y Fermín), `llave-79` (Josefina y Ramón), `pedir-perdon` (Herminia), `flechas-de-mas` (Tito), `cumple-nevada` (Ercilia), `volver-a-subir` (Ramón). `alguien-te-espera` no lleva: la pareja habla con el sistema del amor.
- Hasta cuándo siguen abiertas lo decide A; en `DISPARO_OPTATIVAS.cuando` puse lo que dice el guion (el frasco, del cap. 1 al 2; si no dice, hasta el fin del acto).

## La prueba
`node pruebas/verificar-4-18-0-escenas-optativas.mjs` (unos 7 s). La suite entera es una función que recibe los **módulos** y devuelve lo que falló:
- valida cada escena con el director real, la corre por **todos los caminos de elección** y **todas las variantes** que mira (D1 y D5 en a, b, c y sin decidir; el evento de la oveja sin pasar, con «buscar» y con «perro»), la salta a los 2, 40, 300 y 1500 cuadros, y revisa que termine, quede vista, suelte a todos y corra el efecto de cada opción tomada;
- lo que pide el guion de cada una (frasco a la mochila y a Rosa con tres mañanas de pan; la variante del perro; pan **o** harina, nunca las dos; las vueltas sin lazo ni ramal; Fermín sólo con D5 = a, Belisario sólo con c; el corral se cierra aunque se saltee);
- la convención de efectos y condiciones, ids únicos de escena y de elección contra los tres actos, hablantes y claves, poses, lugares, largos, sin inglés ni religión ni nada explícito, nombres propios que existen;
- el tablón con las 28 optativas (ni una más) en sus capítulos; el cuaderno de lo raro (cada entrada anotada por su escena, en su capítulo, sin chocar con los actos); la charla de después (cobertura de arriba, que mire escenas que existen y de un capítulo no posterior);
- la tabla de disparo (capítulo, optativa del capítulo, y que `ofrece` de verdad corra `optativa:<id>`);
- las reglas del empaquetador y de módulo puro sobre el texto de los dos archivos (exports de a uno, sin ñ en nombres ni ids, imports en una línea, LF, sin DOM), y este documento y `verify:pasos`.

**Mutaciones que miden de verdad**: 56 de datos (se clona lo exportado y se rompe una garantía) y 16 de **código**: se escribe una copia mutada de los dos archivos (con sus tres dependencias) en una carpeta temporal y se importa con `?v=<n>`, así cada mutante es un módulo nuevo y no el de la caché (por ejemplo: la charla que ignora la escena o elige la más vieja, `tablonDe` sin `hasOwn`, dos exports en una línea, CRLF, un import partido, la condición del perro rota). Una copia sin mutar, cargada igual desde la carpeta temporal, tiene que pasar. La prueba exige atraparlas todas.

## Qué no se hizo
- No se vio a ojo nada (sin Electron, por reparto): la cámara de las siete escenas se ancla al jugador (`FRENTE`) salvo los planos generales del mirador y del faro (`{ lugar }`), que conviene mirar en la partida real.
- No hay escena para los encargos (`banco-primero`, `vuelta-completa`, `encargo`, `tres-de-tres`, `trochita-nieve`) ni para el concurso: el guion no la pide; tienen su entrada en el tablón.
- `cumple-nevada`, `galpon-sin-golpear`, `costumbre-dejar` y `costumbre-regalito` ya tenían escena desde la 4.17.0; les falta sólo el disparador (A).
