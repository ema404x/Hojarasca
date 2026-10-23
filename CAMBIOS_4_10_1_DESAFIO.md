# 4.10.1 — arreglos de «La noche de los duendes» (rama `bugs-410-desafio`)

Partida de los informes de lectura `bugs3/zona-B.md` (noches y ataques), `zona-C.md` (aliados y defensas), `zona-D.md` (volver a jugar) y los
hallazgos E2 y E3 de `zona-E.md`. Cada hallazgo se confirmó antes de tocarlo (con los arneses de `bugs3\arneses` contra 4.10.0); la versión no se
subió (sigue 4.10.0 en `package.json`). Comentarios en el código con `4.10.1:`.

## Pruebas nuevas
- `pruebas/verificar-4-10-1-desafio.mjs` (en el gate): ejecuta la conducta de casi todos los arreglos (reglas puras, mundos de mentira, funciones sacadas
  del texto de `desafio.js`). Contra la 4.10.0 falla en la cadena, la brecha, lo guardado y las semillas (se comprobó).
- `pruebas/verificar-4-10-1-version.mjs` (en el gate): la versión de la partida, saneada, y que una partida de antes cargue igual.
- `pruebas/humo-4-10-1-guardado.cjs` (partida real en Electron): noche 9, cae una defensa, te hieren, quedan sólo el enjambre y el curandero;
  guardar → cerrar → abrir: siguen las obras perdidas y el daño, vuelven 9 del enjambre y el curandero (no «los primeros N»), y al alba la noche no sale
  «perfecta». Verde.
- Ajustadas lo mínimo (describían lo cambiado a propósito): `verificar-4-8-noches` (el giro «defensa» ya no pasa por `danarObra`; el entorno trae
  `curanderosEnLaNoche` y `sacudidas`), `verificar-4-8-ambiente` y `verificar-4-10-base` (la línea del perro ahora es `perroAliado()`; en la E del
  tablero, `avisoDesafioCerca: null`), `verificar-4-9-aliados` (el travieso del silbato ya no corre hacia la base). Más un bloque nuevo en
  `verificar-4-10-base` (la corta no da piña ni corona).

## Estado de cada hallazgo

### Zona B (noches y ataques)
| # | Hallazgo | Estado |
|---|---|---|
| 1 | Brecha de la cadena sin efecto | **Arreglado**: `blancoNoche` de los ataques incluye la brecha (el lado se anula y los señuelos no salen); baja a 40–58 m. |
| 2 | `aplicarCadena` recorta enjambre y curandero | **Arreglado**: sin nada que sumar (sólo brecha) la lista queda igual; el tope de 24 cuenta sólo los comunes. |
| 3 | Guardar a mitad de noche borra obras perdidas y daño | **Arreglado**: `D().nocheActual` va en la partida (el objeto del juego lee y escribe ahí); saneado. |
| 4 | Los sobrevivientes vuelven como «los primeros N» | **Arreglado**: `D().quedan` (tipos vivos, tope 40, saneado) se anota cuando cambia la cuenta; partidas viejas siguen como antes. |
| 5 | Previa y silencio con las noches terminadas | **Arreglado**: `faseMusical` sólo da `previa` si `siguenLasNoches`; el silencio se rompe en cualquier fase que no sea previa. (La pista del lado vieja en la previa queda cubierta por lo mismo.) |
| 6 | Silencio de minutos con «Hora de tu reloj» | **Arreglado**: tope de 14 s. |
| 7 | «Se quiebra una defensa» con escudo/curtido | **Arreglado**: la vida se fija al 12 % (no pasa por `danarObra`, que además sumaba una noche de «participó»). |
| 8 | Niebla un 30 % más rala | **Arreglado**: el ambiente recibe la vista del clima sin la niebla de la noche (`vistaDelClima`). Sólo probado por lectura+gate (se calcula en el ciclo de `actualizar`); las capturas no se rehicieron. |
| 9 | Noche 19 sin señuelos | **Arreglado**: `esFinal` del módulo de ataques mira la noche ya contada. |
| 10 | «No se repite el giro» era «distinto del último» | **Arreglado**: se compara con el giro de la noche anterior de verdad (`d.giro.noche`). |
| 11 | Giro de refuerzos | **Arreglado (a, b)**: marca `refuerzoNoche` y no trae curandero antes de la noche 4 / en noche de jefe. **No (c)**: en una noche silenciosa bajan los refuerzos de la lista común (ver preguntas). |
| 12 | «Se va con el alba» no cuenta para la cadena | **No se tocó**: es raro (la huida dura segundos) y cambia la cadena; queda anotado. |
| 13 | Especial `'constructor'` | **Arreglado**: `Object.hasOwn` (también `especialAnterior`). |

### Zona C (aliados y defensas)
| # | Hallazgo | Estado |
|---|---|---|
| 1 | Anselmo arregla una obra que cayó | **Arreglado**: cada cuadro comprueba que la obra siga en `obras.obras` (`api.obraViva`). |
| 2 | Anselmo clavado en una obra inalcanzable | **Arreglado**: si en 25 s no llega a menos de 2,6 m, la deja de lado 40 s y elige otra. |
| 3 | Pedido entregado entre 19:30 y 20:30 | **Arreglado**: hasta las 20:30 el nivel de la noche puede subir (nunca baja). |
| 4 | «Manos livianas» no hace nada | **Arreglado**: arregla más rápido (÷ `anselmoPausa`, ×1,43 con 0,7). |
| 5 | Trampa de miel armada desde el menú nace seca | **Arreglado**: al terminarse sin `usos` nace llena (5). La que ya se secó queda seca. |
| 6 | Pasadizo y miel en listas de «defensas» | **Arreglado**: se excluyen (`defensa.sinCuerpo`) de los señuelos, del giro y de la brecha. |
| 7 | «Sin aliados»: pedidos y final | **Arreglado**: sin pedidos con la regla; `vecinosQueAyudaron` da 0 (el final no es «La aldea entera»). |
| 8 | Fogones de Herminia espantan al Mandamás | **Arreglado**: el jefe se exceptúa (como el farol de mano). |
| 9 | Silbato de Martín hacia la base | **Arreglado**: si alejarse de la vía es ir hacia la base, corre de costado (o alejándose de la base). Cambié una comprobación de `verificar-4-9-aliados` que daba por bueno lo contrario. |
| 10 | Campana de día | **Arreglado**: de día suena pero no cambia las órdenes de Ramón y Josefina (el perro al portón se mantiene). |
| 11 | Órdenes de los vecinos persisten entre noches | **No se tocó** (baja; es diseño de «vení conmigo»; ver preguntas). |
| 12 | Herminia sin plan B para un fuego inalcanzable | **No se tocó** (confianza baja; el arreglo de Anselmo no la cubre). |
| 13 | Sonidos de la pala se «preparan» una vez | **No se tocó** (cosmético, confianza baja). |

### Zona D (volver a jugar)
| # | Hallazgo | Estado |
|---|---|---|
| 1 | Semillas infinitas con importar + empezar de nuevo | **Arreglado**: cada partida tiene un número (`meta.id`); lo cobrado va en `hojarasca-meta-v1` (`cobradas`, tope 300). Una copia no vuelve a cobrar ni a anotar puntos. Límite: una partida exportada **antes** de la 4.10.1 no tiene número y se puede copiar como antes (recibe uno nuevo en cada importación). Las ventajas «ya pagadas» de una copia no se tocaron. |
| 2 | «Sin aliados»: pedidos y final | **Arreglado** (igual que C7). |
| 3 | «Sin aliados» y el perro | **Arreglado**: con la regla el perro no avisa, no da pistas del lado y no suma noches (`perroAliado()`). |
| 4 | Partida corta regala piña y corona | **Arreglado** (`victoria` no cuenta en `modo: 'corta'`). |
| 5 | Partidas viejas sin `meta` | **Arreglado**: al cargar una campaña con noches y sin `meta` recibe una neutra. |
| 6 | La E del tablero tapa puerta/dormir/nidos | **Arreglado**: el tablero cede ante esas tres (misma posición en la tabla). |
| 7 | Noches más largas / manos llenas | **Parcial**: «Manos llenas» y la regla «Noches más largas» ahora chocan (no se suman). Con «Hora de tu reloj» siguen sin cambiar la noche (ver preguntas). |
| 8 | Pesadilla en Implacable | **No se tocó**: subir el tope de 24 cambia el equilibrio (ver preguntas). |
| 9 | Piña por la llegada del Coihue | **No se tocó** (el diseño 4.10 dice que la puertita «se abre sola»; ver preguntas). |
| 10 | Partida corta: doble cierre en 2,4 s | **No se tocó** (necesita partida real con tiempos). |
| 11 | `iniciar()` no idempotente | **Parcial**: los bonos de las ventajas ya no se suman dos veces; materiales/flechas del arranque siguen (hay que cerrar el juego justo en ese tramo). |
| 12 | Salud por encima del máximo al perder un bono | **No se tocó** (baja, se recorta al guardar y abrir). |
| 13 | «Sólo arco» bloquea con la lanza | **Arreglado**. |
| 14 | «Entre las cenizas» con una caída | **No se tocó** (es una pregunta de diseño; ver preguntas). |
| 15 | Estudios del bestiario del jefe inalcanzables | **No se tocó** (números de dificultad/progreso; ver preguntas). |
| 16 | Textos que no coinciden | **Arreglado el texto** de abandonar la corrida sin fin (ahora dice que se anotan los puntos y da semilla). **No** las fugas de materiales (sin impacto medido). |

### Zona E
- **E2 («Otra vuelta» tira la pesadilla, ventajas, reglas, habilidades)**: **no se cambió**. Leí `CAMBIOS_4_10_*.md` y `PLAN_DESAFIO_MEJORAS.md`: ninguno dice que se conserven; `desafio-vuelta.js` es explícito (llevar sólo armas, mejoras y planos: «lo que se gana peleando») y los documentos de la 4.10 describen las habilidades como «dentro de la partida». Es decisión de diseño (ver preguntas).
- **E3 (la partida no lleva la versión)**: **Arreglado en parte**. La partida guarda `versionJuego` (saneada, `^\d+\.\d+\.\d+$`) al guardar; las de antes cargan igual (queda vacía). Al abrir una partida guardada con una versión **más nueva** que la del juego, sale el aviso «Partida de una versión más nueva». **No** impide guardar ni conserva los campos que la versión vieja no conoce (eso sería rehacer los saneadores); sólo avisa. Tampoco se tocó la sincronía/`leerPaquete`.

## Decisiones tomadas sin consultar
1. Brecha: gana sobre el lado de la noche pero **después** del rescate, la trochita y el asedio (como decía `CAMBIOS_4_8_NOCHES.md`); con brecha no hay señuelos esa noche.
2. `aplicarCadena`: el enjambre y el curandero quedan **fuera del tope de 24** (en vez de subir el tope); con sólo la brecha, la lista no cambia.
3. Sobrevivientes: lista de tipos (`quedan`) en la partida, no un contador más fino; las partidas viejas siguen con el viejo «primeros N».
4. «Manos livianas»: arreglar más rápido es lo que prometía el texto; el otro arreglo posible era cambiar el texto de la ventaja (más conservador para el equilibrio, pero la ventaja seguiría sin hacer nada).
5. Pedidos 19:30–20:30: se refresca el nivel (en vez de cerrar la entrega a las 19:30, que cambiaba el plazo que ya ven los jugadores).
6. Silbato: costado/alejarse de la base, no «el mismo rumbo de antes».
7. Semillas: número de partida + lista de cobradas (la otra opción, un flag fuera de la partida, no distinguía dos partidas).
8. E del tablero: ceder ante puerta/nido/dormir en vez de moverlo en la tabla (la prueba de la 4.10 exige que vaya antes de lo que mirás).
9. «Manos llenas» + «Noches más largas» pasaron a **incompatibles** (la otra opción era sumar los dos tercios: cambia la dificultad).
10. Trampa de miel del menú: nace llena (la ficha dice «aguanta 5»); la ficha no pide frasco.
11. Texto de abandonar la corrida sin fin: se cambió el texto, no el comportamiento (que da semilla y puntos).
12. Silencio: tope de 14 s en vez de rehacerlo por segundos reales.

## Preguntas (no las toqué)
- **Otra vuelta (E2)**: ¿se llevan las habilidades, el bestiario, los trofeos, la pesadilla/reglas elegidas? Hoy la vuelta 2 es campaña normal sin nada de eso.
- **Pesadilla en Implacable (D8)**: el 1,3× de duendes desaparece desde la noche 8 por el tope de 24. ¿Subir el tope (más bichos y más carga) o aceptar que Implacable ya es el techo?
- **«Noches más largas» con «Hora de tu reloj» (D7)**: no se puede alargar el reloj de la PC. ¿Deshabilitar los chips con esa duración, o no sumar los puntos?
- **«Entre las cenizas» (D14)**: ¿una caída tuya cuenta como «la base se vino abajo más de una vez»?
- **Piña del Coihue (D9)**: ¿se gana si el Coihue llega a tu base sin cortar ninguna raíz?
- **Bestiario del Mandamás (D15)**: sus estudios (5/15/40) no se alcanzan en la campaña (4 caídas). ¿Bajar los umbrales?
- **Refuerzos del giro en noche silenciosa (B11c)** y **órdenes que persisten entre noches (C11)**: ¿se reinician?
- **Versión de la partida (E3)**: ¿se quiere que una versión vieja se **niegue** a pisar una partida más nueva (no guardar) en vez de sólo avisar?
