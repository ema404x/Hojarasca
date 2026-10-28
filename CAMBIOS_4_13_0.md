# Hojarasca 4.13.0 — Duendes en la Historia

Rama `v4130-a` (ya con `v4130-b` juntada) sobre `main` = 4.12.3. Detalle en `CAMBIOS_4_13_0_A.md` (presencia, encuentro y armas) y `CAMBIOS_4_13_0_B.md` (la noche y los dos finales). Decisiones del usuario: `DECISIONES_HISTORIA_DUENDES.md`. Es la base sobre la que se escribe la Historia nueva (`DECISIONES_HISTORIA_NUEVA.md`, `GUION_HISTORIA.md` en la rama `guion-historia`).

## Qué trae (sólo en el modo Historia; el Desafío y el Relax libre no cambian)
- **Presencia (capítulos 5 y 6):** siluetas de duendes al anochecer, una risa lejana de noche, luciérnagas raras y, con trato, un regalito en la puerta. Sin pelea; los duendes sólo se ven y se oyen.
- **Encuentro en el galpón (de noche):** tres opciones sin diálogos de los duendes (dos de trato y una de pelea); la elección queda guardada.
- **Armas:** el arco (Josefina) y la honda (Ramón) se consiguen con tarjetas de los vecinos y materiales; el capítulo 7 gana el objetivo de las armas. Con trato y las dos armas, la noche queda pendiente.
- **La noche de defensa (~3 min):** un solo lado de ataque, estacas, portón y antorchas, hasta 10 duendes; arco (se tensa manteniendo el clic) y honda. Con **pelea** es una defensa real (se pierde por vida o porque cae la puerta); con **trato** es una prueba (nadie lastima a nadie; se pierde con 7 travesuras en la puerta). Perder no cuesta nada y se reintenta sin límite. No usa el motor del Desafío ni su guardado.
- **Dos finales** cortos y sin nada explícito: «El valle en silencio» (pelea) y «El trato». «Seguir» cierra la historia con el premio (el poncho) una sola vez; «Ver los créditos» abre los del juego.

## Decisiones de la junta
- Conflictos de `historia.js` (`historiaNueva` y `sanearHistoria`) resueltos dejando las dos cosas (`duendes` y `noche`); `package.json` con `fusionar-pkg`.
- La precompilación de los duendes va después de `gente?.trasCompilar?.()` para no volver a tener el programa de sombra de la silueta del jugador (el de la 4.12.3) compilándose tarde.
- Topes de pruebas ajustados a propósito: objetivos por capítulo 2 a 5 (el capítulo 7 gana el de las armas) y eventos del valle 10 a 14 (tres nuevos, sólo de Historia).

## Verificación
- `npm run verify` de corrido: **316 pasos OK**. Pruebas nuevas: A, 192 comprobaciones y 18 de 18 mutaciones atrapadas; B, 131 comprobaciones y 26 mutaciones.
- Partidas reales (sin errores de consola, 110 programas de shader siempre, 0 nuevos en juego): `humo-4-13-0-historia-a` (silueta, galpón con trato y con pelea, armas, noche pendiente, recarga, Libre sin duendes) y `humo-4-13-0-historia-b` (las dos elecciones, perder y reintentar, ganar con el final correcto, el Relax no cambia).
- Costo de la noche en la notebook: ~+7 dibujos en Media y ~+11 en Alta, p95 +0,2 y +0,7 ms, dentro del ruido.

## Pendiente
- **Sin ver:** las siluetas de día entre el pasto alto (no se distinguen en las capturas; de noche se ven los ojos verdes), la risa y el regalito a oído y a ojo, una partida completa de los capítulos 5 a 8 de corrido, y la noche jugada con el mouse bloqueado de verdad.
- **Sin medir en la 4600G** (comando en `CAMBIOS_4_13_0_B.md`: `herramientas/medir-noche-4-13-0.cjs`).
- El balance de la noche (números en `NOCHE` y `GUION` de `historia-noche.js`) lo tiene que juzgar una persona jugando.
- Textos sólo en castellano (inglés al final).
