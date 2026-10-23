# Hojarasca 4.8 — «Noches distintas» (tanda 1 de las mejoras del Desafío)

Rama `v48-noches` (sale de `main` = 4.7.0). No sube la versión. Ataca lo que el usuario marcó como mayor problema del
Desafío: **se vuelve repetitivo**. Esta parte son las noches (reglas y estado); los lados de entrada, las tácticas y los
duendes nuevos son de `v48-ataques`, y el sonido, la música, la luz y el clima son de `v48-ambiente`.

## Cómo estaba antes (revisado antes de tocar)
- La composición de una noche (`composicionOleada`) es la misma lista de tipos para cada número de noche: de la 12 a
  la 19 son **exactamente los mismos 18 duendes** (1 rastreador, 4 brutos, 3 tiradores, 2 saltadores, 3 escupidores,
  2 excavadores, 3 voladores). Sólo cambia la vida y el daño (`multiplicadorNoche`).
- Las noches especiales (roja, eclipse, silenciosa, apagón) salen en el 38% de las que pueden ser especiales, nunca
  dos seguidas: en una campaña de 19 noches, de cada 100 noches elegibles, unas 23 son especiales (medido con 200
  campañas simuladas). Dentro de la noche, no pasa nada distinto a la hora que sea.
- Ya existía un refuerzo a la 1:30 (`refuerzoNoche`), pero sólo si quedan menos de 4 duendes vivos, y es lo mismo que
  la noche (la mitad de la lista). El clima (`efectoClima`) acortaba la vista con lluvia y nublado.
- Lo de una noche no tenía ninguna consecuencia en la siguiente (salvo los vecinos enojados de los rescates y los
  mutados después del nido). Un duende que se escapaba con lo robado dejaba lo robado y se iba.

## Qué trae
### 1. Dos noches nuevas (`src/desafio-noches.js`, `ESPECIALES` en `desafio-reglas.js`)
- **`niebla`** («Noche de niebla»; aviso: «La niebla baja del monte: esta noche los vas a oír antes de verlos»): 15% más
  de duendes; los tiradores ven la mitad (reusa `efectoClima` con el parámetro nuevo `niebla`, que se suma a la
  lluvia); el acecho se oye desde 1,45 veces más lejos (70 → 101 m) y el chillido cercano se sigue oyendo como
  acecho; el perro gruñe desde 1,6 veces más lejos (42 → 67 m, `avisoDelPerro({ alcance })`).
- **`lunallena`** («Luna llena»; «Sale la luna llena y los viejos oscuros bajan del monte»): 85% de los duendes de una
  noche común, pero el 92% viene de viejo (en una noche grande común es el 60%), los viejos aguantan un 20% más de
  vida y un 30% de la noche se vuelve de grandotes (brutos, máximo 7).
- Frecuencia: el azar de `nocheEspecial` de 0 a 0,38 es el de siempre (sin tocar roja, eclipse, silenciosa, apagón);
  de 0,38 a 0,435 sale niebla y de 0,435 a 0,49 luna llena. Total: **49%** de las noches elegibles (antes 38%).
  Mismas reglas: desde la 4, nunca dos seguidas, nunca la final ni la del jefe. La corrida sin fin (`especialSinFin`)
  usa las mismas franjas (`SIN_FIN.especial` 0,49 y máximo 0,62).
- Lo que lee el ambiente: `D().especial` (`'niebla'`, `'lunallena'`), `ESPECIALES.lunallena.luz` (0,6) y
  `NIEBLA.visibilidad` (26 m) como sugerencia, y `D().giro` (ver abajo).

### 2. Giros a las dos de la mañana (`GIROS`, `elegirGiro`, `revisarGiro` en `desafio.js`)
- A las **2:00** del reloj del juego (`HORA_GIRO`, configurable) se tira una sola vez por noche (`d.giroNoche`) con el
  azar de la noche (con código de partida, siempre el mismo). Pasa en el 20% de las noches 2 y 3 y en el 40% desde la 4.
  Nunca en la primera, ni con jefe, ni en la final, ni en un rescate o tren varado, ni con la nave del Coihue arriba;
  no se repite el mismo giro dos noches seguidas.
- **Baja la niebla** (`niebla`, desde la noche 2): desde ese momento la noche tiene niebla (misma vista, oído y perro
  que la noche de niebla). No en una noche de niebla ni en el apagón. Aviso: «Baja la niebla del monte».
- **Llegan refuerzos** (`refuerzos`, desde la 3): un tercio de la lista de la noche baja de nuevo (como los refuerzos
  de siempre), con un `curandero` más si el tipo existe (`Object.hasOwn(TIPOS_ALIEN, 'curandero')`; hoy no existe).
  No si ya llegaron los refuerzos de la 1:30.
- **Se quiebra una defensa** (`defensa`, desde la 3): la defensa que más aguanta de las que están en pie queda al 12%
  de su resistencia (no desaparece: se arregla con R). Aviso: «Algo cruje en la base».
- Estado: `d.giro = { id, noche }` (se limpia al amanecer y al caer), `d.giroNoche`, `d.giroAnterior`.

### 3. Noches que se encadenan (`d.cadena`; `sanearCadena`, `cerrarNoche`, `efectoCadena`, `aplicarCadena`)
Cuatro reglas, con aviso una hora antes del ataque («Lo de anoche no se olvida»):
1. **El que se escapó con lo robado vuelve con compañía:** por cada duende que se escapa con lo robado (se cansa de
   correr, o se va con el alba) la noche siguiente suma 2 rastreadores (máximo 4). «El que se escapó con tu leña
   volvió con compañía.»
2. **Los que seguían en pie con la primera luz vuelven más grandes:** hasta 3 brutos de más. «El que se fue con la
   primera luz volvió más grande.»
3. **Ganar sin bajas trae una noche más grande:** si no cayó ninguna obra y te hirieron menos de un cuarto de la
   salud, la lista de la noche siguiente crece un 25%. «Anoche no pudieron con vos: esta noche bajan en más cantidad.»
4. **La defensa sin arreglar es por donde entran:** una hora antes del ataque, la defensa con menos de la mitad de su
   resistencia (la más maltrecha) es la brecha: la nave de esa noche baja a 40–58 m de ella. «Dejaste el muro de
   pirca sin arreglar: esta noche entran por ahí.»
- Tope de la lista: 24 (los de siempre); el jefe sigue uno y último; la final no lo usa; si caés o se saltea una noche,
  la cadena se olvida (`olvidarCadena`). Sólo vale para la noche siguiente (`paraNoche`).
- Si hay rescate, tren varado o asedio, la nave baja donde esos eventos mandan (la brecha va después en el orden).

### 4. Guardado
Campos nuevos en `desafioNuevo` y en `sanearDesafio` (con él pasa todo lo que carga `guardado.js`): `giro`,
`giroNoche`, `giroAnterior`, `cadena`. Una partida de la 4.7 carga con todo limpio; valores raros (ids como
`constructor`, números como texto, objetos de más) se descartan. Los invasores reciclados no ganaron campos nuevos.

## Archivos
- Nuevo: `src/desafio-noches.js` (puro, no importa nada: lo importan `desafio-reglas.js`, `desafio-supervivencia.js` y
  `desafio.js`).
- Cambios mínimos y en bloques `4.8 noches:`: `desafio-reglas.js` (ESPECIALES, `nocheEspecial`, `aplicarEspecial`,
  `efectoClima`, `desafioNuevo`, `sanearDesafio`), `desafio-supervivencia.js` (las franjas), `desafio-duendes-reglas.js`
  (`vieneDeViejo` con `porcion`), `desafio-sentidos.js` (`avisoDelPerro` con `alcance`), `desafio-aliados.js` (una
  llamada), `desafio.js` (bloques: giro, cadena, brecha, niebla en el clima y en el oído, luna llena en `bajarAlien`).
  No se tocaron `main.js` ni `guardado.js`.
- Pruebas ajustadas lo mínimo: `verificar-desafio-2.mjs` (el texto de la llamada a `avisoDelPerro`),
  `verificar-3-8-duendes.mjs` y `verificar-3-8-4-desafio.mjs` (dos nombres más en el mundo de mentira de las funciones
  extraídas: `anotarEscape`/`cadenaD` y `olvidarCadena`/`cadenaD`). `verificar-vuelta` y `verificar-3-0-supervivencia`
  cuentan llamadas a `composicionOleada`/`composicionSinFin` en `desafio.js`: el giro de refuerzos se escribió sin sumar
  coincidencias.

## Verificación
`npm run verify` de corrido: **271 pasos OK** (270 de antes + `verificar-4-8-noches`). Partidas reales, de a una y ocultas: `humo-4-8-noches` (27 comprobaciones, todas bien), `humo-3-0-asedio`, `humo-3-5-1-desafio` y `humo-desafio-premium` sin fallas.
- `pruebas/verificar-4-8-noches.mjs` (en el gate): franjas, reglas de las nuevas, vista/oído/perro, viejos de la luna,
  giros (condiciones, una por noche, el código de `revisarGiro` con un mundo de mentira), cadena, saneo de partidas
  viejas, **12 semillas × 30 noches** (cada semilla da una serie distinta; todas las noches y los tres giros salen).
  Se rompió a propósito cada regla clave y la prueba falla (17 de 18 mutaciones; la otra, quitar «n < GIRO.desde», es redundante con el `desde` de cada giro).
- `pruebas/humo-4-8-noches.cjs`: partida real.
