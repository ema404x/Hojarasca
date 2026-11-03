# Hojarasca 4.23.0 (parte B) — metas y logros de la Historia

Rama `v4230-b`, sobre `main` = 4.22.0. No se subió la versión (lo hace el cierre). Es la parte B de la 4.23.0: el hallazgo 3 de `AUDITORIA_4_20_0_B.md` (la Historia no tenía ni un logro ni una meta a la vista). **Cambia el juego** (suma, no quita). 0 programas de shader nuevos, 0 capas de pantalla ni llamadas de dibujo nuevas. **No se toca Steam** (`steam.js`, `STEAM_LOGROS.md` y el resto quedan como estaban).

## Resumen de decisiones (lo recomendado por el informe, salvo lo que se anota)
| tema | decisión |
|---|---|
| Cuántos logros | **25** (el informe proponía 26): se descartó «Llegué con la llave» (cierre del capítulo 1: cinco minutos de juego, y el informe pedía que nada se dispare en la primera hora) y «todos los vecinos de la casa» (imposible) pasó a «ocho vecinos». Los demás son los del informe, con otro nombre de id. |
| Por dónde entran | Por la misma lista que los del Relax: `LOGROS_RELAX` (ahora 16 + 25) y `crearLogrosRelax`. Con ese camino `logrosParaSteam()` ya los trae (`RELAX_HISTORIA_*`) y salen solos cuando se haga el trabajo de Steam. Sin tocar Steam. El nombre de API no lleva el prefijo `HISTORIA_*` que sugería el informe (el prefijo lo arma `apiSteam` según el modo; cambiarlo es trabajo de Steam). |
| Primera hora | El primer logro es el cierre del **acto I** (capítulo 4). El arco y la honda sólo valen desde el capítulo 11 (una práctica suelta antes no cuenta). La prueba lo comprueba con partidas completas del jugador de mentira (ninguno antes del capítulo 4). |
| Spoilers | Lo que adelantaría la historia (el trato o la pelea, la noche, la deuda, el perdón, las armas, lo prestado, las decisiones grandes) va **oculto**: en el panel dice «???» y «Algo que todavía no pasó en el valle» hasta ganarlo. A la vista quedan los de ritmo (actos, vecinos, lo raro, lo de paso). |
| Lo posible | Tobías sólo llega a ser «de la casa» con la D2 = C (la pirca) y Tito sólo con la D2 = B (talar): se excluyen. En una misma partida entran **como mucho 12 de los 13** vecinos con lazo (la meta más alta es 8: una partida de mentira llegó a 8 sin hacer encargos del Relax). De las **34 optativas**, como mucho **29**: tres pares se excluyen por lo que decidís (D1: `trigo-abuelo` y `masa-crece`; D2: `tablas-tito` y `veta-vuelve`; trato o pelea: `llave-79` y `pedir-perdon`) y dos dependen de algo que no todos tienen (una pareja, un cumpleaños en la aldea). Metas: 1, 5 y 8 de la casa; 10 y 20 de paso. La prueba lo verifica con las condiciones reales (`ofrece`): el mejor camino ofrece 31 con pareja y cumpleaños y 29 sin ellas. |
| Los códigos | Saltar capítulos con `historia capitulo N` o `historia completar` deja una marca (`trucos.historia`) y los logros de la Historia no cuentan desde entonces (como las anotaciones del cuaderno que puso la consola, desde la 4.5). `historia reiniciar` saca la marca. |
| Guía | Cuatro contadores en la caja «La historia del valle» (sólo con la historia empezada): lo raro, de paso, vecinos de la casa y escenas vividas. Nunca un número de lazo. |
| «Lo vivido» | Una pestaña nueva del cuaderno (J) con las reseñas de las 124 escenas, por capítulo y con el día. Sólo lo que viste, sin spoilers. Sin texto nuevo: son las `resumen` que ya estaban escritas. |

## 1. Los 25 logros (`src/logros-historia.js`)
Cada uno mira datos que la Historia **ya guarda** en `progreso.historia` (ninguna clave de guardado nueva por esto). Una historia de la versión vieja (la de ocho capítulos) no cuenta.

| id | nombre | cómo se gana | a la vista |
|---|---|---|---|
| `historia-verano` | Ya sos del valle | cerrar el capítulo 4 (acto I) | sí |
| `historia-otono` | El molino muele | cerrar el capítulo 8 (acto II) | sí |
| `historia-del-valle` | Del valle | terminar la historia | sí |
| `historia-casa-1` | De la casa | un vecino «de la casa» | sí |
| `historia-casa-5` | La mesa larga | cinco vecinos de la casa | sí |
| `historia-casa-8` | Todo el valle en tu mesa | ocho vecinos de la casa | sí |
| `historia-raro-25` | Un zorro con gorro | 25 indicios en el cuaderno de lo raro | sí |
| `historia-raro-60` | Cuaderno de lo raro | 60 indicios | sí |
| `historia-opt-10` | De paso | diez optativas | sí |
| `historia-opt-20` | Lo que hiciste de paso | veinte optativas | sí |
| `historia-nevada` | Lo que dice el cuaderno | cerrar el capítulo 12 | oculto |
| `historia-trato` | Hay que tener trato | terminar con el trato | oculto |
| `historia-pelea` | La puerta entornada | terminar después de la pelea | oculto |
| `historia-convidado` | Convidado | dos convites (D1 A, D3 C, D2 A o C) | oculto |
| `historia-ramal` | El silbato largo | terminar con el ramal salvado | oculto |
| `historia-noche-una` | Nevó y no cedió | ganar la noche al primer intento | oculto |
| `historia-noche-otra` | Otra vez | perder y ganar la noche | oculto |
| `historia-deuda` | Palabra de molinero | pagar la deuda del trato (con la escena `deuda-pagada`) | oculto |
| `historia-perdon` | Pedir perdón | pedir perdón después de la pelea | oculto |
| `historia-armas` | Arco y honda | las dos armas (desde el capítulo 11) | oculto |
| `historia-prestado` | Todo el valle prestó algo | los cuatro préstamos de la noche | oculto |
| `historia-majada-fermin` | No me la devuelvas flaca | D5 A y terminar | oculto |
| `historia-majada-vendida` | Andá | D5 C y terminar | oculto |
| `historia-arbol-notable` | Árbol notable | D4 C y terminar | oculto |
| `historia-talado` | Seis hachazos | D2 B y terminar | oculto |

- Los intentos de la noche están en `noche.intentos` y en su espejo `duendes.intentos` (el informe lo dejaba por decidir): **manda el mayor**.
- Panel de logros (`src/desafio-logros.js`): los de la Historia van bajo el título «La historia del valle» (los del Relax y los del Desafío se dibujan igual que siempre). El título ocupa todo el ancho de la grilla.
- Traducción: los nuevos **no** se tradujeron (regla del usuario: el inglés se hace al final). `pruebas/verificar-idioma-1-10.mjs` ahora pide traducción sólo a los logros del Relax de siempre (los de la Historia llevan `historia: true`).

## 2. Los contadores de la guía (`src/historia-metas.js`, caja de `src/historia-ui.js`)
Con la historia empezada, la guía (F1) muestra cuatro líneas, con los topes **posibles** y no los totales:
- «Lo raro: N de 118»
- «De paso: N de 34 (en una misma partida entran hasta 29)»
- «Vecinos de la casa: N (hasta 12 en una misma partida)»
- «Escenas vividas: N de 124»

El total de indicios y de escenas sale de los datos (hoy 118 y 124; el informe decía 117 y el brief 34 optativas, que es lo que hay).

## 3. «Lo vivido» (`src/historia-vivido.js`, pestaña del cuaderno en `main.js`)
- Pestaña **«Lo vivido»** (sólo en el Relax y con la historia empezada o alguna escena vista). Izquierda: «N de 124 escenas vividas» y un botón por capítulo vivido (con cuántas). Derecha: las escenas de ese capítulo, cada una con «Día N · título» y su reseña.
- Orden: por capítulo, después por día y, a igual día, el orden en que se vieron. Abre en el último capítulo vivido.
- **Sin spoilers:** sólo las escenas que ya viste (aunque las hayas saltado) y sólo los capítulos que tocaste; el título de un capítulo que no pisaste no aparece.
- Tono: se revisó el de las 124 reseñas (la prueba). Una **sola** frase se cambió: la de `majada-fin` decía «Con el lazo al máximo…» y ahora dice «Y si ya sos de la casa…» (el lazo no se nombra en pantalla).

## Guardado
**Una clave nueva:** `trucos.historia` (booleano), dentro de la marca de los códigos que ya existía. Se sanea al guardar y cargar (`sanearMarcaTrucos`). Una partida vieja no la trae y sigue igual. Los logros siguen en el almacén global de siempre (`hojarasca-logros-relax-v1`: los ids nuevos los reconoce el saneo).

## Lo que **no** se hizo (y por qué)
- Nada de Steam: ni API, ni alta en Steamworks, ni `STEAM_LOGROS.md` (se genera de `logrosParaSteam()` cuando se haga ese trabajo y ya incluirá los 25).
- «Todos los vecinos de la casa» y «todas las optativas»: imposibles.
- Logros por escenas sueltas o por elecciones de sabor.
- Un contador de logros de la Historia en la guía (los logros tienen su panel).
- Traducciones (al final).

## Pruebas
- **`pruebas/verificar-4-23-0-b.mjs`**: 2141 comprobaciones y 31 mutaciones (cada una en su proceso, sobre una copia de `src/`; todas atrapadas). Cubre: los 25 logros uno por uno (con su dato mínimo y sin él, la historia vieja, los ocultos, el `desde` del arco y la honda, la noche jugada con las funciones del juego —ganar de una, perder y ganar, dejarla perdida—, la deuda con `alDecidirDuendes` y `pagarDeuda`); que entran por `LOGROS_RELAX` y salen por `logrosParaSteam()` sin tocar `steam.js`; los códigos `historia capitulo N`, `historia completar` y `historia reiniciar` con la marca y el saneo; el panel de logros con su título (con un documento de mentira); los contadores con los topes posibles (29 de paso se verifican con las condiciones reales `ofrece` de las 34 optativas: el mejor camino da 31 con pareja y cumpleaños y 29 sin ellas; ningún par excluyente se ofrece junto); «Lo vivido» (orden, agrupado, sin spoilers, vacío, elegir capítulo, las clases del cuaderno, el cableado en `main.js`); el tono de todo lo nuevo y de las 124 reseñas; y ocho partidas completas del jugador de mentira (los trece capítulos sin atascos, todos los logros alcanzados menos «Otra vez», que el jugador de mentira no puede porque no cuenta intentos —se prueba con las funciones de la noche—, ocho vecinos de la casa en una misma partida, ninguna meta por encima de lo posible, nada antes del capítulo 4 y, en cada capítulo vivido, las reseñas con su día).
- **`pruebas/humo-4-23-0-b.cjs`** (partida real, candado de Electron, monitor externo, 1366x768 y 1024x600; `herramientas/correr-humo-4-23-0-b.ps1` toma el candado sólo durante la corrida): el aviso del logro en pantalla y lo guardado; el panel de logros (41, el título, 17 en «???», sin desborde, el título a todo el ancho); la pestaña «Lo vivido» con una escena corrida de verdad con el director de la partida; los contadores de la guía; programas de shader 111 → 111. Resultado: todo en verde (la partida entera pasó en dos corridas: la primera encontró errores de la propia prueba, por ejemplo indicios que no existían en los datos y logros ganados antes por el bucle del juego; no del juego).
- **Previas que se corrieron y siguen en verde:** `verificar-logros-relax`, `verificar-logros`, `verificar-trucos` (606), `verificar-3-8-6-relax`, `verificar-guia`, `verificar-idioma`, `verificar-3-1-historia`, `verificar-4-14-0-escenas`, `verificar-4-15-0-historia`, `verificar-4-15-0-escenas-acto1`, `verificar-4-16-0-historia-a`, `verificar-4-17-0-historia-a`, `verificar-4-17-0-escenas-acto3`, `verificar-4-17-1-progreso`, `verificar-4-18-0-optativas-a`, `verificar-4-18-0-escenas-optativas`, `verificar-4-18-2-lazos-a`, `verificar-4-18-2-lazos-escenas`, `verificar-4-18-4-a`, `verificar-4-18-4-b`, `verificar-4-19-0-a`, `verificar-4-19-0-b`, `verificar-4-21-0-a`, `verificar-4-21-0-b`, `verificar-4-22-0-b`, `verificar-guardado-rc2`, `verificar-release`. No se corrió `npm run verify` completo (lo hace el cierre).
- **Ajustada a propósito:** `verificar-idioma-1-10` (pide traducción sólo a los logros del Relax de siempre: los de la Historia se traducen al final).
- El ayudante `pruebas/ayuda-4-18-4-historia.mjs` ganó tres ganchos **opcionales** (`alPaso`, `decide`, `escena`): sin ellos corre exactamente igual (las pruebas de la 4.18.4 en adelante lo confirman).

## Qué **no** se vio a ojo
- De las capturas (`pruebas/salidas/humo-4-23-0-b/`, que no van al repositorio) se miraron: el cuaderno «Lo vivido» en 1366x768 y en 1024x600, la guía en 1024x600, el panel de logros arriba en 1366x768 y abajo en 1024x600 y el aviso del logro. **No se vieron** (sólo se midieron, sin desborde a los costados): la guía en 1366x768, «Lo vivido» del capítulo 1, el panel de logros arriba en 1024x600 y abajo en 1366x768.
- Una partida jugada de punta a punta por una persona: los logros se probaron con partidas de mentira, funciones del juego y una partida real corta con la historia armada a mano (los capítulos se dieron por cerrados con datos, no jugándolos).
- Cuánto tarda de verdad una persona en llegar al cierre del acto I (el informe lo estima en más de una hora; no se midió: las tareas de trabajo no se miden).
- El aviso del logro con dos logros juntos (el juego los encola con 2,2 s de diferencia: es el mecanismo de siempre) y el sonido.
- Los textos en el idioma inglés (no se traduce todavía).

## Archivos
Nuevos: `src/logros-historia.js`, `src/historia-metas.js`, `src/historia-vivido.js`, `pruebas/verificar-4-23-0-b.mjs`, `pruebas/humo-4-23-0-b.cjs`, `herramientas/correr-humo-4-23-0-b.ps1`, este documento.
Tocados: `src/logros-relax.js`, `src/desafio-logros.js`, `src/trucos.js`, `src/historia-ui.js`, `src/main.js` (sólo el import y la pestaña en `dibujarCuadernoSinFoco`), `src/historia-escenas-acto3-c13.js` (una frase), `package.json` (sólo `verify:pasos`), `pruebas/ayuda-4-18-4-historia.mjs` (ganchos opcionales `alPaso`, `decide` y `escena`, que no cambian lo existente), `pruebas/verificar-idioma-1-10.mjs` (ajustada a propósito).
