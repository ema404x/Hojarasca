# Hojarasca 4.12.1 — Mejora visual 2: agua, edificios, animales con huesos y sombras lejanas

Rama `v4121-integra` (sobre `main` = 4.12.0). Juntada de cuatro ramas: `v4121-a` (agua, `CAMBIOS_4_12_1_A.md`), `v4121-b` (edificios, `CAMBIOS_4_12_1_B.md`), `v4122` (animales, `CAMBIOS_4_12_2.md`) y `v4123` (sombras, `CAMBIOS_4_12_3.md`). Las tres últimas iban a ser versiones aparte; se cerraron juntas para ganar tiempo. Sólo Media y Alta gastan rendimiento extra; Baja y Mínima quedan como estaban.

## Qué trae
- **Agua y reflejos:** el agua espeja el cielo con las mismas cuentas del cielo (horizonte, franja del ocaso, nubes, luna rota en las ondas, cerros), destellos sobre el camino de luz, orilla más turquesa y transparente con una lengua de espuma que avanza y se retira. Baja y Mínima usan un programa barato y ya no tienen un agua plana.
- **Edificios y luz:** esquinas, aleros y pies oscurecidos, sombra de contacto para todo el valle, desgaste y musgo propio de cada edificio (determinista, leve en las obras tuyas), y halos de noche en las ventanas de tus casas y en las fogatas.
- **Animales con huesos:** caballo, ciervo, huemul y perro se dibujan, cerca (menos de 40 m) en Media y Alta, con una sola malla con piel por huesos (22 huesos), con las mismas formas y pelajes. Las marchas se mezclan sin saltos. De lejos, y en Baja y Mínima, queda la versión rígida de siempre. Zorro, pudú y jabalí siguen rígidos.
- **Sombras que llegan más lejos:** los árboles nunca proyectaban sombra (las siluetas no entraban al mapa); ahora sí. La caja del mapa pasa de ±40 a ±70 m en Media y de ±55 a ±110 m en Alta, con el mapa encajado a los texels de la luz.

## Rendimiento (notebook Ryzen 7 7730U; la 4600G NO se midió)
- Media: mediana de la diferencia entre vistas +0.3 ms por cuadro (peor vista +1.9 ms; 2 corridas alternadas por versión, tiempo de CPU más placa del cuadro entero con otros programas abiertos, ruido de ±1 a 3 ms).
- Alta: mediana de la diferencia entre vistas +0.1 ms por cuadro (peor vista +0.6 ms; 2 corridas alternadas por versión, tiempo de CPU más placa del cuadro entero con otros programas abiertos, ruido de ±1 a 3 ms).
- Sombras: un cuadro común no cambia; el cuadro que rehace el mapa suma entre +0,3 y +2 ms de placa (se siente como un tirón corto). Si pasa del margen en tu PC, bajar `sombraCaja` a 55 en `src/config.js`.
- Edificios: +1 dibujo por la sombra de contacto y +1 de noche por los halos; avanzar la etapa de una casa grande tarda de 15 a 60 ms.
- Animales: con los animales a la vista, 197 dibujos con piel contra 254 rígidos, con los mismos triángulos.

## Decisiones de la junta
- Conflictos en `package.json` (línea `verify:pasos`, con las cuatro pruebas nuevas) y en `src/main.js` (se conservaron las dos líneas: asentado de edificios y la variante de sombras para medir).
- Se juntaron en una sola versión (4.12.1) en vez de tres.

## Verificación
- `npm run verify` de corrido: **311 pasos OK** (las cuatro pruebas nuevas: agua 122 comprobaciones, edificios 979, animales 138, sombras 431, con 28, 63, 62 y 49 mutaciones atrapadas).
- Partidas reales sobre la junta: sombras (19 pasos) y agua (97 pasos) en verde; animales corrige sus 9 escenas de captura; bordes y edificios en verde salvo la línea de abajo.

## Pendiente conocido
- **Un programa de shader nuevo en juego:** con la junta, las partidas reales cuentan 103 → 104 programas durante el juego (en Media y Alta) donde antes era 102 → 102. Es un programa de profundidad (sombra) con la niebla del techo; viene de los animales con huesos (sola, esa rama ya daba 102 → 103) y se compila la primera vez que algo lo usa, un tirón de un cuadro. La prueba de partida real (`humo-4-12-0-bordes`, `humo-4-12-1-edificios`, `humo-4-12-2-animales`) lo marca en rojo; `npm run verify` no lo cubre. Hay que encontrar cuál es y precompilarlo en la carga. Diagnóstico en `humo-4-12-2-animales`: la clave difiere del depth más parecido en un solo número (`8388608`).
- **Sin ver:** Alta con ±110 m de sombras en capturas, el movimiento (ramas y pasto, parpadeo de sombras), noche, lluvia, nieve, otoño, el caballo y el ciervo pastando con la cabeza baja, los halos de las fogatas y de las casas tuyas.
- **Sin medir en la 4600G** ninguna de las cuatro (los comandos están en cada CAMBIOS).
