# 4.12.1 · parte B: edificios y luz (rama `v4121-b`, sale de `main` = 4.12.0)

Segunda de la serie de mejoras visuales (la parte A, el agua, va en otra rama y toca `src/agua.js`; acá no se tocó). **No se subió la versión**, no se tocó `main`, sin etiqueta ni zip. Estilo pintado «tal cual HushWood»: nada de texturas ni modelos de afuera, ninguna luz nueva, ningún shader nuevo. **Sólo Media y Alta** (el interruptor es `calidad.post`): en Baja y Mínima el juego arma exactamente lo mismo que en la 4.12.0 (se probó contra las huellas de la 4.12.0).

## Qué se hizo

### 1. Esquinas, aleros y pie oscurecidos (`src/asentado.js`, módulo puro)
Todo va en el **color de los vértices** que el Constructor ya guardaba; las colisiones, los tamaños y las etapas de obra no se tocan.
- **Teselado** (`teselarGeometria`): una pared de caja tiene cuatro vértices, y con eso no hay sombra al pie ni bajo el alero. Los triángulos grandes se parten por el lado más largo (hasta 80 cm) con todos los atributos promediados en el punto medio: la forma y los colores quedan EXACTOS, sólo hay más vértices donde pintar. Los listones finos y lo chico no se parten. Las marcas de zona de la pintura (`estilo-casa.js`) se corren a los vértices nuevos (`remarcarRangos`), así «Personalizar» sigue pintando paredes, aberturas y techos de tus casas y del refugio.
- **Oclusión** (`ocluirGeometria`): una grilla de celdas de 28 cm marca lo que ocupa la geometría y cada vértice mira alrededor. Cuenta las celdas ocupadas por delante de su cara (rincón entrante: pared contra pared, piso contra pared), el alero que sobresale por encima y por delante, las caras que miran al suelo (panza de los aleros, cielos) y el pie (lo pegado al suelo, en las caras que no miran hacia arriba). La sombra es un poco fría (el azul baja menos). El techo abierto al cielo no se toca. Nada queda más oscuro que 0,4 de lo que era.
- **Sombra de contacto** (`src/asentado-mundo.js`, `crearAsiento`): UNA malla para todo el valle (un dibujo) con un anillo suave alrededor del pie de cada edificio (rectángulo redondeado pegado al terreno, borde de adentro con la fuerza plena y el de afuera en cero). El material es un `MeshBasicMaterial` de color por vértice con `SubtractiveBlending` (el color del vértice es cuánto oscurece lo que hay debajo): así el borde es suave sin textura ni alfa. Se arma sólo con lo que está cerca (la distancia de dibujo + 20 m), se rehace sólo cuando algo cambia o la cámara se aleja 28 m, se nota menos de noche y con cielo cubierto, y no se dibuja en Baja. La huella sale de la propia geometría (`huellaDe`: los vértices bajos de la obra).
- **Dónde se aplica:** las obras del jugador (`construccion.js`, en `geometriaDe`: casas, galpones, muebles, cercos…; no los canteros, setos ni la marca de la etapa 0; la sombra de contacto tampoco sobre un piso propio), las estructuras fijas del valle (`estructuras.js`: refugio, cabañas, faro, molino, torre, almacén, galpón) y, de las que ya traían su oclusión pintada, la aldea (`aldea-mundo.js`) sólo suma la sombra de contacto de cada edificio levantado (su lote es parejo: usa su altura).

### 2. Desgaste y musgo por edificio (`desgastarGeometria`)
Cada edificio es distinto y siempre el mismo en la misma partida: la semilla sale de la posición (al decímetro) y el id de la obra (`semillaDe`; **no gasta números al azar del juego**, el bosque no se corre).
- Un **matiz y un brillo propios** (±3 %), aunque la casa sea nueva.
- **Manchas de intemperie** anchas y suaves (oscuras y algo más claras), **humedad que sube del suelo** con un poco de verdín, y **musgo en lo que mira para arriba (techos) y del lado de la sombra**. El sol del juego pasa siempre del lado de +z, así que la sombra cae hacia −z; se tiene en cuenta el giro de la obra. El musgo es un verde con la misma luz que la superficie que cubre (no aclara ni oscurece un techo oscuro).
- **Cuánto:** depende del tipo. Las obras del jugador: refugios 0,30; trabajo 0,26; exterior 0,22; defensa 0,20; mobiliario 0,10 (por un factor propio de cada casa, de 0,6 a 1,4), y **las que están a medio hacer no se manchan** (sólo se oscurecen las esquinas). Las estructuras fijas del valle son viejas: entre 0,45 y 0,6. No se guarda la antigüedad de una obra (no hay fecha de obra en los datos y no se quiso tocar el guardado): recién construida ya tiene el matiz propio y casi nada de intemperie. Si más adelante se quiere que envejezcan con los días, `nivel` ya lo permite.

### 3. Halos de noche en el valle (`crearHalosValle`)
La aldea ya tenía los suyos desde la 4.0 (ventanas, faroles, cantina; `aldea-noche-luz.js`) y no se tocaron. Faltaban:
- las **ventanas encendidas de tus casas** (las que ya dibujaba `ventanas-mundo.js`),
- las **fogatas a cielo abierto** (las estufas, no: ya brillan en su ventana),
- las **ventanas de las estructuras del valle** (refugio, paradas del tren, cabañas, galpón; el almacén sólo si no hay aldea), sacadas de su propio vidrio al primer anochecer (`ventanasDeVidrio`).
Es UNA malla de cuadrados que miran a la cámara, con el **mismo shader de halos** que la aldea y la casa de té (`crearMaterialHalo`: aditivo, mismo programa compilado), y el mismo alumbrado que ya prende los vidrios (`encendido`). Se apaga de día, se dibuja sólo si hay algún halo a menos de 150 m, y la lista se rehace sólo si cambió. Cuesta UN dibujo de noche y ninguno de día.

## Verificación
- **`pruebas/verificar-4-12-1-edificios.mjs`** (en el gate): **978 comprobaciones**: la semilla; el teselado (misma caja y misma superficie, colores exactos, cada triángulo viejo cubierto por sus nuevos, marcas); la oclusión (pie, rincón entrante, alero, panza, techo abierto, pared aislada, nada negro); el desgaste (determinista, otra casa otro aspecto, nueva casi igual, humedad, musgo del lado de la sombra y con la casa girada); la huella; el interruptor de calidad; las 20 obras de todo tipo con todo prendido (**las mismas colisiones y plataformas exactas, la misma silueta**, sin vértices rotos, tope de vértices) y con todo apagado **idénticas a la 4.12.0** (vértices, suma de posiciones y de colores medidos en `main`); la sombra de contacto y los halos (material, mezcla, un solo pase, apagado de día, lejos y en Baja, mismo shader de halos); y el enganche en `main.js`, `construccion.js`, `estructuras.js` y `aldea-mundo.js`.
- **`herramientas/mutar-4-12-1-edificios.cjs`**: 64 mutaciones, **las 64 hacen fallar la prueba** (la primera tanda dejó pasar 7 y se reforzó la prueba).
- Se ajustaron tres pruebas viejas lo mínimo: `verificar-arquitectura-v2.mjs` (el faro arma su malla con `asentarEst(c, 'faro'…)` en vez de `c.geometria()`), `verificar-construccion-ingenieria-rc8.mjs` (la llamada a `crearConstruccion` lleva un argumento más, opcional) y se sacó de un comentario la palabra que `verificar-three-offline.mjs` buscaba en el three local.
- **Partida real** `pruebas/humo-4-12-1-edificios.cjs`: ver el informe final.
- **Gate:** ver el informe final (`npm run verify` de corrido).

## Costo
RELLENAR

## Capturas
RELLENAR

## Lo que no se pudo verificar
RELLENAR
