# 4.4.1 · Gastos fijos e impuestos del local propio, y reposición de los estantes (rama `v441-gastos`)

Sale de `v44-integra` (4.4.0: empleo, negocio propio, empleados, comprar negocios y sociedad). Sólo Relax, sin mando, sin inglés. **La versión no se subió** (sigue 4.4.0).

## El problema

El negocio que le comprabas a un vecino pagaba «alquiler, impuestos y luz» todos los días y reponía su mercadería de forma abstracta. El local que armás vos no pagaba nada y sus estantes sólo se surtían a mano: el local propio rendía más limpio que uno comprado, y los empleados vendían pero no reponían.

## Cómo queda

### 1. Gastos fijos del local propio (`src/negocio-propio-gastos.js`, módulo puro)

| Local | Alquiler | Impuesto | Luz | Total por día |
|---|---|---|---|---|
| Almacén de campo | $110 | $80 | $60 | **$250** |
| Panadería y cafetería | $70 | $60 | $70 | **$200** |

(Los negocios comprados pagan de $200 a $350 por día: el local propio queda en el mismo rango.)

- Se cobran **adelantados al empezar cada día** de la partida, **estés donde estés** (los mira `negocio-propio-juego.js` cada 0,25 s, pero sólo pasa algo cuando cambia el día: nada por cuadro). Salen de la **caja del local primero** y, si no alcanza, de **tu billetera** (motivo en el libro: «Gastos del local: alquiler, impuesto y luz»; lo que sale de la caja no pasa por el libro de la billetera, como los sueldos).
- **El día que abrís el local por primera vez es de gracia**; se cobra desde el día siguiente y se deja de cobrar al desarmarlo. Se pagan aunque el local esté cerrado (el cartel no apaga la luz). Un local que nunca abrió no paga.
- **Varios días de golpe** (cargaste la partida, dormiste): se cobran los que pasaron, hasta 7 (`DIAS_ACUM_MAX`); no se acumula más. Un reloj que vuelve para atrás no cobra dos veces.
- **Deuda**: si entre la caja y la billetera no alcanza (todo o nada), el día queda de deuda, con tope de 5 días. **Con 2 días de deuda el local cierra solo**: el cartel del edificio queda en «cerrado», no entran clientes y los empleados no venden. No se pierde nada tuyo (mercadería, fama, caja, bandera de «abierto»). Se paga sola apenas hay plata (el cobro del día incluye lo atrasado) o con el botón «Pagar la deuda» del panel. Al desarmar el local se paga lo que se pueda y el resto se perdona.
- **Panel**: «Gastos por día: $250 (alquiler, impuesto y luz)», «Balance de hoy» y «Balance de la semana» (ventas · sueldos · gastos [· proveedor] = neto), la línea «Deuda de gastos» cuando hay, y «Con estos estantes y precios: cerrado por la deuda de gastos». **Aviso diario discreto**: «Gastos del local: −$250 · Alquiler, impuesto y luz, de la caja del local», y avisos aparte al no poder pagar («Un día más sin pagar y el local cierra solo»), al cerrar y al reabrir. El aviso de la E del local dice «cerrado por una deuda de $500. Pagala en el panel (Mayús + E)» (o «· debés $250 de gastos» si todavía atiende).
- **Balance** (`negocioPropio.fin.dias`, 8 días): ventas (al cerrarse cada día, en `ponerAlDia`), sueldos (al pagarse), gastos y proveedor.

### 2. El empleado repone los estantes desde tus depósitos (`src/negocio-propio-reposicion.js`)

- Al empezar su turno (una vez por día y por empleado) y **sólo mientras vos no estás** (es parte de las ventas sin vos de `empleados-negocio.js`), el de turno agarra de los depósitos con tope que tengas **a menos de 45 m del local** (no de donde estés vos): la barraca de materiales, la pila y el depósito de piedra, el silo. **Lo que repone sale de verdad del depósito** (`almacen-juego.js`: `depositosDe` usa las mismas `totales` y `gastar` de siempre).
- Qué se repone: lo que el local vende **y** algún depósito guarda. En el **almacén de campo**: troncos, tablas, piedras, lana (barraca / pilas / depósito) y papas (silo). La **panadería no aplica** (nada de lo que vende se guarda en depósitos): el panel lo dice y no ofrece el botón.
- Cuántos lotes por turno: `round(1 + 7 × rendimiento)`, o sea de **5** (rinde ~60 %) a **7** (~85 %), de a un lote del mercado (`lote` de comercio.js), siempre el estante **más vacío primero**, sólo los que están por debajo del 60 % del tope, sin pasar el tope del estante (6 lotes).
- Panel de empleados: **«Reposición automática desde tus depósitos: sí / no»**, con cuántos depósitos hay cerca y lo que tienen, y el botón «Apagar / Activar la reposición». Un local nuevo arranca en «sí»; una partida de antes, en «no» (no le saca nada de los depósitos a nadie sin avisar).
- Al volver, el resumen cuenta lo repuesto: «Repusieron los estantes con lo de tus depósitos: 6 troncos de leña, 6 tablas y 6 piedras».

### 3. Pedido al proveedor (`src/negocio-propio-reposicion.js`)

- Botón **«Pedir al proveedor ($X)»** en el panel del local. Surte los estantes comprando al **precio de plaza + 20 %**, **hasta $3.000 por día**, sin pasar de los estantes llenos y sin pasar de la plata (caja + billetera). Reparte lote a lote entre los estantes más vacíos (a igual llenura, el más barato: así trae más variedad).
- Se paga de la **caja del local primero** y, si no alcanza, de la **billetera con motivo «Proveedor»** (`economia.pagar`). El panel muestra siempre el total, el precio de mercado, el recargo y cuánto queda de tope por hoy; al llegar al tope, el botón se apaga y el panel lo explica.
- No hay arbitraje: cada producto sale más caro que lo que vendés «barato» y más caro que lo que te paga el mercado si se lo devolvés.

### 4. Lo que no cambia
Estado de los estantes, precios, reputación, la caja con tope de $12.000, los sueldos, las reglas de los empleados (`EMP_LOCAL` y demás se **dejaron igual**: la prueba de la 4.4 exige que un recién llegado venda ≤ 65 % de lo que vendés vos, y está en 63 %).

## Equilibrio: antes y después (`herramientas/simulador-negocio-propio.mjs 60`)

Ganancia por día **sobre vender lo mismo al mercado** (la medida de siempre; el jornal ronda $3.200/día). «Antes» = 4.4.0, sin gastos; «después» = 4.4.1.

**Atendiendo vos, precios normales**

| | antes | después | se paga el local en |
|---|---|---|---|
| Almacén, surtido bueno | $1.563 | **$1.313** (gastos $250) | 21 días |
| Panadería, surtido bueno | $1.409 | **$1.209** (gastos $200) | 30 días |
| Almacén, surtido chico (huerta y recolección) | $496 | **$246** | 114 días (antes 61) |
| Panadería, surtido chico | $571 | **$371** | 97 días |
| Almacén, sólo pan y huevos | $96 | **−$154** (pierde) | nunca |

**Con un empleado, sin vos en el local** (amigo, 12 días de trabajo)

| | antes | después |
|---|---|---|
| Almacén, pintora ($600/día) | $572 | **$322** |
| Almacén, padre ($700/día) | $429 | **$179** |
| Almacén, madre ($1.000/día) | $339 | **$89** |
| Panadería, pintora | $365 | **$165** |
| Panadería, padre | $341 | **$141** |
| Panadería, madre ($1.100/día) | $41 | **−$159** |
| Almacén, padre y madre (dos, 40 días) | $1.039 | **$789** |
| Almacén, madre y panadera (dos, 40 días) | $663 | **$413** |

**Todo el surtido del proveedor** (plaza + 20 %, tope $3.000 por día), atendiendo vos, ganancia antes de gastos / después

| | normales | caros | baratos |
|---|---|---|---|
| Almacén | −$130 / **−$380** | +$438 / **+$188** | −$526 / −$776 |
| Panadería | −$125 / **−$325** | +$407 / **+$207** | −$540 / −$740 |

Lectura honesta:
- Un local **bien surtido y atendido por vos** sigue siendo muy bueno (−16 % / −14 % por los gastos; se paga en 21 y 30 días de juego).
- Un **surtido chico** rinde la mitad que antes y tarda 2 a 4 meses en pagarse; con **dos productos** pierde. **No llega a perder** con el surtido chico de huerta y recolección (+$246 / +$371): para que perdiera, los gastos tendrían que pasar de $500, fuera de los $200 a $400 que se pidieron. Decisión: dejar los gastos por tipo en la parte baja del rango y que el surtido chico simplemente rinda poco.
- **Con un empleado** el margen sobre el mercado baja en $250 / $200 por día: la pintora y el padre quedan en +$140 a +$320; la madre en el almacén, en +$89. **La panadería con la madre (la más cara) pierde** (−$159): ya rendía ~$41 sin gastos. Es la única combinación que cambia de signo. No se tocó el rendimiento ni el sueldo de nadie (la prueba de 4.4 acota lo que puede vender un empleado); se probó subir `EMP_LOCAL` (clientes y propina) y rompía esa cota, así que se descartó. Con un empleado ya no hay que surtir a mano todos los días: con la reposición desde depósitos y el pedido al proveedor se mantiene sin tu mano, y eso no está en el simulador.
- **El proveedor es una comodidad cara**: con precios normales cada unidad se vende por menos de lo que costó (−4 %), sólo deja ganancia con precios caros (a costa de clientes) y el tope diario alcanza para el 5 % (almacén) o el 10 % (panadería) de llenar todos los estantes de cero.
- No se simuló el costo de la reposición desde depósitos: esos materiales ya los tenés y se «venden» al precio del local; el simulador los cuenta como siempre al valor que tendrían en el mercado.

## Archivos

Nuevos: `src/negocio-propio-gastos.js`, `src/negocio-propio-reposicion.js`, `pruebas/verificar-4-4-1-gastos.mjs` (registrada en el `verify`), `pruebas/humo-4-4-1-gastos.cjs` (partida real), este informe.

Tocados (**compartidos**: `negocio-propio.js`, `negocio-propio-juego.js`, `empleados-negocio.js`, `empleados-negocio-juego.js`, `almacen-juego.js`, `main.js`, `package.json`):
- `src/negocio-propio.js`: el campo `fin` (valores por defecto), `ponerAlDia` anota las ventas del día cerrado, `cerrarLocal` salda la cuenta, el cartel y la cola respetan «cerrado por deuda», el aviso de la E.
- `src/negocio-propio-juego.js`: el cobro diario, la sección de finanzas, «Pedir al proveedor», «Pagar la deuda», el aviso de los gastos al abrir y al desarmar.
- `src/empleados-negocio.js`: `repuestoDia` por empleado, `pend.repuesto`, la reposición dentro de `simularTramo`, los sueldos al balance, el resumen al volver.
- `src/empleados-negocio-juego.js`: el acceso a los depósitos del local y la sección «Reposición automática».
- `src/almacen-juego.js`: `cercaDe` y `depositosDe` (depósitos cerca de un punto, incluido el silo).
- `src/main.js`: una línea (`almacen: () => almacenJuego` para los empleados). `src/plantilla.html`: dos reglas de CSS para la línea de deuda. `package.json`: la prueba nueva en el `verify`. `guardado.js` **no se tocó** (el saneo vive en `negocio-propio.js` y `empleados-negocio.js`).
- `herramientas/simulador-negocio-propio.mjs`: la sección 4.4.1 (gastos, proveedor) y `EMP_LOCAL` por variable de entorno para probar otros valores.
- Pruebas viejas ajustadas lo mínimo: `verificar-4-4-empleados.mjs` (el `pend` de la prueba de guardado trae el campo nuevo) y `verificar-4-3-empleo.mjs` (la versión exigía `4.3.0` y fallaba desde la 4.4.0, antes de este cambio).

## Guardado

Campos nuevos con valor por defecto: `negocioPropio.fin = { activa, ultimo, deuda, reponer, dias[], prov{dia,gastado}, total{} }` y, por empleado, `repuestoDia`; `empleadosNegocio.pend.repuesto`. Una partida de antes se carga igual: sin deuda, con la reposición apagada y, si el local estaba abierto, pagando gastos desde el día siguiente. Todo saneado (basura, ida y vuelta) y probado.

## Verificación

- **Verificado**: `verificar-4-4-1-gastos.mjs` (352 comprobaciones: gastos por tipo, cobro, caja y billetera, libro, varios días, deuda y cierre, balance, reposición, proveedor, guardado, el juego con un contexto de mentira y el cableado). Partida real en Electron oculto (`humo-4-4-1-gastos.cjs`): abrir el local con una barraca cerca, un día con gastos de la caja y de la billetera, la deuda y el local cerrado, pagarla, el pedido al proveedor y su tope, Gladys reponiendo desde la barraca (se vació de verdad), el resumen al volver, apagar la reposición, el balance, guardar y recargar. Capturas a 1366×768 en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\gastos\`.
- **Razonado, no probado en la partida real**: la panadería con el panel «no aplica» (sí lo cubre la prueba de Node con el DOM de mentira). Nota de la herramienta: en esta máquina la ventana oculta queda en 870×473 aunque se pida 1366×768, así que las capturas salen por el depurador de Electron a 1366×768.
- **No verificado**: el ritmo real del cobro en una sesión larga de varios días de juego seguidos; la sensación de los números (hay que jugarlo).

## Lo que NO quedó
- La reposición automática no aplica a la panadería (no hay depósitos para lo que vende).
- El cartel 3D del local no tiene un tercer estado «deuda»: con deuda que lo cierra se ve el cartel de «cerrado» (rojo, toldo caído); el motivo se lee en el aviso de la E y en el panel.
- No se subió la versión ni se tocaron `guardado.js`, otras ramas ni el repo principal.
