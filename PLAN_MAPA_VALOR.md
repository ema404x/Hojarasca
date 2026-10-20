# Hojarasca — que todo el mapa tenga valor (idea del 21-10-2026, para planificar)

**Pregunta del usuario:** hoy casi todo se basa en el pueblo, y está bien, pero ¿qué se puede hacer para que **todo el mapa** tenga valor?

**Principio:** cada zona tiene que darte algo que las otras no te dan. Hoy el pueblo concentra el dinero, las personas y los edificios; lo que falta es una razón económica y social para ir a cada lugar.

## Lo que ya existe (visto en el código, no jugado)
- Lugares del mapa: refugio, mallín, mirador, galpón, muelle, estación, cueva, arrayanes, molino, almacén, torre, puesto, puente, faro y cabaña.
- Medios de viaje: la trochita (comercio entre paradas), el caballo, el kayak y el velero.
- Oficios que suben con el uso: hachero, picapedrero, pescador, cazador, huertero, navegante y obrero.
- Sistemas con los que engancharse: economía en pesos (`economia.js`), comercio y mercado (`comercio.js`, `mercado.js`), pedidos (`pedidos.js`), edificios de oficio, depósitos con tope (`almacen.js`), negocio propio, cuaderno con anotaciones y desafíos de fotos.

## Ideas (de lo que más rinde por el costo a lo que menos)
1. **Recursos con geografía.** Materiales que sólo salen de ciertas zonas: la piedra buena de una cantera, los piñones del pehuenal (otoño), las hierbas y el junco del mallín, la arcilla de la costa, la lana y el cuero de la estepa. Los edificios de oficio y el negocio propio necesitan insumos de afuera; el pico y el picapedrero tienen lugar propio.
2. **Pedidos y encargos de larga distancia.** Los vecinos piden cosas de zonas lejanas, mejor pagadas; los precios cambian según dónde estés (ampliar el comercio entre paradas con puestos y ferias de otras zonas).
3. **Puestos de ruta que construye el jugador.** Un refugio o campamento lejos del pueblo, con descanso, depósito y caminos; los caminos y puentes que se construyen acortan viajes (ya existen el puente de piedra y el camino empedrado).
4. **Segunda propiedad.** Un lote rural o una cabaña de pesca con producción pasiva (colmenas, tambo, cantera propia) que hay que visitar y recoger; engancha con los depósitos y los edificios de oficio.
5. **Gente fuera del pueblo.** Pocos personajes con historia y pedidos propios: guardaparque, pastor, arriero, andinista, el que cuida el faro. Las misiones grandes quedan para la zona nueva del DLC.
6. **Eventos por lugar y estación:** pesca de temporada, migración, nevadas en altura, floración, arriada.
7. **Exploración con recompensa:** mapa que se revela, hitos con vista, avistajes raros; que den planos, recetas o herramientas mejores.
8. **Logística:** fletes y encomiendas pagadas entre paradas, el caballo con alforjas, rutas de carga en kayak y velero.

## Límite a respetar
El juego anda justo en la plaza (la base cuesta ~15 ms; el margen hasta 16,7 ms es de 1,5–2 ms; ver el bloque 20-10 de `SEGUIR-EN-OTRA-PC.md`). Lo nuevo debe ser **puntos de interés dispersos**, no más densidad de objetos en un mismo lugar. Antes de sumar mucho, medir los fps en la Ryzen 5 4600G (`npm run medir:caminata`).

## Propuesta de cómo empezar (pendiente de que el usuario decida)
1. **Auditoría de valor del mapa:** un recorrido que anote qué se puede hacer hoy en cada lugar y cuáles quedan vacíos (con capturas), para decidir con datos.
2. **Primer paquete:** ideas 1, 2 y 3 (recursos con geografía, pedidos lejanos y puestos de ruta), que es lo que más conecta con lo ya hecho (pico, picapedrero, edificios de oficio, depósitos, negocio propio).
3. Dejar para el DLC (zona grande nueva con misiones nuevas) las historias largas y los personajes con misiones complejas.

---

## Decisiones tomadas el 21-10-2026 (sólo conversadas; nada ejecutado todavía)

**Orden de trabajo:** 1) sacar las carreras y el torneo (ver `PLAN_4_4_4_SIN_CARRERAS.md`), 2) auditoría del mapa, 3) paquete 1a, 4) paquete 1b (la carga).

### Paquete 1a
- **Recursos de zona (los cinco):** piedra buena de cantera, piñones del pehuenal (sólo en otoño; los piñones ya existen en el juego como una de las frutas), hierbas y junco del mallín, arcilla de la costa, y lana y cuero de la estepa. Los demás materiales se siguen juntando en cualquier lado.
- **Herramientas nuevas de zona (las cuatro, una por zona):** hoz o cuchillo de junco (mallín), pala de arcilla (costa), esquiladora o cuchillo de cuero (estepa) y pico de cantero (cantera). Las dan o venden los personajes de cada zona. Ojo: el pico de cantero se pisa con el pico de la 4.2 (los dos sacan piedra): definir en qué se diferencian. (El usuario había dicho antes «mezcla»; después marcó las cuatro: se tomó «las cuatro nuevas».)
- **Pedidos lejanos:** un **tablón de encargos en la plaza** que cambia por día, con pedidos de cosas de zonas lejanas, pagados de **1,5 a 2,5 veces** lo de un pedido del pueblo, con días para entregarlos.
- **Puestos de ruta:** de 3 a 5 **ya hechos en el mapa, abandonados, que se reparan pagando** (materiales y pesos por etapa, con la maquinaria de pesos de la 4.2). Un puesto reparado da **descanso, fogón y depósito**, y **compra y vende con precios propios** (abre rutas de comercio; se engancha al mercado de 19 bienes de `comercio.js` y `mercado.js`).
- **Gente fuera del pueblo:** el pescador y la guardaparque (el usuario dice que ya existen; no verificado en el código: hay una «seccional de guardaparques» y la pescadería de Aurelio) más un **pastor, un arriero y un cantero** de la cantera. El cantero engancha con el pico y el picapedrero. Misiones largas: para el DLC.
- **Acceso:** libre desde el inicio (el viaje es la barrera).

### Paquete 1b
- **Límite de carga con casillas** (decisión del usuario; el agente recomendaba un tope por material, más simple): la mochila tiene casillas, cada pila un máximo; el caballo con alforjas y el carro llevan más. **Hoy no hay límite** de lo que se lleva (los materiales son números que se suman; sólo hay un tope de 99.999 al guardar; las pruebas usan pilas de 999). Implica una pantalla de inventario nueva, que lo lean bien la construcción, el acopio, los depósitos, los negocios y los pedidos, y una regla para las partidas viejas con 989 troncos. Por eso va aparte.

### Riesgos y cosas abiertas
- El paquete 1a ya es grande (4 herramientas, 5 recursos, 3 personajes, un tablón, 3–5 puestos con mercado): puede partirse en dos versiones (por ejemplo, primero la estepa y el mallín).
- Los precios de los puestos y los pedidos no deben romper el equilibrio del dinero (~$3.200/día con jornales; más con empleo y negocios).
- Abiertas: dónde van los puestos y los recursos (lo responde la auditoría), los números (precios por puesto, pago de los pedidos, tope de la carga, casillas y tamaño de pila), ejemplos de 2 o 3 pedidos por personaje nuevo, cómo se ve el tablón y cuántos pedidos trae por día.
- Antes de sumar mucho al mapa: medir los fps en la Ryzen 5 4600G (`npm run medir:caminata`).
