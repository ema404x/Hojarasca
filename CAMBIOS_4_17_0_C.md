# Hojarasca 4.17.0 — parte C: el pulido de los actos I y II de la Historia

Rama `v4170-c` (sale de `main` = 4.16.0). Se integra como 4.17.0 junto con A (mecánica y noche de defensa del acto III) y B (guiones del acto III). Esta parte no toca los archivos de A ni de B; sus cambios en `main.js` son bloques chicos marcados con `4.17 C`.

## Lo que se hizo

### 1. Motor de cámara y de anclas (sirve a las 58 escenas)
- **La cámara dirigida no se mete adentro de nada** (`escenas-mundo.js`, `despejarCamara`): del foco (a lo que mira) hacia la cámara se camina de a 0,3 m con una bolita de 0,3 m contra las colisiones del juego (`col.resolver`: troncos, rocas, muros); en el primer choque la cámara se queda un poco antes (nunca a menos de 1,3 m del foco) y nunca baja del suelo (0,45 m; los planos a 5 m o más, 1,3 m: el pasto alto y los helechos tapaban la lente). Si el paso libre se achica la cámara se acerca de golpe; si se agranda, vuelve despacio. Para eso los planos llevan `foco` (`escenas.js`, `poseMirando` y `mezclarPoses`).
- **Un plano sobre el jugador deja la cámara detrás de donde mira** (`escenas.js`, `compilarPlano`): antes, con el espectador justo en el ancla (`a: 'jugador'`), el azimut era siempre 0 (la cámara al sur del mundo: del otro lado de un muro o del agua según para dónde mirabas).
- **Los lugares de la historia sirven de ancla**: `{ lugar: 'coihue' }`, `{ lugar: 'raiz-ramon' }`, `{ lugar: 'molino-viejo' }`… (`escenas-mundo.js`, `lugarDe`; `main.js` le pasa `puntos`). Antes sólo valían los de `T.lugares`, y las escenas del acto II miraban «22 pasos adelante» donde no había nada.
- **Colocación del jugador** (`src/historia-colocacion.js`, puro, con `COLOCACION_PULIDO`, 24 escenas): las escenas se disparan al entrar en un radio de 14 a 30 m de un lugar y se anclan al jugador, así que la cámara salía de cualquier parte del radio. Cada entrada dice a cuántos metros de un lugar o una persona y de qué lado queda parado el jugador, mirándolo; si el punto no está libre (agua, tronco, muro) prueba girando y acercando. Se junta con `COLOCACION_ESCENA` (que ya usa `historia-ui.js`: no hubo que tocar a A) y `main.js` la aplica en `colocarEnFoco`. La cámara se lleva al jugador en el acto (`camaraAlJugador`): el director toma de ella el punto de partida y hasta ahora seguía donde estabas antes de que te pusieran en tu lugar (también valía para las colocaciones de 4.16.0).
- **Fermín, Belisario y Tobías se arman al pedirlos una escena** (`gente-campo-mundo.js`, `armarYa`): antes sólo existían a menos de 220 m de su lugar, así que la minga o la veta los dejaban fuera de cuadro.
- **Invitados de la Historia** (`main.js`, `invitadoDeHistoria`): Tito, Sofía, Herminia, Rosa y Graciela no siempre están (los lotes de la aldea se pueblan de a poco; Graciela sólo existe en el capítulo 4 y las escenas del capítulo 7 la usan). Si una escena los pide y no hay nadie con esa clave, se arma una figura con la ficha de la aldea sólo mientras dura la escena. No se arman los que sólo se miran de pasada (Nélida): taparían la cámara.
- **Los duendes que pone una escena se van al terminar** (`despedirDuendesDeEscena`): las cinco siluetas de la guardia se quedaban «mirando» para siempre.

### 2. Props, interacciones, disparadores y lugares que faltaban
- `historia-objetos.js` + `OBJETOS_ACTO2`: **foto movida** y **llavecita** en el umbral del refugio, con las otras cosas que aparecen ahí (con su E: una nota), **diez cantos blancos** de la veta de la cantera (aparecen cuando la escena de Tobías los muestra; E para mirarlos), **tropa de mulas** (siete, atadas junto al puesto del paso y, después de acompañarla, en el mallín) y **el fogón de la Noche de la Leyenda** (círculo de piedras, leños y brasas, de noche). Todo con las geometrías y el material de siempre (`materialVegetal`, tipo 0 o 4): 0 programas de shader nuevos, 0 luces.
- Los props que las escenas ponen con `mundo:` se ven **durante la escena** (la ronda de ramitas y el canto blanco sólo aparecían al terminarla; la bolsa de Eusebio se ve, colgada bajo el alero, desde que se arregla la última tabla).
- El tocón del hacha, más alto (se perdía entre los lupinos); las huellas en la escarcha, más grandes, claras y seguidas en los primeros metros.
- **Disparadores nuevos**: `tablas-tito` (de día junto a la carpintería con D2 = talarlo; o E sobre Tito), `foto-sofia` (junto al estudio de fotos con la foto movida; o E sobre Sofía) y `mulas-belisario` (E sobre Belisario, ya contado lo de los del cerro). Decisión simple, sin hacer vecinos con E a quienes no lo son: son disparadores por lugar y hora y la escena trae al personaje (el vecino si ya vive ahí, un invitado si no).
- **Lugares nuevos para `llegar()` y las anclas** (`puntosDeHistoria` de `main.js` y `LUGARES_ACTO2`): `cantera`, `puesto-paso`, `puesto-alto`, `seccional`, `panaderia`, `carpinteria`, `casa-herminia`, `estudio-fotos`, `predio`, `molino-historia`, `mallin`, `muelle`, `rueda-molino` y `puerta-molino` (de ahí se ve girar la rueda).
- **Programa de profundidad de más (110 → 111 al ir de día al molino viejo o al faro)**: el diagnóstico nuevo `herramientas/diag-programa-historia.cjs` mostró que lo compilaba la sombra de los álamos de la aldea (`estructura:aldea-alamos`): una malla instanciada **sin** color por instancia y con color de vértice, que no cubría el precalentado de la 4.12.2/4.12.3. Con `VARIANTES=1` el mismo diagnóstico probó cuatro geometrías y mostró que la clave del programa pide el atributo `color` (sin él, otra clave). `precalentarSilueta` (`animales-piel.js`, la misma pasada de la carga de la 4.12.3, un solo dibujo) dibuja ahora además una instanciada así (`instanciadaDeArboles`). Medido en Media: **111 programas apenas cargado y 111 después de ir de día al molino viejo, al faro, a la plaza y a la estación; ningún programa compilado a mitad de juego (CULPABLES: [])**. O sea: el programa de más se compila en la carga (el 110 de base pasa a 111 al empezar) y no a mitad de juego. En las calidades sin sombras no hace nada (el programa de profundidad no existe). Ver `pruebas/verificar-4-17-0-pulido-c.mjs`.

### 3. Escena por escena (hojas de contacto «después» en `pruebas/salidas/pulido-4-17-0/hoja-despues-<id>.png`, seis cuadros cada una; las «antes» de las 19 primeras en `hoja-antes-<id>.png`)
Acto I:
- `trochita-boleto`: sin cambios (bien: Elsa en el andén; el techo de la estación queda oscuro en primer plano).
- `estacion-llegada`: **arreglada** (la cámara quedaba contra el muro del edificio): colocación a 8 m de la estación.
- `algo-cruza`: **arreglada y verificada**: el pillo cruzaba a 15 m y no se veía; ahora a 9 m (el duende corre en pantalla: estado «yendo» → «huyendo» a 14,7 → 22 m del jugador en la corrida anterior; en la nueva, a 9 m).
- `nota-eusebio`: bien (adentro, mirando la mesa); la cámara ahora queda detrás de donde mirás.
- `ronda-umbral`: **arreglada**: la ronda y el canto blanco no se veían durante la escena.
- `ramon-tranquera`, `almacen-ercilia`, `ese-no-josefina`, `bolsa-rosa`, `bolsa-josefina`: bien (colocación en las dos primeras).
- `bolsa-alero`: **arreglada**: los planos miraban el pasto a 1,1 m y después el muro; ahora a la bolsa, que se ve colgada bajo el alero.
- `bolsa-coihue`: colocación a 4,9 m del coihue por el lado del agua (la raíz queda 2,6 m adelante). Mejor, pero el árbol sigue sin lucirse.
- `hacha-tocon`: tocón más alto, colocación a 5 m, detalle sobre el filo y la hoja.
- `placa-herminia`: **arreglada**: Herminia no aparecía (no vivía en la aldea de la prueba); ahora viene de invitada.
- `mesa-visita-nicanor`, `mesa-visita-ramon`: **arregladas**: la cámara estaba contra el muro del refugio y no se veía a nadie; ahora se ve a Nicanor/Ramón adentro, junto a la mesa.
- `fermin-galpon`: **arreglada**: la cámara quedaba adentro del galpón; ahora sobre Fermín.
- `anden-graciela`: bien (colocación en el andén). `cabina-elsa`: **no se pudo ver en el tren** (no puede empezar arriba del tren; se vio con Elsa en el andén).
- `derrumbe-puertita`: **mejorada, sigue dudosa**: planos más altos y cerca, la puertita ahora se ve en las manos de Graciela; la ladera tiene arbustos que tapan.
- `te-graciela`: bien (colocación en la casa de té).
Acto II:
- `piedras-molino`: bien (ahora la mirada hacia la copa va al coihue de verdad).
- `zaino-ramon`: bien (Ramón en su puesto, oscuro adentro).
- `tito-coihue`: **mejorada**: colocación a 6 m del coihue y plano más alto y cerca; entre los helechos del primer cuadro Tito y Josefina todavía salen chicos.
- `coihue-en-pie`, `coihue-talado`, `trigo-abuelo`, `truchas-nicanor`: bien (`trigo-abuelo`: Josefina medio detrás de un tronco en la prueba, donde la dejó el humo).
- `tobias-pirca`: **arreglada la segunda mitad** (se armaba delante de la cantera: ahora en el coihue de verdad, con la pirca a la vista). La primera sigue viendo a Tobías de espaldas (pica de espaldas al camino).
- `rueda-gira`: **arreglada**: con el molino armado se ve la rueda girando (colocación junto a la rueda, `rueda-molino`).
- `luces-lago-nicanor`: más alta (la cámara quedaba en los lupinos).
- `el-que-vuela`: **no verificado en el kayak** (el humo no sube al kayak); a pie en la orilla del faro de noche es casi negro. Los duendes existen (el «volador» y las lucecitas corren a 27 a 50 m).
- `guardia-molino`: sigue oscura (es de noche a propósito; se ven las siluetas con los ojos amarillos); ahora mira al coihue de verdad y los duendes se van al terminar.
- `huellas-escarcha`: anclas reales (de la raíz del coihue a la raíz de Ramón), huellas más grandes; **las huellas siguen sin leerse a ojo en el cuadro de detalle** (lo que se ve son las piedras de la raíz).
- `ramon-raiz`: **arreglada**: Ramón se ve (antes, muy chico y lejos): plano largo de 34° sobre la raíz de verdad.
- `perdidas-devueltas`: bien (Nélida ya no se interpone). `masa-crece`: de día bien; la noche en la panadería, casi negra (por diseño).
- `foto-sofia`: Sofía aparece de invitada; el detalle sube la cámara (el pasto tapaba la foto).
- `primera-molienda`, `molienda-fletes`: Graciela se ve (invitada: el capítulo 7 la usa y sólo existía en el 4); piso de cámara contra el pasto.
- `molienda-fiado`, `molienda-partir`, `minga-aldea`, `fermin-mulas`, `galpon-ronda`, `libreta-fiado`, `cuaderno-abuelo`, `los-del-cerro`, `secreto-ramon`, `herminia-noventa`: bien (`molienda-partir` y `galpon-ronda` muy lindas; `minga-aldea` con Ramón y Fermín armados desde lejos).
- `cuaderno-1`, `cuaderno-2`, `cuaderno-3`: se leen en la mesa del refugio (el humo ahora pone al jugador ahí).
- `fogon-leyenda`: ahora tiene su fogón (piedras, leños y brasas); de noche, oscuro pero se lee.
- `pluma-umbral`: bien (umbral de noche con estrellas; la pluma se ve).
- `veta-vuelve`: la hora pasó de 22:24 a 20:12 (a las 22 era un cuadro negro).
- `mulas-belisario`: las siete mulas se ven en el mallín.
- `tablas-tito`: Tito viene de invitado.

## Pruebas
- `pruebas/verificar-4-17-0-pulido-c.mjs` (en el gate): las 58 escenas (cámara con distancia mínima a quien filma, anclas que existen, personajes declarados, números válidos), la colocación (resolvedor, validación, libre), los props y sus E, los disparadores nuevos, los lugares nuevos, la cámara que no se mete en nada y su piso (con un mundo de mentira), el programa de profundidad, y 22 mutaciones (se rompe a propósito una garantía y la prueba tiene que fallar: se atrapan las 22).
- Ajustadas a propósito: `verificar-4-16-0-historia-a` (35 escenas con disparador; las de B sin disparador son sólo las tres del cuaderno), `verificar-4-15-0-historia` (un disparador puede valer en varios capítulos) y `verificar-4-16-0-escenas-acto2` (los puntos de la historia valen como lugares).
- Partida real: `pruebas/humo-4-17-0-pulido.cjs` (sección V: las 58 escenas con seis cuadros y su hoja de contacto, por la colocación y el disparo del juego; sección P: los props con su E y las tres escenas nuevas) y `pruebas/humo-4-17-0-pulido-props.cjs`; herramienta `herramientas/diag-programa-historia.cjs`.

## Lo que sigue mal o no se vio
- Escenas nocturnas (`el-que-vuela`, `guardia-molino`, `masa-crece` de noche, `veta-vuelve`): oscuras; el motor no tiene luz de relleno y no se pueden sumar luces. Sólo se movió la hora de `veta-vuelve`.
- `el-que-vuela` no se vio en el kayak ni el velero (de donde sale de verdad); `cabina-elsa` tampoco arriba del tren.
- El humo juega las escenas con la colocación y el disparo del juego, pero **forzando el disparo** (no esperando que el disparador por lugar y hora las lance); los disparadores se prueban por separado, en Node y en la sección P.
- Tobías de espaldas en la primera mitad de `tobias-pirca`, las huellas en el detalle de `huellas-escarcha`, el pasto en `derrumbe-puertita` y los helechos en `tito-coihue` quedan como límites.
- No se midieron fps (la ventana se corrió en la PC con otros agentes trabajando al mismo tiempo). El diagnóstico de programas se corrió sólo en Media; Baja y Mínima (sin sombras) no se probaron en placa.
- El fogón de la Noche de la Leyenda y las huellas de la escarcha se agregaron y se miraron, pero **no se los reconoce a ojo en las hojas** (el fogón queda fuera de cuadro o tapado; las huellas, escondidas entre las piedras de la raíz): quedan sin verificar.
- La foto movida y la llavecita quedaron en el umbral (sobre la mesa, el tocadiscos le ganaba la E: un objetivo que mirás le gana a los objetos de historia en `interacciones.js`).

## Para la junta con A y B
- Archivos nuevos: `src/historia-colocacion.js`, `pruebas/verificar-4-17-0-pulido-c.mjs` (ya sumada a `verify` en `package.json`: **322 pasos**), `pruebas/humo-4-17-0-pulido.cjs`, `pruebas/humo-4-17-0-pulido-props.cjs`, `herramientas/diag-programa-historia.cjs`.
- Archivos de A tocados (sólo bloques chicos): `src/main.js` (todo marcado `4.17 C`: imports de `historia-colocacion.js`, de `COLOCACION_ESCENA`, de `DEF_GRACIELA`, `POBLADORES_ALDEA`/`VECINOS_ALDEA` y `CANTERA`/`PUESTO_PASO`; `puntosDeHistoria`; `invitadoDeHistoria`, `despedirDuendesDeEscena`, `colocarEnFoco`, `camaraAlJugador`; el contexto de `crearEscenasMundo` suma `puntos` y `armarYa` y `alTerminar` llama a las dos limpiezas; el gancho `__colocarEscena`) y `src/historia-disparadores.js` (el import y el `...COLOCACION_PULIDO` de `COLOCACION_ESCENA`, la visibilidad de la ronda, la bolsa y el canto, y el hacha en `COLOCACION_ESCENA`). Si A suma `DISPARADORES_ACTO3` en el mismo bloque de imports de `historia-disparadores.js`, el choque es de líneas vecinas.
- Datos de B (acto II, pero ya hechos): `historia-escenas-acto1.js`, `-acto2-c5.js`, `-c6.js`, `-c7.js` y `-c8.js` cambian sólo planos, distancias y anclas (`{ lugar: 'coihue' }` en vez de `FRENTE(24, -6)`), una hora (`veta-vuelve`) y los pasos de `tobias-pirca` (la segunda mitad en el coihue). Sin diálogos, efectos ni ids nuevos.
- Del acto III: las escenas de B que usen `{ lugar: ... }` pueden usar también los puntos de la historia; las que necesiten a alguien que no vive todavía en la aldea pueden sumar su clave a `INVITABLES_HIST` de `main.js`.
- Qué no hay que sacar: `camaraAlJugador` (sin ella la colocación arranca la escena desde donde estabas) y el `foco` de las poses (`escenas.js`).
