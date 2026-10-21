# Hojarasca 4.6 — paquete 1a del mapa: recursos de zona, materiales, herramientas y el pico

Rama `v46-recursos` (sale de `235b9eb`). Uno de los tres agentes del paquete 1a (los otros: «puestos» y «gente»).
Plan: `PLAN_MAPA_VALOR.md` («Decisiones tras la auditoría»); datos del lugar: `AUDITORIA_MAPA_VALOR.md`.
**No se subió la versión.**

## Qué se hizo

### Materiales nuevos (cinco, con los ids que ya usan los otros agentes)
`junco`, `hierbas`, `arcilla`, `cuero`, `piedra-cantera`. Están en:
- `MATERIALES` de `src/construccion.js` (nombre, uno, de) y `BIENES` de `src/comercio.js` (material, de a lotes de 2 o 3: ninguno
  va de a uno, así no hace falta el singular de `comercio-mundo.js`, que es de «puestos").
- Depósitos (`src/almacen.js`): la barraca guarda los cinco; el resumen («Troncos 3/40 · …») los nombra **sólo si hay** (si no,
  el aviso no entraba) y la ficha dice «y los de zona: …». El herramientero cuelga las cuatro herramientas nuevas.
- El acopio de siempre también los guarda (`CLAVES_MATERIAL` en `main.js`).
- Mochila e íconos: `ranurasZona` y `ICONOS_ZONA` de `src/recursos-zona.js` (como hace la granja); van después de la lana.
- Cuaderno (`src/cuaderno.js`, sección de trueque): una anotación por material (`junco-mat`, `hierbas-mat`, `arcilla-mat`,
  `cuero-mat`, `piedra-cantera-mat`) y una por herramienta. Se anotan solas la primera vez que tenés el material o la herramienta
  (aunque te la dé otro: el cuero del pastor, una herramienta comprada).
- Guía F1 (`src/guia.js`): sección nueva «Recursos de zona» (sólo Relax).
- Consola de códigos: `materiales N` fija también los cinco de zona (en el Relax; el Desafío sigue con tres) y `herramientas` da
  también las cuatro de zona. Textos de la ayuda actualizados.
- Guardado: los materiales ya se guardan genéricos (`cuentas`); nuevo `progreso.recursosZona` (ver abajo).
- El banco no pide materiales de zona para su abastecimiento (`SIN_ABASTO` de `prestamos.js`): así la elección de siempre no
  cambia en las partidas que ya están y no te pide piedra de cantera sin pico de cantero.

Valores (yerba por lote; 1 yerba = $100): junco 3 por 2, hierbas 2 por 3, arcilla 2 por 3, cuero 2 por 9, piedra de cantera 2 por 4
(el doble que la suelta por unidad; el cuero, más que la lana). Yendo a los tres lugares todos los días y vendiendo a precio de plaza
da ~$1.400 por día (la prueba lo acota entre $600 y $2.200): suma sin romper los ~$3.200 diarios.

### Recursos de zona (`src/recursos-zona.js`, puro; `src/recursos-zona-mundo.js`, lo visual)
El molde es la cantera del Desafío («da N cada D días»). Usado el día d, vuelve el día d + D. Todo con **E** (como la esquila con la
tijera), en el mismo lugar de la tecla E y del aviso: después de la oveja y antes del acopio (`recursosZona.accion`, la misma
función para los dos).

| Punto | Dónde | Da | Herramienta |
|---|---|---|---|
| Veta de la cantera | (−405, −305) | 6 piedras de cantera cada 2 días (tres golpes de E) | pico de cantero |
| Juncal del mallín | (−265, −239), junto al puente | 3 juncos por día | hoz de junco |
| Hierbas del mallín | (−256, −244) | 2 atados por día | hoz de junco |
| Barranca de arcilla | **(52, 45)** | 4 terrones cada 2 días | pala de arcilla |
| Pehuenes del mirador | los 8 de siempre | 6 piñones cada uno, una vez por otoño | ninguna |

- **La arcilla no va en (66, 44)**: ese punto es agua del lago (altura −3,6). La orilla seca más cercana a la boca del arroyo está
  14 m al oeste, sobre la barranca norte; ahí va.
- **La cantera:** en (−405, −305) el suelo es casi llano (pendiente 0,13); la ladera empinada está 40–70 m al oeste. Se puso un
  **frente de roca** (bloques angulosos con una franja clara, ~7 m × 3,5 m, la cara al este, de donde se llega) que no se atraviesa
  (un segmento de choque), con la piedra labrada apilada al pie mientras hay para dar.
- El juncal y las hierbas, cortados, quedan **al ras** y vuelven a crecer; la veta y la barranca muestran la pila o los panes sólo
  cuando hay.
- **Pehuenes:** no se suman árboles (prueba del bosque). E al pie de cada uno, en otoño, da 6 piñones (`pinon`, la fruta de siempre),
  una vez por año por árbol. Otoño: con la estación fija en otoño, siempre; fija en otra, nunca; en «auto», los días 5 a 8 de cada
  doce (la misma cuenta del cuadro de `main.js`). Los piñones sueltos del suelo siguen como estaban.
- Picar la veta suma al picapedrero (1 por golpe y 8 al terminar).
- Rendimiento: 8 mallas en total (fijo, lo que hay y lo cortado), 2.5k triángulos, **el material de la gente y los animales**
  (`MAT_FAUNA`: ningún programa nuevo; nacen visibles para que se compilen en la carga), sin sombras ni luces; a más de 170 m no se
  dibujan; lo que cambia se revisa una vez por segundo. Coordenadas fijas.
- Cada pieza se apoya en su propio suelo (en la ladera y en la orilla nada flota): la prueba lo mide pieza por pieza.
- Guardado: `progreso.recursosZona = { usos: { punto: día }, pehuenes: { 'x,z': año } }`. Una partida vieja no lo trae: arranca con
  todo disponible. Uno roto se sanea (sólo puntos que existen, días enteros, pehuenes «x,z»). En el Desafío no hay.

### Herramientas de zona y la API para «gente»
En `progreso.cosas`, como el hacha o la tijera. `HERRAMIENTAS_ZONA` en `src/recursos-zona.js`:

| id | nombre | precio | requisito |
|---|---|---|---|
| `hoz-junco` | Hoz de junco | $900 | — |
| `pala-arcilla` | Pala de arcilla | $1.100 | — |
| `cuchillo-cuero` | Cuchillo de cuero | $1.000 | — |
| `pico-cantero` | Pico de cantero | $4.000 | picapedrero 3 |

Lo que llama la gente (todo puro, con `progreso`):
- `puedeComprarHerramienta(progreso, id, { nivel, precio })` → `{ ok, motivo, texto, precio, falta }`; motivo: `no-existe`,
  `desafio`, `ya-la-tenes`, `oficio`, `plata`. `nivel`: el del oficio (main.js le suma lo que te enseñó tu esposa: pasar
  `nivelDe('picapedrero')`); sin `nivel` se lee de `progreso.oficios`. `precio`: para una rebaja.
- `venderHerramienta(progreso, id, { nivel, precio, quien })` → cobra con `pagar` (queda en el libro, «Compra: pico de cantero», con
  `quien`) y la da. Mismo resultado que el anterior más `saldo`.
- `darHerramienta(progreso, id)` → `{ ok, nueva, id, nombre }`: de regalo, sin mirar oficio ni plata.
- `tieneHerramienta(progreso, id)`, `IDS_HERRAMIENTAS_ZONA`, `esHerramientaZona(id)`.
- Después de dar o vender, el juego refresca la barra y anota el cuaderno solo (una vez por segundo); si se quiere en el momento,
  `refrescarBarra(true)`.
- El **cuchillo de cuero** no tiene uso de mi lado: lo pensé como lo que pide el pastor para darte cuero (que lo decida «gente").
- Para probar: `__hojarasca.__recursosZona` en `?debug=1` (`dar(id)`, `vender(id)`, `puede(id)`, `reponer()`, `mundo()`), o la
  consola de códigos (`herramientas`).

### El pico
- El pico común (id `pico`) se llama ahora **«Pico»** en la mochila, el almacén («Pico» y «Pico, ya hecho») y el cuaderno (que suma:
  «La veta de la cantera no: esa pide el pico de cantero»). Su texto en el almacén ya no dice «de los que usan en la cantera».
- El **«Pico de cantero»** es otro (`pico-cantero`): el único que labra la veta. El común sigue con las rocas sueltas, que no vuelven;
  la veta sí. Partidas viejas con `pico` siguen igual (no se vuelve de cantero).
- **Requisito: picapedrero nivel 3**, cuyo título ya es «Picapedrero de cantera» (`oficios.js`). Son 260 de experiencia: unas 30
  rocas picadas con el pico común. Se eligió el 3 y no el 2 por el nombre del nivel y para que el oficio de la 4.2 tenga adónde
  llevarte; si resulta mucho, es cambiar `nivel: 3` por `nivel: 2` en `HERRAMIENTAS_ZONA['pico-cantero'].requisito` (120 de
  experiencia, ~12 rocas).

## Lo de la captura 20b: las piedras que «flotan» — **es un bug real, no es de mi zona: anotado, no arreglado**
Medido en Node con el bosque de verdad (`vegetacion.js`): las rocas sorteadas en laderas empinadas (pendiente > 0,55) se apoyan a la
altura del suelo en su centro menos 0,2 × escala; en la ladera, el lado de abajo queda en el aire. **487 de las 665 rocas** tienen el
borde de abajo a más de 25 cm del suelo; la peor del valle, 3,85 m. En el rincón de la cantera (60 m alrededor) flotan 15 de 24, la
peor a 2,44 m (−467, −304, pendiente 1,37): son las de la ladera oeste, 40–70 m detrás de la veta, y desde abajo se ve su cara oscura
contra la niebla, como en la captura. Es de todo el valle (`vegetacion.js`, el primer bucle del sotobosque), no de la cantera.
Arreglo propuesto (una línea, sin tocar cuántas rocas hay ni dónde): bajar cada roca por lo que cae el suelo bajo su huella, p. ej.
`y = mínimo de T.altura en 8 puntos a 1,2 × esc del centro − 0,2 × esc` en lugar de `h − 0,2 × esc`. Hay que medir después que no
quede ninguna «enterrada» del todo y mirar el musgo (va arriba de la roca).

## Pruebas y verificación
- Nueva `pruebas/verificar-4-6-recursos.mjs` (en el gate): **367 comprobaciones** — materiales en todo lo que los enumera, la consola,
  ritmos (30 días: 90 piedras de cantera, 90 juncos, 60 hierbas, 60 de arcilla), herramientas (oficio, plata, libro, dar, Desafío),
  el pico (nombres y partidas viejas), los 8 pehuenes del bosque armado en Node (144 piñones en tres otoños), el mundo con el terreno
  de verdad (8 mallas, un material, 2.5k triángulos, **ninguna pieza flota**, la E y el aviso paso a paso, se repone, lejos no se
  dibuja), el guardado (viejo, roto, Desafío) y los enganches de `main.js` (la E y el aviso en el mismo orden).
- Pruebas viejas ajustadas a propósito (lo mínimo):
  - `verificar-2-9-tren.mjs`: la lista de materiales del juego suma los cinco de zona.
  - `verificar-4-2-pico.mjs`: la ranura de la mochila se llama «Pico».
  - `humo-4-2-pico.cjs` (fuera del gate): «Pico» en la lista del almacén, la mochila y la barra.
- Partida real escrita y **no corrida** (no se usó Electron, por pedido): `pruebas/humo-4-6-recursos.cjs` (vender el pico de cantero
  con y sin oficio/plata, la cantera con el pico común y con el de cantero, el mallín, la barranca, que se repone, el pehuén en otoño,
  guardar y recargar; con capturas).
- `npm run verify` de corrido (sin Electron), con todo commiteado: **262 pasos OK** (eran 261; el nuevo es éste).

## Pendientes y para decidir
- Correr `humo-4-6-recursos.cjs` y mirar las capturas: el frente de roca, el juncal, las hierbas y la barranca nunca se vieron en
  pantalla (sólo medidos en Node).
- Las piedras flotantes de las laderas (arriba): decidir si se arregla en todo el valle.
- El nivel del pico de cantero (3 o 2) y los precios de las herramientas.
- Medir fps en la 4600G con lo de los tres agentes junto (lo mío es poco: 2–4 mallas a la vista como mucho).
- La consola (`herramientas`) da las de zona y el juego las anota en el cuaderno solo: esas anotaciones no quedan marcadas como
  puestas por la consola (cuentan para los logros).
- Los materiales de zona todavía no los pide ninguna obra: quedan para el comercio, los pedidos lejanos del tablón y los puestos
  (lo de «gente» y «puestos»).
- Inglés: nada (como siempre, al final).
