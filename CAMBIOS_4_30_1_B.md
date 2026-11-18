# 4.30.1 (B) · el retablo, el árbol pegado y la vecina de pollera

Rama `v4301-b` (desde main = 4.30.0). Los tres puntos de la captura del usuario (Plaza de los Duendes, atrás del retablo) quedaron resueltos y vistos en el juego, con captura antes/después desde el mismo lugar. 0 shaders nuevos (104 programas antes y después), 0 llamadas de dibujo nuevas (el retablo sigue siendo una malla con MAT_FAUNA).

## Arreglado

### 1. El retablo de los títeres (`src/rincones-mundo.js`, `modeloRetablo`)
- **Antes:** una caja verde lisa de 1,7 × 0,5 m y 2,52 m con remate; de atrás y de costado no se veía ni una tabla, la boca era un agujero negro (el fondo `#2a2420`) y la guarda y las cortinas sólo estaban adelante. Al lado de Lucía (9 años) parecía un ropero. Mirar: la cara linda sí daba a la plaza (rot π); la captura del usuario es de atrás.
- **Ahora:** teatrito de 1,5 × 0,56 m, **2,49 m hasta la punta del remate** (repisa a 1,15, boca hasta 1,84): cuatro parantes colorados, tablas paradas con junta oscura en las cuatro caras (7 adelante, 7 atrás abajo y arriba, 3 por costado), repisa con moldura, guarda de rombos rojo/ocre abajo de la repisa y en el dintel, sol pintado al frente, cenefa colorada con flecos, cortinas recogidas en tres pliegues con su lazo, telón azul de noche con luna y estrellas, cornisa, frontón con borde y rombos, remate. Atrás: dos travesaños, la cortina de lienzo por donde entran los titiriteros; a los costados, un rombo pintado. Los títeres de siempre asoman sobre la repisa (mismas medidas). 156 → ~1.300 triángulos, una sola malla.
- El choque del retablo, a la medida nueva (segmento ±0,5 m, radio 0,3, alto 2,45).
- Exportado `modeloRetablo` (para la prueba).

### 2. El árbol pegado (`src/aldea-mundo.js`, `src/aldea-arquitectura.js`)
- **Causa:** uno de los seis álamos que la plaza deja para el mundo estaba en (4,5, −8,5) del marco de la plaza, a 1 m del retablo (3,6, −8,1): tronco y copa salían del retablo. Va a **(7,5, −8,5)** (3 m más allá). La lista queda en `ALAMOS_PLAZA` (nueva, exportada) y `extra.alamos` de la plaza dice lo mismo.
- **Revisada toda la Aldea** con el mismo criterio (álamos del plano y de la plaza, frutales, arbustos contra edificios y rincones): apareció **el frutal de los Jones a 1 m de la casa de Nélida** (copa de 1,8 m metida en el alero). Ahora el frutal del patio prueba el rincón de siempre, el otro y el medio, y va al primero a `COPA_FRUTAL` (2,1 m, nueva) de las otras casas; el de los Jones pasó al otro rincón de su patio (−38, 65). Los demás frutales no se movieron.

### 3. La vecina de pollera colorada (`src/gente.js`, `src/gente-cuerpo.js`)
- **Causa (reproducida):** es Lucía (`aldea-nena`, botas altas). Parada en la ladera, la pierna de arriba sube hasta 7 cm (`tope` en gente.js): la cadera va 0,41 rad adelante y la rodilla dobla 0,86; la rodilla (con el borde de la bota alta) atravesaba la pollera: la mancha gris oscura junto al ruedo. Las de poncho ya tenían tope de 3,5 cm por lo mismo; las de pollera no. (No era la rodillera de la 4.26.1: con pollera no se pinta.)
- **Ahora:** `conPollera` (gente-cuerpo.js, de `R.pollera`: las 15 fichas de pollera, chamal y vestido) y en gente.js las de pollera usan el tope de 3,5 cm; `vestir` lo pasa a la figura nueva al cambiar de ropa.
- **Visto:** las 14 de pollera de la aldea paradas en fila sobre la ladera de 0,57 de pendiente de atrás del retablo (13 cm de pie a pie): antes, a Lucía de frente se le ve la mancha en la rodilla; después, nada. De perfil, ninguna asoma.

## Capturas (mismas vistas; antes = main 4.30.0, después = esta rama)
`pruebas/salidas/humo-4-30-1-b/antes|despues/` (copiadas en `%TEMP%\hx\b4301\`): `1-captura-usuario`, `1-captura-cerca` y `1-captura-niebla` (el lugar de la captura del usuario), `2-retablo-*` (frente desde los bancos, de cerca, costado, atrás, los álamos), `3-polleras-*` (frente a Lucía, perfil de abajo y de arriba, tres cuartos, caminando).

## No se vio a ojo / anotado
- Las de pollera **caminando** (cadera ±0,5 rad): las capturas no muestran bien el paso (sin cambios ahí; no se vio que asome nada, pero tampoco se pudo mirar de cerca).
- El farol que «asoma arriba» del retablo en la captura del usuario es un farol de la plaza que queda detrás, alineado con esa vista: no está pegado al retablo (2,9 m).
- El caballo metido en el árbol es de A (sigue en las capturas de esta rama).

## Pruebas
- Nueva `pruebas/verificar-4-30-1-b.mjs` (en `verify:pasos`): retablo (alto 2,2–2,5, ancho ≤ 1,7, tablas con junta atrás/adelante/costados, cortinas coloradas, telón azul, mira a la plaza), ningún árbol a menos de 2 m del retablo o de la talla, frutales con la copa fuera de las otras casas, nada en la calle, `conPollera` y el tope. 235 verificaciones, **14 mutaciones detectadas**.
- Humo `pruebas/humo-4-30-1-b.cjs` + `herramientas/correr-humo-4-30-1-b.ps1` (candado, minimizado, perfil propio).
- Viejas que leen lo tocado: las 99 `verificar-*` del gate que leen rincones-mundo, aldea-mundo, aldea-arquitectura, gente o gente-cuerpo (entre ellas 3-7-5-rincones, 4-0-3-cuerpos, 3-6-mundo, 3-7-0-integracion, las de triángulos de la gente): **99 en verde, ninguna ajustada**.
- Sin claves nuevas de guardado.
