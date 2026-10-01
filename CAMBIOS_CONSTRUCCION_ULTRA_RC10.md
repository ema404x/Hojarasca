# Hojarasca — Construcción Ultra Premium RC10

## Objetivo

RC10 convierte el sistema modular en una capa de arquitectura habitable, no sólo en piezas colocables. La build mantiene compatibilidad con RC2–RC9 y añade semántica espacial verificable.

## Catálogo

El catálogo pasa de 25 a **30 planos**:

- Pared con marco abierto.
- Media pared modular.
- Pared con ventanal.
- Techo a una agua 3×3.
- Cubierta plana transitable.

## Habitaciones semánticas

`estadoModulo(base)` inspecciona piezas terminadas en el sistema local del piso/entrepiso y calcula:

- cuatro lados N/S/E/O;
- qué lados están realmente cerrados;
- accesos;
- ventanas;
- cubierta;
- cubierta transitable;
- estado protegido;
- habitación cerrada/habitable.

La detección exige cota y orientación compatibles, por lo que funciona con edificios apilados sin mezclar pisos distintos.

## Integración con refugio

`dentro(pos)` conserva refugios históricos y ahora también reconoce una habitación modular cuando tiene cuatro cierres, una cubierta y al menos un acceso. Esto permite que mecánicas existentes basadas en estar “adentro” funcionen con una casa diseñada por el jugador.

## Coherencia durante edición

Una pared/techo que está siendo movido se excluye del diagnóstico semántico mientras su física y visual están retiradas. Cancelar restaura el estado; confirmar lo recalcula en la nueva posición.

## Reglas estructurales

- La media pared es separación/protección visual, no soporte de entrepiso.
- El marco abierto puede aportar soporte vertical y acceso, pero no cuenta como cierre climático.
- Las paredes completas, puerta y ventanas siguen actuando como soporte vertical.

## Física e interacción

- Ventanal ancho con postigos funcionales administrados por propietario.
- Cubierta plana con una plataforma física real, no una superficie caminable ficticia.
- Techo a una agua comparte el contrato de snap de cubiertas y se detecta como cubierta de habitación.

## UX

El panel de construcción muestra en vivo el estado del módulo cercano, cantidad de lados cerrados, accesos, ventanas y tipo de cubierta.

## QA

Nueva suite `pruebas/verificar-construccion-ultra-rc10.mjs`:

- presencia de los 30 planos;
- habitación completa antes/después de colocar techo;
- reconocimiento por `dentro()`;
- edición temporal de una pared sin estado fantasma;
- marco abierto como espacio protegido pero no cerrado;
- rechazo estructural de entrepiso sobre medias paredes;
- cubierta plana transitable;
- postigos funcionales del ventanal;
- integración del diagnóstico en la UI.
