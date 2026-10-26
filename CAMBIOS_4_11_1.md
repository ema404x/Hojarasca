# Hojarasca 4.11.1 — Interfaz y sonido (segunda de cuatro versiones con las decisiones de diseño)

Rama `v4111-integra` (sobre `main` = 4.11.0). Juntada de `v4111-a` (`CAMBIOS_4_11_1_A.md`) y `v4111-b` (`CAMBIOS_4_11_1_B.md`).
Decisiones del usuario: `DECISIONES_DISENO_4_10.md`. Siguen la 4.11.2 (mundo y gente) y la 4.11.3 (proceso y guardado).

## Qué trae
- **Pies de pantalla con tu tecla:** los pies «E o Escape para cerrar…» de la carta, el banco y el local se arman con la tecla de interactuar configurada (con la E de fábrica el texto es el de siempre).
- **Tablero de trofeos:** la E abre un panel con los siete trofeos (los ganados con su bono, los que faltan con de dónde salen) que se queda hasta que lo cerrás con E o Escape; se cierra solo si te alejás o si cae el tablero.
- **Semilla del cantero:** junto a un cantero vacío con dos o más semillas, Tab, Mayús+Tab o la rueda eligen cuál sembrar; el cartel dice cuál y se guarda en la partida.
- **Foco del teclado:** al redibujar la mochila y el cuaderno, el foco vuelve a la misma casilla, ítem o pestaña.
- **Recetas y ropa a una ranura vacía:** «Empezar acá» también las trae (sin el Bruno de la partida vieja, como con «Empezar de nuevo»); una ranura con partida no se toca.
- **Pájaros en el bosque:** salen por la perilla de «El bosque» (con el bosque en 0 no suenan) y adentro de una casa se atenúan como el viento y la lluvia.
- **Gramola:** respeta la perilla de Música y «Solo el bosque» (con todo al máximo suena igual que antes).
- **Radio de la madrugada:** la E sobre ella la apaga (con un fundido); el audio que llega tarde se descarta si la apagaste, pediste otra emisora, empezó el Desafío o te alejaste más de 10 m.

## Decisiones de la junta
- El traspaso de lo personal a una ranura vacía va por `sessionStorage` (la ranura sigue diciendo «Empezar acá» hasta que se entra).
- «Pájaros» es todo `cantar` más el picaflor y la ranita; el chillido de los murciélagos queda en Efectos.
- Tres textos nuevos de la radio y el panel de trofeos están sólo en castellano (inglés al final).

## Verificación
- `npm run verify` de corrido: **300 pasos OK** (298 de la 4.11.0 + una prueba por agente).
- Partidas reales sobre la junta (ocultas, de a una, en el monitor externo): `humo-4-11-1-interfaz`, `humo-4-11-1-sonido`, `humo-4-0-3-ajustes` y `humo-4-11-0-vuelta` en verde; `humo-4-10-1-guardado` sin ninguna línea fallida; `humo-4-10-base` falló una vez por tiempo (mundo no listo) y pasó al repetirla.
- Mutaciones a propósito: 50 (interfaz) y 20 (sonido): todas hacen fallar sus pruebas.

## Pendiente
- **Sin escuchar:** pájaros adentro, gramola y el fundido de la radio (sólo se midieron los buses).
- **Sin probar a mano:** Tab y Enter nativos, la rueda física del mouse, el mando, los paneles del banco, la carta y el local abriéndolos caminando, y la E sobre una radio construida en Electron.
- `humo-4-7-carga`, `humo-1-10` y `humo-4-2-lujo` fallan oculta con `UnknownVizError` al sacar la captura (también en 4.11.0); `humo-huevos` falla por el huemul a 36 m (también en 4.11.0).
