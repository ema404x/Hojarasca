# RC31 — Integridad Estructural

## Objetivo
Eliminar de raíz los artefactos de estructuras fragmentadas y convertir cada edificio importante en una unidad visual, física y de LOD coherente.

## Causas raíz encontradas

1. Varias construcciones grandes estaban compuestas por nodos de escena independientes. El cuerpo, luces, mecanismos, tanque, caños, escaleras, puertas o carteles podían recibir visibilidad de forma distinta.
2. Las puertas y postigos estáticos se creaban directamente en la escena, fuera de la jerarquía del edificio. Podían quedar visibles cuando el resto de la construcción desaparecía.
3. El shadow LOD miraba `castShadow` en el `Group`, no en sus mallas hijas, por lo que varios complejos agrupados no reducían sombras como se esperaba.
4. Los props dinámicos del Refugio Vivo tenían una raíz separada de la estructura.
5. Los cristales estructurales eran planos de una sola cara y podían desaparecer desde determinados ángulos.
6. La chimenea de la Casa de Té usaba altura fija: podía no tocar correctamente el terreno y terminaba demasiado baja respecto de la cubierta.
7. Los carteles lejanos podían colapsar a pocos píxeles y parecer rectángulos oscuros flotando.

## Correcciones

- 13 complejos atómicos: refugio, muelle, puente, mirador, cabaña, puesto, faro, molino, casa de té, torre, cueva, almacén y galpón.
- Cada complejo recibe una raíz `estructura:<clave>` y el culling actúa sobre la raíz completa.
- Reparentado robusto mediante `Object3D.attach()` para preservar transformaciones mundiales.
- Puertas/postigos estáticos quedan dentro del complejo correspondiente; las puertas de construcción del jugador se excluyen expresamente.
- Faro: lente, haz, blanco y brillo pertenecen a la misma raíz.
- Molino: rueda, aspas y luz interior pertenecen a la misma raíz.
- Galpón: molino australiano, tanque, agua y cañería permanecen con el conjunto.
- Shadow LOD sobre las mallas hijas que realmente proyectan sombra.
- Refugio Vivo (fotos, leña, frascos, caña y manta) anclado a la raíz del refugio.
- Cristales estructurales de doble cara.
- Chimenea de Casa de Té continua desde cota real de terreno hasta por encima de la cubierta, con volumen físico equivalente.
- Carteles con LOD de microdetalle a distancia para evitar placas aisladas en el horizonte.

## Contratos preservados

- El marco de acceso de las cabañas mantiene sólo jambas laterales y dintel alto: ninguna madera cruza el paso.
- Las fotos del refugio se anclan a `paredFondoInteriorZ`, no a un offset flotante.
- Las chimeneas de refugio y cabañas siguen siendo fustes continuos.
- La física visual y las plataformas se conservan.

## QA

`verificar-integridad-estructural-rc31.mjs` valida en runtime headless las raíces, puertas, mecanismos, shadow LOD y contratos de terminación.

`verificar-geometria-headless-rc3.mjs` sigue validando mallas, colisiones, plataformas y componentes flotantes.
