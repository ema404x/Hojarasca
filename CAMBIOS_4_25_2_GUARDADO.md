# 4.25.2 · guardado, economía, códigos, teclas y mundo (zonas G2 y G3 de la revisión de la 4.25.1)

Rama `bugs-4-25-2-guardado` (sobre `main` = 4.25.1). Insumos: `trabajo/bugs10/zona-G2.md` y `zona-G3.md`. No se subió la versión. Sin shaders, sin texturas; no se tocaron las sombras ni la huella del terreno. Claves nuevas de guardado, todas opcionales (una partida vieja carga igual): `desafio.facilitada`, `desafio.trucos`, `negocios.reventa`, `negocios.casas.puesto.reventa` y `reventa` en los datos de la tienda de campo.

## Arreglado

| # | Qué pasaba | Arreglo |
|---|---|---|
| M1 | Con una perilla «más fácil» el récord de la semilla se anotaba igual: el amanecer llamaba `recordDeSemilla()` antes de la guarda de `registrarRecords` | `desafio.js`: el amanecer usa `sinRecords() ? null : recordDeSemilla()` |
| M2 | Las perillas se miraban sólo al alba: con −2 cuatro noches y 0 en la quinta, al alba salía «Viento blanco» y el récord de 5 noches | La partida queda marcada (`desafio.facilitada`) si una noche corre con alguna perilla más fácil: al empezar la noche, en cada cuadro de la noche (si se baja a mitad) y al alba. Con la marca no se anota ningún récord (campaña, semilla, puntos de la partida en la meta) ni vale Implacable. La corrida sin fin no usa perillas: no se marca |
| M3 | La consola de códigos en el Desafío no dejaba marca: `materiales 9999` daba «Pueblo de troncos», `volar`/`velocidad` aguantaban noches y récords | En el Desafío, el primer código que cambia algo marca la partida (`desafio.trucos`) y lo avisa en la consola («con códigos, esta partida … ya no da logros ni anota récords»). Con la marca: `anunciarLogros` no da ninguno (tampoco Steam), `registrarRecords` no anota, la corrida sin fin no entra en sus récords y los puntos de la partida no van al récord de la meta. No marcan: ayuda, estado, guardar, limpiar, salir, donde, descongelar, `ir` sin destino (sólo lista) y lo que en el Desafío no anda (plata, planos…) |
| M4 | Comprar en la parada que produce (52-78 % del valor) y dejarlo en la tienda de campo (96 %) o en la consigna ganaba siempre | `src/reventa.js`: se lleva la cuenta de lo comprado en la trochita (unidades y lo pagado). Al dejar mercadería en la tienda o en la consigna, los lotes que salen de esa cuenta van marcados con su costo y se cobran, como mucho, lo que costaron. Lo propio (el horno, el telar, la granja) se paga como siempre: no se tocó ningún precio. La cuenta se recorta a lo que hay en la mochila al dejar; sacar de la consigna devuelve lo marcado a la cuenta. La tienda avisa «lo comprado en la trochita se vende a lo que te costó» |
| B1 | `guardar` en la consola decía «partida guardada» aunque `guardar()` devolviera false (partida de una versión más nueva, reiniciando, sin lugar) | Si no guardó, lo dice |
| B2 | `cuaderno completo` anotaba el refugio y el viaje, que la Historia toma como objetivos (capítulos 1 y 2), sin la marca `trucos.historia` | Si anota alguno de esos y su objetivo no estaba hecho, deja la marca de la historia (como `historia capitulo N`) y lo avisa |
| B4 | «Importar acá» no avisaba que una partida con la historia vieja a medias se reinicia al abrirla | El aviso de importar suma la misma línea que la carpeta sincronizada (`avisoImportarHistoria`, que no avisa con la copia previa: esa se importa justamente para recuperar) |
| G3-1 | Una acción puesta en una tecla fija del juego (Q, R, V, G, B, T, N, X, U, Tab, Enter, 1-9, [, ]) dejaba esa función sin tecla: con «Juntar» en la Q no había caña | `cambiarTecla` las rechaza con «Q ya la usa el juego para sacar y guardar la caña: elegí otra». Un mapa guardado con alguna vuelve a la de fábrica en esa acción (los demás remapeos quedan), se guarda así y una nota dice cuáles volvieron. La prueba nueva compara la lista con los `case` del `switch` de main.js |
| G3-2 | La noche de la nevada miraba `e.code` crudo: con «Juntar» en otra tecla esa tecla entraba al juego (sentarse, hablar, dormir) | La noche recibe `traducirTecla` (el `codigoCanonico` de main.js) y corta la tecla traducida. `dormir()` no anda con la noche activa |
| G3-3 | La cámara arriba del techo (modo foto, plano alto de una escena) contaba como «adentro» y apagaba el valle | El techo de los edificios de la aldea guarda su `alero` y `interiorDe` no da adentro por encima; la casa de té llega hasta su alero (0,38 + 2,7 m) y no hasta 4 m |
| G3-4 | El panel de la Historia no se volvía a medir al cambiar sólo el ancho de la ventana o el tamaño de letra | La clave del panel suma `innerWidth` y la escala de letra |
| G3-5 | Perder el foco con Mayús apretada dejaba la escena acelerada | `blur` de la ventana suelta la Mayús de la escena (en main.js, al lado del `keyup`; no se tocó escenas-mundo.js) |

## No arreglado

- **B3** (partidas de antes de la 4.23.0 que al retirar una marca o desmontar devuelven el precio nuevo, más bajo): la partida guarda sólo cuántas etapas se pagaron (`datos.pagadas`), no cuánto. No hay de dónde sacar lo pagado; queda como pregunta abierta.

## Preguntas abiertas

1. **B3**: ¿guardar desde ahora lo pagado en cada obra (`datos.pagado`) para que los reintegros futuros sean exactos? Lo ya construido seguiría devolviendo el precio nuevo (no se sabe lo viejo). Otra opción: guardar con la partida la versión en que se pagó cada etapa y usar la tabla de precios de antes de la 4.23.0 para esas.
2. **G3-1**: con las teclas fijas fuera, ya no queda ninguna letra libre (las 26 son de una acción o fijas del juego). Para mover una acción quedan el 0, el teclado numérico, las F, la puntuación, las flechas, Ctrl, Alt y Mayús derecha; para intercambiar dos acciones hay que pasar por una libre. ¿Se quiere poder remapear también las teclas fijas (la caña, soltar, la carpa) como acciones?
3. **M3**: con códigos, la partida igual entrega la semilla del Coihue al terminar (es lo que se gasta en la partida siguiente, no un récord) y anota la victoria del modo para los desbloqueos. ¿Se corta también eso?
4. **M2**: la marca es para toda la partida (los récords son de las noches de toda la partida). Una «otra vuelta» empieza sin marca.
5. **M4**: vender en una parada lo propio y dejar lo comprado en la tienda: la cuenta no sabe cuál de las unidades vendiste, así que se cuenta que vendiste lo propio (lo que dejás sigue marcado). Si compraste, te lo comiste y después hiciste más, lo nuevo cuenta como comprado hasta que la cuenta se recorta (al dejar, a lo que hay). Las ventas a vecinos, encargos y pedidos no miran la cuenta (el informe sólo midió la tienda y la consigna).

## Pruebas

- Nueva: `pruebas/verificar-4-25-2-guardado.mjs` (en `verify:pasos`, antes de `verificar-build-reproducible`): 103 comprobaciones y 29 mutaciones (todas atrapadas). Las mutaciones de módulos se cargan de copias en `src/` llamadas `*-mutN.js` que se borran al terminar. M4 se mide con los precios de verdad de cada parada que vende cada cosa de la tienda (5 días × 3 estaciones, existencias al mínimo): ningún caso gana; en la consigna, con la demanda y el evento al máximo, tampoco.
- Ajustadas (por leer el código como texto o por usar una tecla que ahora es fija), sin aflojarlas:
  - `verificar-mando.mjs`: el cambio válido de la linterna era la N y el del taller la T; ahora `Semicolon` y `Comma`, y se suma que la N se rechaza y que una T guardada vuelve a la L.
  - `verificar-4-22-0-a.mjs` (y sus mutaciones `mutaciones-4-22-0-a.mjs`): la línea del logro de la noche y la guarda de `registrarRecords` (ahora `sinRecords()`, que mira las perillas).
  - `verificar-4-12-2-carro-guardado.mjs`: `avisoImportar` recibe un argumento más (la versión nueva se sigue pasando).
  - `verificar-4-15-0-historia.mjs`: el import de `historia-reinicio.js` en main.js suma `avisoImportarHistoria`.
- `node armar.mjs` y `npm run verify:paralelo` (360 pasos), con el gate del otro worktree corriendo a la vez en la misma máquina. Primera corrida: fallaron mando, 4-12-2, 4-15-0 y 4-22-0-a (las ajustadas de arriba) y seis por carreras y carga (premium-rc6 por tiempo, optativas-a, 4-18-3-gastos y 4-19-0-a por carpetas temporales que desaparecían, release y 4-24-1-c por las copias de mutación de otras pruebas); las seis pasan solas. Segunda corrida: 356 de 360; las cuatro que fallaron (2-1, 3-3-fluidez, 4-6-0-mate, 4-22-0-c) recorren `src/` y tropezaron con copias de mutación que otra prueba acababa de borrar (ENOENT); pasan solas. Para achicar esa ventana, la prueba nueva borra sus copias apenas las carga.
- `node herramientas/revisar-escritura.cjs` sobre lo tocado: sin avisos (LF, sin caracteres de control).
