# Precios de construcción en pesos (4.2)

Desde la 4.2 cualquier plano puede costar **pesos además de materiales**: se declara `pesos: N` junto a `pide` y el juego se ocupa del resto (cobro, aviso, panel, devolución, guardado). Antes sólo lo hacían las tres casas. Esta página es la guía de precios y la receta para agregar piezas. Va con `ECONOMIA_NUMEROS.md` y `PLAN_ECONOMIA.md`.

## Por qué hay pesos en las piezas

Con todo comprado, la plata se acumula sin uso. Un jugador goloso junta unos **$3.200 por día** (jornales de $700 a $1.300 más 10 % cada tres del oficio, pedidos, abastecimiento, alquiler; `herramientas/simulador-negocios.mjs`) y **un año del juego son 12 días**. La idea es que casi toda pieza buena valga una decisión («¿ahorro para la vitrina o para el taller?»), sin que nada sea imposible: lo más caro de este catálogo es menos que la casona, que ya es una meta de varios años.

## La escala

| Tipo de pieza | Pesos | Días de ingreso (a $3.200) | Ejemplo |
|---|---|---|---|
| Pieza común (la que ya había: bancos, cercos, mesas, camas simples, senderos) | **sin pesos** | — | todo lo viejo |
| Mueble bueno | **$800 a $3.000** | menos de 1 | alfombra tejida grande $2.400 |
| Lujo | **$4.000 a $20.000** | 1 a 6 | vitrina de roble $4.500, araña de velas $6.500, reloj de pie $9.000, fuente de piedra $14.000 |
| Edificio de oficio (taller, molino, fragua, algo que trabaja) | **$15.000 a $60.000** | 5 a 19 | herrería propia $32.000, cervecería $42.000, telar grande $36.000, panadería de horno grande $27.000, tienda de campo $30.000, quesería $24.000, carpintería $22.000, cantería $18.000 (ver CAMBIOS_4_2_OFICIOS.md) |
| Ampliación de casa (cuarto, galería, planta alta) | **$20.000 a $80.000** | 6 a 25 | (por hacer) |
| Las tres casas (terreno y mano de obra, ya existentes) | $36.000 / $66.000 / $110.000 | 11 / 21 / 34 | cabaña, casa con galería, casona |

Reglas para elegir el número dentro del rango:

1. **Pesos entre 1 y 4 veces lo que valen los materiales** (a valor base: tabla $100, piedra $100, tronco $150, vellón de lana $300). Un mueble que ya pide mucho material no necesita tantos pesos; uno de pocos materiales y mucho oficio (un reloj, una araña) sí.
2. **Redondo a $50** (mejor a $100 o $500 en lo caro). El panel muestra «$4.500», no «$4.437».
3. Lo más grande y más trabajado cuesta más; dos piezas parecidas, precios parecidos.
4. **Nada barato lleva pesos**: debajo de $800 no vale la pena la cuenta; es sólo materiales.
5. Las ampliaciones y los edificios por etapas **reparten el precio**: lo que se paga es de cada etapa (la primera puede llevar «el terreno»). Ver la receta.
6. Ninguna pieza individual pasa de $80.000; la casona ($110.000) sigue siendo lo más caro del valle.

### Las cinco piezas de ejemplo (`src/planos-lujo.js`)

| Pieza | Materiales (valor base) | Pesos | Total |
|---|---|---|---|
| Alfombra tejida grande | 8 vellones ($2.400) | **$2.400** | $4.800 |
| Vitrina de roble | 18 tablas, 3 troncos, 2 piedras ($2.450) | **$4.500** | $6.950 |
| Araña de velas | 4 tablas, 6 piedras, 1 tronco ($1.150) | **$6.500** | $7.650 |
| Reloj de pie | 14 tablas, 2 troncos, 2 piedras ($1.900) | **$9.000** | $10.900 |
| Fuente de piedra | 36 piedras, 2 tablas ($3.800) | **$14.000** | $17.800 |

## Cómo se cobra (lo que hace el juego solo)

- **Se paga al hacer la etapa**, junto con los materiales. Sin plata no se construye: el aviso dice «Faltan 2 tablas y $1.200» (materiales y pesos juntos) o, si sólo faltan pesos, «Esta pieza cuesta… y te faltan… El banco te puede prestar».
- El **panel de construcción** muestra «$4.500» junto al nombre del plano (en rojo y con «(no alcanza)» si no alcanza), el precio de cada etapa, el costo total y cuánto tenés.
- **Retirar la marca** (Supr) de una obra que ya había pagado etapas devuelve **todo** lo pagado.
- **Deshacer una etapa** (Retroceso) devuelve la mitad de los materiales y **no** los pesos, pero la etapa queda pagada: rehacerla no cobra de nuevo (igual que las casas).
- **Desmontar una pieza terminada** (Mayús + Supr) devuelve la mitad de los materiales y **la mitad de los pesos que de verdad pagaste** (una pieza de una partida anterior al precio no devuelve plata que nunca se pagó). Las casas no reintegran: no se desmontan.
- **Mover** una pieza (Mayús + Y) es gratis.
- **Sólo en el Relax.** En el Desafío no hay economía: los `pesos` se ignoran (el plano se arma sólo con materiales). Las piezas de lujo son `soloRelax` de todos modos.
- **Partidas viejas**: sin `economia` no se cobra nada; una obra sin `pagadas` cuenta como «nada pagado».

## Receta: agregar una pieza con pesos (10 líneas)

1. Archivo nuevo `src/planos-xxx.js` que exporta `PIEZAS_XXX = [ … ]`; copiá `src/planos-lujo.js` (usa los ayudantes de `planos-muebles.js`: `caja`, `cil`, `puerta`…).
2. Cada pieza: `...base` (`soloRelax`, `apoyaEnPlataforma`, `pieza: true`), `id` único, `nombre`, `categoria` (`mobiliario`, `exterior`, `trabajo`, `refugios`), `radio`, `ancho`, `fondo`, `alto`, `separacion`, `texto` en castellano de la casa, `pide: { tabla: 18, … }`.
3. **Justo debajo de `pide`: `pesos: 4500`** (según la escala de arriba). Eso es todo lo que hay que declarar para que cueste.
4. `fisica(h)` con `h.segmento(...)` / `h.circulo(...)` si choca (sin `fisica` no choca); `arma(c)` con la geometría: frente a -z, fondo a +z, origen en el centro sobre el piso, sólo `tipo` 0 y 4, sin luces dinámicas, **hasta ~1.000 triángulos** (la mediana del juego es ~250).
5. En `src/construccion.js`: un import (una línea, **sin comentario atrás**: `armar.mjs` no lo entiende) y `PIEZAS.push(...PIEZAS_XXX);` junto al de `PIEZAS_LUJO`. El precio se anota solo (`registrarPreciosDePlano`); **no hay que tocar `main.js`, `propiedad.js` ni `guardado.js`**.
6. Edificio o ampliación **por etapas** (con `PLANOS.push({ … etapas: [ … ] })`): `pesos` dentro de cada etapa, junto a su `pide` (`{ nombre, pide, pesos: 12000, dice, arma, … }`), o un `pesos` total en el plano con `repartoPesos: [0.35, 0.2, 0.25, 0.2]` (si no, se reparte parejo). Una etapa sin `pesos` es gratis.
7. Si se usa con E, sumala a `OBRAS_QUE_TRABAJAN` y a `avisoObra24` / `usarObra24` en `main.js` como el reloj de pie (`LUJO_QUE_SE_USA`).
8. Una prueba propia en `pruebas/verificar-<algo>.mjs` (copiá la sección 5 de `verificar-4-2-pesos.mjs`: existe, precio, geometría, triángulos, física) y registrala con `node herramientas/sumar-prueba.cjs . verificar-<algo>.mjs` (sólo el nombre, sin `pruebas/`).
9. Probala en el juego: abrir el menú de construcción (O), ver «$…» en la lista y en la ficha, construirla con plata, sin plata (el aviso) y desmontarla (Mayús + Supr).

## Lo que queda abierto

- El tope de `pagadas` en el guardado es 8 etapas (`guardado.js`): un edificio de más de ocho etapas con pesos necesitaría subirlo.
