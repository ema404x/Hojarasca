# Hojarasca 3.2.0 — El look de HushWood y la fluidez

Referencia: **HushWood** (OoyGames), del estilo de Firewatch. Hojarasca deja la dirección
"realista" de la 2.7 y pasa a un estilo estilizado y pintado, que además le pide menos a
la placa. Detalle técnico de la fluidez en `CAMBIOS_3_2_0_FLUIDEZ.md`.

## El look
- **Copas** con degradé fuerte: base oscura y fría, puntas cálidas y claras; el lado del sol
  más cálido y la sombra verde azulada; luz de borde y a contraluz. Más suaves de cerca.
- **Cipreses** en faldas que cuelgan, verde azulado (8 pisos de cerca).
- **Suelo pintado**: musgo en el bosque, prados más ricos, manchas doradas secas, senderos
  cálidos, roca fría. **Flores** blancas y violetas en manchas y **helechos** en el bosque
  y los bajos (se van en otoño e invierno).
- **Pasto** con base verde azulada y puntas doradas.
- **Luz**: sol más cálido y fuerte, tarde dorada, ambiente verde azulado, atardecer lavanda.
  **Bruma de color** con la distancia; montañas con bandas de color y capas de bruma.
- **Corrección de color** del estilo (sombras verde azulado, luces doradas) y **rayos de
  sol** que salen del cielo visible.
- Se sacaron las texturas finas, el relieve y las hojas recortadas de la 2.7: menos ruido,
  menos trabajo.

## La fluidez
- **Ritmo de cuadros "Auto (según tu monitor)"**, ahora por defecto (también para quien
  tenía el 60 de antes): el juego mide la frecuencia del monitor y dibuja cada 1, 2 o 3
  refrescos enteros, siempre parejo (144 Hz → 72, 120 Hz → 60, 60 Hz → 60…). Se adapta
  sin oscilar. Siguen 30/60/120/Sin límite como opciones.
- **F3**: cuadros por segundo, gráfico de los últimos 240 cuadros, peor 1%, tirones, el
  ritmo elegido, tiempo de placa y de cada sistema.
- **Menos compilaciones a mitad de juego**: los materiales que no usan luces ya no se
  rearman cuando cambia la cantidad de luces (102 → 9 en un recorrido del valle).

## Números (esta PC: Ryzen 5 4600G, Radeon integrada, monitor a 120 Hz, media)
- Placa: 6,1–7,4 ms por cuadro (antes 8,5–9,0): -14 a -29%. En baja -10 a -18%.
- Ritmo: 60 cuadros parejos; el 95% de los cuadros dura exactamente 16,7 ms (antes,
  con el tope de 60, entre 20 y 48% de cuadros disparejos).

## Queda para la 3.3
- Bosque en bloques y árboles lejanos pre-dibujados (menos dibujos por cuadro).
- Copas lejanas todavía facetadas a contraluz; montañas algo pálidas al mediodía; rayos de
  sol dentro del bosque cerrado; helechos más plumosos; coihue y pehuén al estilo nuevo.
- Los tirones que quedan al aparecer un edificio con luces.
- Modo fluido (resolución dinámica, opcional) y repartir trabajo en otros núcleos.
