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
| Sueldo diario | `600 + 1.200 × (habilidad − 0,5)`, de $600 a $1.200; ×1,10 si tiene local propio; ×1,20 de mala gana; ×0,90 compadre; redondo a $50 |
| Habilidad | 0,50 (Abril) a 0,90 (Rosa), +0,05/0,10 si lo suyo es el tipo de local (la panadera y Gladys en la panadería, Tito en el almacén…) |
| Rendimiento | inicio `0,50 + 0,10 × hab`; tope `0,70 + 0,15 × hab`; crece como `1 − e^(−días/6)` (casi todo en el primer año del juego = 12 días); +0,03 amigo, +0,05 compadre; máximo 0,90. Con los números reales: de 56–63 % el primer día a 79–87 % (sin cambios en el ajuste) |
| Ventas sin vos | clientes ×1,12 con uno, ×1,35 con dos; propina +10 % con uno, +20 % con dos (`EMP_LOCAL`) |
| Dos juntos (11 a 19) | `1 − (1 − a)(1 − b)` |
| Ayuda cuando estás | espera mínima `22 − 12 × r` s; tarda `7 − 3 × r` s en despachar |

## Equilibrio (`herramientas/simulador-negocio-propio.mjs 60`, sección nueva) — AJUSTADO

Almacén, surtido bueno, precios normales. **Vos atendiendo todo el día: ventas $6.703/día, ganancia sobre venderlo al mercado $1.564/día** (no cambió: `negocio-propio.js` no se tocó y `verificar-4-3-negocio.mjs` sigue en 1.891).

Ajuste pedido por el usuario (el primer corte daba pérdida con cualquier empleado y el segundo no se pagaba): **sueldos de $600 a $1.200** (`600 + 1.200 × (habilidad − 0,5)`, ×1,10 con local propio, ×1,20 de mala gana, ×0,90 compadre), y `EMP_LOCAL`: con empleados el local está siempre atendido y se corre la voz (**+12 % de clientes con uno, +35 % con dos**) y el empleado **ofrece algo más** en cada venta (**propina de +10 % sobre lo cobrado con uno, +20 % con dos**). Todo es sólo para lo que se vende sin vos; el rendimiento (56–63 % → 79–87 %), los turnos, la amistad, las renuncias y el día de prueba no cambiaron. La propina cuenta como venta del local (ventas, caja con su tope, anotado a su nombre).

Con el empleado y vos lejos (por día de calendario; trabajan 6 de 7). «Sobre el mercado» = ventas − lo que valía lo vendido en el mercado − sueldos:

| Almacén, de amigo | Antes: ventas / neto de caja / sobre el mercado | Después: ventas / sueldo / neto de caja / **sobre el mercado** |
|---|---|---|
| Mario (barato), recién llegado | $2.593 / $1.658 / −$328 | $3.094 / $595 / $2.499 / **+$344** |
| Mario, 12 días | $2.934 / $1.999 / −$249 | $3.373 / $595 / $2.778 / **+$429** |
| Gladys, recién llegada | $2.628 / $1.311 / −$704 | $3.264 / $850 / $2.414 / +$139 |
| Gladys, 12 días | $3.000 / $1.683 / −$615 | $3.919 / $850 / $3.069 / **+$339** |
| Rosa (panadera), 12 días | $3.029 / $1.499 / −$822 | $4.017 / $1.020 / $2.997 / +$201 |
| Dos (Mario + Gladys), recién llegados | $3.984 / $1.731 / −$1.316 | $6.174 / $1.445 / $4.729 / **+$785** |
| Dos (Mario + Gladys), 40 días | $4.217 / $1.965 / −$1.266 | $6.864 / $1.445 / $5.419 / **+$1.039** |
| Dos (Gladys + Rosa), 40 días | $3.906 / $1.059 / −$1.933 | $7.003 / $1.870 / $5.133 / +$663 |
| Gladys, 12 días, precios baratos / caros | −$943 / −$820 | +$41 / −$195 |
| Gladys, 12 días, **surtido chico** | $1.199 / −$119 / −$1.034 | $1.264 / $850 / $414 / **−$464** |

- **Un empleado a los 12 días: +$340 a +$430/día sobre el mercado** (Mario +$429, Gladys +$339), con sueldos de $595–850 por día de calendario ($700–1.000 nominales; un jornal es $700–1.300). Los caros y los muy hábiles (Rosa $1.200) quedan en +$200 o menos; con precios baratos queda en ~$0 (se gana fama, no plata).
- **El segundo suma +$610 de más** (Mario solo +$429 a 40 días; los dos +$1.039) con Mario + Gladys; con los dos más caros (Gladys + Rosa), +$663 contra +$405 de Gladys sola (+$260): ahí el sueldo de Rosa se come casi todo. La fama sube a 68–74 (con uno, 48–52), que trae más gente.
- **Atendiendo vos sigue ganando más**: $1.564/día sobre el mercado, contra $430 con uno y $1.039 con dos.
- **Con surtido chico sigue perdiendo** (−$464): hay que surtir bien.
- Por día de trabajo, un empleado vende ~60 % de lo que vendés vos al arrancar y ~70–75 % a los 12 días (algo por encima de lo que cabía con el primer corte por el +12 % de clientes y la propina); **dos juntos pueden llegar a ~110 % de lo tuyo** por día de trabajo: sale de la fama alta y la propina, y está limitado por la mercadería que surtís (no hay venta de la nada). Es el costo de que el segundo se pague; la prueba lo acota en 1,3 veces.
- Panadería: el ajuste da menos (Gladys +$41 a 12 días, Mario +$341) porque su mercadería vale menos.

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
