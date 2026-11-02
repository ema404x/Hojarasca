# 4.18.4 · Búsqueda de bugs · zona A, la Historia por dentro

Rama `v4184-a`. Qué se buscó y cómo: un jugador de mentira (`pruebas/ayuda-4-18-4-historia.mjs`) que juega los trece capítulos con los módulos de verdad
(`historia.js`, los disparadores, el director de escenas con todos sus efectos y condiciones) y, aparte, la interfaz de la historia (`historia-ui.js`) con un
documento y un juego de mentira. Más barridos de referencias, todas las rutas de elección de cada escena, el saneado de lo guardado con basura y recargas
de partida a mitad de la historia y a mitad de escena. Todo en Node: **nada de esto se probó a mano en una partida real** (eso es de la zona C).

## Lo confirmado y arreglado

| id | gravedad | dónde | cómo se reproduce | estado | prueba |
|---|---|---|---|---|---|
| A-01 | MEDIA | `src/historia-ui.js`, `alEntrar` | Historia terminada con el final del trato (`fase 'fin'`, `duendes.final = 'trato'`, la bolsa vacía en el umbral). Entrar a la partida con «Libre» elegido en la portada: `alEntrar` la pausa (`activa = false`) y una historia terminada no tiene botón para retomarla, ni `alEntrar` la reactiva con «Historia». La costumbre del trato (E sobre la bolsa del umbral, el regalito de cada cosecha) deja de andar para siempre: `accionObjeto` y `objetosVisibles` piden `activa`. | arreglado: una historia terminada no se pausa al entrar y la que una versión anterior dejó en pausa se retoma | `verificar-4-18-4-a.mjs` §6 (6 comprobaciones, 2 mutaciones) |
| A-02 | MEDIA | `src/historia-disparadores-acto3.js` (`raiz-deuda`, `deuda-pagada`) | Capítulo 11 con D1 = b (la bolsa a Rosa) y trato. La raíz ofrecía pagar con «una medida de harina **o** seis tablas»; la escena `deuda-pagada` cobra según lo decidido (D1 = b: una harina). Con tablas pero sin harina la escena corría, `quitar:harina:1` no tenía de dónde sacar nada y `duendes:deuda-pagada` dejaba la deuda en cero: **deuda pagada sin cobrar nada** (y al revés con D2 = b: harina de sobra, sin las seis tablas). | arreglado: sólo se ofrece pagar si alcanza para lo que la escena cobra (`puedePagarLoQueSeDebe`) | §7 (10 comprobaciones, 3 mutaciones) |
| A-03 | MEDIA | `src/historia.js`, objetivo `arco:lenga` | El texto dice «talá un árbol seco … (o, si talaste el coihue, llevale a Tito dos tablas)». La alternativa miraba `entregados.has('tito:tablas')`, que **nada anota nunca**: con D2 = b (coihue talado) y tablas en la mochila el objetivo no se tildaba y, sin talar otro árbol, `tito-arco` no salía (su condición pide la madera hecha). | arreglado: con D2 = b y dos tablas (de coihue o comunes) el objetivo se cumple; la escena de Tito cobra las dos | §8 (6 comprobaciones, 2 mutaciones) |

## Lo que se barrió y salió limpio (queda como prueba permanente)

* Referencias: las 122 escenas (acto I a III, optativas y lazos) son válidas; las 18 condiciones que usan están registradas; los 110 efectos con nombre están
  registrados; ningún `si.vista` ni `requiere` apunta a una escena que no existe; ningún fundido cruzado con pasos adentro; las únicas escenas sin disparador son
  las que dispara otra cosa (el cuaderno de la mesa, la noche, la costumbre); los dos disparadores sin escena escrita son las dos mecánicas conocidas
  (`ramon-sanitario`, `harina-ercilia-c`); todo lugar con nombre que piden los disparadores, los objetivos y los objetos del mundo lo arma `main.js`;
  ningún disparador pide una escena de una optativa.
* Alcanzabilidad: cada escena que pide un objetivo existe y tiene disparador en su capítulo. El jugador de mentira llegó al final de los trece capítulos en
  más de 200 recorridos (semillas distintas, decisiones, trato y pelea, con y sin pareja y perro, la hora, el lugar y las cosas del mundo en cualquier orden;
  unos pocos pasaron del tope de pasos por pura suerte del azar y con más tiempo terminaron). Con ~150 recargas de partida por recorrido
  (a mitad de capítulo y a mitad de escena) también.
* Escenas: 3.676 corridas (todas las rutas de elección de cada escena, con y sin Esc, sobre estados de lazos, decisiones, trato, noche, ramal y pobladores al azar):
  todas terminan, quedan vistas, sin errores, con lazos y ramal en rango; las seis escenas de decisión dejan la decisión tomada y sólo con lo que se puede
  elegir (D1 = b sólo con Rosa en la aldea; D6 = trato fuerte sólo habiendo convidado).
* Saneado: `sanearHistoria` con 30.000 historias de basura (tipos cambiados, `__proto__`, `constructor`, infinitos, arreglos por objetos): no tira, es idempotente
  y deja todo en rango. Con 12.000 historias reales mutadas campo por campo, igual.
* Tarjeta final: 30.000 combinaciones de trato, noche, ramal, majada, escuela y los 13 lazos: ningún párrafo vacío ni repetido.
* Marcas de lo guardado: `aplicadas` puede llegar a unas 190 de las 200 que guarda `sanearHistoria` (y `temas` a unas 160): cabe, pero con poco margen. La prueba
  falla si una escena nueva lo pasa del margen (pasado el tope, al cargar se pierden marcas y los efectos de una escena ya vista se aplicarían otra vez).

## Preguntas para el usuario (no se tocaron: son diseño)

1. **La deuda del trato cuando decidiste las dos cosas (D1 = b y D2 = b).** La escena cobra las dos (una harina **y** seis tablas de coihue) pero el objetivo dice
   «una bolsa de harina o seis tablas». Recomendación: dejar el texto como está y cobrar las dos solo si de verdad se debieron las dos (que es lo que hace ahora la
   escena); o, si se prefiere «una de las dos», cambiar la escena a cobrar una sola cosa. Hoy (con el arreglo A-02) hay que tener las dos para poder pagar.
2. **Cosas del premio que no aparecen en la mochila:** `llave-molino`, `canto-gemelo`, `lampara-eusebio` y `pluma-condor` se dan como «cosas» (el texto del
   premio las nombra) pero `mochila.js` no las dibuja: el jugador lee que «queda en la repisa» y no las ve en el inventario. Recomendación: dejarlas como marcas de la
   historia (como `puertita` o `canto-blanco`, que sí tienen objeto en el refugio) y revisar si el texto del premio las promete como objeto de mochila.
3. **Final de la pelea con la línea de Nicanor del lazo (`TEXTO_LAZOS.final.nicanor`):** «Cuando salen las luces sobre el lago, Nicanor te silba…» sale también
   con el final B, donde `FINAL_B` dice que «el valle quedó tranquilo». Es de B (texto): se deja la decisión.

## Sospechas sin confirmar o cosas anotadas (no se tocaron)

* `sanearHistoria` (y el resto de los saneados del juego) tira un `TypeError` ante un objeto con la propiedad propia `"toString": null` (JSON a mano). Sólo con un guardado
  armado a propósito; no se arregla acá.
* Código muerto: en `historia-ui.js` los tipos de objeto `pago` y `cuidar` y `pagarLaDeuda`/`puedePagarDeuda` (el pago de la deuda va por la escena `deuda-pagada`);
  `ACOMPANANTES` incluye `'tobias'` y nadie lo anota. No molestan.
* Si algún día la tarjeta de respaldo de una decisión del acto II se muestra (escena de la decisión no escrita), la molienda a Esquel o partida suma el ramal al decidir y
  otra vez en la escena de los fletes (`molienda-fletes` / `molienda-partir`): hoy no pasa porque todas las escenas de decisión la dejan tomada.
* El truco `historia capitulo N` marca los capítulos anteriores como hechos pero no toma sus decisiones ni marca sus escenas: sirve para las pruebas, no es un estado
  que se pueda alcanzar jugando.

## Lo que NO se miró

* Nada en partida real (Electron): cámara dentro de una pared, escenas que no cierran de verdad, colocación del jugador (`historia-colocacion.js`), el mundo de la
  noche (`historia-noche-mundo.js`: combate, duendes, aliados), los objetos 3D (`historia-objetos.js`, `historia-props-acto3.js`), la presencia y los duendes
  (`historia-presencia.js`, `historia-duendes.js`), el arreo con ovejas de verdad, el sonido y la lectura de los textos a ojo.
* Los textos (guion) de B: sólo que no estén vacíos ni repetidos en el final; no se revisó la redacción.
* El Desafío (la historia no corre ahí) y el pase de Relax libre.
* Cambiar de modo a mitad de partida desde los menús de verdad: se probó `alEntrar`, `pausar` y `empezar` con la interfaz de la historia, no el cambio de ajustes
  real de `main.js`.

## Archivos

* Arreglos: `src/historia-ui.js`, `src/historia-disparadores-acto3.js`, `src/historia.js`.
* Pruebas nuevas: `pruebas/verificar-4-18-4-a.mjs` (con 15 mutaciones, cada una en su proceso sobre una copia de `src/`) y `pruebas/ayuda-4-18-4-historia.mjs`.
