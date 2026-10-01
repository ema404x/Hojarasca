# Hojarasca — Construcción Multi-Level Structural RC9

Versión objetivo: **1.0.0-rc.9**

RC9 convierte el sistema modular vertical de RC8 en una arquitectura multinivel con contratos estructurales explícitos. El objetivo no es permitir piezas flotantes, sino que un segundo nivel tenga soporte verificable, circulación real y dependencias seguras.

## Catálogo

- Total: **25 planos**.
- Nuevos: **Pilar de esquina**, **Entrepiso modular 3×3**, **Entrepiso con hueco** y **Escalera interior de nivel**.
- Se mantienen las cuatro categorías históricas para no romper UI, progresión ni regresiones.

## Contrato estructural

Un entrepiso requiere una plataforma inferior y soporte vertical válido. Se acepta cualquiera de estas configuraciones:

- dos paredes modulares opuestas;
- tres o cuatro lados de pared;
- cuatro pilares de esquina;
- combinación de al menos dos paredes y dos pilares.

Paredes con puerta y ventana cuentan como muros estructurales. El chequeo se hace en coordenadas locales del módulo, con tolerancias de posición, orientación y cota.

## Dependencias seguras

Antes de mover o desmontar una pared/pilar estructural se simula su ausencia. Si un entrepiso terminado quedaría sin soporte suficiente, la operación se bloquea. Esto evita niveles superiores suspendidos después de editar la base.

## Entrepiso con hueco

La variante de escalera no usa una plataforma física completa. Registra tres plataformas que rodean la abertura, de manera que el hueco visible coincide con el hueco transitable.

## Escalera de nivel

- Once peldaños físicos.
- Snap exclusivo a un entrepiso con hueco.
- La cota inferior se deriva del nivel objetivo, por lo que la escalera nace en el piso inferior y llega al superior.
- No puede fundarse libremente si no existe un hueco compatible.

## Apilado vertical sin ambigüedad

El snap estructural transporta la cota exacta de la plataforma objetivo. Muros, pilares, techos y nuevos entrepisos pueden encastrar sobre niveles ya elevados sin depender de una búsqueda limitada al terreno. En empates X/Z, una pieza nueva prioriza el nivel modular más alto; durante una edición se prioriza la cota original para no saltar accidentalmente de piso.

`fundar()` devuelve además la referencia exacta de la obra recién creada. Esto elimina una ambigüedad que sólo aparece con pisos apilados: buscar después “la pieza más cercana” podía encontrar la pieza homóloga del nivel inferior.

## Catálogo escalable

Las categorías con más de ocho planos se paginan. Las teclas **1–8** actúan sobre la página visible y **[ / ]** cambian de página. El panel también expone botones anterior/siguiente y número de página.

## Regresión

`pruebas/verificar-construccion-multinivel-rc9.mjs` valida:

- rechazo de entrepiso sin soporte vertical;
- aceptación con paredes opuestas;
- aceptación con cuatro pilares;
- bloqueo de desmontaje de un soporte crítico;
- hueco físico de tres plataformas;
- escalera de once peldaños;
- cota inferior correcta de la escalera;
- rechazo de escalera sin hueco;
- apilado estructural verificado hasta tres niveles en la regresión;
- avance de la referencia exacta recién fundada;
- paginación y atajos del catálogo.
