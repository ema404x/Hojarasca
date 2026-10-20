# 4.4 · Parte 1: empleados en tu negocio propio (rama `v44-empleados`)

Sale de `v431-tiron` (4.3.0 + herramientas de medición). Sólo Relax, sin mando, sin inglés. **La versión no se subió** (sigue 4.3.0).

## Cómo se juega

1. En el panel de tu local (E o Mayús + E) hay una sección nueva, **«Empleados 0 de 2»**, con «Contratar a un vecino…». La lista muestra a cada vecino contratable con **cómo acepta** (según la amistad), cuánto **rinde** (de X % a Y %) y su **sueldo por día**.
2. **Amistad** (puntos de `vecindad.js`): menos de 25, ni te conoce («Todavía no te conoce lo bastante»); 25 a 49, acepta de mala gana y pide un 20 % más; 50 (amigo), acepta; 140 (compadre), acepta con gusto, cobra 10 % menos y rinde 5 puntos más. Los que tienen **local propio con servicio** (panadera, carpintero, herrero, pescador, tejedora, apicultor, veterinaria, herbolaria) sólo aceptan si sos amigo y cobran 10 % más: dejan su local cerrado durante el turno. **No se contratan** los que sostienen un servicio de todos: jefe de estación, banco, maestra, enfermera, telegrafista, Ercilia y Nélida, Ceinwen, Martín, la cantina, el músico, la botera, la astrónoma, la abuela y los chicos. Contratables: Gladys, Mario, Pocha, Sofía, Malena, Abril, Rocío, Julia, Rosa, Elvira, Ayelén, Inés, Tito, Anselmo, Aurelio y Guido (16; los pobladores sólo si ya viven en la aldea).
3. **Turnos**, de lunes a sábado (el domingo descansan): el primero contratado, de 8:30 a 19; el segundo, de 11 a 21 (de 11 a 19 están los dos). **El vecino deja la aldea durante su turno** (su horario cambia: para la aldea queda «fuera», como el chico que estudia afuera) y su **figura aparece detrás del mostrador de tu local**: entra caminando por el costado si estás cerca, se queda de frente al público y se va caminando al terminar. Se arma de a poco con el planificador antitirones y duerme cuando estás lejos.
4. **Cuando estás**, atendés vos (E) y ellos ayudan: al cliente que ya esperó ~12 a 15 s lo despacha el empleado libre (aviso «Gladys atendió: +$…»). Recién llegado, el cliente espera por vos.
5. **Cuando te vas** (más de 35 m del local) no hay figuras de clientes: las ventas se **simulan por media hora** con las mismas reglas del local (mismos clientes, precios, stock real, caja con tope y fama). Al volver (< 35 m), un aviso: «Mientras no estabas, se vendió $6.920 · Gladys vendió $6.920 (10 clientes). Sueldos pagados: $6.200».
6. **Sueldo**: se paga solo al cerrar el turno de cada día (**de la caja del local primero y, si no alcanza, de tu billetera**; decisión mía, sale en el panel). Con vos presente avisa «Gladys cobró su sueldo». Sin plata para pagar: aviso de impago (se acumula lo debido); **al segundo impago seguido renuncia** y la amistad cae 10. **Si pasan más de 5 días sin que pases por el local, renuncian** (tope de lo que se acumula; amistad −4). Si desarmás el local, se van sin culpas.
7. **Despedir**: dos toques («¿Seguro? Despedir»); se le paga el día si ya trabajó hoy (no es su primer día) y la amistad cae 6. El **primer día es de prueba** (sin sueldo). Cada 4 días pagados la amistad sube 2.
8. **Fiestas**: si la aldea lo lleva a una fiesta (cosecha), una cita o un asado, **manda la aldea**: en ese rato no está en el local ni vende (sigue cobrando). El día de su cumpleaños trabaja, pero de 18 a 20 va a su fiesta.

## Reglas (números)

| | |
|---|---|
| Empleados | hasta 2 |
| Sueldo diario | `900 + 1.800 × (habilidad − 0,5)`, de $900 a $1.800; ×1,10 si tiene local propio; ×1,20 de mala gana; ×0,90 compadre; redondo a $50 |
| Habilidad | 0,50 (Abril) a 0,90 (Rosa), +0,05/0,10 si lo suyo es el tipo de local (la panadera y Gladys en la panadería, Tito en el almacén…) |
| Rendimiento | inicio `0,50 + 0,10 × hab`; tope `0,70 + 0,15 × hab`; crece como `1 − e^(−días/6)` (casi todo en el primer año del juego = 12 días); +0,03 amigo, +0,05 compadre; máximo 0,90. Con los números reales: de 56–63 % el primer día a 79–87 % |
| Dos juntos (11 a 19) | `1 − (1 − a)(1 − b)` |
| Ayuda cuando estás | espera mínima `22 − 12 × r` s; tarda `7 − 3 × r` s en despachar |

## Equilibrio (`herramientas/simulador-negocio-propio.mjs 60`, sección nueva)

Almacén, surtido bueno, precios normales. **Vos atendiendo todo el día: ventas $6.840/día, ganancia sobre venderlo al mercado $1.596/día.** Con el empleado y vos lejos (promedio por día de calendario, 6 de 7 trabajan):

| | ventas/día | sueldo/día | **neto de caja** | sobre venderlo al mercado |
|---|---|---|---|---|
| Mario (barato, $1.100), recién llegado | $2.593 | $935 | $1.658 | −$328 |
| Mario con 12 días | $2.934 | $935 | **$1.999** | −$249 |
| Gladys ($1.550) recién llegada | $2.628 | $1.318 | $1.311 | −$704 |
| Gladys con 12 días | $3.000 | $1.318 | **$1.683** | −$615 |
| Rosa (panadera, $1.800) con 12 días | $3.029 | $1.530 | $1.499 | −$822 |
| Dos (Mario + Gladys) con 40 días | $4.217 | $2.253 | $1.965 | −$1.266 |
| Dos (Gladys + Rosa) con 40 días | $3.906 | $2.848 | $1.059 | −$1.933 |
| Gladys, precios baratos / caros | $3.523 / $1.341 | $1.318 | $2.205 / $23 | |
| Gladys, surtido chico | $1.199 | $1.318 | **−$119** | |

(El sueldo por día de calendario es 6/7 del nominal.) Por día de trabajo, un empleado vende **51 % de lo que vendés vos al arrancar y ~60 % a los 12 días** (lo comprueba la prueba), y dos juntos ~80 %: nunca más que vos. «Neto de caja» = lo que entra menos los sueldos, con la mercadería ya producida; contra los $3.200/día de jornales, un empleado barato suma ~$1.700–2.000/día **mientras vos hacés jornales**.

**Lo que hay que saber (honesto):**
- «Sobre venderlo al mercado» es **negativo** con cualquier empleado: el local rinde ~25 % sobre el mercado, y un sueldo de $900–1.800 se come eso. Contratar **no es para ganar más que vendiendo al mercado**, es para **ganar plata con el local mientras estás en otra cosa**. El más barato (Mario/Abril) casi empata ($−250). Si querés que también supere al mercado, hay que bajar sueldos (`SUELDO`) o subir el margen del local; está todo en una tabla.
- **El segundo empleado casi no se paga** ($+300 de neto sobre uno): la demanda del local es el límite (~4–5 clientes/día), no las manos. Sirve para cubrir mañana y noche y levantar la fama (58–63 vs 48), que trae más gente.
- **Con surtido chico no se paga** (−$119/día): hay que surtir bien, igual que atendiendo vos; los edificios de la 4.2 siguen siendo los que llenan los estantes.
- No rompe la economía: sólo vende lo que vos surtiste (stock real), la caja tiene su tope de $12.000, y nunca vende más que vos.

## Decisiones mías (para revisar)

1. Sueldo **de la caja primero, después de la billetera** (el panel lo dice). Sin nada, impago; dos seguidos, renuncia.
2. **Mon–Sáb, turnos de ~10 h** y el segundo desplazado; el domingo y el primer día, sin sueldo. Con un turno corto el empleado rendía 35 % de lo tuyo, no el 60 % pedido.
3. **Los eventos de la aldea mandan** (fiesta, cita, asado): no se tocó `amorDestino`; el local lo consulta (`ctx.evento`) y el empleado no está ni vende en ese rato.
4. Vecinos con local propio: contratables sólo de amigos y con sobresueldo; su local queda **sin ellos durante el turno** (razonado, no probado en el juego: si un servicio depende de que el NPC esté, no se podrá usar en ese horario).
5. Las ventas simuladas descuentan clientes **no atendidos sin castigo de fama** (el resto de los clientes que vos perderías no existen en la simulación); la fama sube con la atención «normal».
6. El empleado **no se charla** (la E sigue siendo del local); no hay conversación ni animación de despacho.
7. La amistad se usa **sólo al contratar** y como bono de rendimiento (nivel al momento); nada de «mala amistad» que baje de 0.

## Archivos

- Nuevos: `src/empleados-negocio.js` (reglas puras), `src/empleados-negocio-juego.js` (figura, panel, avisos), `pruebas/verificar-4-4-empleados.mjs` (en el gate), `pruebas/humo-4-4-empleados.cjs` (partida real, fuera del gate), este informe.
- **Compartidos tocados (mínimo):** `src/aldea.js` (+5 líneas: `fijarOcupacionExterna` y un `if` en `rutinaAldea`), `src/main.js` (+15: import, armado aislado con `fallaSistema`, bucle, `extraPanel`, `evento`, no charlar al empleado, `__empleadosNegocio`), `src/guardado.js` (+3: campo `empleadosNegocio` con valor por defecto y saneado; Desafío sin él), `src/negocio-propio-juego.js` (`atender(c, quien)`, el hueco `ctx.extraPanel` y 1 línea de exports), `package.json` (sólo la prueba en `verify`; **versión sin subir**), `herramientas/simulador-negocio-propio.mjs` (sección nueva). `negocio-propio.js` **no se tocó**; las partidas viejas no traen el campo y salen sin empleados.

## Verificación

Ver el resultado al final del informe de la entrega (verify completo, una vez y de corrido).
