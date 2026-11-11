# 4.26.1 (A): interiores que quedaron afuera de la regla

## Qué se hizo
Se cerraron las rendijas que dejaban ver el exterior desde adentro, y se sumó a la regla de interiores (`interior-visible.js`, `main.js`) lo que después dio 0 muestras por encima del ruido en la equivalencia de imagen:
- Casilla: hastiales y alero cerrados con un forro y tablas oscuras metidas en la pared. Entra.
- Taller anexo y planta alta (las dos plantas): la «rendija de un píxel» era la junta de 8 mm entre tabla y tabla, vista de frente; ahora las paredes llevan alma. Entran.
- Habitaciones modulares (piso de 3 × 3 cerrado, `src/cierres-modulares.js`): techo que cierra franja y hastiales, paredes y piso con alma; la caja (`cajaDeModulo`) deja como únicas aberturas la puerta, la ventana y los lados que dan a otro módulo. Entran.

## Qué quedó afuera y por qué
- Puesto de troncos: la equivalencia dio 8 de 72 muestras con diferencia (hasta 0,34 % de píxeles sobre el ruido), entre tronco y tronco. Se saca de la regla (la geometría cerrada se conserva).
- Buhardilla: 2 de 72 con diferencia (hasta 0,03 %). Se saca de la regla.
- Anotado: la cabaña de piedra (ya en la regla desde la 4.26.0, no es de esta tarea) dio 2 de 72 (hasta 0,13 %); queda para revisar.

## Pruebas
Una corrida de equivalencia de imagen desde adentro (herramienta de la 4.26.0, valle, 8 rumbos × 3 inclinaciones × 3 puntos; modular con 576 muestras, 0 diferencias). Pasan `verificar-4-26-1-a` (165/165, ajustada a la regla final), `verificar-4-26-0-c` (57/57), `verificar-4-22-0-c` (91/91), `verificar-4-12-1-edificios` (979 pasos) y `verificar-4-2-ampliar` (587). 0 shaders y 0 llamadas de dibujo nuevas. No se midieron ms (cancelado). Sin claves de guardado nuevas.
