# Hojarasca — Construcción Advanced Modular RC8

Versión objetivo: **1.0.0-rc.8**

RC8 no es una expansión de catálogo aislada. Es una pasada de arquitectura para que el sistema de construcción pueda crecer en altura, densidad e interacción sin acumular colisiones fantasma, dependencias ambiguas ni excepciones ad hoc.

## Resultado funcional

- **21 planos** totales, conservando las cuatro categorías de RC6/RC7.
- Nuevos módulos: **Techo modular 3×3**, **Escalera de acceso** y **Baranda modular**.
- Pared con puerta: genera una puerta realmente interactiva al terminarse.
- Pared con ventana: genera postigos realmente interactivos al terminarse.
- Snap modular que no sólo traslada: también corrige orientación cuando el soporte define un eje válido.
- Soporte obligatorio para techo y baranda; no pueden fundarse flotando sobre terreno desnudo.
- Selección de edición/desmontaje consciente del plano activo para distinguir piezas apiladas.

## Ingeniería espacial

La validación anterior era predominantemente planar. RC8 separa dos preguntas:

1. ¿Las huellas se intersectan en X/Z? — OBB/SAT.
2. ¿Los volúmenes ocupan además el mismo intervalo vertical? — intervalos Y.

Una interferencia sólo se rechaza cuando ambas condiciones son verdaderas, salvo uniones estructurales expresamente permitidas. Esto elimina falsos positivos típicos de sistemas 2D al colocar techo, baranda o escalera alrededor de una misma planta.

Las uniones lineales compatibles aceptan contacto de extremos dentro de tolerancia, evitando que dos tramos correctos sean tratados como solapamiento ilegal.

## Ciclo de vida de física e interacción

`src/colisiones.js` incorpora remoción de una referencia física exacta además de la remoción por dueño. `src/puertas.js` propaga `duenio` a grupos y colisiones dinámicas y permite eliminar todas las interacciones de una obra.

El ciclo de edición queda transaccional:

- iniciar edición: retirar física e interacciones hijas, ocultar pieza;
- confirmar: validar destino y reconstruir una sola vez;
- cancelar: restaurar exactamente el estado anterior;
- desmontar: retirar geometría, física e interacciones sin residuos.

Así una puerta construida no queda duplicada ni conserva una colisión invisible después de mover su pared.

## Snap y soporte

- Pared/baranda → borde de piso compatible.
- Techo → centro del piso, con orientación heredada y elevación estructural.
- Escalera → borde exterior del piso, orientada hacia el acceso.
- Piso → piso; muro → muro; cerco → cerco; pasarela → pasarela, manteniendo familias compatibles.
- El modo libre sigue disponible con **N**.

## Física nueva

La escalera registra cuatro plataformas físicas escalonadas. La baranda registra un segmento sólido de protección. El techo es visual/estructural y no inventa una colisión inclinada que la API actual no pueda representar fielmente.

## Compatibilidad

- Se conserva la rotación histórica en pasos de **45°**.
- No se crea una quinta categoría de UI.
- El guardado previo sigue usando la misma estructura de obras; las nuevas propiedades tienen valores por defecto.
- Se mantienen los invariantes RC2–RC7.

## Regresión automática RC8

`pruebas/verificar-construccion-ingenieria-rc8.mjs` cubre:

- presencia de los tres módulos nuevos;
- rechazo de techo/baranda sin soporte;
- auto-orientación de pared desde 45°;
- techo centrado y elevado;
- baranda con obstáculo físico;
- escalera con cuatro plataformas;
- puerta y postigos funcionales;
- alta/baja de interacción durante edición;
- cancelación sin duplicados;
- selección correcta de techo apilado sobre piso;
- remoción individual de colisión dinámica sin borrar hermanos.

El test forma parte de `npm run verify` y el release gate exige explícitamente la cadena **RC2–RC8**.
