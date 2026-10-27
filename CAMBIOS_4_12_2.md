# Hojarasca 4.12.2 — Mejora visual 3: animales con huesos (rama `v4122`, sale de `main` = 4.12.0)

Tercera de la serie de mejoras visuales (4.12.0 bordes y rocas, 4.12.1 agua y edificios, 4.12.3 sombras lejanas). **No se subió la versión**, no se tocó `main`, sin etiqueta ni zip. Sólo Media y Alta pagan algo.

## Qué trae
El caballo, el ciervo, el huemul y el perro se animaban por grupos rígidos (una malla para el cuerpo, otra para cuello y cabeza, una por pata: 6 o 7 dibujos por animal, cada pieza girando sobre su pivote). Ahora, **cerca (menos de 40 m) y sólo en Media y Alta**, el mismo animal se dibuja con **una sola malla con piel por huesos**, la misma técnica de la gente (`gente-cuerpo.js`: `isSkinnedMesh` con un esqueleto mínimo y los huesos en una textura compartida). Se arma con los **mismos vértices, normales y colores pintados** de las mallas rígidas ya fundidas: mismas formas, tamaños y pelajes (la prueba lo compara vértice por vértice).

- **Esqueleto de 22 huesos:** pelvis y tórax (la columna se arquea y se tuerce), cuello en tres tramos más la cabeza, orejas, cola en tres tramos y, en cada pata, tramo de arriba, carpo/garrón y menudillo con casco.
- **Marchas continuas:** la amplitud, la fase del galope y la zancada posterior se mezclan con el tiempo (antes saltaban de golpe entre quieto, paso, trote y galope; el perro apagaba las patas de golpe al parar). Al galope las patas doblan carpo y garrón, la columna se arquea y la cola flamea; el cuello se curva en tres huesos al pastar u olfatear (el ángulo lo siguen poniendo la IA y el movimiento en los pivotes rígidos: la piel sólo lee).
- **Vida quieta:** respiración, cola que se mueve, tics de orejas, orejas adelante en alerta.
- **Fuera de alcance y en Baja y Mínima:** queda la versión rígida de siempre, con las mismas mallas (la piel no se arma en esas calidades; si la calidad baja en vivo, los animales vuelven solos a lo rígido). `?piel=0` la apaga (para medir).
- **Ningún programa de shader nuevo a mitad del juego:** la piel usa `MAT_FAUNA` con el skinning de three. Los dos programas «con huesos» (cuerpo y sombra) se compilan en la carga: `gente.js` (`precalentar`) llama a `precalentarPiel`, que dibuja un instante una malla mínima con huesos delante de la cámara. En Baja y Mínima no hace nada.
- Se hacen con la misma tecnología de la gente pero **su propia textura de huesos** (64 × 64, 42 animales por página, el tramo se libera al rearmar al personalizar).

## Archivos
`src/animales-piel.js` (nuevo: esqueleto, pesos, LOD, poses, precompilado), `src/formas.js` (`etiquetar`: cola, oreja, cuello), `src/vida.js` (`fundirSuave` lleva el atributo `etiqueta`; huemul; `posarPielMamifero`), `src/caballo-mundo.js`, `src/perro.js`, `src/bichos.js` (ciervo y la cámara para el LOD), `src/gente.js` (una línea: el precompilado). No se tocó la IA (`actualizarCiervo`), el movimiento, las colisiones, la montura, el sulky, el carro ni las sombras de contacto (la prueba lo vigila).

## Decisiones
- **Zorro, pudú y jabalí quedan rígidos.** El huemul sí (reutiliza el esqueleto del ciervo con casi nada de código). El zorro y el pudú tienen otra forma de cola y cuerpo y no valía el riesgo en esta versión.
- La piel del caballo proyecta sombra entera (antes sólo el torso la proyectaba; ahora también cuello y patas): es lo que corresponde y cuesta un dibujo de sombra, no siete.
- El patrón fino de pelo del shader (`vPosObjFauna`) pasa a estar en el espacio del animal y no en el de cada pieza: la variación de ±3 % es otra, indistinguible a simple vista.
- El palito del perro (`traer`) sigue pegado al pivote rígido de la cabeza.

## Verificación
- **`pruebas/verificar-4-12-2-animales.mjs`** (en el gate): **138 comprobaciones** (misma forma y color vértice por vértice y mismos triángulos, pesos, reposo identidad, Baja y Mínima sin piel, LOD con histéresis, marchas sin saltos, nada se estira ni se hunde, cuello en tres huesos siguiendo al pivote rígido, tramos de la textura, precompilado, lo que no se toca). **`herramientas/mutar-4-12-2-animales.cjs`: 62 mutaciones, las 62 hacen fallar la prueba** (la primera tanda dejó pasar 5 y se reforzaron las comprobaciones).
- **Partida real** `pruebas/humo-4-12-2-animales.cjs` (Electron en el monitor externo, perfil propio, ventana visible): ver el informe final para el resultado.
- Capturas de ciervo, perro y caballo (quieto, pastando, paso, trote, galope, montado y cuadros seguidos) en la carpeta de la prueba; vistas con ojo crítico.

## Un error que atrapó la partida real y la prueba de Node no
Los índices de hueso de los vértices tienen que llevar el tramo de la textura compartida (`base`), como en la gente: el shader lee la textura con el índice tal cual. Sin eso, el primer animal andaba bien y los demás leían los huesos de otro (patas casi quietas). Se corrigió y la prueba ahora lee los índices como el shader (mutación «los índices de hueso no llevan el tramo»).

## Costo y lo que no se pudo verificar
- **Costo de CPU de la pose + huesos medido en Node:** ~2,6 µs por animal y cuadro. **Dibujos:** un animal con piel es 1 malla (y 1 de sombra) contra 6–7 rígidas, así que los dibujos del cuadro **bajan** con animales cerca; no suben.
- **No se llegó a medir el cuadro en la notebook ni en la 4600G** con `medir-animales-4-12-2.cjs` (el candado de Electron estuvo ocupado casi todo el tiempo y el plazo se acabó). Comando: `HTML_ANTES=<index de main> HTML_DESPUES=<index de la rama> RIGIDO=1 RONDAS=7 CALIDAD=media SALIDA=... npx electron herramientas/medir-animales-4-12-2.cjs --user-data-dir=<carpeta propia>` (alterna A B A B en un solo proceso; la vista con ciervos, huemules, perro y caballo a 6–32 m y la misma lejos). **Sin medir en la 4600G.**
- Sin ver: de noche, con lluvia o nieve, el sulky y el carro con el caballo con piel (el movimiento y el carro no cambian y están cubiertos por sus pruebas), la lenta bajada de la cabeza del caballo al pastar con tiempo, el perro con collar y pañuelo andando.
- El inglés no se escribió.
