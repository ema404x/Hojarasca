# 4.1 · F4: prólogo y textos del creador de Bruno (17-10-2026)

Rama `creador-bruno-f4` (sale de `v392-mejoras`; sin push, sin tocar `main`). **Todos los textos de esta fase son «propuestos por Claude, a revisar por el usuario»**, salvo las 5 pantallas del prólogo, que son las que eligió el usuario (con el mismo texto, palabra por palabra). Todo el texto vive en **`src/creador-textos.js`**: se edita ahí y nada más (la pantalla de creación, la ficha del cuaderno, el prólogo y la charla de los vecinos leen de ese archivo). Sólo castellano; el inglés queda para el final.

## Qué se hizo

| Pieza | Dónde | Qué es |
|---|---|---|
| Prólogo | `src/creador-prologo.js` (DOM, sin three), textos en `creador-textos.js` (`PROLOGO`, `BOTONES_PROLOGO`) | 5 tarjetas a pantalla completa, una por escena, con fondo de color propio. **Enter, Espacio o flecha derecha**: siguiente; **flecha izquierda**: volver; **Escape** o el botón **«Saltar el prólogo»**: saltarlo. La última tarjeta dice **«Llegar al refugio»** y entra al juego (el jugador aparece en el refugio, como siempre). |
| Cuándo se ve | `personal-bruno.js` (`prologoVisto`, `debeMostrarPrologo`, `prologoVistoAlCrear`) y `main.js` (botón «Entrar al bosque») | Sólo en una **partida nueva del Relax**, **después de crear a Bruno**. No en partidas ya empezadas (con recorrido guardado), no en el Desafío, no al recargar. El estado `prologoVisto` se guarda en `progreso.personal.bruno` con saneo (`true` salvo un `false` explícito: una partida vieja nunca lo ve). Si se cierra el juego en medio del prólogo, vuelve a salir al entrar (hasta terminarlo o saltarlo). |
| 32 tarjetas | `creador-textos.js` (`TARJETAS`) | Frase (hasta 15 palabras), pro y contra (hasta 10 palabras cada uno). Virtud: frase y pro. Defecto: frase y contra. Los gustos llevan siempre su pro de afinidad. |
| Dónde se ven | `creador-pantalla.js`, `creador-ficha.js` | La **frase** de lo elegido, en cursiva debajo de cada fila de la pantalla 2; los **pros y contras** escritos («Tranquilo: Espera sin apuro: los peces pican antes.») en la tarjeta de la izquierda y en la ficha del cuaderno (que además lleva la frase de cada rasgo). Se sacó el cartel «Textos provisorios». |
| 26 líneas de vecinos | `creador-textos.js` (`LINEAS_GUSTO`, `lineaDeGustoCompartido`), enganche `fijarGustosDeBruno` en `vecindad.js` y `main.js` | 8 de asado y 18 de lluvia, una por cada vecino que comparte el gusto según `GUSTOS_DE_VECINOS`. Salen como **tercer renglón de «¿Cómo andás?»** cuando Bruno tiene ese gusto (primero asado, después lluvia). Sólo con Bruno creado y fuera del Desafío; si no, el vecino dice lo de siempre. |
| Revisión de las voces | — | Ver «Revisión de las líneas que le hablan al jugador». No hizo falta cambiar nada. |

## Lo que dicen el pro y el contra (y por qué)

Cada texto dice lo que **realmente hace el juego** (F3), en lenguaje del juego y sin números:

- **Abrigo** → «su ropa abriga un poco más / menos» (±1 punto, al dormir una noche de invierno sin fuego).
- **Afecto** → «cada gesto con los vecinos suma un poco más / menos» (hasta ±20 %). En los gustos: «con quien lo comparte, cada gesto suma un poco más» (el mate: «suma apenas un poco», porque vale la mitad).
- **Pesca** → «los peces pican antes / tardan más en picar» (hasta ±20 % de espera).
- **Cuaderno** → «anota antes el cielo / tarda más en anotar el cielo». En la F3 el cuaderno sólo cambia la mirada que anota **constelaciones y luna llena**; por eso los textos dicen «el cielo» y no «lo que ve», aunque suene raro en un rasgo como Observar aves. Si más adelante se amplía a la fauna (pregunta 2 de la F3), se ajustan 9 textos.
- **Sabor** (sin efecto; el texto es sólo color y la prueba exige que no nombre ningún sistema): Contador (pro y contra), Fotografía, Guitarra y Carpintería (pro y contra) y el contra de Mate, Folklore, Trenes, Asado y Libros.

**Dos diferencias con `RASGOS_BRUNO.md`** (ese documento estaba en «propuesta»; mandó lo que implementó la F1/F3 en `creador-catalogo.js`): **Ahorrativo** pasó de «sabor» a **+1 punto de abrigo**, y **Dormilón** pasó de «sabor» a **−cuaderno** (cielo). Los textos dicen eso. Conviene actualizar `RASGOS_BRUNO.md` o el catálogo, lo que prefiera el usuario (pregunta 3).

## Pruebas (enganchadas a `npm run verify`)

- `pruebas/verificar-4-1-textos.mjs`: están los 32 rasgos del catálogo y sólo esos; largos máximos de cada campo; virtud sin contra y defecto sin pro; sin «…», `TODO`, números ni tuteo; **cada pro y contra dice el sistema y el sentido del efecto del catálogo** y los de sabor no prometen nada; el prólogo tiene 5 pantallas en segunda persona; las 26 líneas son exactamente las de la tabla de gustos (8 y 18) y salen en la charla real de la vecindad sólo si Bruno comparte el gusto; los imports que lee el empaquetador.
- `pruebas/verificar-4-1-prologo.mjs`: el estado saneado, cuándo se muestra, la pantalla con un DOM mínimo (5 tarjetas, teclas, botones, `alTerminar` una sola vez, cierra todo) y el enchufe en el flujo de entrada.
- `pruebas/verificar-4-1-ficha.mjs` se actualizó a los textos nuevos.
- Electron (no entran a `verify`, como los demás `humo-*`): `pruebas/humo-4-1-prologo.cjs` (nuevo: el recorrido completo, el texto dentro de la pantalla a tres tamaños, saltar, recargar, partida vieja) y `pruebas/humo-4-1-creador.cjs` (ahora salta el prólogo).

**Resultados (17-10-2026):** `npm run verify` da **218 pasos OK** (los 216 de antes más las dos pruebas nuevas). En Electron, al monitor externo y con la consola sin errores: `humo-4-1-prologo.cjs` (48 comprobaciones: recorrido completo de las 5 tarjetas con teclado y botones, texto dentro de la pantalla a 1600×900, 1280×720 y 1024×600, saltar con botón y con Escape, no vuelve al recargar, una partida ya empezada que crea a Bruno no ve el prólogo), `humo-4-1-creador.cjs` y `humo-4-1-efectos.cjs` (verdes). Capturas (las 5 pantallas del prólogo, la pantalla de creación con frases, pros y contras, la ficha del cuaderno y la llegada) en `Hojarasca\trabajo\f4\`.

Dos arreglos de pruebas que salieron en el camino: `humo-4-1-creador.cjs` fallaba con un perfil de Electron usado de antes (la página que se descarga vuelve a guardar la partida después del `localStorage.clear()`), ahora descarga primero y borra después; y `verificar-4-1-efectos-afecto.mjs` comparaba la línea de import de `vecindad.js` de `main.js` palabra por palabra.

**Lo que no se probó:** el prólogo con el juego en inglés (todo está en castellano a propósito); el prólogo con mando; el costo del prólogo en la placa integrada (es sólo DOM y CSS, sin three, pero no se midió); las líneas de los vecinos en una conversación real dentro del juego (se probaron con la vecindad real en Node, no apuntando a un vecino con E).

## Revisión de las líneas que le hablan al jugador

Se leyeron las voces de los vecinos (`vecindad-voces.js`, `vecindad-social-voces.js`), las cartas (`correo.js`, `noticias.js`), la historia, el diario, la guía y los textos de la aldea buscando algo que choque con **Bruno varón, de 27 años, que viene de la ciudad**. No hay nada que corregir: las cartas de la familia ya lo tratan en masculino («Hijo», «Querido nieto», «Querido sobrino», «se te nota contento»), la hermana escribe desde Buenos Aires (coincide con «la ciudad» del prólogo), los vecinos lo llaman «vecino», «compañero», «muchacho», «hermano», y los femeninos que aparecen («me dejaste contenta», «de chica», «sola») son de las vecinas hablando de sí mismas. Lo único a notar, que **no choca**: las cartas de la familia dicen que tiene hermana y hermano (Facundo) y que la madre se llama Susana; Bruno puede tener un oficio de antes distinto según lo que elija, y ninguna carta lo menciona.

## Decisiones que tomé sin consultar (para que las revises)

1. **Dónde salen las líneas de asado y lluvia:** como tercer renglón de «¿Cómo andás?», no al saludar. Es lo más conservador (no se interpone en el saludo ni en los comentarios de lo que hiciste) y se repite cada vez que se pregunta; si te molesta que se repita, se puede limitar a una vez por día con una banderita en la ficha del vecino.
2. **El prólogo se decide al crear a Bruno** (partida nueva del Relax = sin recorrido guardado) y queda pendiente hasta verlo o saltarlo. Crear a Bruno desde «Personalizar» en una partida sin recorrido también lo dispara al entrar.
3. **Sin música ni ilustración en el prólogo:** sólo texto sobre un fondo de color por escena (ciudad gris, mañana fría, viaje, valle al atardecer, noche tibia). Es lo más simple y no suma nada al costo; ilustraciones o sonido ambiente serían trabajo aparte.
4. **Los textos de interfaz propios** (botones «Siguiente», «Volver», «Saltar el prólogo», «Llegar al refugio» y la ayuda «Enter o flecha derecha: seguir · Escape: saltar») son propuestos por mí. No toqué los títulos y botones de la creación («Siguiente», «Volver», «Al azar», «Empezar») porque ya estaban.
5. **Las frases en tercera persona** («Se toma el tiempo para todo…»): los ejemplos que aprobaste estaban así; el prólogo y la ficha hablan de «Bruno» y la narración del prólogo es en segunda persona.
6. **Se sacó el cartel «Textos provisorios»** de la pantalla de creación (ya no son provisorios del todo, pero siguen a tu revisión; la marca quedó en el código y acá).
7. **Gustos:** el pro de cada gusto se muestra en la lista «A su favor» (antes no se listaba nada). El contra de sabor de los gustos ahora **sí** se lista (antes se ocultaba porque no tenía texto): es una línea de color, sin efecto.
8. **Nombres de los conjuntos del guardarropa y aviso «te falta el poncho»** (provisorios de la F3): **no los toqué**; siguen pendientes (pregunta 4).

## Preguntas para vos (no las implementé)

1. **Revisar los textos.** Los 32 rasgos y las 26 líneas están en `src/creador-textos.js`; se cambian ahí sin tocar nada más (después `node armar.mjs` y `npm run verify` avisan si un largo se pasó).
2. **¿Querés que el prólogo tenga música o una imagen por escena?** Hoy es sólo texto con fondo de color.
3. **`RASGOS_BRUNO.md` dice sabor para Ahorrativo y Dormilón, pero el catálogo (y por lo tanto el juego) les da efecto.** ¿Dejo el juego como está (y corrijo el documento) o los vuelvo de sabor?
4. **Textos provisorios que quedan de la F3:** nombres de los cinco conjuntos del guardarropa y el aviso «te falta el poncho». ¿Los escribo yo también, con el mismo método?
5. **Frases de «Tu historia» de las pantallas** (títulos «1 · Su aspecto», «2 · Su historia», aviso «ya está al máximo», frase de apertura de la ficha, nombre y frase del espejo, texto de la partida vieja): siguen siendo los de la F2; no estaban en la lista de esta fase.
6. **Mando:** el prólogo, igual que la creación, no se completa con mando (deuda antes de Steam).
7. **Inglés:** todo lo de esta fase queda sin traducir (a propósito).
