# Zona C — Construcción 4.2 (pico, picapedrero, pesos, almacenaje, ampliaciones, oficios, lujo, exteriores) · Hojarasca 4.4.1

Revisor: lectura del código de `trabajo\t44-integra` (rama v44-integra) + pruebas propias en Node (scripts `c_*.mjs` en esta carpeta, nada dentro del repo). No se tocó el repo, no se corrió el verify, no se lanzó Electron.

Leyenda: **[V]** verificado ejecutando algo · **[R]** razonado leyendo el código (no ejecutado) · el script que lo demuestra está entre paréntesis.

Lo que mi revisión encontró en general: la zona está bien armada. La lógica pura (`obra-pesos`, `almacen`, `oficios-propios`, `oficios`) aguantó los fuzz que le tiré, la física de las ampliaciones aguanta pendientes, rotaciones y escaleras, y no hay fugas al construir/desmontar/rehacer en bucle. Los hallazgos son de pegamento en `main.js` y de reglas que nadie probó contra el resto del juego. No hay nada que gane plata de la nada ni que pierda partidas.

---

## Hallazgos

### MEDIA

**C1 · Mayús + E / Mayús + Supr / Mayús + Y chocan con Mayús = correr** — MEDIA — **[R]** (código claro; no corrí el juego)
- Dónde: `src/main.js` ~3179 (Mayús + E: ampliar depósito), ~3181 (Mayús + E: panel del local), ~3387 (Mayús + Supr: desmontar), ~3424 (Mayús + Y: mover). La tecla de correr es Mayús (`src/jugador.js:252`, `estado.corriendo = teclas.has('ShiftLeft')…`) y la barra de construcción no la apaga.
- Qué pasa: el jugador que va corriendo (Mayús apretada con la izquierda) hasta el depósito y toca E recibe «Ampliar la barraca … Mayús + E otra vez para confirmar» en vez de guardar. Si vuelve a tocar E (entre 0,6 y 12 s después, con la Mayús todavía abajo), **paga la ampliación** (hasta $11.000 + materiales; la Mayús está apretada porque corre). Lo mismo con el local propio (4.3): corriendo hacia el mostrador y tocando E abre el panel de precios en vez de atender. En el modo obra, Y con Mayús abajo es «mover una pieza» (nota «Nada que mover» y no construye), y **Supr con Mayús abajo desmonta la pieza más cercana** (pierde la mitad de los materiales y de los pesos pagados) en vez de retirar la marca.
- Reproducir: modo obra (O), pararse junto a una pieza terminada, mantener Mayús y apretar Supr → «desmontada». Junto a una barraca terminada, Mayús + E, esperar 1 s, Mayús + E → cobra (`almacen-juego.js` `ampliar`, simulado en `c_almjuego.mjs`: primera llamada muestra el precio, segunda cobra $3.500 y sube de nivel; ahí la lógica del doble paso está bien, el problema es quién lo dispara).
- Corrección sugerida: no leer `e.shiftKey` si el jugador viene corriendo (`js.corriendo`), o mover las órdenes destructivas/de pago a una tecla que no sea la de correr (o a un botón del panel). Mínimo: que Mayús + Supr y la 2.ª Mayús + E pidan que la Mayús se haya soltado y vuelto a apretar desde la primera.

**C2 · Los galpones de la 4.2 no cubren de la lluvia (llueve adentro)** — MEDIA — **[V]** (`c_lluvia.mjs`)
- Dónde: `src/construccion.js` `cubiertasLluvia` (~3662): sólo cuenta `alero`, `cubreArea`, techos/entrepisos modulares y `habitable && !snap`. Las piezas nuevas con techo de dos aguas y piso caminable (`planos-oficios.js:19 base`, `planos-negocio.js:15 base`, `planos-almacen.js:21 base`, `planos-exteriores.js:21 base`) no declaran `cubreArea`.
- Qué pasa (ejecutado con la construcción real): `cubiertasLluvia` devuelve 0 rectángulos y `bajoCubierta` da `null` parado en el centro de: herrería propia, carpintería, panadería de horno, cervecería, telar grande, quesería, tienda de campo, cantería, almacén de campo, panadería propia, depósito de piedra «techado», barraca, cobertizo de heno (el texto dice «El heno no se moja»), establo. En cambio `alero`, `techito-parrilla`, `invernadero` y las ampliaciones habitables sí devuelven 1 cubierta. Consecuencia: la lluvia cae por el techo sobre el jugador (visual), no se activa el sonido de techo (`techoDeAudio`/`bajoCubiertaActual`) y `bajoTecho` da falso para la humedad de la leña (main.js ~7354).
- Corrección: `cubreArea: true` en el `base` de esos archivos (ancho/fondo/alto ya están bien: `lleno()` incluye el techo; la altura del rectángulo sale como `alto − 0,3`). Para el silo (techo cónico, sin interior) no hace falta.

**C3 · El desalojo de obras no devuelve pesos ni lo gastado en ampliaciones** — MEDIA (poco frecuente) — **[R]**
- Dónde: `src/main.js` ~6811 (`desalojarObras`, rama «no hay lugar»): `materialesDeObra(d, plano)` devuelve los materiales **enteros** de las etapas hechas y `devolverContenido(d)` lo guardado, pero nada de los pesos pagados (`d.pagadas`) ni de los materiales/pesos de las ampliaciones (`d.almacen.n`). Sólo Mayús + Supr (`reintegroAlDesmontar`, `almacenJuego.reintegro`) paga reintegro.
- Qué pasa: si al cargar una partida una obra cae en un lugar prohibido (cambio de terreno, nueva obra de la aldea) y no hay dónde mudarla, una torre de $78.000 se «desarma» sin devolver un peso. Es el único camino de remoción que no reintegra.
- Corrección: en esa rama sumar `reintegroAlDesmontar(...)`/devolución entera (como los materiales, que ya vuelven enteros) y `almacenJuego.reintegro/materialesDeAmpliaciones`; o avisar «los pesos no se devuelven». Pregunta de diseño abajo.

**C4 · Los pedreros (y troncos caídos) no se recuerdan: vuelven al recargar** — MEDIA (diseño/consistencia) — **[R]**
- Dónde: `src/main.js` 4477–4510 (`usarHacha` → `veg.despejar(o.mata.x, o.mata.z, 0.6, true)`): sólo toca el estado en memoria; los árboles sí van a `progreso.talados` (`anotarTalado`) y rebrotan por días, las rocas no se anotan en ningún lado (grep: ninguna lista de rocas picadas en `guardado.js`). Al recargar el mundo se regenera igual.
- Qué pasa: cantera infinita por guardar/recargar, y XP de picapedrero infinito (golpes 1–5 de una roca = 5 XP, recargar, repetir; el avance `golpesPico` es una WeakMap y tampoco se guarda). Con 4.2 el consumo de piedra es enorme (el torreón pide 192; son 48 pedreros), así que el incentivo a recargar es mucho mayor que antes. La nota de CAMBIOS dice «las rocas se borran del mapa», lo que sugiere que se pensó persistente.
- Corrección: anotar `{x,z}` de pedreros picados (como `talados`, con tope y saneo) o hacerlos rebrotar por días; o aceptar y documentar. Ver preguntas.

### BAJA

**C5 · La gramola: un notas-en-ráfaga tras una pausa del temporizador, y una sola gramola global** — BAJA — **[V] la ráfaga (`c_gram.mjs`) · [R] lo de las dos gramolas**
- Dónde: `src/gramola.js` `programar()` (líneas ~100–113) y `alternarGramola()` (~118).
- Ráfaga: `programar` programa todo evento con `cuando <= ahora + 1.5 − t0` y lo suena en `Math.max(ahora, t0 + e.cuando)`. Si el temporizador se estrangula (ventana minimizada >5 min, la PC se suspende, un tirón largo) y vuelve, **todas las notas atrasadas suenan a la vez**. Simulado con un contexto falso: tras 40 s sin ticks vuelven 185 notas en un solo tick, 184 en el mismo instante (cada nota son 1–2 osciladores). Corrección: descartar eventos cuyo `cuando` ya pasó (`if (G.t0 + e.cuando < ahora − 0.05) { G.i++; continue; }`).
- Dos gramolas: el estado es global (`G`). E en la gramola B mientras suena la A (a menos de 18 m) **para la A** («Paraste la gramola») y el aviso de B dice «Parar la gramola» (`main.js` ~7823, `gramolaSuena()` global). Mínimo: que el aviso/E sepan de cuál es la que suena (`G.duenio`).
- Además no hay atenuación por distancia: suena igual a 1 m que a 17,9 m, atravesando paredes y pisos, y corta seca a los 18 m (fundido de 0,15 s). Pregunta de diseño.

**C6 · El herrero ofrece el pico en cada visita y tapa el afilado/la tijera** — BAJA — **[R]**
- Dónde: `src/aldea.js` ~1613–1635 (`case 'herrero'`). Si no tenés pico y tenés ≥3 cantos y ≥$300, devuelve **siempre** la oferta de forjar el pico (return temprano); el afilado y la tijera quedan detrás del `return`. «Escape: otro día» no marca `yaHoy`, así que a la siguiente visita pasa lo mismo.
- Qué pasa: un jugador con hacha que prefiere el trueque del almacén para el pico (3 cantos + 12 ramitas) o que simplemente quiere afilar no puede, mientras junte esos cantos y esa plata. Sólo se destraba gastando los cantos o los pesos.
- Corrección: si ya se rechazó hoy (o ya se ofreció hoy), seguir con el afilado; o poner la oferta del pico después del afilado.

**C7 · El silo / la barraca sólo se vacían con las manos vacías de *todo* lo que guardan** — BAJA (UX) — **[V]** (`c_almjuego.mjs`)
- Dónde: `src/almacen-juego.js` `usar()` (~125–150). Con cualquier material en la mochila que el depósito guarde, E **deposita** (aunque esté lleno: «lleno»); sólo con cero de *todas* las claves que guarda, E **saca todo**.
- Simulado: silo con 60/60 habas guardadas y 40 habas + 30 papas + 2 calafates en mano → E responde «Silo y granero lleno». Para sacar una sola cosa hay que vaciar la mochila de las 4 cosechas y sacar **todo** junto. Mismo en la barraca (4 materiales). Tampoco se puede sacar sólo la lana. Pregunta de diseño (¿una tecla para «sacar»?).

**C8 · Nombre repetido «Banco de carpintero»** — BAJA — **[V]** (`c_aud2.mjs`)
- `src/construccion.js:948` (`banco-trabajo`, categoría Trabajo, el que aserra y rinde 4 tablas) y `src/planos-muebles-2.js:217` (`banco-carpintero`, Mobiliario, decorativo, cuesta 12 tablas + 2 troncos). Mismo nombre en el menú. Quien arma el de Mobiliario creyendo que es el del encargo/guía («Levantá un banco de carpintero (O → Trabajo)») no consigue nada. Renombrar el de muebles («Banco de taller»).

**C9 · Las piezas grandes de la 4.2 se pueden fundar unas sobre otras** — BAJA — **[V]** (`c_solape.mjs`)
- `revisarSitio` sólo rechaza el solape entre piezas cuando una declara `huellasExtra` (`construccion.js:2668 chocaHuellaExtra`); las ampliaciones sí («Se superpone con otra pieza», probado con quincho/taller y planta alta/torreón) pero **no** los oficios, almacenes, locales, exteriores ni lujos grandes. Con la construcción real: barraca sobre depósito de piedra, silo sobre barraca, herrería sobre cantería, tienda de campo sobre local de almacén, fuente sobre estatua… todos «Lugar válido» con separación 0. Resultado: mallas y colisiones atravesadas (z-fighting), y E toma el más cercano al azar. Sugerencia: darles `huellasExtra` o una regla genérica «pieza con `alto` > 2 y `ancho` × `fondo` > 6 no entra en la huella de otra pieza grande».

**C10 · Con hacha y sin pico, H elige la roca aunque haya un árbol más cerca** — BAJA — **[R] + conteo [V]** (`c_veg.mjs`)
- `main.js` `objetivoHacha` (4410): rocas y troncos caídos se evalúan **antes** que los árboles y, si hay una en 3,2 m, devuelve esa y no sigue. Con hacha sin pico, la roca da `sinPico: true` → H dice «Te falta el pico» aunque el jugador esté pegado a un árbol que podría talar. Pasa sólo mientras haya una roca a <3,2 m (con la vegetación real, el 0,4 % de los árboles —14 de 3.771 en calidad muy baja— tienen una roca a esa distancia, así que es raro), pero es una trampa de aviso: conviene que, con `sinPico`, la roca no tape al árbol. Corrección: si `sinPico`, seguir buscando árbol.

---

## Cosas que revisé y están bien (para que no se vuelvan a mirar)

- **Pesos [V]** (lectura + simulación): `pagoDeEtapa`/`cobrarEtapa` no cobran dos veces (la etapa deshecha se rehace gratis por `pagadas`), no cobran sin materiales (el chequeo de plata va antes de `conMateriales` y `pagar` no puede fallar después porque `puedePagar` usa el mismo saldo), `pagadas` sobrevive al guardado (clamp 0–8 en `guardado.js:466`; los planos con pesos tienen ≤4 etapas), el desafío ignora los pesos. Construir + desmontar siempre pierde (50 % de los pesos, 50 % de los materiales con `max(1, …)` sólo si cuestan >1, más el aviso de sobrante que nunca devuelve todo: `ahorroDeObra` limita a `c−1`). Razonado (no ejecutado) el ciclo completo con carpintería + constructor nivel 5: se recupera como mucho el ~90 % de los materiales (40 % de sobrante + 50 % al desmontar), nunca ≥100 %.
- **Almacenaje [V]** (`c_almjuego.mjs`, simulando `crearAlmacenJuego` con obras falsas): guardar respeta el tope (40/70/110/160), la ampliación muestra el precio la 1.ª vez y cobra una sola vez la 2.ª (la 3.ª inmediata muestra la siguiente sin cobrar), sin plata/materiales no cobra, el pago de obras vacía primero el depósito más cercano y sigue con el siguiente (25 tablas con A=10 y B=30: A 10 → B 15; 100 tablas sólo saca lo que hay), desarmar devuelve lo guardado una sola vez (idempotente) y el reintegro de las ampliaciones es la mitad. Las ocho mallas de los depósitos (todos los niveles y llenuras) arman sin NaN y con ≤892 triángulos.
- **Pico [V]**: tabla de golpes 6/6/5/4/3/2 (grande) y 4/4/3/2/2/1 (<0,8 de escala), XP al picapedrero y no al hachero, un solo contador de filo para hacha y pico (más el temple), migración `picoEntregado` (`c_guard.mjs`: hacha sin pico → recibe el pico y el aviso una sola vez; hacha + pico, nada, o ya entregado → no se toca; no hay forma de que se repita), trueque/compra/forja con cantos y plata justos.
- **Edificios de oficio [V]** (fuzz `c_taller.mjs`, 12.000 secuencias): `n ≤ tope`, `desde` finito, nunca se retiran más tandas de las cargadas, nunca inventario negativo; a los 30 días hay sólo `tope` tandas. Tienda: paga entre el 42 % y el 72 % del valor base, nunca más (`c_tienda.mjs`).
- **Física [V]**: las 11 ampliaciones se levantan y se entra por la puerta hasta el piso a 0,05–0,30 de pendiente en todas las rotaciones en las que `revisarSitio` las acepta (329 casos, 0 fallas); las tres escaleras se suben y bajan con 0–0,2 de pendiente (`c_slope.mjs`, `c_stairs.mjs`). Ninguna pieza de la 4.2 deja al jugador atrapado en el centro ni queda inalcanzable para la E (`c_walk.mjs`, `c_alcance.mjs`). Ampliación nunca solapa la casa más de 0,1 m en 4×49×49 sitios (`c_overlap.mjs`).
- **Catálogo [V]**: 208 planos, ids únicos, categorías existentes, materiales válidos (`c_aud1/2.mjs`). Construir/rehacer 60 veces no duplica colisiones ni plataformas (`c_rehacer.mjs`); desmontar las 190 piezas no deja nada colgado.

---

## Preguntas de diseño para vos

1. **Mayús**: ¿preferís mover «ampliar», «desmontar» y «mover» a otra tecla (o a botones del panel) en vez de apagar `shiftKey` cuando corrés? Hoy la 2.ª Mayús + E **cobra**.
2. **Pedreros**: ¿deben seguir regenerándose al recargar (cantera infinita) o recordarse como los árboles (con rebrote por días)? Con la 4.2 la piedra es el cuello de botella.
3. **Desafío**: con pico, una roca grande pide 6 golpes en nivel 0 (antes 1 hachazo) y el filo no existe (no hay herrero). ¿Querés 6 golpes en el Desafío o que ahí sean 1–2? (Se nota en la honda y en las defensas de piedra.)
4. **Casas vs piezas**: Retroceso (deshacer etapa) + Supr devuelve el **100 %** de los pesos de una casa (`devolverEtapasPagadas`), pero desmontar una pieza devuelve el 50 %. ¿Está bien que una ampliación mal elegida (pieza) pierda la mitad de los pesos de la 1.ª etapa y la casa no pierda nada? (No es un bug de ganancia: se pierde el 50 % de los materiales igual.)
5. **Desalojo (C3)**: ¿se devuelven los pesos (y lo de las ampliaciones) cuando una obra se desarma porque no hay lugar? Hoy los materiales sí, los pesos no.
6. **Gramola**: ¿atenuada por distancia / por paredes? ¿Una sola gramola a la vez en todo el juego es la regla buscada?
7. **Silo y barraca**: ¿querés una forma de sacar de a una cosa (p. ej. mantener E, o un número) en vez de «todo o nada»?
8. **Edificios grandes**: ¿se permite que se solapen entre sí (muebles sí, pero un galpón sobre otro)?
9. **Frutillas**: el silo guarda `frutilla-huerta` y los locales venden `frutilla`; la reposición del empleado desde el silo nunca encuentra frutillas (sí papas). No es de mi zona, pero salió al leer `negocio-propio-reposicion.js`.

## No alcancé a revisar

- Ningún chequeo en el juego real (Electron) ni medición de fps: todo lo de render (z-fighting de C9, lluvia de C2 vista en pantalla, pisos que se asoman en laderas ≥0,2) está razonado o medido sólo en Node.
- Laderas empinadas: a pendiente ≥0,2 con la casa girada de costado, el piso queda hasta ~0,9 m por **debajo** del terreno en el lado alto y ~1,9 m por encima en el bajo (medido con la plataforma de colisión, no con la malla; `c_slope2.mjs`). No pude ver si los zócalos lo tapan; pasa también con las casas de la 4.0.1. Vale mirarlo con una captura.
- Geometría fina de `planos-lujo*.js` y `planos-exteriores.js` (solo pasé la prueba de sitio, física, E y triángulos), `planos-casas.js` más allá de lo que usan las ampliaciones, los textos de la guía/cuaderno, el modo accesibilidad, `enmano.js`/`mochila.js` en el Desafío con arsenal completo (con 7 armas + linterna, el hacha y el pico quedan más allá de la casilla 8 de la barra), el costo por cuadro del aviso de E junto a un taller (`avisoTaller` → `materialesVisibles()` por cuadro: alocaciones, sin medir), `negocio`/`empleados` (otras zonas).
- No probé qué pasa si el reloj de juego retrocede (cambiar `ajustes.duracion`) con talleres cargados.

## Scripts (en esta carpeta, no en el repo)

`c_aud1.mjs`, `c_aud2.mjs`, `c_aud4.mjs` (catálogo) · `c_scan.mjs` (armar/desmontar los 208 planos) · `c_lluvia.mjs` (C2) · `c_gram.mjs` (C5) · `c_almjuego.mjs`, `c_alm.mjs` (almacenaje) · `c_guard.mjs` (migración `picoEntregado`, saneo) · `c_taller.mjs`, `c_tienda.mjs` (oficios) · `c_slope*.mjs`, `c_stairs.mjs`, `c_walk.mjs`, `c_alcance.mjs`, `c_overlap.mjs`, `c_solape.mjs`, `c_encajonado.mjs` (física y sitios) · `c_veg.mjs` (rocas y árboles reales) · `c_rehacer.mjs` (fugas).
