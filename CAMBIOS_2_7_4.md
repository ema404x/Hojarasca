# Hojarasca 2.7.4 — Arranque más rápido y menos tirones

Misma regla que la 2.7.3: no cambia nada del juego. Las capturas deterministas dan
diferencia 0 píxel por píxel en todas las vistas (media, alta, baja y muy baja; de día y
de noche, con casas, estación y tren prendidos).

## Arranque

| | antes | ahora |
|---|---|---|
| primera vez | ~3,0 s | ~2,2 s |
| las siguientes | ~3,4 s | ~1,75 s |

- **Texturas** (`texturas-datos.js`, nuevo): el mismo cálculo, más rápido (ruido con
  menos operaciones, hojas que sólo recorren su rectángulo), en un hilo aparte para que
  la pantalla de carga no se congele, y guardado para la próxima vez. Mismas texturas
  bit por bit (huella SHA-256 de cada una).
- **Terreno:** el mismo valle (huella intacta), calculado de a pedazos y guardado.
- **Caché** (`cache-carga.js`, nuevo): IndexedDB con clave por versión, semilla y huella
  del código que genera; se revisa tamaño, tipo y suma de control, y ante cualquier duda
  se vuelve a generar.
- Lo que parecía "Afinando los sonidos" (1 s) eran texturas generándose al compilar; ahora
  quedan ~0,25 s de compilación. Los sonidos no se guardan: cada vez salen con sus
  variaciones al azar, como siempre.

## Tirones

- Las luces del mundo siguen siendo exactamente las mismas. `luces.js` (nuevo) prevé
  cuándo va a cambiar la cantidad de luces a la vista (un edificio o el tren que se
  acercan, lo que vas a ver al entrar) y prepara los programas de dibujo de antemano, de a
  poco. Recorriendo todo el mundo: tiempo trabado 70 s → 14 s, peor tirón 4,1 s → 1,9 s;
  al entrar a la partida, 3 s → 0,2 s.
- Se probaron dos ideas más baratas para la placa (cantidad de luces fija, o un grupo fijo
  de luces) y se descartaron: movían 1 a 3 píxeles en algunas vistas.
- Postproceso: se sacaron dos borrados de pantalla que no hacían falta.
