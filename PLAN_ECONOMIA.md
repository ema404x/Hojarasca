# Plan del sistema de economía (Hojarasca 3.8.8 → 3.9)

Decidido con el usuario:
- **Economía viva de la aldea**: locales y vecinos con oferta, demanda y caja propias.
- **Sólo pesos**: la yerba deja de ser la moneda y pasa a ser un bien más. **Lo que se tiene de yerba se convierte a pesos**, a **$100 por yerba**.
- **Ingresos:** vender lo que se produce, trabajos con sueldo, encargos y pedidos, y negocio propio o alquiler.
- **Gastos:** materiales y herramientas, y terrenos y casas. Sin impuestos ni deudas.
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
- Un jornal ≈ $1.500; un encargo ≈ $400 a $2.500; alquiler de un cuarto ≈ $150 a $400 por día.
- Casas: a decidir en la Fase 5 (hay que subir el costo por encima de los materiales; ver el punto 2 de arriba).

## Riesgos
- **Arbitraje:** comprar barato en un local y vender caro en otro. El simulador lo busca antes de cada fase.
- **Inflación:** si hay plata y nada en qué gastarla, deja de importar. Los terrenos y las casas son el pozo principal.
- **Migración:** la conversión de yerba toca partidas ya guardadas. Se prueba con guardados viejos antes de soltarla.
- **Peso del cálculo:** el cierre diario recorre unos 25 locales; es barato, pero se mide.
- **No se probó en el juego real:** todo se verifica en Node y con vistas previas.

## Qué falta decidir en la Fase 1
- Si el saldo se muestra siempre en el HUD o sólo en un panel.
- El nombre exacto de la moneda ("pesos") y cómo se escriben los montos ($1.200).
- Si la billetera tiene tope.
