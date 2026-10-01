# Hojarasca RC20 — Optimización Sistémica

RC20 congela funcionalmente las líneas de construcción/hábitat RC12 y naturaleza RC19 para atacar rendimiento sin bajar fidelidad visual ni recortar contenido.

## Objetivos

- reducir presión del garbage collector en rutas por cuadro;
- evitar consultas estructurales repetidas cuando la respuesta perceptiva no necesita 60–120 Hz;
- reducir trabajo del shadow map sin eliminar el contacto visual de fauna/NPCs;
- conservar comportamiento, densidad, clima, construcción y naturaleza de RC19;
- hacer medible la optimización mediante una regresión específica.

## Pools posicionales

Nuevo `src/rendimiento.js` con `crearPoolPosicional()`.

Fauna, vida y bichos reutilizan registros y `Vector3` para sujetos/rastros. Antes, varias especies creaban clones/objetos nuevos en cada actualización y el perro pedía una lista reconstruida cada cuadro. Ahora los registros se reciclan y las listas activas sólo cambian de longitud.

## Contextos reutilizados

`main.js` conserva objetos estables para:

- mundo vivo/fauna;
- clima;
- sonido;
- pesca;
- tren;
- objeto en mano;
- rastros combinados.

Esto elimina literales/arrays temporales de alta frecuencia y reduce picos de GC.

## Caches temporales

Las consultas que alimentan presentación/interacción se actualizan a una cadencia coherente con percepción humana:

- interior/cubierta: ~8 Hz o al moverse significativamente;
- estado de hábitat del HUD: ~5.5 Hz o al cambiar de posición;
- scans de interacción (hacha, fogón propio, taller, semillas): 10 Hz o al moverse;
- NPC enfocado: 15 Hz;
- panel semántico de construcción: máximo ~7 Hz salvo refresco forzado.

Las acciones reales mantienen sus validaciones existentes; sólo se cachea la información de presentación.

## Perro

La locomoción continúa a dt completo, pero la búsqueda del animal a marcar se hace cada 120 ms y usa distancia al cuadrado, evitando `sqrt/hypot` repetidos para todo el conjunto de sujetos cada frame.

## Shadow LOD

Nuevo `limitarSombrasPorDistancia()` conserva el `castShadow` original de cada malla y sólo lo apaga/recupera al cruzar un umbral.

Integrado en:

- pudú;
- huemul;
- zorro;
- guanaco;
- ciervo colorado;
- jabalí;
- NPCs.

Las sombras de contacto económicas de RC16 permanecen, de modo que los actores lejanos siguen visualmente apoyados sobre el terreno aunque no obliguen al shadow map a renderizarlos.

## Medidor F3

Cuando F3 está oculto y no hay `?debug=1`:

- no se mantiene el buffer de muestras;
- no se ordenan percentiles;
- no se clona `renderer.info.render`;
- se evitan `performance.now()` extra usados sólo para profiling detallado.

El propio medidor deja de añadir coste apreciable cuando no se usa.

## QA

Nueva regresión `pruebas/verificar-optimizacion-rc20.mjs` valida:

- reutilización real de registros/vectores;
- restauración correcta del shadow LOD;
- ausencia de spreads/clones críticos anteriores;
- contextos reutilizados;
- caches temporales;
- scan del perro;
- integración del shadow LOD en fauna/NPCs.
