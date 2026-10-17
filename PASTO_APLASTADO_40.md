# Aplastado del pasto (4.0, rama `pasto-aplastado-40`, sin unir, sin push)

Sólo el aplastado: el pasto, las flores y los helechos se aplastan donde pasan el jugador, el perro, el caballo y los dos pudúes más cercanos, y las huellas se levantan solas en unos 7 segundos. Sin musgo, sin hojarasca, sin flores nuevas, sin textos y nada nuevo en la partida. El viento y el empuje del jugador que ya existían no se tocaron.

## Qué hace
- `src/pisadas.js`: 24 «pisadas» en un único uniforme (`U.uPisadas`, un arreglo plano de 24·4 números: x, z, radio, fuerza; el three recortado no trae `Vector4`). Las 4 primeras siguen a los animales; las otras 20 son huellas del jugador, una cada 1,3 m (radio 0,8; 1,5 si vas a caballo).
- Las huellas se apagan con una curva suave (sin quiebre al empezar ni al terminar). Si caminás rápido el anillo de huellas se recicla antes de los 7 s, así que cada huella dura menos (el 90 % de lo que tarda en volver a tocarle): ninguna se apaga de golpe al reciclarse.
- `src/pasto.js`: función `pisadas(b)` en el GLSL del anillo (sale rápido de las pisadas apagadas o lejanas) y tres bloques `#ifdef RICO` (hierba, flores, helechos). `RICO` sólo se define en calidad alta (`pasto > 60000`); en media y baja el shader es el de antes, sin uniforme leído.
- El efecto se apaga entre 14 y 22 m de la cámara (suave, sin corte) y no se calcula más allá.
- `src/main.js`: una línea por cuadro, `crearPisadas(...).actualizar(dt, js.pos, montado)`. Usa `dt` del juego (el de pausa o foto congelada no avanza).

## Prueba
- Pura, en el verify: `pruebas/verificar-4-0-pisadas.mjs` (calidad baja no escribe nada; caminando a 4 m/s ninguna huella se apaga con salto mayor a 0,08 por cuadro; quieto 8 s se levantan todas; el shader lee las pisadas sólo con `RICO`; el empuje del jugador sigue idéntico). El verify pasó de 225 a 226 pasos.
- En movimiento, en el juego real: `pruebas/camina-pasto-40.cjs` (Relax, alta, verano, mediodía). Se busca un pastizal llano y abierto cerca del refugio, el jugador camina 16 m con `KeyW` sostenida (cuadros de 0,05 s de juego: la ventana no necesita ir a tiempo real) y se saca: antes de pasar, pasando, 3 s y 8 s después. Cuatro variantes: mirada a media altura y mirada más baja, cada una sin el perro y con el perro a un costado del recorrido. Capturas en `Documents\Hojarasca\trabajo\pasto40\` (`atras-*`, `bajo-*`, `atras-perro-*`, `bajo-perro-*`).
- Sin errores en la consola durante la caminata.
- Nota de método: la primera tentativa usó una cámara fija lejos del jugador y el pasto «desaparecía». No era del aplastado: el anillo de pasto se arma alrededor de la cámara real del juego y se recorta por hacia dónde mira. Las capturas válidas usan la cámara del juego (se camina hacia adelante y se mira hacia atrás).

## Resultado (honesto)
- **Funciona caminando.** Se ve un carril de pasto inclinado hacia los costados y más bajo, con la tierra asomando en el centro mientras pasás; a los 3 s ya se está parando de a poco y a los 8 s está casi como antes. No quedan huecos duros ni matas «cortadas»: la planta se dobla y se agacha, no desaparece. No vi parpadeos ni saltos en las secuencias; el borde de 14 a 22 m se esfuma suave (con el pastizal de 16 m, el extremo lejano sale con la fuerza ya atenuada).
- **Es un efecto sutil.** En pasto alto y a la altura de los ojos, el carril se lee bien sobre todo mirando para abajo; mirando hacia adelante casi no se nota (el pasto se aplasta bajo tus pies y alrededor tuyo). El perro apenas deja marca visible porque se esconde en el pasto; el aplastado del perro y de los pudúes se nota más desde lejos o en flores bajas.
- **Se ve natural** y no rompe nada, pero no es un cambio que se venda solo. Mi opinión: vale el costo si se confirma que es casi nulo, pero el costo NO se midió acá (la regla era no correr `medir-vistas`). Lo que sí se sabe: 3 llamadas a un bucle de 24 pisadas por vértice sólo a menos de 22 m, con salida inmediata para las pisadas apagadas o lejanas; un uniforme de 24 vec4; nada por cuadro en CPU más que 24 números.

## Límites y pendientes
- Sólo calidad alta. Media (`pasto` 40000, radio 29 m) quedó afuera sin medir; si el costo resulta bajo, alcanza con bajar el umbral de `calidadConPisadas` en `pisadas.js` a, por ejemplo, 30000.
- Con el jugador corriendo se ven ~19 m de rastro (20 huellas · 1,3 m) y las más viejas se levantan antes; si caminás lento dura los 7 s completos.
- No se probó con el caballo ni con los pudúes en movimiento (comparten la misma lógica del perro, que sí se probó); tampoco con mando ni en la 4600G.
- Medir el costo (fps, p95 en las vistas con pasto) antes de unir.
