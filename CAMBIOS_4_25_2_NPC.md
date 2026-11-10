# 4.25.2 · NPC — la zona F2 de la revisión (la gente, las escenas con gente, el acompañante)

Rama `bugs-4-25-2-npc` (sobre `main` = 4.25.1). Insumo: `trabajo/bugs9/zona-F2.md` (escrito sobre la 4.17.1). No se subió la versión. **0 programas de shader, 0 texturas, 0 llamadas de dibujo, ninguna clave nueva de guardado**: todo es lógica de la gente. No se tocó el sistema de sombras ni la huella del terreno; no hay texto nuevo en la interfaz.

Primero se confirmó qué seguía vivo en la 4.25.1 leyendo el código (y `CAMBIOS_4_25_1_A.md`, que ya había tocado la captura de la «pareja con dos nombres» y las caminatas de las escenas: no se pisó nada de eso). Los siete hallazgos seguían vivos.

## Arreglado

| # | Qué pasaba | Arreglo |
|---|---|---|
| **F2-1** (alta) | `actor()` de `escenas-mundo.js` comparaba sólo `n.clave`, pero la gente de la aldea está en la lista como `aldea-<k>` / `poblador-<k>`: las escenas que piden `jefe`, `nelida`, `abuela`, `panadera`, `carpintero`, `nene`, `nena`, `fotografa` no la encontraban. Ernesto, Nélida, Nahuel y Lucía no salían; Tito, Sofía, Herminia y Rosa salían **duplicados** (un invitado con otra ropa a 3 m delante tuyo mientras el de verdad seguía en lo suyo). | `actor()` busca, si no hay clave exacta, `aldea-<k>` o `poblador-<k>` **con `claveAldea === k`**. Así las claves genéricas de otras figuras (`visitante`, `familia`, `familia-boda`, `amor`, `hijo`, `juez`) nunca coinciden con la clave de una escena, y la figura a medio armar (todavía sin `claveAldea`) tampoco se toma. La clave exacta sigue mandando. Además `armarYa` (main.js) pide primero la figura de la aldea (`figuraDeAldeaParaHistoria` → `aldeaGente.figura(k)`, que la arma en su lugar de esa hora aunque estés lejos) y recién si no vive ahí arma el invitado de siempre. En `aldea-gente.js`, la figura que está en una escena (`enEscena`) ya no se esconde aunque esa hora no tenga destino (se esfumaba delante de la cámara). La «pareja» ahora también es la persona de la aldea (el alias de la 4.25.1 sigue igual). |
| **F2-2** (media) | El acompañante (Graciela, Tobías, Ramón) y el visitante que guiás aparecían «detrás tuyo» aunque ahí fuera el lago (al bajar del kayak mirando a tierra, o al alejarte nadando) y quedaban clavados en el fondo: `caminarHacia` no da pasos desde el agua. Nadando, te seguían hasta el agua. | `historia-acompanante.js`: `puntoEnTierra` (el de siempre, el del otro costado y dos anillos alrededor tuyo empezando por atrás; null si todo es agua). Al bajar del vehículo aparece ahí; si no hay tierra al lado (la punta del muelle) sigue esperando y aparece cuando pisás tierra. La meta al seguirte también es en tierra. **Nadando, te espera visible donde está, mirándote** (no desaparece). `aldea-gente.js`: el visitante que guiás usa `atrasEnTierra` y no te sigue nadando. `main.js` les pasa `agua` y `nadando`. |
| **F2-3** (media) | Después de la noche de la nevada (y de una escena que los dejó lejos), los de ruta vuelven en línea recta: Fermín se trababa para siempre contra el lago y Josefina contra una pared a 4 m del mirador. | `gente.js`: `trabadoEnRuta` / `ubicarEnEtapa`, como el trabado de la aldea: si en **12 s** no ganó **0,5 m** hacia su próxima parada, llega de una. Con vos a menos de 7,5 m no cuenta (te está mirando); al llegar o cambiar de etapa vuelve a cero. Cubre también a los del campo que una escena armó lejos (la minga). |
| **F2-4** (media) | `gente-campo-mundo.js` le ponía cada cuadro la pose de su parada a Fermín, Belisario y Tobías aunque una escena los hubiera tomado: Fermín nunca brindaba; Tobías picaba en el aire al lado tuyo de acompañante. | El lazo de las poses saltea a los que tienen `conVos` o `enCita`. Los aliados de la noche (`aliadosDeNoche`) quedan sin la pose de su parada mientras están en la defensa y al soltarlos se les devuelve la que tenían. |
| **F2-5** (baja) | La visita del turno a tu mesa podía ser Ramón mientras te acompaña (capítulos 8 a 11), o el compadre que va con vos: la nota decía «te espera en tu mesa» y seguía detrás tuyo. | `traerVisita` (para las visitas nuevas) y `puedeVenir` descartan a los que tienen `conVos` o `enCita` (se saltea el turno, como con el que está de turno en tu local). La visita de una partida recargada se respeta como antes. |
| **F2-6** (baja) | El que tiene el agua adelante seguía moviendo las piernas en el lugar. | `caminarHacia`: si no da el paso por el agua, `vel = 0`. |

## No arreglado

- **F2-7 (las gallinas atraviesan el gallinero y lo de alrededor).** Es visual y el arreglo de verdad es darles choque y piso (`col.resolver` y `alturaDePie`) a cada gallina en `gallinero-mundo.js`, que hoy no los usa: es costo por cuadro y comportamiento nuevo en un módulo que no es de la gente, y no se puede mirar a ojo sin Electron. Queda para una tanda visual.

## Cómo se probó

`pruebas/verificar-4-25-2-npc.mjs` (sumada a `verify:pasos` antes de `verificar-build-reproducible`): **69 comprobaciones y 20 mutaciones atrapadas** (cada mutación es una copia del archivo en `src/` con nombre `-mut<n>.js`, se corre la suite sobre ella y se borra). Usa el `escenas-mundo.js`, `historia-acompanante.js`, `gente.js` (`caminarHacia`, `trabadoEnRuta`, `ubicarEnEtapa`, exportadas para esto) y `gente-campo-mundo.js` de verdad, y el **terreno de verdad** para el acompañante (todas las orillas donde «detrás tuyo» es agua: ninguna da un punto en el agua). Lo de `main.js` y `aldea-gente.js` que no se puede armar en Node se fija por texto. No se corrió Electron ni se midieron fps.

El arnés `actor.mjs` del revisor, apuntado a esta rama, sigue dando `null` para `jefe`, `carpintero` y `abuela`: arma las figuras de la aldea **sin `claveAldea`**, y en el juego todas la tienen (`completarFigura`, `adoptar`); la prueba nueva usa figuras con `claveAldea` y la de a medio armar sin ella.

Pruebas viejas ajustadas (aceptan la forma nueva, sin aflojarlas): `verificar-4-17-0-pulido-c.mjs` (la línea de `armarYa` puede llevar `figuraDeAldeaParaHistoria(k) ||` antes del invitado) y `verificar-3-8-6-aldea.mjs` (el que guiás te espera en el kayak, el velero o el tren, y ahora también nadando). `caminarHacia` sigue sin exportarse con su nombre (`verificar-4-23-0-c.mjs` la busca al comienzo de la línea): la prueba usa `caminarHaciaParaPruebas`.

## Preguntas abiertas

- **Teletransporte del trabado de ruta:** el de ruta trabado llega de una a los 12 s aunque lo estés viendo de lejos (de 7,5 m para afuera), igual que el trabado de la aldea. ¿Se prefiere que sólo salte si no está en cámara?
- **Ernesto, Nélida y los chicos lejos de la aldea:** ahora una escena que los pide desde lejos (la estación del capítulo 12) arma su figura de la aldea en su lugar de esa hora y la escena la pone donde quiere. Antes no salían. Conviene mirar a ojo esas escenas (`acto3-c12`, `acto2-c6/c7/c8`, `acto1:167/495`).
- **Acompañante nadando:** se eligió que te espere visible en la orilla y no que desaparezca (como en el kayak). Si se prefiere lo otro, es sumar `nadando` a `enVehiculo`.

## Archivos

- `src/escenas-mundo.js` (`actor`), `src/main.js` (`armarYa`, `figuraDeAldeaParaHistoria`, acompañante, aldea, aliados de la noche, `traerVisita`, `puedeVenir`), `src/aldea-gente.js` (`enEscena`, `atrasEnTierra`, visitante nadando), `src/historia-acompanante.js` (`puntoEnTierra`, nadando), `src/gente.js` (`vel` contra el agua, `trabadoEnRuta`, `ubicarEnEtapa`), `src/gente-campo-mundo.js` (poses)
- `pruebas/verificar-4-25-2-npc.mjs`, `package.json` (`verify:pasos`), este documento
