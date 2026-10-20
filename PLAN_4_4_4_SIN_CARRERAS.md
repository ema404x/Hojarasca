# Hojarasca 4.4.4 — sacar las carreras contrarreloj y el torneo semanal (plan del 21-10-2026)

**Decisión del usuario, sólo conversada; todavía no se ejecutó nada** (la rama `v444-sin-carreras` quedó vacía, sin commits).

## Qué se elimina
- **Las carreras contrarreloj** (3.1): `src/carreras.js` (reglas y 6 circuitos: la vuelta de la estepa y la pampa del sur a caballo, el cross del mirador y la loma del faro a pie, la vuelta del lago en kayak y la regata del faro a vela) y `src/carreras-mundo.js` (los postes de largada con banderín y cartel repartidos por el valle, las puertas con banderas o boyas, la columna de luz y el fantasma de tu mejor vuelta). El usuario los llamó «los desafíos que están por todo el mapa con un banderín».
- **El torneo semanal** (`src/torneo.js`, `src/torneo-sync.js`): pesca (el pez más grande de una especie), carrera (el mejor tiempo de un circuito) y defensa (las noches resistidas en el Desafío con el código de la semana), con la tabla compartida entre PCs y el código corto para amigos.
- Todo lo que los usa: `src/modos-juego.js` (51 menciones), 7 enganches en `src/main.js`, `src/diarios.js` (6), `src/guardado.js` (3), guía F1, cuaderno, textos, README, STEAM_*, y las pruebas `verificar-3-1-carreras.mjs`, `humo-3-1-carreras.cjs` y partes de `verificar-3-5-1-relax.mjs`, `verificar-3-8-6-base.mjs`, `verificar-3-8-6-relax.mjs` y `verificar-3-8-8-banderas.mjs`.

## Qué se conserva
- **El código de la semana del Desafío** (`src/semilla.js`), para jugar con amigos.
- La pesca normal, el Desafío (La noche de los duendes), el caballo, el kayak, el velero y la trochita.
- Las banderas con viento que no son de las carreras (plaza, escuela, seccional, casa de té, locomotora y la del jugador).

## Reglas de la eliminación
- Los archivos de torneo que ya dejaron las PCs en la carpeta sincronizada (`hojarasca-torneo-<pc>.json`) se **ignoran** (no se borran).
- Las partidas viejas con tiempos de carrera o puntos de torneo deben cargar sin errores, ignorando esos campos.
- Eliminación completa: ni un poste, banderín ni cartel de carrera en el mapa; el gate sigue en verde sin pruebas de lo que ya no existe; el resto del juego no cambia (debería pesar un poco menos).

## Cómo se haría
Un agente en una rama nueva a partir de la última (4.4.3 o posterior): primero un inventario de cada archivo y línea que depende de las carreras, después la eliminación de punta a punta, una prueba `verificar-4-4-4-sin-carreras.mjs`, una partida real que recorra la estepa, el mirador, el faro y el lago sin postes ni errores, y `npm run verify` completo. Orden de las tareas pendientes: 1) esta, 2) auditoría del mapa, 3) paquete 1a, 4) paquete 1b (ver `PLAN_MAPA_VALOR.md`).
