# 4.11.4 · banco de sonidos (rama `v4114-sonidos`, sale de `main` = 4.11.3)

Versión 4.11.4 (junta directa: la rama salió de main y main no avanzó). El usuario nunca escuchó los sonidos nuevos de las últimas versiones y no quiere jugar hasta provocar cada uno:
esta versión le deja **un banco de sonidos** en la pausa (y el documento `herramientas/LEEME-SONIDOS.txt` para usarlo). **Nada se escuchó**: quien
programó no puede oír; todo se verificó leyendo el grafo de audio (por qué bus sale cada fuente), no el sonido.

## Qué se hizo

- **Catálogo** (`src/banco-sonidos.js`, sin DOM ni three): **146 sonidos** en 18 grupos, cada uno con id, nombre, grupo, bus (El bosque, Efectos o Música),
  variantes, si se usa la distancia/el lado/la fuerza, desde qué versión es, qué escuchar y cómo se dispara (la función real).
  Por grupo: Coihue y su subida 8 · voces y risas de los duendes 15 · avisos y miedo 7 · asedio 15 · aliados y campana 10 · defensas, trampas y brasas 12 ·
  armas 10 · pájaros y animales 19 · viento y hojas 2 · agua 5 · lluvia y techos 4 · fuego, abejas y grillos 3 · pasos y trabajo 8 · gente y aldea 5 ·
  trochita, kayak y pesca 10 · música 6 · radio de madrugada 2 · interfaz 5. Por bus: Efectos 115, El bosque 25, Música 6. 42 tienen selector de
  variante; 100 usan la distancia y el lado; 17 llevan la marca «nuevo» (lo agregado desde la 4.8.0 que nadie oyó) y 17 la de «cambió 4.11.1»
  (pájaros por El bosque, gramola por Música, radio con apagado).
- **Cada entrada llama a la función real** del motor (`sonido.js`), del banco del Desafío (`desafio-sonidos.js`, armado contra el mismo motor), de las
  tandas nuevas (`desafio-aro-sonido.js`, `desafio-brasas-sonido.js`, `desafio-campana-sonido.js`), de la gramola y de la radio. Nada se copia ni se renderiza aparte.
- **Controlador** (`crearBancoSonidos`): `abrir`, `cerrar`, `tocar(id, { variante, distancia, lado, fuerza })`, `detenerTodo`, `estado`.
  Anota las fuentes de audio que nacen de cada sonido (envolviendo `createBufferSource` y `createOscillator` del contexto mientras está abierto) para poder
  cortarlas. Antes de cada sonido sintetiza lo que falte (las risas, las raíces, la rama, los pájaros: si no, el motor toca la versión de antes y el banco
  engañaría). Los bucles del ambiente (viento, lluvia, techo, arroyo, orilla, cascada, fuego, panal, grillos) los maneja `actualizar` con el estado del mundo:
  el banco envuelve `actualizar` y le fuerza ese estado (Enter prende, otro Enter apaga); al cerrar, el motor vuelve a ser el de siempre.
- **Pantalla** (`src/banco-sonidos-panel.js` + `#banco-sonidos` en `plantilla.html`): botón «Banco de sonidos» en la pausa, debajo de «Banco de pruebas».
  Lista agrupada con ↑ ↓ (Re Pág/Av Pág por grupo, Inicio/Fin), Enter o clic para oírlo, ← → para la variante, Espacio para «Detener todo», D/L/F para la
  distancia, el lado y la fuerza, Tab para los volúmenes, Escape para volver a la pausa. A la derecha: qué suena y por qué bus sale, el detalle del sonido,
  las opciones; al pie, los **volúmenes reales** (general, El bosque, Efectos, Música y «Con piano / Solo el bosque»: son los mismos `data-ajuste-rango`
  de Ajustes, no una copia; al abrir y cerrar se sincronizan con los de la pausa). Se cierra con Escape (main.js), con volver al juego y no se deja pisar por la pausa
  al perder el foco.
- **No toca la partida**: el módulo y la pantalla no mencionan el guardado, el progreso ni el almacenamiento (lo comprueba la prueba), y la partida real
  lo comprobó con una instantánea del progreso y del almacenamiento antes y después. Lo único que cambia son los volúmenes si el usuario los mueve (Ajustes).
- **Dos cambios chicos en código del juego** para no copiar: `alternarGramola(sonido, cerca, duenio, temaId)` acepta un tema elegido sin mover el turno de la
  gramola del juego, y `emitirEmisora(son, buf)` (en `huevos-juego.js`) es la salida de la radio de madrugada, que ahora usan el juego y el banco.

## Decisiones propias (el usuario no estaba)

1. **En el Relax el banco deja sonar al Desafío** mientras está abierto (`sonido.relax = false`) y lo restaura al cerrar: casi todo lo nuevo es del Desafío y
   en el Relax esos sonidos no suenan por diseño.
2. **«Detener todo»** corta con un fundido de 40 ms de la salida general (para que no haga clic), para las fuentes anotadas, la gramola, la radio, los bucles
   forzados y los silencios raros, y reinicia el tope de tres risas a la vez. No toca el ambiente ni la música propios del juego.
3. **Los sonidos que el juego dispara «en línea»** (martillo de Anselmo, piedra de los chicos, flecha aliada, fuego de Herminia, apagón, foso, estacas, mina,
   miel, estructuras de la madriguera: 13) no tienen función propia en el motor. Sus números están una sola vez en la tabla `LINEA` del catálogo y la prueba comprueba
   que sigan escritos igual en el archivo del juego.
4. **No hay sonido propio para habilidades, trofeos ni placas**: avisan con el par de notas del logro, que está en el catálogo («Un logro»); el documento lo dice.
5. **Prioridad**: «nuevo» = agregado desde la 4.8.0 y nunca oído; «cambió 4.11.1» = el ruteo de la 4.11.1.
6. La distancia y el lado ubican el sonido respecto de la cámara (la dirección la pasa `main.js` con `ctxSonido.adelante`); la fuerza sirve a los que la reciben
   (voces, risas, impactos, pasos).
7. Los nombres de los grupos del Desafío dicen «Noche de los duendes» (la prueba 3.8.0 prohíbe «Desafío» en textos visibles). Textos nuevos sólo en castellano.
8. Atajos de letras (D, L, F) sólo con el banco abierto; main.js le entrega las teclas al banco y se queda con Escape.

## No incluido en el banco

Las melodías del tocadiscos, la música de tensión del Desafío (niebla, luna llena), la guitarra y el acordeón de las fiestas, las voces de las escenas de amor y
los sonidos que dependen del estado de la partida y no tienen una función suelta. Los de la lista de arriba son los que el motor puede hacer sonar solos.

## Verificación

- **`pruebas/verificar-4-11-4-banco-sonidos.mjs`** (en el gate con `sumar-prueba.cjs`): **2124 comprobaciones** con el motor real y el audio de mentira. El catálogo
  (ids y nombres sin repetir, grupos y buses válidos, variantes con defecto, todo lo nuevo presente); cada entrada llama a las funciones que declara (que existen) y
  crea fuentes que llegan a su bus y a ningún otro, ni a la salida de otro bus; cada variante suena; las fuentes anotadas son justo las que nacieron; los bucles suben las
  perillas del motor y el segundo Enter las baja; «Detener todo» corta fuentes, gramola, radio, bucles, silencio y devuelve la salida a su volumen; abrir/cerrar
  restauran el Relax, `actualizar` y el contexto; la distancia y el lado; que no toca el almacenamiento ni el guardado (trampa en `localStorage`); los sonidos en línea contra el juego;
  la gramola; y la pantalla con un DOM mínimo (flechas, Inicio/Fin, Re Pág/Av Pág, Enter, variantes, D/L/F, Espacio, foco en un control, clic, cierre).
  **Falla antes** (sin el módulo no carga) y pasa después.
- **Mutación a propósito de cada regla**: 48 mutaciones del código (ids repetidos, función equivocada, bus equivocado, un sonido que llega a otro bus, detener sin cortar
  fuentes/gramola/bucles/silencio/tope de risas, la salida que queda muda, cerrar sin restaurar, el segundo Enter, la derecha por la izquierda, la distancia, un sonido en línea,
  el registro de fuentes, lo que nace al drenar la cola, las teclas de la pantalla, Escape, el foco perdido, guardar al cerrar, el botón y el volumen real, la radio y la gramola):
  **47 hacen fallar la prueba**; la que sobrevive («detener no corta la fuente de la radio») es equivalente: esa fuente también está entre las anotadas y se corta por ahí.
- **Gate**: `npm run verify` de corrido: **304 pasos OK** (salida 0), con `verificar-4-11-4-banco-sonidos` incluida (el gate de la 4.11.3 tenía 303). Durante el trabajo
  `verify:paralelo` dio 3 de 304 fallas (las tres arreglando el código nuevo, ver abajo) y, en una corrida posterior, 1 de 304
  (`verificar-construccion-premium-rc6`) que **pasa sola**: es de tiempo (corre apretada con otras 13 a la vez), no tiene nada que ver con lo cambiado. Pruebas existentes: **ninguna se tocó**; las tres que fallaron al principio (`verificar-3-8-textos`: «Desafío» en textos
  visibles; `verificar-4-0-1-nucleo`: la línea de `volverAlJuego`; `verificar-4-8-1-sin-naves`: una palabra en una cadena visible) fijaban lo que no se debía cambiar y se
  corrigió el código nuevo, no ellas.
- **Partida real** `pruebas/humo-4-11-4-banco-sonidos.cjs` (Electron oculto, monitor externo, perfil propio, una sola instancia): abre el banco como el jugador (Escape, clic), recorre la
  lista con el teclado y dispara los **146 sonidos con Enter** (49 s): todos crean fuentes que llegan a su bus y a la salida y a ningún otro bus (las fuentes que sólo modulan una perilla
  —vibrato, temblor de una garganta— se descuentan), el cartel dice el nombre y el bus, los bucles suben las perillas del motor, **los volúmenes del panel son los reales** («El bosque» en 0
  calla al pájaro, «Efectos» en 0 a la campana, «Música» a la mitad baja la gramola a la mitad, a 0 no se oye), «Detener todo» deja 0 fuentes, sin gramola ni radio ni bucles,
  Escape vuelve a la pausa y deja el Relax, `actualizar` y el contexto como estaban, y **la partida quedó intacta** (el progreso y el almacenamiento, comparados con la pausa quieta);
  sin errores de consola. Capturas a tamaño completo del banco abierto (lista, detalle, volúmenes y ayuda al pie, todo legible y nada cortado), con la lluvia sonando, con una ventana
  de 1280×650 (ahí el panel de la derecha se desplaza adentro) y detenido.

## Lo no verificado

- **Nada se escuchó.** Ni un timbre, ni un nivel, ni un clic, ni un solapamiento: sólo el grafo (por dónde sale cada fuente) y las ganancias. Eso es justo lo que el banco le deja al usuario.
- Que el fundido de 40 ms de «Detener todo» no se oiga como un corte feo; que la primera vez que se toca un sonido el instante de preparación no se note.
- En una ventana más baja de 700 px el detalle de la derecha se desplaza adentro (las opciones de abajo quedan a un desplazamiento).
- El inglés: no se tradujo ni se escribió (se traduce al final).
