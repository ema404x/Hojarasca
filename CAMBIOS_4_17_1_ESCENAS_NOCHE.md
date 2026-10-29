# Hojarasca 4.17.1 — Escenas y noche de la nevada (arreglos de E1, E3 y E4-4)

Rama `bugs-4-17-1-escenas-noche`, sobre `origin/main` = 4.17.0. No se subió la versión ni se hizo push. Sin Electron (la PC estaba en uso): todo lo probado es en Node, de a una prueba.

Informes: `trabajo\bugs8\zona-E1.md` (11), `zona-E3.md` (13) y E4-4 de `zona-E4.md`.

## Estado de cada hallazgo

### Prioridad 1 (alto)
| # | estado | qué se hizo |
|---|---|---|
| E3-1 la noche suma un día por cuadro con «la hora de tu reloj» | **arreglado y probado** | Confirmado con el código (y con un arnés: 3600 días en un minuto en 4.17.0). `actualizarTiempo` (main.js): con la noche activa, la hora de la PC no pisa la hora de la noche; al terminar, `alTerminar` devuelve la hora de antes y la medianoche real suma **un** día. Además, **defensa general**: `medianochePermitida()` (main.js) exige 15 s de juego entre dos medianoches automáticas (el día más corto, 20 min sentado ×40, dura 30 s): cualquier bucle que pise la hora cada cuadro suma a lo sumo un día cada 15 s, no uno por cuadro. Vale para el modo reloj y el normal. |

### Prioridad 2 (la hora de las escenas)
| # | estado | qué se hizo |
|---|---|---|
| E1-2 la guardia del molino se come un día | **arreglado y probado** (escena real) | Regla única del corte en seco, `horaDeCorte` (escenas.js): si la hora pedida ya pasó hoy (menos de 12 h para atrás) o es de madrugada (<6) y la pedida es de la noche (≥18, «la noche de hoy»), **la hora no se toca**; si no, hacia adelante como la hora con duración. Guardia a la 1:00 del día 30 → termina el día 30. |
| E4-4 escenas con apagón atrasan el reloj del mismo día | **arreglado y probado** (`majada-vos`, `carpeta-celeste`, `mesa-guerra`, `fiesta-nieve` reales) | La misma regla: ya no vuelve el reloj para atrás ni salta un día. |
| E1-3 reloj de la PC: las escenas suman días de más | **arreglado y probado** | En modo reloj, `mundo.hora` de la escena no toca la hora (manda la PC). |
| (de paso) escena salteada con una hora con duración que cruza la noche | **arreglado y probado** | `saltar()` ponía la hora final sin sumar el día (de las 15 a las 7 del mismo día). Ahora `mundo.hora` recibe `delta` y cruza la medianoche. |
| `masa-crece`, `veta-vuelve` (misma causa, E1-2) | arreglado por la misma regla | No se corrieron una por una. |

### Prioridad 3
| # | estado | qué se hizo |
|---|---|---|
| E3-2 «Dejar la historia en pausa» tira TypeError | **arreglado y probado** | `abandonar` en la interfaz de la noche (historia-noche-ui.js): llama al mundo, que termina como abandono (devuelve la hora, suelta duendes y aliados). |
| E3-3 aliados congelados | **arreglado y probado** (código real de `soltarAliadosDeNoche`) | Al soltarlos, el NPC con `ruta` queda con `camino = undefined` (vuelve a su ruta); el que no tiene ruta, `[]` como antes. Lo mismo en `historia-acompanante.js` (Ramón, Tobías). La posición no se devuelve a mano: la ruta los lleva. |

### Prioridad 4 (E1 y E3 medios)
| # | estado | qué se hizo |
|---|---|---|
| E1-1 la escena tapa la pausa, la guía y la portada | **arreglado; probado en Node, falta mirar en Electron** | `escenasMundo.tapar(modo !== 'jugando')` en cada cuadro: con la pausa (F1, Alt+Tab), la guía, el cuaderno o la portada, `body.escena-tapada` esconde la capa, la caja, las barras, el velo y los avisos de la escena y les saca los clics. Los clics de la capa y la caja, además, sólo cuentan jugando. |
| E1-4 un Enter/clic de más elige | **arreglado y probado** | `MARGEN_ELECCION = 0,4 s` (escenas.js): «seguir» (Enter, Espacio, clic) y el clic sobre una opción valen pasado ese tiempo desde que aparece la elección (tiempo del director: no corre en pausa). Los números y las flechas valen siempre. |
| E1-5 teletransporte antes de comprobar | **arreglado y probado** (la regla real; el orden, por texto) | `lanzarEscena` pregunta `ctx.puedeEscena(deSentado)` antes de `colocar`. La regla de `puedeEmpezar` pasó a `puedeEmpezarEscena()` en main.js (la misma, con la excepción de la guardia que te levanta). |
| E1-6 duendes «mirando» para siempre al saltear | **arreglado y probado** | `nacerLuego`/`cancelarNacimientos` (main.js): los que nacen de a uno se cancelan en `despedirDuendesDeEscena` y en «Pararte de golpe». |
| E1-7 «El que vuela» arranca a pie | **arreglado en parte** | Ahora puede empezar en el kayak o el velero (el corte de `enVehiculo` deja pasar sólo esa escena). **Sigue pudiendo salir a pie**: ver preguntas. |
| E1-9 «En la cabina» no se dispara nunca | **no arreglado (pregunta)** | Confirmado: la condición pide el tren y las dos puertas lo prohíben. Ver preguntas. |
| E1-8 modo foto encima de una escena | **arreglado** (texto) | F2 no prende el modo foto con una escena activa. |
| E3-4 la noche en la puerta del refugio, no en el galponcito | **no arreglado (pregunta)** | Confirmado (no se pasa `centro`). Pero el punto `galpon-propio` es el **centro de la obra** (adentro del galponcito), no su puerta: pasarlo armaría las estacas y pondría al jugador y a los aliados adentro. Sin ver en Electron no lo toqué. Ver preguntas. |
| E3-5 la variante Viejo nunca se ve | **arreglado y probado** | `tomar()` viste de Viejo (`vestir(true)`) después de `reiniciar()`. |
| E3-6 la ayuda de los hongos del lomo no existe | **arreglado** (probado el API; la línea, por texto) | Usa `m.uniformes()`; y con deuda sin pagar no ayuda (como dice CAMBIOS_4_17_0 y como hacen la lucecita y el enjambre). |
| E3-13 +2 programas al llegar de noche al galponcito | **no hecho** | Hace falta Electron para el método del revisor (`renderer.info.programs` antes/después). Queda para mirar. |
| E3-7 la práctica no se abre sin la noche armada | **arreglado** (texto) | `alActivarHistoria` también prepara la noche (bajo la pausa o la tarjeta, como en la carga). |

### Bajos
| # | estado |
|---|---|
| E3-8 el 1 y el 2 cambian de arma en las escenas entre olas | **arreglado y probado** (`alTeclear` y `alRueda` no actúan con la noche en pausa). |
| E3-9 la lucecita del topo queda flotando | **arreglado y probado** (se apaga en `terminar`). |
| E3-12 la primera campana suena la genérica | **arreglado** (en `construir`, `relax` se apaga sólo durante `campana.preparar()`); no se escuchó. |
| E3-10 sin amanecer si se cierra durante `noche-tras-ganar` | no hecho (raro, no traba). |
| E3-11 los 21 Viejos se arman al empezar la noche | no hecho (no medido; la prueba 4.17.0 A fija `armarPozoViejo`). |
| E1-10 un salto de hora en un turno de empleo cobra multa | no hecho: con la regla nueva ya casi no hay saltos grandes (sólo hacia adelante); queda la pregunta de avisar al empleo. |
| E1-11 poses propias acumuladas en NPC lejanos | no hecho (visual, severidad baja). |

## Decisiones tomadas sin consultar
- **Corte de hora que ya pasó: se queda la hora de ahora** (no se salta al día siguiente). La alternativa (ir hacia adelante, como dice el documento del motor para la hora con duración) se comía de 13 a 22 h de partida (por ejemplo `huellas-escarcha` a las 8:24 → 6:54 del otro día), que es justo lo que el usuario marcó como bug en la guardia. Efecto visible: esas escenas se ven a la hora en que se disparan y no a la que pedían (la guardia, a la 1:00 y no a las 22:36).
- `atras: true` explícito sigue permitiendo ir para atrás (ninguna escena actual lo usa en un corte).
- El tope general mira **tiempo de juego** (suma de `dt`) y no reloj real, y sólo las medianoches de `actualizarTiempo`: dormir, la consola de códigos y el banco no pasan por ahí.
- La escena tapada esconde también las barras y el velo mientras la pausa está abierta (si la pausa cae justo en un fundido a negro, se ve el mundo detrás de la pausa).
- El margen de la elección no se aplica a los números ni a las flechas (son a propósito).
- La ayuda de los hongos, con deuda, no ayuda (lo dice el diseño de 4.17.0).
- Los aliados no se devuelven a su posición: los lleva su ruta.

## Preguntas
1. **«El que vuela»**: ¿pedirle además `s.enKayak || s.enVela` en la condición? Así ya no saldría a pie con el texto del remo, pero sería más rara de ver (de noche, en el agua, cerca del faro).
2. **«En la cabina»**: para que salga habría que dejar empezar una escena manejando la trochita. ¿Se quiere así (el tren sigue andando bajo la escena) o se cambia la condición (por ejemplo, en el andén al bajar)?
3. **La noche en el galponcito**: ¿dónde va el centro? Habría que usar la puerta del galponcito (no está como punto) o buscar un lugar libre al lado. Y para el refugio, los aliados quedan «atrás» del centro, que es adentro de la casa: ¿se ponen a los costados del portón?
4. Corte de hora tardío: ¿preferís que salte al día siguiente a la hora de la escena (más fiel al guion, pero se pierde el día)?
5. Con «la hora de tu reloj», al ganar la noche `amanecer()` suma un día y la medianoche real después suma otro. ¿Anotar `relojNoche` en el amanecer, como al dormir?

## Pruebas
- Nueva: `pruebas/verificar-4-17-1-escenas-noche.mjs` (46 comprobaciones, enganchada al gate). Corre: `actualizarTiempo` y `medianochePermitida` reales con la noche pisando la hora 3600 cuadros; la guardia y cuatro escenas del apagón reales con el director real y el `mundo.hora` real de `escenas-mundo.js`; el margen de la elección; la capa con la pausa (clic sin efecto, clase puesta); `abandonar` de la interfaz de la noche; `soltarAliadosDeNoche` real; el mundo de la noche con three (lucecita apagada al terminar, el 2 con la noche en pausa); `nacerLuego`/`despedirDuendesDeEscena` reales; `puedeEmpezarEscena` real.
- Ajustadas (lo mínimo):
  - `verificar-3-8-3-combate.mjs`: la línea de la medianoche del reloj ahora lleva `&& medianochePermitida()`.
  - `verificar-4-10-3-ajustes.mjs`: el mundo de mentira de `actualizarTiempo` trae el tope abierto (`medianochePermitida: () => true`).
  - `verificar-3-8-3-base.mjs`: `const puedeFoto = !escenasMundo?.activa() && fotoPosible(`.
  - `verificar-4-14-0-escenas.mjs`: «Enter confirma la opción marcada» espera 0,5 s (el margen) antes del Enter.
  - `verificar-4-16-0-historia-a.mjs`: la mutación del acompañante apunta a la línea nueva (sigue atrapándose).

### Pruebas sueltas que corrí (de a una), con su resultado
- `verificar-4-17-1-escenas-noche.mjs` — 46 OK
- `verificar-4-14-0-escenas.mjs` — 77 OK
- `verificar-4-15-0-escenas-acto1.mjs` — 742 OK (38 mutaciones)
- `verificar-4-16-0-escenas-acto2.mjs` — 1610 OK (51 mutaciones)
- `verificar-4-17-0-escenas-acto3.mjs` — 22830 OK (64 mutaciones)
- `verificar-4-16-0-historia-a.mjs` — 584 OK (36 mutaciones)
- `verificar-4-17-0-historia-a.mjs` — 237 OK (32 mutaciones)
- `verificar-4-17-0-pulido-c.mjs` — 71718, 0 fallas (falló una vez por mi cambio en `despedirDuendesDeEscena`; lo reordené y pasó)
- `verificar-4-15-0-historia.mjs` — 1469 OK
- `verificar-4-13-0-historia-a.mjs` — 192 OK
- `verificar-4-10-3-ajustes.mjs` — 49 OK
- `verificar-3-8-3-base.mjs` — 32 OK · `verificar-3-8-3-combate.mjs` — ok · `verificar-3-8-3-relax.mjs` — 72 OK · `verificar-3-8-4-relax.mjs` — 168 OK
- `verificar-3-8-6-base.mjs` — 76 OK (falló una vez: la llamada a `tapar` quedaba en medio del bloque del mando; la moví después)
- `verificar-3-8-7-progreso.mjs` — 54 OK · `verificar-3-8-coihue.mjs` — 178 OK · `verificar-3-1-historia.mjs` — OK
- `herramientas/revisar-escritura.cjs` sobre los archivos tocados — sin avisos; `node armar.mjs` — arma.
- No corrí `npm run verify` ni las partidas (consigna).

## Para mirar en Electron
- En una escena con elección: F1 y Alt+Tab → la pausa se ve **encima**, sus botones responden y un clic no elige nada. «Volver al inicio» desde la pausa de una escena: la portada responde al mouse.
- La elección: pasar líneas a los golpes de Enter → la elección aparece y no se elige sola.
- Sentado a la mesa con la visita (`mesa-visita-*`), o a caballo hablando con Tobías/Fermín: el jugador ya no salta al lugar de la escena cada medio segundo.
- Saltear la guardia (Esc Esc enseguida): no quedan rastreadores quietos en la raíz.
- «El que vuela» en el kayak a 30 m del faro, de 23 a 1: arranca en el agua (y cómo se ve la escena con el kayak).
- La noche: «Dejar la historia en pausa» en plena noche; al terminar, Ramón, Josefina y Fermín vuelven a su ruta; noche con trato: los chicos con pinta de Viejo; ola 3 con trato: el lomo del Mandamás brilla más de espaldas.
- Con «la hora de tu reloj», jugar la noche pasando la medianoche real: el día sube una sola vez.
- Los +2 programas al llegar de noche al galponcito (E3-13): el método del revisor (comparar `renderer.info.programs` antes y después).
- La primera campana de la noche: que suene la de Martín.
