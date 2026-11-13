# 4.26.5 (A): cacería de bugs, la gente del pueblo

## Cómo se cazó
`pruebas/humo-4-26-5-a.cjs` (lanzador `herramientas/correr-humo-4-26-5-a.ps1`, con el candado): la Aldea completa (11 pobladores), vos en la calle, un tramo del día (6 a 12 h y 17 a 24 h, cuadros de 50 ms) mirando a cada vecino cada 0,3 s: trabado caminando, adentro de un sólido, piso, giros en el lugar, amontonados, errores de consola (0 en todas las corridas). Más lectura de `gente.js` y `aldea-gente.js`.

## Arreglado
| Bug | Causa | Arreglo | Cómo se vio |
|---|---|---|---|
| Parado vos a menos de 7 m de una calle, los vecinos de la aldea que pasan por ahí se quedaban clavados para siempre (la abuela, 20 minutos del juego en la vereda, y las galesas, el padre, Ercilia en las esquinas) | `cerquita` (vos a menos de 7 m) frena al que camina sin límite, y el «trabado» de la aldea (llega de una a los 12 s) no cuenta a los que tenés a menos de 7,5 m: nada los destrababa | `gente.js`: el que camina con `camino` se frena a mirarte `PARADA_MIRAR_S` = 8 s y sigue; se reinicia al alejarte o al llegar | Partida real: antes, la abuela parada en (27,3, -384,6) de las 6:15 a las 8:20; en la sonda de 6:10 a 6:38 no se movía; después, a los pocos segundos camina y llega (a las 6:46 ya iba por la calle). Un solo aviso de «trabado» en vez de uno por destino |
| Vecinos metidos 0,3 m en un muro o mueble en su punto de casa o trabajo (la panadera amasando en la pared, el apicultor en la sala de miel, el gerente en el accesorio del banco) | los puntos de `aldea.js` (adentro, trabajo, cliente) caen dentro del radio de choque de un muro o un mueble | `aldea-gente.js` `despejarDestino`: al armar los destinos, una vez por punto y con los obstáculos del edificio ya armados, lo corre al lugar libre más cercano (radio 0,22, hasta 1,2 m, sin salir del edificio; no toca sentados, escaleras, lejanos ni los del amor); el que ya estaba parado ahí se corre con el punto. `main.js` pasa `col` a la aldea | Partida real, 17 a 18,6 h: antes `solido` de la panadera (49,8/-397,1), el apicultor en `sala-miel:trabajo` y el gerente en `banco-pueblo:trabajo`; después, ninguno de los tres (queda sólo el apicultor sentado leyendo en la biblioteca, que es la silla) |

## Anotado sin tocar
- Muchos «sólido» del humo (0,25 a 0,48 m metidos en un muro) son el tramo de la puerta para adentro (`sinChoque`, a propósito): el humo ahora sólo cuenta a los que están quietos.
- Cola de la noche (23 h): 3 a 4 vecinos coinciden a menos de 0,35 m por 6 s en (37,4, -361,8) (local 6,3/22, la esquina de la calle de la vía) camino a su cama. No se pudo ver la causa (¿puerta de la estación? ¿punto de la calle compartido?) con arreglo acotado: anotada. Reproducir: `-Secciones dia -Horas 22.5,24`, `incidentes.json`, tipo `amontonados`. A las 20 h en la fiesta, 2 a 3 «trabados» de 6 s en el predio: se destraban solos (los 12 s).
- Los que duermen (`cama`) figuran con `pose` nula y 0,32 m arriba del terreno (la altura de la cama); no pude ver la captura de cerca (la cámara del humo no dio): sin confirmar si se los ve acostados.
- El músico en `salon:escenario` pasó con -0,77 m respecto del piso calculado (probablemente subiendo al escenario): sin confirmar.
- Andén: con `llamar` + `revisarLlegada(true)` (humo, sección `anden`) la que baja (Ayelén, la veterinaria) queda parada sobre el andén, 0,7 m arriba del terreno (la plataforma), sin sólidos, con la E «Hablar con Ayelén Catriel»: sin falla. No se vio la trochita llegando y saliendo con gente ni los objetos en la mano ni los pedidos con la E (quedó sin ver).

## Pruebas
`pruebas/verificar-4-26-5-a.mjs` (en `verify:pasos`): 12 comprobaciones y 6 mutaciones atrapadas. En verde: `verificar-3-6-gente`, `-3-6-1-vecinos`, `-3-7-0-aldea`, `-3-7-1-amor-mundo`, `-4-25-2-npc` y las de aldea 3-6, 3-6-1, 3-8-3, 3-8-6, 3-8-7, 4-0-3, 4-10-4. 0 shaders, 0 llamadas de dibujo nuevas, sin claves de guardado.
