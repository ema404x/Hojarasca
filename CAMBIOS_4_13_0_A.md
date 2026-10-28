# 4.13.0 (agente A) · Duendes en la Historia: presencia, encuentro con elección y armas

Rama `v4130-a` (sale de `main` = 4.12.3; ya con la rama de B mergeada). No se subió la versión, no se tocó `main`, sin etiqueta ni zip. Pasos 1 y 2 de `DECISIONES_HISTORIA_DUENDES.md`; el paso 3 (la noche y los finales) es de B (`CAMBIOS_4_13_0_B.md`).

## Qué se hizo
- **Infraestructura** (`src/historia-duendes.js`): `crearDuendesHistoria(ctx)` (API documentada en el encabezado del archivo). Instala y precalienta los modelos del Desafío (`instalarDuendes` + `precalentarDuendes`) **sólo si la Historia está en marcha**, y en la carga; duendes sueltos (`aparecer` → `mirar`, `irA`, `huir`, `saludar`, `reir`, `esconder`, `quitar`) con el animador del Desafío pero sin vida, daño ni IA; reciclados (cada duende creado gasta una fila de la textura de huesos para siempre). La voz: `reirDuende` apaga `sonido.relax` **sólo durante la llamada** (el Relax normal sigue mudo; la risa de los duendes no cambió).
- **Presencia** (`src/historia-presencia.js`), capítulos 5 y 6 (lago y molino): siluetas al anochecer (17:30 a 21:30) entre los árboles, a 38–52 m, que miran y se esconden si te acercás (con trato dejan acercarse a 13 m y a veces saludan; sin trato se van a 30 m); risa lejana de noche (21 a 4); dos «luciérnagas raras» azuladas y violetas (halos del sistema de los duendes, ningún shader nuevo); con trato, un atadito de ramitas en la puerta del refugio por la mañana (hasta 3, cobra al pasar cerca). Cuenta `vistos` cuando una silueta estuvo a la vista unos segundos.
- **Encuentro** (evento `duendes-galpon`, momento del capítulo 5 con `lugar: 'galpon'`): cuando lo demás del capítulo está hecho, de noche (18 a 3 h) y cerca del Galpón de Esquila, dos duendes esperan en el portón con una luz verdosa; a 14 m sale la tarjeta con tres opciones (sin diálogos de los duendes): **dejarles yerba** y **seguir la luz** (las dos son TRATO) y **gritarles y espantarlos** (PELEA). Después se van según lo elegido (saludan y se van caminando, o salen corriendo riéndose). Es sólo-Historia (`soloHistoria`): nunca sale al azar.
- **Misiones de las armas** (capítulo 7, objetivo `armas`, meta 2): tarjeta de Josefina (**arco**: 4 tablas, 1 tronco, 2 horas) y, al otro día, la de Ramón (**honda**: 5 piedras y 4 ramitas, 1 hora), encadenadas por seguimientos; «todavía no» vuelve a preguntar al día siguiente. Si algo se pierde en el camino, `armaPorPedir` la vuelve a pedir. Sin vecinos el objetivo se da por hecho (regla de siempre) y las armas no se tienen: la noche de B las presta igual.
- **Hito de la noche**: con el trato y las dos armas, `duendes.noche` pasa de `'ninguna'` a `'pendiente'` (`revisarNoche`). B lo espeja y escribe `ganada`/`perdida`.

## Esquema de guardado (`progreso.historia.duendes`)
```
{ trato: null|'trato'|'pelea',    // el encuentro del galpón
  vistos: n, regalos: n (tope 3),
  armas: { arco: bool, honda: bool },
  noche: 'ninguna'|'pendiente'|'ganada'|'perdida',
  final: null|'trato'|'pelea', intentos: n }
```
Default seguro (`duendesNuevos`), saneado en `sanearHistoria` (`sanearDuendes`: basura, valores inventados, topes); una partida vieja sin el campo abre con el default. Helpers: `duendesDe`, `hacerTrato`, `ganarArma`, `revisarNoche`, `armaPorPedir`, `hayPresencia`. El merge con la rama de B dejó `duendes: duendesNuevos(), noche: nocheNueva()` y las dos asignaciones.

## Decisiones propias
1. **Las armas se hacen con tarjetas de los vecinos**, no con una tecla E nueva: no se toca la tabla de interacciones (67 entradas, 20 mil comprobaciones) ni hace falta construir una carpintería de $22.000.
2. **Capítulos**: sin capítulos nuevos (siguen 8). El capítulo 5 queda con 4 objetivos y el 7 con 5: la prueba 3-1 pedía «2 a 4»; **se subió a «2 a 5»** y los eventos de «10 a 12» a **«10 a 14»** (tres eventos nuevos, sólo de la Historia). `verificar-3-8-7-progreso` fijaba el texto exacto de la línea de `momentoPerdido`; se le sumó `&& lugarOk` (el galpón) y la prueba se ajustó a eso.
3. El resumen de la guía («N cosas pasaron de M que pueden pasar») no cuenta los eventos sólo-Historia.
4. **Sin «huellitas»**: se evitó sumar geometría y materiales; quedan siluetas, risas, luciérnagas raras y regalitos.
5. **Dónde se instala**: `duendesHistoria()?.paraCompilar()` va **después de `gente?.trasCompilar?.()`** (aviso de B: antes, el programa de sombra de la silueta del jugador se compila tarde, 109 → 110). Si la Historia se empieza ya con el juego andando, se arma bajo la pausa/tarjeta (`alActivarHistoria`) y se compila contra la salida del posproceso.

## Verificación
- `pruebas/verificar-4-13-0-historia-a.mjs` (en el gate): 192 comprobaciones (esquema y basura, capítulos y momentos, eventos y cadenas, ventanas de hora y puntos, infraestructura con el three local —aparece, mira, camina, huye, se recicla—, enganche) y **18 mutaciones atrapadas**.
- `pruebas/humo-4-13-0-historia-a.cjs`: partida real (ver el resultado abajo).
- Ajustes mínimos: `verificar-3-1-historia.mjs` (topes, tipos de efecto) y `verificar-3-8-7-progreso.mjs` (línea con `lugarOk`).

## Resultado de las corridas
- **Gate:**  de corrido: **verify: 316 pasos OK** (con la rama de B mergeada).
- **Partida real de A** (, Media, Visible): todo en orden. Programas de shader: 110 al terminar la carga y 110 después de pisar el refugio, de noche y con siluetas, luciérnagas y duendes del galpón (0 nuevos). Aparece la silueta, se va si te acercás, el galpón trae la tarjeta con tres opciones, trato y pelea se guardan (y el trato sobrevive a recargar), el arco y la honda encadenados con el «todavía no», el objetivo se tilda y la noche queda pendiente; en Libre no se instala nada.
- **Partida real de B** () sobre la rama juntada: todo en orden (la noche de pelea y de trato, los dos finales, 110 → 110 programas).
- **Capturas** (, no van al repositorio): de noche en el galpón se ven los ojos verdes de los dos duendes en el portón (se lee bien y es ambiguo); la tarjeta del encuentro y las del arco.

## Lo que no se vio
- Las siluetas de día entre el pasto alto: en las capturas no se distinguen (el pasto las tapa, aun a 1,6 de escala); sólo se confirmó su dibujo por el conteo de mallas instanciadas y los ojos de noche. Falta mirarlas jugando.
- La risa a oído, las luciérnagas raras en movimiento y el regalito en la puerta (la lógica está probada en Node; el regalito no tiene captura).
- Una partida de punta a punta con las manos (caps 5 a 8 seguidos): se probó por tramos con el progreso armado.
- Fps en la 4600G.

