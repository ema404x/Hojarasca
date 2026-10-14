# Hojarasca — El creador de Bruno Castellanos (plan del 13-10-2026)

> **Nota del 14-10-2026 (al subirlo a git):** las secciones 17 a 23 dicen «nada commiteado ni subido». Eso era cierto cuando se escribieron; **ahora todo está en la rama `creador-bruno`** del repositorio.
> Para retomar, empezar por `CREADOR_BRUNO_LEEME.md`.


Decisión del usuario (13-10): el juego tiene un **protagonista fijo**, Bruno Castellanos, y antes de empezar el jugador elige **diez
personalizaciones**: cinco de aspecto y cinco de carácter. Este documento es sólo el plan: **todavía no se ejecutó nada del juego**.

## 1. El protagonista (fijo)

- **Bruno Castellanos, 27 años, varón.** Llega al valle buscando paz, lejos del ruido de la ciudad. El nombre y el sexo no se eligen.
- **Lo que deja atrás:** un trabajo que lo agotó (el ritmo, el ruido). Nada de ruptura ni duelo: no choca con el romance del juego.
- **Tono del prólogo:** calmo y esperanzado. El viaje en la trochita, el alivio de dejar el ruido.
- **Voz:** el juego habla en voseo ("Sos Bruno Castellanos", no "Eres"). Los textos del protagonista van en masculino.

## 2. Las diez personalizaciones

Aspecto (se puede **rehacer después**, en el espejo del refugio):
1. **Rostro:** forma de la cara (cuatro bases bien distintas) y color de ojos.
2. **Piel:** seis tonos.
3. **Pelo:** color, peinado y barba (afeitado, bigote o barba).
4. **Físico:** contextura y estatura.
5. **Ropa:** color de la campera y un accesorio (nada, gorro de lana, bufanda o anteojos).

Carácter (**quedan fijos** una vez elegidos):
6. **Personalidad.**
7. **Oficio de antes.**
8. **Gustos** (se eligen dos).
9. **Hobby.**
10. **Virtud y defecto** (el jugador elige una de cada una).

## 3. Pros y contras

- Cada opción de 6, 7, 8 y 9 trae **su propio pro y su propio contra**, visibles al elegir. La 10 agrega una virtud y un defecto elegidos.
- La pantalla muestra al final un **resumen de Bruno** con la suma de pros y contras.
- **Efectos sólo en el Relax.** El Desafío queda parejo para todos.
- **Topes:** ningún sistema sube ni baja más de un 20 % por la suma de rasgos. Ninguna opción es mejor que otra: cada una pesa lo mismo
  de pro que de contra. Los efectos sólo aceleran o frenan; nunca traban contenido.

## 4. El catálogo (para revisar: se tacha y se suma antes de ejecutar)

- **Personalidad (5):** tranquilo, curioso, sociable, metódico, reservado.
- **Oficio de antes (6):** programador, cocinero, contador, técnico de sonido, mensajero en bicicleta, docente de plástica.
- **Gustos (6, se eligen 2):** mate, folklore, lluvia, trenes, asado, libros.
- **Hobby (5):** fotografía, pesca, guitarra, carpintería, observar aves.
- **Virtud (5):** resistente, paciente, simpático, ahorrativo, madrugador.
- **Defecto (5):** friolero, impaciente, distraído, gruñón, dormilón.

Ejemplos de pro y contra (a completar para todas las opciones en la fase 1):
- Técnico de sonido: graba los cantos de las aves más rápido; los ruidos fuertes lo cansan.
- Cocinero: la cocina rinde más; le cuesta madrugar.
- Reservado: los vecinos le cuentan más historias; el afecto sube más lento.
- Hobby fotografía: las fotos del álbum valen más; pierde horas mirando.

## 5. Dónde pegan los efectos (sistemas que el juego ya tiene)

Abrigo y frío (`abrigo.js`), cuaderno (`cuaderno.js`), pesca (`pesca.js`), huerta (`huerta.js`), cocina (`cocina.js`), telar (`telar.js`),
construcción (`construccion.js`), feria (`feria.js`), álbum de fotos (`album.js`), aves y grabador (`aves.js`, `grabador.js`), afecto con los
vecinos y romance (`amor.js`, `vecindad.js`), clima (`clima.js`). Cada rasgo se escribe como **dato declarativo** (sistema y porcentaje), y
cada sistema lo lee por una sola función. Así se prueba el tope sin tocar el juego.

## 6. Orden de trabajo

1. **Datos y reglas (se empieza por acá).** Catálogo completo con pros, contras y efectos como datos; el genoma de Bruno con saneo y
   versión; pruebas que verifican las diez personalizaciones, el tope del 20 %, que ninguna opción domina y que una partida vieja o rota
   siempre sane a un Bruno válido.
2. **Pantalla de creación:** vista previa 3D que gira con la luz del valle, las diez pantallas, el resumen de Bruno, el espejo para
   rehacer el aspecto. Calidad pensada para la Ryzen 5 4600G (armado por pasos, sin tirones).
3. **Efectos en los sistemas**, uno por vez y con su prueba, empezando por tres o cuatro (abrigo, afecto, pesca, cuaderno).
4. **Prólogo y reacciones:** la historia de Bruno en el tren y frases de Ramón, Josefina, Ercilia y Nicanor según el oficio y el hobby.
5. **Inglés y balance final** (los textos van en español y en inglés).

## 7. Riesgos

- Balance entre rasgos (por eso los topes y las pruebas de la fase 1).
- Volumen de textos: cada variante se escribe dos veces. Por eso las reacciones se limitan a oficio y hobby, y a cuatro vecinos.
- Partidas viejas: arrancan con un Bruno por defecto, sin obligar a crear nada. El creador se ofrece una vez desde el menú.
- Cada cara base es un molde de cráneo en memoria: pocas y bien distintas, y los valores siempre en pasos (nada continuo).
- La vista previa tiene que andar en la placa integrada.

## 8. Lo que ya existe (borrador, sin enchufar al juego)

- `trabajo/t392c/src/creador-personaje.js`: genoma y traductor al motor de cuerpos, **sólo del aspecto**, con diez elecciones de aspecto.
  Hay que **reagruparlo** en las cinco de aspecto de arriba más las cinco de carácter.
- `trabajo/t392c/pruebas/verificar-3-9-2-creador.mjs`: sus pruebas (121 verificaciones, en verde).
- El estudio de personajes acepta genomas (`genomas=<archivo>` y claves `gen-<nombre>`); sirve para ver las variantes sin abrir el valle.
- Nota técnica: el lanzador de Electron se traga en silencio los argumentos con dos puntos. En las pruebas, usar rutas relativas y claves con guion.
- El motor de cuerpos ya soporta barba, bigote, anteojos, siete peinados masculinos y las cuatro caras base. Falta separar más las caras entre sí.

## 9. Decisiones del 14-10-2026 (la personalización)

- **Extras de la primera versión:** sólo el **guardarropa** (ropa por ocasión y estación: abrigo de invierno, poncho del telar, botas de goma,
  ropa de fiesta para la peña). Se **dejan para después**: el hobby que decora el refugio, el oficio que se nota en el cuaderno y el apodo.
- **Rehacer el aspecto:** con un **espejo en el refugio**, un objeto del mundo que se usa de cerca y reutiliza la vista previa de la creación.
  No va en el modo foto ni como botón suelto del panel.
- **Cuándo se crea a Bruno:** en una **pantalla propia antes de empezar**, con vista previa que gira. Después arranca el prólogo.
  El viaje en la trochita como creación (el reflejo en la ventanilla, el documento) queda como idea para más adelante.
- **Dónde se ve la ficha de Bruno** (personalidad, oficio, gustos, hobby, virtud, defecto y la suma de pros y contras): **en el cuaderno**, como
  su primera página, de sólo lectura. La sección «Tu personaje» del panel queda con el aspecto y el guardarropa.
  - Pendiente a verificar en la fase 2: cómo arma sus páginas `cuaderno.js` y si una página fija y de sólo lectura entra sin mezclarse con las
    anotaciones de naturaleza. Si no entra bien, el plan B es la sección «Tu personaje».

Con esto cambia el alcance de las fases: la fase 2 trae la **pantalla de creación**, el **espejo del refugio** (un objeto nuevo) y la
**primera página del cuaderno**; la fase 3 suma el **guardarropa** (el abrigo y la ropa de temporada ya existen, falta elegir entre ellos).

## 10. Decisiones del 14-10-2026 (segunda tanda)

- **Versión:** el creador va en una **versión propia después de la 4.0** (la 4.1). La 4.0 queda como está: visual y de rendimiento, sin contenido nuevo.
  Este documento y los borradores no entran en la 4.0.
- **Pantalla de creación:** **dos pantallas**. Primero el aspecto (cara, piel, pelo y barba, físico, ropa) con la vista previa que gira. Después
  «su historia»: tarjetas de personalidad, oficio, gustos, hobby, virtud y defecto.
- **Efectos:** se muestran como **texto claro, sin números** («cocina mejor», «se cansa con el ruido»). Los números y topes viven sólo en los datos
  y en las pruebas; el jugador no optimiza porcentajes.
- **Partidas:** **cada partida guardada tiene su propio Bruno** (hay tres por modo). Cada una pasa por su creación.
- **Prólogo:** **escenas de texto** (la ciudad, el tren, la llegada) y cae directo en el refugio. No hay escena jugable en la trochita.
- **Romance:** la personalidad lo toca **un poco, con efectos suaves** (el reservado tarda más en abrirse, el sociable sube el afecto más rápido). Nadie
  queda bloqueado y ninguna personalidad decide con quién se puede salir.
- **Guardarropa:** la ropa se desbloquea **con el progreso del juego**, como hoy (poncho del telar, botas de goma del almacén, ropa de fiesta de la peña).
- **Inglés:** **sólo español por ahora.** Corrección a lo que ofrecí en la opción: la prueba de idioma del juego **no obliga** a traducir lo nuevo
  (verifica listas fijas de textos y que las traducciones existentes no estén vacías; cada versión que traduce suma su propia prueba). Consecuencia:
  con el juego en inglés, la creación, el prólogo y la ficha de Bruno se van a ver en español hasta que se traduzcan. Conviene dejarlo anotado como
  deuda en la lista de pendientes de la versión.

## 11. Decisiones del 14-10-2026 (tercera tanda)

- **Vista previa:** con **la calidad que el juego eligió para esa placa**, armando el cuerpo **por pasos** para no trabar la Ryzen 5 4600G.
- **Desafío:** **mismo creador, con los efectos apagados.** Se crea a Bruno igual y el aspecto vale; la personalidad y los rasgos no cambian la
  supervivencia.
- **El espejo es una pieza que se coloca** (sale del plano de construcción), no un objeto fijo del refugio.
  - **Riesgo:** si el espejo se desarma o se pierde, no hay dónde rehacer el aspecto. Reglas para cubrirlo: el espejo **no cuesta materiales**,
    **siempre está disponible en el plano** aunque ya haya uno puesto, y **el refugio nuevo viene con uno colocado** para que nadie arranque
    sin él. Por las dudas, la sección «Tu personaje» del panel muestra dónde está el espejo o cómo conseguir otro.
- **Partidas ya empezadas: se obliga a crear al abrir.** Todos pasan por la pantalla de creación antes de entrar.
  - **Riesgos y reglas:** (1) el prólogo **no se repite** en una partida vieja: sólo se rehace al personaje; (2) **se precarga lo que el jugador ya
    eligió** en «Tu personaje» (piel, pelo, peinado al más parecido, contextura, color de campera, gorro y bufanda como accesorio), así nadie
    rehace desde cero lo que ya tenía; (3) la creación ocurre en la pantalla de inicio, **antes de entrar**, para no cortar una noche del Desafío;
    (4) la partida **no queda bloqueada** si el jugador cierra la ventana a mitad: el juego guarda el Bruno por defecto y vuelve a pedir la creación la
    próxima vez; (5) hay que probarlo con las partidas guardadas que ya existen antes de publicar.

## 12. Lo que falta planificar

Los efectos por sistema (el catálogo completo de pros y contras con sus topes), el diseño de la primera página del cuaderno, la escritura del
prólogo y de las tarjetas, el mando y la accesibilidad de la pantalla de creación (letra grande, paletas para daltonismo), las pruebas
(que ninguna opción domine, que las partidas viejas abran) y la lista final de trabajo con orden y alcance.

## 13. Decisiones del 14-10-2026 (cuarta tanda)

- **Efectos en cuatro sistemas** en la primera versión: **abrigo, afecto con los vecinos, pesca y cuaderno.** Huerta, cocina, telar, construcción, feria,
  álbum, aves y clima quedan para después; cada uno se suma con su propia prueba sin rehacer nada.
- **Suma de efectos:** varios rasgos sobre el mismo sistema **se suman hasta el tope del 20 %**. La prueba de balance recorre todas las combinaciones
  posibles y verifica que ningún sistema pase del tope, ni para arriba ni para abajo.
- **Primera página del cuaderno:** la **ficha completa** de Bruno (retrato, nombre, edad, personalidad, oficio, gustos, hobby, virtud, defecto y la suma
  de pros y contras). El cuaderno ya está organizado en secciones (`SECCIONES` en `cuaderno.js`), así que va como **una sección nueva, la primera**. Se
  verifica en la fase 2 que una sección con una sola entrada fija y de sólo lectura entre sin romper el recorrido de las demás.
- **Accesibilidad de la pantalla de creación: sólo mouse y teclado.**
  - **Riesgo:** el juego ya tiene mando (`mando.js`) y ajustes de accesibilidad (`accesibilidad.js`: teclas cambiadas, letra grande, colores que se
    distingan, avisos escritos). Con esta decisión, **quien juega sólo con mando no puede pasar la primera pantalla** de una partida nueva. Con la salida
    a Steam en el horizonte, es el punto más débil del plan.
  - **Regla para no olvidarlo:** antes de publicar en Steam, la pantalla de creación tiene que poder completarse con el mando, o la partida tiene que
    poder empezar con un Bruno por defecto sin pasar por ella. Queda anotado como **deuda con fecha** en la lista de pendientes de la versión.
  - **Pendiente de decidir (menor):** si la pantalla, aun sin mando, respeta la letra grande que el jugador ya eligió en Opciones. La recomendación es que sí.

## 14. Decisiones del 14-10-2026 (quinta y sexta tanda)

- **Corrección de conteo:** el catálogo de carácter tiene **32 opciones**, no 27: 5 de personalidad, 6 de oficio, 6 de gustos, 5 de hobby, 5 de virtud y 5 de defecto.
- **Opciones cuyo sistema no está entre los cuatro** (guitarra, carpintería, asado, trenes, fotografía y otras): **entran con efecto de sabor** (se ven en la ficha y en
  algunos diálogos) y **se enchufan después**, cuando su sistema entre, sin tocar la creación.
- **Gustos (se eligen dos):** dan **afinidad con los vecinos que los comparten** (por ejemplo, mate con Ramón). Usa el afecto, que ya está entre los cuatro
  sistemas, y respeta el tope del 20 %. **La tabla vecino × gusto la propongo yo** a partir de lo que cada vecino ya dice y hace en el juego, y la corregís.
- **Textos:** **los escribís vos** y yo los adapto al voseo y a las voces del juego. Corren **en paralelo** con lo técnico.
- **Balance:** una prueba **recorre todas las combinaciones** y verifica que ningún sistema pase del tope y que ninguna opción sea mejor que otra en la suma
  de pros y contras. Para las opciones de sabor, esa suma es cero por construcción.
- **Retrato de la ficha:** una **foto chica guardada en la partida**. Se saca al terminar la creación y cada vez que se rehace el aspecto. No se arma el
  cuerpo al abrir el cuaderno.
- **Terminado:** la 4.1 se da por terminada con **las pruebas verdes, los cuatro sistemas funcionando y una partida jugada de punta a punta** con un par de
  Brunos distintos, antes de publicar.
- **Observación sobre las voces:** el protagonista es varón y las voces del juego ya le hablan en masculino, así que **no hace falta reescribir los textos
  existentes** por el género. Es razonado, no verificado; queda como verificación en la fase 4 (recorrer las líneas que le hablan al jugador).

## 15. Lista final de trabajo (versión 4.1)

**Pista A, técnica (la hago yo):**
- **F0. Preparación.** La plantilla de textos para que empieces a escribir, la tabla vecino × gusto y la lista de los 32 rasgos con sus efectos propuestos.
- **F1. Datos y reglas.** El genoma de Bruno reagrupado en las diez personalizaciones, el catálogo con pros, contras y efectos como datos, el guardado por partida,
  la precarga desde las partidas viejas y las pruebas (diez elecciones, saneo, tope del 20 %, todas las combinaciones, que ninguna opción domine).
- **F2. Pantalla, espejo y cuaderno.** Las dos pantallas de creación con la vista previa que gira, el espejo (pieza gratuita, siempre en el plano y ya colocada
  en el refugio nuevo), el retrato guardado, la sección nueva del cuaderno con la ficha, y la creación obligatoria en las partidas viejas sin repetir el prólogo.
- **F3. Efectos y guardarropa.** Abrigo, afecto con los vecinos, pesca y cuaderno, uno por vez y con su prueba, y el guardarropa con los desbloqueos de siempre.
- **F4. Prólogo y textos.** Integrar lo que escribas, revisar las líneas que le hablan al jugador y armar las escenas de texto con la llegada al refugio.
- **F5. Cierre.** Todas las pruebas del proyecto, una partida de punta a punta con varios Brunos distintos, y la lista de pendientes de la versión.

**Pista B, de textos (la hacés vos), en paralelo con F1 a F3**, con la plantilla de F0. Cantidad estimada (razonada, no medida): el prólogo en unas cinco
pantallas de 40 a 60 palabras; 32 tarjetas con un nombre, una frase, un pro y un contra de una línea cada uno; los títulos y botones de las dos pantallas, y los
mensajes del espejo. En total, algo menos de dos mil palabras.

**Riesgos abiertos, en un solo lugar**
1. **Mando:** la creación es sólo con mouse y teclado. Antes de Steam tiene que poder completarse con mando o empezar con un Bruno por defecto (deuda con fecha).
2. **Espejo:** si se pierde no hay cómo rehacer el aspecto. Cubierto por las tres reglas de la sección 11.
3. **Partidas viejas:** la creación obligatoria las interrumpe. Cubierto por las cinco reglas de la sección 11 y la prueba con partidas reales.
4. **Inglés:** la creación, el prólogo y la ficha se ven en español con el juego en inglés hasta traducirlos. Deuda anotada.
5. **Cuaderno:** una sección con una sola entrada fija puede no entrar sin romper el recorrido. Se verifica al empezar F2; plan B en «Tu personaje».
6. **Gustos:** la afinidad con los vecinos es un mecanismo nuevo dentro del afecto. Va con prueba y con tope.
7. **Texto propio:** si los textos no llegan a F4, el prólogo queda como una tarjeta y las tarjetas con textos provisorios.

La sección 12 («Lo que falta planificar») queda cubierta por las secciones 13 a 15.

## 16. F0 hecha (14-10-2026): documentos de preparación

Con el visto bueno para empezar, se preparó la F0. Son **sólo documentos**: no se tocó el código del juego ni se subió nada a git.

- `RASGOS_BRUNO.md`: los 32 rasgos con sus efectos propuestos en los cuatro sistemas, las reglas de balance y el reparto.
- `GUSTOS_VECINOS_BRUNO.md`: qué le gusta a cada vecino (36 más la bailarina), con la evidencia de las voces y lo que es propuesta.
- `TEXTOS_BRUNO.md`: la plantilla de textos para completar (prólogo, 32 tarjetas, pantallas, ficha y espejo).

**Tres cosas que salieron al prepararla y hay que decidir:**
1. **El mate no discrimina:** aparece en las voces de 31 de 36 vecinos, así que como gusto da afinidad con casi todos. Recomendación: dejarlo con la afinidad a la mitad.
2. **El abrigo está desbalanceado:** 6 de sus 9 rasgos son contras y sólo 3 son pros. Hay que rebalancear antes de la F1.
3. **Persona de la narración:** segunda («Sos Bruno») o tercera («Bruno llega»). Lo elige quien escribe los textos, en la primera línea de la plantilla.

## 17. Decisiones del 14-10-2026 (séptima tanda: lo que dejó la F0)

- **El mate** queda como gusto, con la **afinidad a la mitad** (medio paso) porque lo comparte casi todo el pueblo.
- **Reparto de efectos:** lo **rebalanceo yo** y vos revisás. Hecho en `RASGOS_BRUNO.md`: abrigo 4 pros y 5 contras; cuaderno, pesca y afecto 4 y 4 (contado con un
  script sobre las tablas). Cambiaron cuatro rasgos: Reservado, Cocinero, el hobby Pesca y Madrugador. El abrigo conserva a propósito una contra de más.
- **Narración:** **segunda persona** («Sos Bruno Castellanos»), en el prólogo y en las tarjetas.
- **Líneas de los vecinos para el asado y la lluvia:** **sí**, una línea por cada vecino que comparte el gusto. Son **26 líneas** (8 de asado y 18 de lluvia), en español.
  - **Alcance nuevo:** no estaba en la lista de trabajo. Entra en la F4, junto con el resto de los textos.
  - **A confirmar:** quién las escribe. Propuesta mía: las borrador yo, en la voz de cada vecino, y vos las corregís (esto cambia lo decidido de que los textos los escribís vos).
  - Se suman a la deuda del inglés.
- **Pendiente menor:** el tope del abrigo (±1 punto o un porcentaje), que se resuelve al leer cómo calcula hoy el abrigo, en la F3.

Con esto **la F0 está cerrada**. Lo que sigue es la F1 (datos, reglas y pruebas), que arranca cuando des el OK, y la pista de textos, que ya puede empezar con la plantilla.

## 18. F1 hecha (14-10-2026): datos, reglas y pruebas

Con el visto bueno para seguir, se hizo la F1. Es **código puro, sin enchufar al juego** (no registra su sección ni toca `main.js`). Vive por ahora en la carpeta de
trabajo de la 3.9.1, **sin commitear**, junto al borrador del que salió; cuando exista la rama de la 4.1 se mueve ahí.

- `src/creador-catalogo.js`: las diez personalizaciones y las 32 opciones de carácter como datos, con sus efectos en los cuatro sistemas, los topes, y la tabla de
  gustos de los vecinos. Los colores de lana conservan los ids de «Tu personaje», así lo ya elegido pasa tal cual.
- `src/creador-personaje.js`: el genoma (versión 2), el saneo, la traducción al motor de cuerpos, los efectos brutos y aplicados con tope, la afinidad y el afecto con un
  vecino, la ficha (`resumenDeBruno`) y la precarga desde las partidas viejas.
- `pruebas/verificar-4-1-creador.mjs`: **338 verificaciones, en verde.** Recorre las **56 250 combinaciones** de rasgos.
- **Verificado además dibujando:** las seis variantes de ejemplo salen bien con el motor de cuerpos real (estudio de personajes).
- **Cambios que la F1 trajo al catálogo** (para que cierre el balance): Ahorrativo pasó de sabor a **+1 punto de abrigo** y Dormilón de sabor a **−2 cuaderno**. Así toda
  virtud y todo defecto llevan efecto y ninguna combinación regala un pro sin su contra. Abrigo queda con 5 pros y 5 contras; los otros tres, con 4 y 4 o 4 y 5.
- **Tintes:** al crear, sólo los que no piden anotación (crudo, gris, marrón, negro, ocre, musgo). Rojo notro, violeta calafate y azul maqui se consiguen jugando (guardarropa).

### Hallazgo: con el tope simétrico, el 9,9 % de las combinaciones sale ganando

Medido sobre las 56 250 combinaciones. El tope de ±4 pasos recorta también las **contras**: quien apila contras en un mismo sistema (el abrigo llega a −10 pasos en bruto
y se recorta a −2) paga menos de lo que debería, y con los pros repartidos en otros sistemas termina con una **ganancia neta** de hasta +4 pasos. Comparación de tres reglas:

| Regla | Neto entre los cuatro sistemas | Combinaciones con ganancia | Lo peor en un sistema |
|---|---|---|---|
| A. Simétrico (lo decidido) | de −4 a +4 | 9,9 % | abrigo −2, afecto −4, pesca −4, cuaderno −4 |
| B. Tope sólo arriba | de −4 a 0 | 0 % | abrigo −10, afecto −6, pesca −6, cuaderno −8 |
| C. Tope arriba y piso hondo (−8, abrigo −4) | de −4 a +2 | 1,0 % | abrigo −4, afecto −6, pesca −6, cuaderno −8 |

**A decidir:** qué regla. Promedios por sistema sobre todas las combinaciones: abrigo −0,27, afecto −0,07, pesca +0,13, cuaderno −0,47 (todos cerca de cero).

**Decidido el 14-10: A, el tope simétrico se queda** (±20 %, el abrigo ±1 punto). Se acepta que el 9,9 % de las combinaciones salga con ganancia neta (hasta +4 pasos): apilar
contras en un solo sistema sale algo más barato. Consecuencias:
- La prueba lo deja **acotado**: falla si las combinaciones con ganancia pasan del 12 % o si la suma aplicada sale de −4 a +4 pasos. Así un cambio del catálogo no empeora el
  número en silencio.
- La **ficha avisa cuando un sistema está al tope**, tanto arriba como abajo (`sistemasAlTope` ya cuenta los dos lados).
- Si en la partida jugada de la F5 se nota abuso, la regla C (tope arriba y piso hondo) es el cambio de una línea, con los números ya medidos en esta sección.

## 19. F2, primera parte (14-10-2026): lo verificado en el código y un prototipo de la pantalla

La F2 es la que toca el juego de verdad (`main.js`, el cuaderno, la construcción). Antes de enchufar nada se **leyó el código** de cada punto que el plan dejó como «a verificar», y se
hizo un **prototipo de la pantalla de creación** fuera del juego, para ver cómo queda. **No se tocó `main.js` ni ningún archivo del juego.**

### Verificado en el código (cambia o confirma el plan)

1. **Dónde engancha la pantalla.** La portada (`#inicio`) tiene el botón «Entrar al bosque» (`btn-entrar`) y ya tiene un botón «Personalizar». La partida se carga al abrir el juego
   (`progreso`) y `partidaEmpezada()` dice si ya hay una. **Se engancha interceptando «Entrar al bosque»** cuando Bruno todavía no está creado: sirve para partidas nuevas y viejas, y
   ocurre antes de entrar, así que no corta una noche del Desafío.
2. **Dónde se guarda.** `registrarSeccion` (`personalizacion.js`) ya guarda cada sección en `progreso.personal.<id>` y la sanea al cargar. **El genoma se registra como la sección `bruno`** y no
   hace falta tocar el guardado. El módulo de la F1 ya tiene la forma que pide (`porDefecto` y `sanear`).
3. **El cuerpo del jugador.** `personal-personaje-mundo.js` arma el cuerpo con el mismo motor, pasándole un aspecto. Se reemplaza por `aspectoDeGenoma(genoma)`. El estudio ya demuestra que
   el motor acepta ese aspecto; falta verlo dentro del juego.
4. **La ficha NO va como sección de las entradas del cuaderno** (esto **corrige el riesgo 5**). `main.js`, la lámina y `aldea.js` cuentan **todas** las entradas para el «X de N anotaciones» y
   para la lámina; una entrada fija de Bruno **alteraría esos totales**. El cuaderno tiene **pestañas** (Especies y lugares, Álbum de fotos, Diario, Oficios y aldea, Recetario, Noticias,
   Bestiario). **La ficha va como pestaña nueva, «Bruno», la primera.** Cambia lo decidido de «sección» a «pestaña»; el espíritu es el mismo (primera página de sólo lectura).
5. **El espejo.** Una pieza de `construccion.js` tiene: `id`, `nombre`, `radio`, `categoria`, `soloRelax`, `funciones`, `texto`, `pide` (materiales), `fisica` y `arma` (la geometría). Lo que
   hace al usarla se resuelve en `main.js` por su función (dos `switch`: el cartel y la acción). **Pendiente de verificar:** que `pide` vacío (sin costo) esté permitido, que se pueda tener
   más de una, y cómo se define lo que trae un refugio nuevo (para que ya venga con un espejo colocado).

### El prototipo de la pantalla (hecho, fuera del juego)

- **Archivos:** `pruebas/estudio/creador-pantalla.js` (la pantalla) y `pruebas/visor-creador-pantalla.cjs` (saca las capturas). Usa el motor de cuerpos real y el genoma de la F1.
- **Qué muestra:** la figura de Bruno girando con luz de atardecer a la izquierda y el panel de papel a la derecha, en las **dos pantallas del plan** (1: su aspecto; 2: su historia). Los
  cambios se ven en vivo en la figura. En la pantalla 2, una tarjeta a la izquierda con los **pros y contras en texto, sin números**, y una barra por sistema, con el aviso «ya está al máximo»
  o «ya no empeora más» cuando el tope recorta algo. Botones: Volver, Al azar, Siguiente y Empezar.
- **Qué NO tiene todavía:** las fuentes y estilos del juego, la letra grande y el resto de la accesibilidad, el manejo con el teclado, los textos definitivos (los de los pros y contras son
  provisorios), el guardado, el prólogo y la creación en las partidas viejas. «Empezar» no hace nada.
- **Qué no se midió:** cuánto tarda rearmar la figura en cada clic en la placa integrada. Hay que medirlo antes de dar la pantalla por buena.

## 20. F2, segunda parte (14-10-2026): Bruno ya vive en el juego

Primer enchufe real al juego, en una **carpeta de trabajo aparte**: `trabajo/t41-creador`, rama local **`creador-bruno`** sacada de la de la cantina (la de la 3.9.1, que tiene 54 commits sin subir).
**Nada está commiteado ni subido.** Ahí van los módulos de la F1 y el prototipo de la pantalla, copiados desde la carpeta donde nacieron.

### Qué se hizo

- **Sección nueva «Bruno» en Personalizar** (`src/personal-bruno.js`, registrada en `personal-todo.js`): guarda el genoma y la bandera `creado` en `progreso.personal.bruno`. Sale antes que «Tu personaje».
- **El cuerpo del jugador y la mano en primera persona usan a Bruno** cuando `creado` es verdadero (`personal-personaje-mundo.js` y dos líneas de `main.js`). Si no, todo sigue como siempre.
- **Una partida nueva no se lleva al Bruno de la vieja** (`personal-partida.js`): cada partida, el suyo. Lo demás de lo personal sí pasa.
- **El cuerpo no se rearma si no cambió nada** (antes lo rearmaba cada vez que se tocaba cualquier sección; ahora dos secciones lo piden y se evita el doble trabajo).
- **Reparto sin duplicar elecciones** (decisión mía, a confirmar): de **Bruno** salen cara, ojos, piel, pelo, peinado, barba, contextura, estatura y anteojos; de **«Tu personaje»** sale la ropa de abrigo
  (campera, poncho, gorro, bufanda, guantes y botas), o sea el guardarropa que se desbloquea jugando. El panel de Bruno tiene un botón **temporal** (hasta que exista el espejo) que abrirá la pantalla de creación.

### Verificado

- **Pruebas:** `verificar-4-1-bruno-seccion.mjs` (52 verificaciones, nueva) y las **207 pruebas de Node del proyecto, todas verdes**. Una (3.7.0) fijaba el texto exacto de la línea que cambié a propósito; se actualizó para exigir las dos rutas
  (con Bruno creado y sin crear).
- **Juego real:** `humo-2-8.cjs` (Personalizar con el juego de verdad, recarga y partida nueva) pasa, sin avisos rotos.
- **Mirándolo:** `pruebas/visor-bruno-en-juego.cjs` pone a cuatro Brunos distintos dentro del valle con la ropa de «Tu personaje» (gorro y bufanda, poncho y botas de goma, sin abrigo, y de cerca). Se ven bien.

### Lo que falta (y no se hizo)

1. **Choque con «Tu personaje»:** esa sección todavía muestra los controles de piel, pelo, peinado y contextura. **Con Bruno creado el cuerpo los ignora**, o sea que el jugador puede tocarlos sin que pase nada. Hay que ocultarlos.
2. **La ropa de la creación:** el genoma tiene `campera` y `accesorio`, pero hoy **no se pasan** a «Tu personaje» (campera, gorro y bufanda). Al crear a Bruno hay que sembrarlos ahí, para que lo que elija se vea.
3. La **pantalla de creación en el juego** (hoy es un prototipo fuera del juego), enganchada a «Entrar al bosque», con el botón temporal y la creación obligatoria en las partidas viejas sin repetir el prólogo.
4. La **pestaña «Bruno» del cuaderno**, el **espejo**, el **retrato** guardado, los **efectos**, el **prólogo**.
5. En las capturas con el campo de ropa `campera: 'indigo'` el juego usó el color de fábrica sin avisar: el id correcto en el juego es `maqui`. No es un bug del código (se sanea), pero conviene recordarlo al armar los textos y las pruebas.
6. **No verifiqué** cómo se ve la mano en primera persona con la piel de Bruno, ni medí el costo de rearmar el cuerpo en la placa integrada.

## 21. F2, tercera parte (14-10-2026): la pantalla de creación ya está dentro del juego

Siempre en `trabajo/t41-creador` (rama local `creador-bruno`). **Nada commiteado ni subido.**

### Qué se hizo

- **`src/creador-pantalla.js`:** la pantalla de creación como capa a pantalla completa, con su propio dibujante 3D que se libera al cerrar. Dos pantallas (aspecto e historia), tarjeta de pros y contras en la pantalla 2 (texto sin números, con la barra
  por sistema y los avisos de tope). Dos modos: **crear** (las dos pantallas, obligatoria) y **rehacer** (sólo el aspecto; sin carácter ni ropa de abrigo; con Cancelar).
- **Enganche en «Entrar al bosque»:** si Bruno todavía no fue creado, el botón abre la pantalla en vez de entrar, y al terminar entra solo. Vale para partidas nuevas y viejas, y ocurre antes de entrar al juego.
  Mientras está abierta atrapa las teclas del juego (sólo los botones se mueven con Tab/Enter/Espacio); Escape cancela sólo al rehacer.
- **Se parte de lo que ya había elegido** en «Tu personaje» (`genomaDesdePersonajeViejo`): una partida vieja no rehace desde cero.
- **La campera y el accesorio** (gorro o bufanda) que elige al crear **pasan a «Tu personaje»** (el guardarropa); al rehacer no se toca la ropa.
- **«Tu personaje»** ya no muestra piel, pelo, peinado ni contextura cuando Bruno está creado (avisa que se rehacen en el espejo); conserva campera, poncho, gorro, bufanda, guantes y botas.
- **Depuración:** en `?debug=1` la creación se salta (así siguen andando las 115 pruebas viejas que entran por «Entrar al bosque»); con `&creador=1` se prueba.

### Verificado

- **Humo nuevo `pruebas/humo-4-1-creador.cjs`: 43 de 43 en el juego real.** Entrar abre la pantalla; se eligen las diez personalizaciones en las dos pantallas; «Empezar» entra solo; todo queda guardado y sigue igual al recargar; con Bruno creado «Entrar» no pide nada;
  rehacer abre sólo el aspecto, cancelar no cambia nada y «Listo» cambia sólo el aspecto; la pantalla se cierra del todo y el juego vuelve a recibir las teclas; sin errores en la página.
- **Pruebas de Node:** las **207 pasan** (incluida la de release, que revisa la sintaxis de todos los archivos). La prueba nueva de Bruno en Personalizar pasó a **68 verificaciones** con las del enganche.
- **Humo viejo de Personalizar (`humo-2-8.cjs`)** sigue pasando.
- Se miraron las capturas de la pantalla dentro del juego (aspecto, historia y rehacer): se ve igual que el prototipo.

### Lo que sigue siendo provisorio o falta

1. **El espejo** (la pieza de construcción): hoy se rehace desde un botón temporal en el panel de Bruno. El camino definitivo todavía no existe.
2. **Mando:** la pantalla no se puede completar con mando (sin cambios: era la decisión; sigue siendo la deuda con fecha de antes de Steam). Tampoco tiene todavía la letra grande ni el resto de los ajustes de accesibilidad.
3. **Los textos** de los pros y contras son provisorios.
4. **No se midió** cuánto cuesta rearmar la figura en cada clic en la placa integrada, ni cuánto pesa tener un segundo dibujante 3D abierto sobre el juego (se libera al cerrar; no está probado que no deje memoria).
5. **La pantalla de la portada** (el aspecto de «Entrar al bosque» antes de crear): la creación aparece al apretar el botón. Una opción más cuidada es mostrar el nombre de Bruno en la portada. No decidido.
6. **El prólogo** (las escenas de texto antes de la llegada), la **pestaña «Bruno» del cuaderno**, el **retrato**, los **efectos** y el **guardarropa** como tal siguen sin hacerse.
7. En partidas viejas, **el jugador que ya estaba en medio de una noche del Desafío** no ve la pantalla hasta que vuelve a la portada (por diseño: aparece antes de entrar, no en medio).

## 22. F2, cuarta parte (14-10-2026): la ficha en el cuaderno y el retrato

Siempre en `trabajo/t41-creador` (rama local `creador-bruno`). **Nada commiteado ni subido.**

### Qué se hizo

- **Pestaña «Bruno» en el cuaderno**, la primera, de sólo lectura (`src/creador-ficha.js`, enganchada en `main.js`): nombre, edad, retrato, presentación, los seis datos de carácter, y los pros y contras en texto sin números, con avisos
  cuando un sistema llegó al tope. No suma ni resta anotaciones (sigue «1 de 290 anotaciones»; verificado en el juego real). En La noche de los duendes avisa que los rasgos sólo valen en el Relax.
- **Retrato guardado:** al terminar la creación (y cada vez que se rehace) se saca una foto chica de la cara (240 × 300, JPEG) y se guarda en la partida. En el juego real pesó **unos 17 mil caracteres**; el tope de lo que se acepta al cargar es 60 mil y todo lo que
  no sea un JPEG como texto se descarta al sanear. Sin retrato (partidas anteriores) la ficha se ve igual.
- **Los textos de los pros y contras viven en un solo lugar** (`src/creador-textos.js`): la pantalla de creación y la ficha usan la misma función. Cuando el autor escriba los definitivos, se cambia ahí.
- **Una regla del proyecto que no conocía:** el modo se llama **«La noche de los duendes»** en todo lo que se ve (`verificar-3-8-textos.mjs` lo exige). Mi primer texto decía «Desafío»; esa prueba lo detectó y se corrigió. **En los documentos de planificación sigo escribiendo «Desafío»**, que es el nombre interno.

### Verificado

- `verificar-4-1-ficha.mjs` (65 verificaciones, nueva), `verificar-4-1-bruno-seccion.mjs` (68) y `verificar-4-1-creador.mjs` (340).
- **Humo en el juego real `humo-4-1-creador.cjs`:** ahora cubre el retrato (se guarda; rehacer lo renueva), la pestaña Bruno como primera, el contenido de la ficha, el retrato visible, el contador de anotaciones sin cambios y que las otras pestañas siguen andando.
- Se miró la captura de la hoja dentro del juego: se ve bien. La columna de la derecha **se desplaza** cuando la lista de pros y contras es larga (como el resto del cuaderno).

### Pendiente

El **espejo** (la pieza de construcción) sigue sin hacerse: el aspecto se rehace desde un botón temporal del panel de Bruno. Después, el prólogo, los efectos, el guardarropa, y las deudas de antes (mando, medición en la placa integrada).

## 23. F2, quinta parte (14-10-2026): el espejo

Siempre en `trabajo/t41-creador` (rama local `creador-bruno`). **Nada commiteado ni subido.** Con esto la F2 queda **completa** salvo el mando, las medidas en la placa integrada y el prólogo (que es de la F4).

### Qué se hizo

- **Pieza «Espejo de pie»** (`src/planos-espejo.js`, sumada a `construccion.js` con una línea como la cocina y los muebles): mobiliario, sólo del Relax, **cuesta cero** (`pide` vacío), sin tope de cuántos se arman y sin pedir nada del progreso. Se usa con E (**«Mirarte al espejo»**) y abre la
  pantalla de creación en **modo rehacer**: cara, ojos, piel, pelo, barba y físico; el carácter y la ropa de abrigo no se tocan.
- **Cada refugio trae el suyo.** Al **crear** a Bruno (no al rehacer, no en La noche de los duendes) se coloca un espejo armado cerca del refugio, probando lugares alrededor (3 a 6 m) hasta que uno sirva. Una sola vez por partida: si después se desmonta, no vuelve solo (el plano es gratis y siempre está).
  Se devuelve el plano que el jugador tuviera elegido.
- **Respaldo en el panel de Bruno:** con un espejo armado, el panel lo dice y **no hay botón**; **sin ningún espejo armado** vuelve el botón «Rehacer a Bruno» con el aviso de dónde armar uno gratis. Las tres reglas de la sección 11 (sin costo, siempre en el plano, viene con el refugio) quedan cumplidas y verificadas.

### Verificado

- **Pruebas de Node:** las **209 pasan**. Nueva `verificar-4-1-espejo.mjs`: 43 verificaciones (la pieza gratis y sin tope, la geometría real con el constructor, la colisión, el guardado, las tres variantes del panel con un DOM mínimo y la conexión en `main.js`).
- **Juego real:** `humo-4-1-creador.cjs` ahora cubre el espejo de fábrica (uno solo, terminado, a 4,2 m del refugio), que **sobrevive a recargar**, que usarlo abre el modo rehacer, el panel con y sin espejo, y que el de fábrica no vuelve solo. `humo-2-8.cjs` (Personalizar de antes) sigue pasando.
- **Mirándolo:** capturas del espejo dentro del juego (de lejos, de cerca y de costado). Se ve como un espejo de pie con marco de madera, apoyado contra la pared del refugio.

### Dos errores que se encontraron al probar (ya corregidos)

1. **El espejo de fábrica no se guardaba:** lo que se construye por código no se copia a la lista de obras que se guarda (`progreso.obras`), así que **desaparecía al recargar**. El humo lo detectó y ahora hay una verificación de eso.
2. **La pieza declaraba 1,9 m y medía 2,04:** la moldura de arriba se pasaba. Se corrigió el alto declarado (2,05 m) para que el sistema de colocación vea el tamaño real.

### Lo que no se hizo

- **El espejo no refleja nada:** el vidrio es un panel de color. Un reflejo real de Bruno sería una cámara más por cuadro y no entra en esta versión.
- **El inglés** de la pieza (nombre y texto) no está, igual que el resto de lo nuevo (deuda anotada).
- **No se probó** con el mando ni con la Steam Deck.
- **No se verificó** que el lugar elegido para el espejo de fábrica sea siempre cómodo (por ejemplo, que no quede detrás de un banco). Se ve bien en la partida de prueba; en otros mundos con otro refugio puede quedar a un costado de la puerta o en la parte de atrás.
