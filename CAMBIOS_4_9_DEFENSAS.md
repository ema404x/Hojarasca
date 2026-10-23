# 4.9 · La aldea en la noche · tanda «defensas» (rama `v49-defensas`)

Lo roto que se ve, el pasadizo de escape, la trampa de miel, el farol de mano y la pala de brasas. Sale de la 4.8.0 (`4f6eb49`). No se sube la versión.

## Lo que ya existía (revisado antes de tocar; no se duplicó)
- **Arsenal** (`desafio-arsenal.js` y `-mundo.js`, 2.5): ballesta, facón, maza, arpón, hachuelas, jabalinas, granadas, humo, bengalas, cuerno, flechas incendiarias y doradas con el carcaj, escudo de tablas, chaleco. Antes de esta tanda había 10 armas del arsenal más las 7 de siempre.
- **Fortín** (`desafio-fortin*.js`, 2.6) y **defensas activas** (`desafio-defensas.js`): unas 31 piezas de la categoría Defensa (empalizada, portón, pirca, estacas, antorchas, campana, torre, zanja de fuego, catapulta, puente levadizo, lazo, abrojos, foso…). Nada pegaba al duende con una sustancia: el lazo lo cuelga, el pozo lo atrapa, el foso lo frena; la miel es otra cosa.
- **Vida de las obras**: `vidaMaxObra`/`vidaDe`, `reparar` y `reforzar` en la pestaña Base del taller, el martillo, el parte de la base (N). Todo eso era **texto y números**: de la vida de una defensa, en el mundo, no se veía nada hasta que caía.
- **Linterna** (L): un `SpotLight` pegado a la cámara. El «farol» de la mochila es el de kerosene del Relax (la misma luz con más alcance): no es el de mano.
- **Miel**: sólo en el Relax (colmena, frascos como «entrada»). **En el Desafío no había**: ni contador, ni colmenas.
- **Fuegos**: `clima.fogatas` (hasta cuatro fogones prendidos), las antorchas de la base y la zanja. `api.prenderCerca` (flechas incendiarias) prende la zanja y hace estallar barriles.
- Pasadizos, trampas pegajosas, farol en la mano izquierda y pala: nada.

## Lo hecho

### 1. Lo roto queda a la vista (`desafio-roto.js`, `desafio-roto-mundo.js`)
- Tres estados según la vida (`estadoRotura`): sana, dañada (< 70 %) y rota (< 35 %).
- **Una malla de marcas por obra rota**, del material de la propia obra (vértices tipo 0 de madera o 4 de piedra, **sin shaders ni materiales nuevos**): garras (surcos claros sobre lo oscuro: 3 grupos en el estado 1, 5 en el 2), una tabla o piedra torcida en el borde, astillas, un hueco donde falta una tabla y, en el estado 2, tablas (o piedras) caídas al pie y tablas colgando. Más una **inclinación de la malla de la obra** de hasta 2,6° (el portón se sale de eje hasta 5,7°; ninguna pasa de 8,6°); la colisión no se mueve.
- Números: estado 1 ≈ 130 triángulos y 11 piezas; estado 2 ≈ 305 triángulos y 26 piezas (tope 36). **Un dibujo más por defensa rota**; sin marcas por cuadro: se mira cada 0,6 s y sólo se arma algo cuando cambia el estado. Geometría en caché (4 variantes por plano y estado): armar 7 obras rotas dejó 5 geometrías.
- Al repararla vuelve a lo normal (sin marcas y derecha). No se ven rotas las trampas que se gastan (estacas, red, barril, lazo, abrojos, foso, miel) ni las bajas o sin cuerpo.

### 2. Pasadizo de escape (`desafio-pasadizo*.js`, pieza en `planos-defensas-49.js`)
- Pieza del menú de obra (O → Defensa): tronco 4 + tabla 6 + piedra 3. **Una sola obra con dos bocas a 9 m** (hacia +z de la pieza, que se gira con R): la tapa de tablas sobre un montículo (adentro de la base) y un tronco hueco entre ramas (afuera).
- La boca de afuera se valida al colocar (`revisarLugar`): ni agua, ni pendiente de más de 0,5 rad, ni 2,4 m arriba o abajo, ni encima de una pared u obra alta (`huellasExtra`); y despeja las matas como el centro de cualquier pieza (`despejaExtra`).
- **Colisión**: círculo de 0,78 m en la tapa y un segmento de 1,6 m en el tronco; entre las dos bocas hay paso libre (va por abajo).
- E junto a una boca (a menos de 2,3 m): negro de tierra en 0,55 s, el cuerpo cambia de lugar con la pantalla cerrada y se abre en 0,6 s del otro lado, **mirando hacia afuera de la boca, en el primer lugar libre** de ocho (primero con casi un metro de aire, si no con lo justo de un cuerpo, y nunca en el agua); 2,6 s sin que te peguen; se enfría 1,2 s. Si la otra boca está tapada, lo dice y no te mueve.
- **Los duendes no lo ven ni lo usan**: la obra es `sinCuerpo` (ni pared ni blanco, la misma regla del lazo) y `oculta` (no cuenta como defensa para los compañeros). No se daña.

### 3. Trampa de miel (`desafio-trampas*.js`, pieza `trampa-miel`)
- Pieza de O → Defensa: 2 tablas. Una bandeja con el charco de miel (Lambert con brillo propio; achica con los usos). **El duende que la pisa queda pegado 3–4 s** (los brutos, la mitad; el jefe y los que vuelan, nunca), **frenado y sin atacar** (cabeza gacha, lamiendo), y gasta un uso. **Aguanta 5**; después se seca (charco apagado). La misma trampa no lo vuelve a pegar por 6 s.
- **Reponer**: E junto a la trampa (aviso «Echar miel en la trampa (1 frasco)») o en el taller, pestaña Base, «Echar miel en la trampa de miel más cercana» (receta `miel-trampa`, 1 frasco). Un frasco la deja llena.
- **Se prende** con una brasa de la pala: arde ~7 s (el charco late en naranja y suelta llamas), quema a los pegados y cuando se consume queda seca y los suelta ardiendo.
- **De dónde sale la miel en el Desafío** (no había): un contador entero `progreso.desafio.miel` (0–99, saneado); **la caja del alba trae 1 frasco las noches impares y 2 desde la séptima** (`mielDelAlba`), y entra a la mochila como «Frascos de miel». Quien quiera darla de otra forma (los pedidos de la aldea) usa `ctx.sumarMaterial('miel', n)`. Equilibrio: una trampa llena cuesta un frasco y pega a 5 duendes ~3,5 s cada uno (17 s de frenado en total).

### 4. Farol de mano (`desafio-farol*.js`)
- Receta en el taller, pestaña Equipo (1 tabla, 1 semilla dorada, 2 ramitas), `cosas.farolMano`. En la barra va **justo después de la linterna**; U o clic derecho lo prende y lo apaga, y **queda en la mano izquierda mientras usás el arma de la derecha** (el farol se dibuja pegado a la cámara: marco, vidrio ámbar, llama con vaivén).
- **Usa la luz de la linterna** (sin luces nuevas): ámbar, ángulo de 1,3 rad, alcance 24 m, intensidad ~30 con titileo, corrida a la izquierda y mirando un poco hacia abajo; al apagarlo, la linterna vuelve a sus valores y queda apagada. Mientras está prendido, la L no lo apaga. **Medido: 0 programas de shader nuevos** al prenderlo.
- **Los viejos oscuros** (`m.viejo`, salvo los jefes y el que rompe una pared) **no se acercan a menos de 5,5 m** (retroceden a 0,85 de su velocidad y no atacan). **Te delata**: los tiradores te ven 1,45 veces más lejos. La lluvia fuerte (> 0,55) lo apaga.
- Medido en Electron: con el farol el bruto se quedó a **5,4 m** durante 18 s; sin farol llegó a 2,3 m.

### 5. Pala de brasas (`desafio-brasas*.js`, `desafio-brasas-sonido.js`)
- Receta en Armas (1 tronco, 1 tabla, 2 piedras), `cosas.pala`, arma del arsenal (`ARSENAL.pala`, tipo `brasas`, clic izquierdo; el clic derecho hace lo mismo, como las otras armas). **Se carga con E junto a un fogón prendido o una antorcha** con la pala en la mano (6 cargas).
- Cada clic: **abanico de 9 brasas** en 57°, que caen entre 5,5 y 11 m, con parábola (chispas y llamitas de `desafio-efectos.js`, sin editarlo). A los duendes del abanico (sin pared en el medio): 6 de daño de fuego, arden 1,6 s y **dudan 2,4 s** (un instante quietos y después retroceden; los grandes la mitad, el mandamás casi nada; el que rompía una pared la suelta). **Prende la miel** de las trampas donde cae una brasa y hace estallar los barriles de resina.
- **Sonido propio** (`desafio-brasas-sonido.js`, sintetizado con `sonido-sintesis.js`; no se tocó `desafio-sonidos.js`): el abanico (soplido + racimo de chasquidos, 0,75 s), cargar (raspado de metal sobre piedra y ceniza, 0,6 s) y la miel que prende (un «fum» grave y el chisporroteo del azúcar, 0,8 s).
- La pala en la mano (mango, hoja de piedra y brasas) en `enmano.js`; íconos de la barra y la mochila.
- **`D().fuegosDeBase()`** → en el código `defensas49.fuegosDeBase()` y `defensas49.brasas.fuegosDeBase()`: lista `[{ x, y, z, tipo: 'fogon' | 'antorcha' }]` con los fogones de `clima.fogatas` prendidos más las antorchas encendidas. **El fogón de Herminia** sólo tiene que registrar su fuego en `clima.fogatas` (`encenderFogata`) para que la pala lo use; y si ellos quieren prender «los fuegos» de la pala, la pala no prende fogones: sólo miel y barriles.

## Contratos
- **«Días»** (preparar la noche): `desafio.colocarTrampaMiel(x, z, { gratis = false, rot = 0 })` → `{ ok, obra }` o `{ ok: false, motivo }`. Arma la trampa ya llena (`usos` 5) si el lugar sirve (las mismas reglas que el menú de obra), gasta 2 tablas y 1 frasco salvo `gratis`, y la deja entre las obras que se guardan (`alGuardarObras`). El estado (`usos`, `prendida`) viaja en `obra.datos` y se sanea al abrir. La miel: `progreso.desafio.miel`; `ctx.cuanto('miel')`, `gastar` y `sumarMaterial` la entienden (main.js). Subido en el primer commit (`39882e8`).
- **«Aliados»**: no se tocó `desafio-aliados.js`, `desafio-ordenes.js`, `desafio-vecinos*` ni `desafio-campana*`. `defensas49.fuegosDeBase()` (arriba). La E del pasadizo, las trampas y la pala sale de `avisoCercaDe`/`usarCercaDe` (tercer lugar de la cadena, antes de los capullos y el fortín), no de la tabla de `interacciones.js`: es la entrada `desafio-cerca` de siempre.

## Cambios en lo ajeno (mínimos, en bloques `4.9 defensas:`)
`desafio.js` (enganche: crear, actualizar, `estadoAlien`, `bajarAlien`, E y aviso, `atacar`, taller, caja del alba, 8 líneas de api), `main.js` (miel, `farolMano`, `luzLinterna`, `armaEnMano`, `fuegos`), `construccion.js` (importar las piezas, `despejaExtra`, `h.suelo`), `desafio-reglas.js`, `desafio-arsenal.js` (`pala`; `miel` y `brasas` entre las municiones), `desafio-vuelta.js` (el farol y la pala pasan a la otra vuelta), `mochila.js`, `enmano.js`, `guia.js` (5 entradas).
Pruebas existentes ajustadas, lo mínimo: `verificar-modo-desafio.mjs` (la lista de recursos de las recetas ahora incluye `miel`). Ninguna otra: se mantuvieron las líneas que miran las pruebas de texto exacto (`completa`, `usarCercaDe`, `if (quietoArsenal || ef.quieto)`…).

## Pruebas
- `pruebas/verificar-4-9-defensas.mjs` (en el gate): **2420 comprobaciones**. Estados de rotura por vida y su geometría (todas las defensas), el pasadizo (colocar, validar el terreno, colisión, entrar y salir, lugar libre, tapado, duendes), la miel (pegado, duración, usos, se seca, reponer, prender, soltar al caer), el farol (radio de los viejos, te delata, la luz de la linterna, lluvia), las brasas (abanico, paredes, dudan, prenden la miel, cargar), el sonido, recetas, mochila, guía, guardado y partidas viejas.
- `herramientas/mutar-4-9-defensas.cjs`: **rompe a propósito 42 reglas** y confirma que la prueba falla; la primera pasada dejó 4 vivas (usos de la miel, reponer sin gastar, la pala sin tenerla en la mano y la otra vuelta) y la prueba se completó hasta que cayeron todas.
- `pruebas/humo-4-9-defensas.cjs` (Electron, ventana visible en el monitor externo): lo roto en tres estados y reparado; el pasadizo **caminando de verdad** (llegar a la boca, el aviso real, E, salir a 1,90 m, caminar 4,3 m, volver a entrar a 1,90 m de la tapa); `colocarTrampaMiel`, duendes pegados, se seca, E la repone y el taller la ofrece; el farol; la pala cargada en un fogón y el abanico; la barra y la mochila. **0 problemas.** Capturas en `pruebas/salidas/defensas-4-9/` (no se versionan).
- `humo-3-0-asedio` (49 comprobaciones) y `humo-3-5-1-desafio` (23): sin fallas.
- Lo que Node no mostró y el humo sí: `a.m.viejo` es un dato, no una función (el farol rompía al primer duende); la E del pasadizo la gana una flor que estés mirando (`objetivo`, como todo lo del Desafío: mirá a otro lado); las garras se leían poco y el hueco era un cuadrado; la miel prendida no se veía de noche; el farol y la pala quedaban después de la novena casilla con un arsenal grande.

## Rendimiento (esta PC: notebook Ryzen 7 7730U; **no es la 4600G**)
- `npm run diag:dibujo` (Desafío, noche, plaza): **209 dibujos antes y 209 después** (sin defensas rotas no se suma nada).
- `medir-vistas` (Desafío, calidad alta, 300 cuadros, 3 vueltas alternadas A,B,A,B con la PC en calma): refugio de noche, **mediana de p50 12,1 → 12,4 ms** (p95 13,3 → 13,7); bosque, **12,1 → 13,1 ms** (p95 13,1 → 20,9, con un valor suelto de 20,9 en una vuelta). Dibujos 199 → 199 y 182 → 186 (el LOD los mueve). Dos vueltas más, con la PC cargada por otros procesos, dieron 36 ms de un lado y 17 del otro: ruido, no efecto.
- Lo que suma, medido: 1 dibujo y 130–305 triángulos por **defensa rota** (con 10 rotas, +10 dibujos); el farol y la pala no suman dibujos hasta que se usan (el farol: 1 grupo chico pegado a la cámara). **Programas de shader: 91 → 91** al prender el farol, tirar el abanico, armar y usar el pasadizo y las trampas (el +1 que aparece al armar la primera obra en un lugar nuevo sale igual con un cerco de control: no es de esto).
- **Falta medir en la 4600G**: `REPETIR=3 npm run medir:caminata` y `medir-vistas.cjs` con `MODO=desafio CALIDAD=alta`, antes (4.8.0) y después, con 10 defensas rotas a la vista.

## No verificado
- **Ningún sonido se escuchó**: los tres de la pala están sintetizados y probados en Node (duración, pico, que no estén vacíos), pero nadie los oyó (el humo corre con `--mute-audio`).
- Una noche completa jugada con las cuatro piezas a la vez; el equilibrio de la miel (5 usos, 1 frasco por noche impar) y del farol (5,5 m) es de escritorio.
- La pala con el fogón de Herminia (lo hace el agente de «aliados»), y la trampa de miel puesta desde «preparar la noche» (lo hace «días»): sólo se probó el contrato.
- Calidad media y baja; el modo sin fin; una partida guardada a mitad de abanico (las brasas en el aire se pierden, el daño ya estaba hecho).
- Pasaron solas y fallaron una vez por tiempo dentro del gate paralelo: `verificar-construccion-premium-rc6` (timeout de 20 s del vm con la PC cargada; también falló en la base sin tocar nada) y `verificar-integridad-estructural-rc31`.
