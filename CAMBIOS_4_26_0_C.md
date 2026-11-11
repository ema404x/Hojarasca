# 4.26.0 · parte C — Los interiores que faltaban

Rama `v4260-c` (sobre `main` = 4.25.3). La regla de la 4.23.0 (adentro de un cuarto cerrado, de espaldas a toda puerta o ventana, no se dibuja lo de afuera) ahora corre también en **el refugio, las dos cabañas (la del Pescador y el Puesto Alto), el almacén y nueve casas prefabricadas del jugador**. 0 shaders nuevos, 0 llamadas de dibujo nuevas, 0 capas de pantalla completa. Mismo truco: se apaga sólo mientras se dibuja el cuadro y se vuelve a prender en el `finally`.

Material crudo: `C:\Users\Andres\AppData\Local\Temp\hx\c4260\` (`equiv-r1` a `equiv-r5`: equivalencia de imagen, con `difs/` las diferencias marcadas en rojo; `cap-base`, `cap-nuevo`, `cap-nuevo2`: capturas antes y después; `med-*` y `med2-*`: rondas alternadas; `base-4253.html` y `nuevo.html`: las dos versiones medidas).

## 1. Qué cambió

### a) La regla en el valle (`src/interior-visible.js`, puro; `interiorDelValle` en `main.js`)
- **Cada estructura sabe sus paredes y sus aberturas** (`estructuras.js`): el refugio (7 × 5,5, paredes hasta 3,0 m; la puerta, la ventana del frente y el hueco del costado), las cabañas (la puerta del frente y la ventana del costado; paredes hasta 2,45 m) y el almacén (la puerta y las dos vidrieras del frente; hasta 3,35 m). Los números salen de la geometría (la prueba los compara con el código que arma los troncos y las tablas).
- **Cada abertura es un tramo**, que se vuelve puntos cada medio metro como mucho (`puntosDeAbertura`): una ventana ancha vista de cerca ya no se escapa entre dos puntos (con un solo punto en el medio, una ventana de 4 m a 1,4 m de la cámara quedaba «fuera del cuadro» con la punta adentro: está en la prueba).
- **Las ventanas cuentan siempre como abiertas** aunque tengan vidrio o postigos (los vidrios del valle son opacos pero entre vidrio y troncos queda luz): más barato dibujar todo que arriesgar un hueco.
- **Las casas del jugador** (`cajaDeCasa`): la puerta va siempre en el centro del frente (−z, como dice `planos-casas.js`); las ventanas de esas casas son cajas opacas sobre una pared entera y no cuentan. Sólo cuentan las terminadas y la que no estás editando. Se buscan con el índice de obras (`obrasCerca`, 8 m) y la caja de cada una se arma una vez (se rehace si la obra se mueve o cambia de plano).
- **En el Desafío no corre** (los duendes son instancias sin nombre y entran por la puerta).
- **Antes la regla exigía que hubiera aldea**; ahora el valle corre aunque no la haya (el orden es: edificios de la aldea, casa de té, valle).

### b) Lo que mostró la equivalencia de imagen y cómo se resolvió
Herramienta: para cada estructura y casa, la cámara en tres puntos del cuarto, 8 rumbos y 3 inclinaciones (0, −0,35 y +0,35), un cuadro con la regla y otro sin ella, y un tercero sin ella para medir el ruido (gente o bichos que se mueven). 18 blancos × 72 muestras por corrida, cinco corridas.

| problema | dónde | arreglo |
|---|---|---|
| Entre las tablas del piso se ve el suelo de abajo (con el terreno apagado se veía el cielo) | todas las casas, las cabañas | **en el valle el terreno queda** (`conTerreno`): una sola llamada; se sigue apagando el bosque, el pasto, el sotobosque, lo instanciado, la gente de afuera, el tren |
| La mancha de sol que entra por la puerta (a tus espaldas) cambiaba de sombras al darte vuelta: el mapa de sombras se rehacía con los árboles apagados | todas (también la aldea desde la 4.23.0) | **el cuadro en que se rehace el mapa de sombras se dibuja entero** (`main.js`, `apagarExterior`); se rehace pocas veces (el sol se movió, te alejaste, el cuerpo cambió de pose) |
| Rendijas de 2,5 cm entre las tablas del techo: desde adentro se veía el cielo y, cerca del alero, los árboles | las casas de `planos-casas.js` y el techo de una agua de las ampliaciones | **`forroTecho`**: una tabla corrida por agua, 4,5 cm debajo de las tablas, del color de la madera del piso, en la misma malla de la obra (+72 vértices por casa, 0 llamadas). De afuera los surcos se siguen viendo |
| Rendijas entre las tablas de las paredes del almacén | almacén | la tapajunta del frente y del fondo estaba corrida 1,8 cm de la junta (dejaba abierto 1 cm): ahora centrada; los costados suman su tapajunta de afuera |
| Hastiales abiertos entre la pared y el techo | casilla | **queda afuera** |
| Luz entre tronco y tronco | puesto de troncos (la obra) | **queda afuera** |
| Rendija de un píxel en las esquinas de las paredes de tablas | taller anexo, buhardilla, planta alta | **quedan afuera** |

**Resultado final (`equiv-r5`)**: refugio, cabaña del Pescador, Puesto Alto, cabaña de tablas y piedra, casa con galería, dormitorio anexo, despensa, cocina, bodega, salón grande y torreón: **0 muestras con diferencia por encima del ruido** (máximo 0,02 % de píxeles en el refugio). La casona, 3 muestras de 0,05 a 0,09 % (un bicho cerca del piso). El almacén, sólo donde se mueven las dos personas del mostrador (con el ruido del mismo cuadro descontado, 0,3 % como mucho). Se apaga en 15 a 42 de las 72 muestras según la casa (de espaldas a la puerta).

### c) Los bultos que tirás con V (`objetos.js`)
Sus mallas instanciadas no tenían nombre: con la regla de la 4.23.0, lo que tiraras adentro de un edificio de la aldea (y ahora de tu casa) desaparecía al darle la espalda a la puerta. Ahora se llaman `bultos-tirados` y no se apagan. (Las mallas de los objetos del valle —flores, piñas, plumas— siguen sin nombre a propósito: llegan a 120 m y apagarlas es parte del ahorro; lo que soltaste con la V vieja adentro de una casa, si quedó, desaparece de espaldas a la puerta. No se vio en ninguna partida.)

## 2. Lo que queda afuera y por qué
- **El tren y la trochita**: cada coche tiene 7 ventanas por lado en 8,8 m; desde cualquier lugar del pasillo y mirando hacia cualquier lado, alguna cae en el cuadro. No hay ahorro posible sin que se note.
- **Las habitaciones modulares** (piso, paredes, techo modular): el techo modular deja los hastiales abiertos y las ventanas modulares son huecos con postigos.
- El quincho (frente abierto), la galería cerrada (sin pared de atrás), la casilla, el puesto de troncos, el taller anexo, la buhardilla y la planta alta (ver la tabla).

## 3. Medición (notebook, 1080p, monitor externo, rondas alternadas contra la 4.25.3)
**Aviso:** en esta tanda la ventana de Electron quedó estrangulada a 1 cuadro por segundo en buena parte de los encuadres (intervalo de 1016 ms: la ventana tapada o el monitor apagado; en la primera tanda además corrían mis pruebas de Node a la vez, y eso se descartó). Abajo van **sólo las corridas sin estrangular** (intervalo < 200 ms); aun así el reloj del cuadro fue de 33 a 100 ms, más lento que en la 4.23.0, así que los ms son orientativos. Las llamadas y los triángulos no dependen de eso.

| encuadre (de espaldas a la puerta) | placa base → nuevo (ms) | llamadas | triángulos |
|---|---|---|---|
| 71 refugio de día | 22,9 · 22,9 · 28,7 → 13,6 · 9,4 · 13,6 (**−9 a −19**) | 123–126 → 55–57 | 1,16 M → 0,19 M |
| 76 refugio de noche | 27,4 → 11,2 · 11,8 (**≈ −16**) | 131–141 → 60–65 | 1,16 M → 0,19 M |
| 72 cabaña del Pescador | 21,3 · 24,8 → 14,8 · 11,7 · 15,6 (**−6 a −13**) | 255–263 → 193–200 | 1,07 M → 0,27–0,29 M |
| 73 almacén | 46,0 (una sola sin estrangular) → 19,6 · 16,3 · 20,8 | 118–120 → 48–54 | 1,18 M → 0,29–0,30 M |
| 74 casa con galería | 31,0 → 18,5 · 15,1 · 33,8 (la última con el reloj a 116 ms) | 183–213 → 121–134 | 1,22 M → 0,25 M |
| 75 casilla (queda afuera: control) | 29,8 → 25,3 · 24,5 | 204–224 → 197–214 (igual) | igual |
| 05 plaza de día | 31,5 → 26,1 · 25,0 | 193–212 → 195–206 (igual) | igual |
| 06 plaza al ocaso | 31,1 → 26,3 · 25,3 | 192–197 → 199–204 (igual) | igual |

- **CPU**: dentro del ruido en todos (4 a 13 ms de un lado y del otro; con el reloj estrangulado la CPU del cuadro no se puede comparar mejor que eso). Los interiores pierden 60 a 90 llamadas de dibujo, que a ~30 µs cada una son ~2 a 3 ms de CPU según la 4.23.0, pero no se vio limpio en esta tanda.
- **La plaza no empeora**: la regla no corre ahí (las llamadas y los triángulos son los mismos) y lo que suma por cuadro es `interiorDelValle` fuera de toda casa: **14 µs como cota superior** medida en Node con el mundo de mentira de la prueba (que es más lento que el juego por el `with` y el Proxy).
- **Capturas** (`cap-base` / `cap-nuevo2`): los interiores son iguales salvo **el cielorraso de las casas prefabricadas**, que ahora es una superficie de madera continua (se ve el forro) en vez de tablas con rendijas de luz.

## 4. Decisiones
1. **Se excluye lo que la equivalencia no dejó en cero**, aunque sea un píxel en una esquina (taller anexo, buhardilla, planta alta): el pedido era sin parpadeos. *Decisión mía.*
2. **El terreno queda en el valle**: una llamada a cambio de no tocar los pisos de todas las casas. *Decisión mía.*
3. **El forro del techo en vez de excluir todas las casas**: arregla además la luz que se colaba por el techo. Cambia lo que se ve del cielorraso desde adentro (madera lisa en vez de tablas con rendijas). *Decisión mía; si no gusta, sacar `forroTecho` y sacar las casas de `CASAS_CERRADAS`.*
4. **La tapajunta del almacén**: era un error (el comentario dice «tapajunta» y no tapaba la junta); se centró.
5. **El cuadro con sombras nuevas se dibuja entero** (también en la aldea): corrige un defecto que ya tenía la 4.23.0.

## 5. No visto a ojo
- No se jugó entrar y salir caminando del refugio, de una cabaña, del almacén ni de una casa (se probó con la cámara fija en 72 muestras por casa y por números). La puerta que se abre y se cierra, tampoco.
- La mancha de sol que cambia de sombras: se arregló por la equivalencia (las corridas 2 y 3) y no se vio en partida.
- Calidades Media y Baja (sólo Alta), nieve, otoño, lluvia, noche adentro de las casas del jugador (sí el refugio de noche, en captura), el modo foto adentro.
- El cielorraso nuevo de las casas desde afuera, de cerca (de lejos los surcos se ven igual en las capturas).
- Las casas de dos plantas desde el piso de arriba (el torreón entra; sólo se probó la planta baja).

## Claves de guardado
Ninguna.

## Pruebas
- Nueva: `pruebas/verificar-4-26-0-c.mjs` (**57 comprobaciones**, en `verify:pasos`): `interior-visible.js` (aberturas, cajas del valle y de las casas, la regla en el refugio y en una casa, la ventana ancha de cerca), `interiorDelValle` y `apagarExterior` con el código de verdad de `main.js` (refugio, cabaña, almacén, casas terminadas/en obra/en edición/el quincho, el Desafío, sin construcción, la caja cacheada y rehecha, el terreno que queda, el cuadro de sombras entero, sin aldea), los números de `estructuras.js` contra la geometría, `forroTecho` (posición debajo de las tablas en los dos ejes) y los bultos con nombre. **Mutaciones: 28** (14 del módulo puro, un proceso por copia; 14 de `main.js`); la copia sin tocar pasa y todas las mutadas fallan. Falla antes del cambio (las funciones no existían) y pasa después.
- Ajustadas a propósito: `verificar-4-23-0-c.mjs` (el mundo de mentira suma `interiorDelValle: () => null`), `verificar-4-12-1-edificios.mjs` y `verificar-4-22-0-c.mjs` (los números de oro de la cabaña de tablas y piedra y la casa con galería: +72 vértices del forro).
- Previas: las **283** `pruebas/verificar-*.mjs` que leen `main.js`, `estructuras.js`, `objetos.js`, `interior-visible.js`, `planos-casas.js` o `planos-ampliar.js`, en verde. No se corrió `npm run verify` completo.

## Herramientas (no entran al gate; en `hx\c4260`)
`equiv.js` (la equivalencia de imagen del valle, con el cuadro de ruido), `equiv.ps1`, `resumen-equiv.cjs`, `tomas-med.json` (seis interiores y la plaza), `rondas.ps1` (rondas alternadas con `-Pagina`), `micro.mjs`.
