# 1.8.0 — Diez mejoras sobre la 1.7

Plan de diez puntos, en el orden en que se hicieron.

## 1. Banco de pruebas (F1 → Banco, o desde la portada)
Un recorrido guionado, siempre el mismo, para medir rendimiento de verdad: **seis tramos**
(bosque cerrado, sendero y mallín, vista larga desde el mirador, orilla del lago,
estructuras y noche), 94 segundos en total, con tres segundos de calentamiento por tramo
que no se miden. Mide cuadros por segundo, el **1% peor** —que es lo que se siente como
tirón—, el milisegundo medio y el peor cuadro, tramo por tramo, y arma un informe con la
placa de video, la resolución y el peso de la escena. Se copia o se guarda como archivo.

Mientras corre, la calidad automática se apaga: si no, no se estaría midiendo siempre lo
mismo. Módulo puro `src/banco.js`.

## 2. Llevarse la partida a otra computadora
Cada partida se **exporta a un archivo** (con su álbum de fotos adentro) y se vuelve a
importar donde quieras, eligiendo en qué ranura entra. El paquete va **firmado**: si el
archivo llegó cortado o lo retocaron a mano, se rechaza con un motivo legible en vez de
dejar una partida rota. Una partida del otro modo avisa en vez de mezclarse.
Módulo puro `src/transferir.js`.

## 3. Construir sin arrepentirse
- **Retroceso** (con los planos abiertos) deshace la última etapa de una obra y devuelve la
  mitad de lo que costó. Antes sólo se podía desmontar una pieza entera.
- **X** copia el plano de lo que tenés enfrente, con su orientación, para repetir un tramo
  sin volver al panel.
- Las dos se niegan si hay algo apoyado encima, igual que el desmontar de siempre.

## 4. Modo foto (F2)
La cámara se suelta del cuerpo, el HUD desaparece y queda un panel con **hora del día,
campo de visión, exposición, brillo de las luces, viñeta y grano**, guías de tercios o de
centro, y el mundo congelado o en movimiento. Lo que se toca va a los uniformes del
post-procesado, así que **se ve en la foto**, no es un filtro de pantalla. La foto se baja
como PNG, sin HUD ni guías.

## 5. El parte de la partida
Al terminar el Desafío, en vez de una línea suelta, un parte de cinco bloques: la
resistencia (noches, racha, abatidos, caídas, dificultad), lo que levantaste (piezas,
defensas, refugios, recetas, planos, vecinos), el valle (días, árboles talados, tocones
rebrotando, renovales, anotaciones, fotos), lo que te queda y los logros. Se puede copiar
como texto. Módulo puro `src/parte.js`.

## 6. La guía y las pistas aprenden el segundo acto
La guía ya explica la nave nodriza, el nido, cómo se busca con las señales y por qué se
rompe **de día**. Tres pistas nuevas aparecen cuando corresponde: cuando cae la nodriza,
cuando llega la primera señal y cuando el nido queda marcado.

## 7. El valle reacciona al Desafío
La percepción de los animales ahora entiende que hay peligros que no son el jugador: la
**nave que baja** (90 m), los **invasores** (34 m cada uno, hasta seis) y el **nido** (55 m).
Cerca de eso, los animales huyen; cuando pasa, vuelven solos. Y en invierno los tocones se
cubren de nieve como el resto del bosque.

## 8. Inglés
El juego está escrito en castellano y los textos viven al lado del código que los usa, que
es lo que hace que suenen a alguien. Para el inglés, en vez de arrancar de cero, se traduce
**en la salida**: un diccionario castellano → inglés que se aplica donde el texto llega a la
pantalla (los avisos, el aviso de acción del HUD y cada panel al dibujarse).

- **2.018 textos, unas 19.000 palabras**, en diez tandas: seis por tema y cuatro con lo
  que el extractor fue dejando afuera en cada pasada.
- Los mensajes que se arman con variables se reconocen por **molde**: `Talar el árbol
  ({0}/{1})` casa con lo que llegue y devuelve el inglés con los mismos huecos.
- El idioma se elige en la portada; cambiarlo guarda y rehace la pantalla.
- Con idioma castellano el traductor devuelve el texto tal cual: no cuesta nada.

Lo que más trabajo dio no fue traducir sino **encontrar** los textos. El extractor los
buscaba entre los literales del código y se comía justo los que parecen código: una
etiqueta de una palabra («Teclas», «Ajustes»), los moldes con huecos, y lo que está
adentro de una plantilla con HTML. Y el listador de faltantes daba por nombre científico
a cualquier par de palabras sin acentos, así que escondía setenta y pico de textos de
pantalla: «Perro ovejero» tiene la misma forma que «Vanessa carye». Ahora los nombres en
latín se leen del campo `cientifico` del cuaderno, que es donde están escritos.

### Repaso de las tandas B y E

Las tandas se tradujeron por separado y cada una bautizó lo suyo, así que la misma cosa
había quedado con dos nombres en inglés. El jugador juntaba **Pine nuts** y cocinaba
**Toasted piñones**; levantaba un **hut** que el cuaderno anotaba como **puesto**;
aserraba **planks** que Don Ramón le pedía como **boards**. Un repaso de las dos tandas
más largas —el cuaderno (B) y la gente (E)— dejó una sola palabra para cada cosa:
*piñones*, *puesto*, *planks*, *workbench*, *supply pile*, *errand*, *la trochita* y
*cordillera*. Cerca de sesenta cambios repartidos en nueve tandas.

También aparecieron tres cosas que no eran de estilo:

- **La bandurria austral estaba mal identificada**: decía *buff-necked ibis*, que es otra
  especie. Es *black-faced ibis*.
- **Tres fichas del cuaderno se repetían a sí mismas**: el nombre y el nombre científico
  caían en la misma traducción, así que la ficha decía dos veces «Orion's Belt». Y una,
  la de las Nubes de Magallanes, se repetía **también en castellano**: el campo científico
  tenía copiado el nombre. Ahora dice `Nubecula Maior y Minor`, como Crux y Scorpius.
- **«los árboles van ralenado»**, en la ficha de la estepa, era un error de tipeo del
  castellano.

Dos cosas nuevas cuidan que no vuelva a pasar: `pruebas/salidas/terminos.cjs`, que busca
los pares de términos que compiten y dice en qué tanda está cada uno, y dos chequeos más
en `verificar-idioma.mjs` —las palabras desterradas y las fichas que se repiten—, que
encontraron un *magellanic* en minúscula que se me había escapado.

Quedan **99 textos sin traducir a propósito**: los códigos de tecla (`KeyW`, `Digit1`),
las tipografías, los nombres propios (Nicanor, Ercilia, Elsa), los lugares reales (Cueva
de las Manos) y las palabras que se escriben igual en los dos idiomas. Las especies sí se
traducen cuando tienen nombre común en inglés (Cachaña → Austral parakeet, Huemul → South
Andean deer) y se quedan en castellano cuando no lo tienen.

## 9. Sonido con más cuerpo
- **Cuatro paletas de piano** (verano, otoño dórico, invierno menor, lluvia suspendida) por
  **cinco momentos del día**. De noche baja una octava, toca frases más cortas y más
  espaciadas; con lluvia se estira todavía más.
- **Tres volúmenes separados**: el bosque, los efectos y la música, además del general.
- La mezcla se acomoda sola: de noche el bosque baja y la música sube un poco; adentro de
  un refugio entra menos bosque.

## 10. Optimización, medida
- **LOD de invasores**: la misma criatura, con las mismas primitivas y el mismo esqueleto de
  14 huesos en el shader, se arma también con la mitad de gajos y se cambia a partir de los
  42 m. Medido con los mismos 18 invasores a 60 m: **154.122 → 70.676 triángulos (−54%)**,
  con las mismas llamadas de dibujo y sin tocar el programa compartido.
- **Sombras en caliente**: cuando la calidad automática cambia de escalón, el mapa de
  sombras se rehace en el momento en vez de esperar al próximo arranque.
- **La medición era engañosa**: `medir-rendimiento.cjs` dejaba la calidad automática
  encendida, así que dos corridas no eran comparables (una medía en Media y otra en Baja).
  Ahora mide siempre con la misma calidad y agrega el caso de los invasores lejos.

## Pruebas
`npm run verify`: **72 pasos en verde**, los de siempre más banco y transferir, parte y
construir, foto y valle, música, LOD de invasores e idioma. Y **doce partidas reales en
Electron, las doce sin un solo fallo**:
`humo-banco`, `humo-construir`, `humo-foto`, `humo-idioma`, además de las que ya estaban
(`humo-desafio`, `humo-desafio-premium`, `humo-partida`, `humo-partidas`, `humo-nido`,
`humo-1-6`, `humo-accesibilidad`, `humo-autocalidad`).

## Lo que sigue sin probarse
Los cuadros por segundo reales. Las pruebas corren en una ventana oculta sin placa de
video, a un cuadro por segundo: sirven para la lógica, no para el rendimiento. **Para eso
está el banco de pruebas del punto 1**: corrélo en tu PC y pasame el informe.
