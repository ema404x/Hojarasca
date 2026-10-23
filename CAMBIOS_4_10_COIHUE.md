# 4.10 «coihue»: el final y el valle (rama `v410-coihue`, sale de `main` = 4.9.0)

Tanda 3 de las mejoras del Desafío («Volver a jugar»), parte del Coihue Viejo y del valle: **el Coihue camina hacia tu base** durante el asedio,
**la subida por adentro tiene peligros** (raíces que se mueven y duendes de las ramas) y **hay lugares del valle que los duendes toman** y se
recuperan. No se sube la versión (sigue 4.9.0 en `package.json`). Capturas a tamaño completo en `pruebas/salidas/coihue-4-10/` (la partida de prueba) y
`pruebas/salidas/coihue-4-10-antes-despues/` (la misma cámara en la 4.9.0 y en esta; `pruebas/salidas/` no se sube al repositorio).

## 0. Lo que ya existía (leído del código antes de tocar; no se duplicó)
- **El Coihue de la noche final** (`desafio-eventos.js`, `crearNodriza`): camina 7 s desde el bosque y se para a 50–80 m de la base; si amanece se queda
  **plantado** (`fase: 'plantado'`) y es **el mismo** del asedio (`api.coihueComun`). Tiene seis raíces-patas con su andar (`animarCoihue`) y sus
  colisiones (`piesCoihue`).
- **El asedio** (`desafio-asedio.js` / `-mundo.js`, 3.0): empieza al alba después de la noche 20; cuatro zonas con una raíz («aguja») cada una; de día se
  cortan, de noche contraatacan la última zona recuperada, con tres zonas libres se abre la puertita. Todo vive en `d.asedio` (`zonas`, `contra`, `noches`,
  `ganado`, `reyCaido`).
- **La subida** (3.8.0, `armarSubida` y `desafio-nave-mundo.js`): una escalera de raíces de 8 vueltas que se camina, con tres duendes **decorativos** que asoman
  de sus casitas y se esconden; el corazón se arma **sobre el mismo x, z donde se plantó el Coihue** (adentro se camina sobre el terreno de abajo).
- **La infestación** (`desafio-infestacion.js`, 2.3): nidos de hongos que quedan al alba desde la noche 4 (hasta 6): se queman con una ramita (E) o se rompen a
  golpes y, si quedan, se abren de noche y suman duendes. Y las zonas tomadas del asedio con su mancha de musgo (`mancha()`).
- **El mapa de papel** (`chinches.js` → `marcasAutomaticas` → `mapa.js`): marcas automáticas con su dibujito; `desafio.asedio.marcas()` ya llegaba.

## 1. El Coihue camina hacia la base (`src/desafio-camino.js`, `desafio-asedio-mundo.js`)
**Reglas** (puras, `desafio-camino.js`; el estado va en `d.asedio.camino`, con saneo en `sanearAsedio`; un asedio de una partida vieja lo calcula la primera noche):
- **La ruta**: una grilla A* de 6 m desde donde está parado hasta quedar a **24 m del centro de tu base** (`CAMINO.llegada`), que esquiva el agua (y 9 m de orilla), la
  vía (9 m), los lugares del valle (14 m), las **obras (8 m: el árbol es ancho, sus patas llegan a 13 m)** y la ladera fuerte; se «estira» (se saltean los puntos
  que se ven en línea recta sin tocar nada) y lleva costo por monte cerrado. Si el cerco no deja, prueba con menos holgura (`[9,8]`, `[4,5]`, `[2,2.5]`) y, si no hay
  camino, la recta (`recta: true`). **Se vuelve a calcular cada noche** desde donde quedó, con lo que hayas construido y el centro de tu base de ese momento.
- **El paso**: llegaría en 5 noches si nadie lo frena (`porNoche = largo / 5`, mínimo 4 m); **cada zona libre lo rebaja un 8%** (piso del 45%). Plantado a 62 m son
  ~7 m por noche; el de la noche final queda a 50–80 m: de 5 a 11 m por noche.
- **Cuándo camina**: contado en horas de juego desde que cae la noche (`horasDeNoche`): de 0,5 a 6,5 h (de las 21 a las 3). No depende de los fps ni de cuánto dura el día, y
  dormir (que salta la hora) lo hace caminar igual (`cerrarNocheCamino` camina lo que faltaba; un salto de reloj a la mitad no regala ni quita, probado).
- **Lo que se ve**: va **a zancadas** (espera a sacarle 2 m a la cuenta, da el paso a 0,9 m/s con las patas del andar de siempre y se queda quieto); **temblor** de
  cámara (hasta 0,8, mucho menos con la «cámara reducida»: `desafio.temblor` y 6 líneas en `main.js`), crujidos, polvo en las patas y la vibración del mando. Deja
  **huellas** (por cada punto, seis marcas de tierra removida con su montículo y el surco de la raíz que arrastró, cada 5 m; se guardan en `camino.rastro`) y una **sombra**
  en cuña que se alarga de él hacia tu base (de 16 a 62 m, según cuánto avanzó). Todo de capas translúcidas de un color apiladas: **sin luces ni shaders nuevos**
  (los programas se compilan con los testigos de la carga) y, adentro del tronco hueco, ni las huellas ni la sombra se dibujan.
- **Dónde se ve cuánto falta**: el HUD (`… · el Coihue está a 38 m de tu base`), la nota del alba («Caminó 7 m en la noche y está a 31 m de tu base…») y el **mapa de papel**:
  una línea de puntos a lápiz con una flechita del Coihue a tu base (`marcas()` → clase `ruta` → `mapa.js`). La pista `p-camina` lo explica.
- **Cómo se lo frena** (con lo que ya tenés): (1) **las seis raíces de apoyo son blancos** (arco, honda, pistola, lanza, hacha: el mismo camino que las agujas): a los
  **170 de daño** (por la vida de la dificultad) se le **traba una**: se queda quieto 0,7 h de noche (acumulado máximo 1,5 h) y **no se le traba otra por golpes durante 1,2 h**;
  de día, cada raíz cortada le **rebaja el paso de la noche que viene** un 10% (máximo 30%). (2) **Las trampas**: si pisa una (pozo, red, abrojos, miel, lazo, foso, estacas)
  se enreda 0,5 h y la trampa pierde el 35% de su vida. (3) **Cada zona libre** (cortar sus agujas) lo hace caminar más despacio. Pegándole todo lo posible camina entre el 30% y
  el 70% de lo normal (probado): **no se lo puede detener por completo** (ni se rompe el equilibrio de la victoria).
- **Si llega** (a 24 m): al terminar el último paso **el cerco cae**: las obras en 32 m a la redonda pierden el 65% de su vida (quedan con el 8% como mínimo: no se destruye
  nada de golpe) con polvo, explosión y sonido; **la puertita se abre sola** (`puedeAbordar` vale aunque no haya zonas libres) y una nota lo dice. **La victoria no cambió**:
  el corazón se sube igual, con el Rey Duende adentro; `d.asedio`/`d.victoria` conservan sus nombres y `NOCHE_FINAL` (20) y `NOCHE_JEFE` (5) no se tocaron (la prueba lo mira).
- **El corazón no se muda**: `camino.interior` guarda el llano donde se plantó; la escalera y la sala del Rey se arman ahí (`api.sitioInterior`) y se sale al valle donde esté
  parado el Coihue ahora (`api.sitioHaz`). Mientras camina sus raíces **no chocan** (parado, sí; se vuelven a poner donde quedó).
- Las raíces de apoyo son blancos del asedio **sin `ancla`** (no son agujas) y con `i` desde 100, para no confundirse con las zonas (la tabla de golpes del Desafío ahora manda
  `n?.ancla || n?.pies` al asedio: una línea de `desafio.js`).

## 2. La subida con peligros (`desafio-nave.js` §4.10, `desafio-nave-mundo.js`)
- **Tres raíces que se mueven**, en tramos parejos de la escalera, lejos de los descansos y de las puertas (`lugaresRaices`). Ciclo de **10,2 a 11,6 s** según la raíz:
  reposo 3,4–4,8 s → **aviso 1,8 s** (la raíz sale de la pared y tiembla, el escalón brilla en naranja, crujido) → **barrido 0,8 s** (de arriba para abajo, 2,8 m del escalón; si te
  agarra: **7 de daño y un empujón de 7 m/s hacia abajo**, nunca fuera de la escalera) → **queda atravesada 3,2 s** (choca como una pared, arco de ~2 m) → vuelve en 1 s.
  **Sólo arranca si estás cerca** (a menos de 13 m de escalera y a tu altura), una vez empezada termina siempre y **nunca se atraviesa encima tuyo** (si estás en su zona cuando le
  toca tapar, la solidez espera a que salgas). Atravesada menos del 40% del tiempo y nunca más de 3,2 s seguidos aunque estés siempre cerca (probado).
- **Duendes de las ramas**: los tres que ya asomaban de sus casitas. A 3,5–10,5 m, a tu altura y sin el tronco del medio de por medio: **salen, chillan y destellan (1,2 s de aviso)
  y tiran una semilla de ámbar** (6 de daño, cada ~5,6 s). Si te acercás a menos de 3,5 m se meten; **son blancos** (36 de vida; las armas les pegan por el camino de siempre): si les
  pegás se esconden 9 s y a la segunda se van hasta que vuelvas a subir.
- **Justos**: con menos de 30 de salud no hacen daño (sólo avisan y empujan); las raíces y los duendes arrancan como nuevos en cada subida y se guardan al entrar al corazón; la física se
  limpia con todo lo demás. En una subida entera caminada de verdad (humo): 33 s, 0 caídas, nunca más de 0,2 s quieto.

## 3. Lugares del valle que toman los duendes (`desafio-valle.js` §11, `desafio-tomadas-mundo.js`, sobre la infestación y el asedio)
- **Los puntos son los de las raíces del asedio** (la misma `ubicarZonas` con el mismo azar): estación, orilla del lago y bosque de arrayanes (la base no se toma). Se arman la primera vez
  (`d.valle`) y **al empezar el asedio se cierran** (las raíces del Coihue ocupan su lugar).
- **Cuándo**: desde la noche 3, **uno cada 2 noches, de a dos como mucho** (el valle nunca queda entero perdido). Escalones 1 a 3; **un nido por lugar (dos en el 3)**: es el nido de la
  infestación (`zona: id`: el mismo E, los mismos tres golpes y el mismo saneo, con tope `CAPULLOS.max + 4`).
- **Qué hace**: dentro de 18 m **no se talan árboles, no se pican piedras y no se juntan los recursos del mapa de la semilla** (la H avisa y el cartel de la H también; E en el lugar del mapa
  avisa); de noche el nido se abre como los demás, **el lugar sube un escalón** y salen más duendes (+1 saltador en el 2; saltador y rastreador en el 3).
- **Cómo se recupera**: de día, sacar el nido (si hay dos, los dos) baja un escalón; en 0 queda **recuperado** (+2 semillas doradas y 2 noches de respiro). Las notas lo cuentan.
- **Cómo se ve**: la mancha (cinco capas de suelo oscuro y tres de sombra violeta a media altura del pasto: el pasto es más alto que el suelo), **hongos** de colores (hasta 16, más con cada
  escalón, más altos que el pasto) y **bruma baja** con cuatro columnas de esporas que giran despacio y se ven de lejos; en el **mapa de papel**, una mancha de tinta con hongos y su nombre.
  **3 mallas por lugar y ~4600 triángulos, sin luces ni shaders nuevos**; sólo se arman al tomarse. Pista: `p-tomada`.
- Guardado: `d.valle` con `sanearValle`; una partida vieja carga sin lugares tomados.

## 4. Lo que se tocó fuera de mis archivos (bloques `// 4.10 coihue:` mínimos)
- `desafio.js`: import y creación de `tomadas`; `api.sitioInterior`, `api.adentroDelCoihue`, `api.obraCerca`, `api.trampasEn`, `api.pisarTrampa`, `api.caerCerco`, `api.alEmpezarAsedio`;
  los ganchos de los nidos (`tomadas.alAmanecer()`, `alAbrirseNido`, `alQuitarNido` ×2), `tomadas.actualizar/limpiar`, el despacho de golpes a las raíces, y los getters `valle`,
  `temblor` y `centroBase` (pruebas).
- `main.js`: la cámara que tiembla, el hacha y el pico frenados (`lugarTomado`), y las pistas `p-camina` y `p-tomada`. `mapa.js` y `chinches.js`: la línea de la ruta y la mancha de un lugar tomado.
- `desafio-reglas.js`: `d.valle` (nuevo y con saneo). `desafio-mapa-mundo.js`: los recursos del mapa de la semilla frenados en un lugar tomado. `desafio-coihue-formas.js`: dos testigos más.
- Pruebas viejas ajustadas **lo mínimo, a propósito** (cambió el texto, no la conducta): `verificar-3-8-coihue.mjs` (las raíces chocan donde está parado ahora; la subida se arma en `si`; «cerca se meten» es
  `PELIGROS.ramas.minimo`, el 3,5 de antes), `verificar-4-2-pico.mjs` (la ventana de lectura de `usarHacha`, de 4800 a 4900 letras: una línea más) y `humo-3-0-asedio.cjs` (las marcas del mapa no cuentan
  la ruta, que es una línea). `package.json`: `verificar-4-10-coihue.mjs` en el gate (`sumar-prueba.cjs`).

## 5. Verificación
- **`pruebas/verificar-4-10-coihue.mjs`: 274 comprobaciones** (en el gate): la ruta (válida metro a metro sin agua ni obras, encerrado → recta, determinista, un mapa gigante no se cuelga), el avance de
  cada noche (con y sin zonas libres, dormir, saltos de reloj, cuándo llega), cómo se frena (raíces, inmunidad, topes, trampa, rebaja de día, el mejor caso sigue avanzando), guardado y saneo (camino roto, lugares
  tomados, nidos, partida vieja), el ciclo de las raíces (orden de fases, aviso largo, sólo con alguien cerca, nunca encierra), los lugares tomados (cuándo se toman, se abren, se recuperan, respiro, tope) y el enganche
  con el juego (texto, por lo que no se puede importar en Node).
- **`herramientas/mutar-4-10-coihue.cjs`: 77 mutaciones, todas atrapadas** (cada regla clave rota a propósito → la prueba falla). Salieron 8 huecos de la prueba en el camino y se cerraron.
- **`npm run verify` de corrido: 278 pasos OK** (277 de la base + el nuevo).
- **Partida real** (`pruebas/humo-4-10-coihue.cjs`, Electron, con `-Visible`): **68/68**. Valle: se toma un lugar, el nido y la mancha, el hacha frenado (cartel y E), el mapa, se quema el nido y se recupera (+3 semillas: 1
  del nido, 2 del lugar), de noche el nido se abre y el lugar sube, se guarda y se recarga igual. Camino: una noche camina 7,0 m de 7 (86 cuadros de zancada, temblor 0,39); la ruta no pisa agua ni obras (36 puntos);
  las seis raíces son blancos, a los 3 golpes se traba, el hacha y la pistola le llegan, pisa una trampa de miel (se enreda 0,5 h y la trampa pasa de 90 a 58,5), llega y el cerco cae (la empalizada 320 → 112), la
  puertita se abre sola, se guarda y se recarga igual. Subida: entra por donde está parado el Coihue y el corazón se arma donde se plantó; una raíz hace su ciclo entero, empuja y pega 7; los duendes de las ramas avisan, tiran
  y se meten si les pegás; la subida entera caminada de verdad; al salir no queda nada atravesado.
- **Otras partidas reales**: `humo-3-0-asedio` en verde (todos los pasos); `humo-desafio-premium` en verde; `humo-3-5-1-desafio`: **falla a veces, en las dos versiones** (4.9.0: 3 corridas de 6 con «entre tandas no queda nadie
  colgado en la cola» y, una vez, «caer adentro te escupe al valle»; esta rama: 2 de 5, las mismas dos cosas). Es del azar de la noche de la nodriza, no de esto.
- **Capturas vistas a tamaño completo**: `coihue-4-10-antes-despues/` (`antes-1-coihue-plantado`, `despues-1-coihue-plantado`, `despues-2-coihue-tras-dos-noches`, `despues-3-desde-arriba`, `antes-4-escalera-sin-hacer`,
  `despues-4-escalera-sin-hacer`, `despues-5-escalera-raiz-atravesada`) y `coihue-4-10/` (`01…05` el lugar tomado en dos escalones, de lejos y desde adentro; `06` el mapa; `10…12` el Coihue plantado y tras dos noches; `13/14` las
  huellas con y sin; `15/16` la sombra con y sin; `17` sobre la base; `20-raiz-aviso/barrido/tapa`; `21` el duende de las ramas que avisa).

## 6. Rendimiento (notebook Ryzen 7 7730U: sólo comparar antes/después; `herramientas/medir-4-10-coihue.cjs`, calidad alta, 150 cuadros por vista, A,B,A,B)
| vista | 4.9.0 (p50 ms · dibujos · triángulos) | esta rama |
|---|---|---|
| Coihue plantado, desde la base | 14,8 / 15,0 · 281–287 · 1 239 550 | 14,9 / 15,1 · 273–282 · 1 230 734 (igual) |
| Coihue tras dos noches (huellas, sombra, raíces con blancos), de día | — | 15,6 / 15,8 · 283 · 1 250 764 (**+0,7 ms, +10 dibujos, +20 000 triángulos** sobre el plantado) |
| ídem, de noche | — | 13,5 / 15,3 · 191–196 · 1 211 180 – 1 214 817 |
| un lugar tomado (escalón 3) | — | 10,0 / 10,1 · 170–243 · 1 011 310 – 1 021 593 (un lugar con todo cuesta ~4600 triángulos y 3 dibujos) |
| subida (la escalera) | 1,4 / 2,5 · 27 · 117 851 | 2,2 / 2,2 · 36 · 120 700 (**+0,4 a +0,8 ms**; +9 dibujos, +2 900 triángulos; después de esa medición se escondieron las huellas y la sombra adentro: −3 dibujos, sin volver a medir) |
- **Programas (shaders): 0 nuevos jugando**; +1 en la carga (los dos testigos nuevos de `testigosCoihue`: translúcido de un color y color por vértice sin alfa). Medido con la clave del programa: las mallas nuevas usan exactamente los del testigo.
- **Falta medir en la 4600G** (la referencia): `HTML=<index.html> SALIDA=<json> CALIDAD=alta npx electron herramientas/medir-4-10-coihue.cjs --user-data-dir=<carpeta propia>` en las dos versiones, A,B,A,B, y comparar los p50 de `coihue-plantado`
  contra `coihue-camino-dia` y `subida`. La regla es que nada empeore más de ~1 ms.

## 7. Decisiones a revisar y lo que no se verificó
- **Ritmo del Coihue** (5 noches si nadie lo frena; 24 m de llegada; 8% por zona libre): sale de pensar que el asedio dura ~3–5 noches; **no se jugó un asedio entero**. Con las cuatro zonas libres llega en ~7 noches, y pegándole todo lo posible se puede estirar hasta ~3 veces más (nunca detenerlo).
- **El cerco cae** con el 65% de daño a lo que haya en 32 m (sin destruir). Se puede hacer más duro (que lo destruya) o más blando; es una constante (`api.caerCerco(x, z, 32, 0.65)`).
- **Los lugares tomados bloquean árbol, piedra y los lugares del mapa de la semilla**, no las ramitas ni la caza; si la recompensa de recuperar (2 semillas doradas) o los 2 días de respiro parecen poco, son `TOMADAS.premio` y `TOMADAS.respiro`.
- **Con el asedio los lugares tomados se cierran** (no pasan a ser las raíces del asedio: son otra cosa que desaparece); así no se pisan los dos sistemas, pero el bloqueo de recursos no sigue en el asedio.
- **Visual**: las huellas y la sombra del Coihue **se ven poco entre el pasto alto** (se ven bien los montículos, el surco y un tinte oscuro; la sombra es una cuña apenas más oscura): si se quiere más presencia hay que subir las opacidades (`matCapa(..., 0.3)`). La bruma de los lugares se cambió a cuatro capas al final y **no se volvió a fotografiar**.
- **No verificado**: los sonidos nuevos (crujidos, aviso de las raíces) **nadie los escuchó**; el rendimiento en la 4600G; una partida corta de 7 noches con lugares tomados; la fusión con las otras tres ramas (los bloques están separados, pero `desafio.js`, `main.js`, `desafio-reglas.js` y `package.json` los tocan todos).
