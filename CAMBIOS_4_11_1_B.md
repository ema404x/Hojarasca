# 4.11.1 · sonido (rama `v4111-b`)

Sale de `main` (4.11.0). Sin subir la versión y sin merge. Cuatro decisiones de `DECISIONES_DISENO_4_10.md` (los códigos Q remiten a `CAMBIOS_4_10_3_AJUSTES_SONIDO.md`). No se cambió ningún texto existente: la única cadena nueva es la del apagado de la radio (ver Decisiones), que se traduce al final.

## Qué se hizo

### Q4 · Los pájaros van por «El bosque»
- `fuente(pos, vol, reverb, bus = 'efectos')` en `src/sonido.js`: con `bus = 'ambiente'` la fuente sale por `bus.ambiente` y su reverberación por un envío nuevo, `envioReverbAmbiente`, que `fijarMezcla` mueve con la perilla de «El bosque» (y su mezcla por hora). Sin ese envío, con «El bosque» en 0 se habría seguido oyendo la cola de sala de los pájaros por Efectos.
- `cantar()` y `picaflor()` usan `fuenteDeAve()` (nueva). Con «El bosque» en 0 no suenan; con «Efectos» en 0 suenan igual que siempre.
- Son «pájaros» todo lo que pasa por `cantar` (zorzal, rayadito, fiofio, chucao, carpintero, cachanas, concon, bandurrias, cisnes, martín, cauquén, `ave`) más el picaflor y, por ser el mismo programador de «aves de día, bosque de noche», la ranita.

### Q5 · Pájaros adentro de la casa
- `ESPACIOS` (`src/techo-lluvia.js`) gana un valor `aves` por espacio, **igual al de `viento`** (bosque 1, alero 0,85, carpa 0,72, adentro 0,3, cueva 0,2, roca 0,65). `fuenteDeAve` multiplica el volumen por el del espacio donde está el jugador (`espacioActual`, que ya fija el juego por cuadro con `espacioDeAudio`). Es el mismo mecanismo que el del viento y la lluvia; además queda el filtro de las paredes, que ya pasaba por el bus del bosque.

### Q7 · Gramola
- Sale por el bus de la música (`src/gramola.js`): la perilla «Música» y «Solo el bosque» la gobiernan; «El bosque» y «Efectos» no la tocan.
- Va por `bus.piano` (hermano del bus de la música, con su misma perilla e interruptor; precedente: el tocadiscos) y **no** por `bus.musica`, porque ése pasa por `bajaMusica`, que la gramola misma baja a 0,3 mientras suena: se habría bajado sola.
- El bus de la música vale 0,5 con la perilla al máximo; el volumen propio de la gramola pasó de 0,9 a 0,9 × 2 para que con todo al máximo llegue a la salida lo mismo que antes (se mide: 0,72 contra 0,72).

### Q12 · Radio de la madrugada
- `src/huevos-juego.js`: cada pedido de sonido lleva un número (`pedidoRadio`) y `radioVoz` es el vigente. Cuando la síntesis termina, el audio sólo suena si el número sigue siendo el vigente y el jugador sigue a menos de 10 m de la radio. `apagarRadio()` invalida el pedido, hace un fundido a cero y corta la fuente. Se apaga también al pedir otra emisora, al empezar el Desafío y, por la revisión que ya se hacía cada 2 s, al alejarse más de 10 m.
- `main.js`: con la emisora sonando la E sobre la radio la apaga (nota «Apagaste la radio») y el aviso dice «Apagar la radio». Va después de mandar un pedido y antes de pescar otra emisora. `radioMadrugada` recibe la posición de la radio (opcional: sin ella no se mide la distancia, como la llaman las pruebas viejas).

## Decisiones propias
1. Pájaros = todo `cantar` menos el `chillido` (es de los murciélagos y queda con Efectos), más picaflor y ranita.
2. `aves` copia los valores de `viento`, en vez de inventar unos nuevos.
3. Gramola por `bus.piano` con volumen duplicado (arriba).
4. Radio: alcance de 10 m (la interacción es a ~3 m); sin panel que cerrar en este camino (la nota no es un panel), así que «cerrar el panel» se cubre con apagar/alejarse/Desafío/pedir otra. Texto nuevo: «Apagaste la radio» / «La emisora se pierde entre la estática» y el aviso «Apagar la radio» (a traducir al final).
5. Con «Solo el bosque» la gramola igual «da cuerda» (se ve la nota y se programa), pero no se oye: no se cambió el flujo de E.

## Pruebas
- Nueva `pruebas/verificar-4-11-1-sonido.mjs` (en el gate con `sumar-prueba.cjs`): motor real con el contexto de audio de mentira. Mide la ganancia hasta la salida por el grafo: 14 aves por el bus del bosque, el chillido por Efectos, bosque 0 / Efectos 0 / mitad / mezcla por hora, reverberación incluida; `aves` en cada espacio; la gramola con Música 0, mitad, bosque y efectos 0, «Solo el bosque» y `setMusica`; la radio (suena y se apaga con fundido, apagada antes de llegar, lejos, otro pedido, Desafío, revisión de 2 s) y el texto del enganche en `main.js`. Falla antes (se probó con `src` de `main`).
- **Mutación a propósito de cada regla**: 20 mutaciones del código (pájaros por Efectos, reverb por Efectos, envío sin perilla, picaflor, chillido, sin atenuar adentro, valor de `aves`, gramola por Efectos / sin compensar / por `bus.musica`, radio sin descartar si se apagó / si estás lejos / sin cortar / sin fundido / pedido nuevo no anula / alejarse / Desafío / E / aviso): todas hacen fallar la prueba. Una sobrevivió al principio (el pedido nuevo con el primero todavía en la cola era equivalente) y se agregó el caso de «corta al que ya suena».
- Ajustadas lo mínimo (fijaban lo cambiado): `verificar-sonido.mjs` (la firma de `fuente` ahora tiene `bus = 'efectos'`), `verificar-huevos.mjs` (la llamada `radioMadrugada({ x: o.datos.x, z: o.datos.z })`), y los sonidos de mentira de `verificar-4-2-lujo.mjs` y `verificar-4-4-2-construccion.mjs` (`bus` ahora lleva `musica`, que es por donde sale la gramola).
- Partida real nueva `pruebas/humo-4-11-1-sonido.cjs`: ver abajo.

## Verificación
- **Gate:** `npm run verify` de corrido: 299 pasos OK (salida 0), con `verificar-4-11-1-sonido` incluida. Antes de ajustar las cuatro pruebas viejas, `verify:paralelo` daba 4 de 299 fallas, todas por lo cambiado a propósito.
- **Partida real (Electron oculto, monitor externo, perfil propio)** `humo-4-11-1-sonido`: verde. **No se puede escuchar nada**: se espía `AudioNode.connect` del motor real, se leen las ganancias vivas de los buses (`gain.value`) y se multiplican a lo largo del camino hasta la salida. Mide con las perillas de Ajustes tocadas por la interfaz: bosque 0, Efectos 0, bosque a la mitad; afuera y adentro de la cabaña (espacio de audio «adentro», 0,300 de lo de afuera); una gramola construida y encendida con la E real con Música 0, mitad, bosque y Efectos en 0 y «Solo el bosque»; y la radio por el enganche de los huevos (suena, se apaga, apagada antes de llegar la síntesis, lejos de la radio, cerca sin apagar). Aclaración técnica: Chrome no procesa un `GainNode` sin entradas y su `gain.value` queda viejo; el humo enchufa una fuente constante en 0 a los buses para leerlos vivos, y empuja a mano la cola de síntesis porque con la ventana oculta casi no corre.
- `humo-4-0-3-ajustes`: verde. `humo-huevos`: una falla («a 36 m, mirándolo, el huemul se queda quieto»), que **ya falla igual en `main` 4.11.0** (comparada con una copia armada); no tiene que ver con el sonido.
- `humo-4-2-lujo` no se pudo cerrar: se corta con un error del propio Electron (`UnknownVizError`) al sacar la primera captura, antes de llegar a la gramola; es del entorno de capturas. La gramola se verificó con la E real en el humo nuevo.

## Lo que no se verificó
- Nada de lo que hay que **oír**: que los pájaros adentro suenen «lejos» a gusto, que la gramola suene igual de fuerte que antes (se midió la ganancia: idéntica a la salida; el timbre y el filtro de las paredes no se oyeron), que el fundido del apagado de la radio no tenga un clic, que la radio al apagarse con la E se sienta bien. Para escuchar: con «El bosque» en 0 a mediodía no tiene que haber pájaros aunque «Efectos» esté alto; entrar a la cabaña con la puerta cerrada y oír que los pájaros bajan como el viento; dar cuerda a la gramola con Música en 0 (calla) y con «Solo el bosque» (calla); con «Efectos» en 0 (suena); a las 3 de la mañana en una noche con señal, prender la radio y volver a apretar E (se apaga).
- La E real sobre la radio (se probó el enganche por texto en el gate y la lógica de la emisora por `radioMadrugada`/`apagarRadio` en Electron, pero no se construyó una radio y se apretó E sobre ella).
- La ranita y el resto de las aves (carpintero, concón, cisnes, martín, cauquén, bandurrias) sólo se midieron en el motor de mentira; en Electron, zorzal, rayadito, fiofio, chucao, cachanas, `ave` y picaflor.
