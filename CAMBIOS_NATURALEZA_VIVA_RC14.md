# Hojarasca — Naturaleza Viva RC14

RC14 profundiza la pasada regional de RC13 sin tocar la línea de construcción/hábitat congelada de RC12. El objetivo es mejorar **realismo de contacto, silueta y locomoción** manteniendo el presupuesto de GPU bajo control.

## Flora y suelo

- Coihue, lenga, ñire y ciprés incorporan ensanche basal y raíces superficiales en LOD cercano.
- Coihue/lenga/ñire pasan de 3 a **4 variantes**; ciprés pasa de 2 a **3 variantes**.
- La variante deja de depender sólo del chunk: un hash espacial determinista da diversidad individual dentro del rodal sin perder estabilidad entre partidas.
- Nueva geometría `mantaHojarasca`: hojas secas y ramitas instanciadas por parches en bosque, excluyendo senderos, pendientes fuertes y estepa abierta.
- La capa de hojarasca usa un material sin viento y se limita a ~52 m o al radio de sotobosque configurado, lo que sea menor.

## Fauna

- Nueva función `inclinacionTerrenoMamifero()` calcula pitch/roll desde `T.normal()` en el sistema local del animal.
- Huemules y ciervos que usan `actualizarCiervo()` acompañan suavemente la pendiente.
- Zorro colorado, guanaco y pudú usan la misma adaptación al terreno.
- El pudú deja el Lambert simple heredado y reutiliza `lam()` de `vida.js`, por lo que recibe contraluz y microvariación de pelaje como el resto de la fauna premium.

## Rendimiento

- No se crean props individuales de hojas: la hojarasca se agrupa en geometrías repetidas mediante `InstancedMesh`.
- La capa de suelo orgánico se apaga antes que los árboles lejanos.
- La variedad de árboles reutiliza geometrías pregeneradas; no genera una malla nueva por individuo.

## Verificación

Se añade `pruebas/verificar-naturaleza-viva-rc14.mjs` al pipeline principal. Verifica raíces, hojarasca, presupuesto de distancia, variantes individuales y alineación a pendientes para huemul/ciervo, zorro, guanaco y pudú.
