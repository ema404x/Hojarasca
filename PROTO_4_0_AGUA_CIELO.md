# Prototipo 4.0 — agua y cielo antes/después (16-10-2026, rama `proto-40-agua-cielo`)

Sin contenido nuevo, sin textos, sin luces nuevas. Rama sin unir a nada y sin push. Sólo calidad media y alta (`calidad.post`); en baja el juego compila y dibuja lo de siempre.
Capturas (valle desde el mirador, orilla del lago y lago abierto, bosque, refugio y plaza de la aldea; amanecer 6:48, mediodía 12:30 y atardecer 19:24; verano y atardecer de otoño):
`Documents\Hojarasca\trabajo\proto40\agua-cielo\antes\` y `...\despues\` (se sacan con `pruebas/fotos-agua-cielo-40.cjs`).

## Qué cambió
- **Rayos de sol entre los árboles** (`src/rayos-bosque.js`, enganchado en `main.js`): 40 cintas aditivas en una sola malla (un dibujo), giradas hacia vos alrededor del eje del sol, con borde blando, vetas de polvo que titilan despacio y desvanecidas cerca y lejos. Nacen sólo donde hay bosque (`T.bosque`), se reubican solas al caminar y se encienden con el sol bajo (alba y hora dorada); al mediodía, con nubes, lluvia o bajo techo se apagan. Los troncos los tapan (prueba de profundidad). **Es lo que más se nota.**
- **Espuma de orilla** (`agua.js`): puntillas de encaje blanco que suben y bajan por toda la orilla, además de la línea fina que ya había. **Se nota bien** desde el muelle.
- **Reflejo de la orilla por color** (`agua.js`): franja verde oscura estirada en el rumbo de la vista cerca de la costa, y un poco más de cielo en el espejo. **Casi no se nota** (más sutil de lo que se buscaba).
- **Cielo** (`cielo.js`): banda dorada baja del lado del sol y halo más ancho y tibio en el alba y el ocaso. **Se nota poco**: el cielo de la 3.9.2 ya era dorado.
- **Niebla de valle** (`niebla.js`, `cielo.js`): 64 bancos más sobre el fondo del valle, opacidad mayor (tope 0,68 contra 0,56) y algo más de densidad de mañana. **Se nota al amanecer** sobre el lago: el faro y la costa lejana quedan velados; se va con la hora porque usa la misma curva de siempre.

## Costo medido (esta PC, `herramientas/medir-vistas.cjs`, alta, aldea completa, 200 cuadros; mismo día, 2 corridas de antes y 2 de después alternadas; la segunda de «antes» hace de control)
| vista | antes p50 (1.ª / 2.ª) | después p50 (1.ª / 2.ª) | diferencia de medias |
|---|---|---|---|
| bosque (12 h) | 5,9 / 4,6 | 5,7 / 4,8 | 0 % |
| refugio-día | 4,4 / 4,2 | 4,6 / 4,3 | +3 % |
| estación | 4,2 / 4,0 | 4,5 / 3,9 | +2 % |
| aldea-plaza-día | 15,3 / 14,9 | 15,4 / 15,2 | +1 % |
| bosque-tarde (19 h, con rayos) | 5,4 / 4,6 | 5,6 / 4,9 | +5 % |
| lago-tarde (19 h) | 8,9 / 8,6 | 9,6 / 8,6 | +4 % |
| lago-amanecer (7 h, con niebla) | 8,8 / 8,5 | 9,3 / 8,4 | +2 % |

Conclusión: de +0 a +5 % en p50, en el borde del ruido (las dos corridas de «antes» difieren entre sí hasta un 20 %: la segunda siempre sale más rápida). Dibujos: +1 a +2 (rayos y bancos de niebla). En el pico (rayos en bosque cerrado, 19 h) está en el límite del 5 %: falta medir en la 4600G. Ojo: hoy esta PC midió mucho menos que la base anotada (la comparación vale sólo entre corridas del mismo día). Gate: `npm run verify`: 207 pasos OK.

## Límites
- Los rayos son cintas sin oclusión real: no saben dónde hay claros entre las copas, así que atraviesan el follaje y a veces caen sobre pasto abierto cerca del bosque. Al mediodía no hay.
- No hay reflejo real del bosque ni de las montañas (no hay render extra): es una franja de color cerca de la costa; con el lago lejos y el sol de frente no se nota.
- No se hicieron las ondas con lluvia ni con el kayak (la lluvia ya tenía anillos; la estela del jugador ya existía): no se tocaron.
- Nubes con volumen: no se tocaron.
- El valle visto desde el mirador casi no cambia: la niebla nueva se ve sobre todo al nivel del lago.
