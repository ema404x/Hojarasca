# Números de la economía (Fase 0)

Generado por `herramientas/simulador-economia.mjs` con el comercio, la feria, los trueques y las casas del juego tal como están hoy.

## 1. Valores base, en pesos (1 yerba = $100)

| Bien | De dónde sale | Lote | Valor del lote | Por unidad |
|---|---|---|---|---|
| Troncos | material | 2 | $300 | $150 |
| Tablas | material | 4 | $400 | $100 |
| Piedras | material | 4 | $400 | $100 |
| Cristales | material | 1 | $800 | $800 |
| Vellones de lana | material | 2 | $600 | $300 |
| Huevos | entrada | 6 | $500 | $83 |
| Habas | entrada | 4 | $400 | $100 |
| Papas | entrada | 4 | $400 | $100 |
| Frutillas | entrada | 5 | $400 | $80 |
| Frascos de miel | entrada | 1 | $600 | $600 |
| Truchas frescas | entrada | 2 | $500 | $250 |
| Truchas ahumadas | entrada | 1 | $600 | $600 |
| Frascos de dulce | entrada | 1 | $700 | $700 |
| Calafates secos | entrada | 1 | $500 | $500 |
| Llao llao seco | entrada | 1 | $600 | $600 |
| Panes caseros | entrada | 3 | $600 | $200 |
| Empanadas | entrada | 4 | $700 | $175 |
| Medidas de harina | cosa | 4 | $500 | $125 |
| Ponchos | cosa | 1 | $2.000 | $2.000 |

## 2. Materiales de las obras (a valor base, sin margen ni mano de obra)

| Casa | Materiales | Costo en materiales |
|---|---|---|
| Cabaña de tablas y piedra | 24 piedra, 22 tronco, 58 tabla | $11.500 |
| Casa con galería | 32 piedra, 33 tronco, 100 tabla | $18.150 |
| Casona de dos cuartos | 48 piedra, 50 tronco, 150 tabla | $27.300 |

Los 31 muebles nuevos cuestan entre $100 (Almanaque de pared) y $2.900 (Cama doble); la mediana es $1.150.

## 3. Lo que hoy se paga en yerba (ofertas de la feria y trueques)

| Oferta de feria | Da el jugador | Recibe |
|---|---|---|
| poncho-yerba | 1 poncho | 16 yerba = $1.600 |
| huevos-habas-guiso | 3 huevo, 3 haba | 8 yerba = $800 |
| pan-yerba | 3 pan-casero | 10 yerba = $1.000 |

| Trueque | Pide | Por |
|---|---|---|
| Hacha de mano | 2 canto, 8 ramita | una vez |
| Mosca de pescar atada a mano | 5 calafate, 2 pluma | una vez |
| Farol de kerosene | 3 canto, 6 ramita | una vez |
| Manta de lana tejida | 4 pinon, 3 frutilla | una vez |
| Un kilo de yerba | 5 frutilla, 2 canto | repetible (da 8) |
| Grabador de mano | 2 frasco-frutilla, 2 pluma | una vez |
| Botas de goma | 2 calafate-seco, 1 hongos-secos | una vez |
| Tijera de esquilar | 2 canto, 1 pluma | una vez |
| Un kilo de harina | 2 pinon, 1 canto | repetible (da 4) |
| Semillas de habas | 3 calafate, 2 ramita | repetible (da 3) |
| Papa para semilla | 3 pinon, 1 canto | repetible (da 2) |
| Un kilo de azúcar | 2 pinon, 3 ramita | repetible (da 4) |
| Sal gruesa | 1 canto, 2 ramita | repetible (da 6) |
| Cacao amargo | 3 calafate, 1 pluma | repetible (da 3) |
| Maíz blanco pisado | 3 pinon | repetible (da 4) |
| Porotos | 2 calafate, 1 canto | repetible (da 3) |
| Reloj de bolsillo | 3 canto, 2 pluma | una vez |
| Almanaque de pared | 2 pinon, 5 ramita | una vez |

## 4. Arbitraje entre paradas con el comercio de hoy

| Ruta (compra → vende) | Ganancia media por día | Mejor día |
|---|---|---|
| Apeadero de la Casa de Té → Apeadero del Pescador | $1.350 | $1.900 |
| Apeadero de la Casa de Té → Parada Alta | $1.333 | $1.700 |
| Aldea de los Duendes → Apeadero de la Casa de Té | $1.233 | $2.200 |
| Parada Arrayanes → Apeadero de la Casa de Té | $1.083 | $1.800 |
| Aldea de los Duendes → Parada del Mallín | $1.008 | $1.800 |
| Aldea de los Duendes → Parada del Mirador | $917 | $1.600 |
| Parada del Mallín → Aldea de los Duendes | $783 | $1.500 |
| Estación del Valle → Parada del Mallín | $758 | $1.100 |

Con la plata en yerba, la ganancia media de una ruta cualquiera es $228 por día y la mejor, $1.350. (Se mide con TODOS los bienes y los 6 lotes diarios de cada uno, sin límite de carga ni de tiempo de viaje.)

Comprar y vender en el mismo andén siempre pierde (bien).

## 5. Días de ingreso para pagar los materiales de cada casa

| Casa | a $1.500/día | a $3.000/día | a $5.000/día |
|---|---|---|---|
| Cabaña de tablas y piedra | 8 días (0.7 años) | 4 días (0.3 años) | 3 días (0.3 años) |
| Casa con galería | 13 días (1.1 años) | 7 días (0.6 años) | 4 días (0.3 años) |
| Casona de dos cuartos | 19 días (1.6 años) | 10 días (0.8 años) | 6 días (0.5 años) |

Un año del juego son 12 días.

