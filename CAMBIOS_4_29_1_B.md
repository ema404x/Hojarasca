# 4.29.1 (B) · los bugs anotados del pueblo

Sin shaders nuevos, sin claves de guardado nuevas. Prueba: `pruebas/verificar-4-29-1-b.mjs` (en `verify:pasos`): 18 mutaciones atrapadas. Vistas en partida real: `herramientas/correr-humo-4-29-1-b-vistas.ps1` (capturas en `pruebas/salidas/humo-4-29-1-b-vistas`).

| # | Qué | Cambio | Visto |
|---|-----|--------|-------|
| 1 | Cola de la noche en la puerta de la estación | **Sin cambio.** Dos corridas (22,5 a 24 h y 22,7 a 23,4 h) con `humo-4-29-1-b.cjs`: no hay cola en la puerta. Sólo 2 a 3 vecinos que salen juntos de la cantina a las 23:10 y caminan solapados hacia la esquina de la calle de la vía: gente de paso, no trabados (no hay evitación entre vecinos; arreglarlo sería otra cosa). | sí |
| 2 | V con charla o panel | `soltarRanura` no hace nada con charla, menú de la charla, panel del HUD, panel de afuera del HUD o personalizar abiertos. Se sacó el redibujado del puesto de 4.26.5 (ya sin uso). | puesto y charla: no tira; sin nada: tira |
| 3 | «E para subir» | sólo si `tren.puedeSubir`; si no, «acercate a una puerta». | en 8 puntos del andén coincide siempre con lo que hace la E, y la E sube |
| 4 | Cartel del banco | Dos renglones en la misma celda: «Lun a sáb 8:30 a 12:30 y 14:30 a 18» / «Sáb. de baile hasta las 16 · Dom. cerrado» (`HORARIO_BANCO_CARTEL`). Un poco más alto (0,24 m). | captura de cerca (legible; de lejos no se lee, como el cartel viejo) |
| 5 | Bajos del alero del andén | `emissive: 0x241a12` en el alero de `trochita.js` (Aldea y Estación del Valle). | capturas de día, ocaso y noche (`2-anden-*`); a ojo se ve madera oscura, no hueco negro |
| 6 | Suelo visto vs pisado | Parche con nodos cada 1 m (`PASO_PARCHE`). Causa: terreno bilineal en celdas de 2 m contra triángulos del parche. Partida (1407 puntos cada 4 m): antes 53 puntos >10 cm y máx. 42 cm (4.26.5); ahora 3 >10 cm, máx. 12,8 cm. Costo: parche 100.480 triángulos (antes ~25.000), ripio 9.236, emparejar 73 ms. | medido en partida |

Pruebas viejas ajustadas a propósito: `verificar-4-25-2-tirar`, `verificar-4-26-5-c` (V ya no tira con el puesto abierto), `verificar-3-8-8-banco` (cartel en dos renglones). En verde: 3-6-mundo, 3-6-1-mundo, 3-6-2-visual, 3-7-3-taller, 4-10-3-sitios, 2-9-tren.

No visto a ojo: el cartel desde un ángulo cómodo (el pilar de la galería lo tapa en las capturas); el costo en milisegundos de cuadro del parche de 1 m (no medido; son triángulos de un solo dibujo).

## Ajuste: el parche de 1 m sólo en Media y Alta
`parcheSuelo` usa `PASO_PARCHE` (1 m) cuando la calidad tiene `post` (Media y Alta) y `PASO_PARCHE_BAJA` (2 m, el de antes) en Baja y Muy baja. Prueba con 2 mutaciones más. Partida corta minimizada en Baja: celda 1,99 m, parche 26.732 triángulos, ripio 2.614, emparejar 48 ms, sin errores de consola (el desvío es el de antes: máx. 28 cm, 39 puntos sobre 10 cm).
