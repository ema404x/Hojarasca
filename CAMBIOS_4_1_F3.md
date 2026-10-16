# 4.1 · F3: efectos y guardarropa del creador de Bruno (16-10-2026)

Rama `creador-bruno-f3` (sale de `v392-mejoras`; sin push, sin tocar `main`). Los rasgos que se eligen en el creador ahora **tienen efecto** en cuatro sistemas, más el guardarropa.
Uno por vez, cada uno con su módulo puro, su prueba y su commit.

**Regla general:** los efectos valen **sólo si Bruno ya fue creado** (`creado === true`) y **sólo en el Relax**. En «La noche de los duendes» y en una partida que todavía no pasó por la creación,
todo da neutro (0 puntos, factor 1). Por eso las 115 pruebas viejas y las partidas viejas no cambian. Todo es lógica **por evento** (dormir, lanzar la caña, sumar amistad, mirar el cielo);
el resultado se memoiza por objeto de Bruno, así que no hay cuentas por cuadro.

Dónde vive: `src/creador-efectos.js` (puro, sin three) traduce lo que ya calculaba `creador-personaje.js` (`efectosAplicados`, con tope) a lo que necesita cada sistema.
`main.js` sólo lo llama en el momento del evento.

## Qué efecto tiene cada sistema

| Sistema | Qué cambia en el juego | Tope | Dónde se engancha |
|---|---|---|---|
| **Abrigo** | Suma o resta puntos a la ropa que llevás al dormir una noche de invierno sin fuego (el umbral de 4 puntos para «mejorar un escalón») | **±1 punto** | `dormir()` en `main.js` → `templarNoche(como, personaje, extra)` (`personal-personaje.js`, tercer parámetro nuevo, por defecto 0) |
| **Afecto** | Escala **lo que suma** cada gesto bueno con un vecino (charlar, regalar, invitar, dar una mano, chistes de la rueda social, lo que llega de parte tuya) según personalidad/oficio/virtud/defecto **más la afinidad de gustos compartidos con ese vecino** | ±20 % | `sumarAmistad` de `vecindad.js` (enganche `fijarModificadorAmistad`, fijado una vez en `main.js`) |
| **Pesca** | Acorta o alarga la **espera del pique** (un factor más en la cadena de `pesca.js`) | ±20 % (0,8 a 1,2) | `mundoPesca()` en `main.js`, `ctxPesca.pique` |
| **Cuaderno** | Acelera o frena la **mirada que anota el cielo** (constelaciones y luna llena, 2,2 s de mirada), junto al zoom y los «ojos de noche» de la pareja | ±20 % (0,8 a 1,2) | las dos cuentas de mirada de `actualizarCielo` / `cieloDeLaNoche` en `main.js` |
| **Guardarropa** | Cinco conjuntos por ocasión y estación (de todos los días, liviano de verano, para la lluvia, abrigo de invierno, invierno de nieve) en una fila nueva de «Tu personaje»; el cartel de abrigo cuenta los rasgos de Bruno | — | `src/creador-guardarropa.js` + fila en `personal-personaje.js` |

Los 32 rasgos con su pro y su contra están en `RASGOS_BRUNO.md` (sin cambios); esta fase no tocó el catálogo.

## Pruebas agregadas (las cinco `verificar-*` enganchadas a `npm run verify`)

- `pruebas/verificar-4-1-efectos-abrigo.mjs` (38): neutro sin Bruno/Desafío; cada rasgo de abrigo; **las 56 250 combinaciones** dan -1, 0 o +1 y coinciden con el catálogo; `templarNoche` sin extra es idéntico a antes; el enchufe en `main.js`.
- `pruebas/verificar-4-1-efectos-afecto.mjs` (41): la tabla vecino × gusto está completa y alineada con la vecindad (los 37 vecinos); porcentajes por vecino; el redondeo es determinista y **en promedio da justo el porcentaje**; sólo se escalan ganancias; usa la vecindad real; lo guardado sigue entero.
- `pruebas/verificar-4-1-efectos-pesca.mjs` (22): neutro; cada rasgo; 56 250 combinaciones en 0,8–1,2; memoria; el enchufe (incluida una trampa que encontré: un comentario al final de la línea de `ctxPesca` se habría comido `clavar` y `línea`).
- `pruebas/verificar-4-1-efectos-cuaderno.mjs` (18): neutro; cada rasgo; 56 250 combinaciones; simulación de la mirada (con +20 % anota en 10 miradas, normal 12, con -20 % 14: nunca se bloquea); sólo dos usos en `main.js`.
- `pruebas/verificar-4-1-guardarropa.mjs` (36): los conjuntos usan sólo piezas que existen; los desbloqueos de siempre; ponerse un conjunto no toca colores ni regala piezas; el abrigo de cada conjunto coincide con el que calcula el juego.
- `pruebas/humo-4-1-efectos.cjs` (partida real en Electron, **no entra a `verify`**; la levanta `suite-humo.ps1` como el resto de los `humo-*`): pique y amistad con un Bruno creado (+20 % / -20 %), sin crear no cambia, los gustos compartidos sólo suman con quien los comparte, el guardarropa se ve y se desbloquea en el panel, recarga, noche sin errores de consola.
- También **se engancharon al `verify` las cuatro pruebas de la F1/F2 que no estaban** (`verificar-4-1-creador`, `-bruno-seccion`, `-espejo`, `-ficha`): pasaban pero nadie las corría con el gate. Por eso el gate pasó de 207 a 216 pasos (4 de las viejas + 5 nuevas).

Además corrí en Electron, al monitor externo: `humo-4-1-creador.cjs` (crear, guardar, recargar, espejo, cuaderno; verde) y `humo-2-8.cjs` (Personalizar de antes; verde). Las dos sin errores de consola.

## Decisiones que tomé sin consultar (para que las revises)

1. **El tope del abrigo es ±1 punto, no un porcentaje.** Leí cómo calcula el abrigo el juego: cada prenda suma puntos (poncho 2; gorro, bufanda y guantes 1) y con **4 o más** la noche de invierno sin fuego mejora **un** escalón. Es un umbral entero, un porcentaje no tiene sentido. Elegí lo conservador: ±1 punto (la ropa de arranque, gorro y bufanda, abriga 2). Consecuencia **visible en la dificultad**: un Bruno Friolero que antes templaba la noche con poncho + gorro + bufanda (4) ahora necesita además los guantes (5); un Resistente templa con poncho + gorro (3). Sólo en el Relax. Si te parece mucho, se baja a «sólo los pros suman» cambiando una línea de `efectosDeBruno`.
2. **El afecto sólo escala las ganancias.** Lo que resta una discusión no cambia (no se castiga dos veces), y nunca baja de 0 ni convierte una ganancia en pérdida. Alcanza a todo lo que pasa por `sumarAmistad` (charla, regalos, invitar, ayudar, obras, lo que llega de parte tuya, chistes de la rueda). **No toca el romance** (`amor.js` tiene sus propios puntos): la personalidad que «toca un poco el romance» (sección 10 del plan) queda sin enchufar.
3. **Redondeo determinista del afecto.** Los puntos de amistad son enteros; la fracción (por ejemplo 2 × 1,2 = 2,4) se reparte con un hash de vecino + puntos + día, sin azar de verdad: mismo caso, mismo resultado, y en promedio sale justo el porcentaje (lo mide la prueba). La alternativa era guardar un resto por vecino en la partida (más datos que sanear).
4. **El enganche del afecto es un `let` de módulo en `vecindad.js`** (`fijarModificadorAmistad`), fijado una vez en `main.js`. Sin él (pruebas, Desafío) todo es igual que siempre. La alternativa, pasar a Bruno por los ~10 llamados a `sumarAmistad`, tocaba muchas firmas.
5. **Pesca: sólo cambia la espera del pique.** No toco el tiempo para clavar, la tensión de la línea ni qué pez sale (eso sería dificultad nueva).
6. **Cuaderno: sólo el cielo.** Hoy casi todo el cuaderno se anota de un golpe (acercarse, mirar, E), sin tiempo que acortar; lo único con tiempo de observación es mirar constelaciones y la luna. El resto (fauna, plantas) no cambia. Ver pregunta 2.
7. **Guardarropa sin arte nueva.** Los cinco conjuntos usan sólo piezas existentes y los desbloqueos de siempre (poncho: telar o carta de Amalia; botas de goma: almacén). No hay cambio automático por estación: se elige a mano. Los nombres de los conjuntos y el texto de «te falta el poncho» son **PROVISORIOS** (los textos propios son de la F4; el inglés, al final).
8. **El cartel de abrigo de «Tu personaje»** ahora cuenta los rasgos de Bruno («Abrigo: 3 de 4»), así que puede mostrar 3 con la misma ropa que antes mostraba 2. El texto del aviso al despertar («La ropa abrigó…») no cambió, aunque ahora el escalón puede venir de un rasgo.
9. **Los efectos no se muestran con números** (decisión del plan). La ficha ya dice los pros y contras en texto; no agregué avisos nuevos en el juego («pica antes»), porque serían textos nuevos.
10. **Las pruebas viejas de la 4.1 entraron al `verify`** (ver arriba): cambia el conteo del gate, no ninguna regla.

## Preguntas para vos (no las implementé)

1. **Ropa de fiesta de la peña.** El plan la menciona, pero no existe esa pieza en el juego: habría que diseñarla (modelo, color, desbloqueo: ¿al ir a la primera peña? ¿se compra en la modista?). Quedó registrada como `CONJUNTO_PENDIENTE` y no es elegible.
2. **Cuaderno: ¿querés que también acelere ver animales?** Habría que ensanchar la distancia o el ángulo de `mirando()` en `fauna.js`, `vida.js` y `bichos.js` (tres copias). Es el efecto que más se notaría, pero cambia qué tan fácil es anotar fauna: dificultad nueva, por eso no lo hice.
3. **Cambio automático de ropa por estación.** ¿Que Bruno se ponga solo el abrigo de invierno cuando nieva (si lo tiene)? Hoy es manual.
4. **Romance.** La personalidad «toca un poco el romance» según el plan. ¿Lo enchufo a `amor.js` (por ejemplo, el reservado tarda más en abrirse)?
5. **Tope del abrigo en los contras.** Si apilar contras de abrigo (el sistema con una contra de más) te parece castigo o regalo: el tope ±1 recorta también las contras, igual que en el resto (ver la tabla A/B/C de la sección 18 del plan).

## Lo que no se probó / lo que falta

- **Dormir con frío en el juego real** no se probó en Electron (hace falta invierno y noche): el cálculo está probado en Node (`templarNoche` con extra, 56 250 combinaciones) y el enchufe por texto, pero no el flujo completo de dormir.
- **Mirar el cielo con el factor** tampoco se probó apuntando la cámara a una constelación: se probó la cuenta en Node y que una noche corra sin errores de consola.
- **Rendimiento:** no se midió en la 4600G; no agrega nada por cuadro (el factor del pique se pregunta por cuadro, pero está memoizado: una comparación de objeto).
- **Falta de la F4:** los textos propios (nombres de conjuntos, avisos), el prólogo y las 26 líneas de asado y lluvia. Los gustos asado y lluvia afectan el afecto, pero los vecinos todavía no lo dicen.
- **Falta del plan:** mando en la creación (deuda antes de Steam), el inglés (al final), la partida de punta a punta de la F5.
