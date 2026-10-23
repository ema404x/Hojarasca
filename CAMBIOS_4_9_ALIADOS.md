# 4.9 aliados — «La aldea en la noche» (tanda 2 del Desafío, parte de los aliados)

Rama `v49-aliados` (sale de la 4.8.0 integrada). No sube la versión. Lo de esta parte: los **vecinos que ayudan en las noches grandes**,
los **puestos** de los aliados y la **campana de alarma**. Lo de defensas (lo roto a la vista, pasadizo, trampa de miel, farol de mano,
pala de brasas) y lo de los días (pedidos, pronóstico, preparar la noche) lo hacen los otros dos agentes.

## Lo que ya existía (no se duplicó)
- **Aliados**: el perro (avisa y muerde, `desafio-aliados.js`), **Don Ramón** (`ramon`, arregla las obras dañadas) y **Josefina** (`ema`, flechas
  desde la base). Llegan solos al amanecer cuando aguantaste `COMPANEROS[clave].llega.noches` noches y tenés `llega.defensas` defensas
  (`desafio-reglas.js`); los vecinos de gente.js se mudan a la base y se les cambia la rutina.
- **Órdenes** (`desafio-ordenes.js`, 1.11): mirándolos, E rota entre «arreglá lo roto / quedate en la base», «vení conmigo» y «cuidá el portón»;
  se guarda en `D().ordenes`. La E y el aviso salen de la tabla `src/interacciones.js` (entrada `vecino`: `ordenarCompanero`).
- **Campana de alarma**: la pieza `campana` del taller (`construccion.js`, `defensa: { tipo: 'campana', radio: 30 }`) ya existía y **suena sola**
  cuando un duende se acerca a 30 m (`desafio-defensas.js`). No se hizo una pieza nueva repetida: se le sumó el toque a mano.
- **Noches grandes**: `esNocheGrande` (`desafio-duendes-reglas.js`): la del jefe, las especiales y desde la 12 (en el sin fin, desde la 6).
- Los modelos y rutinas de los vecinos son los de la aldea (`aldea.js`: fichas de `VECINOS_ALDEA` y `POBLADORES_ALDEA`; `gente.js`:
  `agregarPoblador`, `armarPobladorDeAPoco`). La trochita (`trochita.js`) ya da vueltas por el valle en el Desafío (2303 m de vía a 7 m/s: unos 5 min y medio por vuelta, sin contar las paradas).

## Qué trae
**Cuatro vecinos** que se suman en las noches grandes según su **nivel de ayuda** (0 no viene, 1 ayuda, 2 ayuda más fuerte; tres números
por vecino, todo en `desafio-vecinos.js`). Vienen al caer la tarde (una hora antes del ataque), se van con la primera luz. Cada nivel queda
fijo toda la noche.

| Vecino | Qué hace | Nivel 1 | Nivel 2 |
|---|---|---|---|
| **Anselmo** (herrero) | arregla las defensas rotas con el martillo, yendo de una a otra (sigue con la que empezó hasta dejarla entera; no va a la que ya arregla Don Ramón) | 9 de vida por segundo (Ramón: 7), radio 16 m alrededor de su puesto, golpe cada 0,6 s | 15 por segundo, radio 26 m, golpe cada 0,4 s |
| **Herminia** (la abuela) | prende fogones y faroles alrededor de la base; los **viejos oscuros no se acercan** a menos de N m de uno prendido (bordean el círculo y, si ya estaban adentro, salen); a los traviesos no les importa | 2 fuegos, fogón a 9 m (el farol, 60%: 5,4 m), 4 s por fuego | 4 fuegos, fogón a 13 m (farol 7,8 m), 2 s por fuego |
| **Martín** (maquinista) | toca el silbato cuando la locomotora pasa por el punto de la vía más cercano a la base y **dispersa a los traviesos** que andan a menos de `alcance` de la vía (corren para el otro lado; los viejos no) | alcance 45 m, corren 9 s, 1 pasada por noche con efecto | 70 m, 15 s, 2 pasadas |
| **Los chicos** (Nahuel y Lucía) | tiran piedras con la honda desde la empalizada; **nunca reciben daño** (ninguna regla del juego les saca vida y los duendes no los eligen de blanco) | una piedra cada 3,2 s cada uno, alcance 20 m, daño 4 | cada 2,2 s, 28 m, daño 6 (una flecha de Josefina saca 30) |

Cosas a saber de cada uno:
- **Martín sólo sirve con la base a menos de 120 m de la vía** (`DISTANCIA_VIA_MAX`). Si queda más lejos, **pasa igual por el valle y el silbato se oye, sin efecto**
  (el aviso lo dice: «El silbato se oye por el valle, pero la vía queda lejos de tu base»). No tiene cuerpo en la base: va en la trochita.
  Como la trochita sigue su horario (una vuelta cada 5 min y medio), **hay una pasada por vuelta**: si en la noche no le toca pasar por ahí, no hay silbato.
  La trochita varada (la noche del rescate de Elsa) no cuenta.
- **Herminia**: sin luces nuevas (las luces fijas siguen siendo 4+1). Cada fuego es una malla sólida (piedras y leña, o el palo y el farol), una llama en gota
  (aditivo, con el color en los vértices) y un brillo en el suelo que se acomoda al terreno cuando se prende. Los cuerpos que están en el brillo no se
  iluminan (no hay luz real): se ven oscuros contra el brillo. Los fuegos se apagan al amanecer; si se guarda y se abre a mitad de noche, los prende de nuevo.
  `fuegosPrendidos()` (en `H.desafio.vecinos`) da `{ x, z, radio, tipo }` por si el agente de defensas quiere que la pala de brasas los prenda: **no se resolvió acá**.
- **Los chicos**: la piedra nace 1,8 m adelante de ellos, adentro de la empalizada (el proyectil ignora la obra donde nace); si no, se quedaba pegada a la pared.
  No tiran a los dormidos, a los que cavan, a los que vuelan alto ni a las crías del Coihue. Por defecto se paran un metro y medio detrás de la empalizada del lado por donde entran.
- **Anselmo, Herminia y los chicos se arman de a poco** (2 ms por cuadro, la primera vez) y quedan escondidos entre noche y noche; las noches siguientes vuelven los mismos cuerpos.

## Puestos: «Quedate acá, en tu puesto»
Lo más simple y claro con sólo teclado y ratón: **se lo traés y le decís que se quede ahí**. Mirando a un aliado, E rota las órdenes
y **«Quedate acá, en tu puesto» va justo después de «Vení conmigo»**: lo traés con «Vení conmigo», caminás hasta el lugar, y con E la orden siguiente es el puesto,
que es **el lugar donde el vecino está parado en ese momento** (queda en `D().puestosAliados[clave] = { x, z }`, y en la partida).
- Sin puesto marcado, cada uno se para en el de su oficio (`puestoPorDefecto`): los chicos, detrás de la empalizada del lado por donde entran esta noche (cada uno de un costado); Anselmo, hacia adentro de la base;
  Herminia, junto a su primer fuego; Ramón y Josefina, adentro de la base, del lado opuesto a la entrada.
- Alcanza a Don Ramón y a Josefina (arreglan alrededor del puesto, él; ella tira desde ahí) y a los cuatro cuerpos nuevos (Anselmo, Herminia, Nahuel y Lucía).
  Los nuevos tienen dos órdenes: «Quedate acá, en tu puesto» y «Vení conmigo».
- Un puesto marcado a más de 45 m de la base se acerca a esos 45 m. Una partida vieja carga sin puestos (`sanearPuestosAliados`).
- **Ajuste a una prueba existente**: el ciclo de E de Don Ramón pasa a `reparar → seguime → puesto → porton` y `pruebas/verificar-ordenes.mjs` tenía la vuelta escrita sin «puesto»; se ajustó esa línea.
  `ORDENES` (la tabla que recorre la prueba de idioma de la 1.11) **no se tocó**, para no dejar textos sin traducir: la lista que se usa es `listaDe(clave)`. Los textos nuevos (órdenes y respuestas) quedan para la pasada de traducción.

## Campana
`desafio-campana.js`. Mirando una campana terminada de cerca, **E la toca** (entrada en `avisoCercaDe` / `usarCercaDe`, antes del fortín, sin entrada nueva en `interacciones.js`):
- suena el **tañido** (`src/desafio-campana-sonido.js`, sintetizado por código: golpe del badajo + ocho parciales de campana no armónicos con su pareja desafinada que «bate»,
  seis golpes seguidos y la cola larga; 5,2 s; **no se tocó `desafio-sonidos.js`**);
- **los aliados que están en la base corren a su puesto** (velocidad de carrera 4,2 m/s hasta llegar; la orden pasa a «puesto»);
- **el perro va al portón** (el más cercano a la base, del lado de adentro; sin portón, 5 m hacia el lado por donde entran) y se queda un minuto. Usa el mismo estado de «ir a un punto» que ya tenía el perro
  (`mundoPerro.antojo`, el del asado del Relax) y le gana a la «alerta» de la tarde; si hay un duende encima tuyo, muerde, como siempre;
- vibra 14 s (no se toca dos veces seguidas; el aviso dice «La campana todavía vibra»).
Dice cuántos aliados corrieron; si no hay nadie en la base, lo dice y el perro va igual.

## Lo que se pide al contrato de «días»
- `D().aldea.ayuda[clave]` (0, 1 o 2) con las claves `anselmo`, `herminia`, `martin`, `chicos`. **Se lee en un solo lugar**: `nivelDeAyuda(d, clave)` de `desafio-vecinos.js`, que mientras `desafio-aldea.js` no esté junto tiene **un respaldo que devuelve 1 para todos**
  (si el estado de la aldea no existe). **AL JUNTAR**: cambiar el cuerpo de `nivelDeAyuda` por `nivelAyuda(d, clave)` de `desafio-aldea.js` (la rama `v49-dias` ya lo tiene, con las mismas claves; con ese, una partida sin `aldea` da 0 y nadie ayuda hasta que se cumplan pedidos).
- En `sanearDesafio` / `desafioNuevo` (`desafio-reglas.js`) se sumó `puestosAliados` (una línea cada uno, junto a `ordenes`); «días» va a sumar `aldea` en el mismo lugar (choque de una línea, se resuelve quedándose con las dos).

## Archivos
Nuevos: `src/desafio-vecinos.js` (puro), `src/desafio-vecinos-mundo.js` (el mundo, sin three: se prueba en Node con un mundo de mentira), `src/desafio-vecinos-piezas.js` (martillo y fuegos: three),
`src/desafio-campana.js`, `src/desafio-campana-sonido.js`, `pruebas/verificar-4-9-aliados.mjs`, `pruebas/humo-4-9-aliados.cjs`.
Cambios mínimos en bloques `// 4.9 aliados:`: `desafio.js` (imports, armado, un bloque por cuadro, `limpiar`, `ordenar`/`perroAlPorton`, la E de la campana, el movimiento de los duendes y `bajarAlien`), `desafio-aliados.js` (puesto, alarma, `obraDe`),
`desafio-ordenes.js` (la orden y el saneo), `desafio-reglas.js` (dos líneas), `main.js` (la orden por oficio y el perro al portón).
En el movimiento de los duendes (`actualizarAlien`): el que huye del silbato no ataca (`a.cd` mínimo 0,3) y, justo antes de la confusión del humo, el rumbo se corrige por la huida o por los fogones.
Todo campo nuevo por invasor (`huyeT`, `huyeX`, `huyeZ`) se limpia en `bajarAlien`.

## Verificación
- `pruebas/verificar-4-9-aliados.mjs`, **329 comprobaciones**: nivel de ayuda (respaldo, tope, claves raras), los tres números de cada vecino y que el 2 ayuda más fuerte, la regla de los viejos y el fuego (incluida una simulación: un viejo nunca baja de radio−1,2 m del fogón, uno que quedó adentro sale, un travieso pasa por el medio),
  el silbato (120 m, una pasada por vuelta, sólo traviesos, tope de pasadas), las hondas (sin daño al jugador ni a los chicos, de dónde nace la piedra, a quién no le tiran), los puestos (marcar, guardar, sanear partidas viejas y el `__proto__`),
  el mundo de mentira (cuándo vienen y se van, nivel 0, noches comunes, Anselmo yendo de una obra a otra, los fuegos, Martín con la vía cerca y lejos, los chicos, ordenar y la alarma), la campana y su sonido, y los enganches.
  **Mutaciones a propósito: 31 reglas clave rotas una por una; todas hacen fallar la prueba** (dos «sobrevivían» al principio —el empuje hacia afuera de los fuegos y el saneo de lo heredado— y se les sumó la comprobación que faltaba;
  una tercera, «vienen en noches comunes», es de doble guarda —el nivel y el `return`— y sólo cae si se rompen las dos).
- Pruebas existentes que hubo que tocar: `verificar-ordenes.mjs` (una línea, ver arriba). Una (`verificar-3-0-supervivencia`) falló por el orden de la E de la campana: se puso antes del fortín, que es lo que esa prueba pide.
- Partida real `pruebas/humo-4-9-aliados.cjs` (**53 comprobaciones**): levanta una empalizada de 12 tramos con portón y campana a 85 m de la vía, noche 12 a la tarde, los cuatro cuerpos, Herminia prende dos fuegos, viejo con y sin fuego (llega a 8,2 m con fuego y a 2,5 m sin él),
  travieso que pasa (2,4 m), Anselmo arregla tres obras rotas una tras otra, los chicos le sacan 60 de 800 a un duende quieto sin tocarte, E: «vení conmigo» y «quedate acá» (el puesto es donde está parado y se queda aunque te vayas),
  la campana (aviso, toque, órdenes, corren a 4,2, el perro de 22,8 a 1,4 m del portón), Martín (un silbato por pasada, el travieso cercano huye y el viejo no), amanecer (se van y se apagan), noche 13 con nivel 2 (cuatro fuegos, fogón a 13 m, los mismos cuerpos), ningún shader nuevo (93 programas antes y después),
  guardar y recargar, y una partida «de la 4.8» (sin puestos ni aldea) que abre. También corrieron en verde `humo-3-0-asedio` y `humo-3-5-1-desafio`.
- Capturas vistas a tamaño completo (en `pruebas/salidas/aliados-49/`, no se suben): `base-de-afuera-atardecer-a/b`, `herminia-y-el-fogon`, `anselmo`, `los-chicos-en-la-empalizada`, `base-de-noche-con-los-fuegos`, `fogon-de-noche`, `la-campana`.

## Mediciones (Ryzen 7 7730U: la notebook; sólo sirven para comparar antes/después, no son los fps de la 4600G)
- `npm run diag:dibujo` en el Desafío de noche (noche común, vista desde el refugio), dos rondas alternando base (4.8.0) y rama: **209 / 209 contra 207 / 208 dibujos por cuadro**: igual (en una noche común no se ve nada de lo nuevo).
- Con una noche grande, mirando a los cuatro cuerpos y a dos fuegos: **+28 dibujos y +57 mil triángulos** (330 contra 302 dibujos, 327.788 contra 270.589 triángulos): casi todo son los cuatro cuerpos de gente.js (como cualquier vecino de la aldea).
  Sólo pasa en las noches grandes, a menos de 130 m (gente.js los esconde más lejos) y mientras se los mira.
- CPU de lo nuevo: `vecinos.actualizar` **0,003 a 0,006 ms por cuadro** en una noche grande y **0,0007 ms** de día o en una noche común.
- Shaders: ningún programa nuevo al venir los vecinos y prenderse los fuegos (los fuegos se arman en la carga, a la vista fuera del mapa, y se esconden en el primer cuadro).

## Lo no verificado / a mirar
- **Los fps en la 4600G** (falta medir: la noche grande con los cuatro cuerpos y los cuatro fuegos mirando desde la plaza).
- Que **Martín tenga una pasada en cada noche**: depende de dónde esté la trochita; con 2303 m de vía son 5 min y medio por vuelta. No se probó con la trochita andando sola toda una noche, sólo llevándola de a 6 m por el punto de la vía.
- Los **sonidos** (el tañido de la campana, el martillo, las piedras): se probaron como buffers sanos y con el motor de mentira, **nadie los escuchó**.
- La animación de la honda (el brazo) y la del martillo: el brazo se levanta de golpe (como lo hace Don Ramón); no se miró un tiro en vuelo en una captura.
- Los fuegos no iluminan a los cuerpos (no hay luz real nueva): se ven como siluetas contra el brillo del suelo.
- Si el jugador marca un puesto afuera de la empalizada, el vecino se queda ahí (el único límite es 45 m de la base).
- Textos nuevos sin traducir (a propósito: «se traduce todo al final»).
