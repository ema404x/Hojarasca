# 4.26.5 (A): cacería de bugs, la gente del pueblo

## Cómo se cazó
`pruebas/humo-4-26-5-a.cjs` (lanzador `herramientas/correr-humo-4-26-5-a.ps1`, con el candado): la Aldea completa (11 pobladores), vos en la calle, un tramo del día (6 a 12 h y 17 a 24 h, cuadros de 50 ms) mirando a cada vecino cada 0,3 s: trabado caminando, adentro de un sólido, piso, giros en el lugar, amontonados, errores de consola (0 en todas las corridas). Más lectura de `gente.js` y `aldea-gente.js`.

## Arreglado
| Bug | Causa | Arreglo | Cómo se vio |
|---|---|---|---|
| Parado vos a menos de 7 m de una calle, los vecinos de la aldea que pasan por ahí se quedaban clavados para siempre (la abuela, 20 minutos del juego en la vereda, y las galesas, el padre, Ercilia en las esquinas) | `cerquita` (vos a menos de 7 m) frena al que camina sin límite, y el «trabado» de la aldea (llega de una a los 12 s) no cuenta a los que tenés a menos de 7,5 m: nada los destrababa | `gente.js`: el que camina con `camino` se frena a mirarte `PARADA_MIRAR_S` = 8 s y sigue; se reinicia al alejarte o al llegar | Partida real: antes, la abuela parada en (27,3, -384,6) de las 6:15 a las 8:20; en la sonda de 6:10 a 6:38 no se movía; después, a los pocos segundos camina y llega (a las 6:46 ya iba por la calle). Un solo aviso de «trabado» en vez de uno por destino |

## Anotado sin tocar
- Muchos «sólido» del humo (vecinos con 0,25 a 0,48 m metidos en un muro) son el tramo de la puerta para adentro (`sinChoque`, a propósito); los que quedan quietos en su punto `adentro:casa` (panadera 49,8/-397,1, apicultor -18/-405,7, apicultor en `biblioteca:lectura-8`, gerente en `banco-pueblo:trabajo`) están a 0,3 m de una pared o un mueble: puntos de `aldea.js` a correr unos 0,3 m. Reproducir: `-Secciones dia -Horas 6,12` y `17,24`, `incidentes.json`.
- A la noche (23 h) 3 a 4 vecinos se juntan en (37,4, -361,8) camino a la cama: es la cola de paso por la puerta de la estación, no se traban. A las 20 h en la fiesta, 2 a 3 «trabados» de 6 s en el predio. Se destraban solos (los 12 s).
- Los que duermen (`cama`) figuran con `pose` nula y 0,32 m arriba del terreno (la altura de la cama); no pude ver la captura de cerca (la cámara del humo no dio): sin confirmar si se los ve acostados.
- El músico en `salon:escenario` pasó con -0,77 m respecto del piso calculado (probablemente subiendo al escenario): sin confirmar.
- No se llegó a mirar: gente del andén con la trochita, objetos en la mano, pedidos con E (quedó fuera por tiempo y calor).

## Pruebas
`pruebas/verificar-4-26-5-a.mjs` (en `verify:pasos`): 5 comprobaciones y 3 mutaciones atrapadas. En verde: `verificar-3-6-gente`, `verificar-4-25-2-npc`. 0 shaders, 0 llamadas de dibujo nuevas, sin claves de guardado.
