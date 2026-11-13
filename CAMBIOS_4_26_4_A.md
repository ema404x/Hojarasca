# 4.26.4 (A): cinemáticas

## Qué cambió
- **Encuentro del galpón** (`galpon-encuentro`): los planos de la escena miran a la gente donde de verdad está. Ref nuevo `{ grupo: 'centro' | 'jefe', lado }` (`escenas-mundo.js`, `mundo.posicion`): el centro (o el Mandamás) de los duendes vivos que puso la escena (`centroDeLosDuendesDeEscena` en `main.js`, por `ctx.grupoDuendes`); sin grupo todavía, el punto de siempre adelante tuyo. Plano nuevo `entre: true` (`escenas.js`): la lente va del lado del jugador y nunca más allá de él (a lo sumo al 70 % del camino hasta el ancla, no menos de 1,5 m); el despeje de sólidos de la cámara sigue igual. Los 2 generales, el contrapicado y los 2 primeros planos usan el grupo o el Mandamás; el paneo va de un costado a otro del centro. No se tocó el plano de la ventana.
- **Silueta del anochecer en el monte cerrado** (`historia-presencia.js`): quinta vuelta (`SILUETA_AMPLIA.monte`), sólo si las cuatro anteriores no dieron lugar: de 12 a 24 m, en el abanico de la vista, sin tronco a menos de 1,2 m (`sinTronco` nuevo en `main.js`) y en tierra. No se exige la línea limpia, pero entre todos los lugares posibles se prefiere uno con la línea limpia (decisión mía, chica: en la primera captura la silueta quedaba atrás de una casa) y, entre esos, el más alto. Sin el dato `sinTronco` del juego no hay quinta vuelta.

## Qué se vio (partida real, Alta, `pruebas/humo-4-26-4-a.cjs`, capturas en `pruebas/salidas/humo-4-26-4-a`)
- Galponcito en pie adelante, atrás, al costado (en campo abierto) y al costado y atrás mirando a la pared de la estación (con la trochita lejos del andén): 12 de 12 duendes en cuadro en todas las capturas salvo la de la ventana (el cerro, sin gente a propósito); cámara a 1,6 a 1,9 m del jugador, entre él y el grupo (la cámara nunca más lejos del grupo que el jugador). Capturas: los duendes parados en la nieve con el Mandamás al frente, o sobre el andén.
- Silueta, molino-2, -3 y -4: aparece a 21,7, 23,8 y 21,6 m, parada en el piso (y = suelo), fuera del agua y dentro del cuadro; se la ve a ojo en las tres capturas (molino-3 entre los postes del alero, molino-4 sobre el pasto).

## Qué no se vio
- Los primeros planos del Mandamás con el grupo muy pegado a una pared: sólo con lo medido (el despeje de la lente sigue siendo el de la 4.26.1).
- La silueta de noche cerrada en esos rumbos (el humo la pone a las 18,9 h; con luz).
- En la primera corrida con el galponcito adelante, el plano de la ventana queda adentro del galponcito (viene de antes; no era de los planos del grupo).

## Pruebas
`pruebas/verificar-4-26-4-a.mjs` (en `verify:pasos`): 54 comprobaciones y 19 mutaciones atrapadas. Ajustadas a propósito: `verificar-4-26-1-b` (el bucle de vueltas de la silueta y su mutación del bosque cerrado; no se tocó ningún valor). En verde: `-4-14-0-escenas`, `-4-17-0-escenas-acto3`, `-4-17-1-escenas-noche`, `-4-26-0-b/-c`, `-4-26-1-a/-b`, `-4-26-2-a`, `-4-26-3-a`. 0 shaders, 0 llamadas de dibujo nuevas, sin claves de guardado.
