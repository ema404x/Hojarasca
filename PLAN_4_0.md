# Hojarasca 4.0 — Más lindo y más fluido (borrador del 13-10-2026)

Decisión del usuario (13-10): la 4.0 es **mejoras visuales y de rendimiento**, **sin contenido nuevo** (ni lugares ni animales). Eso acerca el
juego al congelado de contenido y al lanzamiento en Steam. Base: sale de la 3.9.1 (cantina + peña), cuando esté cerrada.
Condición de todo: **fluido en la Ryzen 5 4600G** del usuario (la Radeon integrada es el piso); lo que pese, sólo en calidad alta.
Estilo «tal cual HushWood». Sin assets descargados.

## 1. Rendimiento (primero: da margen para lo visual)
- **Medir antes de tocar:** cuadros por segundo y tiempos por escena en la 4600G (`herramientas/medir-vistas.cjs`, `soak-largo.cjs`,
  `soak-memoria.cjs`): valle abierto, aldea con 20+ vecinos, interior de la cantina de noche, noche grande de los duendes, lluvia y nieve.
- **Buscar los picos:** compilaciones al primer uso del cielo y las ventanas (anotado como pendiente en la 3.8.7), tirones al cruzar bloques del
  bosque, costo de luces y sombras, llamadas de dibujo, memoria que crece en sesiones largas.
- **Metas a fijar con el usuario** (con la medición en la mano): cuadros por segundo mínimos por calidad (baja / media / alta) y sin tirones
  visibles al caminar, andar a caballo o en la trochita.
- Resultado esperado: una tabla antes/después por escena.

## 2. Mejoras visuales (primero prototipo antes/después; el usuario elige qué entra)
Todo marcado por el usuario el 09-10:
- **Agua:** reflejos del bosque y las montañas, espuma en la orilla, ondas con lluvia y kayak.
- **Luz y cielo:** amaneceres y atardeceres, rayos entre árboles, nubes con volumen, niebla de valle a la mañana.
- **Gente y animales:** caras, ropa, movimientos y andar (con lo aprendido de Lucrecia y la bailarina: cuerpo, ropa y poses).
- **Vegetación y suelo:** pasto que se mueve y se aplasta, flores, hojarasca, piedras con musgo.
- **Clima:** lluvia que moja y deja charcos, nieve que se acumula en techos y ramas, viento visible.
- **Edificios y aldea:** detalle, ventanas encendidas, humo; la luz de adentro (la cantina de noche se veía oscura).
- **Efectos de la noche de los duendes:** luciérnagas, esporas, ámbar, el Coihue y los duendes con más magia y miedo.
Método: capturas del MISMO lugar hoy y mejorado; el usuario marca cuáles entran; cada una con su costo medido en cuadros. Lo caro, sólo en calidad alta.


## 1b. Referencias de dirección de arte (el usuario, 13-10) — para los prototipos antes/después
- **Ambiente y lugares:** 4 imágenes de referencia (aldea de noche con faroles y reloj, interior de la casa de té con faroles colgados, mirador con rayos de luz y lupinos, estación con tren y flores). Objetivo realista: ~60-70% de esa sensación por color, luces cálidas con halo (sin luces dinámicas nuevas), rayos de luz, más flores/plantas y mobiliario con carácter. Lo que NO se alcanza: iluminación global, desenfoque, textura de cada hoja.
- **Personajes:** 3 imágenes de referencia (hombre con boina y barba, la galesa de la casa de té, jefe de estación con gorra, bigote y reloj de bolsillo). Objetivo: caras amables con ojos con brillo, cejas, rubor, bigote y barba con volumen; pelo con masa y mechones; ropa con detalle (botones, hebilla, pañuelo con flecos, bordados, remangues, cadena del reloj); botas con costura y suela. Se hace en el sistema común de cuerpos (src/gente-cuerpo.js, gente-ropa.js) y se propaga a todos los vecinos. Estimado: medio día a un día para el primer pase de los principales. Lo que NO se alcanza: la piel y la tela suaves tipo arcilla, manos y poses a ese nivel.
- **Método:** prototipo antes/después con 3 personajes (los de las referencias) y 2 lugares (aldea de noche y casa de té); el usuario elige qué entra. Las imágenes de referencia están en `referencias-4-0/` (en el repo) (1 a 4: ambiente y lugares; 5 a 7: personajes). Riesgo: que los personajes queden más pulidos que el mundo; por eso va junto con el paso de color y luz.
- Simulaciones por filtro ya hechas (solo clima de color, no el modelo): la carpeta `simulacion-4-0` de la PC de origen (no está en el repo).

- **Modelo:** para el prototipo de los 3 personajes usar Fable (mejor criterio visual, menos rondas; sube el techo de ~60-70% a ~70-80% de las referencias, sin cambiar los límites del motor por código). El resto de la 4.0 con el modelo de siempre, por costo de uso.

## 3. Cómo se hace
1. **Medición** de la 3.9.1 en la 4600G (tabla base).
2. **Prototipos** antes/después (1 o 2 equipos) y elección del usuario.
3. **Implementación en paralelo** (3 equipos en worktrees): (a) rendimiento; (b) agua, cielo y clima; (c) vegetación, suelo, edificios y gente.
4. **Integración**, nueva medición contra la tabla base y **pase de bugs visuales** (capturas a tamaño completo, en el monitor externo).
5. Zip completo con `herramientas/empaquetar.ps1` (la portada muestra versión y huella). Preguntar al usuario cualquier decisión nueva, con opciones.

## 4. Para el DLC o versiones posteriores (anotado, NO va en la 4.0)
Lugares: termas en el bosque, cascada escondida con poza, islote del arrayanal, puesto abandonado, pasarela del humedal, bosque de pehuenes,
mirador del cóndor, árbol viejo del valle, ventisquero visible (subirlo, DLC). Animales: bichos del bosque, granja y aldea, estepa (guanacos,
ñandúes, zorros), aire y agua (cóndores, flamencos, patos, truchas visibles). Elegidos por el usuario para empezar si hay tiempo: las termas, la
cascada, los bichos del bosque y la granja y aldea.

## 5. Fuera de la 4.0
Primera hora de juego, La noche de los duendes y la aldea viva; inglés de la economía; congelado de contenido y Steam.
