# Hojarasca 3.6.2 — Lo que quedó pendiente de la 3.6

El usuario dijo "seguí avanzando". Esta versión resuelve lo anotado en "Queda para después" de la
3.6.1, con dos equipos en paralelo.

## Juego e interfaz
- **Obras viejas encimadas en la aldea**: en partidas de antes de la 3.6, las obras, los renovales
  y la carpa que quedaron sobre calles o edificios se mudan solos al lugar libre más cercano, con
  sus datos. Si no hay lugar, se desarman y devuelven todo a la mochila. Sale una sola nota.
  Módulo puro `aldea-desalojo.js`.
- **Clic y mando en las listas del HUD**: almacén, feria, cargas, barra, mochila y taller.
  - Reciben el mouse y no tiran la línea ni atacan.
  - En ventanas chicas tienen scroll, y la opción marcada siempre queda a la vista.
  - Con el teclado: la ruedita y Enter.
  - Con el mando: LB/RB o la cruceta mueven la marca, A elige y B sale.
- **Árboles despejados que chocaban sin verse** (79 en el valle): ya no chocan. Los tocones de
  los talados siguen frenando.
- **Libro prestado con visita**: sentado en el refugio, la visita de tu mesa gana; leer queda en el
  menú de la charla.
- **Reloj sentado**: frenan la aceleración sólo los cuentos del domingo, el baile y tu propia
  charla (no cualquier charla de vecinos).
- **Mapa**: las calles y los edificios de la aldea, sin puntitos de bosque encima. Las marcas
  automáticas ya no se enciman.
- **Horarios con menos caminata**: con un día de 30 min, nadie camina más del 8,4 % de su horario
  (el jefe de estación caminaba el 44,9 %). Por eso se reacomodaron algunos horarios: el jefe
  almuerza en la estación, la siesta de Ercilia es más larga y la escuela termina a las 12:30.

## Visual
- **No llueve bajo techo** en ningún lado del juego: galerías, aleros, el refugio, la estación, la
  aldea y las obras propias (`techo-lluvia.js`, unos 0,009 ms).
- **Álamos**: la versión lejana con la misma silueta y un cambio gradual entre 60 y 80 m.
- **Almacén**: el rótulo "RAMOS GENERALES" ya no lo cruzan las vigas.
- **Pescadería**: la red cuelga de una vara y se mece con el viento.
- Las mallas instanciadas vacías ya no se dibujan: unos 12 dibujos menos por cuadro en todo el
  juego.

## Medición (máquina tranquila, 3.6.1 contra 3.6.2)
Dentro del ruido: refugio en alta 10,5 → 10,9 ms; plaza de día 5,8 → 4,4; aldea completa de noche
13,3 → 13,3. El bosque dio algo peor en las tres tandas (+0,6 a +1,2 ms), pero ahí no se dibuja
nada nuevo: se atribuye al ruido, sin estar demostrado. Conviene medir en la PC del usuario.

## Pruebas
- Gate 146/146, con `verificar-3-6-2-juego` y `verificar-3-6-2-visual`.
- Partidas reales nuevas: `humo-3-6-2-juego` y `humo-3-6-2-desalojo`.
- `humo-3-6-1-vecinos` arreglada: fallaba por la prueba, no por el juego.
- Bug encontrado al cerrar: los vecinos que iban caminando quedaban congelados a mitad de la calle cuando te alejabas de la aldea (al volver, alguien podía estar en el lugar de otro). Ahora, lejos, se ubican donde les toca.

## Queda para después
- Las puertas de la aldea que se ocultan a 80 m: no se pudo comprobar si saltan.
- Bajo una galería también se apaga la lluvia que cae afuera y se vería desde ahí.
- Los techos del molino, el faro y la torre no están en la lista de techos de la lluvia.
