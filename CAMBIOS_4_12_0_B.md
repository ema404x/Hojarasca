# 4.12.0 · parte B: rocas y terreno (rama `v4120-b`, sale de `main` = 4.11.5)

Primera de la serie de mejoras visuales (la parte A, bordes suaves, va en otra rama y toca el postproceso; acá no se tocó). **No se subió la versión**, no se tocó `main`, sin etiqueta ni zip.

## Qué se hizo

### Rocas: de un modelo a cinco (`src/vegetacion.js`)
Todos de bultos suaves y pintados, sin texturas ni modelos externos, con el mismo material y el mismo `aTipo` de siempre (el musgo sale del shader existente): ningún shader nuevo.

| Modelo | Nombre en el código | Carácter |
|---|---|---|
| Peñasco redondeado | `roca` | el de siempre |
| Lajas apiladas | `roca1` | tres losas de gris distinto, giradas; musgo en la de arriba |
| Canto rodado | `roca2` | liso y bajo, veta clara y granitos, sin musgo |
| Roca partida | `roca3` | planos de quebradura más claros, aristas redondeadas |
| Peña con musgo y líquenes | `roca4` | alta, abollada, mucho musgo y manchas de liquen ocre y verde pálido |

- **Reparto** (`modeloDePiedra`, función pura exportada): un hash de la posición, no gasta números al azar, así que el resto del bosque sale igual. Depende del lugar (ladera: roca partida y lajas; orilla: cantos; suelta; grupo del paisaje) y del tamaño (las chicas, cantos; las grandes, peñascos y peñas). Cada grupo de rocas del paisaje tiene un modelo dominante, como un afloramiento.
- **Cada piedra con lo suyo:** proporción propia (ancho, fondo y alto por posición) y hundimiento propio por modelo (el canto se entierra más). Se apoyan en la ladera con el mismo ajuste de la 4.6.0, medido con los puntos de cada modelo.
- **Baja y Mínima:** una sola piedra, la de siempre, un solo bloque: mismo costo y misma imagen.
- **Nada se movió:** árboles, matas, choques y cantidad de rocas dan idéntica huella que la 4.11.5 (Media 6926 árboles / 24793 matas / 665 rocas / 7341 choques; Alta 640 rocas; Baja 639). La colisión de las rocas grandes y la recolección con pico siguen igual (probado en partida real con cada modelo).
- Los modelos y su cantidad: 720, 1500, 720, 980 y 980 triángulos (un bloque instanciado por modelo).

### Terreno (`src/materiales.js`, `materialTerreno`)
Un bloque dentro del `onBeforeCompile` que ya existía, detrás de `uDetalleSuelo` (Media y Alta; Baja y Mínima no lo corren) y apagado con la distancia (de 180 a 300 m). Sin uniformes, texturas, luces ni shader nuevo; alturas y huella intactas.
- Prado: franjas de pasto seco y de verde hondo.
- Piso del bosque: manchas de musgo y de hojarasca, pozos más oscuros bajo las copas.
- Claros ralos: tierra pelada. Camino: borde de pasto quemado, motas y pedregullo. Borde del bosque: más dorado, en transición hacia el claro.
- Estepa: manchas más tibias y más frías.
Cuesta 3 ruidos de valor más por píxel de terreno cercano.

## Verificación
- **`pruebas/verificar-4-12-0-rocas.mjs`** (en el gate): **151 comprobaciones** (modelos, huellas idénticas a la 4.11.5, reparto, hundimiento, terreno, Baja sin cambios).
- **`herramientas/mutar-4-12-0-rocas.cjs`**: 28 mutaciones, **las 28 hacen fallar la prueba** (la primera tanda dejó pasar 8 y se reforzó la prueba: función pura del reparto, hundimiento medido, pesos del terreno).
- Se ajustó `verificar-4-6-0-rocas.mjs` en dos líneas: ahora busca la malla del modelo real de cada roca (`porTipo[ref.tipo]`) y acepta los argumentos nuevos de `colocarRoca`. Sus números (665/639, bordes y panza) no cambiaron.
- **Partida real** `pruebas/humo-4-12-0-rocas.cjs` (Electron en el monitor externo, perfil propio, con ventana visible): sin errores de consola ni de shader; Baja con un bloque y Media con cinco que comparten material; cada uno de los cinco modelos se pica (4 golpes, 4 piedras) y su instancia desaparece; la piedra grande de cada modelo frena al jugador; guardar y recargar da los mismos modelos en los mismos lugares; dibujos de piedras ≤ 5.
- **Gate:** ver el informe final (`npm run verify` de corrido).

## Costo medido (notebook Ryzen 7 7730U, `medir-vistas.cjs`, 150 cuadros por vista, 2 corridas alternadas A B A B)
La notebook no es la 4600G: sirve para antes/después. La máquina estaba compartida con otras corridas, hay ruido de ±3 ms entre corridas del mismo código.
- **p50 por vista, antes → después** (dos corridas cada uno), Media: refugio 11,3/8,2 → 9,3/8,6; bosque 9,2/7,7 → 8,1/8,1; bosque tarde 8,1/7,8 → 6,9/7,8; lago 7,0/6,5 → 7,6/6,9; molino 23,7/14,0 → 14,9/14,7.
- Alta: refugio 17,3/12,7 → 13,6/15,1; bosque 8,6/8,6 → 8,7/8,5; bosque tarde 8,9/8,8 → 8,7/7,9; lago 11,1/14,8 → 11,6/11,6; molino 11,5/12,4 → 12,3/9,5.
- **Lectura honesta:** no hay empeoramiento sistemático medible, dentro del ruido; el costo teórico es chico (hasta 4 dibujos más y 3 ruidos más por píxel cercano). No se puede afirmar «cero»: no se midió en la 4600G.
- **Dibujos por cuadro** (`llamadas`, antes → después): Media 227/228 → 236/228 (refugio), 167/173 → 161/169 (bosque), 244/249 → 254/244 (molino); Alta bosque 226/225 → 249/231. Las piedras suman a lo sumo 4–5 dibujos (uno por modelo con piedras a la vista) contra 1 antes, y se mezclan con el movimiento de la vista. Triángulos: iguales (±1 %). En Baja, sin cambio.
- Las luces fijas no cambiaron (4+1) y no se compila ningún programa nuevo (mismo material).

## Capturas
Mismos encuadres antes y después, Media y Alta, con ventana visible (están en una carpeta temporal, no en el repositorio). Miradas: las rocas con musgo y líquenes ocres y las lajas se leen pintadas y distintas entre sí (en la estepa se ven bien); en el prado el terreno gana franjas oscuras y claras y el camino un borde de pasto; el bosque cerrado queda casi igual porque los árboles tapan el piso.

## Lo que no se pudo verificar
- **Rendimiento en la 4600G** (ni la caminata `medir-caminata.cjs` ni el banco de pruebas del juego): faltan. Comando: `npm run medir:caminata` con `REPETIR=3` y ventana visible en cada versión, y `medir-vistas.cjs` en Media y Alta; comparar p50/p95 y dibujos.
- Ojo humano sobre movimiento y noche: las capturas son de día, fijas. No se miró de noche ni con lluvia, nieve u otoño (el terreno nuevo se mezcla antes de esos efectos, pero no se vio).
- La variedad del terreno no se vio con la hierba alta que el suelo tapa: en el prado cercano se lee poco.
- Los encuadres «antes/después» del bosque cerrado son poco informativos (árboles tapan el suelo).
- El inglés no se escribió.
