# 4.10 base — «Volver a jugar», tanda 3: que la base y el perro crezcan con las noches

Rama `v410-base` (sale de `main` = 4.9.0, con `origin/v410-guardian` juntada para los bonos). **No sube la versión** (`package.json` sigue en 4.9.0). Los otros tres agentes de la 4.10: «guardian» (habilidades, bestiario, **bonos**), «partidas» (semillas, ventajas, modos, finales) y «coihue» (el Coihue camina, subida, lugares). Nada de esta tanda toca los archivos de ellos.

## Lo que ya existía (leído antes de tocar)
- **Defensas y fortín:** `vidaMaxObra(plano, etapas)` (lo que costó es lo que aguanta), `REFUERZOS` (empalizada → reforzada, pirca → muro almenado, portón → con tranca), `danarObra` en `desafio.js` (con `factorDanoObra` del contrafuerte y el hielo), `desafio-fortin*.js`, y de la 4.9.0 `desafio-roto*.js` (lo roto se ve), `desafio-trampas*.js` (miel), `desafio-pasadizo*.js`, el farol de mano y la pala de brasas. Ninguna defensa ganaba nada por aguantar: la «experiencia» no existía.
- **Trofeos y logros:** `desafio-logros.js` sólo tiene logros de pantalla y récords (noches, racha, abatidos); nada colgado en la base. Los hitos ya estaban en el estado: `jefeCaido` (la noche del último mandamás; `varianteJefe` da el de las noches 5, 10, 15 y 20), `asedio` (`puedeAbordar`: la puertita del Coihue; `reyCaido`: cayó el Rey Duende), `victoria` y `nido.caido`.
- **El perro:** `desafio-aliados.js` (muerde 9 por segundo y frena a los rastreadores; gruñe/ladra con `avisoDelPerro` de `desafio-sentidos.js`: 42 m el gruñido y 18 m el ladrido) y el parámetro `alcance` que ya usaba la niebla de la 4.8 (`NIEBLA.perro` = 1,6). Ningún nivel ni aprendizaje.
- **Bonos (guardian):** `desafio-bonos.js` con `sumarBono(d, origen, clave, valor)`, `quitarBonosDeOrigen(d, origen)`, `bonoDe` y los topes; el estado vive en `D().bonos`. `saludMax` son **puntos** de salud; las otras cinco claves (`correr`, `recarga`, `dano`, `reparar`, `alcance`) son fracciones.

## 1. Defensas que mejoran
Una defensa **curtida** gana experiencia en la propia obra (`datos.curt = { n, e, t }`: noches contadas, noche en que quedó anotada al anochecer, si recibió daño o participó), así que si cae o se desarma **se pierde con ella** y se guarda con la obra.
- **Cuenta una noche** cuando estuvo en pie al caer la noche (`empezarOleada` la anota), **recibió un golpe** (`danarObra`) **o participó** (la ballesta que tira, `actualizarDefensas`) y amaneció la noche aguantada (`terminarOleada(true)`). Una defensa construida de madrugada, un golpe de día o una noche perdida no suman.
- **Niveles** (`CURTIDO` en `desafio-mejoras-base.js`): nivel 1 a las 2 noches, nivel 2 a las 4, nivel 3 a las 7. **Daño que recibe: ×0,9 / ×0,8 / ×0,7.** Al subir recupera el 20 % de su resistencia máxima. No sube más del 3.
- **Qué se curte:** murallas, portones, pirca (y sus versiones reforzadas), cerco dorado, contrafuerte, ballestas, torre de vigía, catapulta, campana de musgo y faro de ámbar (`CURTIBLES`). No las trampas que se gastan, el pasadizo, el tablero, la antorcha, la campana, el armero ni los techos y puentes.
- **Lo que se ve:** una **placa** chica (tabla de madera —o de piedra en las pircas— con una barrita de bronce por nivel y, en el nivel 3, un rombo de ámbar) que se cuelga de las dos caras de la defensa, **clavada en lo más saliente de su malla a esa altura** (las puntas de los troncos, la cara de la pirca, un poste de la torre): una prueba recorre las 15 defensas y comprueba que la placa de cada cara toca la malla (nada flota). Una sola malla fusionada de material tipo 0 y 4 por defensa, geometrías compartidas en una caché; se revisa una vez por segundo, no por cuadro.
- **El texto:** «Empalizada de troncos curtida · nivel 2» en la pantalla de la base (N), en el martillo («Reparando …») y en el aviso del alba cuando sube de nivel (se agrupan si suben más de tres).
- **Bono `defensa`:** cada nivel suma +1 % de `reparar` (tope 10 %) con el origen `'defensa'`: una base veterana se mantiene más fácil.

## 2. Trofeos en la base
Siete trofeos que se ganan **una vez** y se cuelgan en el **tablero de trofeos** (pieza nueva de la categoría Defensa: 4 tablas y 1 tronco, resistencia 260, no cuenta como defensa para los vecinos que se instalan; una sola malla de tipo 0 y 4):

| Trofeo | Se gana con | Bono (origen `'trofeo'`) |
|---|---|---|
| Casco de corteza | el mandamás de la noche 5 | +5 de salud máxima |
| Hongo grande | el mandamás que llama (noche 10) | +6 % recarga |
| Ojo de sombra | el mandamás sombra (noche 15) | +6 % alcance |
| Piedra de ámbar | el mandamás que tira piedras (noche 20) | +5 % daño |
| Piña del Coihue | se abre la puertita del Coihue (o cae el Rey) | +15 % reparar |
| Corona del Rey Duende | cae el Rey Duende | +4 % correr |
| Raíz del nido | se derrumba la cueva | +5 de salud máxima |

- **Se ganan solos** (sin tocar los archivos de «coihue»): cada segundo se mira el estado de la partida (`jefeCaido`, `asedio`, `victoria`, `nido`), con un registro de lo ya visto (`crece.vistos`) para que **un trofeo perdido no vuelva solo**. Una partida vieja que ya había vencido a un mandamás recibe su trofeo al abrirla.
- **El bono vale mientras haya un tablero en pie.** Si lo **desarmás** vos, los trofeos quedan guardados y los bonos se van; si lo **tiran los duendes**, los trofeos **se pierden con él** (y se quitan sus bonos). Con dos tableros, los bonos valen una vez.
- **Se ven** en el tablero: dos estantes (cuatro y tres), cada uno de pie sobre su estante y dentro del grosor de la tabla (una prueba mide que ninguno asoma por detrás); los lugares vacíos llevan una clavija oscura. **E** junto al tablero (entrada `trofeos` de `interacciones.js`, a pie) dice cuáles tenés y qué da cada uno.

## 3. El perro aprende con las noches
Cuenta una noche aguantada con el perro presente (`crece.perro.noches`, tope 10). **Nivel 1 a las 3 noches, 2 a las 6, 3 a las 10**; gruñe **×1,15 / ×1,3 / ×1,5** de más lejos (se multiplica con la niebla: con niebla y nivel 3, 100 m) y **muerde ×1,15 / ×1,3 / ×1,5** (9 → 10,35 / 11,7 / 13,5 por segundo). Avisos al alba («El perro está más atento», «El perro está más curtido», «El perro ya es un perro de guerra») y una línea en la pantalla de la base. En `desafio-aliados.js` cambió **una línea** (el daño de la mordida) y `api.alcancePerro` ya existía.

## Cómo se usaron los bonos
Todo pasa por `sumarBono` / `quitarBonosDeOrigen` de `desafio-bonos.js` (el respaldo local que escribí mientras no estaba se borró al juntar la rama): origen `'trofeo'` (se recalcula cuando cambia el tablero o los trofeos) y `'defensa'` (cuando cambian los niveles). Los consume guardian donde corresponde: probado en la partida real, la barra de salud pasó de 100 a 110 con los siete trofeos.

## Guardado
`desafio.crece = { trofeos: { id: noche }, vistos: { jefe, pina, corona, raiz }, perro: { noches } }` con su saneo (`sanearCrece`; sólo ids válidos, enteros con tope, nada de `__proto__`) y en las obras `curt` y `colgados` (saneados en `sanearObras`). Una partida de la 4.9 carga limpia (sin trofeos, sin experiencia, perro sin curtir). Nada nuevo por invasor: no hay nada que limpiar en `bajarAlien`.

## Archivos
Nuevos: `desafio-mejoras-base.js`, `desafio-trofeos.js`, `desafio-perro-aprende.js`, `desafio-crece.js` (reglas puras), `desafio-mejoras-base-mundo.js`, `desafio-trofeos-mundo.js`, `desafio-trofeos-formas.js` (los siete modelos y el tablero), `desafio-base-juego.js` (el enganche, como `desafio-defensas49-juego.js`), `planos-trofeos.js`. Tocados en bloques `4.10 base:`: `desafio.js` (nueve lugares chicos: danarObra, la ballesta, al anochecer, al amanecer, cada cuadro, limpiar, `alcancePerro`/`danoPerro`, el martillo y el taller), `desafio-reglas.js`, `guardado.js`, `main.js` (la E, la pantalla de la base), `interacciones.js`, `construccion.js` (suma la pieza), `base-estado.js`, `desafio-aliados.js` (una línea).

## Pruebas
- `pruebas/verificar-4-10-base.mjs` (**407 comprobaciones**, en el gate): reglas puras de los tres sistemas, el mundo con el three de verdad (la placa de las 15 defensas toca su malla, el tablero y sus siete trofeos, tipo 0 y 4, poca geometría), el perro con `desafio-aliados.js` de verdad (mordida y gruñido por nivel), el guardado con el `guardado.js` real (nueva, vieja y rota), la pantalla de la base, la E y los enganches con el juego.
- `herramientas/mutar-4-10-base.cjs`: **60 mutaciones** (rompe cada regla clave: umbrales, cuándo cuenta una noche, el factor de daño, la pérdida del tablero, el origen del bono, el saneo, cada enganche) y **las 60 hacen fallar la prueba**.
- `pruebas/humo-4-10-base.cjs` (partida real, 4 escenas): siete noches de verdad (cae la noche, golpes, sale el sol) que llevan la empalizada y la ballesta al nivel 3, el muro al 1…; los mandamases de las noches 5, 10, 15 y 20 caen de verdad; la E caminando hasta el tablero; el tablero que cae; guardar, recargar y una partida vieja. Capturas en `pruebas/salidas/base-4-10/` (con `-Visible`).
- Muchas pruebas viejas leen texto: ninguna hubo que ajustar. Una prueba que cambié a propósito: ninguna.

## Rendimiento
- `npm run diag:dibujo -- --modo=desafio` en un Desafío nuevo: **218 llamadas de dibujo antes (4.9.0) y 218 después** (en una corrida anterior 221 y 224: es ruido entre corridas; la segunda dio igual).
- Con 4 defensas curtidas y la vista sobre ellas: **+4 llamadas de dibujo (228 → 232) y +528 triángulos** (una malla por defensa curtida, sin sombra); el tablero lleno, 1 llamada. El cuadro de la base cuesta **0,23 µs** (todo se revisa una vez por segundo). Sin luces, sin shaders ni materiales nuevos (programas: 93 → 93).
- Falta medir en la 4600G: con muchas defensas curtidas (≈20) en la plaza.
