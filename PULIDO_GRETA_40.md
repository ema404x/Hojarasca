# Pulido de Greta (4.0, rama `pulido-greta-40`)

Objetivo: acercar a Greta (`aldea-anfitriona`) a la hoja de personaje de la anfitriona de la casa de té (referencia 6). Capturas antes/después
(cuerpo, tres cuartos, espalda, cerca, rostro, delantal) en `Documents\Hojarasca\trabajo\greta40\antes` y `\despues`
(`pruebas/visor-anfitriona.cjs`, que ahora acepta `tomas=rostro,cerca` para sacar sólo algunas).

## Qué cambió
- **Cara (sólo Greta, en `cara: {...}` de `gente-ropa.js`):** más redonda y amable (más ancha, menos larga, mandíbula menos angosta), ojos
  más grandes y más abiertos, sonrisa más ancha, cejas más finas y curvas, rubor más marcado.
- **Parámetros nuevos de cara, opcionales (sin ellos todo queda igual):** `pestanas` (largo de las pestañas) y `brillo` (tamaño de los brillos del ojo).
- **Pelo (parámetros nuevos de `R`, opcionales):** `masaPelo` (volumen extra en metros), `rodeteGrande` (rodete un 28 % mayor, con dos rulos
  que lo cruzan) y `mechonesFrente` (dos mechones finos sueltos por lado, delante de las orejas).
- **Ropa:** sin cambios; el cuello alto con botones, la faja con moño y puntas, el delantal con la hoja y las franjas y los zapatos ya estaban.

## Costo
Piezas nuevas chicas (unos 8 husos de pocos triángulos, sólo en el pelo de Greta; las pestañas y los brillos no suman triángulos). Los demás
vecinos no cambian: todo es opcional y sólo Greta lo usa (se comprobó con Dalia). Sin medir fps (lo mide otro).

## Límites
- La forma de la cara es la del sistema común (elipsoide con rasgos): no hay nariz ni pómulos con volumen de la hoja.
- El pelo de arriba sigue leyéndose algo liso; el rodete no se ve de frente.
- Los ojos todavía se ven algo «de muñeca» de cerca; no alcanza el pulido de la ilustración (techo realista ~60-65 %).
