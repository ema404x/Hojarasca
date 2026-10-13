# Plan del sistema de economía (Hojarasca 3.8.8; hecho y decidido)

**Estado (3.8.8): todas las fases están hechas** (1 el peso, 2 el mercado, 3 los jornales, 3b el banco, 4 los pedidos, 5 la propiedad, 6 la aldea viva, 7 el pulido). Lo que se decidió sobre la marcha está en `CAMBIOS_3_8_8.md`: el jornal no gasta tiempo del reloj sino un cupo diario; el gerente es **Amadeo Lezcano**; el interés es 2 % por día (3 % si vence); «conseguirle cosas a muy buen precio» se hizo como **abastecimiento** (+25 a +40 %), **confirmado**; las casas cuestan $36.000, $66.000 y $110.000 de terreno y mano de obra además de los materiales. **Se vio en el juego real** (`herramientas/partida-real-economia.cjs`, 27 pasos: el banco, el gerente, el mostrador, un préstamo, un jornal y una etapa de casa con precio); falta ver las casas terminadas, el alquiler y el puesto propio. Lo de abajo es el plan original; donde dice «propuesta» o «a confirmar» se dejó la decisión final entre paréntesis.

Decidido con el usuario:
- **Economía viva de la aldea**: locales y vecinos con oferta, demanda y caja propias.
- **Sólo pesos**: la yerba deja de ser la moneda y pasa a ser un bien más. **Lo que se tiene de yerba se convierte a pesos**, a **$100 por yerba**.
- **Ingresos:** vender lo que se produce, trabajos con sueldo, encargos y pedidos, y negocio propio o alquiler.
- **Gastos:** materiales y herramientas, y terrenos y casas. Sin impuestos. (Las deudas entran sólo por el banco: ver más abajo.)
- **Un banco en el pueblo** (pedido después): préstamos con intereses y negocios con el gerente; edificio de piedra de pueblo patagónico; lo atiende un vecino nuevo, el gerente; está desde el día 1.
- **Por ahora sólo en el Relax** (el Desafío sigue sin economía, como hoy el comercio).
- Se avanza como recomiende el asistente: por fases, cada una jugable sola.

## Lo que ya existe (y se reutiliza)
| Pieza | Qué hace hoy | Qué pasa con ella |
|---|---|---|
| `comercio.js` | 19 bienes, precio por parada, estación y día; margen 12 %; el precio corre 8 % por lote; 6 lotes por día; fletes | Es la base del mercado. Pasa a cobrar en pesos y a tener caja y existencias por puesto. |
| `feria.js` | Cada 5 días, 4 cambios del día | Las ofertas que pagan yerba pagan pesos. |
| `trueque.js` | El almacén de Ercilia cambia cosas por lo que se junta | Los repetibles (yerba, harina, azúcar…) pasan a tener precio en pesos; los de una vez siguen como trueque. |
| `aldea.js` (mandados, avistajes, pan, frutos) | Pagos sueltos en yerba, cada uno con sus reglas | Se unifican en un solo pagador de pesos. |
| `encargos-temporada.js` | Encargos de dos por estación, que piden trabajo nuevo | Base del sistema de encargos pagos (Fase 4). |
| `planos-casas.js`, `LOTES_ALDEA` | Tres casas prefabricadas y lotes | Salen a la venta con precio. |

## Lo que midió el simulador (Fase 0, ver `ECONOMIA_NUMEROS.md`)
`node herramientas/simulador-economia.mjs` usa el comercio real del juego.
1. **El comercio de hoy no tiene plata gratis**: comprar y vender en el mismo andén siempre pierde. Entre paradas, la ruta media rinde unos **$228 por día** y la mejor unos **$1.350** (con todos los bienes y los 6 lotes diarios, sin límite de carga ni de viaje). Es un ingreso legítimo del orden de un jornal, no un defecto.
2. **Las casas cuestan poco en tiempo de juego**: los materiales de la cabaña son **$11.500**, los de la casa con galería **$18.150** y los de la casona **$27.300**. Con $1.500 por día salen en **8, 13 y 19 días**. Como **un año del juego son 12 días**, la cabaña se paga en 8 de 12 días: el precio de venta tiene que sumar el terreno y la mano de obra para que sea una meta de varios años.
3. **Los muebles nuevos** cuestan entre $100 y $2.900 en materiales (mediana $1.150): son compras chicas, buen gasto diario.
4. **Hoy se paga en yerba** poco y con números redondos (poncho = 16 yerba = $1.600; pan = 10; guiso = 8).

## Reglas de diseño
1. **Una sola puerta**: todo cobro y pago pasa por `economia.js` (`cobrar`, `pagar`, `movimientos`). Nadie toca el saldo a mano.
2. **Todo se explica**: cada movimiento tiene fecha, motivo y a quién va, y se ve en un libro de cuentas.
3. **Módulos puros** (sin DOM ni three), probados en Node, como el resto del juego.
4. **Determinismo**: los precios salen de la fecha y el nombre del lugar, como hoy: dos partidas el mismo día ven lo mismo.
5. **Sin plata gratis**: el simulador corre antes de cada fase y busca ciclos de ganancia.
6. **Sólo Relax**: todo el sistema se apaga en el Desafío.
7. **Migración reversible** hasta que la economía esté probada: la yerba vieja se convierte una sola vez y queda registrada.

## El banco del pueblo (decidido con el usuario)
- **Qué hace:** presta pesos con intereses y ofrece negocios: el gerente consigue pedidos "a muy buen precio" (son los pedidos de **abastecimiento**, mejor pagados que los comunes: **confirmado con el usuario**).
- **Edificio:** banco de pueblo patagónico de piedra (fachada con frontón y columnas, rejas, reloj). Se arma con las mismas herramientas que los demás edificios de la aldea (`aldea-arquitectura.js`).
- **Personal:** un vecino nuevo, el gerente, con casa, rutina y charla propias.
- **Cuándo:** desde el principio (edificio inicial, como la estación y el almacén). Sin los pesos (Fase 1) no tiene qué hacer: el edificio y el personal pueden ir antes, pero las funciones llegan con la economía.
- **Dónde toca el código** (por lo que cuesta hoy un local como la costurería): `aldea.js` (plano, vecino, rutina, usos), `aldea-arquitectura.js`, `aldea-gente.js`, `aldea-mecanicas.js` y `-mundo.js`, `aldea-mundo.js`, y el guardado. Unos 7 archivos más pruebas y traducción.

**Reglas del préstamo** (propuesta, a ajustar con el simulador):
- Tope según la reputación con el banco (crece con las entregas y las cuotas pagadas); el primer préstamo es chico.
- Interés de 2 % **por día sobre el saldo** (**decidido**; un año del juego son 12 días: un préstamo de $3.000 a un año devuelve $3.810, un 27 %, porque se compone). **Pago libre** (de a poco o todo junto), sin cuota diaria.
- Sin embargos ni pérdida de casas (**confirmado con el usuario**): si no se paga a tiempo, el interés pasa al 3 %, el banco pierde confianza y no presta hasta que saldes; el alquiler que cobrás paga primero la deuda. El Relax no castiga con ruina.
- Un solo préstamo a la vez al principio.
- El gerente avisa antes de cada vencimiento.

**Los negocios con el banco:**
- Pedidos de abastecimiento: el banco necesita X (tablas, lana, harina…) para sus clientes y paga por encima del mercado, con plazo.
- Se apoyan en el mercado (Fase 2) y en los encargos (Fase 4): el pago "muy bueno" es una prima sobre el precio de mercado de hoy (**decidido**: +25 % a +40 % según la confianza del banco, un pedido por ventana de dos días para que no sea una máquina de plata).

**Riesgo propio del banco:** un préstamo con interés bajo y un negocio con prima alta pueden formar un ciclo de ganancia (pedir prestado → cumplir el pedido → repagar). El simulador lo prueba antes de soltarlo.

## Fases
**Fase 1 · El peso y la billetera**
- `src/economia.js`: saldo, libro de movimientos, redondeo.
- Guardado: `progreso.economia`; migración: cada yerba → $100, una sola vez, con un registro en el libro.
- La yerba sigue existiendo como bien (para cocinar y regalar), pero deja de ser moneda.
- HUD: la billetera, un aviso "+$1.200 por …" y el libro de cuentas.
- Todos los pagos viejos en yerba se pasan a pesos con el mismo valor.

**Fase 2 · El mercado**
- Cada puesto y local con existencias y caja; precio = valor base × estación × oferta y demanda × día.
- Un local sin caja no compra; uno al que le falta algo lo paga mejor.
- Panel de precios y un cartel "hoy se paga bien …".

**Fase 3 · Trabajos con sueldo**
- Un oficio por día por local (cupo diario), con sueldo por oficio y por habilidad.
- Los vecinos también cobran y gastan.

**Fase 4 · Encargos y pedidos**
- Pedidos concretos de los vecinos con plazo, pagados según calidad y rapidez.
- Reputación por local, que desbloquea mejores encargos. Se apoya en `encargos-temporada.js`.

**Fase 3b · El banco (edificio, gerente y préstamos)**
- El edificio de piedra y el gerente (se pueden hacer apenas el peso exista).
- Préstamos con intereses y reputación.
- Pedidos de abastecimiento con prima (se suman a los encargos de la Fase 4).

**Fase 5 · Propiedad y negocio**
- Comprar lotes y casas (las tres prefabricadas), con un precio que suma terreno y mano de obra.
- Alquilar cuartos a los vecinos que llegan, con renta diaria.
- Un puesto propio en la feria.

**Fase 6 · La aldea viva**
- Cierre diario por local: producción, consumo, sueldos y precios.
- Eventos que mueven precios (el tren no llegó, la fiesta sube la demanda, el invierno encarece la leña).

**Fase 7 · Pulido**
- Balance con el simulador, textos en español e inglés, pruebas de libro y mercado, y documentación.

## Números de partida (a ajustar con el simulador)
- $100 por yerba. Poncho ≈ $2.000; tabla ≈ $100; tronco ≈ $150; lana ≈ $300.
- **Final (3.8.8):** un jornal paga de $700 a $1.300 de base (+10 % cada tres jornales del oficio, hasta +50 %); los pedidos pagan de 10 a 22 % más de lo que valen (hasta +27 % con la rapidez); el alquiler es $300, $500 y $800 por día según la casa.
- **Casas (Fase 5):** $36.000, $66.000 y $110.000 de terreno y mano de obra, más los materiales; con todo junto, un jugador goloso ahorra ≈ $3.230 por día (`herramientas/simulador-negocios.mjs`): la cabaña en ≈ 15 días (1,2 años del juego), la casa con galería en ≈ 26 y la casona en ≈ 42.

## Riesgos
- **Arbitraje:** comprar barato en un local y vender caro en otro. El simulador lo busca antes de cada fase.
- **Inflación:** si hay plata y nada en qué gastarla, deja de importar. Los terrenos y las casas son el pozo principal.
- **Migración:** la conversión de yerba toca partidas ya guardadas. Se prueba con guardados viejos antes de soltarla.
- **Peso del cálculo:** el cierre diario recorre unos 25 locales; es barato, pero se mide.
- **Poco visto en el juego real:** casi todo se verifica en Node; se recorrió una partida real automática (ver arriba), pero no las casas terminadas ni el alquiler.

## Lo que había que decidir en la Fase 1 (todo decidido)
- El saldo se ve en una línea del HUD cuando hay plata o un cambio reciente, y siempre en la pausa, en «Billetera y movimientos».
- La moneda es el peso y los montos se escriben $1.200. La billetera tiene techo (sin saldos negativos ni decimales).
- El gerente es **Amadeo Lezcano**; el interés es 2 % por día (3 % si vence); y «conseguirle cosas a muy buen precio» es el abastecimiento.
