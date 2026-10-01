# Hojarasca 2.7.3 — Más liviano sin perder nada, y sin placa de video

Regla de esta versión: no se pierde nada del juego. Misma imagen, mismas luces y sombras,
mismos bichos y mismo comportamiento; el trabajo se hace más prolijo. La imagen se
comparó píxel por píxel antes y después en 44 capturas: 43 idénticas y 1 píxel distinto
(el borde de una puerta lejana, por redondeo).

## Sin placa de video aparte

- **La primera vez** que se abre el juego, elige la calidad según la placa: integrada
  (Intel UHD/Iris, Radeon integrada: la mayoría de las notebooks) arranca en baja, y la
  calidad automática la sube sola si sobra máquina; sin driver de video, muy baja. Si
  después elegís otra calidad, se respeta. (`calidad-equipo.js`, nuevo)
- **Si el 3D no arranca**, en vez de rendirse el juego se reinicia probando otras formas
  (placas viejas bloqueadas, Direct3D 9, OpenGL) y recuerda la que anduvo. Si ninguna
  anda, un mensaje claro con qué hacer.
- Medido en esta PC (Radeon integrada): muy baja ~80 cuadros por segundo, baja ~60.

## Por dentro

- **Puertas y ventanas:** las piezas de cada hoja se dibujan juntas (una puerta pasa de
  ~10 dibujos a 4; el portón del galpón de ~18 a 4); siguen abriéndose igual.
- **Estructuras:** lo que no se mueve se marca como fijo; los edificios lejanos ocultos no
  se recorren en cada cuadro (1245 → 1048 objetos visitados por cuadro).
- **Barra de objetos, mando, lectura de teclas del mando:** sin crear cosas nuevas en
  cada cuadro; mismos resultados (comprobado con decenas de miles de casos al azar).
- **Desafío:** la separación de los invasores descarta rápido los que están lejos; mismas
  posiciones, bit por bit.
- **Código muerto afuera:** importaciones y variables que no se usaban (una se calculaba
  409.600 veces al dibujar el mapa).
- **Protecciones:** el taller ya no se puede caer después de cobrar los materiales si falta
  un dato del guardado; el núcleo de la nodriza, lo mismo.
- **Paquete:** Electron trae 55 idiomas del navegador; ahora sólo español e inglés (el
  juego no usa los otros).

## Números (media)

- Dibujos por cuadro: 401 → ~385. Muy baja: 309 → ~300.
