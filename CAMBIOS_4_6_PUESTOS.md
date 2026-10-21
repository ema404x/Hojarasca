# Hojarasca 4.6 · Los cuatro puestos de ruta y la parada nueva de la trochita (rama `v46-puestos`)

Paquete 1a del mapa, parte «puestos» (ver `PLAN_MAPA_VALOR.md`, «Decisiones tras la auditoría», y `AUDITORIA_MAPA_VALOR.md`).
Sale de `235b9eb`. Sólo Relax. **La versión no se subió** (sigue 4.5.1).

## Cómo se juega

Cuatro puestos viejos, ya en el mapa, **abandonados**: tablas caídas y faltantes, la puerta tirada en la galería, el techo hundido (un
tramo de chapa en el suelo, otro vencido en V y una viga partida adentro), el fogón desarmado y apagado, el alero del depósito tirado.

| | Puesto | Dónde (x, z) | Mira a | Atiende (perfil de precios) |
|---|---|---|---|---|
| A | **Puesto de la Cantera** | (−322,9, −290,0): el sitio de la auditoría corrido 3,5 m de la vía (queda a 9,5 m) | la vía | el capataz de la cantera (perfil de la «Parada Alta») |
| B | **Puesto del Paso** | (−343,3, −21): 8,5 m al este de la vía, como se decidió | la vía (oeste) | el baqueano del paso (perfil de la «Parada del Mirador») |
| C | **Puesto de la Estepa** | (320, 80), tal cual | el sur (la cueva) | el puestero de la estepa (perfil nuevo) |
| D | **Puesto del Riel Sur** | (295,9, −230,9): 9,4 m al sureste del riel, detrás de su andén | la vía y el andén | el guardavía del riel sur (perfil nuevo) |

Las coordenadas son **fijas** (constantes en `puestos-ruta.js`; no dependen de la calidad: el molino, la torre, el galpón y el Puesto
Alto, que sí se mueven, quedan a más de 100 m en todas). El mapa (M) rotula los tres que no son parada, con «(abandonado)» hasta
repararlos; el Riel Sur sale con las paradas.

- **Reparar:** junto al puesto (a menos de 5,8 m del centro), el aviso dice la etapa y el costo, p. ej. «Reparar el puesto de la
  cantera (1 de 3: paredes y puerta) · $3.000, 5 tablas y 2 piedras», y **E** la paga (de la billetera y de la mochila). Si falta algo,
  la nota dice qué: «Faltan 4 tablas, 2 piedras y $2.000». Cada etapa se ve:
  1. **Paredes y puerta** ($3.000, 5 tablas, 2 piedras): las tablas nuevas, más claras, tapan los huecos; la puerta colgada (abierta
     hacia adentro); la galería entera.
  2. **Techo y salamandra** ($3.000, 3 tablas, 3 piedras): chapa nueva con sus vigas, la salamandra adentro y su caño.
  3. **Fogón, catre y depósito** ($3.000, 2 tablas, 5 piedras): el fogón armado con leña y un tronco para sentarse, el banco de la
     galería, la ventanilla abierta con su mostrador y el postigo de alero, el catre adentro y el alero del depósito en pie.
  Al terminar: «¡Puesto de la Cantera reparado!», y el puesto abre con **$5.000 en la caja**.
- **Reparado:**
  - **Descanso:** adentro, **E** «Dormir en el catre del puesto» (de noche) o «Dormir una siesta en el catre del puesto»; duerme bajo
    techo y tibio (la salamandra), y amanecés **descansado** (como en una casa con confort 6). El banco de la galería y el tronco del
    fogón son asientos.
  - **Fogón:** **F** junto al fogón (aviso «Encender el fogón del puesto»), con la misma leña que el del refugio (en invierno, un
    tronco); dura toda la noche.
  - **Depósito:** del lado abierto del alero, **E** guarda lo que llevás (troncos, tablas, piedra, lana; **40 de cada uno**) o, sin nada
    a mano, saca todo. Lo guardado se ve sobre la tarima (pilas en cuatro pasos).
  - **Comercio:** en la ventanilla, **E** «Comerciar en el puesto de la cantera»: el panel de las cargas con **comprar y vender** (Tab
    alterna los dos; sin fletes), precios propios (el perfil del puesto, el mercado de la 3.8.8: existencias y caja). El panel dice
    «Puesto · Puesto de la Cantera · Comprar» y se cierra si te alejás de la ventanilla.
- **El Riel Sur es además parada de la trochita** (el anillo pasa a tener cinco en el Relax): un andén chico de 9 m con escalones en
  las dos puntas y su cartel, **sin galpón ni luz** (el galpón es el puesto). El tren para ahí como en toda parada (45–70 s), anuncia
  «Puesto del Riel Sur · el próximo tren llega en …» y entra al **comercio entre paradas**: su ventanilla es el puesto de cargas de la
  parada (comprar, vender y **fletes**), sólo con el puesto reparado; abandonado, «el puesto está abandonado» (también desde la cabina).
  Los fletes que van al Riel Sur se entregan igual.

## Reglas y números

- **Reparación** (`ETAPAS_PUESTO`, `repararEtapa`): 3 etapas × $3.000 = **$9.000**, **10 tablas y 10 piedras** en total (5/2, 3/3, 2/5).
  Los pesos van por la maquinaria de la 4.2 (`obra-pesos.js`: `registrarPrecios('puesto-ruta-A', [3000, 3000, 3000])`,
  `puedePagarEtapa`, `pagarEtapa`); el libro dice «Reparación: puesto de la cantera». Sin reintegro (no se desarma).
- **Caja:** `PERFILES[nombre].caja = 5000` en `comercio.js`; `cajaMaxima` de `mercado.js` la respeta (las paradas de siempre siguen con
  su caja de $4.000–8.000). Al terminar la reparación la caja arranca **llena** y se repone **$700 por día** (`MERCADO.cajaDia`, la de
  siempre), con tope $5.000.
- **Precios propios** (perfiles en `comercio.js`): A produce piedra, cristal y piedra de cantera; pide empanadas, pan, lana y troncos.
  B produce piedra y llao llao seco; pide dulce, empanadas, ponchos y cuero. C produce lana, cuero y calafate seco; pide tablas, harina,
  pan y troncos. D produce ponchos y lana; pide huevos, papas, miel y truchas frescas. Los bienes de zona que todavía no están en
  `BIENES` (piedra de cantera, cuero, hierbas, junco) **no se ofrecen**: `bienesDe` deja sólo los que existen (`esBien`), así que
  aparecen solos cuando el agente «recursos» los sume (probado sumándolos y sacándolos en la prueba).
- **Depósito:** las reglas de la barraca de `almacen.js` (`guardar`, `sacar`, `resumen`), siempre en el nivel 0 (no se amplía).
- **Descanso:** `CASA_PUESTO = { cubierta, habitable, calorFactor: 0,2, confortCasa: 6, cama }`: duerme «calentito» y da 3 h de descanso.
- **El apeadero:** `crearTrochita(…, { apeaderos: [...] })` (sólo lo pasa el Relax): busca el punto del riel más cercano (índice 210,
  a 94 del de la aldea), arma el andén y lo suma a `paradas` con `apeadero: true`, `chica: true`, una luz y un vidrio de mentira (sin
  objeto de luz: las luces fijas no cambian), `cargas` = la ventanilla del puesto y `atiende()` = reparado. `puestoCerca` respeta
  `atiende`.

## Guardado

`progreso.puestosRuta = { A: { etapa, deposito: { n, g }, desde }, … }` (Relax; en el Desafío, `undefined`). Saneado en
`sanearPuestosRuta`: sólo A–D buscados con `Object.hasOwn`, etapa de 0 a 3, depósito con las reglas de la barraca (sin cosas
ajenas, nivel 0), `desde` = el día en que se terminó. Una partida de antes de la 4.6 carga con los cuatro abandonados. La caja y las
existencias del puesto viven en `progreso.comercio.mercado[nombre]`, como las de las paradas (ya saneado; tope 40 puestos).

## Decisiones (mías, a revisar)

- **B, en la ladera.** Al este de la vía el terreno sube (es la loma del mirador): 1,5 m de desnivel bajo la casilla. Se respetó
  «8–10 m al este» y la casilla va sobre una **pirca de piedra** con una escalera de 7 escalones (28 cm) hasta la galería; el alero
  del depósito baja con el suelo. Al oeste de la vía era más plano; no se usó para respetar lo decidido.
- **A, corrido 3,5 m** del sitio de la auditoría (estaba a 6 m de la vía; la casilla queda a 9,5 m). **D, 9,4 m** al sureste del riel:
  entre los dos, el andén.
- **Galería al frente** (1,3 m de tablones, a la altura del piso) en los cuatro: la puerta, el banco y la ventanilla quedan a mano
  aunque la pirca sea alta (en B la ventanilla quedaba a 2,5 m del suelo).
- **Perfiles:** A y B reusan los de la «Parada Alta» y la «Parada del Mirador» (copiados con nombre propio; los originales siguen para
  el otro modo). Para C y D no había ninguno de la estepa entre los que sobraban (faro, pescador, bosque, molino, casa de té): se
  escribieron dos nuevos en el mismo estilo.
- **El panel del puesto** es el de las cargas (`comercio-mundo.js`) con `sinFletes` y su propio `cerca(pos)`, no uno nuevo.
- **Sin personajes** (el arriero, el cantero, el pastor son del agente «gente»): el que atiende es sólo el texto del panel.
- **E paga en un toque** (sin «mantené E para confirmar»): el aviso ya dice qué y cuánto antes de apretar.
- No se cambió el texto del cuaderno que dice «cuatro paradas» (es la clave de su traducción y también vale para el otro modo).

## Para los otros dos agentes (contrato)

- **Anclajes:** `PUESTOS_RUTA.B.pos` (el centro de la casilla del Paso: −343,3, −21) y, para pararse, `puntoDe('B', 'puerta')`
  (o `'banco'`, `'fogon'`, `'tronco'`, `'deposito'`, `'mostrador'`, `'cartel'`); lo mismo con `'A'` para el cantero. Todo puro, en
  `src/puestos-ruta.js`. La casilla ocupa ±2,45 m a lo ancho y de −1,85 a +3,05 m al frente; el alero del depósito, hasta 4,3 m a la
  izquierda; el fogón, el tronco y el cartel, hasta 5,8 m. Nada de esto choca salvo la casilla, su galería y la escalera.
- **Bienes de zona:** no toqué `MATERIALES` ni `BIENES`. Los perfiles nombran `piedra-cantera`, `cuero`, `hierbas` y `junco`; si el
  id final es otro, hay que corregirlo en los cuatro perfiles nuevos de `comercio.js` (bloque «4.6 puestos»).
- **Junta:** `main.js` y `guardado.js` sólo tienen bloques marcados `4.6 puestos`; en `comercio.js`, sólo el bloque de los cuatro
  perfiles al final de `PERFILES`.

## Archivos

Nuevos: `src/puestos-ruta.js` (reglas, puro), `src/puestos-ruta-mundo.js` (lo que se ve), `src/puestos-ruta-juego.js` (la E, el aviso
y las notas), `pruebas/verificar-4-6-puestos.mjs` (en el gate), `pruebas/humo-4-6-puestos.cjs`, este archivo.

Tocados: **`src/main.js`** (compartido: imports, el armado en el paso de la trochita, la E, el aviso, la F, `dormir`, el mapa y el
acceso de QA, todo en bloques «4.6 puestos»), **`src/guardado.js`** (compartido: `puestosRuta` nuevo y saneado), **`src/comercio.js`**
(compartido: cuatro perfiles), **`package.json`** (compartido: la prueba nueva en `verify`), `src/mercado.js` (`cajaMaxima`),
`src/comercio-mundo.js` (panel sin fletes, `cerca` propio, apeadero que no atiende), `src/trochita.js` (`construirApeadero`,
`opciones.apeaderos`, `puestoCerca` con `atiende`). No se tocó `plantilla.html`.

## Verificación

- `pruebas/verificar-4-6-puestos.mjs`: **449 verificaciones** (coordenadas y puntos, las tres etapas con sus costos y lo que falta, la
  caja y los $700 por día, los precios y los bienes de zona protegidos, el depósito, el descanso, el guardado ida y vuelta y una partida
  vieja, la E con un juego de mentira, el panel sin fletes, y **el valle de verdad** en Node: sin agua, a más de 8 m de la vía y lejos
  de toda estructura, el apeadero como quinta parada, la geometría tipo 0 o 4 y distinta en cada etapa, escalones que llegan al
  suelo). Triángulos por puesto: ~1.150 abandonado → ~1.800 reparado (una malla y una llamada de dibujo cada uno); escalones: A 1,
  B 7, C 0, D 1.
- **Gate:** `npm run verify` de corrido → **262 pasos OK** (261 + la prueba nueva).
- **Partida real** `humo-4-6-puestos.cjs` (Electron oculto, perfil propio): **OK, 59 comprobaciones, 0 errores de consola**, en calidad
  media y **también en alta** (otra corrida completa: OK, 59 comprobaciones; 41 luces en la escena en las dos; lo nuevo no crea ninguna, verificado en el código y en el apeadero). Llega **caminando** (W) a cada puesto desde 23,5 m (A, B, C desde el frente; D desde su andén, como al
  bajar del tren, y desde el costado), el aviso ofrece reparar, repara los cuatro en tres etapas ($9.000, 10/10 cada uno, caja $5.000),
  duerme en el catre (día 1 → 2, descansado 3 h, «Dormiste calentito»), guarda y saca del depósito, prende el fogón con F, vende 2
  troncos ($300 de la caja del puesto: $5.000 → $4.700) y compra 4 piedras en la Cantera, abre el panel del Riel Sur con fletes, el tren
  para en el Riel Sur (a 0 m del poste), y después de guardar y recargar siguen las etapas, el depósito y la caja; una partida sin
  `puestosRuta` carga con los cuatro abandonados.
- **Capturas vistas a tamaño completo** (33 por corrida): cada puesto abandonado y reparado de frente, de costado y desde arriba
  atrás; la Cantera en las etapas 1 y 2; el depósito con cosas; el fogón prendido al atardecer; el panel; el tren parado en el Riel Sur;
  el mapa. En alta, la toma «desde arriba» del Paso queda adentro de una copa (la cámara de la prueba, no el puesto); de frente se ve
  bien y sin árboles encima. Se corrigió lo que se vio mal: tablas caídas que se metían bajo la escalera y la pirca, vigas que asomaban por la chapa, la
  ventanilla y la escalera de B fuera de alcance (de ahí la galería), maderas grises que se veían azuladas.

## Pendiente y no verificado

- **No medí fps** (la ventana oculta no sirve; hay que correr `npm run medir:caminata` en la 4600G). Lo nuevo es poco y disperso.
- En **muy baja y baja** no vi capturas. Las coordenadas no cambian y el terreno es el mismo en las cuatro calidades (sondeado en el
  juego); los árboles y las rocas sí cambian (en alta había un coihue a 9,5 m de A y lengas a 7 m de B), pero todo lo que queda a menos
  de 7,5 m del centro se despeja al armar el puesto, en cualquier calidad.
- La lluvia bajo el techo arreglado se nota recién cuando la cámara se mueve lejos (el mapa de lluvia se rehace por distancia).
- El aviso de la F del fogón va, como el del refugio, después de todo lo de la E: si el perro marca algo, se ve eso primero.
- El cuaderno sigue diciendo «cuatro paradas» (ver decisiones).
- No probé el **mando** ni la partida del otro modo en Electron (el gate de Node la cubre: nada se arma ahí).
- Al lado del puesto de la Cantera hay un árbol grande detrás (a unos 8 m): no se toca, pero desde el frente el tronco parece salir del
  techo.
