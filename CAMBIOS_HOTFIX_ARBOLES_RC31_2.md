# RC31.2 — Hotfix de árboles invisibles

## Síntoma

En el ejecutable (calidad por defecto: media) el bosque no aparecía: alrededor del
Refugio del Arroyo no quedaba un solo árbol. En calidad muy baja no se veía ninguno
en casi todo el valle. En alta "funcionaba" pero siempre con el LOD simplificado.

## Causa raíz

`materialVegetal` (`src/materiales.js`) calculaba la posición de mundo como
`modelMatrix * transformed`, **sin `instanceMatrix`**. Árboles, sotobosque y
hojarasca son `InstancedMesh`, así que para el shader todas las instancias estaban en
el origen del mapa. El crossfade LOD (RC15) medía entonces la distancia del jugador
al centro del valle, no al árbol:

- LOD cercano: cobertura 0 en cuanto el jugador se alejaba > `lod` m del centro.
- LOD lejano: cobertura 0 más allá de `lejos` (160 m muy baja · 230 m media · 310 m alta).

El Refugio está a ~268 m del centro → en media y menores no se dibujaba ningún árbol.
El mismo error falseaba nieve acumulada, microdetalle de madera/piedra, humedad,
perspectiva aérea, altura de copa (`vSueloVeg`) y normales de mundo.

## Correcciones

- Posición, normal y base de mundo incluyen `instanceMatrix` (`matrizMundoVeg`).
- `vNormVistaVeg` usa `transformedNormal` (ya incluye instancing).
- Distancia LOD por árbol (`vRaizVeg`, base de la instancia) y medida desde la **cámara**
  (`cameraPosition`), igual que el culling de chunks: el menú y la cámara libre ya no
  dejan el bosque cercano a la cámara oculto por estar lejos del cuerpo del jugador.
- Cambio de LOD con **umbral por árbol** (hash de la instancia), complementario entre
  cercano y lejano: cada árbol cambia entero a su propia distancia dentro de un anillo de
  20 m (`mezclaLod` = 10). Sin copas salpicadas de píxeles de cielo.
- Borde lejano sin dither: el árbol se achica hacia su base en los últimos 30 m antes
  de `lejos`, en lugar de dejar ruido de píxeles sobre las laderas.
- **Manto de bosque lejano** en el terreno: más allá de `calidad.lejos` el suelo boscoso
  toma el tono de las copas (rodales, otoño, nieve), así las laderas lejanas no se ven
  peladas en calidad media/baja. Uniform `U.uBosqueLejos` = `calidad.lejos`.
- Contraluz del follaje: cono más estrecho (pow 4 → 8), aporte 0.55 → 0.12 y atenuado
  con nieve. Con el sol a intensidad 3.0 las copas se volvían verde fosforescente y
  ocultaban la nieve al mirar hacia el sol bajo.

## QA

- `pruebas/verificar-shaders-rc31-1.mjs` ahora exige instancing en la posición de mundo,
  distancia LOD por instancia y máscara complementaria.
- `npm run verify` 51/51 · geometría 0 · física 0 · refugio/cabañas OK.
- Capturas en GPU real en alta/media/baja/muy baja, verano/otoño/invierno, 16 lugares:
  bosque presente en todas las calidades.
- Rendimiento (AMD Radeon integrada, Refugio): media 144 FPS (p99 7 ms), alta 74 FPS;
  triángulos iguales a antes del arreglo.
