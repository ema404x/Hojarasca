# Hojarasca — Microconductas Patagónicas RC19

## Objetivo

Subir la credibilidad a corta distancia sin añadir IA pesada: romper los ciclos rígidos de quieto/caminar/huir con pequeños comportamientos propios de cada especie, mejorar la expresividad de cabeza/orejas/cola y hacer que las aves de suelo alternen búsqueda de alimento, observación y posaderos naturales.

## Cambios principales

- Nuevo `src/microconductas.js`: catálogo compartido, selección ponderada, temporizadores y gestos numéricos sin dependencias de Three.js.
- Huemul: alterna forrajeo, rumia, acicalado y vigilancia cuando está seguro; las orejas son pivotes animables independientes.
- Zorro colorado: olfatea, vigila, se acicala o se rasca durante pausas; orejas y cola reaccionan sin interferir con persecución/huida.
- Guanaco: el centinela conserva prioridad de vigilancia; el resto alterna forrajeo, rumia y acicalado. Orejas y cola ganan respuesta local.
- Liebre: orejas móviles independientes, olfateo/acicalado/vigilancia durante pausas y prioridad absoluta a amenazas.
- Zorzal: secuencias de picoteo, observación y rascar hojarasca; puede aparecer en posaderos bajos derivados de árboles reales y volver a vuelo/suelo.
- Bandurria: sondeo del suelo, pausas y vigilancia diferenciados mientras recorre mallines/pastizales.
- Pelaje: segunda frecuencia procedural (`fibraPelo`) en el shader existente para romper el aspecto plástico sin texturas externas ni nuevos draw calls.
- Coste acotado: el módulo de microconductas sólo calcula estados/gestos; no crea mallas, partículas ni búsquedas globales por frame.

## QA

Nueva regresión `pruebas/verificar-microconductas-rc19.mjs` para repertorios por especie, prioridad de riesgo, temporizadores, gestos finitos, orejas/cola, pelaje multiescala y alternancia suelo/posadero en zorzales.
