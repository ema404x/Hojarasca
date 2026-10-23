# 4.8 · Noches distintas · el ambiente (rama `v48-ambiente`)

Tanda 1 de las mejoras del Desafío, parte del **ambiente**: el miedo, el sonido, la música, la luz, el clima y los animales. Nada de esto
cambia cuántos duendes vienen ni qué hacen (eso es de las otras dos ramas, `v48-noches` y `v48-ataques`): es cómo se ve y se oye la
noche. La versión no se sube (queda en 4.7.0).

## Lo que se agregó, punto por punto

### 1. La primera noche da miedo desde el principio
Con los tres traviesos de siempre (la composición de la primera noche no cambia, está probado), pero con mucha tensión:
- **De tarde (la hora antes de que salgan)**: ramas que crujen lejos y una risita lejana que se acerca y se aleja; si el agente de los
  ataques dice por qué lado van a entrar (`D().ladoNoche`), el perro gruñe o suena algo de ese lado (si no existe, no hace nada).
- **Un silencio raro** en los últimos segundos de la previa: se callan los pájaros, los grillos, el viento y la música, todo de golpe.
- **El golpe de cuando salen**: un tambor grave que se siente en el pecho; se rompe el silencio y la música entra y sube.
- **Ojos entre los árboles**, a 30-60 m, de a pares (hasta tres a la vez), naranjas y fijos en pantalla (no se confunden con las luciérnagas,
  que son amarillas). Aparecen detrás de un tronco, se abren de a poco, parpadean y se cierran. **Si los tenés en el centro de la vista más de
  un segundo y pico, se apagan** (no si los ves de reojo).
- **Algo se lleva una antorcha** (una sola vez, ya cerrada la noche): una de las prendidas a buen trecho, fuera de tu vista, titila y se apaga;
  se ve una brasa que se aleja corriendo por el monte con una risita; el aviso dice «Una antorcha se apagó sola» y cómo volver a prenderla (F).
- **Risitas que se acercan y se alejan**: secuencias de dos o tres, siempre desde el mismo rumbo (a veces hacia un duende de verdad).
- La música **sube de a poco** con la previa (según el miedo de esa noche) y de golpe cuando salen.
Las demás noches tienen una versión más tranquila (pocas ramas, un par de ojos de vez en cuando, el silencio y el golpe de salida); el jefe y
la final, un poco más; roja, eclipse, silenciosa y apagón, a su medida (la silenciosa casi no suena y no tiene golpe).

### 2. Sonido y música
Sonidos nuevos (todos sintetizados por código, `src/desafio-ambiente-sonidos.js`; **nadie los escuchó todavía**):
- **Rama que cruje** (`S.crujidoRama`): un quejido corto de madera que se dobla (pulsos irregulares que resuenan entre 700 y 1400 Hz), un chasquido
  seco y a veces un segundo más flojo, y la hojarasca donde cae. 1,5 s. De lejos queda el chasquido.
- **Grito del tero** (`S.teroGrita`): una serie de «ter-ó» ásperos y nasales (la primera sílaba corta y más aguda, la segunda larga y que cae), de
  cinco a ocho, que se aceleran un poco. Entre 1,6 y 2,7 s.
- **Mugido de la vaca** (`S.vacaMuge`): una «m» con la boca cerrada, un «uuu-ooo» que sube de 105 a 150 Hz y baja, con vibrato lento. 2,0 a 2,5 s.
- **Salen** (`S.salen`): un golpe grave (un seno que baja de 74 a 31 Hz, ruido pasabajos y un golpe de tierra) con el que se rompe el silencio.
- **Silencio raro** (`S.silencioRaro`, en el motor `callar`/`romperSilencio`): agacha toda la mezcla (80 %) hasta que salen.
Música (`desafio-musica.js`, todo por el mismo bus de siempre): `niebla` (acordes suspendidos, más oscura y apagada, latido amortiguado, una campana
lejana cada 9-19 s y un corno grave que se hunde en la bruma) y `lunallena` (quintas abiertas con una sexta fría, más abierta, latido pesado y lento
de los viejos, un racimo de senos suspendidos cada 11-20 s, los silbidos una octava abajo); sube de a poco con el miedo en la previa, se apaga en el
silencio raro y entra de golpe cuando salen (`llegaron`).
Los sonidos nuevos suenan **alejados como las risas de los duendes** (el aire se come los agudos, tardan lo que tarda el sonido en cruzar la
distancia, con su cola de reverb) y salen en los subtítulos con dirección («[ramas que crujen lejos · oeste]», «[un tero grita · norte]»,
«[una vaca muge · este]»). El nivel de cada uno está medido contra la risa de un duende (ver «Medido»).

### 3. Luz y clima
- **Niebla que avanza**: sube despacio (unos 85 s hasta pleno) desde que se anuncia la noche y se levanta de a poco al alba (~55 s). Es bruma de color:
  el cielo entero se cierra en un azul violáceo y la niebla de la escena lo sigue; las estrellas se apagan; con esa densidad pasa el 68 % de
  la luz a 25 m y el 11 % a 60 m (la de una noche común: casi todo a 100 m). Si el clima ya acorta la vista (`efectoClima`, que sólo se lee), la niebla no se suma entera.
- **Luna llena que alumbra el valle**: luz 2,3 veces más fuerte y más fría, la luna baja hasta unos 17-21 grados (sombras largas con el mapa de
  sombras de siempre), el cielo y el aire azules, la luna del cielo llena de verdad.
- **Sombras largas de las antorchas**: tu sombra y la de los duendes cerca de una antorcha prendida se estiran hacia el lado contrario (una sola
  malla instanciada, hasta 8 sombras; sólo se ven donde el suelo se ve: en el pozo de luz anaranjado de la antorcha y en lo claro).
- Sin luces nuevas (siguen siendo 4+1) y sin shaders a mitad de juego: lo nuevo que se dibuja (los puntos de los ojos y la brasa, y las sombras) está a
  la vista durante la carga para que sus programas se compilen ahí.

### 4. Animales que avisan
- **Teros** (tres puestos en los bajos mojados) y **vacas** (dos en el pastizal), repartidos por el valle; cuando un duende pasa cerca de uno
  (52 m el tero, 64 m la vaca; cada uno avisa como mucho una vez cada 30 y 48 s, y nunca dos avisos juntos), grita o muge. Son sonidos desde un
  lugar: no hay modelos de teros ni de vacas.
- **Los pájaros y los grillos de alrededor tuyo se callan** mientras haya un duende a menos de 60 m (y toda la noche en la silenciosa).

### 5. Pulir lo tosco
- **Cofre del alba**: las raíces seguían leyéndose como patas (nueve arcos parejos, finos y casi negros, a igual distancia). Ahora son ocho, desparejas,
  juntas en manojos, gruesas donde salen de abajo del cajón, medio enterradas y con la punta bajo tierra, más claras y con musgo.
  Capturas: `pruebas/salidas/duendes-3-8/ANTES-cofre-cerca.png` y `v38-duendes-cofre-cerca.png` (y las dos del cofre de lejos).
- **Lechuza** y **Rey Duende**: ya se habían rehecho en la 3.8.4 (la lechuza como un concón con plumas sueltas; el Rey con piel por huesos). Las miré a
  tamaño completo, de cerca y de lejos, y no hacía falta tocarlas (capturas más abajo). Si el usuario las sigue viendo toscas, que diga qué.

## Cómo se probó (y cómo probarlo a mano)
- `pruebas/verificar-4-8-ambiente.mjs`: reglas puras (qué noche es, perfiles, cronograma de una noche entera simulado con semilla fija, silencio,
  ojos, antorcha, risitas que se acercan o se alejan, pista de la tarde, niebla, luna, sombras, animales), los sonidos nuevos (duración, pico, nivel
  contra la risa, brillo, distintos entre sí, sin saturar), el motor con un audio de mentira (pocos nodos, retardo y volumen por la distancia, el
  silencio), la música (variantes, sube con el miedo, se apaga y vuelve, **ningún nodo por cuadro**) y el cableado con el juego.
- `pruebas/humo-4-8-ambiente.cjs` (Electron, con `-Visible` para las capturas): la primera noche entera, los ojos, la niebla, la luna llena, las sombras,
  los animales y el Rey. `HUMO_ESCENAS=primera,ojos,niebla,luna,sombras,fauna,pulido`; `HUMO_INDEX=` y `HUMO_ETIQUETA=` para el «antes».
- A mano, en `?debug=1`: `__hojarasca.desafio.ambiente.especialDePrueba = 'niebla'` (o `'lunallena'`) fuerza esa noche sin tocar la partida (las reglas
  de las noches nuevas las pone la otra rama); `__hojarasca.desafio.ambiente.clima` muestra la niebla y la luna.

## Qué hay que escuchar (lo único que no se pudo juzgar acá)
Ramas, tero, vaca, el golpe de salida, el silencio raro, las dos músicas nuevas y que la música suba con el miedo. Se miden niveles y se prueba que
suenen sin errores, pero **si suenan bien sólo se sabe escuchando**: sobre todo la vaca (la más difícil de hacer creíble con síntesis) y el tero.


## Medido
- **Sonidos** (40 semillas de cada uno): la rama dura 1,5 s (pico 0,9, RMS 0,039); el tero, de 1,6 a 2,7 s (RMS 0,144); la vaca, de 2,0 a 2,5 s (RMS 0,221).
  Todos con pico 0,9, sin NaN, sin continua y terminando sin cortes. Niveles de reproducción, medidos contra la risa de un duende (nivel 0,3 y RMS
  0,10, o sea 0,030): tero 0,22 (0,032), vaca 0,15 (0,033), rama 0,45 (de pico 0,4: el chasquido tiene mucho pico y poco RMS). Ni dos juntos saturan.
- **Gate**: `npm run verify:paralelo`: **271 pasos OK** (los 270 de antes y `verificar-4-8-ambiente.mjs`, 296 comprobaciones). El gate de corrido
  (`npm run verify`) al cerrar: ver el informe. Una prueba, `verificar-construccion-premium-rc6.mjs`, falló dos veces en el paralelo por tiempo
  (límite de 20 s con 14 procesos a la vez y otros Electron andando) y sola tarda lo mismo que en la versión anterior (6,3 s).
  Ajustes a pruebas existentes: ninguno (`verificar-relax-2.mjs` lee la línea de la luz de la luna en `cielo.js`: se la dejó como estaba y el aumento
  de la luna llena va en la línea de abajo). Sí se tocó `pruebas/visor-3-8-duendes.cjs` (el visor de capturas) para que no cuente como error las
  advertencias `toNonIndexed` de three, que ya salían en la 4.7.0 y lo cortaban al arrancar.
- **Partidas reales** (de a una, con `-Visible` las que sacan capturas): `humo-4-8-ambiente` (todas las escenas), `humo-3-0-asedio` y
  `humo-3-5-1-desafio` en verde; `humo-desafio-premium` falló una vez (los cuatro pasos de la nave nodriza) y pasó las dos veces siguientes con el
  mismo código (43 pasos); la versión anterior también pasó. Es de tiempo, pero queda dicho.
- **Rendimiento** (notebook Ryzen 7 7730U: sólo sirve para comparar antes/después; compartida con otros Electron, así que ±40 % de ruido entre corridas):
  - lo que corre en cada cuadro: **6,8 µs** por cuadro con 16 duendes en juego (microprueba de 5000 cuadros; no pide memoria: lo miran las pruebas de texto);
  - dibujos: `npm run diag:dibujo` en el Desafío de noche, **209 contra 209**; el dibujo de los ojos y el de las sombras sólo existen mientras haya algo
    que mostrar (+1 cada uno);
  - `medir-duendes` (media; 0, 16 y 24 duendes; tres corridas de cada versión): medianas de 9 a 13 ms antes y de 11 a 16 ms después en una sesión
    con ruido; dibujos 220/238/241 antes contra 222-224/238-240/238-241 después; **programas 89 contra 91** (los dos programas nuevos, los puntos de
    tamaño fijo y la sombra con textura, se compilan en la carga y no cambian durante la partida: «programas 91→91»). No se ve un costo, pero
    **falta medir en la 4600G** (`REPETIR=3 npm run medir:caminata` y `medir-duendes.cjs` con las dos versiones, alternadas).
- **Capturas** (a tamaño completo, en `pruebas/salidas/ambiente-4-8/` y `pruebas/salidas/duendes-3-8/`): `niebla-0-antes…` y `niebla-2-pleno`,
  `luna-0-antes…` y `luna-1-llena`, `ojos-*`, `sombras-1-de-costado`, `primera-*`, `ahora-rey-*` y el cofre antes (`ANTES-cofre-cerca.png`) y después.

## Lo que quedó sin hacer o sin ver
- **Escuchar** los sonidos y las músicas nuevas (arriba).
- Los **ojos** se ven (naranjas, de a pares, entre los troncos), pero chicos: a 60-70 m son dos puntos de 8-10 px. Si se quieren más grandes, `PX_OJO`
  en `desafio-ambiente-mundo.js`. Con el pasto alto del prado el primer plano tapa los que están lejos: sólo se ven los que tienen una línea sin troncos
  ni lomas.
- Las **sombras de las antorchas** sólo se notan donde el suelo se ve (sobre el pozo de luz anaranjado de la antorcha y en lo claro): con el pasto alto y la
  noche cerrada casi no se ven. Las sombras largas de la luna llena son las de siempre, más largas.
- La **niebla** y la **luna llena** todavía no existen en las reglas (las pone la rama de las noches): acá se probaron forzándolas con
  `ambiente.especialDePrueba`. Cuando se junten, `d.especial === 'niebla'` o `'lunallena'` las prende sin tocar nada más.
- **Algo que no es mío y llama la atención**: de noche sigue bajando un **ovni** con haz de luz (la nave de la oleada) en un juego de duendes. No lo toqué.
