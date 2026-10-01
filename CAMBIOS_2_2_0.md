# Hojarasca 2.2.0 — Las dos ramas, juntas (y más liviano)

Las dos computadoras trabajaron en paralelo desde la 1.9.1: una hizo la 1.10 y la 1.11,
la otra la 2.0 y la 2.1. Ninguna tenía lo de la otra. La 2.2 las junta: parte de la 2.1
y le suma todo lo de la 1.10 y la 1.11, sin tirar nada. Donde las dos ramas habían hecho
la misma idea de dos maneras, quedó una sola.

## Qué trae de cada rama

- **De la 2.0 y la 2.1** (todo): sentarse y esperar, escuchar, el perro guía, encargos de
  temporada, escarcha, lluvia en el techo, adentro suena a adentro, fases de la luna y
  lluvia de estrellas, la lámina, el grabador de cantos, los rastros, el pronóstico, el
  almanaque de lo que llega y se va, las conservas; en el Desafío, ojos que reflejan la
  linterna, el acecho, el perro que avisa, el asedio, la noche de las luces que se apagan,
  subtítulos de sonido con dirección, la mezcla que se agacha, el bestiario, las noches
  después, la vibración del mando, los rescates, el excavador y la losa, los jefes
  distintos, los restos de nave que se recorren y la forja.
- **De la 1.10**: la majada y la lana, el correo por tren y los encargos de Ercilia,
  tormentas y crecidas, el zaino de Don Ramón, Nueva partida+ ("otra vuelta"), 16 logros del
  Relax con puente a Steam, el cuaderno para compartir.
- **De la 1.11**: el telar, la cocina de dos ingredientes y la harina, la feria de la
  estación, el gallinero, rastrear lejos con el perro, las visitas, los pedidos de fotos
  por correo, las órdenes a los compañeros, el cimiento de piedra y la partida en una
  carpeta sincronizada.

## Lo que las dos ramas habían hecho distinto

- **La huerta.** La 2.0 tenía un cantero de frutillas y calafates que se riegan; la 1.10,
  uno de habas, papas y frutillas con semilla del almacén. Quedó uno solo, el de la 1.10
  (lo usan la cocina, la feria, los encargos y los logros), con los calafates de la 2.0:
  cuatro cultivos. Lo que la 2.0 prometía sigue: sembrás una frutilla o un calafate que
  juntaste y cosechás cuatro o cinco, y si te olvidás no se seca. **Las partidas de la 2.x
  se convierten solas al cargar**: el cantero pasa a ser el nuevo y lo que tenía sembrado
  sigue creciendo donde estaba.
- **El excavador.** Las dos ramas hicieron el mismo invasor con mecánicas distintas. Quedó
  el de la 2.1 (se mete bajo tierra si tenés una obra en el medio y sale adentro; la losa
  no lo deja asomar), y el **cimiento de piedra** de la 1.11 hace que no se meta debajo de
  esa madera. Los pozos de la 1.10 salieron: eran la otra versión del mismo bicho.
- **El perro.** La guía de la 2.0 sigue como estaba: huele a 55 m y te lleva a lo que
  todavía no anotaste. El E mirándolo de la 1.11 es ahora **rastrear lejos**: hasta 220 m,
  cualquier animal de a pie, con las pisadas en la nieve. Mientras rastrea, le gana a la
  guía. En el Desafío, atacar y alertar siguen primero.
- **El almacén.** Las dos ramas arreglaron el mismo bug (del quinto cambio en adelante no
  se podía comprar con el teclado) y las dos sumaron cambios: ahora son once. Van de a
  nueve por página: los números eligen en la página que se ve y **Tab** pasa a la otra. El
  clic elige cualquiera.
- **La cocina.** Las recetas de dos ingredientes de la 1.11 y el frasco de dulce de la 2.1
  viven juntas en `cocina.js`; en invierno, sin nada fresco, se abre una conserva.
- **Inglés.** Las dos ramas tenían tandas "K" y "L" con contenido distinto: las de la
  1.10/1.11 pasaron a llamarse M y N, y lo nuevo de la 2.2 está en la O.

## Arreglos que aparecieron al juntarlas

- **Piedras rojas en otoño y lana que desaparecía en invierno.** Las obras usan el material
  de la vegetación, que trata `tipo: 2` como hoja caduca (se pone roja en otoño, flamea con
  el viento y en invierno se esconde). La 2.0 lo había descubierto con su cantero; el de
  la 1.10, el telar de la 1.11 y las piedras del acopio (de antes de las dos ramas) lo
  tenían mal. Ahora piedra y tierra son roca, y lana e hilos, madera. Hay una prueba que
  no deja que ningún plano use hoja ni flor.
- Dos funciones de depuración con el mismo nombre (`__rastro`), una de cada rama.

## Más liviano

Medido con herramientas nuevas: un perfil de CPU que juega cuadros reales del bucle
(`npm run perfil`, `perfil:desafio`), otro de la carga (`perfil:carga`) y dos diagnósticos
que dicen qué recorre el motor y de dónde sale cada llamada de dibujo (`diag:matrices`,
`diag:dibujo`). Todo desde un punto de vista fijo, para comparar builds.

- **El repaso de matrices: de 1,59 a 0,37 ms por cuadro (−77 %).** La prueba de
  rendimiento de la 2.x ya fallaba en la 2.1 (1,26 ms contra un tope de 0,9; en la 1.9.1
  eran 0,47). De los ~2300 objetos que three.js recorría en cada cuadro, dos de cada tres
  estaban adentro de grupos ocultos: bichos y fauna lejos, gente que no está, lo de la
  noche de día. Ahora la escena no recorre lo oculto, y cuando algo vuelve a verse se
  recalcula entero una vez, así nunca se dibuja con una posición vieja.
- **La carga del valle: de ~3,9 a ~2,1 s.** Dos etapas se llevaban más de la mitad:
  - *Levantando los cerros* (1,25 → 0,49 s): el índice que mide la distancia al río, al
    sendero y a la vía armaba un texto `'x,z'` para cada una de sus ~800 mil consultas.
    Ahora es una grilla de enteros.
  - *Clavando los tablones del muelle* (1,24 → 0,35 s): para ubicar las cabañas, cada
    lugar candidato se comparaba contra todos los árboles y todos los obstáculos del
    valle. Ahora sólo contra los cercanos.
  En los dos casos se recorre lo mismo en el mismo orden: **el valle sale idéntico**. Hay
  una huella del terreno en las pruebas: si una optimización futura lo mueve, las
  partidas guardadas quedarían en otro lugar, y la prueba no lo deja pasar.
- **Los árboles cercanos no se recopian con la cámara quieta.** Cada cuarto de segundo
  se volvían a copiar y a subir a la placa las matrices de todos los árboles cercanos,
  aunque no te movieras. Ahora se hace cuando caminaste más de 4 m (el radio ya traía
  18 m de margen) o cuando cambió algún árbol.

Lo que queda del cuadro es casi todo dibujar: unas 400 llamadas por cuadro, la mitad
son los trozos de la vegetación (que están así para poder descartar lo que no se ve) y
el resto son estructuras, gente y fauna. La lógica del juego, con todo lo de las dos
ramas andando, pesa alrededor de 1 ms por cuadro. Bajar más exigiría rehacer cómo se
dibuja el bosque; queda anotado.

## Verificación

- `npm run verify`: 98 pasos, todos en verde. Nuevo: `verificar-2-2.mjs` (la unión, la
  migración de canteros, el almacén de a nueve, ningún plano con hoja, las tandas de
  inglés, la huella del terreno y las optimizaciones). Salió `verificar-excavador.mjs`
  (los pozos de la 1.10).
- Partidas reales en Electron (22): las 17 de la 2.x y las 5 de la 1.10/1.11, adaptadas
  donde probaban lo que se unificó (la huerta en `humo-relax-2`, el excavador en
  `humo-1-10-desafio` y `humo-1-11-desafio`, que ahora prueba el cimiento contra el
  excavador de la 2.1 con y sin cimiento sobre la misma empalizada).
