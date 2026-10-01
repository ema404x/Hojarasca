# 1.1.0 — Modo Desafío

El juego ahora tiene dos modos, que se eligen en la portada:

- **Relax**: el bosque de siempre. No cambió nada: sin invasores, sin salud, sin la
  categoría Defensa. Conserva la partida y las claves de guardado históricas.
- **Desafío**: cada noche baja una nave y los invasores vienen a buscarte. De día se
  junta, se construye y se fabrica; de noche se resiste hasta el amanecer.

Cada modo tiene **su propia partida** (`hojarasca-desafio-v1` y su backup). Cambiar de
modo en el menú guarda la partida actual y recarga el mundo con la del otro modo.

## Cómo se juega

- Se empieza con hacha, 4 troncos, 4 piedras y un emplasto. Salud 100.
- **Horario**: la nave baja a las 20:30 y los invasores se retiran a las 6:00. El HUD
  (arriba a la izquierda) muestra la salud, la cuenta regresiva y las noches resistidas.
- **Oleadas**: noche 1 = 3 rastreadores; crecen de a 2 por noche (máximo 18). Desde la
  noche 2 aparecen **brutos** (lentos, aguantan y derriban obras), desde la 3
  **tiradores** (disparan plasma a distancia) y refuerzos a la 1:30. Cada noche los
  invasores pegan y aguantan un 8% más.
- Los invasores van hacia el jugador. Si una obra les cierra el paso, la golpean hasta
  derribarla (y se cae lo que tenía apoyado encima). No pegan a través de paredes.
- Al abatirlos sueltan **cristales** (se juntan pasando cerca).
- **Derrota**: se despierta en la base (junto al catre, o en el refugio) a las 7:00 del
  día siguiente, sin cristales y con el 70% de los materiales.
- No se puede dormir ni acelerar el tiempo sentado con invasores cerca. Dormir cura.
  La salud también se recupera sola si pasan 7 s sin recibir golpes.

## Armas (clic izquierdo)

| Arma | Cómo se consigue | Tipo |
|---|---|---|
| Hacha | kit inicial | cuerpo a cuerpo, 20 |
| Lanza de coihue | K: 1 tronco + 2 piedras | cuerpo a cuerpo, 34, más alcance |
| Arco de lenga | K junto a un banco de trabajo: 3 tablas + 1 tronco | flechas con caída, 42 |
| Pistola de plasma | **se encuentra** en una cápsula estrellada (columna de luz verde) | rayo, 58, usa cargas |

## Fabricar (tecla K)

Lanza, arco, flechas (×8), emplasto de hierbas (cura 45; 2 frutas + 1 ramita), cargas de
plasma (×6 por cristal) y **reparar** la defensa más dañada cercana (1 tronco o piedra
por cada 30%).

## Defensas (O → Defensa, sólo en Desafío)

| Pieza | Costo | Resistencia | Qué hace |
|---|---|---|---|
| Empalizada de troncos | 4 troncos | 320 | cierra el paso; se encadena |
| Muro de pirca | 10 piedras + 1 tronco | 700 | cierra el paso; se encadena |
| Estacas trampa | 2 troncos + 1 piedra | 150 | no cierra: lastima (16/s) y frena al 45% |
| Ballesta de guardia | 6 tablas + 2 troncos + 2 piedras | 220 | dispara sola a 26 m |

Las obras normales (paredes, pisos, techos) también tienen resistencia, proporcional a
lo que costaron (la piedra rinde más que la madera).

## Técnica

- `src/desafio-reglas.js`: reglas puras (horario, oleadas, armas, recetas, resistencia,
  saneado del guardado) sin Three.js, probadas en Node.
- `src/desafio.js`: invasores (mallas procedurales con animación de paso y golpe), nave,
  proyectiles, cristales, cápsula, defensas activas, salud, taller y HUD. Mallas del
  pool precalentadas en la compilación inicial para evitar tirones en la primera oleada.
- `construccion.js`: 4 piezas de defensa con física declarativa (`fisica(h)`), categoría
  `defensa` con `soloDesafio`, material `cristal`, `destruir(obra)` (derriba con sus
  dependencias) y `obrasCerca`.
- `guardado.js`: `usarModoGuardado(modo)`, ajuste `modo`, `progreso.modo` y
  `progreso.desafio` saneado.
- Pruebas: `pruebas/verificar-modo-desafio.mjs` (en `npm run verify`) y
  `npm run verify:desafio` (partida real en Electron: 25 comprobaciones).
