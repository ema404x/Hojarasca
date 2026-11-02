# 4.18.4 — Zona B: el juego base sin la Historia (rama `v4184-b`)

Resultado: **1 bug confirmado y arreglado (ALTA)**, ninguna pregunta de diseño, algunas sospechas menores sin tocar. La zona es muy robusta: la mayor parte de lo buscado salió limpia.

## Tabla

| id | gravedad | dónde | cómo se reproduce | estado | prueba |
|---|---|---|---|---|---|
| B-01 | ALTA | `src/desafio.js` `cerrarVarada` (~línea 3500) | Desafío: una noche se vara la trochita; no la escoltás hasta la estación y llega el alba (o caés). `cerrarVarada` llamaba a `tren.soltar(0)`, que desde la 4.0.3 es la de la caída (`soltar(jugador)`): tira «Cannot set properties of undefined (setting 'enTren')» dentro de `amanecer()`. Efectos: el tren queda varado para siempre (no vuelve a andar), y el resto del amanecer no se hace (capullos nuevos, lugares tomados, evolución, puestos, récord de la semilla). Visto en partida real (Electron): el error en consola y `tren.est.varado` en verdadero con `s` quieto de día. | **arreglado** (`tr?.soltarVarada?.(0)`) | `pruebas/verificar-4-18-4-b.mjs`: ejecuta la función real contra la trochita real; con la llamada vieja falla (probado con `git stash` y con mutación en el mismo archivo) |

## Cómo se buscó (y qué salió limpio)

Probado en **partida real (Electron)** con bots de azar con semilla que comprueban invariantes (números finitos, nada negativo, pesos enteros, `pesos == ganado − gastado`, posición finita, sin fallas del bucle ni errores en consola):
- Relax: ~15 000 pasos en 6 corridas (teleportes a lugares, edificios y vecinos; E, F, G, H, Y, B, T, O, dígitos, F1/F2/F5; saltos de hora y día; dormir; guardar; clima), con calidad muy baja, alta, reloj real, estaciones y modo fluido. 0 hallazgos.
- Relax: 726 charlas y 2086 opciones elegidas en las ruedas de los 22 vecinos con la billetera y la mochila llenas. 0 hallazgos.
- Relax: 211 planos de obra colocados, visitados con E/F/G y guardados; ninguna se perdió ni cambió de etapas.
- Relax: días 2 a 123456 y horas límite con 40 cuadros cada una; menús (pausa, cuaderno, mapa, mochila, personalizar, logros, guía, billetera) abiertos y cerrados 6 veces: geometrías y texturas no crecen, el modo siempre vuelve a `jugando`.
- Relax: todos los botones y barras de Ajustes: lo que queda en memoria es lo que queda en disco, con el tipo correcto.
- Relax: guardar → cargar → guardar de una partida jugada al azar: sólo cambia lo que se mueve solo (vida social de los vecinos, pasos del diario); no se pierde ni se altera ningún campo.
- Desafío: ~125 noches simuladas (campaña, sin fin, tranquila e implacable, rescates, trochita varada, caídas, invasores de todos los tipos, taller, bloqueo, esquiva, flechas). El único hallazgo es B-01 (lo mostró una corrida de azar y se reprodujo a propósito).

Probado **sólo en Node**:
- Fuzz de `sanearProgreso` (Relax y Desafío): cada ruta de la partida nueva reemplazada por 14 valores hostiles (null, negativos, cadenas, listas, objetos, 1e308, ±Infinity). Ninguna excepción; lo único no finito es un `Infinity` escrito a mano como `1e999` en `feria.dia`, `visitas.ultima` y `visitas.cuenta` (el juego nunca lo escribe: `JSON.stringify` da `null`). No se toca. (`{"toString":1}` hace tirar a muchos saneadores, pero es un caso ya conocido y cubierto por la copia de seguridad: B10 de la 4.0.1.)
- Fuzz de `carga.js` (20 000 casos): `lugarPara` nunca pasa del límite.
- Análisis estático de los 486 módulos (con el analizador de JS que trae Node): importaciones que el módulo de origen no exporta (como las entiende `armar.mjs`): 0; identificadores sin declarar: 0 reales; claves duplicadas, `case` duplicados, comparaciones con NaN o consigo mismas, `sort` con comparador booleano, `Math.min/max(...[])` sin guarda: 0 problemas reales; los `catch { }` vacíos de `main.js` son todos legítimos (foco, sincronía, copia al portapapeles).
- Versión: `package.json`, `package-lock.json`, portada (sale de `package.json` al armar) y `RELEASE_STATUS.md` coinciden en 4.18.3. `STEAM_LOGROS.md` coincide con `logrosParaSteam()` (34 logros, sin repetidos).
- Fugas al volver a la portada o cargar otra partida: no aplica: todo recarga la página (`location.reload`), no hay intervalos que limpiar.

## Sospechas sin confirmar (no se tocó nada)

- Ganchos opcionales que nadie conecta, por lo que las llamadas con `?.` no hacen nada: `alGuiar` (aldea-gente.js:1465), `alBengala` (desafio-arsenal-mundo.js:284), `bloqueoVisual` (desafio.js:766), `registrarLeyenda` (fiestas-juego.js:262), `alSubir` (oficios-ui.js:29). No pierden nada hoy; son código muerto o cosas que quedaron sin enchufar (BAJA).
- `sumarEntrada` llamada fuera de `modo === 'jugando'` crea la entrada del cuaderno sin la nota ni la página de diario de «primera vez» (`registrar` sale si no se está jugando). No se vio ningún camino que lo haga en la práctica.

## Qué no miré

La Historia (zona A) y las partidas largas con tiempo acelerado, memoria y shaders (zona C). Del base: modo foto más allá de alternarlo, mando real (sólo teclado), sincronización con carpeta (leída, no ejecutada), construcción con colisiones reales entre obras (sólo colocar y guardar), pesca y caza en partidas con peces reales, y el balance de la economía (arbitraje entre precios). El inglés no se tocó.

## Preguntas para el usuario

Ninguna.
