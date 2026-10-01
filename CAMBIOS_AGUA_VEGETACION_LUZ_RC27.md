# CAMBIOS AGUA / VEGETACIÓN / LUZ — RC27

## Objetivo
Llevar el acabado visual de RC26 a una lectura más premium sin reabrir el frente de rendimiento o estabilidad. La pasada se concentra en efectos ya existentes y evita sumar render targets, luces globales o simulaciones costosas.

## Agua
- Absorción cromática por profundidad: el agua somera conserva verdes naturales y la profundidad se vuelve azul verdosa oscura de forma continua.
- Sedimento/turbidez sutil en la orilla, gobernado por profundidad y ruido del mundo.
- Destellos solares pequeños sobre la microonda, limitados por distancia/detalle.
- Espuma de orilla menos sinusoidal y más irregular.
- Transparencia somera y aporte del cielo refinados.

## Vegetación
- Volumen lumínico adicional dentro de la copa usando altura relativa, normal de hoja, luz de cielo y dirección solar.
- Interior de copa levemente más profundo y caras superiores con relleno del cielo.
- Sin nuevas luces ni draw calls.

## Interior / exterior
- Las luces de relleno interiores ahora responden al día, nubosidad y color del cielo en vez de mantener una intensidad blanca fija.
- El postproceso recibe un estado de interior y simula una adaptación de exposición suave al entrar/salir.
- La adaptación usa histéresis temporal; no hay saltos de brillo abruptos.

## Rendimiento
- No se añaden render targets ni reflection probes dinámicos.
- Todo el coste nuevo está concentrado en operaciones ligeras dentro de shaders ya activos y en uniformes existentes.
