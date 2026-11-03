# 4.23.0 · A · Lo que se produce vale

Rama `v4230-a` (sale de `main` = 4.22.0). Aplica el paquete «4.23.0 · Lo que se produce vale» de `AUDITORIA_4_20_0_A.md`: valor de mercado para lo que da la granja y la cocina a leña, salida pública para los talleres, la renta de las casas al doble y los precios de las obras que rompían la regla de `PRECIOS_CONSTRUCCION.md`. No se tocó la Historia, ni el Desafío, ni la cadena grande de las noches. Ninguna clave nueva de guardado. Una partida vieja carga igual (ver «Partidas viejas»).

Todo se midió con las herramientas `herramientas/auditoria-4-20-a-*.mjs` antes y después; las salidas completas están en `C:\Users\Andres\AppData\Local\Temp\hx\a4230\` (`*-antes.txt` y `*-despues.txt`).

## Qué cambió

| Qué | Antes | Ahora | Dónde |
|---|---|---|---|
| Valor de la leche, la carne, el chorizo, la fruta y la mermelada | no valían nada (no estaban en `BIENES`) | 17 cosas con valor (tabla de abajo) | `src/comercio.js` (`BIENES`, `DE_GRANJA_CON_VALOR`) |
| Quién las compra | nadie | nueve puestos de la trochita (más el del pescador con dos), la consigna de la feria, la tienda de campo y, con confianza, los vecinos | `PERFILES` de `comercio.js`, `pedidos.js`, `oficios-propios.js` |
| Tienda de campo | 4 lotes por día, 8 clases | **6 lotes por día, 12 clases**; se guarda lo de una receta | `src/oficios-propios.js` (`TIENDA`) |
| Puesto propio de la feria | 2 lotes por día, 8 clases | **3 lotes por día, 12 clases** | `src/propiedad.js` (`PROPIEDAD.puesto`), `src/negocios.js` |
| Renta de las casas por día | $300 / $500 / $800 | **$600 / $1.000 / $1.600** (se paga en 71 a 81 días; eran 141 a 162) | `src/propiedad.js` |
| Precios de ocho obras | herrería $32.000, cervecería $42.000, telar grande $36.000, quesería $24.000, tienda de campo $30.000, cantería $18.000, reloj de pie $9.000, araña de velas $6.500 | **$18.000, $29.500, $21.500, $17.500, $23.500, $13.000, $7.500, $4.550** (todas de 3,8 a 4,0 veces sus materiales) | `src/planos-oficios.js`, `src/planos-lujo.js` |

## 1. El valor de lo que se produce

Los once productos de la granja (leche, tres carnes, chorizo, seis frutas) y las seis mermeladas de la cocina a leña (`mermelada-<fruta>`; el dulce de frutilla ya valía) entran a `BIENES` con `donde: 'entrada'` (salen del mismo lugar del cuaderno que ya usan la cocina y la granja: no hace falta tocar `sumarEntrada` ni el guardado).

| Cosa | Lote | Valor del lote | Por unidad | La tienda paga el lote | La consigna paga el lote |
|---|---|---|---|---|---|
| leche | 4 | $300 | $75 el litro | $290 | $270 |
| carne de vaca y de cerdo | 2 | $700 | $350 el kilo | $670 | $630 |
| cordero | 2 | $600 | $300 el kilo | $580 | $540 |
| chorizo | 3 | $600 | $200 | $580 | $540 |
| manzana, pera, ciruela, cereza, frambuesa, grosella | 5 | $400 | $80 | $380 | $360 |
| mermelada (seis) | 1 | $400 | $400 el frasco | $380 | $360 |

**Dos valores no son los del informe** (decisión): el informe proponía cordero 7 y chorizo 8, pero no miró los cambios de los vecinos de la cocina (`CAMBIOS_VECINOS`): con 7 y 8, cuatro chorizos por dos troncos eran 3,6 veces y tres kilos de cordero por tres tablas, 3,5 (casi el 4,0 del apicultor, que es lo más que paga un cambio de vecino). Con cordero 6 y chorizo 6 quedan en 2,7 y 3,0. La mermelada la dejé en $400 y no en $500: cuatro frutas ($320) dan tres frascos, así que con $500 un frasco era 4,7 veces lo que costaba (más que cualquier cambio de vecino); con $400, 3,75 (y menos con el azúcar). El dulce de frutilla ($700) ya existía y queda como estaba.

### Dónde se venden

- **Puestos de la trochita.** Nueve cosas por puesto como máximo (una por número del panel): sólo había lugares libres en diez paradas (los cuatro puestos de ruta y la aldea ya tienen nueve). Cada una la **pide** el puesto (la paga ×1,5, menos el margen): Estación del Valle, carne de vaca · Mallín, leche · Faro, cordero · Arrayanes, carne de cerdo · Parada Alta, chorizo · Molino, manzana · Casa de Té, mermelada de frambuesa · Mirador, ciruela · Bosque, cereza · Pescador (tenía dos lugares), grosella y mermelada de manzana. Lo que ya había en cada puesto sigue y en el mismo orden relativo (lo nuevo está entre lo que «pide» y lo que «otros»: los números del panel de las cosas de «otros» se corren uno).
- **Sin puesto de trochita (no había lugar):** frambuesa, pera y las mermeladas de pera, ciruela, cereza y grosella. Esas seis se venden en la consigna de la feria y en la tienda de campo.
- **Consigna de la feria y tienda de campo**: todas las diecisiete.
- **Pedidos de los vecinos:** la cuarta cosa de cada lista (`NECESITA`) es de la granja o la cocina; la piden los vecinos de **nivel 3** de confianza (hasta el nivel 2 la lista es la de siempre: las tres primeras, exactamente como antes). Todas se consiguen en algún puesto de la trochita.
- **Lo que no cambia:** el banco no las pide en el abastecimiento (`SIN_ABASTO`, la elección de siempre es la misma en las partidas que ya están) ni una parada sin perfil las usa al armar el suyo, y los puestos arrancan con las mismas existencias y la misma caja de siempre para lo de siempre (lo nuevo sale de un azar aparte: `mercado.js`).
- **Estación del año:** lo nuevo no tiene factor de estación (no se suma otro «guardar de verano a invierno»: el informe ya marcó que rinde 2,3 veces).

### Lo que esto hace con el resto de la economía

- **La quesería ya cuenta la leche** (`auditoria-4-20-a-valores.mjs`): 8 litros valen $600, 2 quesos $1.100: deja **$500 por tanda** (la herramienta decía $1.100 porque la leche valía $0). El taller costaba $24.000 y ahora $17.500, y sigue siendo de lo más rentable de los chicos.
- **Las recetas de carne y leche gastan cosas con valor** (el asado: 2 kilos de vaca y 2 chorizos = $1.100): es un costo de oportunidad, no un error; los platos no se venden (dan descanso).
- **Los cambios con los vecinos** (una vez por día cada uno) pasan a ser una fuente de plata: lo que más rinde es el chorizo de Mario Jones (2 troncos por 4 chorizos = $800, 2,7 veces), el cordero de Don Ramón (3 tablas por 3 kilos = $900) y lo que da gratis lo juntado (los kilos de cerdo de la madre por 4 piñones: $700, y las manzanas de Nélida por un canto rodado: $320). **Techo teórico: unos $3.000 por día** con los ocho vecinos y una tienda de campo; lo realista de un día de juego, uno a tres cambios (unos $800 a $1.500). Es del tamaño del tablón ($850) y del turno ($1.940), con el mismo freno que el informe aceptó para el carpintero y la tejedora (una vez por día). **Queda para mirar jugando**: si es demasiado, bajar la carne de cerdo de 7 a 6 y el tope de la tienda; no se hizo porque el cupo de la tienda y las cajas de los puestos ya lo acotan.

## 2. Salida pública para los talleres

El informe pedía «que la tienda de campo y el puesto de la feria vendan lo que sale del taller». Ya vendían ponchos y panes, pero **el cupo no alcanzaba**: el horno grande solo hace 8 panes por día (2,7 lotes) y el telar 2 ponchos (2 lotes): 4,7 lotes por día contra un tope de 4. Ahora:

- **Tienda de campo:** 6 lotes por día (eran 4) y 12 clases a la vez (eran 8). Entran lo de la granja y la cocina (17 cosas más). **La tienda no se lleva lo que hace falta para cocinar**: el asado pide 2 kilos de vaca y 2 chorizos, el locro 1 y 1, el dulce de leche 4 litros, la mermelada 4 frutas; con E se deja todo menos esa cantidad (`TIENDA.reserva`: vaca 2, cordero 3, cerdo 2, chorizo 2, leche 4, frutas 4, y un frasco de cada mermelada para comer o llevar al concurso). El aviso («dejar la mercadería a la venta») tampoco aparece si lo único que tenés es eso. Los textos del aviso y del plano dicen seis lotes y lo de la receta.
- **Puesto de la feria:** 3 lotes por día (eran 2) y 12 clases (eran 8). El guardado conserva las 12 clases (`negocios.js`); un puesto guardado con 8 queda con 8.
- **Lo que no se hizo:** la quesería y la cervecería ya tienen comprador con nombre (Ercilia y Lucrecia pagan los quesos y los barriles contado; con tienda de campo el queso se paga un cuarto más), así que no se tocaron. La cantería da piedra, que ya se vende en los puestos.
- **Lo que se vio en las herramientas:** nada de esto entra en el simulador `ritmo` (no modela la tienda ni la consigna), así que no mueve el cociente; un telar y un horno a pleno, con tienda, venden unos $4.400 por día (ponchos a $1.440, lotes de pan a $580) y dejan unos $2.300 netos de insumos, con $23.500 + $21.500 + $27.000 de obras por delante (unos 30 días de pagarse, sin contar los materiales).

## 3. La renta de las casas, al doble

$600, $1.000 y $1.600 por día (cabaña, casa con galería, casona). Con la ocupación de siempre (85 %) cada casa se paga en 71, 78 y 81 días (eran 141 a 162; un negocio comprado a un vecino, 64 a 84). **Las que ya estaban alquiladas también cobran la nueva** (el cobro del día usa `rentaDe(id)` y no la renta que había quedado anotada al alquilar; la clave `renta` del guardado sigue ahí y ya no manda).

## 4. Los precios de las obras (la regla: hasta 4 veces los materiales)

De las 12 obras con pesos que pasaban de 4 veces sus materiales (`auditoria-4-20-a-planos.mjs`: «Sobre 59 obras con pesos, 12 pasan de 4 veces»), **ocho quedan a la regla** y cuatro quedan donde estaban, entre 4,1 y 4,4 veces (comercios y locales, que ya costaban cerca del límite y que no eran de las graves):

| Obra | Antes (veces) | Ahora (veces) |
|---|---|---|
| herrería propia | $32.000 (6,8) | **$18.000 (3,8)** |
| telar grande | $36.000 (6,7) | **$21.500 (4,0)** |
| araña de velas | $6.500 (5,7) | **$4.550 (4,0)** |
| cervecería | $42.000 (5,7) | **$29.500 (4,0)** (ya no cuesta más que la cabaña) |
| quesería | $24.000 (5,5) | **$17.500 (4,0)** |
| cantería | $18.000 (5,5) | **$13.000 (3,9)** |
| tienda de campo | $30.000 (5,1) | **$23.500 (4,0)** |
| reloj de pie | $9.000 (4,7) | **$7.500 (3,9)** |
| *(sin cambio)* horno grande, carpintería, local de panadería, local de almacén | 4,4 · 4,3 · 4,2 · 4,1 | igual |

El informe proponía llevar sólo cuatro a 4,7, 4,8, 4,2 y 4,5 (todavía por arriba de la regla); acá se llevaron a 4,0 o menos, redondos a $500 (a $50 las dos piezas de lujo; la araña quedó en $4.550 y no en $4.500 para que siga costando más que la vitrina, como dice `verificar-4-2-pesos`). El catálogo de las 59 obras con pesos suma **$853.850** (eran $916.300). `PRECIOS_CONSTRUCCION.md` tiene la escala actualizada (edificios de oficio: $13.000 a $60.000).

## Antes y después (volviendo a correr las herramientas de la auditoría)

La herramienta `auditoria-4-20-a-ritmo.mjs` tenía **el total del catálogo y los costos de las metas escritos a mano** ($916.300, telar $41.400, local de almacén $34.800); ahora los calcula de los planos reales (si no, el cambio de precios no se veía).

| Perfil | Catálogo de obras con pesos, día | Por día (días 20 a 40) | A las 3 horas | Por día (días 100 a 140) |
|---|---|---|---|---|
| Tranquilo | 254 → **240** | $4.363 → $4.363 | $22.350 → $22.350 | $4.586 → $4.586 |
| Medio | 171 → **162** | $5.928 → $5.928 | $31.300 → $31.300 | $7.189 → $7.351 |
| A fondo | 100 → **95** | $10.913 → $10.888 | $91.100 → $91.200 | $12.151 → $12.299 |
| **Cociente tranquilo / a fondo** | **2,54 → 2,53** | | | |

(El catálogo pasa de $1.142.300 a $1.079.850.) El cociente fondo/tranquilo **no se empeora** (2,54 de la 4.21.0 → 2,53). La plata por día de los tres perfiles no cambia en los días 20 a 40 (lo nuevo no entra en lo que mide el simulador: el mercado se frena por la caja de cada puesto, $450 por día, no por qué se vende); en los días 100 a 140 sube un 2 % para el medio y el que juega a fondo porque con confianza de nivel 3 un pedido ahora puede ser de carne o leche. Los pedidos de los niveles 0 a 2 (los de las primeras horas) siguen **idénticos** (810 por día en la fila C). Metas (días hasta, tranquilo / medio / a fondo): telar grande 19/15/5 → 16/12/4; cabaña 30/24/10 → 27/21/8; casa con galería 57/43/22 → 53/41/20; casona 108/78/43 → 104/75/41.

**Mercado** (`auditoria-4-20-a-mercado.mjs 60`): el techo sostenido no cambia (con 3 puestos por día, $4.947 → $4.950; 11 puestos, $4.930 → $4.933: el ruido de qué se vende).
**Oficios, fletes:** sin cambios (`oficios-antes.txt` = `oficios-despues.txt`; fletes $19.277 por hora, los de la 4.21.0).

## Partidas viejas

- **Sin claves nuevas de guardado.** Los puestos guardados antes (sin existencias de lo nuevo) las completan con el nivel de siempre al volver (`tienda()` ya lo hacía con cualquier bien nuevo); las cajas no se tocan.
- Una tienda guardada con ocho clases queda con ocho; una con más de doce (imposible antes) guarda doce. Un puesto de la feria igual.
- Una casa ya alquilada pasa a la renta nueva en el próximo cierre diario.
- Los pedidos del banco (abastecimiento) y los de los vecinos hasta el nivel 2 salen exactamente iguales que antes.
- Las ocho obras que bajaron de precio son de una sola etapa: una ya levantada no cobra ni devuelve nada; desmontarla devuelve la mitad de lo que de verdad se pagó (como siempre).

## Pruebas

- **Nueva:** `pruebas/verificar-4-23-0-a.mjs` (al final de `verify:pasos`): 6.617 comprobaciones. El valor y el lote de las 17 cosas y que salgan del cuaderno; los puestos (qué pide cada uno, nueve como máximo, lo de siempre en el mismo orden, qué cosas quedan sin puesto y que la consigna y la tienda las vendan); que lo de siempre no se movió (existencias y caja iniciales con el azar de antes, el banco, la parada sin perfil, los pedidos de nivel 0 a 2 contra las listas viejas); la cuarta cosa de los pedidos de nivel 3, en los veinte vecinos y alcanzable en algún puesto; la tienda (6 lotes, 12 clases, lo más caro primero, la reserva para cocinar y su aviso, el saneo de una tienda vieja); el puesto de la feria (3 lotes, 12 clases, guardado); la renta (valores, retorno de 65 a 85 días, una casa alquilada con la renta vieja anotada, topes de la demanda); los ocho precios (exactos, de 3 a 4 veces, redondos), que sólo cuatro obras pasen de 4 y que el catálogo sume $853.850; el tope de los cambios de los vecinos (hasta 3,2 veces); y las herramientas de la auditoría corridas de verdad (el cociente, el piso del tranquilo, la quesería, los fletes).
- **Mutaciones:** `pruebas/mutaciones-4-23-0-a.mjs` (fuera del gate): 49 mutaciones sobre copias de `src/` (una carpeta y un proceso por cada una); la copia sin mutar pasa y **49 de 49 fallan**: cada valor y lote, la lista de lo de la granja, lo que pide cada puesto, el abastecimiento del banco, el perfil sin nombre, el azar de la caja inicial, los pedidos de nivel 0 y nivel 3, la tienda (cupo, clases, mercadería, reserva, aviso), el puesto (cupo, clases, guardado), los textos, la renta (las tres casas y las ya alquiladas) y los ocho precios (más dos fuera de la regla).
- **Pruebas viejas que se ajustaron a propósito** (contaban valores que cambian): `verificar-4-2-oficios` (los seis precios, la escala $13.000 a $60.000, la tienda vende 6 lotes por día —dos ponchos, tres de miel y uno de pan—, el tope de doce días es 72, el reintegro de la quesería $8.750 y los $29.499 de la cervecería), `verificar-4-2-pesos` (reloj y araña, la escala de los edificios), `verificar-3-8-8-negocios` (renta $600, retorno en menos de 85 días, el puesto deja cuatro lotes y vende tres por día), `verificar-4-6-puestos` (el perfil de la cantera ya no copia el «pide» entero de la Parada Alta: el chorizo no entra en un puesto de ruta de nueve cosas) y `verificar-4-21-0-a` (los días hasta el catálogo: 236 a 262 / 160 a 178 / 92 a 108; antes 245–262 / 165–178 / 95–108).
- **Barrido:** se corrieron todas las pruebas `verificar-*.mjs` que nombran comercio, mercado, propiedad, oficios, pedidos, banco, negocio, economía, precios, obras, cocina, granja, guía, idioma, carga, construcción o puestos (ver el resultado al final de este documento). **No se corrió `npm run verify` completo** (lo pide el brief).

## Lo que no se vio

- **A ojo, en partida real:** no se abrió Electron. El juego real no se probó cargando una partida con leche o mermelada en la tienda y los puestos: se probó con los módulos reales (`comercio`, `mercado`, `oficios-propios`, `propiedad`, `pedidos`, `negocios`, `guardado` de los talleres) y con las herramientas de la auditoría. Lo que más conviene mirar jugando: el panel de la trochita en las paradas con una cosa nueva (los números del panel se corren uno), la tienda con carne y mermelada (que se quede con lo de una receta) y el panel de consigna de la feria con muchas clases.
- **Textos en inglés:** no se escribió (se traduce al final): el aviso de la tienda, el texto del plano de la tienda de campo y lo que diga el panel de la feria quedaron en castellano.
- **El equilibrio de la granja contra un jugador real:** los precios de la leche y la carne salen de la tabla del informe y de los cambios de los vecinos; cuánta leche, carne y fruta junta de verdad una granja por día no se midió en partida (la vaca da 4 litros por día: $300).

## Decisiones tomadas (resumen)

1. Cordero y chorizo a 6 (no 7 y 8) por los cambios de los vecinos; mermelada a $400 (no $500).
2. Las cosas nuevas entran por la «pide» de los puestos (la paga ×1,5) y sólo con los lugares libres (nueve por puesto).
3. Los pedidos de la granja, sólo desde el nivel 3, para no cambiar lo que ya está (niveles 0 a 2 iguales).
4. La salida pública es de cupo, no de un comprador nuevo: tienda 6 lotes y feria 3, y las dos con 12 clases; la tienda guarda lo de una receta.
5. Los ocho precios, a 4 veces o menos; los cuatro de 4,1 a 4,4 quedan.
6. La renta ×2 también para lo ya alquilado.

## Resultado del barrido

275 pruebas `verificar-*.mjs` (las que nombran comercio, mercado, propiedad, oficios, pedidos, banco, negocio, economía, precios, obras, cocina, granja, guía, idioma, carga, construcción o puestos): **275 en verde, 0 fallan** (después de ajustar las pruebas viejas de arriba; `node armar.mjs` armado antes porque varias leen `index.html`). Mutaciones: **49 de 49 atrapadas**.
