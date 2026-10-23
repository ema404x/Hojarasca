# 4.8 · Noches distintas · los ataques y los duendes nuevos (rama `v48-ataques`)

Tanda 1 de las mejoras del Desafío (`PLAN_DESAFIO_MEJORAS.md`): lo que ataca lo repetitivo. Esta rama trae **por dónde
entran los duendes**, **las tácticas en grupo** y **dos duendes nuevos** (el curandero y el enjambre). Las noches nuevas
y los giros son de la rama `v48-noches`; el sonido, la luz y el ambiente, de `v48-ambiente`. No sube la versión.

## Lo que encontré al revisar el estado de la 4.7.0

Simulé ocho noches seguidas (`H.desafio.actualizar(0.05, …)`) con una partida con código:

- **Todos salían de un solo punto**, el de la nave, a 72-98 m **de donde estabas parado** (no de la base), y con código
  de partida **siempre del mismo lado del valle** (`rumboNave` ± 45°): las ocho noches salieron entre -95° y -18° desde
  el jugador, una cuña de ~77°. Sin código, uno al azar, pero siempre uno solo.
- Después van **derecho a vos** (`rumboObj = atan2(dx, dz)` hacia el jugador) y lo que les cierra el paso lo rompen de a
  uno, de frente. No hay grupos, ni reparto de tareas, ni rodeo.
- Lo que **ya existía y no toqué ni dupliqué**: los que cavan (excavador, noche 7), saltan (saltador) o vuelan (lechuza,
  noche 8) siguen sus reglas; el acecho (los pillos y saltarines se esconden si los mirás); el asedio a los refugios; el
  robo; los rescates de vecinos y la trochita varada (esas noches el blanco está en otro lado: ahí el lado no vale); las
  noches especiales; el ladrido del perro cuando ya están cerca.
- Lo que se siente repetitivo: el lado (siempre el mismo), el momento (todos juntos) y el modo (todos de frente y a lo
  mismo). Las tres cosas están atacadas acá.
- Aparte, dos hallazgos que no son de esta tanda: la **nave** (el platillo con su haz verde) sigue dibujándose donde bajan,
  aunque los invasores son duendes desde la 3.8.0; y `humo-invasores` falla igual en la 4.7.0 (4 comprobaciones de ojos y
  de voces de la ventana oculta: las mismas antes y después).

## 1. Los lados de entrada: el río, el monte o el camino

`src/desafio-lados.js` (puro) + el enganche en `src/desafio-ataques.js`.

- **El plan de la base.** Para la base de la partida (la del mapa: el refugio o una de las doce posibles) se buscan, una
  vez, tres lados sobre el terreno real: de cada uno, un rumbo y de 3 a 12 puntos de entrada en tierra, planos
  (pendiente ≤ 0,32), dentro del valle, a ≥ 22 m de un lugar del valle y **sin lago entre el punto y la base**. Sólo depende
  del terreno y de la base: no cambia con lo que construyas ni con la noche (probado en las 13 bases posibles).
- **El río no queda cerca de todas las bases** (a más de 120 m de casi todas, a más de 330 de cuatro): entonces «el río»
  es el rumbo hacia donde corre el agua, con la entrada sobre la orilla si hay una a menos de 170 m y, si no, en el valle
  mirando hacia el río. Una base sin río a 330 m juega con dos lados (hoy, 2 de 13). Los tres rumbos de una base quedan
  separados por más de 50°.
- **El lado de cada noche** sale de la semilla y del número de noche (`ladoDeLaNoche`): mismo código, misma secuencia;
  **nunca el mismo lado más de dos noches seguidas** (el de anoche pesa 0,35 y el de dos seguidas, 0). Sin código, una
  secuencia fija (reproducible). Se decide **al caer la tarde**, junto con la noche especial (`decidirNoche`), una hora
  antes de `HORA_ATAQUE`; y si la partida se guardó a la tarde, queda ese.
- **Contrato** (lo lee el agente de ambiente): `D().ladoNoche = { id: 'rio'|'monte'|'camino', x, z, rumbo, noche, otro }`.
  `rumbo` = `atan2(x - base.x, z - base.z)` (el de siempre del juego); `noche` = el número de la noche (`oleadas + 1` al
  decidirse); `otro` = el otro lado, para la distracción (`{ id, x, z, rumbo }` o `null`); `anulado: true` si esa noche el
  blanco está en otro lado (rescate, trochita, asedio). Se guarda en la partida (`sanearDesafio`). `H.desafio.ataques.lado`
  lo devuelve.
- **Dónde bajan:** en el punto del lado (`puntoDeAterrizaje`); si estás a más de 220 m de la base, por el rumbo del lado a
  84 m de vos (como antes, alrededor tuyo). El aviso dice «¡Salen duendes desde el monte!» en vez del rumbo.
- **El perro:** la última hora de la tarde (de 19:45 a 20:30) se queda mirando hacia el punto del lado, **14 s de cada 45**
  (si no, quedaría duro una hora): sale por el mismo gancho `alertaPerro` que usa el perro desde la 2.0. El gruñido y las
  huellas son del agente de ambiente.

## 2. Las tácticas en grupo (`src/desafio-tacticas.js`)

Dos reglas, legibles y que escalan con la noche. **No agregan duendes**: sólo cambian por dónde y cuándo vienen.

- **Distracción** (desde la noche 3, con 6 o más duendes, nunca con el jefe ni en la noche final, la silenciosa ni el
  apagón): del 30% de los pillos, saltarines y honderos (de 2 a 6) salen por **otro lado**, a pie y con una nube de
  polvo y su risita, y se **ensañan con la defensa más cercana a su entrada** (a menos de 70 m de ahí y a más de 20 de vos;
  si no hay, esperan en un punto a 35 m de la base). Hacen **bulla de a uno** cada 2,2 a 3,8 s. El **grupo principal sale
  después**: espera de 5 a 9 s tras el último señuelo (más cuanto más noche). Se les termina el juego a los 20-40 s, si te les
  acercás a menos de 16 m o si su defensa cae, y entonces van por vos. El aviso (3,8 s después del primero): «Se oye bulla
  del lado del río. Unos hacen ruido mientras los demás entran por el monte. No te la creas».
- **Rodeo** (desde la noche 3): cuando un duende se topa con una defensa, hay otro rompiéndola ya y tiene dos o más
  compañeros a menos de 5 m, **da la vuelta por un costado** 3,2 s (hasta dos veces, y la segunda cambia de lado) en vez de
  amontonarse de frente. Los pesados, los de tiro y el jefe van de frente.
- En la partida, medido (humo): noche 3, 2 señuelos por el otro lado y el grupo principal bajando 11,7 s después; noche 8,
  2 señuelos por el río, el resto por el monte.

## 3. El curandero (`'curandero'`)

`TIPOS_ALIEN.curandero`: vida 34 (el pillo, 40), velocidad 2,9, daño 3, 70 cm, 1-2 semillas doradas. Modelo nuevo en
`src/duendes-modelo-nuevos.js` (flaco y pálido, gorro de hongo claro con nueve hongos chicos, capa de hojas verde hierba,
bufanda y una calabaza de hierbas con la boca verde que brilla; de viejo, más oscuro). Voz y risita: las del pillo (el
banco no conoce tipos nuevos y cae en la del pillo).

- **Se queda atrás:** 7 m detrás de los cuatro compañeros que tiene más cerca, del lado opuesto a vos (no detrás de todo
  el grupo: puede estar partido en dos lados). Si te le acercás a menos de 7,5 m **huye** (a 1,35 veces su velocidad).
- **Cura** cada 3,4 s a hasta 3 heridos a 10 m, los más lastimados primero, 22% de su vida máxima, **sin pasar del 85%** (los
  sostiene, no los deja sanos), hasta **8 curas por vida**. Efecto: un destello verde claro en cada curado y otro en él, y su
  risita. No cura a otros curanderos ni al jefe.
- **Solo**, sin nadie a quien curar (ni más que bajen), corre 12 s y **se rinde y se queda quieto**: así la noche puede
  terminar.
- Desde la noche **4**; 2 desde la 12, 3 desde la 20; uno cada cinco comunes como mucho; **nunca con el jefe**. Ocupa el
  lugar de un pillo (el tamaño de cada oleada es **el de la 4.7.0**, medido: ver la prueba).
- El agente de las noches lo usa con `Object.hasOwn(TIPOS_ALIEN, 'curandero')`: existe.

## 4. El enjambre (`'enjambre'`)

`TIPOS_ALIEN.enjambre`: vida 7, daño 1,1, 30 cm, no suelta semillas. Cabezones, de gorro de bellota, **ojos de ámbar** (en
la noche se distinguen de los ojos verdes). Se mueven como una nube (el rumbo les zumba ±0,45 rad, cada uno a su ritmo) y
salen **en montón** (una mancha de 2 m alrededor de la nave).

- Una noche de cada tres desde la **6** (6, 9, 12, 18, 21...; nunca con el jefe): 8 duendecitos, 9 en la 9, 11 en la 12, 12 en
  la 18 en normal (tranquila 5 a 7; implacable 11 a 14, tope **14**).
- **Cupo aparte:** el tope de 24 invasores es para los comunes; el enjambre tiene el suyo (14) y no le quita lugar a nadie
  (con 24 comunes y 12 del enjambre andan 36).
- **Costo:** un modelo instanciado en 2 dibujos (travieso y viejo), de 1144 triángulos de lejos por duende (con un detalle
  del 55% del de los demás: más abajo no baja, es el piso de segmentos). Ver las mediciones.
- Las noches especiales no lo multiplican ni lo reemplazan (como al jefe); la silenciosa, que es de puros tiradores, no lo trae.
- En la corrida sin fin (desde la 20) no aparece (se arma desde la oleada 19, que no es noche de enjambre): queda para otra vez.

## La composición (`composicionOleada`)

El curandero sale del cupo de los rastreadores (con piso de uno, y si no alcanza, de tiradores y saltadores hasta uno).
El enjambre va al final de la lista, antes del jefe, así los refuerzos y las especiales, que recortan la cola, los dejan
afuera antes. Con la dificultad: el enjambre escala (`cantidad`), el curandero no.

## Cambios en lo que ya estaba (mínimos, en bloques `// 4.8 ataques:`)

- `src/desafio.js`: crea `ataques` y lo engancha en `decidirNoche`, `puntoDeAterrizaje`, `empezarOleada`, `bajarAlien`
  (la marca de señuelo, el cupo, la salida y el reciclado con `ataques.limpiar`), la cola de la nave, el cuadro, el rumbo
  de cada duende, el atasco (el rodeo) y `alertaPerro`. `bajarAlien(tipo)` conserva su firma (varias pruebas la leen).
- `src/desafio-reglas.js`: los dos tipos, la composición, `aplicarEspecial` (el enjambre va aparte) y `ladoNoche` en
  `sanearDesafio`. `src/desafio-duendes.js`: registra los modelos nuevos y arma el enjambre con menos detalle.
  `src/desafio-duendes-reglas.js`: sus nombres de duende. `src/desafio-supervivencia.js`: el orden de la lista.
  `src/guia.js`: tres ítems.
- No toqué `main.js`, `guardado.js`, `ESPECIALES`/`nocheEspecial`, `desafio-sonidos.js`, `desafio-musica.js`,
  `desafio-efectos.js` ni `duendes-modelo.js`.
- **Pruebas viejas ajustadas a propósito** (dicho acá): `verificar-invasores` (de ocho a diez tipos y el techo de 18 sin
  contar el enjambre), `verificar-modo-desafio` y `verificar-2-3` (ídem: el enjambre tiene su cupo), `verificar-3-0-supervivencia`
  (el tope de 24 sin el enjambre) y `verificar-3-8-duendes` (carga también los modelos nuevos y mira sus reglas de código).
  Ninguna se aflojó: se les saca el enjambre de la cuenta.

## Pruebas

- **`pruebas/verificar-4-8-ataques.mjs`** (en el gate; 8895 comprobaciones): el plan de lados en las **13 bases** sobre el
  terreno real (tierra, plano, sin lago, rumbos separados, sin agua, lejos de los lugares), la secuencia (40 semillas × 60
  noches: reproducible, sin tres seguidas, los tres lados), lo que se guarda, las tácticas (reglas puras y lo que hace el
  juego con un mundo de mentira), el curandero (cura, techo, radio, tope de objetivos, se cansa, huye, se queda atrás, se
  rinde solo), el enjambre (cantidad, cupo, mancha, zumbido), **el tamaño de cada oleada contra el de la 4.7.0** (tabla
  medida en `main`), el reciclado (todo campo que agrega `desafio-ataques.js` se limpia) y el enganche en el código.
- **`herramientas/mutar-4-8-ataques.cjs`:** rompe a propósito 49 reglas clave una por una (por ejemplo: permitir tres
  seguidas, quitar el techo de la cura, que el enjambre cuente para el cupo, no limpiar un campo al reciclar, no decidir el
  lado a la tarde) y confirma que la prueba falla. **Las 49 caen.** La primera vez no caían tres, y se arreglaron: la
  prueba aceptaba el total «más 2» (no atrapaba que el curandero no ocupara un lugar), el cupo no se probaba con el
  enjambre ya adentro y una mutación era equivalente (con el jefe no hay ni curandero ni enjambre).
- **`pruebas/humo-4-8-ataques.cjs`** (partida real, 77 comprobaciones): nueve noches con una semilla conocida (la secuencia
  es la de las reglas puras, los tres lados, señuelos desde la 3, el grupo principal 6-14 s después, curandero desde la 4,
  ni curandero ni enjambre con el jefe), el perro mirando a la tarde, el lado en la partida guardada, un curandero con su
  grupo (cura, techo, límite, se queda atrás, huye), 12 del enjambre con 24 comunes (36 juntos) y las capturas.

## Rendimiento (la notebook, Ryzen 7 7730U, calidad media; **los ms no son los de la 4600G**: sólo antes y después)

`herramientas/medir-duendes.cjs` (ahora con `EXTRA=curandero:1,enjambre:12`), 300 cuadros con gl.finish, fortín de 20 obras,
tres vueltas alternadas A (4.7.0) / B (esta rama). El tope de comunes es 24, así que el caso nuevo es 23 + 1 curandero
(24 comunes) + 12 del enjambre = 36.

| caso | mediana ms | p95 ms | dibujos | miles de triángulos | `desafio` ms |
|---|---|---|---|---|---|
| 4.7.0, 24 duendes | 10,1 · 10,7 · 10,8 | 12,8 · 13,2 · 13,2 | 254 · 256 · 238 | 731 · 731 · 729 | 1,06 · 1,01 · 0,99 |
| esta rama, 24 duendes | 10,4 · 11,0 · 10,4 | 15,2 · 12,8 · 14,9 | 242 · 245 · 237 | 733 · 737 · 727 | 0,98 · 1,03 · 0,96 |
| esta rama, 24 + curandero + 12 del enjambre | 10,2 · 10,9 · 11,3 | 12,9 · 13,0 · 14,4 | 257 · 242 · 257 | 752 · 746 · 748 | 1,41 · 1,12 · 1,23 |

Los 36 cuestan **~+0,2 ms de mediana, ~+0,2 ms de lógica (`desafio`), +18 mil triángulos (+2,5%) y 3 dibujos más** (el
curandero 1 y el enjambre 2: instanciados), contra la oscilación de ±10 dibujos que tiene la tabla de una vuelta a otra (la
vegetación). Sin los nuevos, la rama es igual a la 4.7.0. Ningún programa de shaders nuevo (89 → 89). Una primera tanda
medida con la PC cargada (otros agentes) daba medianas de 13 a 31 ms: se descartó; la de arriba salió con la PC quieta.
**Falta medir en la 4600G** (`npm run medir:caminata` y `herramientas/medir-duendes.cjs` con `EXTRA`), sobre todo la noche
12 (11 del enjambre) y la noche final.

## Capturas (`pruebas/salidas/ataques-48/`, con `-Visible`)

Los modelos: `modelos-de-frente`, `modelos-cerca-curandero`, `modelos-cerca-enjambre`, `modelos-de-costado` y
`modelos-viejos-al-anochecer`. La entrada por cada lado: `entrada-rio-aterrizaje`, `entrada-monte-aterrizaje`,
`entrada-camino-aterrizaje` (a 21 m, cuando baja el grupo). **Lo que no se ve bien:** en el monte y en el río el bosque
tapa casi todo (se ve el haz de la nave y los duendes cayendo, chiquitos); el camino es lo más claro. No hay captura de los
señuelos en su lado (se verificó con números: dónde salen y a cuánto del punto).

## Lo que no verifiqué / lo que queda

- **Sonido:** el curandero y el enjambre usan la voz y la risita del pillo (el banco de voces cae en el pillo con un tipo
  que no conoce); nadie escuchó la bulla de los señuelos ni el efecto del curandero. Es del agente de ambiente.
- **Inglés:** los textos nuevos (el aviso de la bulla, los tres ítems de la guía) están sólo en castellano; las fichas del
  bestiario del curandero y del enjambre **no las agregué** (`verificar-3-8-textos` exige que cada ficha esté traducida y la
  traducción se hace al final).
- **La 4600G:** sin medir (ver arriba). **A mano, con el teclado:** no jugué una noche entera con curandero y enjambre; sólo
  partidas de la prueba (con el jugador invulnerable). El equilibrio (12 duendecitos pegando a la vez, cuántos curas da el
  curandero) está por números, no por sensación.
- **Anotado para después:** la corrida sin fin no trae enjambre; la bestiario/«estudiar a cada tipo» es de la tanda 3; el
  curandero no se ve en el mapa ni tiene aviso propio; la nave (el platillo) sigue ahí.
