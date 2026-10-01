# RC31.1 — Hotfix de shaders y QA en Windows

## Error crítico corregido

El microdetalle de materiales agregado en RC28 (`materialVegetal`, `src/materiales.js`) leía el
atributo de vértice `aTipo` dentro del **fragment shader**. En WebGL los atributos sólo existen en
el vertex shader, por lo que el programa no compilaba (`'aTipo' : undeclared identifier`) y la GPU
descartaba el material: árboles, vegetación y estructuras que lo comparten podían no dibujarse.

- `aTipo` se propaga ahora mediante el varying `vTipoVeg`.
- `esMadera` / `esMineral` leen `vTipoVeg`; la lógica visual no cambia.
- Nueva prueba `pruebas/verificar-shaders-rc31-1.mjs` (incluida en `npm run verify`): falla si
  cualquier bloque inyectado en un fragment shader usa un atributo de vértice.

## QA

- Las pruebas con `new URL(import.meta.url).pathname` generaban rutas `C:\C:\...` en Windows; ahora
  usan `fileURLToPath` (RC3, RC6–RC12).
- `verify:geometry` reportaba el terreno como "malla flotante" (falso positivo por voxelizar
  laderas empinadas). El terreno se nombra `terreno` y la auditoría lo excluye.

## Resultado

- `npm run verify`: todo en verde.
- `verify:geometry`: 0 candidatos graves · `verify:physics`: 0 lugares a revisar.
- `verificar-refugio.cjs` / `verificar-cabanas.cjs`: paredes, puerta y piso correctos, 0 errores de shader.
- Smoke en GPU real (alta/verano, alta/invierno+lluvia, media/otoño, muy baja): recorrido por los
  16 lugares a distintas horas + caminata, 0 errores de consola / runtime.
