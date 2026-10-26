# 4.11.2 · rama B: gente, diario y economía

Rama `v4112-b` (sale de `main` = 4.11.1). Hecho con las decisiones de `DECISIONES_DISENO_4_10.md` (sin volver a preguntar). Los códigos remiten a los `CAMBIOS_4_10_*`.

## Lo hecho

| # | Qué | Dónde |
|---|-----|-------|
| A14 a | **Diario: «Conocí a …».** La primera charla con Fermín, Belisario o Tobías anota `campo-conocido` (el enganche existía en `gente-campo-juego.js` pero `main.js` no le pasaba `anotarDiario`). La página del día dice «Conocí a Fermín Catrileo, de los que viven lejos del pueblo. Vale la pena volver a pasar.» (o la lista, si fueron varios). Una sola vez por persona. | `diario.js`, `main.js` |
| A14 b | **Encargo del Puesto Alto** en el tablón: «1 puñado de llao llao seco», del monte de arriba, para Inés (o la abuela si Inés no llegó). Origen `puestoAlto` (ya estaba en `ORIGENES`, 560 m, ×2,5): paga $1.650. | `tablon.js` |
| A14 c | **Soltar un papel tomado.** Cada papel tomado del panel trae un botón «Soltar» (clic), o Retroceso y el número. Sin castigo: hoy no vuelve a la vista, mañana hay papeles nuevos. Usa el `soltar` que ya tenía `tablon.js` y se guarda. | `tablon-mundo.js`, `plantilla.html` |
| D1 | **Reintento de armado** de Fermín, Belisario y Tobías si no hubo lugar libre: cada 25 s de juego (sólo mientras estás a menos de 220 m), hasta 8 intentos; una resta por cuadro de costo. | `gente-campo-mundo.js` |
| R10 | **Contratar al compadre que está de visita en tu mesa corta la visita** (`cortarVisitaDe` en `main.js`, enganchado con `alContratar`). Por seguridad, el reloj de visitas también la corta si al que visita le toca el turno estando de visita. | `empleados-negocio-juego.js`, `main.js` |
| D2 | **La novia empleada en dos lugares: se reprodujo en partida real y se arregló.** Caminando juntos, cuando le empezaba el turno quedaba a tu lado (figura de la aldea) y detrás del mostrador (figura del local) a la vez: 448 cuadros con las dos visibles. Ahora el paseo se termina con «Uy, ya me toca entrar al trabajo. Nos vemos después, ¿dale?», no se empieza uno estando de turno, y el menú dice «estoy trabajando». | `amor-mundo.js`, `amor-escenas.js`, `main.js` |
| D3 | **El empleado que sale de turno sale caminando desde el local.** La figura de la aldea reaparece en el punto de salida del local (el mismo por donde entra y sale la figura del mostrador) y camina desde ahí; mientras la figura del mostrador se está yendo, la de la aldea espera (tope de 40 s) para no verse dos. Con la aldea lejos (más de 150 m) todo sigue como antes. | `aldea-gente.js`, `empleados-negocio-juego.js` (`salidaDeTurno`) |
| S2-7 | **Panadera: 3 panes por $600** (antes $200; el pan vale $200 en el mercado, daba arbitraje). Cambia `SERVICIO.pesosPorPan` y la ficha («tres panes por $600»); el resto del texto sale de la constante. | `aldea.js` |
| S2 | **La demanda de la Casa de Té sigue el calendario** (`temporadaDelDia(progreso.dia)`), como ya los precios de los puestos (4.10.2) y coherente con «Estación fija». | `main.js` |
| S6 | **Texto de la picada de la tarde:** «entre las 19 y las 22» (pedido, resumen del encargo y entrada del cuaderno). El juego no cambia (cuenta de 19 a 22). | `encargos.js`, `cuaderno.js` |

E4 (novia/novio en cita aceptan té/mate): no se tocó.

## Decisiones propias (mínimas)
- **Puesto Alto:** llao llao seco (1 por papel) porque es un bien que ya existe, no pide un material nuevo y paga dentro de la escala del tablón; lo pide la herbolaria (o la abuela). Entra en el reparto diario como los demás (sale a la vista unos 8 de cada 120 días con la mezcla actual).
- **Soltar:** botón en la fila + Retroceso y número (sólo teclado y ratón). El papel soltado cuenta como «quitado» hoy, igual que uno tomado.
- **D2:** se cortó el paseo en vez de dejar a la novia en el mostrador y a la vez a tu lado; al soltarla en la aldea, su figura de la aldea queda «fuera» como cualquier vecino que entra de turno (el mostrador la recibe desde la puerta del local).
- **D3:** la aldea espera a que la figura del mostrador termine de irse, en vez de borrarla de golpe; es lo que evita la figura doble.
- **Textos nuevos sólo en castellano.** Cambian de clave y quedan sin traducir hasta el repaso final del inglés: pedido, resumen y entrada del cuaderno de la picada; resumen de la panadera; los textos de A14, D2 (`turno`) y el pie del tablón.

## Pruebas
- Nueva `pruebas/verificar-4-11-2-gente.mjs` (73 comprobaciones; sumada al gate con `herramientas/sumar-prueba.cjs`). Falla sin cada cambio: se probó con una mutación a propósito de cada regla (diario, encargo, botón de soltar, soltar por teclado, reintento, tope de intentos, R10 en el local y en `main.js`, D3 la espera y el punto de salida, panadera, calendario de la Casa de Té y el texto de la picada); todas hacen caer la prueba.
- Ajustadas lo mínimo (fijaban lo cambiado a propósito): `verificar-3-8-8-economia.mjs` (`pesosPorPan === 600`) y `verificar-3-6-aldea.mjs` (la partida de la prueba arranca con $1.000 en vez de $500 para poder comprar los panes de $600).
- Partidas viejas: no cambia ningún campo guardado. La anotación del diario va dentro de la página del día ya guardada (`diarioHoy`, que sanea datos simples), y la de los papeles tomados sigue en `genteCampo.tablon.tomados`.

## Partidas reales (Electron, perfil propio, ocultas salvo la última, de a una)
- `pruebas/humo-4-11-2-gente.cjs` (nueva): TODO BIEN (diario con Fermín y Tobías; tablón con un día de papel del Puesto Alto, dos tomados con su botón, clic en «Soltar», Retroceso y número; D3 con un local junto a la aldea: aparece a 0,0 m de la salida y camina desde ahí, sin cuadros dobles; R10: la visita de Gladys se corta al contratarla; D2: el paseo se corta al empezar el turno, 0 cuadros dobles; antes del arreglo daba 448). Capturas a tamaño completo, la última corrida con `-Visible`.
- `humo-4-4-empleados` TODO BIEN; `humo-4-4-2-empleo` 28 bien, 0 mal; `humo-3-7-1-amor-mundo` OK; `humo-4-6-gente` OK.
- `humo-3-6-aldea` falla tres comprobaciones (los nueve vecinos despiertos, ninguno trabado, «la panadera cambia pan por yerba») y `humo-3-9-0-cantina` falla «terminó el vaso»: **las dos fallan igual en `main` (4.11.1)**, armada aparte para comparar; no son de esta rama.

## Gate
`npm run verify:paralelo` durante el trabajo: sólo `verificar-construccion-premium-rc6.mjs` cayó por tiempo (20 s de `vm` con la PC cargada) y pasa sola. `npm run verify` de corrido al final: **301 pasos OK, sin fallas** (300 de la 4.11.1 + la prueba nueva).

## No verificado
- Los textos nuevos en inglés (se traducen al final).
- El tablón con la letra grande o el tema del cuaderno con el botón «Soltar» (se vio en el tema por defecto).
- D2 con la novia caminando en el valle (fuera de la aldea): se probó dentro de la aldea; en el valle la regla es la misma (`revisarJuntos`).
- D1 en una partida real: sólo con un mundo de mentira (no se pudo forzar «sin lugar libre» en el juego).
