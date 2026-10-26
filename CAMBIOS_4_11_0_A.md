# 4.11.0 (desafío A): pesadilla con tope propio, estudios del Mandamás y noches largas con la hora de tu reloj

Rama `v4110-a` (sale de `main` = 4.10.4). Tres decisiones de `DECISIONES_DISENO_4_10.md` (puntos 1, 2, 7 y 8) en el modo Desafío, «La noche de los duendes». No se subió la versión.

## 1. Pesadilla con tope propio (R11 / D8 / R2-9)

**Qué pasaba.** La oleada se calcula en `composicionOleada` (`src/desafio-reglas.js`): `min(18, 3 + (noche - 1) * 2) x cantidad de la dificultad x cantidad de la vuelta`, topado en 24. En Implacable (x1,4) ya `18 x 1,4 = 25` pasaba del tope, así que la pesadilla (x1,3, que se multiplica sobre la dificultad) quedaba igual que Implacable a secas desde la noche 7: perdía su +30 % de cantidad. El mismo 24 estaba también en la base (cuántos duendes caben vivos a la vez, `MAX_ALIENS` de `desafio.js`) y en la cadena de noches (`CADENA.tope`).

**Qué se hizo.**
- `src/desafio-reglas.js`: `TOPE_OLEADA = 24`, `TOPE_OLEADA_PESADILLA = 31` y `topeOleada()`, que lee el modo de la partida en curso (el mismo estado que ya usa `dificultad()`): 31 sólo si el modo es `pesadilla`, 24 en todo lo demás (sin partida, normal, corta, sin fin).
- `composicionOleada` topa en `topeOleada()`; `desafio.js` usa `topeOleada()` en `bajarAlien` (cupo en la base) y en `aplicarCadena(..., topeOleada())` (los que se escaparon y la noche perfecta). Se fue la constante `MAX_ALIENS`.
- Las demás dificultades y modos no cambian: una prueba compara, para tranquila/normal/implacable, noches 1 a 20 y vueltas 0 a 2, que sin partida y con partida normal las listas sean idénticas y que la corta no pase de 24.

**Por qué 31.** 24 x 1,3 = 31,2: es exactamente el +30 % sobre el tope de siempre. En Implacable la pesadilla da 31 contra 24 (x1,29). Mirando el costo: son 7 duendes comunes más como mucho (el enjambre y el jefe tienen cupo aparte y no cambian); la IA y el dibujo son por invasor, las sombras de los duendes tienen lugar para 64 y los halos para 512, así que 31 + 14 de enjambre + jefe entran con holgura. En una partida real de pesadilla en Implacable, noche 10, llegaron a estar 31 a la vez.

**No cubierto por este cambio.** La corrida sin fin (`topeInvasores` de `desafio-supervivencia.js`) sigue en 24: no es pesadilla. Normal en pesadilla (18 x 1,3 = 23) no llegaba al techo y queda igual.

## 2. Estudios del Mandamás a 1, 2 y 4 caídas (R5 / D15)

Ya estaba hecho desde la 4.10.2 (`UMBRALES_PROPIOS = { jefe: [1, 2, 4] }` en `desafio-bestiario-premia.js`, con su prueba R5 en `verificar-4-10-2-regresiones.mjs`); el cuaderno ya muestra los umbrales de `umbralesDe`, no números escritos. Esta versión sólo corrige dos comentarios que seguían diciendo «5, 15 y 40» y deja el comportamiento fijado en la prueba nueva (umbrales, niveles con 0 a 4 caídas, el +5 % de daño del tercero con la cuarta caída, y que la ficha del cuaderno pide 2 y 4 y no muestra 15 ni 40). Decisión propia: no se tocó nada más porque ya cumplía lo pedido.

## 3. «Noches más largas» con «Hora de tu reloj» (D7) y motivo a la vista (U9)

**Por qué la combinación no sirve.** Con `ajustes.duracion === 'reloj'` la hora de la partida es la del reloj de verdad (`actualizarTiempo` en `main.js`): el factor de noche larga nunca se aplica. La regla (y «Manos llenas», que también alarga la noche) no hacían nada y cobraban puntos de más.

**Qué se hizo.**
- `src/desafio-meta.js`: `ALARGAN_LA_NOCHE = ['nochesLargas', 'avaro']`, `MOTIVO_RELOJ` («Con la hora de tu reloj no se pueden alargar las noches») y `validarEleccion(meta, eleccion, entorno)` con `entorno.relojReal`. Sin tercer argumento todo vale como antes.
- `src/desafio-meta-juego.js` (`iniciar`) valida con el reloj del juego: no se puede empezar así ni por una puerta lateral (no gasta semillas ni deja nada).
- `src/main.js`: `relojReal: () => ajustes.duracion === 'reloj'` para la pantalla y para la meta.
- `src/desafio-meta-pantalla.js`: los dos chips quedan apagados con ese motivo; si la elección ya los traía, se sacan al dibujar. **El motivo se escribe debajo de TODOS los chips bloqueados** (reloj, «Sin aliados no hay perro», «Sin reparar, Anselmo no arregla nada», «Ya elegiste 2 ventajas», «No te alcanzan las semillas», la incompatibilidad de noches largas con manos llenas) con el renglón `np-motivo` dentro de una `np-celda`, afuera del botón (el chip apagado se ve a media opacidad y el renglón se lee entero). El `title` queda. También la pesadilla bloqueada dice a la vista por qué. Estilos en `src/plantilla.html`.
- **Decisión propia:** se apaga también «Manos llenas» (ventaja con costo que alarga la noche un tercio), porque con el reloj tiene el mismo problema; el pedido nombraba sólo la regla. Es una línea de `ALARGAN_LA_NOCHE` si se prefiere dejarla.
- **Guardado.** `sanearMeta`, `sanearMetaPartida`, `sanearDesafio` y `efectosDe` no cambiaron: una partida ya guardada con la combinación carga con su regla, su ventaja, su multiplicador de puntos y su número, y sus efectos siguen ahí (probado en Node y en una partida real recargada con la hora de tu reloj). Con el reloj puesto la noche corre como siempre a la hora del reloj.
- Efecto colateral aceptado: cuando ya hay dos ventajas elegidas, todos los chips de ventajas restantes escriben «Ya elegiste 2 ventajas» (es lo que pide «para todos»); queda más texto en pantalla.

## Verificación

- `pruebas/verificar-4-11-0-desafio-a.mjs` (615 pasos; en el gate, antes del build reproducible): tope por modo y dificultad, listas de oleada, cadena, cupo de la base, enganche del juego, umbrales del Mandamás, validación con y sin reloj, `iniciar`, guardados viejos y la pantalla completa contra un DOM de mentira. Falla antes del cambio (probado quitando `src`) y pasa después.
- `herramientas/mutar-4-11-0-desafio-a.cjs`: 22 mutaciones a propósito (cada tope, el modo, las dos cosas que alargan la noche, el motivo, cada `celda`, el enganche con el juego); las 22 se detectan.
- Pruebas existentes ajustadas, lo mínimo: `verificar-4-8-ataques.mjs` y `verificar-4-8-1-sin-naves.mjs` leían el texto `ataques.lleno(def, MAX_ALIENS)`; ahora `topeOleada()`. `humo-4-10-partidas.cjs` esperaba ×1,55 con filo, manos llenas y noches largas a la vez, pero desde la 4.10.1 las dos últimas no se suman: la falla viene de la incompatibilidad que agregó la 4.10.1 (por lectura del código; no se corrió la prueba sobre `main` para confirmarlo); ahora espera ×1,35, la regla apagada y su motivo escrito.
- `npm run verify:paralelo` y, al cierre, `npm run verify` de corrido: en verde (ver el informe).
- Partidas reales (Electron oculto en el monitor externo, de a una, perfil propio): `humo-4-11-0-desafio-a` (nueva: pantalla con el reloj, sin él, pesadilla en Implacable noche 10 con 31 a la vez, guardado con la combinación), `humo-4-10-partidas`, `humo-4-10-coihue` (69/69), `humo-3-5-1-desafio`, `humo-4-8-noches`. Capturas con `-Visible` de la pantalla Nueva partida con los motivos escritos (reloj, sin aliados, dos ventajas, sin reloj), miradas a tamaño completo: sin texto cortado ni superpuesto.

## Lo que no se pudo verificar

- 31 duendes a la vez se probaron a la altura de la lógica (conteo en una partida real), pero **no se midió el rendimiento** (cuadros) con 31 más enjambre en pantalla en la PC de referencia (Ryzen 5 4600G); acá es la notebook. Conviene una pasada con `hojarasca-medir` antes de cerrar.
- No se jugó una pesadilla Implacable completa (20 noches) para sentir el equilibrio: las 31 bajadas de la noche 10 salieron, pero cómo se siente con las defensas puestas queda para el juego a mano.
- Con la hora de tu reloj el ciclo se probó en la pantalla y al cargar; no se esperó una noche real del reloj.
