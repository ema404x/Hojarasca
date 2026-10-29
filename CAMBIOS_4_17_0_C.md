# Hojarasca 4.17.0 — parte C: el pulido de los actos I y II de la Historia

Rama `v4170-c` (sale de `main` = 4.16.0). Se integra como 4.17.0 junto con A (mecánica y noche de defensa del acto III) y B (guiones del acto III). Esta parte no toca los archivos de A ni de B.

(Borrador en construcción: se completa al terminar cada tramo.)

## Lo que se hizo

### 1. Motor de cámara y de anclas (sirve a las 58 escenas)
- **La cámara dirigida no se mete adentro de nada** (`escenas-mundo.js`, `despejarCamara`): del foco (lo que mira) hacia la cámara se camina de a 0,3 m con una bolita de 0,3 m contra las colisiones del juego (`col.resolver`: troncos, rocas, muros); en el primer choque la cámara se queda un poco antes (nunca a menos de 1,3 m del foco) y nunca baja del suelo. Si el paso libre se achica, la cámara se acerca de golpe (para no ver el interior del tronco); si se agranda, vuelve despacio. Para eso los planos llevan `foco` (`escenas.js`, `poseMirando` y `mezclarPoses`).
- **Un plano sobre el jugador deja la cámara detrás de donde mira** (`escenas.js`, `compilarPlano`): antes, si el espectador estaba justo en el ancla (`a: 'jugador'`), el azimut era siempre 0 (la cámara al sur del mundo: del otro lado de un muro o del agua según para dónde mirabas).
- **Los lugares de la historia sirven de ancla**: `{ lugar: 'coihue' }`, `{ lugar: 'raiz-ramon' }`, `{ lugar: 'molino-viejo' }`… (`escenas-mundo.js`, `lugarDe`, recibe `puntos` desde `main.js`). Antes sólo valían los de `T.lugares`.
- **Colocación del jugador** (`src/historia-colocacion.js`, puro, con `COLOCACION_PULIDO`): casi todas las escenas se disparan al entrar en un radio de 14 a 30 m de un lugar y se anclan al jugador, así que la cámara salía de cualquier parte del radio. Cada entrada dice a cuántos metros de un lugar o una persona y de qué lado queda parado el jugador, mirándolo; si el punto no está libre (agua, tronco, muro) prueba girando y acercando. Se junta con `COLOCACION_ESCENA` (que ya usa `historia-ui.js`) y `main.js` la aplica en `colocarEnFoco`; la cámara se lleva al jugador en el acto (`camaraAlJugador`), porque el director toma de ella el punto de partida y hasta ahora seguía donde estabas antes.
- **Fermín, Belisario y Tobías se arman al pedirlos una escena** (`gente-campo-mundo.js`, `armarYa`): antes sólo existían si estabas a menos de 220 m de su lugar, así que la minga o la veta los dejaban fuera de cuadro.
- **Invitados de la Historia** (`main.js`, `invitadoDeHistoria`): Tito, Sofía, Herminia, Rosa, etc. no siempre viven ya en la aldea (llegan de a poco o duermen lejos); si una escena los pide y no hay nadie con esa clave, se arma una figura con la ficha de la aldea sólo mientras dura la escena (y se quita al terminar). Si ya viven ahí, es la de siempre.

### 2. Props y escenas que faltaban
- `historia-objetos.js` + `OBJETOS_ACTO2`: **foto movida** y **llavecita** sobre la mesa del refugio (con su E: una nota), **diez cantos blancos** de la veta de la cantera (aparecen cuando la escena de Tobías los muestra; E para mirarlos), **tropa de mulas** (siete, atadas junto al puesto del paso; después de acompañarla, en el mallín). Todo con geometrías y el material de siempre (`materialVegetal`, tipo 0 o 4): 0 programas de shader nuevos, 0 luces.
- Los props que las escenas ponen con `mundo:` se ven **durante la escena** (la ronda de ramitas y el canto blanco sólo aparecían al terminarla).
- El tocón del hacha, más alto (se perdía entre los lupinos).
- Disparadores nuevos: `tablas-tito` (carpintería, de día, con D2 = talarlo; o E sobre Tito), `foto-sofia` (estudio de fotos con la foto movida; o E sobre Sofía), `mulas-belisario` (E sobre Belisario, ya contado lo de los del cerro).
- Lugares nuevos para `llegar()` y las anclas: `cantera`, `puesto-paso`, `puesto-alto`, `seccional`, `panaderia`, `carpinteria`, `casa-herminia`, `estudio-fotos`, `predio`, `molino-historia`, `mallin`, `muelle`, `rueda-molino`, `puerta-molino`.

## Pruebas
- `pruebas/verificar-4-17-0-pulido-c.mjs` (en el gate): las 58 escenas (cámara con distancia mínima a quien filma, anclas que existen, personajes declarados), la colocación, los props y sus E, los disparadores nuevos, la cámara que no se mete en nada (con un mundo de mentira) y 20 mutaciones.
- `pruebas/humo-4-17-0-pulido.cjs` (partida real, hojas de contacto de seis cuadros por escena) y `pruebas/humo-4-17-0-pulido-props.cjs` (props y disparadores nuevos).
- Ajustadas a propósito: `verificar-4-16-0-historia-a` (35 escenas con disparador; las de B sin disparador son sólo las tres del cuaderno), `verificar-4-15-0-historia` (un disparador puede valer en varios capítulos) y `verificar-4-16-0-escenas-acto2` (los puntos de la historia valen como lugares).
