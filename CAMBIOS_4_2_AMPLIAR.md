# 4.2 · Ampliar el refugio y las casas (rama `v42-ampliar`)

Sale de `v42-pico` (4.0.5 + pico/picapedrero + costo en pesos de las piezas). No se subió la versión, no hay push, merge ni etiquetas. Bloque de construcción de la 4.2: más cosas para construir con los pesos que se juntan (la escala y la receta están en `PRECIOS_CONSTRUCCION.md`) y más uso para el pico (casi todo lo de piedra pide decenas de piedras).

## Qué quedó hecho: 14 piezas

Once **ampliaciones por etapas** (cuatro etapas cada una, con pesos repartidos por etapa) y tres **piezas sueltas** (una etapa). Todo en `src/planos-ampliar.js`. Los triángulos son de la obra entera; la casona, el tope de las casas grandes, tiene 4.416.

| Pieza (id) | Categoría | Pesos | Materiales | Triáng. | Qué es |
|---|---|---|---|---|---|
| Dormitorio anexo (`dormitorio-anexo`) | Refugios | **$20.000** | 14 piedra, 14 tronco, 46 tabla | 2.036 | Cuarto de 4,6 × 3,8: dos camas, mesa de luz, ropero, baúl y alfombra. |
| Despensa de piedra (`despensa-anexa`) | Trabajo | **$20.000** | 58 piedra, 6 tronco, 26 tabla | 2.752 | Muros de piedra con rejillas, piso de lajas, estantes con frascos, jamones colgados, sacos y barriles. |
| Taller anexo (`taller-anexo`) | Trabajo | **$24.000** | 12 piedra, 22 tronco, 64 tabla | 2.296 | Techo de una agua, dos bancos con morsa, la pared de las herramientas, caballetes con tablas, tocón con hacha. Sólo de adorno: no cambia lo que se fabrica. |
| Quincho (`quincho`) | Exterior | **$28.000** | 64 piedra, 22 tronco, 50 tabla | 2.740 | Techo de dos aguas sobre postes, fondo de piedra con asador (brasas, parrilla, campana y chimenea), medias paredes, mesa larga, barra con banquetas, leña. Frente abierto. |
| Galería cerrada (`galeria-cerrada`) | Refugios | **$30.000** | 12 piedra, 25 tronco, 84 tabla | 2.440 | Veranda de 7 × 2,6 con antepecho, ventana abierta y la hilera de vidrio arriba, banco corrido, mesa y macetas. **Sin pared de atrás**: se arrima al frente de la casa (probado con la cabaña) y su puerta queda adentro. |
| Cocina ampliada (`cocina-ampliada`) | Refugios | **$32.000** | 32 piedra, 20 tronco, 60 tabla | 2.796 | Hogar de piedra, cocina a leña con caño, mesada con pileta, alacena, mesa con banquetas, ollas colgadas, barril. De comodidad: las recetas siguen en el fogón y el horno. |
| Bodega de piedra (`bodega-piedra`) | Trabajo | **$36.000** | 108 piedra, 18 tronco, 28 tabla | 3.648 | Muros gruesos de piedra con frontones de tabla, piso de lajas, barriles en su caballete, botellero, estantes, mesa de piedra. Es lo más cerca de un sótano que da el terreno (ver «Lo que NO quedó»). |
| Buhardilla (`buhardilla`) | Refugios | **$42.000** | 18 piedra, 34 tronco, 102 tabla | 3.672 | Casita alta de techo empinado con **altillo** (escalera, baranda, dos camas); abajo, estufa con caño, mesa y estantes. |
| Salón grande (`salon-grande`) | Refugios | **$52.000** | 58 piedra, 54 tronco, 168 tabla | 4.360 | 8,8 × 6: dos hogares de piedra, vigas a la vista, mesa larga de 3,5 m, sillones, estantes, mapa y ocho ventanas. |
| Planta alta con escalera (`planta-alta`) | Refugios | **$64.000** | 28 piedra, 58 tronco, 186 tabla | 4.380 | Casa de dos plantas: sala con hogar, **escalera con baranda**, piso de arriba con hueco, dormitorio, ropero y **balcón** al frente. |
| Torreón de piedra (`torreon-piedra`) | Refugios | **$78.000** | 192 piedra, 36 tronco, 68 tabla | 4.188 | Torre cuadrada de dos plantas, techo en punta, hogar, escalera, cuarto de arriba con cama, escritorio y catalejo. La obra grande del pico. |
| Gran hogar de piedra (`hogar-grande`) | Refugios | **$20.000** | 56 piedra, 2 tabla, 2 tronco | 612 | Hogar de piedra de 4,5 m con grúa y olla, campana, chimenea y banquitos. **Se prende con F** (calienta como el hogar de pared; su humo sale por la chimenea). Va contra una pared, sobre el piso de una sala. |
| Pared de piedra (`pared-piedra`) | Refugios | **$2.200** | 16 piedra, 1 tronco | 216 | La pared modular de 3 m, de piedra hilada. Mismo encastre y colisión que la de tablas; no se pinta. |
| Techo de teja 3×3 (`techo-teja`) | Refugios | **$2.800** | 8 tabla, 2 tronco, 12 piedra | 300 | El techo modular de dos aguas, de teja de barro. Mismo encastre que el de tablas; no se pinta. |

Repartos por etapa (todo en múltiplos de $50), por ejemplo el dormitorio $4.000 + $4.000 + $6.000 + $6.000; la planta alta $9.600 + $9.600 + $25.600 + $19.200. Las once ampliaciones son `soloRelax` (en el Desafío no hay economía); la pared de piedra y el techo de teja están en los dos modos y allí los pesos se ignoran. Los pesos de cada ampliación están entre 1 y 4 veces el valor de sus materiales (2 a 2,6 veces las ampliaciones; la casona está en 4).

## Cómo se arman (extienden lo que ya había)

- **Salen de la fábrica de las casas.** `casa()` de `planos-casas.js` ya daba las cuatro etapas (cimientos y zócalo, piso, paredes, techo y terminaciones), la puerta al frente con su escalón, la física por etapa (`fisicaCasa`) y la regla de ladera de la 4.0.1 (la entrada no puede quedar a más de 0,60 m del suelo: «girala (R)»). Cada ampliación la usa y cambia lo que necesita: las de madera usan las paredes y el techo de dos aguas de las casas (con sus ventanas, hogares, camas y mesas); las de piedra levantan sus muros hilada por hilada (`muro`, con el vano de la puerta justo en la cuarta hilada); las de un lado abierto (quincho, galería) llevan un faldón de piedra bajo el piso.
- **Son `pieza`, no obra grande.** Las casas grandes no se dejan fundar a menos de ~13 m de otra obra grande («Ya tenés una obra al lado»), y el objetivo es arrimar la ampliación a la casa. Como pieza se funda pegada a la huella (probado al lado de la casa con galería y al frente de la cabaña; encima, no).
- **Escaleras y pisos de arriba** (buhardilla, planta alta, torreón): peldaños macizos de 27 cm de subida y `sinTecho` (igual que la escalera de la torre de vigía), losas partidas para dejar el hueco de la escalera, baranda inclinada y baranda del hueco con su colisión. `alto` cuenta las dos plantas: `dentro()` (dormir, confort) y la lluvia ven también el piso de arriba, como la planta baja bajo un entrepiso de la 4.0.3.
- **El torreón reparte los muros en dos etapas** (etapa 2: piso de lajas y muros de la planta baja; etapa 3: entrepiso, escalera y muros de arriba) para no pasar de ~2.000 triángulos por etapa.
- **Pared de piedra y techo de teja** son copias del encastre de `pared-modular` y `techo-modular` (misma familia `modular-muro` / `modular-techo`, mismas medidas), con su colisión declarativa (`fisica`). Un módulo con paredes de piedra (tres) y una con puerta, más el techo de teja, cuenta como «adentro».

## Decisiones mías (cambian fácil)

1. **Las ampliaciones se arriman y tienen su propia puerta.** No hay una puerta de paso a la casa: las paredes de la casa son sólidas y no hay forma de cortarlas. La excepción buscada es la galería cerrada (sin pared de atrás).
2. **No hay `Retroceso` por etapa.** Es lo que pasa con toda pieza de varias etapas (el molino): `deshacerEtapa` sólo mira obras grandes. Para arrepentirse: Mayús + Supr desmonta (la mitad de los materiales y la mitad de los pesos de lo pagado), o se sigue.
3. **La paleta de pintura de la casa (Personalizar) no las pinta** (porque son piezas), pero sí el tinte de la tecla T en las de Refugios (como los módulos). La pared de piedra y el techo de teja no se pintan (`sinPintura`, una línea en `estilo-casa.js`).
4. **Sin techo de chapa nuevo:** ya existe (el techo a una agua, que suena a chapa). Sin hierro entre los materiales no había otra chapa honesta.
5. **Radio de despeje:** `radio` = (mitad de la diagonal + 0,6) / 0,72, porque al levantar la primera etapa una pieza despeja el 72 % del radio: así llega a las esquinas y no queda un árbol adentro del salón.
6. **Piedra un poco más clara** en las ampliaciones que en el zócalo de las casas, para que se vea la hilada.
7. **Categorías:** despensa, taller y bodega en Trabajo; quincho en Exterior; el resto en Refugios. No se tocaron las categorías ni las páginas.

## Archivos

Nuevos: `src/planos-ampliar.js`, `pruebas/verificar-4-2-ampliar.mjs`, `pruebas/humo-4-2-ampliar.cjs`, este archivo.

**Compartidos (los toca también otra rama o son de uso general):**
- `src/construccion.js`: un import (`planos-ampliar.js`), `PLANOS.push(...PLANOS_AMPLIAR)` junto al de las casas, `PIEZAS.push(...PIEZAS_AMPLIAR)` junto al del lujo, y en el bucle de la física de las casas los índices 6 y 7 de cada plataforma (el escalón máximo y las banderas, como `sinTecho` de los peldaños; las casas de antes no los traen y quedan igual).
- `src/main.js`: tres cambios chicos: «Encender el hogar» / «Encendiste el hogar» también para el gran hogar (el regex de `verificar-2-4` sigue pasando), y el panel de obra muestra «n/4 etapas» en las piezas de varias etapas (decía «Se construye de una vez»: también arregla el molino y la estación).
- `package.json`: sólo la línea del gate (`verificar-4-2-ampliar.mjs`).
- `PRECIOS_CONSTRUCCION.md`: la fila de ampliaciones de la escala ahora tiene ejemplos.

Propios de este bloque pero tocados fuera de su archivo: `src/planos-casas.js` (exporta `AYUDAS_CASAS`; `ventana` acepta `dy` y `t`; nada cambia para las casas de antes), `src/casa-viva.js` (la altura del humo del gran hogar), `src/estilo-casa.js` (`sinPintura`).

## Verificación

**Verificado:**
- `pruebas/verificar-4-2-ampliar.mjs` (en el gate): el catálogo (ids sin repetir en todo el catálogo, categorías, modos), los precios (franja, múltiplos de $50, entre 1 y 4 veces los materiales), la geometría de cada etapa en el llano y en una pendiente (sin números rotos, sólo tipo 0 y 4, tope de triángulos), la ladera (con la entrada cuesta abajo no se funda y dice «girala»; girada sí, y se levanta entera), la física con las colisiones reales y un caminante como el de `jugador.js` (se entra por la puerta, el fondo y los costados son sólidos, la escalera se sube y se baja en las tres de dos niveles, la baranda frena en el hueco), `dentro` y la lluvia en dos niveles, la vecindad (arrimadas a la casa con galería y al frente de la cabaña; encima no; una casa grande al lado de otra sigue sin dejarse), mover/desmontar/retomar a medias, el gran hogar, la habitación modular con paredes de piedra y techo de teja, y el guardado (`pagadas`) y el reintegro.
- **En el juego real** (`pruebas/humo-4-2-ampliar.cjs`, Electron en el monitor externo): las 14 piezas levantadas y fotografiadas por fuera y por dentro; el menú muestra «$20.000» en la lista y el precio de cada etapa en la ficha («Costo total · 14 piedras · 14 troncos · 46 tablas · $20.000»); con $1.000 Y no levanta y avisa («La mano de obra cuesta $4.000 y te faltan $3.000»); con plata, cuatro Y, cada una cobra su etapa ($4.000, $4.000, $6.000, $6.000) y sigue la misma obra; Mayús + Supr desmonta y devuelve $10.000; el gran hogar se levanta con Y ($20.000), se prende con F («Encendiste el hogar») y su humo sale de la chimenea.
- `npm run verify` completo, una sola vez y de corrido: **247 pasos OK** (los de la rama del pico más `verificar-4-2-ampliar.mjs`, que tiene 587 verificaciones). Un primer intento cortó en el paso 99 (`verificar-2-4` busca el texto exacto del aviso del hogar de pared en `main.js`): se reescribió el aviso del gran hogar sin tocar esa línea.
- Capturas a tamaño completo (1366×768) en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\ampliar\`.

**Razonado, no probado en el juego:** subir las tres escaleras con el teclado real (se probó con el mismo caminante que replica `jugador.js` y con el arnés de la torre de vigía, no con W y espacio en Electron); dormir adentro de las ampliaciones con E (usa `obras.dentro`, que sí se probó); la ladera sobre el terreno real (se probó con pendientes de 12 %; las capturas son sobre un lugar llano).

**No verificado:** fps en la 4600G (nada por cuadro: son mallas estáticas de una obra, de 2.000 a 4.400 triángulos las ampliaciones y menos de 1.000 las piezas; el salón, la planta alta y el torreón son las más pesadas, como la casona); el techo de teja bajo lluvia (suena a «tablas»: `techoDeObra` sólo conoce la chapa).

## Lo que NO quedó

- **Sótano de verdad:** el terreno no tiene subsuelo (no se puede excavar), así que la bodega de piedra va sobre el piso. Una escalera que baje a un nivel bajo el suelo necesitaría tocar el terreno.
- **Techo de chapa / teja sobre las casas que ya tenés:** el sistema modular admite el techo de teja (se arma sobre pisos y paredes modulares), pero las tres casas prefabricadas no tienen etapa de «mejora de material». Mejorar un techo de una casa ya hecha pide un mecanismo nuevo (`soloMejora`/`mejoraDe` hoy sólo existe para las defensas del Desafío).
- **Una puerta de paso entre la ampliación y la casa:** ver decisión 1.
- **Pared de piedra con puerta o ventana:** sólo la pared llena (la de tablas con puerta y ventana funcionan con los módulos de piedra; sólo hay que combinarlas).
- **Las ampliaciones no suman muebles funcionales nuevos** (cocina, taller): son de adorno y de orden; no cambian recetas ni fabricación.
- **Retroceso por etapa** en las piezas (ver decisión 2).
