# Auditoría 4.20.0 · A · Equilibrio y economía

Rama `v4200-a` (sale de `main` = 4.19.0). **No se cambió el juego**: se sumaron nueve herramientas de medición en `herramientas/` (`auditoria-4-20-a-*.mjs`, fuera del gate) y este informe. Todo se midió en Node con los módulos reales (`comercio`, `mercado`, `economia`, `trabajos`, `empleo`, `pedidos`, `prestamos`, `tablon`, `oficios`, `oficios-propios`, `aldea`, `construccion`, `desafio-reglas`, `desafio-vuelta`…). No se usó Electron.

## Lo que hay que saber en cinco líneas

1. **Manejar la trochita paga $45.700 por hora real** (una vuelta de 14 min deja unos $10.900): 1,4 veces lo que da jugar a fondo ($32.000 por hora de juego) y 5 veces lo de un jugador tranquilo ($9.000), sin tope diario ni cajas. Los fletes se pagan en «yerba × 100», un número que quedó de cuando la yerba era la moneda.
2. **El mercado de los puestos absorbe hasta $7.700 por día** (11 puestos × los $700 que se repone cada caja): es la fuente más grande y la que más separa a los jugadores: el que vende excedente junta el catálogo de obras con pesos en 83 días de juego; el que sólo hace turno y un jornal, en 290 (3,5 veces).
3. **La Historia no usa la plata**: pide $13.750 de materiales (81 tablas, 25 troncos, 19 piedras) y $400 en pesos; sus premios en «yerba» (26 yerbas, $2.600 que no valen nada) son de la época anterior a los pesos. A las 3 horas el jugador tiene $19.500 a $30.000 y nada que comprar hasta el Acto III.
4. **El Desafío se aplana y se achica solo**: de la noche 11 a la 19 la oleada crece 3,7 % por noche con la cantidad clavada en 18; el primer mandamás es un salto de 3,6 veces (627 → 2.286 de vida); la cantidad choca con el tope de 24 en la vuelta 3 y las vueltas siguientes sólo suman vida y daño (esponjas).
5. **Las semillas doradas sobran desde la noche 6 a 7** (todo lo que se compra con ellas suma 66; las oleadas ya soltaron 93 a la noche 7 y 499 a la 20), así que perder los cristales al caer no cuesta nada pasada la mitad de la campaña.

## Cómo se midió

| Herramienta | Qué mide |
|---|---|
| `auditoria-4-20-a-valores.mjs` | valor base de cada bien y razón de cada cambio (vecinos, talleres, recetas, feria, tablón) |
| `auditoria-4-20-a-mercado.mjs` | cuánto se puede vender por día con las existencias, el corrimiento por lote y la caja reales de cada puesto |
| `auditoria-4-20-a-ritmo.mjs` | un día de juego de tres jugadores (tranquilo, medio, a fondo) con los topes reales de cada fuente; curva de las primeras horas y día en que se alcanza cada meta; `--variante=` aplica la tabla nueva en memoria |
| `auditoria-4-20-a-propuesta.mjs` | las variantes de valores (se aplican en memoria; el juego no se toca) |
| `auditoria-4-20-a-fletes.mjs` | una vuelta al anillo cargando y entregando con las reglas reales de `comercio.js` |
| `auditoria-4-20-a-oficios.mjs` | acciones hasta cada nivel de cada oficio |
| `auditoria-4-20-a-planos.mjs` | precios de las obras contra la regla de `PRECIOS_CONSTRUCCION.md` |
| `auditoria-4-20-a-historia.mjs` | lo que la Historia le pide a la economía |
| `auditoria-4-20-a-desafio.mjs` y `-desafio-propuesta.mjs` | presión por noche, cristales, defensas; y la curva con tres números nuevos sobre una copia de `src/` |

**Qué es medido y qué es supuesto.** Los pesos de cada fuente, los topes diarios y las curvas salen de los módulos reales. Los **tiempos** son supuestos que se marcan: 1 hora de juego = 75 s (día de 30 min: lo dice el código), un día jugado durmiendo a tiempo ≈ 25 min reales, un jornal ≈ 60 s, el turno ≥ 240 s (8 tareas de 0,4 h: lo dice el código), 150 s por puesto del mercado. Si mañana se mide el tiempo real de cada cosa, sólo cambian las columnas «por minuto» y «por hora»; los pesos por día no. El viaje del refugio a la aldea (632 m, 3,3 min a pie a 3,2 m/s) **no** está contado en ninguna cifra de este informe.

## Los topes de cada fuente (con el pueblo completo)

| Fuente | Tope por día | Pesos por día | Minutos (supuesto) |
|---|---|---|---|
| Turno de empleo | 1 (no los domingos), ocupa uno de los 2 jornales | $1.550 (aprendiz) a $2.800 (encargado) | ≥ 4 |
| Jornal | 2 por día (el turno cuenta uno) | $1.385 cada uno ($700 a $1.950 con nivel) | 1 |
| Pedidos de vecinos | 2 por día, uno por vecino cada 3 días | $810 netos comprando la mercadería | 0,8 cada uno |
| Abastecimiento del banco | 1 cada 2 días | $183 | 0,8 |
| Tablón | 1 por día | $1.225 netos | 0,7 |
| Mercado de los puestos | techo sostenido $7.700 (11 × $700) | hasta $7.700 | 2,5 por puesto |
| Fletes manejando | 22 ofrecidos por día (44 con furgón) | $10.870 por vuelta de 14,3 min | 14,3 |
| Alquiler de casas | 1 por casa | $300 / $500 / $800 | 0 |
| Talleres y negocios | ver hallazgo 7 | $775 a $2.500 por tanda; negocios $1.250 a $2.400 | — |

**Los gastos corrientes son casi nulos**: la cantina cobra de $120 a $900, el local propio $250 por día. No hay nada que se coma la plata de un día: lo único que gasta son las compras grandes (obras, negocios) y el préstamo.

## Hallazgos por impacto

### 1. Los fletes pagan de 1,4 a 5 veces lo que cualquier otra cosa del juego (y no tienen tope)

- **Dónde:** `src/comercio.js:320` (pasajeros: `2 + ⌈0,8·c⌉ + 2·t` yerbas) y `:324` (carga: `3 + 3·t`), con `t` = paradas hasta el destino; se cobran en `src/comercio-mundo.js:244` con `aPesos` (cada yerba = $100).
- **Evidencia** (`auditoria-4-20-a-fletes.mjs`; anillo de 2.283 m, 11 paradas, 10 m/s, 57 s por parada): un flete suelto paga **$1.704** (de $600 a $3.300). Una vuelta (14,3 min) entrega 6,7 fletes: **$10.870 por vuelta, $45.700 por hora de manejo**. Con el furgón de carga (5 a la vez, 4 por parada): 12,3 fletes, **$19.650 por vuelta, $82.700 por hora**. Un día de juego entero manejando suma $22.900 (sin furgón) o $41.500 (con furgón), contra $3.800 a $5.700 por día del empleo y los pedidos (4 a 6 veces). Aun frenando 90 s por parada son $33.300 por hora.
- **Por qué:** los premios están en yerbas desde la 2.9 (un poncho valía 20) y en la 3.8.8 se convirtió 1 yerba = $100 sin tocar los fletes; los jornales y los sueldos se pusieron directo en pesos. Un flete de 5 paradas paga como un poncho.
- **Propuesta:** carga `1 + t`, pasajeros `1 + ⌈0,4·c⌉ + t` (siguen siendo yerbas enteras). Queda **$19.300 por hora sin furgón y $31.300 con furgón**, al nivel de jugar a fondo ($26.000 a $32.000 por hora de juego) y sin pasarlo. Alternativa sin tocar la fórmula: multiplicar por 0,45 (da $20.600 y $37.200).
- **Ojo:** la Historia pide «Entregá dos fletes manejando» (capítulo `ramal`): hoy paga unos $3.400 en 10 minutos; con la fórmula nueva, unos $1.400. Hay que decirlo en los textos si se cambia.
- **Costo:** dos líneas más las pruebas de fletes (`verificar-2-9-tren`, `verificar-2-9-maquinas`, `verificar-3-7-3-tren`, `verificar-3-8-8-economia`). Medio día.

### 2. El mercado: un techo de $7.700 por día que decide todo el ritmo

- **Dónde:** `src/mercado.js:18` (`cajaDia: 700`) y `cajaMaxima` (de $4.000 a $8.000 por puesto, $5.000 en los de ruta).
- **Evidencia** (`auditoria-4-20-a-mercado.mjs`, 60 días, mercadería infinita): con 3 o más puestos por día el ingreso sostenido es **$7.670 a $7.710 sin importar cuántos más visites** (11 × $700 = $7.700); con 1 puesto por día rotando, $5.800. Las cajas arrancan con **$37.600** repartidos (de un máximo de $65.600), así que el primer día se pueden sacar unos $30.000 con lo que se lleve. Un solo bien se agota antes: de ponchos sólo se venden **0,6 por día** ($2.000) aunque el telar grande haga 2 a 6.
- **Qué provoca:** el jugador que vende excedente junta $13.400 por día contra $3.800 del que sólo hace turno y un jornal. En horas: el catálogo de obras con pesos ($1.142.300 con las casas, la escritura y el puesto) se junta en **83 días de juego (35 h) a fondo, 176 (73 h) a ritmo medio, 290 (121 h) a ritmo tranquilo**. Un cociente de 3,5 entre el que más hace y el que menos.
- **Referencia vieja:** `PRECIOS_CONSTRUCCION.md` calibra todo contra «$3.200 por día», y `ECONOMIA_NUMEROS.md` (Fase 0, de antes de las cajas) dice que la mejor ruta de arbitraje rinde $1.350 por día. Con las cajas, el techo del mercado es 6 veces eso y 2,4 veces la referencia.
- **Propuesta:** `cajaDia` 700 → **450** (techo de $4.950 por día) y sumar el empleo (hallazgo 6). Resultado en la tabla de más abajo: el cociente baja de 3,5 a 2,5.
- **Costo:** una constante y las pruebas de mercado (`verificar-3-8-8-mercado`, `verificar-4-6-puestos`). Media hora.

### 3. La Historia no usa la plata; la plata, a su vez, no ayuda a la Historia

- **Evidencia** (`auditoria-4-20-a-historia.mjs`): los objetivos obligatorios piden 81 tablas, 25 troncos y 19 piedras (banco de carpintero, mesa y sillas, alero, molino de agua, galponcito, estufa, leña, deuda): **$13.750 a valor base**, unos 3 a 5 días de ingreso tranquilo, o unos 15 minutos de tala (un árbol da 4 troncos; en el banco, 4 tablas por tronco). Pesos que pide: **$400** (las puntas de Anselmo, Acto III). Pesos que da: $3.000 (sólo con la majada vendida) y $900 (Tito). El resto de los premios son materiales chicos, cosas y **26 yerbas** (`src/historia.js:394, 416, 464, 488, 509, 541`).
- **La yerba no vale nada:** desde la 3.8.8 no está en `BIENES`; la feria no la paga; nadie la pide en pedidos ni tablón; sólo se cebra. El almacén todavía la vende por trueque (5 frutillas y 2 cantos por 8).
- **Consecuencia:** a las 3 horas el jugador tranquilo junta $19.500 y el medio $30.950; la primera compra con sentido (escritura $8.000, establo, puesto de la feria) cae entre las horas 1 y 3. Hasta el Acto III no hay nada que pedirle a la plata: el ritmo de la Historia lo ponen las estaciones, las horas y los vecinos (zona B), no la economía.
- **Propuesta:** (a) convertir los premios `cuenta: { yerba: N }` en `pesos: N × 100` (26 yerbas = $2.600: coherente con la economía); (b) un premio en pesos por capítulo, del orden de un día de ingreso tranquilo ($1.500 a $2.500 según el acto) para que el dinero «llegue» con la historia; (c) pensar con B metas con plata dentro de la Historia (arreglar el techo del refugio con teja $2.800, la escritura, el establo) para que los pesos tengan un lugar en el relato.
- **Costo:** (a) y (b), una tarde más las pruebas de los premios; (c) es diseño, va con la mejora de metas de B.

### 4. El Desafío: la curva se aplana, tiene un salto y se rompe contra el tope

- **Dónde:** `src/desafio-reglas.js:195` (`Math.min(18, 3 + (noche-1)·2)`), `:244` (`multiplicadorNoche`: +8 % lineal), `:180` (`TOPE_OLEADA = 24`); `src/desafio-vuelta.js:22`.
- **Evidencia** (`auditoria-4-20-a-desafio.mjs`, normal; vida total de la oleada con todos los multiplicadores): noches 1 a 5: 120, 367, 494, 627, **2.286**; 6 a 10: 1.565, 1.957, 2.265, 2.621, **4.056**; 11 a 14: 2.763, 2.982, 2.958, 3.078; 15 a 20: **4.999**, 3.320, 3.441, 3.759, 3.682, **5.942**.
  - La cantidad llega a 18 en la noche 9 y **no se mueve más** hasta la 20 (sólo suben el enjambre cada tres noches y los dos o tres tipos nuevos): de la 11 a la 19, **3,7 % de vida por noche**.
  - El primer mandamás (noche 5) es un salto de **3,6 veces** sobre la noche 4 (627 → 2.286: el jefe más tres brutos); los de la 10, 15 y 20 son de 1,5 a 1,6. Es el momento más duro de la campaña y llega a eso de las 2,5 horas de juego; después las noches comunes valen menos que la anterior (−32 a −34 % después de cada jefe).
  - **Vueltas:** `+20 % de cantidad` por vuelta ya choca con el tope de 24 en la **vuelta 3** (noche 10); de ahí en más cada vuelta sólo suma `+25 % de vida` y `+15 % de daño`: en la vuelta 10 la noche 20 trae la misma cantidad que en la 3 pero con 3,7 veces la vida (22.088 contra 5.942). Es una esponja, no una dificultad nueva.
  - **Dificultades:** Implacable llega al tope de 24 en la noche 8 (cantidad ×1,4) e Implacable en Pesadilla al de 31 también en la 8: de ahí en más la cantidad extra se pierde y queda sólo la vida y el daño (el enjambre va aparte del tope).
- **Defensas contra el daño a obras** (noche 10, normal, si pega un tercio de la oleada a la vez): una empalizada aguanta 2 s, el muro de piedra 5, el muro almenado 8, la torre de vigía 4. El diseño no es una carrera de resistencia de obras: es matar rápido. (Peor caso; no considera el camino ni la puntería.)
- **Propuesta** (probada en `auditoria-4-20-a-desafio-propuesta.mjs` sobre una copia de `src/`): (a) la cantidad máxima sigue creciendo 1 cada 2 noches después de la 9 (18 → 23 en la noche 19); (b) la dureza crece 10 % por noche desde la 11 (8 % hoy); (c) cada vuelta suma `+12 % cantidad, +15 % vida, +10 % daño` (antes 20/25/15). Resultado: **de la 11 a la 19 la vida total crece 6,1 % por noche (3,7 % hoy)**; la noche 20 queda en 7.265 de vida (+22 %); la vuelta 10 en 17.239 en vez de 22.088 y sin chocar con el tope hasta la vuelta 3. Las noches 1 a 10 no cambian.
- **No se pudo calibrar** contra el poder del jugador (no se midió cuánto daño por segundo tiene un jugador real en la noche 12 con lo que juntó): los tres números son perillas de forma, no de dificultad. Falta una corrida larga (`herramientas/soak-duendes.cjs`) o un humo largo con una partida «de nivel medio» para ponerlas.
- **No se toca** la cadena grande de las noches (R12), como pide el brief.
- **Costo:** tres líneas, las pruebas de `composicionOleada` y de la vuelta, y jugar. Un día más una tarde de partidas.

### 5. Semillas doradas: sobran, y perderlas no duele

- **Dónde:** `src/desafio-reglas.js:67-79` (`cristales` por tipo), `src/main.js:5170` (`M.cristal = 0` al caer).
- **Evidencia:** las recetas con cristal suman **38 cristales únicos** (once mejoras) y **4** repetibles a 1 cada una (cargas, flechas doradas, granadas, bengalas); los planos con cristal, **24** (escudo de energía 6, faro de plasma 5, baliza 4…). Las oleadas sueltan (esperanza matemática, si matás a todos): 13 a la noche 3, **52 a la 5, 93 a la 7**, 190 a la 10, 345 a la 15, **499 a la 20**. El mandamás suelta de 14 a 20 de una.
- **Qué provoca:** pasada la noche 6 a 7 no hay en qué gastar lo que se junta (salvo munición a 1 y planos que ya se hicieron), así que **perder todos los cristales al caer (única pérdida que depende del avance) se vuelve gratis**; lo único que cuesta caerse de ahí en más es el 30 % de tronco, tabla y piedra, que no depende de la noche y se recupera talando (ver el hallazgo 3).
- **Propuesta:** o un segundo escalón de mejoras (6 a 10 cristales cada una para las 11 únicas: serían ~80 cristales más, y se gastarían hasta la noche 12 o 13), o bajar los sueltos: brutos [2,3] → [1,2] y mandamás [14,20] → [8,12] sacan un tercio (499 → 334 a la noche 20), que **no alcanza solo**. Con la propuesta de los dos juntos, el cristal vale hasta casi el final.
- **Y el castigo de caer:** hoy es plano (30 % de materiales y todos los cristales) y la noche cuenta como pasada; no escala con la noche ni con el modo. Para «consecuencias» más justas: que el 30 % suba con la noche (20 % + 1 % por noche, hasta 40 %), y que se guarde un cuarto de los cristales en Tranquila.
- **Costo:** un día si es sólo bajar sueltos; el segundo escalón de mejoras es contenido nuevo (una versión de mecánica).

### 6. El empleo y los jornales: el turno es el peor negocio de tiempo

- **Dónde:** `src/empleo.js:43-79` (`sueldos`), `:19` (`tareasPorTurno: 8`, `horasPorTarea: 0.4`); `src/trabajos.js:10` (`JORNAL`).
- **Evidencia** (`auditoria-4-20-a-ritmo.mjs`): con el pueblo completo el turno ($1.550 por día de aprendiz, $2.700 de encargado) rinde **igual que un jornal ($1.385, $800 a $1.950)** pero lleva ≥ 4 minutos contra 1; dos jornales (cualquier par de locales abiertos) dan $2.771, y turno + 1 jornal $2.932. Sólo cuando el pueblo está a medio abrir (las cajas de los locales se vacían y no pagan jornales) el turno es lo que sostiene el ingreso: $1.550 contra $2.018 de dos jornales con 2 a 4 locales. El nivel de un local llega al tope a los 15 jornales en ese local: con dos jornales por día y veinte locales, **150 días**.
- **El pueblo llega de a uno:** cada vecino pide 4 etapas que terminan al día siguiente (≥ 4 días) más 1 día de espera: los veinte llegan en ≥ 100 días (33 h) y el último pide 86 anotaciones del cuaderno (hay 302). La obra del pueblo entero cuesta **292 piedras, 396 troncos y 597 tablas ($148.000 a valor base)**, todo del bolsillo del jugador. En los primeros 14 días (6 h) debería haber 1 a 3 locales con jornal abiertos (estimado por `LLEGADA`, no medido en partida): el ingreso de las primeras horas es el turno ($1.550) más un jornal que se paga de a ratos.
- **Propuesta:** sueldos del turno × 1,25 ($2.000, $2.600, $3.400 en el almacén: `src/empleo.js:43`, y los otros tres de la misma forma), con lo que el turno vuelve a pagar más que un jornal y sube el piso de un jugador tranquilo de $3.800 a $4.400 por día. Y bajar `hechosPorNivel` de 3 a 2 (el nivel del jornal se alcanza en 100 días: efecto de $0 a $40 por día; sólo calidad de vida).
- **Costo:** una tabla de cuatro filas y las pruebas del empleo (`verificar-4-3*`, `verificar-4-4*`). Una hora.

### 7. Talleres y obras: 12 pasan la regla de precios de la casa, y la salida es lo que les falta

- **Evidencia** (`auditoria-4-20-a-planos.mjs`, `auditoria-4-20-a-valores.mjs`): `PRECIOS_CONSTRUCCION.md` dice «pesos entre 1 y 4 veces los materiales»; de las 59 obras con pesos (suman **$916.300**, más las casas $212.000), **12 pasan de 4**: herrería propia 6,8, telar grande 6,7, araña de velas 5,7, cervecería 5,7, quesería 5,5, cantería 5,5, tienda de campo 5,1, reloj de pie 4,7, horno grande 4,4, carpintería 4,3, local de panadería 4,2, local de almacén 4,1. La cervecería ($42.000) cuesta más que la cabaña ($36.000).
- **Lo que rinden** (ganancia por tanda sobre vender las materias primas): telar grande $2.500 (5 vellones → 2 ponchos), horno grande $950, quesería $1.100, cervecería $775, cantería $300. Pero los ponchos del telar no tienen adónde ir: el mercado absorbe **0,6 por día** ($2.000) y se comparte con todo lo demás; la feria paga $1.600 o $1.400 por uno (0,8 y 0,7 de su valor). Los cuatro talleres suman salida real sólo por vías con tope propio (la tienda de campo 4 lotes por día, el puesto de la feria 2, el negocio propio ~6 clientes).
- **Retorno del alquiler:** $300, $500 y $800 por día sobre $36.000, $66.000 y $110.000 de pesos: **141 a 162 días**; un negocio comprado a un vecino se paga en 64 a 84 (`simulador-compra.mjs`). El alquiler es la inversión con peor retorno de las calculadas y casi no se nota en el ingreso ($300 contra $3.800 por día).
- **El banco:** el tope inicial es $3.000 (0,8 días de ingreso tranquilo); a los 3 a 5 días de juego ya no lo necesita nadie. No es un error: es una función de los primeros días.
- **Propuesta:** (a) bajar cuatro precios al borde de la regla: herrería propia $32.000 → $22.000, telar grande $36.000 → $26.000, cantería $18.000 → $14.000, quesería $24.000 → $20.000; (b) subir la renta al doble ($600, $1.000, $1.600: se paga en 70 a 80 días como un negocio); (c) darle al telar grande (y a los demás) una salida pública: que la tienda de campo y el puesto de la feria vendan lo que sale del taller.
- **Costo:** (a) y (b) cuatro y tres números con sus pruebas; (c) es mecánica.

### 8. Los cambios de los vecinos: las conversiones más grandes del juego viven en un solo cupo diario

- **Evidencia** (`auditoria-4-20-a-valores.mjs`): carpintero 6 troncos ($900) → 30 tablas ($3.000), razón **3,3** (`SERVICIO.tablasPorTronco: 5`, a mano salen 2 y en el banco 4); tejedora 2 vellones ($600) → poncho ($2.000), **3,3**; apicultor 3 tablas ($300) → 2 frascos de miel ($1.200), **4,0**; pan casero 2 harinas → 3 panes ($250 → $600, 2,4); empanadas 2,3; frasco de dulce de frutilla 2,2. Cada uno **una vez por día**.
- **El invierno:** el poncho vale ×1,45, la frutilla ×1,7, la lana ×1,4 (`src/comercio.js:98`): un poncho se vende en $4.400 a $4.700 en el Faro o la Estación, 2,3 veces su valor, y nada se echa a perder: guardar de verano a invierno rinde 2,3 veces (frutilla ×0,75 → ×1,7) con la caja como único freno.
- **Tablón y pedidos:** el tablón paga 1,6 a 2,8 veces el valor de lo pedido (los lejanos × 2,5), el mejor pesos por minuto del juego pero con tope de 1 por día; los pedidos de los vecinos y el abastecimiento del banco dejan $810 y $183 netos por día comprando la mercadería en el puesto más barato (que en verano sale a 0,6 a 0,86 del valor base).
- **No es un error:** son el valor agregado de oficios que el juego quiere premiar, con cupo. Pero **la regla «una vez por día» es lo único que las frena** y hay cinco vecinos con conversiones así (carpintero, pescador, tejedora, apicultor y panadera). Si el mercado baja (hallazgo 2) el ingreso total de estos baja con él, porque las ventas pasan por las mismas cajas.
- **Propuesta:** dejar tal cual; sólo mirar que `tejedora` pida 3 vellones (como el telar propio) si se quiere bajar el poncho (razón 2,2); y bajar el poncho de invierno de ×1,45 a ×1,25 (poncho a $3.600).
- **Costo:** dos constantes.

### 9. La granja y la cocina no producen nada que valga

- **Evidencia:** los once productos de la granja (leche, carne de vaca, de cordero, de cerdo, chorizo, manzana, pera, ciruela, cereza, frambuesa, grosella) **no están en `BIENES`**: no se venden ni los pide un pedido o un tablón. La obra completa (tambo, chiquero, paridera, 24 frutales) sólo rinde en la quesería (leche: $1.100 por tanda de 8 litros, un taller de $24.000) y en regalos y concursos. De las 10 recetas de pasos, **sólo el pan casero y las empanadas** (2,4 y 2,3 veces) convierten ingredientes en plata. Las otras ocho dan un «descanso» de 1 a 3 horas de buen paso: **los platos de carne (asado, cordero, locro, curanto) dan 3 y las mermeladas, el dulce de leche y la torta 1**, sin importar que el curanto pida mariscos, cerdo, chorizo y papas. La torta casera (4.19.0) se hace con harina, huevos y azúcar y sólo sirve para Herminia.
- **No es un error del equilibrio:** es un sistema de cocina y de vida, no de plata. Pero invierte mucha obra (11 productos, tambo, chiquero, paridera y 24 frutales) en cosas que el mercado ignora.
- **Propuesta:** darle valor a lo que la granja produce por lotes: leche lote 4 valor 3 ($75 el litro), carne lote 2 valor 7 ($350 el kilo), chorizo lote 3 valor 8, frutas lote 5 valor 4, mermelada lote 1 valor 5. Así el pedido de un vecino puede pedir carne y la granja se paga sola (4 litros por día de la vaca = $300 por día, como un jornal chico).
- **Costo:** `BIENES` y `PERFILES` de `comercio.js` más los textos; una versión de mecánica.

### 10. Los oficios: dos tienen una escalera desparejada

- **Evidencia** (`auditoria-4-20-a-oficios.mjs`): acciones hasta el nivel 5: hachero 67 árboles, picapedrero 89 pedreros, pescador 80 peces, obrero 80 etapas, huertero 100 siembras y cosechas, **cazador 200 duendes (sólo el Desafío)**, **navegante 800 tramos de 25 m = 20.000 m remados** (2,8 h seguidas en el kayak; `XP.remo: 1` por cada `METROS_REMO`). Los de empleo sólo piden nivel 1 (5 días) y 2 (14 días) para ascender.
- **Propuesta:** `XP.remo` 1 → 4 (5 km hasta el nivel 5, 45 min de remo). El cazador queda como está: es del Desafío.
- **Costo:** dos constantes y las pruebas de oficios. Media hora.

### 11. La feria y la yerba: moneda muerta

- **Evidencia:** la feria (15 ofertas, 4 por cada 5 días, una vez cada una) cambia lo que pone el jugador por entre 0,7 y 2,2 veces su valor: huevos y habas → guiso $1.200 (2,2), pan y huevos → 4 vellones (2,1), empanadas → tablas (1,9), pero poncho → $1.600 (0,8) y dos ponchos ($4.000) → una mosca de pescar que el almacén da por 5 calafates y 2 plumas. Es, como mucho, $4.000 a $5.000 por feria (unos $900 por día de media) y hay que tener justo lo que piden.
- **La yerba sigue de moneda en tres lados** (trueque del almacén, premios de la Historia, y el pago de los fletes con su ×100), sin comprador.
- **Propuesta:** sacar `ponchos-mosca` y `ponchos-farol` (la mosca y el farol se consiguen por trueque, más baratos) y dejar el resto.
- **Costo:** nada.

## Tabla de valores nuevos y simulación

Todas las filas se aplican **en memoria** con `auditoria-4-20-a-ritmo.mjs --variante=…`; los módulos reales hacen la cuenta. Días de juego, 25 min por día.

| Qué | Hoy | Propuesto | Dónde | Efecto simulado |
|---|---|---|---|---|
| Caja de cada puesto, reposición por día | $700 | **$450** | `src/mercado.js:18` | techo sostenido del mercado $7.700 → $4.950; el jugador a fondo pasa de $13.400 a $10.700 por día |
| Sueldos del turno (aprendiz/empleado/encargado) | 1.600/2.100/2.700 (almacén; los otros 3 parecidos) | **× 1,25** (2.000/2.600/3.400, redondo a $50) | `src/empleo.js:43,55,67,79` | tranquilo $3.768 → $4.363 por día; el turno ($1.938) vuelve a pagar más que un jornal |
| Tablón: multiplicador por distancia | ×1,5 / ×2 / ×2,5 | **×1,3 / ×1,6 / ×2** | `src/tablon.js:26` | el medio pierde $360 por día (de $1.225 a $856 de tablón); el tablón deja de ser el mejor pesos por minuto |
| Fletes, carga | `3 + 3·t` yerbas | **`1 + t`** | `src/comercio.js:324` | $45.700 → $19.300 por hora sin furgón |
| Fletes, pasajeros | `2 + ⌈0,8·c⌉ + 2·t` | **`1 + ⌈0,4·c⌉ + t`** | `src/comercio.js:320` | con furgón $82.700 → $31.300 por hora |
| Premios de la Historia en yerba | 26 yerbas (`cuenta`) | **pesos = yerbas × 100 ($2.600)** y un premio en pesos por capítulo | `src/historia.js:394…541` | de $0 a unos $15.000 a $25.000 en toda la campaña (4 a 6 días de ingreso tranquilo) |
| Poncho en invierno | × 1,45 | **× 1,25** | `src/comercio.js:98` | de $4.700 a $4.000 el poncho de invierno |
| Renta de casas | 300 / 500 / 800 | **600 / 1.000 / 1.600** | `src/propiedad.js:19-21` | se paga en 70 a 80 días, como un negocio |
| Precios: herrería, telar grande, cantería, quesería | $32.000 / 36.000 / 18.000 / 24.000 | **$22.000 / 26.000 / 14.000 / 20.000** | `obra-pesos` de cada plano | razón de 6,8, 6,7, 5,5 y 5,5 a 4,7, 4,8, 4,2 y 4,5 |
| `XP.remo` | 1 | **4** | `src/oficios.js:34` | nivel 5 de navegante: 20.000 m → 5.000 m |
| Cristales sueltos (bruto, mandamás) | [2,3], [14,20] | **[1,2], [8,12]** | `src/desafio-reglas.js:68,76` | 499 → 334 a la noche 20 (no alcanza solo; ver hallazgo 5) |
| Cantidad de la oleada tras la noche 9 | tope 18 | **+1 cada 2 noches hasta 23** | `src/desafio-reglas.js:195` | vida total de la noche 11 a la 19: 3,7 → 6,1 % por noche |
| Dureza por noche desde la 11 | +8 % | **+10 %** | `src/desafio-reglas.js:244` | noche 20: 5.942 → 7.265 de vida |
| Vueltas: cantidad / vida / daño | +20 / +25 / +15 % | **+12 / +15 / +10 %** | `src/desafio-vuelta.js:22` | vuelta 10, noche 20: 22.088 → 17.239 de vida; el tope de 24 se alcanza en la vuelta 3 en vez de chocar antes |

### Antes y después de la propuesta de plata (`caja 450 + turno × 1,25 + tablón`)

| Perfil | Por día (días 20-40) hoy → propuesta | Cabaña (día) | Casona (día) | Todo el catálogo (día) |
|---|---|---|---|---|
| Tranquilo (turno + 1 jornal) | $3.768 → **$4.363** | 34 → 30 | 123 → 108 | 290 → **254** |
| Medio (todo menos vender excedente) | $5.695 → $5.928 | 24 → 24 | 80 → 78 | 176 → 171 |
| A fondo (con vender excedente) | $13.400 → **$10.913** | 8 → 10 | 35 → 43 | 83 → **100** |
| Cociente tranquilo / a fondo | 3,5 | | | **2,5** |

Variantes probadas una por una (días hasta el catálogo; tranquilo / medio / a fondo): base 290/176/83 · caja $450 290/176/101 · caja $350 290/176/112 · turno × 1,25 254/163/80 · turno × 1,5 225/151/77 · tablón 290/185/85 · pedidos × 1,2 290/170/82 · jornal en 2 hechos 293/179/83 · **final 254/171/100**. El tablón y los pedidos casi no mueven nada: la plata está en el mercado y el empleo.

## Primeras horas y metas (jugador tranquilo, medio y a fondo)

Plata neta ganada (sin gastar). El ritmo de las primeras horas es el del pueblo a medio abrir (2 locales con jornal + 1 cada 6 días).

| Horas de juego | Día | Tranquilo | Medio | A fondo |
|---|---|---|---|---|
| 1 | 2 | $5.750 | $9.100 | $29.900 |
| 2 | 5 | $14.500 | $21.900 | $79.700 |
| 3 | 7 | $19.500 | $30.950 | $104.150 |
| 6 | 14 | $41.050 | $62.400 | $189.000 |
| 10 | 24 | $77.550 | $116.450 | $320.250 |

(«A fondo» arranca con $37.600 de cajas de puestos que se vacían en los primeros dos días: es una ventaja de las cajas llenas, no un ritmo sostenido.)

**Cuándo se llega a cada meta** (comprando en este orden y gastando todo lo ganado en eso; materiales a valor base):

| Meta | Costo | Tranquilo | Medio | A fondo |
|---|---|---|---|---|
| Pico comprado + puntas | $1.600 | día 1 | día 1 | día 1 |
| Escritura del lote de la Loma | $8.000 | día 4 (2 h) | día 3 (1 h) | día 1 |
| Establo del caballo | $10.500 | día 8 (3 h) | día 5 (2 h) | día 2 (1 h) |
| Puesto propio en la feria | $6.000 | día 9 (4 h) | día 6 (3 h) | día 2 (1 h) |
| Telar grande | $41.400 | día 22 (9 h) | día 15 (6 h) | día 4 (2 h) |
| Cabaña | $47.500 | día 34 (14 h) | día 24 (10 h) | día 8 (3 h) |
| Local de almacén propio | $34.800 | día 43 (18 h) | día 30 (13 h) | día 11 (5 h) |
| Casa con galería | $84.150 | día 65 (27 h) | día 44 (18 h) | día 18 (8 h) |
| Planta alta | $94.100 | día 89 (37 h) | día 59 (25 h) | día 25 (10 h) |
| Casona | $137.300 | día 123 (51 h) | día 80 (33 h) | día 35 (15 h) |
| Todas las obras con pesos | $1.142.300 | día 290 (121 h) | día 176 (73 h) | día 83 (35 h) |

La Historia entera (13 capítulos) corre en unos 12 a 15 días de juego (5 a 6 horas; es una estimación por las puertas de estación de `historia.js`: el tiempo real lo mide B): el jugador tranquilo llega al final con unos $40.000 a $50.000 sin gastar y su compra grande de camino es el telar grande o la escritura. **A las 3 horas** (día 7) lo que pide la economía es una decisión de $8.000 a $10.500; **la primera meta que de verdad cuesta decidir** es la cabaña (10 a 14 horas).

## Desafío: escala, consecuencias y modos

- **Duración:** 20 noches = unas 10 horas de juego (un día de 30 min, con la noche de 12 min); la partida corta (7 noches) 3,5 horas.
- **Tres dificultades fijas** (Tranquila ×0,6 cantidad / ×0,55 daño / ×0,8 vida, Normal, Implacable ×1,4 / ×1,35 / ×1,25) elegidas al empezar y que no se mueven en toda la partida: **no hay forma de ajustar a medio camino**, ni de subir sólo una de las tres.
- **Pesadilla** (×1,3 cantidad, ×1,15 daño, ×1,1 vida): en la noche 10 trae 23 duendes con Normal y 31 (el tope) con Implacable, con 7.171 de vida contra los 4.056 de la campaña normal.
- **Consecuencias hoy:** caer = perder todos los cristales y el 30 % de tronco, tabla y piedra, perder la noche y seguir; ninguna cicatriz, ninguna ventaja que se pierda. No hay nada más que cueste (sin fin termina la corrida).
- **Para hacerlo escalable (de mayor a menor impacto):** (1) las tres perillas de forma del hallazgo 4; (2) tres perillas separadas (cantidad, dureza, daño a vos) en cinco escalones, con una etiqueta de nivel («Tranquila» = 1 de 5), de modo que «Implacable» no sea un salto de golpe de ×1,4 en todo; (3) que la penalidad de caer crezca con la noche; (4) en las vueltas, agregar tipos o comportamientos en vez de sólo vida (contenido nuevo: tiene que salir de B, C o del DLC); (5) el segundo escalón de mejoras con cristales (hallazgo 5).
- **No se tocó** la cadena grande de las noches (R12) ni se la midió.

## Lo que no se pudo mirar

- **Tiempos reales de cada acción** (cuánto tarda un jornal, un turno, una venta, un viaje): son supuestos (arriba). No se corrió Electron: con el candado y la advertencia del calor, se priorizó el código real. Lo que más cambiaría si se mide: los «pesos por minuto» de cada fuente y cuánto del día se va en ir a la aldea (632 m; 3,3 min a pie).
- **El poder real del jugador en el Desafío**: no se midió cuánto daño por segundo, cuántas obras y cuánta salud tiene en cada noche. Los números del hallazgo 4 son formas, no dificultad.
- **Lo que el jugador junta en un día** (tala, picar, pescar, huerta): no hay una medida de cuánto material entra por minuto. Se afirma que 81 tablas son ~15 minutos con base en lo que el código dice (4 troncos por árbol, 4 tablas por tronco en el banco) pero no se probó en partida.
- **El caballo y el carro** (11 m/s, 52 casillas) cambian el costo de ir y venir y no están en ninguna cifra.
- **La Historia real** (cuántos días reales dura de verdad un capítulo, cuándo se abren los locales con jornal): se tomó de las puertas y de lo que dice `LLEGADA`; lo mide B.
- **«Hora de tu reloj»:** con el reloj real un día dura 24 horas y todo lo de este informe por hora cae 48 veces; las 20 y 45 minutos por día mueven los pesos por hora un +50 % y un −33 %.
- **Carga y mochila** (24 casillas; 36 con alforjas): se supuso que no limita lo que se vende por día.
- **Lo que sale de `huevos`, `correo`, `concursos` y `eventos-valle`:** premios de $100 a $1.600 sueltos que no suman.

## Plan de versiones sugerido (sólo para lo de A)

| Versión | Qué | Por qué en este orden |
|---|---|---|
| **4.21.0 · Plata pareja** | fletes (fórmula entera), `cajaDia` 450, turno × 1,25, tablón, poncho de invierno, `XP.remo`, premios de la Historia en pesos | cada uno es una constante con prueba corta; baja el cociente de 3,5 a 2,5 y pone los pesos de la Historia a tono con la economía. Una pasada de prueba del mercado y del empleo. |
| **4.22.0 · Noches con forma** | los tres números de la curva del Desafío, `multiplicadorVuelta`, bajar cristales sueltos, el castigo que crece con la noche, la dificultad en 3 perillas | todo en `desafio-reglas.js`/`desafio-vuelta.js`; hay que jugarlo (una corrida de 7 noches y otra de 20) para calibrar. Sin tocar la cadena grande (R12). |
| **4.23.0 · Lo que se produce vale** | valor de mercado para leche, carne, chorizo, frutas y mermeladas; salida pública para los talleres; renta × 2; precios de cuatro obras | es el único paquete de mecánica; se puede hacer con B (metas con plata) para que la economía tenga cosas que comprar a las 3 horas |
| 4.24.0 | el segundo escalón de cristales y los tipos nuevos por vuelta (contenido, si va) | contenido: se decide después de jugar el equilibrio |

## Cómo se reproduce

```
node herramientas/auditoria-4-20-a-valores.mjs
node herramientas/auditoria-4-20-a-mercado.mjs 60
node herramientas/auditoria-4-20-a-ritmo.mjs 36                      (--variante=final para la propuesta; --resumen)
node herramientas/auditoria-4-20-a-fletes.mjs
node herramientas/auditoria-4-20-a-oficios.mjs
node herramientas/auditoria-4-20-a-planos.mjs
node herramientas/auditoria-4-20-a-historia.mjs
node herramientas/auditoria-4-20-a-desafio.mjs
node herramientas/auditoria-4-20-a-desafio-propuesta.mjs
```

Cada una tarda menos de 2 segundos. No tocan `src/` ni `index.html`.
