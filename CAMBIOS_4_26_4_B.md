# 4.26.4 (B) — La vuelta en trochita

Rama `v4264-b`, sobre `main` = 4.26.3. 0 shaders, 0 llamadas de dibujo nuevas, **ninguna clave de guardado nueva** (una marca más dentro de los temas de la Historia).

## Qué cambió
| | |
|---|---|
| La campanita llama al tren con 25 s | **En la Historia, mientras no hiciste la primera vuelta en trochita**, tocar la campanita del andén donde estás trae el tren si la espera pasa de **25 s** (antes, 45 s). Es el mismo `traerAlAnden` de siempre, con sus salvedades (nada si alguien va arriba, se maneja, está varada o ya llega). |
| Después de la primera vuelta | La campana vuelve a los 45 s de siempre. Relax y Desafío no cambian. Ningún horario cambia. |
| La «primera vuelta» | Subirse a la trochita **en la Aldea de los Duendes** en la Historia: `main.js` `prepararTren` anota `mundo:vuelta-trochita` en los temas (una sola vez). |
| El objetivo | En el capítulo 2, el objetivo «Talá un árbol seco…» suma, con el viaje de ida y el hacha hechos y hasta la primera vuelta: «Tocá la campanita del andén para llamar a la trochita.» No es un objetivo más (siguen siendo 8): nada se traba. |

## Archivos
`src/campana-anden.js` (`umbralHistoria`, `umbralDeCampana`, `vueltaHecha`, `MARCA_VUELTA`; `decidirCampana` acepta `o.umbral`), `src/main.js` (quirúrgico: import, el umbral en `campanaAndenCerca`, la marca en `prepararTren`), `src/historia.js` (el texto del objetivo `talar`), `package.json`.

## Qué queda como estaba (anotado, no tocado)
- La escena de Elsa de la vuelta (`elsa-anden-vuelta`, Aldea, capítulo 2, por verse) sigue siendo dueña de la campana: ahí la soga sigue atada y el tren lo trae ella con más de 45 s. La campanita de 25 s se siente donde Elsa no manda: las demás paradas, y la Aldea una vez vista la escena o pasado el capítulo.

## Pruebas
- Nueva `pruebas/verificar-4-26-4-b.mjs` (en `verify:pasos`): 55 comprobaciones, 18 mutaciones atrapadas.
- Ajustadas a propósito: `verificar-4-26-0-b` y `verificar-4-26-1-c` (el mundo de mentira de `main.js` ahora da `umbralDeCampana` y `vueltaHecha`; una mutación de la 4.26.0 busca el texto nuevo del llamado). Siguen en verde: 4.26.0-b (30 mutaciones), 4.26.1-c, 4.24.0-b, 4.24.1-a/b, 4.6.1-interacciones, 2.9-tren, 4.0.3, 4.9-dias, 4.10-base, historia 3.1, 4.13.0-a, 4.15.0, 4.16.0-a, 4.17.0-a, 4.25.2.
- `node armar.mjs` en orden.

## Partida real
`pruebas/humo-4-26-4-b.cjs` vía `herramientas/correr-humo-4-26-4-b.ps1` (candado sólo durante la corrida, monitor externo, perfil propio). Todo en orden en la corrida final:
- Aldea, capítulo 2 (viaje y hacha hechos, escenas de Elsa vistas), tren recién salido (cartel: 320 s): el panel dice «Talá un árbol seco… · Tocá la campanita del andén para llamar a la trochita.» (captura `1-aldea-aviso.png`), el aviso es «E · Tocar la campana del andén», la E hace el fundido, el tren llega en 18 s y para en el andén a ~27 s de terminar el fundido. Subirse marca la primera vuelta y se viaja.
- Después: con 35 s de espera la campana sólo avisa («La trochita ya viene»), y el panel ya no tiene la línea. Con la Historia apagada y sin vuelta, 35 s también sólo avisa.
- Shaders 110 -> 111 al ir arriba de la trochita (vista interior); no hay cambio de dibujo en esta versión.
- Dos corridas previas fallaron por la prueba, no el juego (un guion mal armado; otra vez «El perro marca algo cerca» le ganó a la E en una corrida y desordenó el resto). Quedó una corrida limpia.
## Qué no se vio
- La campanita de 25 s en otra parada que no es la Aldea (misma regla, sólo se probó en la Aldea) y de noche.
- La Aldea con la escena de Elsa por verse (sigue atada, como en la 4.26.0).
