# 4.29.0 (B) — Ultra en los detalles: fuego, rastros y vida chica

Todo lo de esta zona vive detrás de `esUltra(ajustes)` **y** de la calidad que corre (`calidadActiva === 'alta'`), como la 4.28.0 (B). Con Ultra
apagado no se arma ninguna malla, textura ni programa, las luces se copian igual, el humo sube con la fórmula de siempre y las huellas son las
de siempre: Alta, Media y Baja son la 4.28.0. Se prende y se apaga **en vivo** (al apagarlo, también por la autocalidad, se suelta todo y vuelve
lo de siempre).

## Qué hay
Archivo nuevo `src/ultra-vida.js` (las llamas, los puntos, las telarañas, las huellas finas y el conjunto que se revisa en cada cuadro). Tres
programas de Ultra, cada uno con su clave (`ultra-vida-4.29.0|llamas`, `|puntos`, `|telas`): las llamas, **un solo dibujo de puntos** para
chispas, gotitas, salpicaduras, la lluvia que rebota, luciérnagas y pájaros, y las telarañas. Tocado, quirúrgico:
- `clima.js`: `ponerUltraB(v)` (sólo la llama Ultra): el humo de las chimeneas y del fuego se dobla en el rumbo del viento; las luciérnagas de
  siempre se esconden; las chispas redondas de siempre bajan (0,55 → 0,22) y la luz del fuego deja los dos senos parejos (titila con el ruido
  de abajo). Con Ultra apagado, las ramas `else` son el código de siempre, línea por línea.
- `luces.js`: el presupuesto de luces llama a `api.temblor(fija, fuente)` al copiar cada luz **sólo si alguien lo puso** (Ultra); empieza en `null`.
- `huellas.js`: `pausar(v)` y `reponer()` (con Ultra, las huellas de siempre quedan en pausa y las finas ocupan `U.uHuellas`; al apagar vuelven).
- `cocina-mundo.js`: las llamas (conos) de la parrilla y del horno quedan anotadas (`anotarLlamaUltra`): con Ultra se esconden y arde la llama nueva.
- `ultra-bosque.js` (el suelo de Ultra, de la 4.28.0): suma el barro pisado y el hundido de la pisada.
- `main.js`: import, `crearUltraVida` junto al clima, la revisión después de las huellas, `__ultraVida` en depuración.

### 1. Fuego
- **Llamas que se mueven** en los fogones (el del refugio, los tuyos, los de los puestos), las estufas y los hogares (fuegos contenidos, más
  chicos y adentro) y la parrilla y el horno de la cocina: tres lenguas por fuego que miran a la cámara, con una turbulencia que sube y se come
  el borde (lenguas sueltas), rojo en las puntas, naranja, amarillo y un corazón casi blanco abajo; el viento acuesta la punta.
- **Chispas que suben** (18 por segundo en un fogón, 3 en una estufa), bailan con el aire caliente y se las lleva el viento.
- **La luz que titila**: un ruido (un vaivén lento, uno rápido y bajones de golpe, de 0,6 a 1,35) en vez de los dos senos parejos, y la luz se
  corre unos centímetros (± 10 cm): lo que está cerca tiembla.
- **El humo que se dobla con el viento** (chimeneas y fuegos): en el rumbo del viento, más con las ráfagas, y más acostado cuando sopla fuerte.
- **Velas y faroles que tiemblan apenas**: toda luz puntual tibia (naranja) que no es un fuego, ± 7 % al copiarse.

### 2. Rastros
- **Huellas en la nieve y el barro**: una textura más fina (512 × 512 sobre 24 m: 4,7 cm por texel, contra 25 cm la de siempre) con pisadas
  con forma (un óvalo de 26 × 11 cm a lo largo del paso, el talón más angosto), un pie y el otro; las tuyas, las de la **gente cercana** (a menos
  de 24 m) y las de los animales. Sigue al jugador **corriendo lo pisado** (no se borra al moverse) y se borran solas en unos dos minutos y medio
  (más rápido si nieva o llueve fuerte). En el barro (el suelo que no es nieve: más en el camino y la tierra, y más con el suelo mojado) la
  pisada es tierra removida más oscura; en las dos, el hundido inclina la normal (sale de la textura con cuatro vecinos: con las derivadas de
  pantalla se veía en escalones).
- **Salpicaduras** al pisar con el suelo mojado donde se juntan los charcos (camino, tierra, ripio y lajas; no en el pasto): gotitas que saltan
  (vos y la gente a menos de 18 m).
- **La lluvia que rebota** en el suelo, las piedras, la plaza y **los techos** (la altura del techo sale del mapa de techos de la lluvia): una
  corona chata que se abre y dos gotitas que saltan, unos 1.300 por segundo alrededor de la cámara (dos de cada tres adelante), con la luz del
  cielo. En el agua no (los anillos son del lago).

### 3. Vida chica
- **Luciérnagas** en las noches de verano (no en otoño, invierno ni con lluvia), en el prado y el borde del bosque (no adentro del bosque
  cerrado, ni en la estepa ni en el agua): destellan (suben en 0,15 s y se apagan en casi un segundo, cada 1,6 a 4,2 s) y suben un poco al
  destellar. Reemplazan a las de siempre (que brillan parejo en todos lados).
- **Telarañas con rocío** a la mañana (de 5 a 10, más al alba; no con lluvia ni nieve) en los arbustos (calafate, notro, maqui, chilco…: la mitad
  tiene una) y en tus cercos y tranqueras: rayos, espiral y gotas de rocío que devuelven el sol; se inflan con el viento.
- **Bandadas de pájaros** en el suelo abierto (el camino, la tierra, la plaza) que picotean y dan saltitos y **se espantan** cuando te acercás a
  menos de 7,5 m (12 si venís corriendo): salen volando lejos de vos, aleteando y subiendo; otra bandada aparece más adelante después de un rato.

## Dónde mirarlo (capturas en `C:\Users\Andres\AppData\Local\Temp\hx\b4290\`)
- **El fogón de noche** (`v5-verano/f1-fogon-noche-s0..s2.jpg` contra `f1-fogon-noche-alta.png`; recorte `f1v5.png`): en Alta una mancha de
  puntos que brillan; en Ultra lenguas de fuego que cambian de forma de una captura a la otra, chispas chicas y las luciérnagas alrededor.
- **La luz del fuego** (medida en la partida, 30 muestras cada 40 ms, `v5-verano/eval-f1-fogon-noche-datos.json`): Ultra de 3,6 a 6,25
  (desvío 0,85) y la luz se corre ± 10 cm; Alta de 4,5 a 7,9 (0,98), con los dos senos, y quieta. **Las luces tibias de la cabaña** (faroles y
  velas): en Ultra 2,08–2,26 y 3,78–4,11 (± 4 a 5 %); en Alta 2,2 y 4,0 fijas; la luz fría (`#454f69`) igual en las dos.
- **El humo con viento** (`v3-invierno/c1-humo-viento*.png`, invierno, viento fuerte): en Ultra el humo de la chimenea sale acostado en el
  rumbo del viento y más bajo, y cambia con las ráfagas (`-s0..s2`); en Alta sube más y más derecho.
- **Barro pisado** (`v4-verano/h1-barro.png` contra la corrida de Alta `a4-verano/h1-barro.png`; recorte `h1-ua.png`): en Ultra una fila de
  pisadas oscuras y hundidas en el camino mojado; en Alta nada (no hay huellas fuera de la nieve).
- **Nieve pisada** (`d2/h2-nieve-s0.jpg` de cerca y `v3-invierno/h2-nieve.png`; recorte `h2-ua.png`): pisadas con forma (un pie y el otro,
  con el hundido). En esta toma Alta no deja huellas ni en la rama ni en la 4.28.0 (`a6-base-invierno`, `a4-invierno`): el paseo de la
  herramienta no las marca con las de siempre; no es de esta rama.
- **La lluvia que rebota** (`v4-lluvia/g1-plaza-lluvia-s0..s2.jpg` contra la corrida de Alta `a5-lluvia`; recorte `g1-ua.png`): coronitas con
  dos gotas en el ripio de la plaza (400 a la vez alrededor de la cámara); en Alta, el ripio liso.
- **Luciérnagas** (`v3-verano/l1-luciernagas-s0..s2.jpg`, `l1v2.png`): en el borde del bosque, en otro lugar en cada captura (destellan); en
  Alta los puntos de siempre, parejos.
- **Telarañas** (`v4-verano/t1-telas.png`, 7:20; recorte `t1v4z.png`): la tela con rayos, espiral y gotas en una mata; en Alta no hay.
- **Pájaros** (`v4-verano/p1-pajaros-s0..s4.jpg`, `p1v4.png`): una bandada posada en el camino (s0) que al acercarte sale volando (s1: una nube
  de siluetas aleteando) y se aleja (s2 a s4).

## Medición (una vez, al final)
Bucle real de la partida (`med.js`, como la pasada final de la 4.28.0: 3 rondas de 54 cuadros, sin el freno de la ventana, la placa por el
cronómetro del juego), alternando **Ultra entero**, **Ultra sin lo de B** (ultra-vida apagado) y **Alta** en la misma partida. Mediana de las 3
rondas, ms de placa por cuadro:

| encuadre | Ultra | Ultra sin B | Alta | lo de B |
|---|---|---|---|---|
| plaza de día (05) | 36,0 | 36,2 | 27,2 | ≈ 0 (−0,2) |
| bosque denso (b1) | 32,3 | 32,8 | 25,5 | ≈ 0 (−0,5) |
| el fogón de noche (f1: llamas, chispas, luciérnagas) | 29,8 | 29,8 | 20,6 | ≈ 0 |

La CPU, igual con y sin B (plaza 20,2 contra 20,9; bosque 7,8 contra 7,3; fogón 12,0 contra 11,7). Llamadas de dibujo: +2 a +4. **Lo de B
entra con holgura en el 1 ms.** Ojo: toda esta tanda salió más cara que la de la 4.28.0 (Alta en la plaza 27,2 contra 24,2; Ultra 36,0 contra
31,6), con A y C usando la máquina en las mismas horas: los absolutos no sirven para el tope de 33 ms de Ultra entero; la diferencia con y sin B,
alternada en la misma partida, sí. **Hay que medir Ultra entero al juntar.**

## Criterios
- **Ultra apagado = 4.28.0**: en la partida real, la base (4.28.0, `git archive` de `main`) y la rama con Ultra apagado tienen **los mismos
  programas** al empezar (103) y en cada toma (105 en la plaza, el bosque denso y el fogón). Capturas base contra rama dentro del ruido de dos
  corridas de la base entre sí: plaza 3,1 de media (8,4 % de píxeles > 8) contra 4,2 (12,2 %) de ruido; bosque denso 10,3 (27,2 %) contra 13,1
  (34,5 %); fogón 10,1 (35,8 %) y 7,8 (23,2 %) contra 9,5 (30,4 %) (el bosque y el fogón cambian con las nubes, el viento y el fuego). En Node:
  con Ultra apagado el humo sube exactamente con la fórmula de siempre (punto por punto), la luz del fuego también, el presupuesto de luces copia
  igual (`temblor` en `null`) y las huellas de siempre marcan como siempre.
- **Prueba** `pruebas/verificar-4-29-0-b.mjs` (en `verify:pasos`): **62 comprobaciones**, 28 mutaciones (un proceso por copia de
  `ultra-vida.js` o `clima.js`), todas fallan.

## Qué quedó afuera / decisiones
- **El horno de la panadería, el de la cerámica y la fragua de la aldea**: no tienen fuego a la vista (humo, y chispas en la fragua); las
  llamas de Ultra van donde hay fuego: los fogones, tus estufas y hogares, la parrilla y el horno de la cocina.
- Las llamas son tres lenguas planas que miran a la cámara (desde arriba se ven planas); el resplandor alrededor es el de las chispas de
  siempre (bajadas a 0,22) y el bloom.
- **Huellas en el ripio y las lajas de la aldea**: no (las del barro van en el suelo del valle, `materialTerreno`); en la aldea quedan las
  salpicaduras.
- **Salpicaduras «en los charcos de la 4.28.0»**: esos charcos salen de texturas dentro del programa de C; acá se salpica donde el suelo está
  mojado y no hay pasto (el camino, la tierra, el ripio y las lajas), no charco por charco.
- La lluvia que rebota no mira las piedras sueltas del valle (rebota en el suelo y en los techos del mapa de la lluvia).
- Las luciérnagas de Ultra reemplazan a las de siempre (con Ultra, las de `clima.js` se esconden).
- Los pájaros salen sólo en el suelo abierto (el camino, la tierra, la plaza): en el pasto alto no se los vería.

## No visto a ojo
- **Las huellas y las salpicaduras de la gente cercana**: en ninguna toma pasó alguien caminando cerca por el barro o la nieve (la prueba de
  Node las cubre: las pisadas de la vecina y sus gotitas).
- La llama y las chispas de **la estufa, el hogar y la cocina** (no se armó una obra ni una receta para la captura; la prueba cubre la llama de
  la parrilla y el cono escondido).
- La lluvia que rebota **en un techo** (la prueba lo cubre con el mapa de techos) y las telarañas en **los cercos** (sólo se vieron en matas).
- Las capturas «par» de la herramienta (`-alta.png`, justo después de apagar Ultra en vivo) a veces salen con el cuadro anterior: para el barro,
  la nieve y la lluvia se usaron corridas de Alta aparte (`a4`, `a5`).

## Claves de guardado
Ninguna nueva.

## Pruebas
- Nueva: `pruebas/verificar-4-29-0-b.mjs` (62, 28 mutaciones), en verde; en `verify:pasos`.
- Previas: las 290 `verificar-*.mjs` que leen `main.js`, `clima.js`, `luces.js`, `huellas.js`, `cocina-mundo.js` o los `ultra*` (de a tres),
  en verde; `verificar-4-18-0-optativas-a` (carpeta temporal) y `verificar-4-24-1-c` (contó las copias de mutación de otra prueba que corría en
  paralelo) fallaron así y pasan solas. Ninguna vieja hubo que ajustar (las que cuentan programas y texturas ya no cuentan los `ultra*`).
- No se corrió `npm run verify` completo.
