# Zona A — Negocio propio, empleados, compra de negocios, sociedad y pesos (4.4.1, rama v44-integra)

Revisión de sólo lectura sobre `C:\Users\Andres\Documents\Hojarasca\trabajo\t44-integra`. No toqué nada del repo. Todo lo que corrí está en esta carpeta (`t1.mjs` … `t17.mjs`).

Cómo repetir las pruebas: están en `C:\Users\Andres\Documents\Hojarasca\trabajo\bugs44`. Las que tocan `negocio-propio-juego.js` / `empleados-negocio-juego.js` importan `planos-negocio.js`, que importa `three`, y `node_modules` no lo trae. Por eso armé un "shim":

```
cd C:\Users\Andres\Documents\Hojarasca\trabajo\bugs44
node mkthree.mjs                       # genera three-shim.mjs a partir de three-r186-inline.js
node --import ./reg.mjs t6.mjs         # las que usan los módulos *-juego.js
node t1.mjs                            # las de módulos puros no necesitan el shim
```

Leyenda: **[V]** = lo ejecuté y se reproduce. **[R]** = razonado leyendo el código (no lo ejecuté).

Resultado corto: no encontré nada de gravedad ALTA (no hay pesos que se creen de la nada ni se pierdan por el camino normal). Hay 4 MEDIA y 6 BAJA. Lo que el gate de 256 pasos no cubre y salió: un autosave síncrono por segundo, el negocio que se cierra solo al mover un local, `alDesarmar` que toma cualquier local por el activo, y la forma de no pagar sueldos.

---

## MEDIA

### A1 · Autosave síncrono una vez por segundo mientras estás lejos con empleados  [V]
- Archivo: `src/empleados-negocio-juego.js`, línea 225:
  `if (E.sim.n % 5 === 0 && !presente && hayPendiente(E)) ctx.guardar?.();`
- Qué pasa: la idea era "guardar cada 5 ventas simuladas", pero `E.sim.n` sólo cambia cuando se vende algo. Si `n` es múltiplo de 5 (incluido el 0 de un empleado recién contratado) y hay algo pendiente de contar (por ejemplo un sueldo ya pagado), esa condición queda verdadera en cada pasada de 1 s. Cada `guardar()` es un guardado **inmediato y síncrono** de `localStorage` (main.js:9070, el autosave diferido no aplica a los explícitos). Pasa toda la noche, con el local cerrado, o todo el día si el local no vende, hasta que volvés a menos de 35 m (ahí `contarSiVolviste` limpia `pend`).
- Reproducción: `t12.mjs` (con `reg.mjs`): empleado contratado, jugador a 200 m, `E.sim.n = 5`, sueldo pendiente. Resultado: **60 guardados en 60 s sin vender nada**. En `t16.mjs` escenario "lejos": 1322 guardados contra 102 en "cerca".
- Corrección: guardar sólo si cambió `E.sim.n` desde el último guardado (`if (E.sim.n !== ultimoGuardadoN && E.sim.n % 5 === 0)`), o sacar ese guardado: `avisar` y `contarSiVolviste` ya guardan en los eventos que importan.

### A2 · Mover el local propio con un segundo local de otro tipo cierra el negocio en silencio  [V]
- Archivo: `src/negocio-propio-juego.js`: `local()` (líneas 46-53, excluye `ob.editando`) + `prepararTipoSiHaceFalta` (222-225) + `prepararTipo` (70-75) → `cerrarLocal`.
- Qué pasa: el juego avisa que "un segundo local se queda de adorno". Pero mientras movés (Shift+Y) el local activo A, `local()` devuelve el otro (B). Como `est.tipo` (almacén) no es el tipo de B (panadería), `prepararTipo` llama a `cerrarLocal`: devuelve el stock a la mochila (`ctx.dar`, **sin ninguna nota**), retira la caja a la billetera, paga o **perdona** la deuda de gastos (`cerrarCuenta`), apaga el cartel (`abierto=false`), pone `fin.activa=false` (vuelve el "día de gracia") y deja `est.tipo = 'panaderia'`. Al terminar el movimiento vuelve A y se repite lo mismo al revés. Los empleados siguen contratados pero ahora trabajan en otro tipo de local, con otras afinidades.
- Reproducción: `t6.mjs`. Salida: `--- moviendo A: ... tipo panaderia stock {} caja 0 fin.activa false devuelto [["huevo",30],["harina",10]] pesos 53000`.
- Corrección: no reasignar el local activo mientras uno está `editando`: que `local()` devuelva el mismo cacheado (o `null`) cuando el activo es el que se mueve, o que `esActivo` recuerde cuál es el "dueño" del estado (guardar la obra o su x/z) y `prepararTipo` sólo se llame desde la E.

### A3 · `alDesarmar` trata cualquier local como "el activo" si la caché está vacía  [V]
- Archivo: `src/negocio-propio-juego.js` línea 398: `const activo = cacheLocal ? cacheLocal.datos === d : true;`
- Qué pasa: con `cacheLocal === null` cualquier local que se desarme (aunque sea el de adorno, o una marca sin terminar) cierra la cuenta del local activo: devuelve stock y caja, perdona/paga la deuda, `tipo = null`. En el tick siguiente `empleados-negocio-juego.js` (líneas 206-212) ve `!est.tipo` y **despide a todos los empleados sin pagar** y borra lo pendiente. Cuándo la caché está vacía: (a) `desalojarObras` al cargar la partida (main.js:828) corre antes del primer tick; si el crecimiento de la aldea tiene que desarmar un local, cae acá; (b) mientras movés el local activo (A2) y desarmás otro.
- Reproducción: `t7.mjs`: almacén abierto con stock, caja y deuda, juego recién armado, `alDesarmar(datosDeLaPanadería)` → `tipo null, stock {}, caja 0, deuda 0, activa false`, nota "Cerró tu local… Pagaste los $100 que debías".
- Corrección: comparar siempre contra la obra que tiene el estado (guardar la x/z o una marca en `datos`), y si `cacheLocal` es null llamar a `local()` antes de decidir. Si ninguna obra terminada coincide, no hacer nada.

### A4 · Se puede no pagar sueldos despidiendo y recontratando antes de que empiece el turno  [V]
- Archivos: `src/empleados-negocio.js` `despedir` (líneas 218-231, paga sólo si `hora >= v[0]`) y `contratar` (190-205, deja `pagadoDia: dia` = "día de prueba").
- Qué pasa: despedir a las 8:00 (antes de las 8:30) no paga nada, y recontratar al mismo tiempo deja ese día como "de prueba" sin sueldo. Repetido cada mañana (o a las 10:00 con el turno de 11 a 21) el empleado trabaja gratis todos los días. Lo único que se paga es la amistad: `despedido: -6` por vuelta.
- Reproducción: `t1.mjs`. 10 días de trabajo: **$0 pagados** con el ciclo contra **$9.000** del control honesto (y 10 `despedidos` anotados, 0 días de trabajo del empleado).
- Corrección: hacer que el "día de prueba" sólo exista una vez por vecino (guardar `E.pruebaUsada[k]` o `ultimaAlta`), o cobrar el día completo al despedir si el turno de ese día todavía no pasó; no resetear `pagadoDia` a `dia` en recontrataciones del mismo día.

---

## BAJA

### A5 · Un empleado guardado sin `pagadoDia` cobra todos los días desde el 1 de golpe  [V]
- Archivo: `src/empleados-negocio.js` línea 148 (`pagadoDia: Math.min(hoy, entero(v.pagadoDia))`, el vacío da 0) + loop de sueldos (líneas 324-345, sin tope de días).
- Pasa sólo con un guardado roto o editado a mano, pero el costo es enorme. `t4.mjs`: `{k:'madre'}` en el día 200 → 172 pagos y **$172.000** de la billetera en un tick.
- Corrección: si falta `pagadoDia` ponerlo en `hoy`; y limitar los días que se pagan de una vez (por ejemplo a `AUSENCIA_MAX_DIAS + 1`).

### A6 · Mientras movés el local se congelan gastos, sueldos y ventas, y después se ponen al día juntos  [R]
- `negocio-propio-juego.js` línea 174 (`if (!o) {…return}` antes de `cobrarDia`) y `empleados-negocio-juego.js` línea 214 (`if (!o) return`).
- Pasa sólo si dejás una edición abierta varios días de juego. Al volver: gastos de máximo 7 días (el resto se perdona), pero los sueldos de todos los días se pagan antes de evaluar la ausencia (`dia - E.visita > 5` renuncia), o sea pagás todo y los despedís.
- Corrección: correr `cobrarDia` y la parte de sueldos aunque no haya obra (sólo la parte visual necesita `o`).

### A7 · El vecino que "se va" ignora el cumpleaños y el baile del sábado  [R]
- `aldea.js:2030`: el desvío `'plaza'` (de 9 a 19, no domingo) va **antes** de la fiesta de cumpleaños (línea 2085) y del baile del sábado de 17 a 19 (línea 2100). Para los cinco que pueden irse (panadera, pescador, apicultor, tejedora, herrero) en su cumpleaños de 18 a 19 queda en la plaza mientras la fiesta es en otra parte, y el sábado de 17 a 19 no baila. (Los empleados sí lo respetan: `enTurno` excluye la fiesta de su cumpleaños.)
- Corrección: en `fijarRutina` (negocios-vecinos-juego.js:53) devolver null en el rato de la fiesta (`HORA_FIESTA` si `esCumpleanos`) y el sábado de 17 a 19; o mover el desvío después de esos bloques.

### A8 · Con "hora de tu reloj", dormir antes de medianoche hace vender dos veces el mismo día a los empleados  [R]
- Con `ajustes.duracion === 'reloj'`, al dormir de noche el juego hace `progreso.dia++` y la hora real vuelve a pisar `horas` (main.js:1305-1310 y 9685-9690). Para `abs = dia*24 + horas` eso es un salto de +24 h; `simularTramo` simula entero el día siguiente (8 a 21 h) de golpe. A medianoche `horas` vuelve a 0 sin `dia++` (la noche ya está dormida), `abs` retrocede 24 h (`E.sim.ultima = abs`) y el mismo día vuelve a simularse al pasar el día real. Los sueldos no se duplican (`pagadoDia`), las ventas sí, sólo si estás lejos.
- Corrección: en `avanzarEmpleados`, no simular el tramo cuando `abs - E.sim.ultima` sea de más de unas horas y tenga origen en un cambio de día por dormir; o guardar el día simulado hasta (`E.sim.diaHasta`) y no repetir.

### A9 · Un turno del empleo fijo en curso sigue después de comprarle el local al jefe  [R]
- `empleo.js:214` bloquea fichar en un local comprado (`motivo 'tuyo'`) pero `puedeFichar` devuelve `'activo'` antes si ya hay un turno en curso; `hacerTarea` y `cerrarTurno` no miran `comprados`. Si cerrás la compra con un turno activo ahí, seguís cobrando el sueldo de la jefa que ahora es tu empleada.
- Corrección: al cerrar la compra, llamar a `cerrarTurno(p, 'tiempo')` si `turno.local === id`. Tampoco se bloquea el empleo para quien sólo es socio (ver pregunta 4).

### A10 · Shift+E junto al local abre su panel aunque haya otros paneles del HUD abiertos  [R]
- main.js:3181: la guarda es sólo `!enElAlmacen`. Con feria, puesto de cargas, banco, cocina, taller o fiestas abiertos (y el local cerca) se abre también el panel del local encima. Además `negocioJuego.usar(o, true)` no mira `panelDelHudAbierto()`.
- Corrección: usar `panelDelHudAbierto()` (que ya incluye el del local) en la guarda.

### A11 · El cliente o empleado más cercano tapa a cualquier vecino de verdad  [R]
- main.js:10268-10270: `gente.cerca()` devuelve uno solo y si es cliente o empleado se anula (`vecino = null`) en vez de pedir el siguiente. Con tres clientes en el mostrador, un vecino que viene a verte no se puede charlar si algún cliente está más cerca.
- Corrección: que `gente.cerca` acepte un filtro (`!clienteNegocio && !empleadoNegocio`).

---

## Lo que revisé y está bien (para no repetirlo)

- Fuzz de los tres saneadores (`sanearNegocioPropio`, `sanearEmpleadosNegocio`, `sanearNegociosVecinos`): 20.000 corridas con NaN, Infinity, -5, strings, arrays, objetos vacíos y 1e30 en cada campo, y después `cobrarGastos`/`avanzarEmpleados`/`pasarDia` encima. Cero excepciones y sin invariantes rotas (`t8.mjs`). Un guardado de antes sin campos arranca limpio; el Desafío queda `undefined` en los tres (guardado.js:648-655).
- Compra y sociedad (`t3.mjs`): 300 corridas de 60 acciones al azar (entrar de socio, aviso, cancelar, comprar, retirar, saltos de hasta 60 días). Nunca comprado y socio a la vez, cajas siempre ≥ 0 y ≤ tope, billetera sin NaN ni negativos. El crédito del aporte nunca supera lo aportado; la devolución al retirarse tampoco.
- Ventas simuladas por empleados (`t9.mjs`, 400 corridas): la variación de la caja coincide exacto con `res.ventas`, la suma por empleado también, `caja ≤ 12000`, stock sin ceros ni negativos. El pedido al proveedor respeta tope diario, plata disponible y tope de estante; lo que sale de caja + billetera coincide con el total.
- Voces de los 8 negocios: están todas las reacciones, `cierre.queda`/`cierre['se-va']` donde hace falta, y los marcadores `{x}` son sólo los que el código llena (`t10.mjs`). El panel del local y el de empleados, dibujados con un DOM falso en 7 estados (con deuda, cerrado por deuda, con empleados, lista de contratar…), no muestran "undefined", "NaN" ni "[object" (`t14.mjs`).
- Bucle largo de 60 días con local, empleados, cola y jugador cerca/lejos/mixto/pobre (`t16.mjs`): sin excepciones, sin pesos negativos, la deuda y las renuncias (impago y ausencia) siguen las reglas.
- Todos los ids de `NEGOCIOS` existen como edificios de la aldea (para el cartel); los de `PUESTOS` de `empleo.js` coinciden con los de `NEGOCIOS`.
- Lucrecia: si es tu novia/comprometida/casada tiene voz propia y descuento (−8 / −15 %), separada +15 %, y el precio queda siempre entre 80 % y 145 % de la lista. Se queda de empleada en todos los casos (`puedeIrse: false`).

---

## Preguntas de diseño (no son bugs confirmados)

1. **Pedir al proveedor + «Sacar toda la mercadería» es una tienda de materiales.** El almacén de campo vende troncos, tablas, piedras y lana; el pedido las compra a plaza + 20 % (hasta $3.000 por día) y «Sacar» las pasa a la mochila. Salteás las estaciones de la trochita (que además venden algunas más baratas). ¿Es intencional o conviene que lo comprado al proveedor no se pueda sacar?
2. **Sueldos con el local cerrado.** Los empleados cobran de lunes a sábado aunque el local esté cerrado por vos o por la deuda de gastos (y el sueldo agrava la deuda). ¿Se pagan o no?
3. **Sociedad contra compra.** Tres sociedades al 40 % rinden el 100 % (sin factor de cartera ni de gestión), se retiran con el 100 % del aporte después de 36 días y se pagan en los mismos ~83 días que comprar. Comprar no tiene ventaja de rendimiento, sólo el cartel y la caja propia. ¿Está bien que dominen?
4. **Cuando comprás el almacén, la casa de té o la cantina** seguís pagando tus consumos y las cajas viejas de la aldea (`negocios.js`, `cajas`) siguen existiendo por separado de la caja del negocio comprado. ¿Debería ser gratis o con descuento comer en tu casa de té?
5. **Al desarmar el local** se despide a todos sin pagar la jornada en curso y se borra el resumen "mientras no estabas" (ventas ya cobradas en la caja, que sí vuelve). Y la deuda de gastos pendiente se perdona si no alcanza para pagarla (un truco barato: acumular 5 días de deuda y desarmar).
6. **Día de gracia del local**: dura hasta la medianoche. Abrir a las 23:50 cobra gastos diez minutos después.
7. **Demanda y propina de los empleados** usan la cantidad contratada (×1,35 con dos), aunque a esa hora esté de turno uno solo.
8. **Los vecinos "idos" en la plaza (9 a 19, menos domingos)**: ¿siguen ofreciendo sus servicios (afilado, venta) allí? No lo verifiqué en el juego.
9. **El "se va" y el "contratado" se pueden combinar** (comprás la herrería, Anselmo "se va", y además lo contratás): cobra un sueldo extra además del que ya descuenta el negocio comprado. ¿Se bloquea?
10. **Cartel «de Bruno»**: `negocios-vecinos-juego.js` admite `ctx.nombre` pero main.js nunca lo pasa, así que siempre dice «de Bruno». Si es a propósito, sacar el parámetro.
11. La voz `retiro.sale` de los ocho vecinos nunca se usa (el retiro sólo muestra la nota del HUD).

## Lo que no alcancé a revisar

- Nada corrido en el juego real con Electron (sólo Node con DOM y `gente` falsos): la animación de los clientes y empleados, cómo reaparece en la aldea un vecino al despedirlo a mitad de turno, o el que entra al turno estando en otra parte.
- El solapamiento de empleado ausente con `amor.js` (`rutinaPareja`/citas en la cantina entre 20:30 y 21:00 para los de turno 2) y con `vecindad.js` (visitas).
- `banco.js` es el banco de pruebas de fps (recorrido guionado), no el banco del juego; el banco real (`prestamos.js`, `banco-*.js`, `abonarAlMoroso` en rentas) quedó fuera.
- Geometría y colisión de `planos-negocio.js` (sólo leí las medidas y los sitios de cliente), mallas y fugas de `negocios-vecinos-mundo.js`.
- Internos de `almacen.js` (sólo leí `depositosDe`/`gastar`): no vi un caso de "vaciar de más" y no encontré ningún concepto de "reservado" en esos módulos.
- Efecto de esquinas del reloj acelerado ×40 (sentado) en conjunto con las ventas simuladas: lo razoné pero no lo simulé.
