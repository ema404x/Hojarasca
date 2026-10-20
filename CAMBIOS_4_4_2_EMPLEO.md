# 4.4.2 · Empleo fijo: arreglos de la ronda de revisión (zona B y lo que toca de la zona D)

Rama `v442-empleo` (sale de `v44-integra` = 4.4.1). No sube la versión. Informes de origen: `trabajo\bugs44\zona-B.md` y `zona-D.md`.

## Lo arreglado

| Id | Qué pasaba | Cómo quedó | Verificación |
|---|---|---|---|
| B1 | Con los dos jornales hechos se podía fichar (tres pagos por día). | `puedeFichar` recibe los jornales de hoy (`extra.jornales`, `extra.porDia`, que pone `empleo-juego.js` desde `trabajos.js`) y devuelve `cupo`; el cartel dice «Hoy ya hiciste tus dos jornales: no queda lugar para el turno». | Node + cartel en el juego con contexto de mentira. |
| B2 | El HUD del turno (`body`, `z-index:6`) tapaba la pausa, el cuaderno, el mapa y el modo foto, y no seguía la letra grande. | Va adentro de `#hud` (`position:absolute`, sin z-index): queda debajo de los velos, se esconde con el modo foto y crece con `--escala-letra`. | Partida real: con J y con Esc el elemento de arriba en el punto del HUD es el cuaderno / la pausa; con F2 no se dibuja; con letra 1,5 el ancho pasa de 330 a 495 px. Capturas 01–05. |
| B3 | Si el oficio llegaba después de los días, el ascenso no se avisaba ni se guardaba. | `cerrarTurno` compara contra el escalón ya guardado (`l.escalon`), no contra el vivo. | Node (ambos órdenes) + partida real: sale «Ascendiste: Despachante». |
| B4 | Turnos ofrecidos con el jefe en la fiesta, el baile, su cumpleaños o la minga. | Nuevo `src/empleo-presencia.js`: dónde está el jefe a cada hora (cita y casamiento de `amor.js`, la fiesta vía `fiestasJuego.destinoEn`, y el horario de `rutinaAldea`, que ya sabe del baile y de los cumpleaños). Si falta la mitad del turno o más, `puedeFichar` devuelve `ausente` y el cartel dice «Hoy no hay turno: Ercilia está en el baile del salón. Volvé otro día.» Sueldos y horarios intactos. | Node (sábado de baile, cumpleaños, minga, mesa larga de 1 h que no alcanza, casamiento) + partida real (sábado de baile y fiesta del verano sin turno en el almacén; la casa de té el mismo sábado sí; un lunes común sí). |
| B5 | Comprar el local con el turno en marcha seguía pagando «Sueldo» de tu propio negocio y sumaba el día. | Cada 0,5 s el empleo mira `esLocalTuyo`; si lo es, cierra con motivo nuevo `compra`: cobra lo hecho hasta ahí sin multa, no suma el día, avisa «Ya es tuyo el almacén: se cerró el turno». El cuaderno dice «es tuyo» en ese local. Desde que es tuyo no se ofrece turno (ya estaba). | Node + partida real: 3 de 8 = $600 exactos, `dias` en 0. La compra se probó dejando el estado que escribe `comprar` (la compra por la charla es del frente del negocio). |
| B6 | Dormir (o la siesta) con el turno a medias evitaba la multa y la falta. | El empleo recuerda la hora de la pasada anterior: si el turno se cierra por día o por tiempo, quedaban tareas y esa hora era anterior a la de cierre, se cierra como `abandono` (multa del 25 % y falta), con el título «Te fuiste a dormir sin terminar el turno». Un turno que se pasa de hora trabajando de verdad se cierra como siempre. | Node (noche, siesta, pasarse de hora) + partida real (`H.__dormir()` a las 19:42 con 3 de 8: cobra $450, una falta). |
| B7 | Con la hora de tu reloj el turno no se cerraba por la hora. | `motivoDeCierre` ya no distingue el reloj (el parámetro se conserva sin efecto). | Node. |
| B8 | Dos avisos al irte a más de 45 m. | Queda uno, el del cierre. | Node. |
| B9 | La tarea «Armar las bandejas» caía a 0,27 m de una silla; el HUD ignoraba la letra grande; `aria-live` anunciaba cada minuto. | Tarea movida a (1,9; −2,7), junto a la barra, a ≥ 1,5 m de toda silla (el texto dice «junto a la barra donde se arman»); HUD dentro de `#hud` (ver B2); `aria-live="off"` (la nota ya anuncia el cambio de tarea). | Node (distancia a cada silla de `planoCasaTe`) + partida real: se puede estar parado ahí y la E es la tarea. |
| B10 | El cartel decía «entran N tareas» con una cuenta que no coincidía con el cierre. | `tareasPosibles` cuenta hasta el cierre real (`hasta` + 45 min de gracia) a 0,5 h por tarea; el texto dice «unas N tareas» y avisa «con menos de 6 el día no cuenta para el ascenso». | Node. |
| D7 | El modo foto corría el local propio, los empleados y los negocios comprados con la hora del deslizador (cobros adelantados). | `&& !foto.activo` en esas tres llamadas de `main.js`, como ya tenían cocina, taller, fiestas y empleo. | Lectura del código en la prueba de Node. |
| D6 (parcial) | `empleoJuego.accion` (la E y el aviso) no estaba aislada. | Se envuelve adentro de `empleo-juego.js` y llama a `fallaSistema('empleo-accion')` (ctx.falla). El resto de D6 (avisos de otros sistemas) no es de este frente. | Node (un `progreso()` que tira). |

## Decisiones por defecto (preguntas de diseño de la zona B)

1. **Cupo (B1):** el turno cuenta siempre como uno de los dos jornales. Turno + 2 jornales no es posible.
2. **Fiestas, baile y cumpleaños (B4):** opción (a): no se ficha si el jefe falta de su local la mitad del turno o más (cada cuarto de hora, desde la hora de fichar). Una hora de mesa larga en un turno de cuatro no cancela nada. No se pausa el turno ni se cambia el saludo. Sueldos y horarios sin cambios; lo que cambia es que en esos días el cartel dice por qué no hay turno.
3. **Irse antes (B6):** dormir y la siesta cuentan como irse (multa y falta) si el turno estaba abierto con tareas pendientes antes de la hora de cierre.
4. **Reloj real (B7):** el turno se cierra por la hora.
5. **Compra del local (B5):** se cierra el turno al comprar, pagando lo hecho hasta ese momento, sin multa y sin sumar el día.
6. **Amistad:** no se toca (sumar amistad por turno cambia el equilibrio de 4.4 y es decisión de diseño de negocio). Queda como pregunta abierta.
7. **Faltas:** no se cambia lo de «dejar vencer el turno con tareas hechas»: sólo irse explícitamente, abandonar lejos o dormir antes de la hora de cierre anotan falta.

## Archivos tocados

- `src/empleo.js`, `src/empleo-juego.js`, `src/empleo-presencia.js` (nuevo), `src/fiestas-juego.js` (`destinoEn`, función chica nueva).
- **Compartidos:** `src/main.js` (tres retoques: `fiestaEn` y `falla` en el contexto del empleo, y `!foto.activo` en tres líneas del bucle), `package.json` (la prueba nueva registrada en `verify:pasos`). No se tocó `guardado.js` ni `aldea.js`; el guardado no tiene campos nuevos (el motivo `compra` se acepta en el historial al sanear).
- Pruebas: `pruebas/verificar-4-4-2-empleo.mjs` (nueva, en el gate), `pruebas/verificar-4-3-empleo.mjs` (tres números y un caso del reloj ajustados a lo nuevo), `pruebas/humo-4-4-2-empleo.cjs` (partida real, a mano).

## Lo que no quedó

- Los cuatro jefes: sólo Ceinwen es candidata al romance (cita y casamiento); la mirada de presencia cubre cita y casamiento con `rutinaPareja`, pero no el concurso de fotos de la fiesta ni el destino de cocina (se llevan a otra gente por unas horas; el reparto de la fiesta de ese día ya los deja fuera del local).
- El saludo del jefe al fichar sigue igual cuando se ficha con una ausencia corta (menos de la mitad del turno).
- La compra por la charla no se repitió en la partida real (es del frente del negocio): se verificó dejando el estado que escribe `comprar`.
- Amistad por turno (pregunta 6) y aviso al jugador cuando falla un sistema de dinero (D6, resto).
