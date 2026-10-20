# 4.4.2 · Arreglos del negocio propio, los empleados, la compra/sociedad y la economía

Frente de la ronda de revisión de la 4.4.1 (zona A y lo que toca de la zona D). Rama `v442-negocio` (sale de `v44-integra` = 4.4.1). No se subió la versión.

## Qué se arregló

| Id | Qué pasaba | Cómo quedó |
|---|---|---|
| A1 / D3 | Con empleados y vos lejos, `guardar()` salía una vez por segundo (`sim.n % 5` con `n` quieto) | Se guarda una sola vez por cada múltiplo de 5 (`guardadoN` en `empleados-negocio-juego.js`) |
| A2 | Mover (Mayús + Y) el local activo dejaba a otro local de otro tipo como «el activo» y cerraba tu cuenta | `localReal()` es el dueño del estado aunque lo muevas; `local()` es null mientras lo movés (no se promueve otro) |
| A3 | `alDesarmar` con la caché vacía cerraba la cuenta con cualquier local que se desarmara y despedía a todos sin pagar | Se reconoce al activo por identidad (caché) o por su lugar (`negocioPropio.sitio`, campo nuevo); sin ninguno de los dos, sólo si no queda otro local en pie |
| A4 + decisión (b) | Despedir a las 8:00 y recontratar = sueldo gratis todos los días | El día de prueba sin sueldo es una vez por vecino y por local (`empleadosNegocio.ficha`, campo nuevo, se borra cuando no hay local). Recontratado: el día de hoy se paga al cerrar el turno, sin cobrar dos veces lo que ya se le pagó al despedirlo |
| A5 | Un empleado sin `pagadoDia` cobraba todos los días desde el 1 de golpe | Sin dato arranca en hoy; además el atraso que se paga nunca pasa de `AUSENCIA_MAX_DIAS + 1` días |
| A6 | Mientras movías el local se congelaban gastos, sueldos y ventas | Siguen corriendo (sólo las figuras y la ayuda esperan) |
| A7 | El vecino que «se fue» se quedaba en la plaza en su cumpleaños y en el baile del sábado | `aldea.js` le pasa `dia` y `t` al desvío; no desvía en la fiesta de su cumpleaños ni en el baile (con el salón abierto) |
| A8 | Con «hora de tu reloj», dormir antes de medianoche hacía vender dos veces el mismo día | `sim.tope` (campo nuevo) = lo más lejos que ya se simuló; no se vuelve a simular debajo |
| A9 | Un turno del empleo fijo seguía después de comprarle el local al jefe | `motivoDeCierre` cierra el turno con lo hecho (`tiempo`) si el local pasó a ser tuyo |
| A11 | El cliente o empleado más cercano tapaba a cualquier vecino de verdad | `gente.cerca(js, camara, deFrente, omitir)`: main.js saltea clientes y empleados y pide el siguiente |
| (a) | «Pedir al proveedor» + «Sacar» era una tienda de materiales | Lo que viene del proveedor queda marcado (`negocioPropio.prov`, campo nuevo): se vende, no se saca. Las ventas gastan primero lo tuyo. Al cerrar o desarmar el local, lo del proveedor no vuelve a la mochila (se avisa). El panel muestra «N del proveedor» |
| D4 | El aviso de la E seguía diciendo «Dormir junto al fuego» con el panel del local abierto | El reseteo final del aviso incluye panel del local, fiestas, cantina, casa de té y banco |
| D7 | En modo foto, el local, los empleados y los negocios de vecinos corrían con la hora del deslizador | `&& !foto.activo` en las tres líneas (como cocina, taller, fiestas y empleo) |
| D8 | `usarModoGuardado` no reiniciaba `ultimaSecuencia`: se filtraba entre ranuras al importar | `ultimaSecuencia = 0` |

## Decisiones (pregunta de diseño → qué se eligió)

1. Proveedor + sacar: **se marca y no se saca** (decisión del usuario).
2. Despedir/recontratar: **una sola prueba por vecino y por local** (decisión del usuario).
3. Sueldos con el local cerrado: **se siguen pagando** (sin cambio; es lo que ya calibraba la 4.4.1).
4. Sociedad contra compra: **sin cambio** (no se toca el equilibrio).
5. Comer en tu casa de té / cajas viejas de la aldea: **sin cambio**.
6. Desarmar el local: **sin cambio** en despedir sin pagar la jornada en curso y en perdonar la deuda que no alcanza a pagarse (queda como riesgo, abajo).
7. Día de gracia hasta la medianoche: **sin cambio**.
8. Demanda y propina por la cantidad contratada: **sin cambio**.
9. Los vecinos «idos» en la plaza y sus servicios: no se verificó, **sin cambio**.
10. «Se va» + contratado: **se bloquea contratar** a quien atiende un negocio que ya le compraste (su sueldo lo descuenta ese negocio; cobraría dos veces). Para los demás nada cambia.
11. Cartel «de Bruno» (`ctx.nombre` que main.js nunca pasa) y la voz `retiro.sale` sin uso: **sin cambio** (cosméticos).

Equilibrio de la 4.4.1 intacto: empleados +$340–430/día con uno, local atendido por vos ~$1.564/día sobre el mercado, gastos $250/$200. Ningún número de `empleados-negocio.js`, `negocio-propio.js` ni `negocio-propio-gastos.js` cambió.

## Guardado (campos nuevos, todos con valor por defecto: las partidas viejas siguen igual)

- `negocioPropio.prov` (`{}`), `negocioPropio.sitio` (`null`),
- `empleadosNegocio.ficha` (`{}`), `empleadosNegocio.sim.tope` (`0`).

## Pruebas

- Nueva: `pruebas/verificar-4-4-2-negocio.mjs` (registrada en `verify`), un caso por bug; todos fallaban antes del arreglo.
- Partida real corta en Electron oculto: `pruebas/humo-4-4-2-negocio.cjs` (mover el local con Mayús + Y, desarmar el otro con Mayús + Supr, despedir y recontratar, 40 s lejos con empleados sin guardados de más, proveedor sin sacar).
- Se ajustaron tres comprobaciones de texto de pruebas viejas que miraban las líneas de main.js/aldea.js que cambiaron (`verificar-4-3-negocio`, `verificar-4-4-compra`, `verificar-4-4-empleados`).

## No tocado a propósito

Las teclas con Mayús (Mayús + E, Mayús + Supr, Mayús + Y): las reemplaza el frente de construcción. Por eso quedan **sin arreglar** A10 y D5 (Mayús + E abre el panel del local aunque haya otro panel del HUD abierto) y D1. El enganche del panel del local con la tecla está en un solo lugar: `main.js`, el `case 'KeyE'` (`negocioJuego.usar(o, true)`).
