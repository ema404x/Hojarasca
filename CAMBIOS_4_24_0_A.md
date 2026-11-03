# Hojarasca 4.24.0 (parte A) — no te pierdas

Rama `v4240-a`, sobre `main` = 4.23.0. No se subió la versión (lo hace el cierre). Es la parte A de la 4.24.0: el hallazgo 5 de `AUDITORIA_4_20_0_B.md` (el mapa no dibujaba nada del objetivo actual, el panel del capítulo 11 trae 12 objetivos contra una mediana de 6 y la guía no decía las teclas de la Historia). **No cambia ninguna regla del juego**: nada se traba, nada se pierde; todo es ayuda para orientarse. 0 programas de shader nuevos, 0 texturas, 0 llamadas de dibujo en el mundo (todo es HUD y papel del mapa).

## Resumen de decisiones
| tema | decisión |
|---|---|
| Marca del objetivo | **Automática en el mapa** (una banderita colorada con el nombre del lugar, hasta **4** a la vez, en el orden del panel) y **un clic en la marca** pone el rumbo en la brújula (otro clic lo suelta; se suelta sola al cumplirse el objetivo o al pausar la Historia). No se sumó una tecla nueva: las teclas son reasignables por el jugador (`accesibilidad.js`) y la N/K/Y ya están tomadas; el mapa (M) ya es donde se ve y se toca. El panel agrega una línea gris «En el mapa: Puesto Alto, …». |
| Sin spoilers | Una marca sale **sólo si el texto del objetivo, tal como lo lee el jugador, nombra el lugar** (palabras por lugar en `PUNTOS_MARCA`), o si es la casa de alguien a quien ya conocés (hablaste con él o su lazo se movió). «Seguí las huellas», «Juntá a los vecinos en tu mesa» o «Mostrale el cuaderno a Josefina» (sin conocerla) no se marcan. |
| De dónde sale el punto | Escena del objetivo → `lugar` de su disparador (22), o vecino de casa conocida (`HOGARES`, 10), o la tabla `EXTRAS` de 7 objetivos que no se cumplen con escena pero nombran el lugar (llegar al refugio, el hacha en el almacén de Ercilia, el faro, golpear en el galpón, Tito, los blancos del Puesto del Paso y de la esquila). |
| Lugares con nombre | El mapa escribe **molino viejo y coihue grande** (desde el capítulo 5, que los nombra, o si la escena de la bolsa te llevó), **panadería** (Rosa en la aldea y la conocés), **carpintería** (Tito en la aldea y desde el capítulo 11 o si lo conocés), **estudio de fotos** (Sofía en la aldea y le llevaste la foto) y **raíz de Ramón** (recién cuando viste la escena del amanecer: antes sería el spoiler de las huellas). |
| Cadenas del capítulo 11 | **El arco** (6 pasos) y **La honda** (3) con título y contador («El arco · 3 de 6»); lo hecho de una cadena se cuenta y no se lista; una cadena terminada queda en una línea verde. **Lo prestado** queda como línea suelta: tiene un solo objetivo y ya trae su cuenta («2/3»), un título habría repetido lo mismo. Es la única diferencia con la letra del brief («las tres cadenas bajo un título»). |
| Panel que se achica | Nuevo: si el panel no entra en la ventana **o pisa la barra de la mano** (medido en vivo con `getBoundingClientRect`; en 1024 de ancho la barra queda justo a la derecha del panel), de cada cadena queda **el próximo paso y «y N pasos más»**; si todavía no entra, se van las optativas («De paso, si querés»); y como último recurso lo ya cumplido que quedó suelto y la barra del ramal. Un objetivo pendiente suelto **nunca** se esconde. |
| Guía | La caja «La historia del valle» (F1) suma «Teclas de la historia: E hablar o tomar · R esperar sentado · M mapa · J cuaderno» (con las teclas que eligió el jugador) y una línea que cuenta la marca del mapa. |

## Archivos
- `src/historia-marca.js` (nuevo, puro): `PUNTOS_MARCA`, `HOGARES`, `EXTRAS`, `puntosDeObjetivo`, `sePuedeMarcar`, `marcasDeObjetivos`, `lugaresConocidos`, `GRUPOS_PANEL`, `filasDelPanel`.
- `src/historia-ui.js`: panel con cadenas, línea «En el mapa», achique por medida real, línea de teclas en la guía, y `valle.marcasObjetivo()` / `valle.lugaresConocidos()`.
- `src/chinches.js`: `marcasAutomaticas` acepta `objetivos` (clase `objetivo`, con `activa`).
- `src/mapa.js`: dibujo de la banderita (con redondel la que sigue la brújula) y su rótulo, que no se repite si el mismo nombre ya está escrito cerca ni se escribe encima de otro (en la aldea, apretada, queda sólo la banderita; el panel dice el nombre).
- `src/main.js` (quirúrgico): `marcasDeObjetivo()` (caché de 1 s), clic en la marca en `tocarMapa`, rumbo que se suelta en `actualizarBrujula`, y los lugares conocidos en `dibujarMapa`.
- `pruebas/verificar-4-24-0-a.mjs`, `pruebas/humo-4-24-0-a.cjs`, `herramientas/correr-humo-4-24-0-a.ps1`; `package.json` (la prueba en `verify:pasos`).
- `historia.js` y los demás archivos de Historia **no se tocaron** (zona de B).

## Claves nuevas de guardado
**Ninguna.** El rumbo hacia un objetivo no es una chinche: no ocupa lugar de las 12 ni se guarda (se arma en cada partida desde el estado de la Historia). Las partidas viejas andan igual.

## Pruebas
- `pruebas/verificar-4-24-0-a.mjs`: 144 comprobaciones y **39 mutaciones** atrapadas (cada una sobre una copia de `src/`, un proceso por mutación). Cubre: la tabla de lugares contra `puntosDeHistoria`, cobertura (≥ 33 de los 85 objetivos con lugar, ≥ 28 marcables sólo con el texto), cada caso sin spoiler, el minuto uno, los trece capítulos, el tope de cuatro, los seis lugares conocidos, las cadenas y su modo compacto, el panel real de `historia-ui.js` con medidas falsas, la guía con teclas reasignadas, el dibujo del mapa con un lienzo de mentira, el clic en la marca / la chinche que gana / el papel vacío, el caché de un segundo y el cableado.
- `pruebas/humo-4-24-0-a.cjs`: partida real en Electron (ver abajo).

## Partida real (Electron, `pruebas/humo-4-24-0-a.cjs`, vía `herramientas/correr-humo-4-24-0-a.ps1` con el candado, `-Espera 2700`, monitor externo, perfil propio)
Corrida final en verde («Todo en orden»; capturas en `pruebas/salidas/humo-4-24-0-a/`). Una Historia que empieza de verdad desde la portada, y capítulos puestos a mano:
- **Minuto uno**: el panel dice «En el mapa: Refugio del Arroyo» y el mapa dibuja la banderita (87 píxeles del color en la ventana de control); un clic en la marca pone «Refugio del Arroyo · 129 m» en la brújula; acercándose baja (129 a 65 m); otro clic la suelta; al llegar y cumplirse «Llegá al Refugio» la marca y el rumbo se van solos. No quedó ninguna chinche guardada.
- **Capítulo 5**: marcas del molino viejo y del Puesto Alto (85 y 89 píxeles), el mapa nombra «Molino viejo» y «Coihue grande»; el clic en la marca no deja chinche; un clic en el papel vacío sigue poniendo una (y la brújula va a ella).
- **Capítulo 11**: 1366x768 panel de 643 px (92 a 735; sin barra de la mano encima, completo); 1024x600 el panel se achica solo a 418 px (92 a 510; la barra de la mano arranca en ~527), compacto y sin las optativas. Cadenas «El arco 4 de 6» y «La honda 1 de 3».
- **Capítulo 13**: cuatro marcas distintas en el papel.
- **Guía** (F1) en las dos medidas: la línea de teclas con las de fábrica y la de la marca del mapa, sin desborde.
- Programas de shader 111 a 111.

## Sin ver / pendiente
- No se vio a ojo: las marcas con teclas **reasignadas** en una partida real (sólo la prueba de código); la brújula con el rumbo a un objetivo **de noche o con lluvia**; el panel con el aviso de espera más largo y todas las optativas abiertas en 1024x600 (se vio el capítulo 11 con las del momento); caminar de verdad (a pie, sin teletransportar) los 129 m hasta el refugio con la brújula puesta; el mapa con una chinche propia encima de la banderita; modo Media y Baja; el Desafío (se probó por código que no marca ni nombra nada).
- No se hizo: una tecla para ir al objetivo sin abrir el mapa (queda el clic en la marca; si se quiere una tecla, hay que sumar la acción a `accesibilidad.js` y a sus pruebas); marca para los vecinos que andan por la plaza (Elvira, Anselmo, Martín, Guido: sin casa propia); el nombre «Plaza de la aldea» no se escribe en el papel cuando no hay lugar (sólo la banderita y el panel); el inglés (todo en castellano).
- Las pruebas viejas no se ajustaron: ninguna contaba lo que cambió.
