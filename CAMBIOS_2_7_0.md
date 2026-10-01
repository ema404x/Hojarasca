# Hojarasca 2.7.0 — Salto de calidad

Sobre la 2.6.1. El juego deja de verse como polígonos y de sonar a sintetizador de los 80,
sin exagerar y sin romper el rendimiento. Todo sigue hecho por código: no hay imágenes ni
audios de afuera. Los comentarios nuevos llevan `2.7:`.

## Imagen

- **Texturas por código** (`texturas.js`, nuevo): corteza, tablas, piedra, tierra con
  piedritas, pasto y hojarasca, roca de montaña, manchas del valle y hojas con recorte. Se
  hacen una vez al cargar y se mezclan con el color de siempre: las estaciones siguen igual.
- **Árboles:** troncos redondos con corteza y relieve; copas con racimos de hojas cerca y
  borde hojoso a media distancia, con luz más cálida en lo que da al sol. Cipreses con
  agujas en capas, más claros, sin facetas.
- **Cordillera:** crestas y quebradas de roca, nieve donde se asienta, y bruma azul con la
  distancia (antes: triángulos planos).
- **Suelo:** tierra, pasto y roca según la pendiente, sin repeticiones; prados con manchas
  de pasto seco y zonas húmedas. El pasto de cerca es más fino, con puntas secas.
- **Obras:** la madera y la piedra toman veta y textura solas.
- **En la mano:** herramientas biseladas con madera, metal, cuero y piedra; la cámara de
  fotos es una cámara.
- **Luz:** sombras suaves en media y alta; el cielo tiñe mejor la luz ambiente.
- En **muy baja** todo queda como antes.

## Sonido

- Sin osciladores de onda cuadrada ni diente de sierra: todo se arma con ruido filtrado,
  modos de resonancia y cuerdas punteadas (Karplus-Strong), preparado de a poco cuando el
  juego está libre (`sonido-sintesis.js`, nuevo).
- **Naturaleza:** viento con hojas, arroyo con burbujas, lluvia de gotas, grillos que son
  bichos distintos, ranas, 15 aves de la Patagonia y el carpintero; la colmena es un
  enjambre.
- **Pasos** por suelo (con piedra nueva), talón y punta, crujido en la nieve, ramitas.
- **Fuego, hacha, bisagras, chapuzones, campana, fósforo, explosiones** con eco en el valle.
- **Música:** guitarra de nylon, charango y quena con soplido; en el Desafío, cuerdas
  frotadas y un latido de parche. Los logros suenan con dos notas de guitarra.
- Mismo volumen que antes, sin saturar; menos CPU por cuadro que la 2.6.

## Rendimiento

- Media: ~8,7 → ~9,6 ms de CPU por cuadro (+10%), llamadas de dibujo +1–3%.
- Muy baja: igual (4,8 ms).
- Sonido: 0,18 → 0,07 ms por cuadro; 10–20 MB de sonidos preparados.

## Verificación

- `npm run verify`, la suite de partidas reales y la de caos con dos semillas.
- `verificar-sonido.mjs` suma un bloque 2.7 (señales limpias, grillos con silencios,
  cuerdas afinadas, sin osciladores retro).
