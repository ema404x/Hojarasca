# Hojarasca 4.12.0 — Mejora visual 1: bordes suaves, rocas y terreno

Rama `v4120-integra` (sobre `main` = 4.11.5). Juntada de `v4120-a` (`CAMBIOS_4_12_0_A.md`) y `v4120-b` (`CAMBIOS_4_12_0_B.md`).
Primera de cuatro versiones de la gran mejora visual (4.12.1 agua y edificios, 4.12.2 animales con huesos, 4.12.3 sombras lejanas). Sólo Media y Alta gastan rendimiento extra.

## Qué trae
- **Bordes suaves (FXAA)** en Media y Alta, dentro de la pasada final del postproceso (sin pasadas ni dibujos nuevos, no emborrona el texto). Costo medido en la notebook: ~+0,15 ms en Media, ~0 en Alta. MSAA quedó programado pero apagado (+2,4 a +3,8 ms). Baja y Mínima quedan como estaban. Además el shader de los rayos de sol se precompila al armar el postproceso (antes se compilaba la primera vez que el sol entraba en cuadro).
- **Cinco modelos de roca** en Media y Alta: peñasco, lajas apiladas, canto rodado, roca partida y peña con musgo y líquenes. Escala, giro y hundimiento propios por piedra. Árboles, matas, choques y cantidad de rocas dan la misma huella que la 4.11.5. Baja y Mínima conservan la piedra de siempre.
- **Terreno con más variedad** (Media y Alta): franjas de pasto seco y verde hondo en el prado, musgo, hojarasca y pozos oscuros bajo las copas, tierra pelada en claros ralos, borde de pasto quemado y pedregullo en el camino, borde del bosque más dorado, manchas tibias y frías en la estepa. Sin luces ni shaders nuevos, sin tocar alturas.

## Decisiones de la junta
- Conflicto sólo en `package.json` (línea `verify:pasos`), resuelto con las dos pruebas nuevas.
- Los dibujos por cuadro suben hasta 4 por las rocas (uno por modelo a la vista); los triángulos quedan iguales.

## Verificación
- `npm run verify` de corrido: ver línea final en RELEASE_STATUS (pasos OK con las dos pruebas nuevas sumadas).
- A: 50 comprobaciones y 23 mutaciones atrapadas; B: 151 comprobaciones y 28 mutaciones atrapadas.
- Capturas antes y después en Media y Alta, vistas por cada agente. Partidas reales de cada agente en verde (A: 25 pasos en las cuatro calidades; B: sin errores de consola ni de shader).

## Pendiente
- **Sin medir** en la Ryzen 5 4600G (los comandos están en cada CAMBIOS).
- **Sin ver:** noche, lluvia, nieve, otoño, el movimiento (ramas y pasto con viento) y el prado desde el suelo.
