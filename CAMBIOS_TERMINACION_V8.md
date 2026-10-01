# Hojarasca — Terminación estructural V8

Objetivo de esta pasada: que las estructuras se lean y se comporten como construcciones terminadas, no como conjuntos de piezas colocadas aproximadamente.

## Correcciones principales

- Faro: `y0` se declara antes de cualquier uso; el zócalo pétreo tiene el mismo vano real que la puerta y deja de taparla visualmente.
- Molino: la base de piedra deja de ser un cilindro cerrado detrás de una puerta ficticia; ahora tiene vano real y la torre de madera comienza por encima de la mampostería, eliminando solapes.
- Cabañas: chimenea, leñera, pasamanos y accesorios exteriores consultan la cota local del terreno. El alero de la galería cae hacia afuera y sus postes terminan en la cara inferior de la cubierta.
- Refugio: fogón, bancos, tocones, leña exterior y umbral siguen el terreno en sus puntos reales de apoyo.
- Casa de Té: acceso real; alero con pendiente correcta y postes alineados contra su cara inferior; el peldaño llega hasta el terreno.
- Almacén: alero con drenaje hacia la calle, postes ajustados a la cubierta, escalinata adaptada al terreno y mercadería exterior apoyada sobre la vereda en vez de flotar/hundirse.
- Galpón: cobertizo lateral con postes ajustados a la chapa, tarima de esquila con durmientes, pilas de fardos/cajones sin huecos artificiales y elementos grandes con volumen físico coherente.
- Accesos del refugio, molino y Casa de Té: el espesor de los peldaños se extiende hasta el suelo cuando el terreno cae, eliminando escalones suspendidos.

## Garantías de regresión

Se mantienen y pasan las suites: colisiones core, arquitectura V2, estructuras V3/V4/V5, visual V6, terminación V7 y terminación V8.

El `index.html` incluido contiene `HOJARASCA_INLINE_BUNDLE_V8_TERMINACION` y el módulo de estructuras actualizado.
