# 4.21.0 · A · Plata pareja

Rama `v4210-a` (sale de `main` = 4.20.0). Aplica el paquete «4.21.0 · Plata pareja» de `AUDITORIA_4_20_0_A.md` con la tabla de valores del informe. Cada cambio es un número o una fórmula de una línea; no se tocó la cadena grande de las noches (R12), ni el Desafío (es la 4.22.0), ni los archivos de la Historia (los premios en pesos de la Historia son de B).

## Qué cambió (todo con los valores del informe)

| Qué | Antes | Ahora | Dónde |
|---|---|---|---|
| Fletes, carga | `3 + 3·t` yerbas × 100 | **`1 + t`** escalones de $100, en pesos | `src/comercio.js` (`fletesDelDia`) |
| Fletes, pasajeros | `2 + ⌈0,8·c⌉ + 2·t` yerbas × 100 | **`1 + ⌈0,4·c⌉ + t`** escalones de $100, en pesos | `src/comercio.js` |
| Cómo se pagan los fletes | `premio.yerba`, cobrado con `aPesos` (× 100) | **`premio.pesos`** (`COMERCIO.fletePaso` = 100) y `pesosDeFlete` / `textoFlete(f).pesos` | `src/comercio.js`, `src/comercio-mundo.js` |
| Caja de cada puesto, reposición por día | $700 | **$450** | `src/mercado.js` (`cajaDia`) |
| Sueldos del turno (× 1,25, redondos a $50) | almacén 1600/2100/2700 · casa de té 1600/2000/2600 · taller 1800/2300/2800 · banco 1700/2200/2800 | **2000/2650/3400 · 2000/2500/3250 · 2250/2900/3500 · 2150/2750/3500** | `src/empleo.js` |
| Tablón, multiplicador por distancia | ×1,5 / ×2 / ×2,5 | **×1,3 / ×1,6 / ×2** | `src/tablon.js` |
| Poncho en invierno | × 1,45 | **× 1,25** | `src/comercio.js` (`TEMPORADA.invierno`) |
| `XP.remo` | 1 | **4** | `src/oficios.js` |

Los comentarios de `puestos-ruta.js` y de `comercio.js` que decían «$700 por día» ahora dicen $450.

### Los fletes, en detalle

- Antes cada flete guardaba `premio: { yerba: N }` y el juego lo cobraba como `N × $100`: un número que quedó de cuando la yerba era la moneda. Ahora guarda `premio: { pesos: N, material? }` con `N` entero y múltiplo de $100, y el panel y el aviso muestran ese monto en pesos.
- La fórmula es entera: `1 + t` (carga) y `1 + ⌈0,4·c⌉ + t` (pasajeros), con `t` = paradas hasta el destino y `c` = pasajeros; cada escalón vale `COMERCIO.fletePaso` = $100. Un flete rinde de $200 a $1.400 (promedio $709); antes de $600 a $3.300 (promedio $1.704).
- **Partidas viejas:** un flete en curso guardado con `premio.yerba` se pasa a pesos al cargar (`sanearFlete`: yerba × $100, mismo techo de 99 yerbas = $9.900) y se paga lo que prometía; si el flete todavía trae `yerba` (por ejemplo, cargado a mano), `textoFlete` y `pesosDeFlete` lo traducen igual. No hay clave nueva de guardado: cambia el contenido de `comercio.fletes[].premio`, y el saneo lo migra solo. `c.ganado` sigue contando en unidades de yerba (pesos / 100), como las ventas.
- La Historia no dice cuánto pagan los fletes en ningún texto (el capítulo `ramal` sólo pide «Entregá dos fletes manejando»), así que no hubo que tocar textos: lo que cambia es lo que cobra el jugador (dos fletes: unos $1.400 en 10 minutos, antes $3.400).

## Antes y después (volviendo a correr las herramientas de la auditoría)

Salidas completas en `C:\Users\Andres\AppData\Local\Temp\hx\a\` (`*-antes.txt` y `*-despues.txt`).

**Fletes** (`auditoria-4-20-a-fletes.mjs`; anillo de 2.283 m, 11 paradas, 10 m/s, 57 s por parada):

| | Antes | Después | Informe (propuesta) |
|---|---|---|---|
| Por vuelta (14,3 min), sin furgón | $10.870 | **$4.580** | $4.580 |
| Por hora, sin furgón | $45.751 | **$19.277** | ~$19.300 |
| Por hora, con furgón de carga | $82.716 | **$31.346** | ~$31.300 |
| Por día de manejo, sin / con furgón | $22.894 / $41.553 | **$9.606 / $15.712** | — |
| Un flete suelto | $1.704 (de $600 a $3.300) | **$709 (de $200 a $1.400)** | — |

**Ritmo y catálogo** (`auditoria-4-20-a-ritmo.mjs 36`; días hasta juntar los $1.142.300 de las obras con pesos, y pesos por día en los días 20 a 40):

| Perfil | Días al catálogo antes → ahora | Por día antes → ahora | A las 3 horas antes → ahora |
|---|---|---|---|
| Tranquilo | 290 → **254** | $3.768 → **$4.363** | $19.500 → $22.350 |
| Medio | 176 → **171** | $5.695 → $5.928 | $30.950 → $31.300 |
| A fondo | 83 → **100** | $13.400 → **$10.913** | $104.150 → $91.100 |
| **Cociente tranquilo / a fondo** | **3,5 → 2,54** | | |

El resultado de las herramientas **coincide con la variante «final» de la 4.20.0** (que se aplicaba en memoria): la cuenta de los módulos reales da lo mismo que decía el informe. La cabaña se alcanza al día 30 (tranquilo), 24 (medio) y 10 (a fondo); la casona, al 108, 78 y 43.

**Mercado** (`auditoria-4-20-a-mercado.mjs 60`): el ingreso sostenido visitando 3 puestos por día pasa de $7.670 a $4.947; el techo (11 puestos) de $7.700 a $4.950. Poncho: se venden de 0,4 a 0,5 por día (eran de 0,5 a 0,7); el poncho de invierno cae de unos $4.700 a $4.000 en el Apeadero del Faro y de $4.400 a $3.800 en la Estación del Valle.

**Oficios** (`auditoria-4-20-a-oficios.mjs`): el navegante llega al nivel 5 con **200 tramos = 5.000 m** (antes 800 tramos = 20.000 m); los umbrales por nivel pasan de 40/120/260/480/800 a 10/30/65/120/200 tramos. La experiencia que ya tenía una partida vieja no se toca.

**Sueldos** (misma herramienta): el turno de aprendiz ($2.000 a $2.250) pasa a pagar más que un jornal ($1.385 de promedio) y el piso del jugador tranquilo sube de $3.800 a $4.400 por día.

## Lo que se dejó como estaba (decisiones)

- **`hechosPorNivel` del jornal (3 → 2):** el informe lo marca «sólo calidad de vida» (efecto de $0 a $40 por día) y no está en el paquete que pidió el brief; queda como estaba.
- **El tope del tablón** (`pagoMin` 700 / `pagoMax` 2200): no se tocó. Con los multiplicadores nuevos el encargo más caro paga $1.750 y el techo de $2.200 deja de alcanzarse (sigue como tope).
- **Renta de casas, precios de cuatro obras, valor de la granja, cristales, curva del Desafío:** son de la 4.22.0 y la 4.23.0 del plan del informe.
- **Premios de la Historia en pesos y metas con plata:** son de B (los pide el brief en su reparto).

## Pruebas

- **Nueva:** `pruebas/verificar-4-21-0-a.mjs` (en `verify:pasos`, al final): la fórmula de los fletes contra cuentas a mano en 60 días × 6 paradas, el rendimiento por hora con la herramienta real, la migración de un flete guardado con la clave vieja, el cobro al llegar con el panel real del puesto de cargas (mundo de mentira), la caja de $450, la tabla exacta de sueldos, los tres tramos del tablón, el poncho, el remo, y el simulador (días al catálogo y cociente). Resultado: 1.504 verificaciones.
- **Mutaciones:** `pruebas/mutaciones-4-21-0-a.mjs` (fuera del gate): 22 mutaciones sobre copias de `src/` (una carpeta y un proceso por cada una); la copia sin mutar pasa y todas las mutaciones fallan (resultado al final de este documento).
- **Pruebas viejas que se ajustaron a propósito** (contaban valores que cambian): `verificar-4-3-empleo` (sueldos del almacén y escala de la economía: $2.000 a $3.500; tope del mejor día $5.500; los cobros proporcionales y las multas con los sueldos nuevos), `verificar-4-4-2-empleo` (la tabla de cuatro puestos y los cobros de los cierres), `verificar-4-6-puestos` (caja de $450), `verificar-4-6-gente` y `verificar-4-11-2-gente` (tablón ×1,3 / ×1,6 / ×2 y el pago más caro de $1.750), `verificar-2-9-tren` (el premio de un flete es `pesos`).
- **Barrido:** se corrieron las 136 pruebas `verificar-*.mjs` que nombran comercio, mercado, tablón, empleo, oficios, economía o trochita (más las que se ajustaron): todas en verde después de los ajustes. **No se corrió `npm run verify` completo** (lo pide el brief).
- `humo-2-9-tren.cjs` (partida real, fuera del gate) todavía habla de «yerba» en el cobro de los fletes y ya estaba desactualizado desde la 3.8.8 (la billetera es en pesos): no se tocó ni se corrió.

## Lo que no se vio

- **A ojo, en partida real:** no se manejó la trochita en Electron. El cobro de `llegar` se prueba con el panel real (`crearPuestoDeCargas`) y un mundo de mentira, y el rendimiento con los módulos reales; el aspecto del panel (el texto «hasta X · pagan $Y») es la misma línea de antes con otro número.
- **Tiempos reales:** la herramienta usa los tiempos supuestos del informe (75 s por hora de juego, 57 s por parada, 10 m/s); si se miden en partida cambian las columnas «por hora», no los pesos por día.
- **Claves nuevas de guardado:** ninguna. `comercio.fletes[].premio` pasa de `{ yerba }` a `{ pesos }`; lo guardado antes se migra al cargar.

## Resultado de las mutaciones (`node pruebas/mutaciones-4-21-0-a.mjs`)

Copia sin mutar: pasa. **22 de 22 atrapadas**: carga vuelve a `3 + 3·t`; pasajeros vuelve a `2 + ⌈0,8·c⌉ + 2·t`; pasajeros con 0,5 en vez de 0,4; el escalón en $300; el premio vuelve a la clave `yerba`; se pierde la migración de la clave vieja; la yerba vieja se paga a $1; el texto no traduce la clave vieja; el texto vuelve a decir «de yerba»; `llegar` vuelve a cobrar `yerba × 100`; la caja a $700 y a $300; los cuatro puestos con sus sueldos de antes y el banco con × 1,5; los tramos del tablón de antes y sólo el tramo lejano en ×2,5; el poncho de invierno ×1,45; `XP.remo` 1 y 2.
