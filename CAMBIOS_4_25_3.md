# 4.25.3 · los bugs que la 4.25.2 dejó sin arreglar

Rama `bugs-4-25-3` (sobre `main` = 4.25.2). No se subió la versión ni se hizo push. Insumos: las secciones «No arreglado» de `CAMBIOS_4_25_2_NPC.md`, `_HISTORIA.md` y `_GUARDADO.md`, y los informes `trabajo/bugs9/zona-F2.md`, `trabajo/bugs10/zona-G1.md` y `zona-G2.md` (más `bugs8/zona-E2.md` y `zona-E3.md` para los tres conocidos de antes). **0 programas de shader, 0 texturas, 0 llamadas de dibujo.** No se tocaron las sombras ni la huella del terreno. No se corrió Electron ni se midieron fps: todo lo de abajo está probado en Node, y lo que hay que mirar a ojo está al final.

Claves nuevas de guardado, todas opcionales (una partida vieja carga igual): `pagado` y `pagadoAmp` en cada obra, y `historia.noche.amanecer`.

## Arreglado

| # | Qué pasaba | Arreglo |
|---|---|---|
| **F2-7** | Las gallinas atravesaban la casilla del gallinero, las paredes y las cercas de alrededor, y con el gallinero sobre un entablado caminaban por debajo. | `gallinero-mundo.js`: `crearGallinas(T, escena, fisica)` recibe (optativo) el choque y el piso de la gente (`col.resolver` y `alturaDePie`). Cada gallina se revisa **una de cada cuatro vueltas y sólo si camina** (la que picotea quieta no se revisa); la que huye de vos, que es la que se ve de cerca, en todas. Con un gallinero es, en promedio, menos de un choque por cuadro; con ocho (32 gallinas), unos seis. Al chocar se da vuelta para el lado que la empujó. Si el empujón la deja fuera del corral vuelve a su último lugar libre (así el tope del corral de la 4.0.3 y el choque no se pelean), y si le construyeron encima vuelve a donde nació. La altura es la del piso de obra que pisa (se busca desde la base de su gallinero), o la del terreno. Sin `fisica` (las pruebas viejas) todo es como antes. |
| **B3** | La obra guardaba sólo hasta qué etapa se pagó (`pagadas`), no cuánto: retirar una marca o desmontar devolvía el precio de hoy. Cuando la 4.23.0 bajó ocho precios, lo construido antes devolvía de menos (una herrería de la 4.22 desmontada: $9.000 en vez de $16.000). | `obra-pesos.js`: cada pago queda anotado en la obra (`datos.pagado`, los pesos de cada etapa; las ampliaciones de un depósito, en `datos.pagadoAmp`) y los tres reintegros (Supr sobre la marca, desmontar y su aviso previo, el desalojo al cargar) salen de ahí. Si el precio baja o sube después, se devuelve lo pagado: nunca más. Para lo construido antes, **sólo al cargar** (`cargarProgreso`), se anota el precio viejo (`PRECIOS_ANTES_4_23`, los de `v4.22.0`) cuando se sabe que se pagó así: (a) la partida se guardó por última vez con una versión anterior a la 4.23.0 (`versionJuego`; sin versión es de antes de la 4.10.1), o (b) en una partida ya guardada con la 4.23.0 a la 4.25.2, el libro de la billetera todavía tiene ese pago con el monto viejo («Mano de obra: herrería propia», −$32.000), descontando los reintegros y devoluciones de ese plano que estén en el libro. Lo demás queda sin anotar y devuelve el precio de hoy, como hasta ahora. Un pago que no salió se anota en cero. |
| **G1-5** | En `trigo-abuelo` y `fermin-mulas` la respuesta cariñosa daba +1 de lazo con el mismo nombre de efecto que el +1 de la escena; un efecto repetido en una escena cuenta una vez, así que las dos respuestas valían +1. | La respuesta cariñosa da `lazo:<quien>:2` («copia» con Josefina; «callar» y «querer» con Fermín) y el +1 de la escena queda para la otra respuesta. Total: +2 la cariñosa, +1 la otra, con el tope de lazo de siempre (`cambiarLazo`). |
| **E2-7** | El sexto hachazo al coihue grande pasaba D2 a «talarlo» en cualquier capítulo: antes del 5 dejaba la decisión tomada antes de que Tito preguntara; en los capítulos 9 a 13 cambiaba la deuda, las líneas de cierre y el final. Y el tocón rebrotaba entero a los 9 días mientras las escenas seguían hablando del tocón. | `puedeTalarCoihue(h)`: con la historia en curso el coihue grande sólo se tala si ya decidiste talarlo (D2 = b, en cualquier capítulo: el objetivo nunca queda trabado) o si estás en el capítulo de la rueda con la decisión ya tomada (ahí talarlo igual sigue siendo «cambiar de idea», con el −2 de Josefina, como estaba). Si no, la H no da ni un hachazo y una nota dice por qué («El coihue grande, todavía no» / «El coihue grande queda en pie»); el aviso de la H dice lo mismo. Sin historia (o en pausa) es un árbol más. Con D2 = b y el coihue talado, el tocón **no rebrota** (`avanzarRebrote` con `quieto`), y al cargar una partida donde ya había rebrotado vuelve a ser tocón. |
| **E2-9** | En `fermin-paces` se podía elegir harina, yerba o pan sin tenerlos (no se cobraba nada), y el pan no alcanzaba para que la escena saliera. | El director de escenas acepta `si` en una opción: la que no cumple no se ofrece (si ninguna cumple se ofrecen todas: una elección nunca queda vacía). La condición nueva `tiene` mira lo que llevás. En las paces sólo se ofrece lo que tenés, la escena sale también con pan casero, y el objetivo dice «harina, yerba o pan casero». Salteada, toma la primera que tengas. |
| **E3-10** | Si cerrabas el juego durante la escena de después de ganar la noche, al volver eran las 23 y pico, estabas donde fue la noche y no amanecía. | Al ganar queda anotado `noche.amanecer` **antes** de guardar. Al volver (en el juego, con la historia activa y sin escena corriendo) amanece: otro día, 6:24, en tu galpón, y queda la nota del cuaderno que dejaba la escena. En la misma sesión, al terminar la escena amanece una sola vez, como siempre. |

**Ya estaba arreglado:** de E2-9, la deuda del trato (pagarla gratis o doble) la corrigió la 4.18.4 (`puedePagarLoQueSeDebe`): se revisó y sigue bien; la prueba nueva lo fija.

## No arreglado (y por qué)

- **B3, partidas ya guardadas con la 4.23.0 a la 4.25.2 cuyo pago viejo ya salió del libro** (guarda los últimos 120 movimientos): no hay de dónde saber que la obra es anterior, y devuelven el precio de hoy, como hasta ahora. Se eligió no adivinar para no devolver nunca más de lo pagado.
- **E3-10, partidas cortadas antes de esta versión:** no traen la marca y no se pueden distinguir de alguien que esperó a la noche siguiente. Siguen como estaban (no traba: hay que esperar al alba).
- **E2-7, el coihue talado antes de tiempo en una partida vieja:** la decisión que ya quedó en «talarlo» no se deshace (no se sabe si fue a propósito). Si después se elige «dejarlo en pie», el árbol rebrota como cualquiera.
- **El tocón del coihue en la cuenta del bosque:** como no rebrota, sigue contando en «tocones rebrotando» del resumen. Es sólo el número.

## Decisiones tomadas (para revisar)

- **E2-7 limita una acción:** con la historia en curso ya no se puede talar ese árbol fuera de lo que la historia decidió. Era la raíz del bug; la alternativa (dejar talar sin cambiar D2) dejaba el árbol caído mientras la historia lo da por en pie.
- **G1-5 salteada:** la escena salteada toma la opción por defecto (la primera). En `fermin-mulas` es «callar», que ahora vale +2.
- **B3, bajar de versión:** una partida jugada en la 4.23–4.25.2 y después guardada con un juego anterior a la 4.23.0 se toma como vieja. No es un camino normal.

## Qué mirar en el juego

1. **Gallinas:** un gallinero pegado a una pared o una cerca, y otro sobre un entablado. Que no entren en la casilla ni en la pared, que suban al entablado, que no tiemblen contra un obstáculo en el borde del corral, y correr una contra una pared. Mirar que al chocar no giren raro.
2. **Paces con Fermín (capítulo 11):** con una sola de las tres cosas, que la elección muestre una sola opción y se vea bien; con dos, dos.
3. **El coihue grande:** la H antes del capítulo 5 y en el 11 con «dejarlo en pie» (la nota y el aviso); en el 5 con «talarlo», los seis hachazos; a los 9 días, que siga el tocón.
4. **La noche de la nevada:** ganar, cerrar el juego en la escena del final y volver a abrir: tiene que amanecer en el galpón.
5. **Reintegros:** pagar una pieza con precio, retirarla y desmontarla: los montos de la nota de siempre.

## Cómo se probó

`pruebas/verificar-4-25-3-restantes.mjs` (en `verify:pasos`, antes de `verificar-build-reproducible`): **164 comprobaciones y 44 mutaciones atrapadas** (copias `-mut<n>.js` en `src/`, borradas apenas se cargan). Usa de verdad `gallinero-mundo.js` con `colisiones.js` y `alturaDePie`, `obra-pesos.js`, `guardado.js` (guardar y cargar con un `localStorage` de mentira), el director de escenas con todos los efectos y condiciones de la historia, `historia-disparadores-acto2/3.js`, `bosque.js`, `historia-noche.js` e `historia-noche-ui.js`; de `main.js` corre `cobrarEtapa`, `revisarRebrote`, `usarHacha` y `textoHacha` con un mundo de mentira, y el resto de los enganches se fija por texto. La tabla de precios viejos se compara con lo que anota cada plano («4.23.0: era 32.000») y con los nombres del libro.

Pruebas viejas ajustadas (fijaban el texto de una línea que cambió a propósito), sin aflojarlas:

- `verificar-4-16-0-escenas-acto2.mjs`: pedía que `fermin-mulas` con la respuesta por defecto corriera `lazo:fermin:1`; ahora pide `lazo:fermin:2` con esa respuesta (y que no corra el +1) y `lazo:fermin:1` con «hablar».
- `verificar-4-2-pesos.mjs`: el import de `obra-pesos.js` en main.js (suma `anotarPago`), la línea que cobra la etapa de una casa (ahora también anota cuánto) y las dos de los reintegros (pasan `r.datos?.pagado`).
- `verificar-4-0-3-obras.mjs`: la línea de `devolverEtapasPagadas` al retirar la marca (pasa `r.datos?.pagado`).
- `verificar-4-14-0-escenas.mjs`: el texto que busca su mutación «saltar no resuelve la elección» (la línea ahora toma la opción por defecto entre las ofrecidas); la mutación se sigue atrapando.

## Archivos

- `src/gallinero-mundo.js`, `src/obra-pesos.js`, `src/guardado.js`, `src/almacen-juego.js`, `src/escenas.js`, `src/bosque.js`
- `src/historia.js` (el texto del objetivo), `src/historia-escenas-efectos.js` (`tiene`), `src/historia-escenas-acto2-c5.js`, `-c7.js`, `src/historia-escenas-acto3-c11.js`, `src/historia-disparadores-acto2.js`, `-acto3.js`, `src/historia-noche.js`, `src/historia-noche-ui.js`
- `src/main.js` (gallinas, `cobrarEtapa` y los reintegros, `usarHacha`, `textoHacha`, `revisarRebrote`, `indiceCoihueDeHistoria`)
- `pruebas/verificar-4-25-3-restantes.mjs`, las cuatro pruebas ajustadas de arriba, `package.json` (`verify:pasos`), este documento
