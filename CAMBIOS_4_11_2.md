# Hojarasca 4.11.2 — Mundo y gente (tercera de cuatro versiones con las decisiones de diseño)

Rama `v4112-integra` (sobre `main` = 4.11.1). Juntada de `v4112-a` (`CAMBIOS_4_11_2_A.md`) y `v4112-b` (`CAMBIOS_4_11_2_B.md`).
Decisiones del usuario: `DECISIONES_DISENO_4_10.md`. Sigue la 4.11.3 (proceso y guardado).

## Qué trae
- **Choques en tus edificios:** barriles y mesas de la herrería, la carpintería, la panadería, la cervecería, la tienda, la quesería y la cantería ya no se atraviesan (desde afuera se llega igual a usar cada edificio con E). La mesa del torreón ya estaba corrida desde la 4.10.4 (se comprobó caminando).
- **Sombras de antorchas:** tres niveles de opacidad según la antorcha de cada sombra, sin luces ni shaders nuevos.
- **Madrigueras en ladera:** el suelo sigue el terreno (unos 67 KB por madriguera en ladera; los dibujos y triángulos no cambian). **Postes del tablero de trofeos:** llegan al suelo en laderas laterales.
- **Diario y tablón:** el diario anota «Conocí a…» una vez por persona (Fermín, Belisario, Tobías); hay un encargo nuevo del Puesto Alto (1 llao llao seco, $1.650); cada papel tomado tiene un botón «Soltar» (también Retroceso y el número).
- **Gente:** Fermín, Belisario y Tobías reintentan armarse cada 25 s si no hubo lugar (hasta 8 veces); contratar a un compadre que está de visita corta la visita; la novia empleada ya no queda a tu lado y detrás del mostrador a la vez (se reprodujo en partida real); el empleado que termina el turno sale caminando desde el local.
- **Economía y textos:** la panadera cobra 3 panes por $600; la demanda de la Casa de Té sigue el calendario; la picada de la tarde dice «entre las 19 y las 22».

## Decisiones de la junta
- Conflicto sólo en `package.json` (línea `verify:pasos`), resuelto con las dos pruebas nuevas.
- El encargo del Puesto Alto usa llao llao seco (ya existe, pide la herbolaria). Los textos nuevos están sólo en castellano.

## Verificación
- `npm run verify` de corrido: **302 pasos OK** (300 de la 4.11.1 + una prueba por agente).
- Partidas reales sobre la junta (ocultas, de a una, en el monitor externo): `humo-4-11-2-gente`, `humo-4-4-2-empleo` (28 bien), `humo-4-11-1-interfaz` en verde; `humo-4-11-2-mundo` en verde con `-Visible` (oculta cae por `UnknownVizError` al sacar la captura); `humo-4-10-base` falló una vez por tiempo (`enTren`, mundo no listo) y pasó al repetirla; `humo-3-5-1-desafio` sin líneas fallidas.
- Mutaciones a propósito: 14 (mundo) y una por regla en gente.

## Pendiente
- **Sin ver** con letra grande o con otros temas el botón «Soltar»; D2 con la novia caminando por el valle; D1 en partida real; V10 sólo en una escena; textos nuevos sin inglés.
- `humo-4-2-oficios`, `humo-3-0-contra`, `humo-3-6-aldea` y `humo-3-9-0-cantina` ya fallaban en la 4.11.1 (no son de esta versión).
