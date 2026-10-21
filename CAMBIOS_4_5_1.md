# 4.5.1 · Sin carreras contrarreloj ni torneo de la semana

Decisión del usuario (21-10, `PLAN_4_4_4_SIN_CARRERAS.md`; la versión se llama 4.5.1 porque la 4.5.0 ya existía).
Rama `v444-sin-carreras` (sobre la 4.5.0, `c5eac59`). Sin push ni merge.

## Qué se sacó

- **Las carreras contrarreloj** (3.1): `src/carreras.js` (reglas y los 6 circuitos: la vuelta de la estepa y la pampa del sur a
  caballo, el cross del mirador y la loma del faro a pie, la vuelta del lago en kayak y la regata del faro a vela) y
  `src/carreras-mundo.js` (los postes de largada con banderín y cartel, las puertas con banderas o boyas, la columna de luz y el
  fantasma de la mejor vuelta). En el mapa ya no hay marcas «Largada: …»; el HUD de la carrera (`#carrera-hud`) no existe.
- **El torneo de la semana**: `src/torneo.js` y `src/torneo-sync.js` (pesca, carrera y defensa; la tabla compartida por la
  carpeta sincronizada y el código para amigos). En Electron salen los canales `torneo-leer` y `torneo-escribir` (preload y
  `sincronia-main.cjs`).
- **Lo que los usaba**:
  - `src/main.js`: la tecla E y el aviso del poste (**en los dos lugares**), el «ni en plena carrera» de la pausa automática,
    las marcas de largada del mapa; `crearModos` ya no recibe el mundo, el jugador ni la carpeta.
  - `src/modos-juego.js`: queda sólo con el desafío del día (de 404 a 136 líneas).
  - `src/diarios.js`: el desafío del día ya no puede ser «Corré el circuito …» (sale de pesca, obra o trochita).
  - `src/guardado.js`: ya no sanea `carreras`; lo descarta (ver decisiones).
  - `src/plantilla.html`: sin el HUD; el panel y sus dos botones (portada y pausa) se llaman **«Desafío del día»**.
  - `src/idioma-en-r.js`: se borró la única clave del torneo (no se escribió inglés nuevo).
  - `herramientas/caos-ayuda.cjs` (sin la acción «carrera»), `soak-largo.cjs` y `soak-memoria.cjs` (sin los canales del torneo).
  - Pruebas: se borran `verificar-3-1-carreras.mjs` (sale del gate) y `humo-3-1-carreras.cjs`. Ajustes mínimos (ver abajo).
- Guía F1, cuaderno, logros, consola de códigos (`src/trucos*.js`), README y `STEAM_*`: **no nombraban** las carreras ni el
  torneo (inventario hecho con grep), así que no se tocaron.

## Qué se conservó

- **El código de la semana del Desafío** (`src/semilla.js`, sin cambios) y su uso en La noche de los duendes.
- **El desafío del día** (pesca, obra y trochita), con su racha, puntos e historial en la partida, el panel y la portada.
- La pesca, el Desafío, el caballo, el kayak, el velero, la trochita y las banderas con viento que no eran de las carreras
  (plaza, escuela, seccional, casa de té, locomotora y la tuya). Terreno sin tocar.
- El permiso del portapapeles de Electron (lo siguen usando el informe del banco y el parte).

## Decisiones

1. **Partidas viejas**: `guardado.js` saca `carreras` antes de copiar el resto (como el `pueblo` de la 3.1). Una partida de la
   4.5.0 con récords y fantasmas carga sin errores; al volver a guardarla, el campo ya no está. Basura en ese campo (null,
   texto, arreglos, objetos raros) tampoco rompe.
2. **Logros de carreras ya ganados**: no existía ninguno (ni en `logros-relax.js`, ni en el Desafío, ni en `STEAM_LOGROS.md`),
   así que no hubo nada que hacer; lo más conservador igual queda: nada del guardado se borra salvo los récords de carreras.
3. **El torneo guardado**: la clave `hojarasca-torneo-v1` del localStorage y los `hojarasca-torneo-<pc>.json` de la carpeta
   sincronizada **se ignoran** (no se leen, no se escriben, no se borran). Un archivo del torneo tampoco cuenta como «copia en
   conflicto» de la partida.
4. **El desafío del día se quedó** (el plan no lo pedía sacar): sin el tipo «carrera», el sorteo de cada fecha cambia (sale de
   tres tipos en vez de cuatro). Un desafío del día de carrera a medias de una partida vieja no se arrastra: ese día sale otro.
5. Pruebas que tocaban carreras en parte, ajustadas lo mínimo:
   - `verificar-3-5-1-relax` y `verificar-3-8-6-relax`: sin las comprobaciones del torneo (y la de «largar limpia la llegada»).
   - `verificar-3-8-7-progreso`: sin «largar esconde el fantasma»; `humo-3-8-7-progreso`: sin su sección 2 (el fantasma).
   - `verificar-3-8-8-banderas`: los banderines de largada pasan a «ya no existen».
   - `verificar-3-6-vida`, `verificar-3-7-4-rueda`, `verificar-3-7-5-rincones`: el orden de la E y del aviso se medía contra el
     poste de la carrera; ahora contra lo que sigue (sentarse a la cita / los rincones). El orden real no cambió.
   - `verificar-3-8-textos`: sólo un comentario.

## Verificación (real)

- Prueba nueva **`pruebas/verificar-4-5-1-sin-carreras.mjs`** (en el gate; 467 comprobaciones): nada de carreras ni torneo en
  `src`, Electron ni en el `index.html` armado (las únicas menciones son los comentarios con «4.5.1» que dicen que se sacaron);
  800 días seguidos de desafío del día sin carrera; `semilla.js` y sus usos; una partida vieja con récords, fantasma, desafío
  del día y torneo carga, descarta los récords y conserva la racha; Electron sin canales del torneo y el archivo del torneo de
  la carpeta queda donde estaba; el gate no corre pruebas que no existen.
- **`npm run verify` completo, de corrido: 261 pasos OK** (sale `verificar-3-1-carreras`, entra `verificar-4-5-1-sin-carreras`).
- Partida real nueva **`pruebas/humo-4-5-1-sin-carreras.cjs`** (Electron oculto, perfil propio): OK, 0 errores de consola. Recorre
  los seis lugares de los viejos postes (estepa, pampa, mirador, faro, lago y regata; teletransporte y un tramo caminando con W
  por la estepa): sin grupo de carreras en la escena, el aviso no ofrece largar y E no larga. Capturas a tamaño completo de
  cada lugar, del panel y del mapa, miradas una por una: ni postes, ni banderines, ni carteles, ni «Largada» en el mapa. Carga
  una partida vieja (racha 4, mejor 7, 777 puntos, récords de mirador y lago, torneo en el localStorage): juega, la racha
  queda, los récords no, el torneo no se toca.
- Partidas reales relacionadas, de a una: ver la tabla de abajo.

| partida real (Electron oculto, de a una) | 4.5.1 | 4.5.0 (`c5eac59`, misma máquina) |
|---|---|---|
| `humo-4-5-1-sin-carreras` (nueva) | OK, 0 errores de consola | — |
| `humo-2-9-vela` (velero, tirolesa, puente) | OK | — |
| `humo-3-8-6-relax` (kayak amarrado, pesca, textos) | TODO BIEN | — |
| `humo-3-8-7-progreso` (sin su sección del fantasma) | todo en orden | — |
| `humo-idioma` | 1 falla: «el contenido de la guía está en inglés» | la misma |
| `humo-3-5-4-caos` | 1 de 17: «el Desafío carga sin avisos de toNonIndexed (26)» | la misma (26) |
| `humo-desafio` | 1 falla: «HUD con cuenta regresiva» (+ UnknownVizError) | la misma |
| `humo-trucos` | 113 OK y 1 falla: después de «Escape devuelve a la pausa», un script que tira en la página | lo mismo (113 OK, la misma falla) |

Las cuatro fallas ya estaban en la 4.5.0: se corrieron las mismas partidas sobre un armado de `c5eac59` en una carpeta
temporal y fallan igual, en la misma línea. Ninguna tiene que ver con carreras ni torneo; no se tocaron.

## Peso

`modos-juego.js` + `carreras.js` + `carreras-mundo.js` + `torneo.js` + `torneo-sync.js` pesaban unos 60 KB de fuente; queda
`modos-juego.js` con 5,5 KB. En total la rama saca unas 1.700 líneas (30 archivos).
