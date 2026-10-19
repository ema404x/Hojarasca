# 4.0.5 (rama `v405-dalia`) — cuerpo y ropa de Dalia, con Lucrecia y Ceinwen revisadas

Sale de `origin/ccr-0f18b396-y8d0fm` (4.0.4 + arreglos de la 4.0.5). Sin subir versión, sin push. Sin textos nuevos.
Capturas (a tamaño completo, en el juego real, junto a una vecina normal —la maestra— al lado):
`Documents\Hojarasca\salida-cantina\dalia-405\` → `antes\`, `despues\`, `antes-lucrecia\`, `antes-ceinwen\` (más los `.log` con las alturas medidas).
Visor nuevo: `pruebas/visor-mujeres-405.cjs` (frente, 3/4, perfil y espalda; quieta, tango, chamamé, chamamé solo y caminando; primeros planos de piernas, zapatos y escote; **mide a qué altura del piso queda cada pie** con el esqueleto de verdad).

## Dalia

| Detalle | Qué se veía | Qué se hizo | Estado |
|---|---|---|---|
| Zapatos que flotan | Medido: el taco tocaba el piso pero **la punta quedaba 3,5 cm en el aire** (en quieta; igual en el baile). Era el zapato parado en puntas de pie. De costado se ve claro. | Todo el zapato de taco gira 0,2 rad (`PITCH_TACO`) con la punta hacia abajo, alrededor del tobillo; `alzado` baja de 0,069 a 0,060. Resultado medido: punta y taco a la misma altura (diferencia 0 mm) y la suela a 0–1 mm del piso (las botas de las otras, a −10 mm). | **arreglado y visto** (quieta de frente, 3/4, perfil; tango y chamamé solo) |
| Muesquita en el borde izquierdo de la V | Visto de cerca: el borde de la V tenía un escalón/mordisco donde el lóbulo del vestido atravesaba el parche de piel. **Causa real**: el parche se angostaba en x pero su z seguía la curva del pecho de la columna sin angostar, así que no coincidía con los lóbulos (la 4.0.2 había afinado el ribete pero no tocó esto). | La z de cada vértice del parche sale ahora de la superficie del corpiño (un rayo contra la malla, +6 mm). Solo con `curvas` (Dalia). Un solo arreglo, se hace al armarla. | **arreglado y visto** (de frente y cerca): V de borde limpio, sin escalón. La punta de la V y el ancho arriba quedan donde estaban; **en los lóbulos la V se ve apenas más ancha** porque ya no la muerde el vestido (decisión tuya si querés cerrarla un poco). |
| Chamamé de 3/4 con piernas muy abiertas: la falda como pantalón | **No lo pude reproducir** en tango, chamamé de a dos ni chamamé solo (fases de máximo paso, 3/4, frente, perfil, espalda y piernas de cerca): la falda se lee como falda con tajo; con el paso al 72 % de la 4.0.2 el ruedo se abre poco. En el tango de 3/4 de paso máximo queda algo acampanada. | Nada (no se tocó el seguimiento de piernas de la falda: es el equilibrio que dejó la 4.0.2 —menos seguimiento y las piernas atraviesan la tela—). | **no reproducido, sin cambio** |

## Lucrecia (la moza) y Ceinwen (la galesa), con la misma vara
Frente, 3/4, perfil, espalda, piernas de cerca, zapatos de perfil, escote (Lucrecia) y caminando.
- **Zapatos**: las dos con botas; apoyan igual que la vecina de comparación (−10 mm medidos). No flotan.
- **Falda**: de campana, se lee como falda quieta y caminando. Sin efecto pantalón.
- **Escote de Lucrecia**: V limpia, sin muesca. Solo un piquito rojo chico bajo el nudo del pañuelo en el lado izquierdo (de 3/4 se ve como la solapa del cuello): no lo toqué.
- Ceinwen no lleva escote. **No se cambió nada en ninguna de las dos.**

## Archivos
- `src/gente-cuerpo.js` (**compartido**: lo usa toda la gente del juego; los dos cambios están acotados a `R.tacos` y a `curvas`, o sea solo Dalia).
- `package.json` (**compartido**: se sumó un paso a `verify:pasos`).
- `pruebas/verificar-4-0-2-dalia.mjs` (se adaptó para leer el zapato por `pit(y, z)`; mide igual que antes).
- Nuevos: `pruebas/verificar-4-0-5-dalia.mjs`, `pruebas/visor-mujeres-405.cjs`, este archivo.

## Fluidez
Sin geometría de más ni luces nuevas: el zapato tiene las mismas piezas (solo giradas) y el parche del escote los mismos vértices (440 rayos contra ~1000 triángulos, **una sola vez al armar a Dalia**).

## Lo que NO quedó
- **Caminando, todas** (Dalia, Lucrecia, Ceinwen y la vecina por igual) tienen el pie de atrás a ~6–7 cm y el de adelante a ~13 cm del piso en el instante de máximo paso: es la animación de caminar de `gente.js` (las piernas giran ±0,5 rad con la cadera fija). **Es de todos y es compartido: no lo toqué.** En las capturas con botas casi no se nota; con tacos, un poco más.
- La falda ceñida en el tango de 3/4 de paso máximo queda algo acampanada (no se reprodujo el «pantalón»).
- No se probó en el 4600G ni en la partida completa de la peña (solo la plaza con el visor).
