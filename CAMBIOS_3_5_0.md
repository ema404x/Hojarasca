# Hojarasca 3.5.0 — Distancia de dibujo y caza de bugs visuales

Empezada en una PC (la distancia de dibujo) y cerrada en la otra (los bugs visuales y las
mejoras). Tres equipos en paralelo, cada uno en su rama: vegetación, paisaje, gente y
animales.

## Distancia de dibujo (como los chunks de Minecraft)
- **Ajustes → Video: "Distancia de dibujo"** en bloques de 40 m (o "Según la calidad", por
  defecto) y **"Distancia de plantas"**. Se aplican en vivo, se guardan y se ven en F3.
- **Bug grave de la 3.3 arreglado:** si la placa no llegaba al objetivo de cuadros, las tareas
  pesadas (vegetación, ambiente, visibilidad, sombras) quedaban esperando para siempre: la
  vegetación se congelaba y después cambiaba de golpe. A 33 ms por cuadro, la vegetación se
  actualizaba 0 veces en 400 cuadros; ahora 17.
- Pasto que no sale bajo los pisos de las construcciones; pasto, flores y sotobosque crecen
  desde el suelo en el borde en vez de aparecer de golpe.
- Con la distancia por defecto cuesta lo mismo que la 3.4 (mediana); en la máxima, más
  triángulos pero la misma cantidad de dibujos.

## Vegetación
- **Invierno:** las copas cercanas quedaban verdes y las lejanas blancas, y cada árbol
  cambiaba al cruzar la distancia de detalle. Ahora la nieve cae igual de cerca, de lejos y
  en los árboles pre-dibujados (sobre la parte de arriba de cada racimo).
- **Ciprés y maitén:** sus ramas tapaban la pantalla al pasar a 2,5–3,5 m. Las hojas ya no
  se abren más que lo que permite la distancia al ojo y se desvanecen a menos de 2,6 m.
- **Helechos del bosque** que no se ponían rojizos en otoño (y quedaban blancos en invierno).
- **Flores sobre la nieve:** se cierran antes de que nieve. Ni flores ni helechos sobre el agua.
- Un arbusto completamente negro en la sombra; menos pasto seco asomando por la nieve.
- Árboles lejanos pre-dibujados con más resolución (menos blandos cerca de su límite).

## Paisaje
- **Cordillera sin facetas** (caras puntiagudas claras y oscuras).
- **Alba y ocaso con color:** la cordillera ya no es un manchón durazno; los cordones se
  separan en lila y las cumbres que miran al sol toman un brillo rosado. Cielo rosado sobre el
  horizonte, nubes más suaves con la panza rosada al atardecer, la luna plateando las nubes.
- **Lago:** sin la línea recta que lo cruzaba a unos 80 m (ya estaba tenue en la 3.4); camino
  de luz dorada hacia el sol bajo (plateado con la luna) y espuma en la orilla.
- **Rayos de sol al mediodía** entre los árboles (antes, con el sol alto, no había ninguno).
- Neblina de la mañana que se apilaba en una franja; tinte del bosque lejano sin anillo.

## Gente y animales
- **Ramón:** los brazos asomaban por delante del poncho. **Bufandas** que eran un plato
  pegado al pecho; **bocas** que flotaban delante de la cara; **narices** como clavija.
- **Hombros y codos sin escalón** (el brazo es una sola pieza); **rodillas** que doblan al
  caminar; caderas y hombros que acompañan el paso; parados, se mecen.
- **Caras:** ojos con blanco, pupila y párpado; cejas, sombra de la nariz y labios.
- **Pies en las laderas:** cada pie busca su suelo (antes uno flotaba y el otro se hundía).
- **Huemul y perro:** cuello sin escalón ni "boca" de tubo; el perro con orejas y boca nuevas.
- **Caballo:** crin en 13 mechones y cola en 7, en vez de láminas.
- Mismas llamadas de dibujo por figura.

## Queda para después
- Ciprés muy de cerca (velo verde, alguna faceta de la falda); manchas de luz en una ladera
  lejana; árboles lejanos pálidos en la bruma; amancay en franja en los canteros.
- Niebla que sólo depende de la distancia (franja plana desde el mirador al alba); cerros del
  borde algo brumosos al mediodía; nieve "a lunares" en el primer cordón; río en pendiente.
- Animales viejos de piezas sueltas (jabalí, coipo, aves de agua); cuello del guanaco, cara de
  la liebre, patas de la oveja; costura en el hombro de cerca.
