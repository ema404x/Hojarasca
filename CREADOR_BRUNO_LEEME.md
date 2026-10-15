# El creador de Bruno Castellanos: empezar acá (hecho el 14-10-2026)

Guía corta para retomar en otra PC. **El plan completo y todas las decisiones están en `PLAN_CREADOR_BRUNO.md`** (23 secciones); esto es el atajo.

## Qué es

Un protagonista fijo, **Bruno Castellanos, 27 años, varón**, que llega al valle buscando paz lejos del ruido de la ciudad. Antes de entrar al bosque el jugador elige **diez personalizaciones**:
cinco de aspecto (rostro, piel, pelo y barba, físico, ropa) y cinco de carácter (personalidad, oficio, gustos, hobby, virtud y defecto). Cada rasgo de carácter trae un pro y un contra que se
muestran en texto, sin números. **Los efectos valen sólo en el Relax** («La noche de los duendes» no los usa). El nombre y el sexo no se eligen.

## Estado (todo en esta rama, `creador-bruno`)

| Fase | Qué es | Estado |
|---|---|---|
| F0 | Documentos de preparación (`RASGOS_BRUNO.md`, `GUSTOS_VECINOS_BRUNO.md`, `TEXTOS_BRUNO.md`) | hecha |
| F1 | Datos, reglas y pruebas (`creador-catalogo.js`, `creador-personaje.js`) | hecha |
| F2 | Pantalla de creación, sección «Bruno» en Personalizar, retrato, pestaña del cuaderno, espejo | hecha, salvo mando |
| F3 | **Efectos** de los rasgos en abrigo, afecto, pesca y cuaderno; guardarropa | **falta** |
| F4 | Prólogo, textos definitivos y las 26 líneas de vecinos (asado y lluvia) | **falta** (los textos los escribe el autor) |
| F5 | Cierre: todas las pruebas, una partida de punta a punta con varios Brunos | falta |

**Lo que ya anda dentro del juego:** «Entrar al bosque» abre la pantalla de creación si Bruno todavía no fue creado (partidas nuevas y viejas); dos pantallas con vista previa 3D que gira; todo se guarda
en `progreso.personal.bruno`; el cuerpo y la mano del jugador usan su aspecto; la ropa de abrigo sigue siendo la de «Tu personaje»; el retrato (foto chica JPEG) se guarda en la partida; la ficha es la
primera pestaña del cuaderno; el **espejo de pie** (pieza gratis, siempre en los planos) viene armado con cada refugio y rehace sólo el aspecto.

## Cómo trabajar

```bash
npm install                      # node_modules no está en el repositorio
node armar.mjs                   # arma index.html (está ignorado por git)
for f in pruebas/verificar-*.mjs; do node "$f" > /dev/null 2>&1 || echo "FALLA $f"; done   # 209 pruebas, todas verdes al subir
npx electron --no-sandbox pruebas/humo-4-1-creador.cjs      # el juego real: crear, guardar, recargar, espejo, cuaderno
npx electron --no-sandbox pruebas/humo-2-8.cjs              # Personalizar de antes: tiene que seguir pasando
```

- En `?debug=1` la creación se **salta** (así siguen andando las 115 pruebas viejas que entran por «Entrar al bosque»); con `&creador=1` se prueba.
- **El lanzador de Electron se traga en silencio los argumentos con dos puntos** (`gen:Bruno`). Usar claves con guion (`gen-Bruno`) y rutas relativas.
- Las capturas van a `pruebas/salidas/` (ignorada por git). Visores: `pruebas/visor-creador-pantalla.cjs` (prototipo fuera del juego), `pruebas/visor-bruno-en-juego.cjs` (con `espejo=1`, el espejo),
  `pruebas/visor-anfitriona.cjs` (`quien=aldea-bailarina nombre=Dalia quietud=cintura`: cualquier persona del vestuario en la plaza del valle).

## Dónde está cada cosa

- `src/creador-catalogo.js`: las diez personalizaciones, las 32 opciones de carácter con sus efectos como datos, los topes y qué le gusta a cada vecino.
- `src/creador-personaje.js`: el genoma, el saneo, la traducción al motor de cuerpos, los efectos con tope, la ficha y la precarga desde «Tu personaje» (partidas viejas).
- `src/personal-bruno.js`: la sección de Personalizar (guarda genoma, `creado`, `retrato`, `espejoPuesto`) y el aspecto del jugador con Bruno.
- `src/creador-pantalla.js`: la pantalla de creación dentro del juego. `src/creador-textos.js`: **todos los textos provisorios en un solo lugar**. `src/creador-ficha.js`: la pestaña del cuaderno.
- `src/planos-espejo.js`: el espejo. `src/main.js`: `crearABruno`, `colocarEspejoDeFabrica`, el enganche de «Entrar al bosque» (buscar `4.1`).

## Lo que hay que saber antes de seguir

1. **Reglas del proyecto que me costó descubrir:** el modo se llama **«La noche de los duendes»** en todo lo que ve el jugador (la prueba `verificar-3-8-textos.mjs` lo exige; «Desafío» es el nombre interno).
   `armar.mjs` sólo entiende imports de **una línea y sin comentario**. Lo que se construye por código hay que copiarlo a `progreso.obras` o no se guarda.
2. **El tope de efectos es simétrico (±20 %) y se aceptó** que el 9,9 % de las combinaciones salga con ganancia neta. La prueba lo acota (falla si pasa del 12 %). Si en la partida de la F5 se abusa,
   la regla C («tope arriba y piso hondo») está medida en la sección 18 del plan.
3. **Falta decidir** (secciones 16 y 17 del plan): cómo calcula hoy el juego el abrigo (para fijar si su tope es ±1 punto o un porcentaje, se resuelve al empezar la F3); y quién escribe las 26 líneas que dicen los vecinos
   sobre el asado y la lluvia (la propuesta es que Claude las borradoree en la voz de cada uno y el autor las corrija). **Ya decidido:** el mate queda como gusto con la afinidad a la mitad.
4. **Deudas con fecha:** la creación **no se completa con mando** (decisión: sólo mouse y teclado) y no tiene letra grande: hay que resolverlo **antes de Steam**. Tampoco se midió el costo de rearmar la
   figura en la placa integrada (Ryzen 5 4600G), ni hay inglés de nada de lo nuevo.
5. **El espejo no refleja:** el vidrio es un panel de color.

## También viaja en esta rama (no es del creador)

Dos personajes nuevos del motor de cuerpos, hechos antes: **Greta** (`aldea-anfitriona`, la anfitriona de la casa de té) y los retoques de **Dalia** (`aldea-bailarina`). Las opciones nuevas están en
`gente-cuerpo.js` y `gente-ropa.js` detrás de banderas propias (`polleraLarga`, `colManga`, `faja`, `delantalSinPechera`, `delantalHoja`, `jumper`, `cuelloAlto`, `mangaAbullonada`, `zapatos`,
`vivoPollera`, `rodeteBajo`, `peloEsculpido`, `escoteHondo`, `collar`, `cara.rubor`, brillo de raso para el paño de fiesta); ningún otro personaje cambia. **Greta todavía no está dada de alta en el valle**: existe
sólo en el estudio. Nada de esto está documentado en otro lado: este es el único registro.

## Base de esta rama

Sale de `v392-cantina` (la 3.9.1 con la cantina y la peña). **Esa rama tenía 54 commits que nunca se habían subido**; al subir esta rama viajan con ella.
