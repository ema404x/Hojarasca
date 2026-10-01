# 1.4.0 — Optimización y nuevos invasores

## Rendimiento (medido con `pruebas/medir-rendimiento.cjs`, calidad media, Desafío)

| | 1.3.0 | 1.4.0 |
|---|---|---|
| Triángulos de la escena (sin invasores) | 2.265.918 | **797.336** (−65%) |
| Llamadas de dibujo de la escena | 460 | 446 |
| Tiempo de dibujo (CPU, por cuadro) | 17,4 ms | **11,1 ms** (−36%) |
| Llamadas de dibujo de 18 invasores | 260 | **36** |
| Triángulos de 18 invasores | 16.588 | 154.122 (mucho más detallados) |
| `col.resolver()` por llamada | 2,63 µs | 2,28 µs |

Qué se cambió:
- **Objetos del mapa** (`objetos.js`): se dibujaban todos, en todo el mapa, en cada cuadro
  (`frustumCulled = false`). Sólo el calafate sumaba 962 arbustos × 1.120 triángulos =
  1,1 millones. Ahora cada tipo dibuja una vista con los cercanos (55–120 m según el
  tamaño), que se recompacta al moverse 4 m o al juntar/soltar; y las bayas, piñones y
  frutillas usan esferas de 20 caras en lugar de 80.
- **LOD cercano de los árboles** (`vegetacion.js`): cada chunk de 120 m mandaba todos sus
  árboles con la geometría detallada y el shader colapsaba los lejanos. Ahora las mallas
  de cada chunk son sólo datos y se dibuja una malla por especie con los árboles a menos
  de `lod + 28` m (compactada en cada actualización de vegetación).
- **Colisiones** (`colisiones.js`): `resolver()` y `resolverPlataformas()` ya no crean un
  `Set` por pasada (marca numérica): sin basura por cuerpo y por cuadro.
- **Antorchas**: una luz real menos por calidad (alta 3, media 2, baja 1, mínima 0).
- **HUD del Desafío**: la barra de salud sólo toca el DOM cuando cambia.

## Invasores nuevos (`desafio-alien.js`)

- **Anatomía**: humanoides magros y encorvados; cráneo alargado sobre un cuello largo con
  tendones; cuencas hundidas con ojos negros enormes, rasgados y húmedos; fosas nasales
  sin nariz; boca de ranura con dientes como agujas y mandíbula que se abre; costillas,
  vértebras y omóplatos marcados; vientre hundido; brazos larguísimos con tres dedos y
  garras; piernas digitígradas (la rodilla hacia atrás) con garras en los pies.
  - Rastreador pálido gris verdoso. Tirador gris azulado, más alto, con cresta, sacos
    bioluminiscentes en la espalda y un orbe en la mano. Bruto gris pardo, 1,3× más
    grande y el doble de grueso, con placas de quitina y púas.
- **Una sola malla por invasor**: el runtime no trae SkinnedMesh, así que el esqueleto
  (14 huesos rígidos) se resuelve en el vertex shader (`aHueso` + `uHuesos[14]`). Todos
  comparten un programa compilado.
- **Piel**: brillo húmedo cortado por la textura, contorno frío en la silueta, oclusión
  barata, venas finas que de día oscurecen y de noche laten con luz verde (ámbar en el
  bruto), destello blanco al recibir un golpe, sombra de contacto.
- **Animación**: respiración; tics de cabeza secos y aleatorios; acecho agazapado cuando
  estás cerca; el rastreador **carga en cuatro patas** (y un 25% más rápido) cuando te
  ve entre 7 y 45 m; zarpazo con la boca abierta; el tirador apunta con el orbe; chillido
  con la mandíbula; al morir se desploma y **se disuelve en brasas verdes**.
- **La nave** suma dos reflectores que barren el suelo mientras vigila.

## Nota
Las cifras son de CPU y de geometría (el equipo de pruebas no tiene placa de video). En una
GPU real la baja de triángulos se traduce en más cuadros por segundo, sobre todo en
equipos integrados.
