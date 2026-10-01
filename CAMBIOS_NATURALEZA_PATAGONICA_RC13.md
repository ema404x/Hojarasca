# Hojarasca — Naturaleza Patagónica RC13

## Objetivo

RC13 cambia el criterio de generación natural de Hojarasca: la flora y la fauna dejan de depender principalmente de densidades genéricas y pasan a obedecer un **contrato ecológico de Patagonia argentina**. El mundo sigue siendo 100% procedural y offline; no se incorporaron modelos, texturas ni audios descargados.

## Perfil ecológico común

Se incorpora `src/patagonia.js` como fuente única de criterios naturales. El terreno se clasifica dinámicamente en bosque húmedo, bosque abierto, ribera, mallín, ecotono, estepa y altoandino a partir de bosque, estepa, humedad/proximidad al agua, altura, pendiente y exposición.

Este perfil es consumido por vegetación y fauna para evitar que una especie aparezca sólo porque una tirada aleatoria cayó dentro de una máscara global.

## Flora

- Contrato regional explícito para coihue, lenga, ñire, ciprés de la cordillera, arrayán, maitén, pehuén, coirón, neneo, calafate y notro.
- Coihue, lenga y ñire pasan a tener tres variantes procedurales; ciprés, dos.
- Los rodales comparten una variación de edad/porte de baja frecuencia para reducir el efecto de ejemplares independientes colocados al azar.
- Lenga y ñire expuestos o altos se achaparran: menor altura y copa relativamente más ancha.
- El ecotono pierde densidad arbórea gradualmente antes de la estepa, en vez de cortar el bosque de forma abrupta.
- Ribera, mallín, ecotono y estepa reciben sotobosque específico.
- La estepa combina coirón, neneo y apariciones moderadas de calafate, con claros de suelo desnudo.
- Se agregan árboles muertos en pie muy escasos en bosque maduro/húmedo para romper la perfección del paisaje sin saturarlo visualmente.

## Pasto y viento

- El shader de pasto recibe ahora `uEstepa`.
- En la transición oriental, el pasto verde pierde cobertura y aparece una base de coirón más rala, seca y dorada.
- La estepa recibe una respuesta algo mayor a las ráfagas.
- La vegetación separa rigidez de tronco y follaje: el tronco absorbe una fracción pequeña de la deformación y la copa conserva el movimiento principal. Esto reduce el aspecto de “árbol de goma”.

## Fauna

### Materiales

- La fauna compactada conserva el shader de contraluz de la geometría original.
- Se añade microvariación procedural muy sutil al material para romper superficies excesivamente planas/plásticas sin introducir texturas externas.

### Huemul

- Silueta más robusta y menos parecida a un ciervo genérico.
- Mejor separación de cabeza, hocico, orejas, ojos, patas, pezuñas y cornamenta.
- La distribución favorece ambientes montanos, ecotonales y bosque abierto y admite pendientes fuertes razonables.
- La locomoción reduce el rebote artificial y añade transferencia de masa/rolido muy leve.

### Zorro colorado

- Pelaje procedural rojizo/gris/blanco por zonas, orejas más expresivas y cola larga con punta oscura.
- Patas segmentadas y ojos/nariz diferenciados.
- Se mantiene el comportamiento regional ya existente y se mejora la lectura visual a distancia media.

### Pudú

- Cuerpo más compacto y profundo, patas cortas segmentadas, hocico, orejas, ojos, cola y cornamenta corta en el macho.
- Se conserva como fauna de ambientes boscosos húmedos.

### Guanaco

- Nuevo cuerpo procedural con dorso leonado, cabeza grisácea y vientre/hocico claros.
- Patas altas segmentadas, cuello largo, orejas y pezuñas más legibles.
- La tropilla incluye una cría de menor tamaño.
- El grupo comparte alarma; un adulto actúa como centinela y reacciona antes.
- Se añade cohesión grupal para que los individuos no se comporten como partículas independientes.
- La aparición y el movimiento priorizan la estepa y ambientes abiertos.

### Cóndor

- Se agregan cobertoras/parches claros en el adulto, además del collar, para mejorar su lectura en vuelo sin aumentar excesivamente la geometría.

## Rendimiento

La mejora mantiene la estrategia procedural/instanciada existente:

- las variantes se reutilizan por lote en lugar de generar un material único por individuo;
- el pasto continúa en GPU;
- no se añaden texturas externas ni modelos importados;
- la variación regional se deriva de funciones y ruido ya disponibles en runtime.

## Regresión RC13

Se incorpora `pruebas/verificar-naturaleza-patagonica-rc13.mjs`, integrada en `npm run verify`.

La suite comprueba:

- presencia real de bosque húmedo, ecotono y estepa en el terreno generado;
- reglas deterministas de selección de coihue/ñire/lenga y ausencia de árbol en estepa fuerte;
- achaparramiento del ñire expuesto;
- contrato nativo de flora/fauna principal;
- shader de estepa/coirón y respuesta de viento;
- árboles muertos en pie y variantes arbóreas;
- conservación del contraluz en fauna compactada;
- tropilla de guanacos con cría, alarma, centinela y restricción ecológica.

## Limitación de validación

La lógica, distribución, sintaxis, build y pruebas headless pueden verificarse automáticamente. La evaluación final de escala aparente, legibilidad de siluetas, popping/LOD, balance cromático y coste GPU debe hacerse además mediante recorrido visual en hardware real con Electron/WebGL.
