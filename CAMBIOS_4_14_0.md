# Hojarasca 4.14.0 — Motor de escenas de la Historia

Rama `v4140-escenas`, sobre `main` = 4.13.0. No se subió la versión (se hace al integrar). Es el MOTOR: independiente del guion (`GUION_HISTORIA.md`); trae una escena de demostración que no está en el juego normal.

## Qué es
Una escena es **datos**: un guion de pasos. El director (`src/escenas.js`, puro, probado en Node) la corre; `src/escenas-mundo.js` lo conecta con el juego (mueve a los NPC que ya existen, pone la cámara y dibuja barras de cine, texto y elecciones en HTML/CSS: ni un programa de shader ni una luz nuevos).

- `src/escenas.js` — validar, correr, saltar, cámara dirigida, mirada dirigida corta, lo guardado.
- `src/escenas-mundo.js` — el juego: personajes, cámara, pantalla, teclas, mouse.
- `src/escenas-demo.js` — «Llegada de Josefina» (ejemplo y prueba; sólo con `escena demo` en la consola de códigos).
- Enganches mínimos: `main.js` (unas 15 líneas, todas con `4.14.0:`), `historia.js` (2: `escenas` en `historiaNueva` y en `sanearHistoria`), `trucos.js`/`trucos-textos.js`/`trucos-juego.js` (el código `escena`).

## Cómo se escribe una escena

```js
import { crearEscenasMundo } ... // lo arma main.js: window.__hojarasca.__escenas (con ?debug=1)

const miEscena = {
  id: 'cap02-llegada-de-tito',      // letras, números, guion y punto; hasta 64; es la clave de «vista»
  titulo: 'Llega Tito',             // opcional
  repetible: false,                 // true: se puede volver a ver aunque ya esté vista
  efimera: false,                   // true: no se marca vista ni guarda elecciones (las demos y pruebas)
  resumen: 'Tito dejó la carga y se fue.',   // lo que se muestra si el jugador la salta
  personajes: { tito: { clave: 'ema', nombre: 'Tito', color: '#d9a441' } },   // opcional; ver «Personajes»
  disparador: { hora: [8, 12], requiere: ['otra-escena'], cond: 'nombre' },   // opcional; ver «Disparar»
  pasos: [ /* ... */ ],
};
director.registrar(miEscena);       // → { ok, errores: [...] }   (no registra si algo está mal armado)
```

### Referencias (`a`, `desde`, `mira`, `hasta`, `pos`)
Dónde está algo. Se resuelven en cada cuadro, así un plano sigue a un personaje que camina.
- `'jugador'` · el nombre de un personaje (`'ramon'`, `'josefina'`, `'ercilia'`, `'nicanor'`, `'elsa'`, o el de tu `personajes`).
- `{ x, z, y? }` un punto del mundo (sin `y`, el suelo).
- `{ ref: 'ramon', dx: 1, dz: -2, dy: 0.5 }` corrido respecto de otra referencia.
- `{ lugar: 'refugio', dx, dz }` un lugar de `T.lugares`.
- `{ frente: 'jugador', dist: 5, lado: 2 }` 5 m adelante de donde mira el jugador y 2 a su derecha (negativo: izquierda). También `frente: 'ramon'`.

### Pasos
Cada paso lleva `tipo` y, opcionalmente: `etiqueta` (un nombre para saltar ahí), `si` (condición; ver abajo) y `sinEsperar: true` (arranca y el siguiente paso empieza ya).

**`plano`** — la cámara. `plano:` uno de:

| plano | qué es | campos útiles |
|---|---|---|
| `general` | abierto, desde arriba y lejos (11 m, 3 m de alto) | `a`, `desde`, `dist`, `alto`, `giro` (grados) |
| `medio` | a 3,4 m, a la altura de los ojos | idem |
| `primer` | primer plano de la cara (1,35 m) | idem |
| `detalle` | un objeto o las manos (0,85 m, bajo) | `a` puede ser un punto con `y`; `alto`, `miraY` |
| `hombro` | sobre el hombro de `desde` (default el jugador) mirando a `a` | `desde`, `a`, `lado` (1 o -1), `atras`, `costado` |
| `picado` / `contrapicado` | desde arriba / desde el piso mirando para arriba | idem |
| `paneo` | cámara fija, gira de `a` a `hasta` | `a`, `hasta`, `camara` (dónde está), `dist` |
| `travelling` | la cámara acompaña a `a` al costado; con `hasta`, va de `a` a `hasta` | `a`, `hasta`, `dist`, `angulo`, `lado` |
| `empuje` | acercamiento (o alejamiento) lento | `a`, `dist`, `distFin`, `encuadre: 'medio'` |
| `fijo` | como `general` (o el `encuadre` que se diga) pero congelado al empezar: no sigue a nadie | `encuadre` |
| `libre` | posiciones a mano | `pos`, `mira`, `posFin`, `miraFin` |

Comunes: `dur` (segundos, default 3), `mezcla` (segundos de transición desde el plano anterior; 0 = corte; el primer plano de la escena sale de la cámara del jugador en 1,2 s), `suave` (`'suave'` | `'lineal'` | `'entra'` | `'sale'`), `fov`, `tiembla` (radianes, para el «plano movido»).
Un plano bloquea la escena `dur` segundos salvo `sinEsperar`.

**`dialogo`** — `{ tipo:'dialogo', quien:'josefina', lineas:[...] }`. Cada línea es un texto o `{ texto, quien?, gesto?, plano? }`: `quien` cambia de hablante en esa línea (plano y contraplano en un solo paso), `gesto` es un paso de gesto (sin `quien`: usa el que habla) y `plano` un paso de plano que arranca con esa línea. También `texto:` (una línea sola), `auto: 3` (avanza sola a los 3 s), `cps` (letras por segundo). El nombre y el color salen de `personajes`. El jugador avanza con Enter, Espacio o clic; Enter con la línea a medias la completa; Mayús apretada escribe 6 veces más rápido.

**`gesto`** — `{ tipo:'gesto', quien, accion, ... }`:
- `caminar`: `a`, `vel` (m/s, default 1,4), `mira` (hacia dónde queda mirando). Espera a que llegue (con un tope; si se traba, lo deja en el lugar).
- `mirar`: `a` (gira hacia ahí). No espera salvo `esperar: true`.
- `posar`: `pose`, `dur` (default 2,4). Poses propias de escena: `saludo`, `senalar`, `asentir`, `negar`, `encoger`; de quietud del juego: `pensar`≈`barba`, `cruzados`, `cintura`, `barba`, `gorro`, `atras`, `delantal`, `juntas`; del juego: `mirar`, `aplaudir`, `contar`, `brindar`, `tocar`, `palear`, `hachar`, `regar`, `martillar`, `serruchar`, `bailar`.
- `aparecer`: `a`, `mira`: lo trae a un punto (si estaba lejos o dormido). `desaparecer`.
No hace falta «tomar» al personaje: el primer gesto lo toma y la escena lo suelta al terminar (vuelve a su ruta u horario).

**`espera`** — `{ dur: 2 }`, o `{ hastaHora: 19.5, dur: 6 }`: deja correr el reloj del juego hasta esa hora en `dur` segundos (siempre hacia adelante, pasa la medianoche).

**`hora`** — `{ a: 19.5, dur: 8 }` o `{ mas: 0.5, dur: 8 }` (suma horas): cambia la hora suavemente; bloquea salvo `sinEsperar`. `atras: true` permite ir hacia atrás.

**`clima`** — `{ estado: 'lluvia' | 'nublado' | 'despejado', dur }` (el juego lo acerca de a poco). `esperar: true` bloquea `dur`.

**`sonido`** — `{ id: 'campana' | 'portazo' | 'bisagra' | 'anotar' | 'juntar', en?: ref }`.

**`eleccion`** — `{ tipo:'eleccion', id:'saludo', pregunta:'¿Qué le contestás?', opciones:[{ id, texto, a?, efecto?, args? }, ...], porDefecto: 0 }`. De 2 a 4 opciones (teclas 1–4, flechas o W/S y Enter, o clic). Guarda `elecciones[id] = opcion.id` (por escena, en la partida). `a: 'etiqueta'` salta ahí; `efecto` corre un efecto con nombre.

**`efecto`** — `{ tipo:'efecto', nombre:'dar-objeto', args:{...} }`: corre `efectos[nombre](args, { escena, elecciones, saltando, mundo, dia })` registrado por el guion (`director.registrarEfecto(nombre, fn)`; en el juego: `window.__hojarasca.__escenas.registrarEfecto`). Si no está registrado se anota el error y la escena sigue. **Los efectos tienen que poder correr de a uno y ser idempotentes** (ver «Guardado»).

**`fundido`** — `{ a:'negro' | 'claro' | 'cruzado', dur, mantener?, alMedio?: [pasos instantáneos] }`. `cruzado` va a negro y vuelve; los pasos de `alMedio` (efecto, gesto, hora, clima) se aplican con la pantalla en negro (cambios de lugar sin que se vean).

**`salto`** — `{ tipo:'salto', a:'etiqueta' }`.

### Condiciones (`si`)
`{ eleccion:'saludo', es:'mate' }` · `{ eleccion, esUno:['a','b'] }` · `{ eleccion, no:'x' }` (elegida y distinta) · `{ vista:'otra-escena' }` (con `no:true`: no vista) · `{ cond:'nombre', args }` (una función registrada con `registrarCondicion`; `no:true` la niega). Las elecciones que se miran son las de esta escena y las ya guardadas de otras (los lazos de la historia).

### Personajes
`personajes: { clave_de_escena: { clave, nombre, color } }` donde `clave` es la del juego (`ema` = Josefina, `guarda` = Elsa). Ya vienen: `ramon`, `nicanor`, `josefina`/`ema`, `ercilia`, `elsa`/`guarda`, `jugador` («Vos»). Para una persona nueva (Graciela, Fermín) se registra su `clave` del juego. Un personaje que no está en el mundo no rompe nada (se ignora); `aparecer` trae a los que están dormidos o lejos.

## Controles durante la escena
Enter / Espacio / clic: seguir (si escribe, completa la línea) · Mayús: escribir rápido · 1–4, flechas o W/S + Enter: elegir · **Esc o Tab: saltar** (la primera vez avisa «Apretá Esc otra vez para saltar la escena»; la segunda salta) · **F1: pausa** (congela la escena; al volver sigue). El mouse queda suelto durante la escena (no hay mirada ni movimiento); al terminar, la cámara vuelve al jugador en 1 s.

## Disparar y consultar
En el juego (`window.__hojarasca.__escenas` con `?debug=1`; en el código, `escenasMundo` de `main.js`):
- `escenasMundo.disparar(id, { forzar })` → `true` si arrancó (sólo con el juego en `jugando`; `puedeEmpezar` pide estar a pie, sin vehículo, sin cuaderno/panel/charla abiertos ni modo foto).
- `escenasMundo.pedir(id)` arranca apenas se pueda (lo usa la consola de códigos).
- `director.elegible(id, { horas })` mira `disparador` (`hora: [desde, hasta]`, `requiere`, `cond`) y que no esté vista (salvo `repetible`); `director.buscarElegible()` da la primera con `auto: true`.
- Para los objetivos de la historia (`escena(id)` del guion): `escenaVista(progreso.historia, id)` y `eleccionDe(progreso.historia, id, eleccionId)` (de `escenas.js`).
- `escenasMundo.mirarA(ref, 2.6)`: **mirada dirigida corta** en pleno juego: la cámara del jugador gira sola hacia el punto y vuelve; no saca el control del movimiento.
- Consola de códigos: `escena demo`.

## Guardado (importante para quien escriba escenas)
Lo guardado va en `progreso.historia.escenas = { vistas: { id: día }, elecciones: { escena: { eleccion: opción } } }` (declarado en `historiaNueva` y `sanearHistoria`; con default seguro, tope de 600, ids validados, sin `__proto__`/`constructor`).
- Una escena **se marca vista recién al terminar o al saltarla**.
- **Mientras corre una escena `guardar()` no escribe** (como el banco de pruebas): al pausar o cerrar la ventana no se guarda a mitad. Resultado: si el jugador cierra a mitad, al volver la escena está pendiente y se puede volver a disparar, y los efectos que ya había corrido no quedaron en el disco (no se duplican). Al terminar, la partida se guarda (en un rato ocioso). Volver a la portada desde la pausa termina la escena (la salta, con sus efectos) antes de guardar.
- Las escenas `efimera` no dejan nada en la partida.
- Fuera de una partida de Historia (`progreso.historia` ausente) las vistas no se guardan.

## Skip (saltar)
`saltar()` recorre lo que falta **aplicando en orden**: efectos, gestos (los que caminan quedan en su destino, `aparecer`/`desaparecer`), hora y clima finales, la elección sin contestar con su `porDefecto` (y su rama, su `efecto` y sus `a`), `salto`, `fundido cruzado` (sus `alMedio`). No suenan sonidos ni se muestra texto. Después la cámara vuelve al jugador y se suelta a los personajes. Cosas a tener en cuenta al escribir: lo importante va en pasos, no en el `gesto` o `plano` de una línea de diálogo (eso se pierde al saltar); lo del guion que tenga que valer aunque se salte va en un `efecto`.

## Decisiones
1. **Esc salta con confirmación** (dos veces) porque el guion lo pide y porque en el juego Esc con el mouse bloqueado suele ser «pausa»: durante la escena se suelta el mouse a propósito, así Esc llega como tecla y la pausa es F1 (y perder el foco de la ventana).
2. **Mouse suelto en la escena**: la elección también se puede hacer con clic.
3. **Personajes**: los toma como la cantina y el amor (`conVos`, `camino`), y al soltarlos restaura lo que tenían (los de ruta vuelven sin `camino`; los de la aldea, a su horario). Las poses `saludo`, `senalar`, `asentir`, `negar` y `encoger` no existían: están en `escenas-mundo.js` y se aplican **después** de `gente.actualizar`, mezcladas con lo que ya hizo.
4. **Cámara**: el jugador sigue su `jugador.actualizar` normal (sin entrada de teclado: `activo` en falso) y la escena pisa la cámara después; la salida mezcla hacia esa cámara viva (sin saltos). Yaw/pitch se mezclan por el camino corto.
5. **Sin shaders nuevos**: sólo DOM/CSS y rotaciones de huesos que ya existen.
6. **Un solo director** a la vez; si no se puede empezar, `disparar` da `false` y el que llama reintenta.

## Verificación
Ver más abajo (se completa al cerrar).

## Estado al pausar → ya no hace falta
(La sección anterior de «Estado al pausar» se reemplazó por este documento.)
