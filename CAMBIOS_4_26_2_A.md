# 4.26.2 (A): los puntos «adelante tuyo»

**Qué cambió** (sólo `src/escenas-mundo.js`, `mundo.posicion`, rama `frente`): hasta 12 m, el punto vale si está libre (sin sólidos ni agua) y el tramo recto desde la base no cruza sólidos (muestras cada 0,5 m). Si no vale, se gira el rumbo de la base (0, +30, -30, ... +150, -150, 180 grados) y se usa el primer giro que vale; si ninguno, el punto original. El giro elegido se guarda por escena y por base y lo usan todos los `frente` de esa escena (aunque a 0 grados valgan); se borra al cambiar de escena. Un punto posterior que no vale con ese giro no se re-elige: queda con el giro guardado y `despejarPuesto` lo ordena. Más de 12 m: como antes. No se tocaron guiones, `despejarPuesto` ni la cámara.

**Prueba:** `pruebas/verificar-4-26-2-a.mjs` (en `verify:pasos`), con 7 mutaciones que fallan. Las 14 pruebas viejas que leen `escenas-mundo.js` siguen en verde sin ajustes.

**Qué se vio** (`pruebas/humo-4-26-2-a.cjs`, partida real, antes con la 4.26.1 y después, mismas puestas; capturas en `pruebas/salidas/humo-4-26-2-a`):
- `coihue-talado` mirando al bosque cerrado: antes el carpintero quedaba tapado por el follaje; ahora gira 60 grados y se lo ve claro y de frente.
- `galpon-encuentro` mirando a la pared de la estación: antes la cámara quedaba adentro de un sólido (negro); ahora ve la estación.
- `piedras-molino` en campo abierto: corrimiento 0 a 3, 5, 7 y 9 m (idéntico).

**Qué no se vio:** en el mundo del humo no existe el galponcito, así que la gente de `galpon-encuentro` no aparece en ninguna captura (ni antes ni después); no se vio el interior del galpón.
