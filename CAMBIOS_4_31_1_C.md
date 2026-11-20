# 4.31.1 · C — cacería de bugs: el mundo, la física y la naturaleza

Pedido: «mega cacería de bugs de todo el juego». Zona C: lo nuevo de la naturaleza (4.31.0 C), cada zona del valle, la física, el agua,
el clima, las calidades con Ultra y una partida larga. Rama `v4311-c` (desde main = 4.31.0). Nadie contestaba preguntas: lo decidido va
anotado.

## Cómo se buscó
1. **Inventario desde el código** de lo nuevo de la 4.31.0 C (`naturaleza-juego.js`, `naturaleza-toque.js`, `naturaleza-mundo.js`, la
   entrada `naturaleza` de `interacciones.js`, su enganche en `main.js`), tachado uno por uno: sacudir arbusto y árbol chico, frutos,
   arrancar pasto y amancay, leña suelta, tocar el agua, sapito, piedritas y piñas, salpicar, ripio, ramitas, mojarse y gotear, roce de
   matas, ranas, mariposas; y el orden de la E contra las otras teclas.
2. **Barridas en la partida real** (`pruebas/humo-4-31-1-c.cjs`, minimizado, con el candado; secciones con `HUMO_PARTES`):
   `dentro` (todo el mapa con las reglas del juego: piedritas, piñas y leña adentro de troncos, paredes o bajo pisos; árboles y matas
   atravesados por paredes), `caidas` (289 lugares de punta a punta), `puente`, `avisos`, `sapito`, `tronco`, `flota` (troncos en el aire
   en las laderas), `malla` (el suelo dibujado contra el que se pisa, 2.618 lugares), `esquina` (las esquinas del valle), `invierno`
   (invierno, noche, lluvia y nieve), `ultralog` (Ultra: qué programa deja avisos en la consola), `desafio`.
3. **Antes y después** con la misma partida: `main` 4.31.0 armado aparte (worktree temporal `trabajo\t4311-c-antes`, borrado al final) y
   esta rama. Capturas en `pruebas/salidas/humo-4-31-1-c/` (las de antes, en `antes/`).
4. **Partida larga** (`pruebas/humo-4-31-1-c-largo.cjs`): 45 minutos en Alta + Ultra, minimizada.

## Arreglado (por gravedad)

### Se ve mal
| # | Bug | Causa | Arreglo | Visto (antes → después) |
|---|---|---|---|---|
| 1 | **Un piso plano gris verdoso cortaba el bosque en las esquinas del valle** (en (−410, 363) los troncos terminaban en un plano; en la esquina +x +z, una lámina a 18 m sobre una cañada de 1,4 m, visible desde arriba) | `cielo.js`: el primer anillo del piedemonte de la cordillera (520 m) queda a 18 m; en las diagonales cae adentro del cuadrado del valle (hasta 724 m), y donde el suelo de las esquinas es más bajo que 18 m, asomaba | lo del piedemonte que cae adentro del cuadrado del valle va a −12 m (el terreno lo tapa siempre: en el borde sube 95 m). Afuera no cambia nada | `esquina`: 430 de 800 lugares de las esquinas con la cordillera por encima del suelo → 0 · `antes/esquina-0.jpg` → `esquina-0.jpg` |
| 2 | **Troncos con el pie en el aire en las laderas** (1.679 de 8.116 árboles; 1.373 con más de 10 cm, 160 en lo caminable; hasta 1,3 m en las laderas del borde) | `vegetacion.js`: el tronco nacía siempre 25 cm bajo el suelo del centro | se entierra hasta 8 cm bajo el punto más bajo del suelo alrededor del tronco (8 puntos; tope 1,5 m más). Ni la x ni la z cambian: mismos árboles, misma cantidad (la huella del bosque sigue). Los pehuenes, igual | `flota`: 1.679 → 0 |
| 3 | **El suelo dibujado se despegaba del que se pisa** (en Alta, la malla toma cada 4,27 m el nodo de 2 m más cercano: corrido hasta 1 m en las laderas) | `main.js`: `p.setY(…, T.alturas[Math.round(j * salto)…])` | cada vértice con `T.altura` en su lugar (la misma cantidad de vértices; el parche fino de la aldea sigue cosiéndose a la gruesa igual) | `malla` (2.618 lugares fuera de la aldea): mediana 6,5 → 2,9 cm, p95 28,5 → 12,9 cm, p99 45,8 → 23,7 cm, máx 1,21 → 0,81 m · en Node (Alta): p95 33,5 → 12,4 cm |
| 4 | **Atados de leña y piñas metidos adentro de los troncos** (120 de 2.864 a la vista en todo el mapa) y la E «Juntar la leña suelta» pegada a un tronco | `naturaleza-juego.js`: `sueloPiedra` y `lugarLena` miraban el terreno, el bosque y los caminos, no las colisiones | `ocupado(x, z, margen)` con las colisiones de siempre (troncos, postes, paredes; sin lo despejado ni lo talado sin tocón) y los pisos (`plataformaBaja` más alta que el suelo): la piedrita deja 15 cm, el atado 70 cm (mide 1,3 m) | `dentro`: 120 → 0 · `antes/tronco-*.jpg` → `tronco-*.jpg` (la leña ya no está ahí) |
| 5 | **Piedritas debajo de un piso** (el deck de la Cabaña del Pescador, un puente) | ídem | ídem (los pisos cuentan) | `puente`: 2 bajo pisos → 0 |
| 6 | **El sapito picaba en la tierra de enfrente**: con 7 a 9 saltos la piedra llega a 18 m y sólo se miraban 7 m de agua: en una orilla angosta, las ondas y el «plof» salían sobre la tierra | `tirarPiedra` no miraba dónde caía cada pique | se recortan los piques al último que cae en el agua (ahí se hunde) y el récord anota los saltos de verdad | `sapito` (3 tiros de nueve saltos en orillas de 8,5 a 14 m): 24 de 30 ondas en tierra → 0 de 6 |
| 7 | **El aviso X3595 de la placa con Ultra** en la consola («gradient instruction used in a loop», de dos programas; 4.31.0 A lo había visto sin saber de cuál) | `ultra-cine.js` (el desenfoque de las cinemáticas): `texture2D` dentro del lazo (y en `zDe`, que el lazo llama), después de un `return` que depende del píxel | `textureLod(…, 0.0)` (las texturas no tienen mipmaps: se lee lo mismo). 0 programas nuevos | `ultralog`: 2 programas con el aviso → 0 (124 programas) |
| 8 | **Ranas adentro de un tronco o debajo del muelle** | `buscarOrilla` sólo miraba el agua | también `ocupado` | Node (prueba 8) |
| 9 | **Las gotas del jugador mojado atravesaban el piso** (en un puente o adentro de una casa caían hasta el terreno de abajo) | las partículas sólo conocían el terreno y el agua | `gotear(x, y, z, piso)`: parado en un piso, la gota se queda ahí | Node (prueba 5) |

### Molesta
| # | Bug | Causa | Arreglo | Visto |
|---|---|---|---|---|
| 10 | **El aviso de la naturaleza tapaba a las otras teclas del lugar**: con el hacha, mirando un ñire o un arrayán, el aviso decía «E · Sacudir…» y no «H · Talar el árbol»; lo mismo con el fogón apagado (F), tu fuego (F), la carpa armada (T) y el banco de aserrar (Y). El aviso muestra una sola cosa y lo de la E va primero | la entrada `naturaleza` es de la E (va antes que `OTRAS_TECLAS`) | `interacciones.js`: la entrada tiene `sigue` y su aviso cede (`otraTeclaManda`) a la tecla del lugar: tu fuego, los fogones, levantar la carpa, el banco de aserrar, y el hacha si mirás el árbol chico o tenés al lado el tronco o la roca. **La E sigue sacudiendo.** No cede a lo que se ofrece en cualquier lado (plantar con semillas encima, aserrar a mano, armar la carpa, cocinar): taparía la naturaleza siempre | `avisos`: «E · Sacudir el arrayán» → «H · Talar el árbol»; sin el hacha, «E · Sacudir el arrayán» (`antes/avisos-hacha.jpg` → `avisos-hacha.jpg`) |
| 11 | **Desde un puente o un andén se pateaba la piedrita de abajo** (también desde la trochita, que pasa por arriba del balasto con piedritas) | `patea` mira la distancia en el plano | sólo se patea la que está a tu altura (± 45 cm) | `puente`: parado en el deck de la Cabaña del Pescador a 1,47 m, la de abajo rodaba 1,31 m; después no quedan piedritas bajo pisos y la regla queda en Node (prueba 2) |
| 12 | **«Tocar el agua» desde un puente o un muelle** (agachado mirando abajo, con el agua a 2 m) | sólo se miraba si había agua adelante | el agua, a menos de 90 cm de los pies | Node (prueba 3) |
| 13 | **Sacudir una mata, juntar leña, arrancar el amancay o tirar el sapito a través de una pared** (desde adentro de una casa, la mata de afuera) | los candidatos no miraban las paredes | `tapado`: `col.paredEntre` entre vos y lo que tocás (las puertas cerradas cuentan); la leña, además, a tu altura (± 1,2 m) | Node (prueba 4) |

## Lo que se recorrió y está bien (sin cambios)
- **Caídas**: 289 lugares de punta a punta, apareciendo y corriendo: nadie bajo el suelo, fuera del mapa ni con números raros (antes y
  después de los arreglos del terreno y los árboles).
- **Árboles y matas en paredes o bajo pisos**: ningún árbol; una sola mata (ver anotado).
- **Invierno, de noche, con lluvia**: sacudir y la leña con su aviso, nadar en el lago y salir («Quedaste empapado»): sin errores.
- **Desafío**: no se crea nada de la naturaleza; caminar sin errores.
- **Partida larga** (45 min, Alta + Ultra, 68.160 cuadros, 76 lugares, las cuatro estaciones, lluvia, nieve y despejado, de día y de
  noche, la E de la naturaleza): 0 fallas del bucle y 0 errores en la consola salvo el aviso X3595 (arreglado arriba). Memoria del minuto 3
  al final: montón 307 → 307 MB (picos de 347 que se liberan), geometrías 1.029 → 1.221 (crecen los primeros 15 min al conocer lugares y
  después quedan entre 1.211 y 1.230), texturas 69 → 77, objetos de la escena 3.201 → 3.202. Sin fugas. Datos en
  `pruebas/salidas/humo-4-31-1-c/largo.json`.

## Anotado (sin tocar, con el motivo)
- **La mata `parche0` en (−406,3, −307,3)** está debajo de un peñasco grande (una pared gruesa de 1,3 m sin nombre): es un parche del
  suelo y no se ve; no se tocó (no se sacan plantas: la huella del bosque).
- **Nevando te mojás** como con lluvia (despacio, sin techo): se dejó (la nieve también moja la campera).
- **El pasto arrancado** usa la misma máscara que el hueso escondido de los huevos de pascua: si arrancás pasto adentro de ese claro y el
  hueso aparece después, a las 6 h el pasto vuelve un poco sobre el claro. Raro y menor.
- **Rozar matas corriendo por un matorral** rehace el bloque del sotobosque (0,1 a 0,6 ms) hasta unas 5 veces por segundo en el peor caso:
  medido en la 4.31.0; no se cambió.
- **Sapito sobre una baranda**: la baranda cuenta como pared y el sapito no se ofrece. Se dejó: así tampoco se tira desde adentro de la
  cabaña.
- **La sombra de contacto de los árboles** (el disco oscuro al pie) sigue plana a la altura del centro: en una ladera fuerte puede quedar
  apenas en el aire del lado de abajo. No se tocó (es un disco translúcido; bajarlo lo metería en el suelo del lado de arriba).
- **La malla del suelo en Media y Baja** también mejora con el arreglo 3 (en Node, p95 en Media 35 → 23 cm, en Baja 54 → 43 cm), pero
  sigue más gruesa que en Alta: es su resolución.

## Pruebas
- `pruebas/verificar-4-31-1-c.mjs` (en `verify:pasos`): los trece arreglos con el código de verdad (las reglas de la naturaleza con un
  mundo de mentira con colisiones; el aviso con la tabla de verdad; el shader del cine, el bloque del tronco, la línea de la malla y la del
  piedemonte evaluados desde el texto del código) y **21 mutaciones**: 66 comprobaciones, en verde.
- Pruebas viejas que leen lo tocado, todas en verde y **ninguna ajustada**: las 66 que nombran `interacciones` o la naturaleza, las 22 que
  leen `verify:pasos`, las 40 que leen `vegetacion`, `terrenoDetalle`, el nombre del terreno o `ultra-cine`, y las 58 que leen `cielo`
  (entre ellas `verificar-4-31-0-c.mjs`: 171 comprobaciones y 31 mutaciones; los textos de sus mutaciones se respetaron).
- Partidas: `pruebas/humo-4-31-1-c.cjs` (barridas, antes/después) y `pruebas/humo-4-31-1-c-largo.cjs` (partida larga).

## Reglas
- **0 programas de shader nuevos** (el cine cambia el texto de su programa; la cuenta queda igual: 124 con Ultra). Sin luces, sin capas,
  sin mallas nuevas. Nada nuevo por cuadro: lo de las colisiones corre al armar las piedritas y la leña (cada medio segundo, al moverte) y
  en los candidatos de la E (10 veces por segundo, sobre lo que mirás); el tronco y la malla, una vez al cargar (8 lecturas de altura por
  árbol y una por vértice).
- Sin claves nuevas de guardado (`pie` de los árboles es de la carga, no se guarda).
- El terreno (`T`) no cambia: la huella de `verificar-2-2.mjs` sigue igual. Los árboles no se mueven ni cambian de cantidad.
