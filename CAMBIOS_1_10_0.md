# 1.10.0 — Vida de campo, y más Desafío

Nueve cosas de una lista de diez (la del fuego que se escapa quedó afuera). Cada una se
apoya en algo que el juego ya tenía a medias: un galpón de esquila sin ovejas, un almacén
que "hacía de correo" sin cartas, una alfombra de lana que se hacía con una tabla, un
camino de código para hachar árboles caídos que ningún árbol usaba.

## Relax

### 1. La huerta
Pieza nueva, **Cantero de huerta** (O → Trabajo, 3 tablas y 2 piedras). Con E se siembran
**habas** (5 días), **papas** (7) o **frutillas** (3), y con E se cosechan. La lluvia
riega: un día de lluvia fuerte cuenta doble, una sola vez por día. Semillas de habas y de
papa en el almacén —se pueden cambiar todas las veces que haga falta—; la frutilla se
siembra de un estolón de las que juntás en el sendero. Dos recetas nuevas: **papas al
rescoldo** y **habas salteadas**. Sección nueva en el cuaderno: "Del campo".

Las matas de todos los canteros van en dos mallas instanciadas: más canteros no suman
llamadas de dibujo. (`src/huerta.js`, `src/huerta-malla.js`)

### 2. La majada
Ocho ovejas —Corriedale de cara negra y Merino— en el **corral grande del galpón de
esquila**, que estaba armado con su portón y sus colisiones pero vacío. Pastan, se
arriman entre ellas y se apartan del perro y del que corre, así que cuando el perro entra
al corral la majada se junta sola. Con la **tijera de esquilar** (almacén) cada oveja da
dos vellones y le vuelve a crecer en seis días.

La **lana es un material de construcción**, como la tabla y la piedra: se guarda en el
acopio y se gasta en obras. La **Alfombra de lana pedía una tabla**, porque hasta ahora no
había lana en el juego; ahora pide dos vellones. (`src/majada.js`, `src/majada-mundo.js`)

### 3. El correo
La trochita trae cartas cuando para en la Estación del Valle, **aunque estés en otro lado**,
como mucho una por día, y Ercilia te las da en el almacén. Seis cartas: de casa, de la
hermana de Ercilia en Esquel, de una tejedora de Jacobacci, del ramal, de un naturalista
de Bariloche y una última cuando cerrás todo. Quedan enteras en una sección nueva del
cuaderno.

Tres abren **la línea de encargos de Ercilia**, la única vecina que no pedía nada: contestar
las cartas, verdura del cantero para Esquel y lana para la tejedora. Lo que piden sale de la
huerta y de la majada, así el círculo cierra. (`src/correo.js`, `src/encargos.js`)

### 4. El caballo
**El zaino de Don Ramón.** Te lo presta con un encargo nuevo cuando ya caminaste las
cuatro puntas, a cambio de dos vellones para el pelero (la manta bajo la montura). Espera
atado al palenque junto al refugio. E para subir y bajar; arriba, W al trote (6,2 m/s) y
Shift al galope (11 m/s), los ojos a 2,6 m, y suenan cascos en vez de pasos. No entra al
agua honda. Queda donde lo dejás, también al recargar. **Sólo en el Relax**: pelear a caballo
es otro juego. (`src/caballo.js`, `src/caballo-mundo.js`, cambios chicos en `src/jugador.js`
detrás de `estado.montado`: a pie no cambia nada.)

**Lo que no se hizo:** las alforjas. La mochila no tiene límite de carga, así que cargar
en el caballo no cambiaría nada.

### 5. Tormentas y crecidas
El clima deja de ser sólo luz y sonido. Con horas de lluvia fuerte **el arroyo crece** hasta
38 cm y tarda casi un día en bajar; con el agua turbia **no pica nada en el arroyo, pero en
el lago comen mejor**. En tormenta, una vez por día como mucho, **un rayo parte un árbol** a
la vista —nunca un pehuén— y lo deja tirado. Se hace leña con el hacha (6 troncos) y el
tocón rebrota como cualquier talado. `main.js` tenía una rama para hachar árboles caídos
que ningún árbol usaba; el rayo la revive. (`src/tormenta.js`)

**Lo que no se hizo:** cortar el puente de la trochita con la crecida. Implicaba frenar el
tren antes del puente y reprogramar su recorrido; demasiado riesgo para esta pasada.

## Desafío

### 9. El excavador
Todas las defensas eran muros, y el saltador ya los pasaba por arriba: faltaba el que pasa
por abajo. Desde la noche 4, el **excavador** cava por debajo de la madera clavada
—empalizada, empalizada reforzada, portón de empalizada— y sale adentro de la base. **Por
la piedra no puede**: la pirca tiene cimiento. Deja un **pozo** que los que vienen detrás
usan hasta que lo tapes con dos piedras (E). El parte de la base (N) avisa de los pozos
antes que de todo lo demás. El total de invasores por noche no cambia: los excavadores
salen de los rastreadores. (`src/desafio-pozos.js`)

### 10. Nueva partida+
Con el nido abajo, el Desafío terminaba y no quedaba nada por hacer. Ahora la pantalla
final y la pausa ofrecen **otra vuelta**: desde la noche uno, sin base ni materiales, pero
con las armas, las mejoras de cristal y los planos. Cada vuelta los invasores vienen 20% más,
aguantan 25% más y pegan 15% más fuerte, hasta la vuelta 10. El HUD dice en qué vuelta
estás. (`src/desafio-vuelta.js`)

## Para los dos modos

### 7. Logros en el Relax, y un puente con Steam
**16 logros para el Relax**, que no tenía ninguno. Son globales —como en Steam—, no de la
partida. Y todos los logros del juego (los 16 nuevos y los 18 del Desafío) tienen **nombre
de API de Steam**: la lista para dar de alta en Steamworks está en `STEAM_LOGROS.md`,
generada desde el código.

El puente es **opcional del todo**: si `steamworks.js` no está instalado, si no hay App ID o
si Steam no está abierto, el juego arranca igual y los logros quedan adentro. El proceso
principal sólo le pasa a Steam nombres válidos. (`src/logros-relax.js`, `src/steam.js`,
`main.cjs`, `preload.cjs`)

### 8. El cuaderno para compartir
En la pausa, **"Llevarte el cuaderno"** baja una página HTML con el álbum de fotos, el diario
y lo anotado: una sola página, con las fotos adentro, que se abre sin internet, se manda o
se imprime. Todo lo escrito se escapa (el diario no puede meter código en la página) y
sale en el idioma en que jugás. (`src/album.js`)

### Inglés
Todo lo nuevo en inglés: **331 textos**, en la tanda K (`src/idioma-en-k.js`). Lo que se
arma con huecos —"Sembrar habas", "Un rayo partió un coihue a 80 m al noroeste"— se
genera por combinación, porque el traductor copia los huecos sin traducirlos. Mismos
términos que el resto (errands, supply pile, workbench, outpost). Una prueba nueva falla si
algo de lo nuevo queda en castellano.

## Lo que encontraron las partidas reales

Las pruebas de Node daban verde con estas cosas rotas; las encontró jugar de verdad en
Electron (`pruebas/humo-1-10.cjs`, `pruebas/humo-1-10-desafio.cjs`):

- **El aviso y la tecla E no coincidían.** Con el cantero al lado de una puerta, el aviso
  decía "Abrir la puerta" y E sembraba. El código tiene un comentario que exige la misma
  prioridad en los dos. **El acopio tenía el mismo desfase desde la 1.6.** Quedaron
  alineados, y una prueba vigila el orden.
- **Un segundo rayo pisaba el primero.** La guarda de "uno por vez" estaba sólo en la
  tormenta, no en el rayo: un árbol quedaba tirado sin registro y volvía a estar parado al
  recargar.
- **El caballo andaba 0,5 m en 3 s** — resultó ser la prueba, no el juego: la ventana oculta
  corre pocos cuadros. Ahora se mide a pasos fijos: 18,6 m a caballo contra 9,6 m a pie.

Y de paso, en el código viejo: la **sección de trueque salía dos veces** en el cuaderno
(desde antes de la 1.6), así que todo lo cambiado en el almacén se listaba dos veces.

## Pruebas
`npm run verify`: **83 pasos**, todos en verde. Diez pruebas de Node nuevas (huerta,
majada, correo, tormenta, caballo, excavador, vuelta, logros del Relax, álbum, idioma 1.10)
y dos partidas reales nuevas: **48 pasos en el Relax** (incluida la descarga real del
cuaderno) y **16 en el Desafío**. Las partidas reales de antes —partida, Desafío, nido,
construir, idioma, invasores, accesibilidad— siguen pasando.

## Lo que sigue sin probarse
- **Cómo se ve y cómo suena.** Las ovejas, el zaino, las matas y los pozos se probaron por
  posición, escala y visibilidad, no a ojo. Los cascos son un sonido nuevo que nadie
  escuchó todavía.
- **Los números son míos**: días de cada cultivo, lo que tarda la lana, cuánto sube el
  arroyo, lo que endurece cada vuelta. Son para ajustar jugando.
- **Los cuadros por segundo reales**, como desde la 1.8.
