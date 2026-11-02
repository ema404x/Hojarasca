# Hojarasca 4.19.0 (parte B) — Belisario y Sofía llegan a «de la casa», y el epílogo de Nicanor según el final

Rama `v4190-b`, sobre la 4.18.4. No se subió la versión. Esto es la parte B: guiones, datos puros, sin Electron. Los archivos tocados son `src/historia-escenas-lazos.js` y `src/historia-texto-lazos.js` (más la prueba nueva y un ajuste a propósito de la de la 4.18.2). La mecánica (el registro de las optativas, los disparadores, `historia-final.js`) es de A; los pedidos están al final y en el tablero.

## Qué había
Con las escenas de la 4.18.2 los siete vecinos con lazo llegaban a 3 («de la casa») salvo dos: **Belisario** (`los-del-cerro` +1, `mulas-belisario` +1) y **Sofía** (`foto-valle` +2 esperando la luz, +1 apurándola; `foto-sofia` no da nada) llegaban como máximo a 2. Por eso sus líneas de final y de charla pedían 2. Además la línea de Nicanor del epílogo («cuando salen las luces sobre el lago…») salía también con el final de la pelea, donde el valle quedó tranquilo y las luces ya no salen.

## 1. La línea de Nicanor sale sólo con el final que corresponde
`TEXTO_LAZOS.final.nicanor` pasó a tener dos líneas de lazo 3, una por final, con el campo nuevo `solo`:
- `final-nicanor` (`solo: 'trato'`): «Cuando las luces vuelven al lago, Nicanor te silba desde el muelle, para tener un testigo. Vos vas.» (cambié «salen las luces sobre el lago» por «las luces vuelven al lago» para no repetir la frase del primer párrafo del final del trato, que ya dice que Nicanor ve luces sobre el lago).
- `final-nicanor-pelea` (`solo: 'pelea'`): el lago ya no tiene luces, Nicanor lo lleva con resignación de pescador y te silba igual a la hora de siempre.

**Firma nueva, pedida a A:** `finalDeLazos(lazoDe, final)`. `final` es `'trato'` o `'pelea'` (lo que `tarjetaFinal` ya calcula como `trato`: `h?.duendes?.trato === 'pelea' ? 'pelea' : 'trato'`). Una línea con `solo` sale únicamente si `final` es exactamente ese; con cualquier otra cosa (sin argumento, `null`, `'fuerte'`, un número…) las líneas con `solo` no salen: mejor ninguna que la del final que no es. Las líneas sin `solo` valen con cualquier final, así que **nada se rompe si A todavía no lo conectó** (la línea de Nicanor, sencillamente, no sale). Lo que hay que tocar en `historia-final.js`: `piezasLazos(h, trato)` pasa `trato` como segundo argumento de `finalDeLazos` y `tarjetaFinal` llama `piezasLazos(h, trato)`.

## 2. Una escena chica optativa para cada uno (acto III)
Las dos son del acto III, capítulo 9, con ventana `frios` → `arco` (capítulos 9, 10 y 11). Ninguna cruza de acto, ninguna es objetivo del capítulo, nada se traba, sin premios de objetos ni de dinero. Las dos dan **+1 al lazo del vecino, una sola vez y por cualquier camino**: el efecto `lazo:belisario:1` o `lazo:sofia:1` está al final de la escena, fuera de toda elección (las tres preguntas de cada escena son de sabor y ninguna opción pesa). Así «no vale más de un camino»: no hay manera de sumar dos veces ni de sumar más con una elección que con otra.

### `ultimo-cruce` — «El último cruce» (Belisario)
- Dónde y cuándo: E sobre `belisario`, de 8 a 18, con `los-del-cerro` vista (es objetivo del capítulo 8: al llegar al acto III siempre está vista). En el Puesto del Paso, sin llegar a ningún lugar: allí ya pasan otras cosas (`majada-belisario`, los blancos de paja).
- Qué pasa: Belisario ata la última tropa, mañana sale antes de que la nieve tape el paso. Te habla de la huella que abrió su padre, de la pipa que ya no fuma pero lleva (la de la vía, de «Lo que se pierde, aparece») y te convida un mate. Al probar la carga, las siete mulas miran hacia el valle con las orejas paradas y en el barro, junto a las pezuñas, hay huellas muy chicas y descalzas que no pasan del borde del puesto. «Las mulas saludan a quien ven. Yo saludo a quien ellas saludan.»
- Tres preguntas de sabor (miedo, el padre, por qué no se queda) y tres despedidas de sabor. Una variante por decisión: si le vendiste la majada de Ramón (`majada = c`), Belisario cuenta que llegó entera y que Ramón no lo saluda.
- No toca la hora. Anota lo raro `mulas-saludan` (capítulo 9, «Puesto del Paso»).

### `del-otro-lado` — «Del otro lado de la cámara» (Sofía)
- Dónde y cuándo: llegar al estudio de fotos (a menos de 12 m) o E sobre `fotografa`, de 9 a 16:30, como `foto-valle`; se ofrece con `foto-valle` vista y Sofía viviendo en la aldea. Sigue a «La luz de las cinco»: habla del cajón de las cosas que no explica y de lo que no se puede mirar de frente.
- Qué pasa: hoy te toca a vos apretar la pera. Sofía, que sacó miles de caras y ninguna es la suya, se sienta en el banquito del estudio; vos la ves cabeza abajo en el vidrio esmerilado, elegís cómo encuadrarla (entera, de cerca, en la puerta con el valle atrás) y apretás. Revelada en el cuarto oscuro (un fundido, sin cambiar la hora) sale riéndose, y en el borde izquierdo, afuera de lo que ella miraba, una mano muy chica sostiene el marco del reflector. «Es el viento. Acá adentro no hay viento, pero es el viento.»
- Dos elecciones de sabor (el encuadre; qué hacés con la mano: al cajón, colgarla, «fue el viento»). Anota lo raro `foto-de-sofia` (capítulo 9, «estudio de fotos»).
- Lo sensual, ni sugerido: es un retrato. No repite la tarea social «retrato-estudio» de la vecindad (que es mecánica de regalo e interacción): acá es una escena de historia con el mundo al revés (ella delante, vos detrás).

### Cuentas del lazo (la prueba las calcula de los datos)
| vecino | de dónde sale | cota antes | cota ahora |
|---|---|---|---|
| `belisario` | `los-del-cerro` +1 («Gracias por contarme»), `mulas-belisario` +1, `ultimo-cruce` +1 | 2 | 3 |
| `sofia` | `foto-valle` +1 o +2, `del-otro-lado` +1 | 2 | 3 |

Con las dos escenas viejas solas ninguno de los dos pasa de 2, y el 3 sale **sólo** de la escena nueva (la prueba lo comprueba sacando la escena del cálculo). Sofía llega a 3 únicamente esperando la luz en `foto-valle` (+2) y haciendo `del-otro-lado` (+1); apurándola o moviéndote llega a 2.

### Lo que le toca a A para registrarlas (y ya está escrito en el tablero)
`historia-escenas-lazos.js` exporta el **dato del registro** de cada una, con la forma de `OPTATIVA_SOFIA`: `OPTATIVA_BELISARIO`, `OPTATIVA_SOFIA_FRENTE` y `OPTATIVAS_LAZOS` (la lista de las dos). Los ids de la escena y de la optativa son el mismo.

| optativa | escena | ventana | ofrece | disparo |
|---|---|---|---|---|
| `ultimo-cruce` | `ultimo-cruce` | `frios` a `arco` | `los-del-cerro` vista | `hablar` con `belisario`, de 8 a 18 |
| `del-otro-lado` | `del-otro-lado` | `frios` a `arco` | `foto-valle` vista y poblador `fotografa` | `auto` en `estudio-fotos` (12 m) y `hablar` con `fotografa`, de 9 a 16:30 |

1. `historia-optativas.js`: `for (const d of OPTATIVAS_LAZOS) { const o = optativaDeLazo(d); if (o && !OPTATIVAS.some((x) => x.id === o.id)) OPTATIVAS.push(o); }` (ya se importa `ESCENAS_LAZOS` de ese archivo).
2. `historia-disparadores-optativas.js`: sumar `...OPTATIVAS_LAZOS.reduce((r, d) => ({ ...r, ...disparadoresDeLazo(d) }), {})` a `DISPARADORES_OPTATIVAS`, y en `EFECTOS_ESCENA_OPTATIVAS` el tema `T(d.quien, d.id)` por cada una (como el de Sofía).
3. El tablón (`TEXTO_LAZOS.tablon`), la charla de después (`cuando: { escena }`), lo raro (`TEXTO_LAZOS.raro`) y los efectos (`EFECTOS_LAZOS`, que `main.js` ya registra) los leen los módulos de A tal como están: no hay que tocar nada más.
4. **No darle lazo a `foto-sofia` en el registro** (hoy no da nada): la línea de final de 3 de Sofía habla de `del-otro-lado`, y con un +1 más desde `foto-sofia` habría partidas con lazo 3 que nunca vieron esa escena.
5. Hasta que A conecte los disparadores, `pruebas/verificar-4-18-4-a.mjs` dice que `ultimo-cruce` y `del-otro-lado` son escenas sin disparador (es lo esperado: son las dos nuevas; se pone en verde al registrarlas).

## 3. Las líneas de los siete con las dos escenas nuevas
Las líneas de final y las charlas de los siete se revisaron una por una contra las dos escenas nuevas, contra las piezas del final del juego (`FINAL_A`, `FINAL_B`, `PIEZAS_FINAL`) y entre sí. Lo que cambió:
- **Belisario** (`final-belisario-casa`, lazo 3, primera; `final-belisario`, lazo 2, segunda): con 3 sale la nueva (la primera historia de cada viaje con el mate todavía caliente; las mulas conocen el desvío a tu puerta); con 2 sigue saliendo la de antes. La charla `belisario-opt-cruce` (capítulo 9, «de después» de la escena) es nueva.
- **Sofía** (`final-sofia-casa`, lazo 3, primera; `final-sofia`, lazo 2, segunda): con 3 sale la de la foto de ella riéndose junto a la del valle; con 2, la de siempre. La charla `sofia-opt-frente` (capítulo 9) es nueva.
- **Nicanor**: las dos líneas por final (arriba).
- Repetidas que se arreglaron: Rosa («el más tostado» estaba también en su charla: ahora «todavía caliente»); Tito (el final y la charla eran los dos un banco para sentarse en la entrada: el final ahora es un estante de lenga en el refugio); Herminia («la puerta sin llave» repetía «dejar la puerta entornada» del final de la pelea: ahora sólo la torta y los noventa); Nicanor (la frase de las luces sobre el lago, ver arriba); el «mate sin cobrar» de Belisario aparecía en su guía y en su charla de lazo: la escena nueva dice «este mate lo paga el camino».
- La prueba comprueba que **ninguna frase de cinco palabras se repita** entre todas las líneas de final, las charlas y las piezas del final del juego (las dos de Nicanor, que nunca salen juntas, quedan exceptuadas).

## 4. La prueba
`node pruebas/verificar-4-19-0-b.mjs` (en `verify:pasos`). La suite `todo` recibe los **módulos** (reales o mutados) y mira:
- las dos escenas con el director real: válidas, corridas por **todos sus caminos de elección** (9 cada una; `ultimo-cruce` además con `majada` = nada, `a`, `b` y `c`), saltadas a los 2, 40, 300 y 1500 cuadros; en todas termina sin errores, queda vista, suelta a todos, **suma exactamente su +1 una sola vez**, anota su raro, no corre nada más (ni objetos ni plata ni mundo) y no toca la hora; sólo hablan el vecino y la narración;
- que ninguna opción pese, que cada opción tenga su respuesta, que los textos no tengan inglés, religión, nada explícito, números ni la palabra «lazo», y que los nombres propios existan;
- el dato del registro (ventana dentro del acto III y del mismo capítulo que la escena, `ofrece`, disparos) y el **`optativaDeLazo` y el `disparadoresDeLazo` reales de A** sobre él, incluido que `ofrece` sólo dé verdadero con lo que pide;
- el tablón (capítulos seguidos que son los de la ventana), el raro, las charlas «de después» y las líneas de final, con las cotas del lazo calculadas de las escenas;
- `finalDeLazos(lazoDe, final)` por casos: ocho valores de `final` que no son `'trato'` ni `'pelea'`, los dos finales, el orden fijo, Belisario y Sofía con 1, 2 y 3, y la basura;
- las reglas del empaquetador (`armar.mjs`: un `export const` por línea, imports en una línea, sin ñ en ids) y de módulo puro (el archivo de textos no importa nada; el de escenas no importa el motor ni el registro, que lo importan a él).

**Mutaciones que miden de verdad:** 135 de datos (se clona lo exportado y se rompe una garantía) y 36 de **código** (se escribe una copia mutada de los dos archivos con sus tres dependencias en una carpeta temporal y se importa con `?v=<n>`, así cada mutante es un módulo nuevo y no el de la caché: por ejemplo `finalDeLazos` que ignora `solo`, que toma la última línea o que da el final al revés, un lazo de más o de otro vecino en la escena, un fundido o un cambio de hora, un disparo de noche, una ventana que cruza de acto). Una copia sin mutar, cargada igual, tiene que pasar. La prueba exige atraparlas todas.

### Ajuste a propósito de la prueba de la 4.18.2
`pruebas/verificar-4-18-2-lazos-escenas.mjs` seguía asumiendo que la única escena nueva es `foto-valle` y que las líneas de Belisario y Sofía piden 2 y son las primeras de su lista. Ahora mira la **vista de la 4.18.2**: los mismos datos sin las dos escenas nuevas, sin sus textos y sin las tres líneas de final nuevas (`final-belisario-casa`, `final-sofia-casa`, `final-nicanor-pelea`); las funciones, `finalDeLazos` incluida, son las reales. Las mutaciones que apuntaban a la posición cero de Belisario y de Sofía apuntan ahora a la uno (la de 2, que pasó a ser la segunda), y la de «EFECTOS desactualizado» saca un efecto de `foto-valle` y no el último de la lista ordenada. Las comprobaciones de `finalDeLazos` con Belisario y Sofía en 3 y con los siete en 3 pasaron a la 4.19.0. Todo lo demás de esa prueba quedó igual (190 comprobaciones, 100 mutaciones de datos y 25 de código atrapadas).

## Pruebas corridas
- `node pruebas/verificar-4-19-0-b.mjs`: ver el resultado en el informe final.
- `node pruebas/verificar-4-18-2-lazos-escenas.mjs`: 190 comprobaciones OK (100 mutaciones de datos y 25 de código).
- `node pruebas/verificar-4-18-2-lazos-a.mjs`, `verificar-4-18-0-escenas-optativas.mjs`, `verificar-4-18-0-optativas-a.mjs` y `verificar-4-15-0-historia.mjs`: en verde. `verificar-4-18-4-a.mjs` marca sólo que las dos escenas nuevas todavía no tienen disparador (lo conecta A).
- `node armar.mjs`: OK.

## Qué no se hizo y qué no se vio a ojo
- **No se vio a ojo nada** (sin Electron, por reparto). Conviene mirar a ojo, cuando A las registre y C pase las escenas:
  - `ultimo-cruce`: la cámara anclada al jugador frente a Belisario junto al fogón del Puesto del Paso (`FRENTE`), que Belisario esté a mano cuando arranca (la escena no lo hace aparecer: usa al que ya está), el plano general de las siete mulas (no se hacen aparecer mulas: se usa la tropa del mundo si está) y que las huellas chicas de la narración se lean (hoy es sólo texto: no hay una marca nueva en el barro).
  - `del-otro-lado`: Sofía adentro del estudio con el jugador adelante, los planos de detalle del vidrio esmerilado y de la bandeja (son sólo cámara sobre el jugador, no hay objetos nuevos) y que el fundido al cuarto oscuro no se sienta brusco.
- No hay escena nueva para Rosa, Tito, Tobías, Herminia ni Nicanor: ya llegan a 3.
- No hay más líneas tirantes que la de Tito (las dos escenas nuevas sólo suman).
- Una limitación conocida: la línea de Nicanor «de la pelea» depende de que A pase el final a `finalDeLazos`; hasta entonces no sale ninguna de las dos de Nicanor.
