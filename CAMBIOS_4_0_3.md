# 4.0.3 — segunda ronda de bugs (informes de las zonas E, F, G, H e I)

Rama `bugs-4-0-3` (sale de `v392-mejoras` 4.0.2; sin push, sin tocar `main` ni `v392-mejoras`). Sin contenido nuevo y **sin textos en inglés** (el inglés se hace al final; los textos nuevos van en la lista de abajo).
Los informes de cinco revisores (lectura) están en `Documents\Hojarasca\trabajo\bugs2\zona-E.md` a `zona-I.md`. Cada hallazgo se reprodujo o se confirmó antes de tocarlo; lo que no se pudo, se dice.
Gate: `npm run verify` da **240 pasos OK** (antes 228) y `node pruebas/humo-caos.cjs` da 934 pasos sin errores. Nada se quitó del juego. No se tocó el sistema de sombras ni el terreno.

## Estado de cada hallazgo

Leyenda: **arreglado** (con prueba que ejecuta el comportamiento) · **arreglado (texto)** (el arreglo está y la prueba sólo mira el código; el recorrido en el juego no se vio) · **parcial** · **pospuesto** (motivo) · **no se confirmó**.

### Los ALTOS y el arreglo mal hecho

| # | Estado |
|---|---|
| G1 | **arreglado.** Con mando solo se empieza: la portada, la creación de Bruno (las dos pantallas), el prólogo y entrar al juego. Cruceta (por posición en pantalla) y LB/RB (anterior y siguiente) mueven un marco amarillo, A aprieta, B vuelve (el botón «Volver» o «Cancelar»), Start salta el prólogo o cancela. Probado en Electron con un mando simulado (`humo-4-0-3-mando.cjs`) y en Node (`verificar-4-0-3-mando-menu.mjs`). El creador ya no manda el foco a «Siguiente» después de elegir una opción (también arregla al teclado) |
| G2 | **arreglado.** Taller (K): la cruceta/LB/RB marcan la receta, A fabrica, B sale, la cruceta ← → o pasar el final cambia de categoría. Planos (O): ← → plano, ↑ ↓ categoría, LB/RB giran, A construye o confirma, X mueve una pieza, Y alterna el encastre, Ver deshace la etapa, R2 cancela la marca o el movimiento, L2 apretado + R3 desmonta, B cierra. Probado en Electron (se funda un plano de verdad con A). Ver «Decisiones» y «Preguntas» |
| H1 | **arreglado.** `margenBajar` 0,7 → **0,85** (el valor del revisor). Con 0,85 pasan todos los escenarios de `verificar-3-2-fluidez.mjs` (el «borde» de 5,5 ms a 144 Hz sigue sin oscilar; con 0,9 ese caso fallaba) y, nuevo, vuelve a 60 fps después de un episodio pesado cuando lo normal es ≤ 13 ms (antes se quedaba en 30 para siempre) |
| F1 | **arreglado.** `soltar` estaba duplicada en `trochita.js`: la de la varada del Desafío (2.3) pisaba a la de la caída (4.0.1 D2), así que caer arriba de la trochita no te bajaba. La de la varada pasó a `soltarVarada` (`desafio.js` la llama así). La prueba (`verificar-4-0-3-trochita.mjs`) **ejecuta de verdad** las dos funciones sobre la trochita real del valle y además falla si queda una función repetida en el ámbito |

### Zona G — interfaz y mando (19)

| # | Estado |
|---|---|
| G3 | **arreglado.** La corrida sin fin se maneja con el mando (miraba el panel de la victoria, oculto) y tiene foco inicial en «Otra corrida». Probado en Electron |
| G4 | **arreglado de otra forma.** No hay un botón libre para el cuaderno: se llega por la pausa (Start → cruceta → «Abrir el cuaderno» → A) y adentro se recorre con la cruceta. Probado en Electron. Pregunta abajo |
| G5 | **arreglado.** «El bosque», «Efectos» y «Música» se aplican en el momento (en la pausa no se oían). Probado en Electron (`humo-4-0-3-ajustes.cjs`) |
| G6 | **arreglado.** La Exposición del modo foto cambia la imagen (con posproceso y sin él; probado por brillo de la captura) y, con calidad Mínima o Baja, brillo, viñeta y grano quedan apagados en el panel («Necesita calidad Media o Alta») en vez de ofrecerse sin hacer nada |
| G7 | **arreglado.** F2 con la Billetera, el estado de la base, logros, carreras, controles o créditos abiertos los tapa; al salir ya no queda la pausa dibujada sobre el juego. Probado en Electron |
| G8 | **pospuesto.** Mando sin mapeo estándar (volante, joystick de vuelo): necesita hardware; no hay una forma conservadora de distinguir un gatillo en reposo de un stick |
| G9 | **arreglado.** «Duración del día» tiene el botón de **30 minutos** (el de fábrica, antes sin marcar y sin forma de volver). Probado en Electron. Texto nuevo sin inglés |
| G10 | **parcial.** El cartel de la tecla E dice el botón (X) con un mando enchufado. Siguen con teclas del teclado las pistas y la guía del primer día (G13 es lo mismo). Arreglado (texto) |
| G11 | ya estaba en 4.0.2 (B7). |
| G12 | **arreglado.** Los consejos de primera vez no se «gastan» con el HUD escondido (modo foto, banco de pruebas). Probado en Electron |
| G13, G15, G16, G17, G18, G19 | **pospuesto** (bajos): la guía con las teclas del jugador, el clic en el lienzo durante el banco, la chinche que no se suelta, la vibración al primer aparato, el tamaño mínimo de la ventana y las claves del diccionario (inglés al final) |
| G14 | **arreglado.** El banco lanzado desde la portada la esconde mientras mide y la devuelve con el informe. Probado en Electron |

**Pantallas sin mando (la lista de 26 del informe):** la navegación general (cruceta, LB/RB, A, B, Start; las barras con ← →) funciona en cualquier panel `section.velo` y en la portada, así que cubre en principio las 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 18 y 23. **Probado uno por uno:** portada, creador, prólogo, pausa, una barra de ajustes, cuaderno y corrida. El resto debería andar por ser el mismo mecanismo, pero no se recorrió. **Siguen sin mando:** 15 (el banco en marcha no se corta con Start/B), 17 (mover la cámara del modo foto con el stick), 19 (poner chinches en el mapa), 20 (asignar de la mochila a la barra), 24 (A3: el banco del pueblo y las cartas de cantina y casa de té), 25 (escribir el nombre de una obra), 26 (el aviso «Hojarasca encontró un problema»).

### Zona H — rendimiento (11)

| # | Estado |
|---|---|
| H2 | **arreglado.** El presupuesto adaptativo bajaba de nivel sólo con cuadros *más cortos* que el objetivo, que con el ritmo por vsync no existen: un tirón de 140 ms lo dejaba en L1/L3 para siempre (y las sombras a 3 por segundo). Ahora baja con 1,5 s de cuadros que llegan al objetivo, y si vuelve a subir enseguida la próxima espera se duplica (no oscila). Probado con los módulos reales |
| H3 | **arreglado.** `colisiones.resolver` descarta por caja antes de la cuenta fina (las puertas se probaban todas, de cada cuerpo, en cada cuadro). La prueba compara el módulo con **la misma fuente sin el descarte**: resultado idéntico en 6000 cuerpos y 2,4 veces más rápido con 80 puertas |
| H4 | **arreglado.** La calidad automática ordenaba la ventana de 180 muestras en cada cuadro aunque no tuviera nada para decidir. Ahora el peor 5 % sólo se calcula si hace falta; las decisiones son las mismas (la prueba de autocalidad sigue igual). No se midió el ahorro en el juego |
| H6 | **arreglado.** Si el montaje de la aldea pedía turno en todos los cuadros, las sombras (que piden al final) no llegaban nunca. Ahora una tarea que lleva más de 0,3 s esperando le gana el turno a la que no, y sigue valiendo «una pesada por cuadro». Probado (en 120 cuadros las sombras tuvieron 6 turnos, antes 0, y la aldea siguió avanzando). No cambia cómo se dibujan las sombras |
| H5, H7, H8, H9, H10, H11 | **pospuesto** (cobertura de herramientas de soak, copia a la carpeta sincronizada, fuente del Worker, mochila por cuadro, asignaciones chicas, compilación de los rayos de sol): bajos, sin medir en el juego |
| H12–H14 | constancias del informe, no piden arreglo |

### Zona F — mundo vivo (12)

| # | Estado |
|---|---|
| F2 | **arreglado.** En el Desafío, el deslizador de hora del modo foto ya no dispara la oleada ni el amanecer («Resististe la noche N»). Probado en Electron: con el arreglo el estado del Desafío no cambia; **sin** él, a las 21:00 empezaba la oleada y al volver a las 10:00 sumaba una noche |
| F3 | **arreglado (texto).** El modo foto con la hora del deslizador no termina la minga ni tapa la vía (`fiestasJuego.actualizar` no corre con el modo foto), ni entrega el correo. No se corrió un día de minga: sólo se mira el código |
| F4 | **arreglado.** Talar el árbol de un carpintero o del panal: el pájaro se muda a un árbol en pie (o se esconde si no queda ninguno) y no huye hacia uno talado; el panal y sus abejas se van y su cilindro de colisión se retira |
| F5 | **arreglado.** La gallina perseguida se queda a 4,2 m del gallinero (llegaba a ~97 m) |
| F10 | **arreglado (texto).** Los zorros reaparecen a más de 190 m (se los ve hasta los 180) |
| F6, F7, F8, F9, F11, F12 | **pospuesto**: el pronóstico por día contra la estación que cambia a media jornada, la estación en «auto» al cargar, el diario que dice «Siguió lloviendo», las lagartijas, los primeros sonidos sintetizados en pleno cuadro y el trueno sin relámpago (F12: ¿quitarlo o conectarlo al destello? es una pregunta) |

### Zona E — aldea y vecinos (9)

| # | Estado |
|---|---|
| E1 | **arreglado.** La noche de estrellas del sábado ya no lleva a los dos músicos de la peña (antes faltaba la guitarra en 53 de 200 sábados, el bombo en 36), ni a los parroquianos de esa noche, y el club y las estrellas ya no nombran a Lucrecia ni a Dalia. Y con lluvia o nieve no sale nadie a la plaza ni Valentina baja el telescopio. Probado con los módulos reales (400 días; sin el arreglo, 22 de 57 sábados llevaban a un músico) |
| E2 | **arreglado.** `invitar()` pasa el día a la obligación: ya no acepta a quien festeja su cumpleaños ni a quien ya está sentado en la cantina (aceptaba y a los 0,5 s la cita se cancelaba). La casa de té abierta también mira el día |
| E3 | **arreglado.** Las fiestas no llevan al predio al chico que estudia afuera ni al poblador que espera en el andén. Probado con `crearFiestasJuego` real (sin el filtro, los dos tenían mesa en el predio) |
| E4–E9 | **pospuesto** (bajos): invitar con alguien «conVos», radio de Julia en la plaza, avisos que se repiten al recargar, charlas de infancia de los jóvenes, «Chela y Rubén te sigue», los que cubre el horario no entran con lluvia |

### Zona I — estructuras (14 + 2 viejos)

| # | Estado |
|---|---|
| I-1 | **arreglado (sólo Relax).** La casa de galería del molino 4.0, su campo de tulipanes con el cerco y el cauce del arroyo reservan lugar: no se funda encima (antes se aceptaban 101 de 120 pruebas encima; ahora 0). No muda las obras que ya había ahí. En el Desafío sigue como estaba (pregunta) |
| I-2 | **arreglado en lo que corresponde.** Cuerpo para el fuerte del bosque (14 palos; la abertura queda libre), el retablo, el atril, tu talla, el cerco de la huerta de todos (con la tranquera abierta), los palos de los arcos del potrero y el puesto de la feria (mesa y cuatro palos, sólo los días de feria). **Sin cuerpo a propósito:** los canteros bajos, los duendes tallados, el fogón, la carpa y los títeres (chicos o bajos: estorbarían más de lo que ayudan). Probado con el valle real, la aldea y los rincones montados, y un caminante: por la abertura se entra al fuerte, de costado no |
| I-3 | **pospuesto** (cosmético): las veredas con pendiente |
| II-1 | **arreglado.** Al retirar con Supr una marca que ya tenía etapas pagadas, el terreno y la mano de obra vuelven a la billetera (el cartel ya decía «no se gastaron materiales»). Probado con las obras y la economía reales. Pregunta abajo |
| II-2 | **arreglado.** La escalera de la torre de vigía se sube por todo su ancho (antes sólo por x ≥ 1,56 de 1,16–1,88). El piso de arriba se parte en dos: el grueso y una franja de 35 cm del lado de la escalera `sinTecho`; la malla no cambió. Probado: se llega arriba subiendo por todos los x, el piso es parejo de lado a lado y no se atraviesa desde abajo |
| II-3 | **arreglado.** El despertar después de caer en el Desafío elige un lado del catre con lugar y dentro del cuarto (hasta 2,3 m, y cualquier lugar libre del cuarto si el catre lo ocupa casi todo). En el arnés de la zona (cama de tablas y litera en un cuarto de 3 × 3) el respawn caía fuera en 24 de 48 colocaciones; ahora 0 (en las 288 del informe, de 92 a 0) |
| II-4 | **arreglado.** La planta baja bajo un entrepiso ya cuenta como techada («habitación cerrada», confort, dormir en el catre) y el piso de arriba también cubre de la lluvia. Probado con una casa de dos niveles |
| II-5, II-6, II-7, II-8, II-9, II-10 | **pospuesto** (bajos): colisiones desfasadas de leña, horno, contrafuerte, catapulta y acopio, muebles que se apilan, huellas infladas como volumen de tiro, agua de 9 puntos, cuadros colgados en el aire, desmontar la pieza del piso de arriba |
| II-11 | **arreglado.** «Cortinas desmontadas», «Torre de vigía desmontada», «Estación meteorológica desmontada» (plurales y femeninos sin «a»); probado con las 146 obras |
| A-1 (D10), A-2 (D13) | **pospuesto** (siguen abiertos de la ronda anterior) |

## Pruebas agregadas (en el gate: 240 pasos OK, antes 228)

- `verificar-4-0-3-rendimiento.mjs` — H1 (3 costos normales y el borde), H2 (tirón, 30 s a 49 fps, 40 fps sostenidos, rebote), H4, H6 (con la tarea que dejó de pedir).
- `verificar-4-0-3-trochita.mjs` — F1, ejecutando las dos funciones sobre la trochita real.
- `verificar-4-0-3-mando-menu.mjs` — la cruceta por posición (columna, grilla, panel del creador, vuelta), las barras, la cruceta real de `mando.js` y el enchufe en `main.js`.
- `verificar-4-0-3-foto.mjs` — el panel del modo foto sin posproceso y los enchufes de F2, F3, G6 y G7.
- `verificar-4-0-3-obras.mjs` — II-1 (las tres casas: pagar, deshacer, retirar la marca, billetera igual) y II-4.
- `verificar-4-0-3-estructuras.mjs` — II-2 (21 subidas) y II-3 (24 colocaciones).
- `verificar-4-0-3-molino.mjs` — I-1 en el valle real.
- `verificar-4-0-3-cuerpos.mjs` — I-2 en el valle real con los rincones y la aldea montados.
- `verificar-4-0-3-aldea.mjs` — E1, E2 y E3 (78 verificaciones).
- `verificar-4-0-3-fauna.mjs` — F4 (carpinteros y panal), F5 y F10.
- `verificar-4-0-3-colisiones.mjs` — H3, contra la misma fuente sin el descarte.
- `verificar-4-0-3-textos.mjs` — II-11.
- Ajustes de pruebas viejas que miraban texto cambiado a propósito: `verificar-optimizacion-antitirones-rc24` (sin cambio al final), `verificar-3-8-3-base`, `verificar-3-8-6-base`, `verificar-3-5-1-desafio`, `verificar-3-8-4-desafio`, `verificar-correo`, `verificar-feria`, `verificar-4-0-1-nucleo` (cada una, lo mínimo).
- Partidas reales en Electron (no están en el gate, como las otras `humo-*`): `humo-4-0-3-mando.cjs` (con un `navigator.getGamepads` falso: portada → creador → prólogo → juego, la pausa y el cuaderno, una barra, el taller K, los planos O y el fin de la corrida), `humo-4-0-3-foto.cjs` (F2, G6, G7) y `humo-4-0-3-ajustes.cjs` (G5, G9, G12, G14). Las tres dan «TODO OK». Capturas a tamaño completo en `pruebas/salidas/humo-mando-403/` (el marco amarillo se ve en la portada y en el creador).
- Arneses nuevos reutilizables: `ayuda-4-0-3-valle.mjs` (el valle de verdad con la aldea y la trochita en una vm) y `ayuda-4-0-3-caminante.mjs` (un caminante que replica a `jugador.js`).
- `humo-3-7-5-rincones.cjs` y `humo-3-7-5-fiestas.cjs` **fallan igual en 4.0.2** (comprobado en esta rama con la fuente de 4.0.2): no es una regresión, son guiones viejos.

## Decisiones tomadas sin consultar

1. **H1: 0,85** (no 0,9: rompe el caso del borde; no 0,8: el revisor sólo verificó 0,85). El ritmo puede quedarse más tiempo en 60 en una máquina justa; lo que protege contra el rebote es la espera doble que ya existía.
2. **H2:** bajar de nivel con cuadros que llegan al objetivo (≤ 106 %), 1,5 s; si vuelve a subir en menos de 12 s la espera se duplica (hasta 48 s).
3. **H6:** no se dio un cupo extra a la tarea hambrienta (la prueba de la 3.5 exige «nunca dos pesadas en el mismo cuadro»): la que lleva más tiempo esperando le gana el cupo a la que acaba de pedir.
4. **El mando en los menús** es nuevo y de diseño propio: cruceta por posición, LB/RB en orden, A, B, Start, ← → en las barras, marco amarillo (clase `foco-mando`, sólo se ve con el mando). Es lo más conservador para cubrir de una vez la lista de pantallas sin mando, pero cambia cómo se ve la interfaz con un mando enchufado.
5. **Mapeo de los planos** (A, X, Y, Ver, R2, L2+R3, cruceta, LB/RB) y **del taller K** (cruceta ← → de categoría): pasos de teclado a botones; el pie de los dos paneles cambia a texto de mando mientras hay uno enchufado. Con una lista del HUD abierta (almacén, feria, cargas, cocina, taller del tren, fiestas, taller K), la cruceta ← → ya no abre los planos ni el mapa por detrás.
6. **G4:** el cuaderno se alcanza por la pausa, sin botón propio (los 16 botones estándar ya tienen dueño).
7. **G6:** los controles del modo foto sin efecto se apagan, no se ocultan.
8. **II-1:** devuelve el 100 % de lo pagado al retirar la marca (la otra opción era no dejar cancelar o descontar la mitad como con los materiales). Se devuelve aunque hayas deshecho (que ya devolvía la mitad de los materiales).
9. **I-1:** sólo en el Relax (en el Desafío el campo es terreno de defensa); rectángulos con 0,6 m de margen y 1,2 m de orilla para el arroyo; cuenta el radio de lo que se funda.
10. **I-2:** los cuerpos nuevos son círculos y lados finos (palos de 10 cm, cerco de 6 cm de radio, mesa de 0,45); sin cuerpo lo chico (ver arriba).
11. **E1:** además de los músicos se excluye a los parroquianos de esa noche y a la moza y la bailarina siempre; con lluvia o nieve no hay noche de estrellas (no se inventó un plan bajo techo).
12. **E3:** el filtro está en `fiestas-juego.js` (`presentes`), no en `aldea-gente.js`; el concurso (que cita a `nene`/`nena`) no se tocó.
13. **F3:** sólo las fiestas y el correo con el modo foto; `valle.actualizar` y `cantinaAmbiente` (que también miran la hora) no se tocaron.
14. **F4:** si no queda ningún árbol en pie, el carpintero se esconde; el panal talado no vuelve a aparecer.
15. **II-3:** el despertar prueba 5 distancias × 8 direcciones y, si el catre llena el cuarto, cualquier lugar libre de la misma huella; si no hay huella (un catre suelto en el campo) busca lo mismo sin ella.
16. **II-4:** un entrepiso a 2,28 m sobre el piso (±0,42) cuenta como cubierta; también para la lluvia.

## Preguntas para el usuario

- **Mando:** ¿te sirve el mapeo de los planos (A construye/confirma, X mueve, Y encastre, Ver deshace la etapa, R2 cancela la marca, L2+R3 desmonta) y el del taller K? ¿Querés un botón directo para el cuaderno (hoy: Start → Abrir el cuaderno)? La portada no dice nada de la cruceta: ¿le ponemos un renglón de ayuda cuando hay mando?
- **G8:** ¿hace falta tratar un volante o un joystick de vuelo? Hoy se usa el primero que no sea estándar si no hay otro.
- **I-1:** ¿la casa, el campo y el arroyo del molino también reservan lugar en el Desafío?
- **I-2:** ¿cuerpo también para los canteros bajos, el fogón y la carpa del campamento, y los duendes tallados?
- **II-1:** ¿devolver el 100 % (hoy) o la mitad, como con los materiales?
- **F12:** truenos con lluvia fuerte sin destello (el «relámpago lejano» nunca existió): ¿se quitan o se conectan al fogonazo?
- **E1:** con lluvia o nieve, la noche de estrellas no sale: ¿preferís que se mude adentro (a la biblioteca)?
- **Medir en la 4600G** el ritmo automático (F3 muestra `k`, `p90` y `presupuesto L`): con H1 y H2 no debería quedarse en 30 fps ni en L1/L3.
- Los textos nuevos (sin inglés): el pie de los planos con mando, el pie del taller con mando, «Ahí están la casa del molino / el campo de tulipanes: buscá otro lugar», «Ahí corre el arroyo del molino: buscá otro lugar», «Te devolvieron … del terreno y la mano de obra», «30 minutos», «Necesita calidad Media o Alta», el aviso del cuaderno en la pausa no cambió.

## No probado

Un mando de verdad (sólo uno simulado), el taller y los planos con un mando real en una partida larga, la cruceta en los paneles que no se recorrieron uno por uno (partidas, controles, créditos, logros, carreras, personalizar, la billetera), el minga del F3 en un día de fiesta, el zorro (F10) y la reserva del molino en el juego (sólo en el valle de Node), los cuerpos de los rincones con el jugador de verdad (sólo con el caminante), los fps en la 4600G, la escala de Windows 150/200 % y el marco amarillo sobre todos los fondos.
