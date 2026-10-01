# Hojarasca — Construcción Senior RC7

## Objetivo

RC7 convierte el sistema de construcción de RC6 en una arquitectura editable y extensible sin sacrificar estabilidad. La prioridad fue resolver primero la propiedad de la física y recién después habilitar edición y snap.

## Cambios principales

- **18 planos** totales, manteniendo las cuatro categorías existentes.
- Kit modular nuevo: **Piso modular 3×3**, **Pared modular**, **Pared con puerta** y **Pared con ventana**.
- **Snap geométrico** por familias: pisos con pisos, muros con muros/bordes de piso, cercos con cercos y pasarelas con pasarelas.
- **N** alterna snap/colocación libre.
- **Shift+Y** inicia recolocación de una pieza terminada cercana; **Y** confirma; **Supr** cancela.
- **Shift+Supr** desmonta una pieza y devuelve parte de los materiales consumidos.
- Los pisos modulares detectan **dependencias apoyadas** y bloquean movimiento/desmontaje hasta liberarlas.
- La grilla de colisiones ahora admite `duenio` y `eliminarPorDuenio()`. Obstáculos y plataformas de una obra pueden retirarse de todos sus índices de forma segura.
- `rehacer()` reconstruye la física de una obra de forma determinista y evita duplicados después de mover, cargar o avanzar etapas.
- Las piezas modulares usan validación de **rectángulos orientados (OBB/SAT)** para impedir solapamientos entre variantes distintas sin volver a los radios circulares imprecisos.
- El fantasma cambia de tono cuando está realmente encastrado y el panel muestra el estado de snap y edición.

## Seguridad de compatibilidad

- Se conserva la rotación de **45°** de RC6. El snap sólo acepta orientaciones compatibles cuando conecta paredes a bordes de piso.
- Las cuatro categorías de RC6 permanecen intactas.
- Los planos históricos siguen usando sus reglas previas cuando no declaran huella/snap preciso.
- Las partidas anteriores continúan cargándose mediante el mismo formato de `progreso.obras`. No se agrega una migración destructiva.

## Verificación

La nueva prueba `pruebas/verificar-construccion-senior-rc7.mjs` valida:

1. existencia de los cuatro módulos nuevos;
2. snap de pisos a exactamente un módulo de 3 m;
3. snap de muros a bordes de piso;
4. bloqueo de desmontaje cuando hay dependencias;
5. retirada de física durante edición;
6. restauración de física al confirmar;
7. desmontaje sin colisiones fantasma y con recuperación de materiales;
8. modo snap desactivado realmente libre;
9. limpieza por propietario en la implementación real de `colisiones.js`;
10. controles y ayuda visibles sincronizados.
