# 4.28.0 (A) — Ultra: el ajuste, la luz, el cielo y la niebla

Zona A del nivel «Ultra» (brief `BRIEF_4_28_0.md`, con el agregado del usuario: «que se sienta en los detalles, como la niebla súper realista»).
Todo lo de acá corre **sólo** con `esUltra(ajustes)` (ajuste `ultra` + calidad Alta) y con el mundo armado en Alta; se arma al prender
Ultra y se desarma entero al apagarlo o al bajar la calidad (también la autocalidad), en vivo, sin reiniciar.

## Qué se hizo
1. **El ajuste en el menú de gráficos** (`src/plantilla.html`, `src/main.js`): fila «Ultra (efectos nuevos, pide una buena placa)», Sí/No,
   debajo de la calidad gráfica. Sin calidad Alta los botones quedan grises con «Necesita calidad Alta»; con Alta elegida pero el mundo
   armado en otra calidad, «Se aplica al volver a cargar.». La autocalidad nunca lo prende; si baja de Alta, Ultra se apaga solo en el
   cuadro siguiente (`ultraPedido(ajustes, calidadActiva, post)`). No va al diccionario de inglés: los ajustes nuevos desde la 3.9.1
   (Ritmo de la aldea, Distancia de plantas, Si el juego va lento) tampoco están; se traduce todo al final.
2. **Sombras** (`cielo.sombraUltra`, `SOMBRA_ULTRA`): mapa de 4096 (Alta: 2048) sobre ±125 m (Alta: ±110): el téxel cerca tuyo pasa de
   11 a 6 cm y la sombra llega 15 m más lejos; el borde suave (PCF con radio 4,2 téxeles) mide en metros lo mismo que en Alta, sin serrucho.
   Mismo tipo de sombra: ningún programa nuevo por esto.
3. **Cielo con dispersión** (`ultra-luz-mundo.js`, otro material para la misma esfera): Rayleigh + Mie + ozono de una pasada, atado a la
   hora (el sol de `cielo.js`) y al clima (se apaga con el cielo cubierto; de noche cerrada queda el pintado con sus estrellas y la luna).
   Encima siguen las nubes, la luna y las estrellas pintadas. Se probó primero en la CPU (`cieloFisico`, el mismo cálculo) para elegir los
   valores: cenit azul hondo de día, banda anaranjada al ponerse el sol, horizonte rosado en el crepúsculo.
4. **Niebla volumétrica** (la prioridad del agregado): una pasada a media resolución que marcha 9 pasos por el rayo de cada píxel
   (hasta 160 m; lo de más allá, de un tirón): capas de ruido 3D que el viento arrastra despacio, más espesa abajo (niebla de altura de los
   valles), más espesa entre los árboles (el mapa del bosque del terreno), bancos bajos sobre el lago y la orilla al amanecer, más con
   lluvia y algo de noche. La ilumina el sol (o la luna) **con su mapa de sombras** —los rayos entre las copas y, adentro de las casas
   (polvo del interior), por las ventanas— y las luces que three ve (las cuatro puntuales del presupuesto y la linterna con su cono):
   los faroles y la linterna hacen halo en la niebla de noche.
5. **Oclusión ambiental** (SSAO de la profundidad, media resolución, 6 muestras, se apaga a 70 m), mezclada en la composición con la
   niebla, con cuatro lecturas que respetan los bordes.
6. **El aliento con frío** (`ultra-aliento.js`): bocanadas tuyas (delante de la cámara) y de hasta seis vecinos cercanos, en invierno
   siempre y en otoño de noche (`frioDelAire`); una nube de puntos reciclada (un dibujo).
7. Tonos finales (bloom extra): **no se hizo** — el bloom de Alta ya está y la niebla iluminada por los faroles da el halo de noche.

Los programas nuevos (cinco: cielo, oclusión, niebla, composición y aliento) se compilan al prender Ultra (en la carga o en el menú),
nunca a mitad de juego. La composición de Ultra es la de Alta con un agregado (otro programa); los materiales de Alta no se tocan.

## Ultra apagado = 4.27.0 (comprobado en partida real, notebook 7730U)
- Programas de shader: iguales en las diez puestas de verano (al empezar 104 y por toma 104, 104, 105, 105, 107 × 6, en la 4.27.0 y en
  esta con Ultra apagado). Con Ultra prendido: 108 al empezar (+4) y hasta 111 (la de la noche en la aldea suma la quinta, el aliento).
- Capturas: la diferencia entre la 4.27.0 y esta con Ultra apagado (`off-verano` contra `base2-verano`) queda **por debajo** de la que hay
  entre dos corridas de la misma 4.27.0 (`base-verano` contra `base2-verano`: viento del pasto, nubes y gente que se mueven). Con una sola
  toma corta (02, bosque) la diferencia 4.27.0 / Ultra apagado es 1,15 de media sobre 255 (3 % de píxeles > 8): ruido de animación.

## Capturas (Ultra contra Alta, mismas puestas)
En `C:\Users\Andres\AppData\Local\Temp\hx\a4280\`: Alta = `base2-verano`, `base-invierno`, `base-lluvia`; Ultra = `u4-verano`,
`u3-invierno`, `u3-lluvia` (u3 = la misma con 14 pasos de niebla en vez de 9).
- **Amanecer en el lago (25, 7 h):** el banco de niebla baja sobre el agua y la orilla de enfrente se pierde en capas; Alta, aire limpio.
  Es lo que más se nota.
- **Mirador (01) y bosque (02) de día:** cielo más hondo y azul hacia el cenit, el bosque lejano y el valle con un velo de aire; las cosas
  más asentadas (oclusión en pies de árboles y bajo los aleros).
- **Ocaso (15):** el aire hacia el sol se ilumina (la niebla toma la luz del sol bajo); banda anaranjada en el horizonte.
- **Noche en la aldea (07):** los faroles y las ventanas con halo en la niebla, la calle con más profundidad.
- **Lluvia (52):** el fondo se pierde antes, el bosque se lee en planos.
- **Nieve (32), de día y de noche:** la mancha blanca que había cerca de la cámara era **tu propio aliento**: la bocanada salía a
  12 cm del ojo y a medio metro ya medía media pantalla (con nieve el frío lo prende siempre; aparecía según en qué momento del soplo caía
  la captura). Medido en la partida: bocanadas vivas a 0,52–0,55 m del ojo. Arreglo (sin costo): el tuyo sale 60 cm adelante y más abajo,
  más tenue; toda bocanada se apaga a menos de 1,2 m del ojo y tiene tope de tamaño en pantalla. Después: a 0,88–1 m, sin mancha
  (capturas en hx/a4280/nieve-u4 antes y hx/a4280/nieve-u5 después).

## Rendimiento (costo por cuadro, placa, 1080p de lienzo, la herramienta de la auditoría con lastre, 3 rondas, ventana visible, notebook)
| | Alta (r1, r2, r3) | Ultra final, 9 pasos (r1, r2, r3) | Ultra con 14 pasos |
|---|---|---|---|
| Bosque (02) | 15,1 · 18,0 · 14,4 → **15,1** | 19,6 · 19,0 · 19,5 → **19,5** | 30,6 · 22,4 · 21,3 |
| Plaza de día (05) | 26,4 · 25,7 · 24,4 → **25,7** | 26,5 · 29,5 · 29,3 → **29,3** | 34,6 · 39,3 · 29,0 |
Con 14 pasos la plaza se pasaba de 33 ms: se bajó la niebla a 9 pasos y la oclusión a 6 muestras. Ultra final: **19,5 y 29,3 ms**, dentro
de 33. (La ventana de medición anduvo frenada —pocos cuadros por muestra—; los ms son los de la placa por cuadro, no el intervalo.)

## Qué quedó afuera
- El bloom extra de noche (tonos finales).
- Niebla «más espesa entre los árboles» va por el mapa del bosque del terreno (manchas de 2 m), no por cada árbol.
- Los rayos por las ventanas dependen de que la casa tape el sol en el mapa de sombras y del polvo del interior; no hay una toma fija
  adentro con sol rasante para verlo: **no se vio a ojo**. Tampoco el aliento (las tomas de invierno no tienen gente cerca): probado en
  Node, no visto en captura.

## Pruebas
- Nueva: `pruebas/verificar-4-28-0-a.mjs` (en `verify:pasos`).
- Ajustadas a propósito: `verificar-4-21-0-c`, `verificar-4-22-0-c` y `verificar-4-24-0-c` contaban las construcciones de
  `ShaderMaterial` (y destinos de dibujo) de todo `src/` con la regla de 0 shaders nuevos; ahora no cuentan `src/ultra*.js`, que es lo único
  que puede traerlos y sólo corre con Ultra (la regla sigue valiendo para todo lo demás). B y C quizás hagan el mismo ajuste: al juntar,
  queda una sola versión.
- `three-r186-inline.js` expone `DepthTexture` (la clase ya estaba adentro; `verificar-three-offline` exige que lo expuesto sea lo usado).
- `herramientas/auditoria-visual-4-20-0.cjs` y `correr-auditoria-4-23-0.ps1`: `AUD_ULTRA` / `-Ultra 1`.
