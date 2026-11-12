# Hojarasca 4.26.2 — Los puntos adelante tuyo

Rama v4262-a. Detalle en CAMBIOS_4_26_2_A.md. 0 shaders, 0 llamadas de dibujo nuevas.

- Cinemáticas: los lugares «adelante tuyo» del guion (hasta 12 m) ya no caen dentro de una pared, una roca o el bosque cerrado ni del otro lado: si el lugar está tapado, la escena gira el rumbo (de a 30°) hasta encontrar uno despejado, y usa el mismo giro para toda la escena. En campo abierto, igual que antes.
- Verificación: npm run verify de corrido; prueba nueva verificar-4-26-2-a (7 mutaciones); humo real del coihue talado (gira 60°, el carpintero se ve) y del encuentro del galpón (la cámara ya no queda adentro de la pared).

## Sin ver / pendiente
- En el mundo del humo no está el galponcito: la gente del encuentro del galpón no se vio en las capturas.
