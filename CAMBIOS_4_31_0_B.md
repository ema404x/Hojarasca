# 4.31.0 (B) · el pueblo y la gente, al detalle

Rama `v4310-b` (desde main = 4.30.1). Pedido: «Hojarasca súper detallista»: que la aldea reaccione. Todo con la **E** de siempre (una sola entrada nueva en la tabla, `'pueblo'`, antes de la puerta), sin teclas nuevas, **0 programas de shader nuevos, 0 luces nuevas, 0 mallas nuevas**: la luz y el humo de cada casa salen de lo que ya había (el color por vértice de los vidrios, la intensidad de la luz de adentro de cada edificio, la lista de chimeneas), las poses giran las piezas de las figuras, las burbujas son las de la vida social y los sonidos son síntesis bajita.

## Inventario (desde el código, de lo que pide la zona B)

| Pedido | Qué había | Qué se hizo |
|---|---|---|
| Saludan al pasar y mirarlos | `cerquita`: te miran si pasás a menos de 7 m; el saludo sólo hablándoles | **Nuevo** (1) |
| Se quejan si los chocás | nada | **Nuevo** (2) |
| Les apagás la luz y se quejan | no había llave de la luz en la aldea | **Nuevo** (3, 4) |
| Paraguas / se tapan con lluvia | con lluvia la plaza se vacía (a cubierto) | **Nuevo**: se tapan la cabeza caminando (5). Paraguas de verdad: afuera (malla nueva por vecino) |
| Se abrigan con frío | ya existía (ropa de invierno, `ropaDeEstacion`) | **Nuevo**: parados al frío se frotan las manos (6) |
| Se sacuden la nieve al entrar | nada | **Nuevo** (7) |
| Golpear puertas | nada | **Nuevo** (8) |
| Timbres y campanas | la campana del andén (4.26.0) | **Nuevo**: la campanita de los locales al entrar (9) y la campana de la escuela (10). Iglesia: no (nada religioso) |
| Bancos y escalones para sentarse | bancos, sillas y la escalinata ya eran sentaderos (3.6) | sin cambios |
| Fuente / bebedero | el aljibe de la plaza («Sacar agua del aljibe», 3.6) | sin cambios |
| Carteles, vidrieras, pizarrones | el pizarrón de la escuela, el horario de trenes, el reloj y el almanaque se leían | **Nuevo**: todos los carteles de los locales se leen, con lo del día (11) |
| Buzón y diario del día | las casillas de la estafeta y «La Hoja de los Duendes» (3.7.5) | sin cambios |
| Perros y gatos | los perros de la aldea te siguen un rato (3.7.0); gatos no hay | **Nuevo**: se acarician (12). Gatos: afuera (no hay malla de gato) |
| Humo de chimeneas sólo donde hay alguien | salía de todas | **Nuevo** (13) |
| Luces de las casas según quién vive | todas las ventanas de la aldea con la misma luz | **Nuevo** (14, 15) |

## Lo nuevo (15 detalles)

Todo en `src/pueblo-detalles.js` (reglas y textos, puro), `src/pueblo-detalles-juego.js` (el enganche) y `src/pueblo-detalles-pose.js` (las poses).

1. **Saludo.** A menos de 6 m de un vecino y mirándolo (de frente), te saluda con la mano, su burbuja («¡Buen día!», «¡Buenas tardes!», «Buenas noches.»; con lluvia, nieve o frío, lo suyo; los chicos, «¡Hola!») y su voz. Una vez cada 150 s por vecino y uno cada 7 s.
2. **Queja al chocarlo.** Si lo tocás yendo a más de 1,6 m/s hacia él: se sorprende y te reta («¡Epa! Mirá por dónde andás.»); la segunda seguida, `quejarse`; a la tercera, se cruza de brazos («¡Otra vez! ¿Qué te pasa?»).
3. **La llave de la luz** de las casas y los locales de la aldea: adentro, mirando la pared al costado de la puerta, «Apagar la luz» / «Prender la luz» (mirando la puerta, gana abrirla). Se apagan las ventanas y la luz de adentro de ese edificio.
4. **Se queja si se la apagás** con él adentro y despierto («¡Eh! ¡Que estoy acá!») y a los 4 s la vuelve a prender. Sin nadie, queda apagada hasta que vuelva alguien despierto. **Se guarda.**
5. **Lluvia:** caminando afuera, se tapan la cabeza con la mano (cabeza gacha). Bajo techo, no.
6. **Frío:** parados afuera sin hacer nada, se abrazan y se frotan los brazos, con los hombros encogidos.
7. **Nieve:** al entrar a un edificio con nieve, se sacuden (1,6 s).
8. **Golpear la puerta** cerrada de una casa (desde afuera): tres golpes en la madera y contesta el que está («Nélida: «¡Pasá, que está abierto!»»; tarde a la noche, «Mañana, mañana»); dormidos, «se oye roncar»; vacía, nadie. Después de golpear, la E abre (25 s).
9. **La campanita** de la puerta al entrar a un local con mostrador (almacén, panadería, pescadería, sala de miel, herboristería, costurería, cerámica, hilandería, estafeta, foto estudio, casa de té, carpintería, veterinaria), y el dueño, si está, te da la bienvenida.
10. **La campana de la escuela** (de mano): a las 8:30, 10:30 y 12:30, de lunes a viernes, con la escuela abierta; se oye a 160 m.
11. **Los carteles se leen** (mirándolos, «Leer el cartel»): el nombre, abierto o cerrado (según esté el dueño), y lo del día: el pan que salió del horno, la pesca, la miel, las hierbas, el menú de la cantina, lo de la casa de té, el pizarrón de la puerta de la escuela, el baile del salón, la estafeta; y los fijos (la estación, la plaza, «Correo», «Cargas»).
12. **Acariciar a los perros** de la aldea (la Chola, el Tango, la Pampa, el Tizón): se sienta, mueve la cola rápido, un gemidito contento, y te sigue 40 s más.
13. **Humo** sólo de las chimeneas de los edificios con alguien adentro (despierto o durmiendo: la estufa queda prendida); la estación, el taller y la cantina, siempre.
14. **Las ventanas** de cada casa según quién está: despiertos, la luz entera; todos en la cama, el velador; nadie, oscuras. Sólo de noche (de día, el reflejo de siempre).
15. **La luz de adentro** de cada edificio (la que ya tenía), con la misma regla.

Quién está en cada casa sale de `aldea-gente.js` (lo que está haciendo cada uno ahora, también lo que eligió en su tiempo libre; `destinoDe`, nuevo) y, si no, de su horario.

## Dónde se tocó (quirúrgico)
- `src/interacciones.js`: la entrada `'pueblo'` (antes de `'puerta'`, después del vecino y de lo de cada lugar de la aldea).
- `src/main.js`: el armado (aislado con `try`), `actualizar` en `actualizarAldea`, el caso `'pueblo'` de la E y su caché, la luz y el humo para `crearAldeaMundo`, `__pueblo` en depuración.
- `src/aldea-mundo.js`: `luzEdificio`/`humoEdificio` (opcionales), las ventanas por casa (`ventanasPorCasa`: reescribe el tramo de color de los vidrios de un edificio sólo cuando cambia, cada medio segundo), la luz de adentro por edificio, las chimeneas con su edificio, los `carteles` en `puntosEdificio`.
- `src/gente.js`: una línea después de las animaciones sociales (`posarDetalle`).
- `src/aldea-gente.js`: `destinoDe`.
- `src/aldea-animales-mundo.js`: `perroCerca`, `acariciar` (y el perro sentado mientras lo acariciás).
- `src/guardado.js`: la clave nueva.

## Guardado
- Clave nueva: `progreso.puebloDetalles = { apagadas: { edificio: día } }` (las luces que apagaste vos). Saneada: sólo edificios de la aldea con llave y días posibles (ni del futuro); en el Desafío no hay. Una partida vieja no la trae: todo prendido.

## Pruebas
- Nueva: `pruebas/verificar-4-31-0-b.mjs` (en `verify:pasos`): **121 comprobaciones** (reglas con la aldea de verdad, la tabla de la E, el módulo en un mundo de mentira, las poses con figuras de mentira y los enganches) y **21 mutaciones** (un proceso por mutación, copia de `src` aparte), todas detectadas.
- Previas: las **337** `verificar-*.mjs` que leen lo tocado (main, gente, aldea-mundo, aldea-gente, los animales, la tabla, el guardado y sus ayudas), en verde; después de los últimos cambios en `aldea-mundo.js` y los animales se volvieron a correr las 38 que los leen: en verde. `verificar-4-28-0-c` falló una vez en paralelo (la carpeta temporal de sus mutaciones) y pasa sola: es de tiempo. `verificar-release` falló una vez por un error de sintaxis del humo (arreglado) y pasa. Ninguna prueba vieja se ajustó. No se corrió `npm run verify` completo.
- **Partida real** (`pruebas/humo-4-31-0-b.cjs`, Electron minimizado, perfil propio, con el candado; seis corridas: la completa y repasos por partes). Todo **visto en el juego**, con capturas en `C:\Users\Andres\AppData\Local\Temp\hx\b4310\v1` a `v6`:
  - saludo: de espaldas no; mirándola, Ercilia levanta la mano con «¡Buen día! ¿Cómo andás?» (`v3/01-saludo-*`);
  - choque: corriendo contra Rosa, se sorprende con «¡Uy! ¡Cuidado!» (`v5/02-choque-*`);
  - lluvia (`v3/03-lluvia-*`), frío (`v3/04-frio-*`) y la sacudida de la nieve al entrar (`v5/05-nieve-*`);
  - golpear: Nélida contesta «¡Voy!», Ercilia «¡Pasá, que está abierto!»; dormidos, «se oye roncar»; vacía, nadie; después la E abre (`v4/06-golpe-*`);
  - la llave: adentro de lo de Nélida, «Apagar la luz», el cuarto se oscurece, Nélida se queja y a los 4 s la prende (`v2/07-llave-*`);
  - ventanas y humo: a las 21:30 la casa de Nélida brilla (vidrios 1,0, halos y luz en el suelo) y a las 3 queda el velador (0,15); la biblioteca de noche, oscura (0,1) y sin humo (`v6/08-ventanas-*`);
  - el cartel de la panadería se lee con lo del día (`v3/09-cartel-*`); la Chola se acaricia, te mira (0 rad) y te sigue (`v4/10-perro-*`); la campanita al entrar a la panadería (`v3/11-campanita`); la campana de la escuela a las 8:30 de un lunes (`v3/12-escuela`).
  - **Lo que cuesta**, en la plaza: 0,04 a 0,08 ms por cuadro de promedio (p95 0,2 ms, máximo 0,3 ms). **Programas: 104 → 106** sólo al hacerse de noche en la aldea (lo conocido de la regla); sin la noche, 104 → 104.

## Quedó afuera (anotado)
- **No se vio a ojo:** los sonidos (las corridas van sin audio: se cuentan); la campana de la escuela, entonces, sólo por el contador.
- Los vidrios de una casa vacía quedan con un brillo muy bajo (el reflejo del material de todos los vidrios); el halo y la luz en el suelo sí se van.
- Candado: a las ~15:35 apareció «C 4.31.0» encima del mío mientras corría mi primer humo (dos Electron a la vez un rato; anotado en el tablero).
- **Paraguas** de verdad (una malla por vecino): sin presupuesto de dibujos en la plaza; se tapan con la mano.
- **Gatos**: no hay malla de gato y un perro achicado no da gato.
- **El que contesta no sale a abrir**: contesta desde adentro; la puerta la abrís vos.
- La campanita mira la planta del edificio (`adentro`): en el almacén y la casa de té (que son estructuras del valle) usa su caja.
- Sin traducción al otro idioma de los textos nuevos (salen en castellano).

## Segunda tanda (pedido del coordinador)
- **Sentarse en el escalón del mástil** de la plaza (los bancos ya eran asientos desde la 3.6): dos lugares nuevos en `aldea-arquitectura.js` (`plaza`), del lado de la estación y del costado sin el reloj, a 25 cm, al final de la lista de asientos (los de antes no cambian de número). Del lado de la plaza no: entre la base y los bancos no se llega (`verificar-3-6-arquitectura`). Visto: «Sentarte en el escalón del mástil» y sentado (`hx\b4310\v7\13-escalon-*`).
- **El aljibe (la fuente de la plaza): tomar y tocar.** Tomar ya estaba (un trago por día); después del trago el aviso dice «Mojarte las manos en el aljibe» y la nota, que te mojás las manos y la cara con el agua helada (`aldea-mecanicas.js`, `aldea-mecanicas-mundo.js`). Visto (`v7\14-aljibe`). Bebedero aparte: no (sería geometría nueva en la plaza).
- **El buzón de la estafeta y el boletín del día:** el punto `buzon` (en `aldea-arquitectura.js`, sin geometría nueva: el buzón rojo ya estaba) y, mirándolo, «Leer el boletín del buzón»: lo que pasó **ayer** en el valle (`boletinDeAyer`: el evento que movió los precios, los cumpleaños, quién llegó y qué local abrió; si nada, «un día tranquilo»), firmado por Benigno. «La Hoja de los Duendes» (3.7.5) sigue igual. Visto (`v8\15-buzon*`).
- **El perro te sigue después de acariciarlo:** ya estaba (40 s más); además ahora se lo acaricia aunque mires un banco de la galería (en los patios andan entre los bancos): la entrada `'pueblo'` le gana al asiento sólo para el perro. Visto: te mira (0 rad) y te sigue (`v8\10-perro-*`).
- **Gatos: no.** No hay malla de gato ni una barata (un perro achicado no da gato); haría falta una figura nueva.
- **Paraguas: no.** Una malla por vecino (o una instanciada con un programa nuevo): no sale barato; quedan tapándose con la mano.
- Prueba: ahora **135 comprobaciones y 26 mutaciones**, todas detectadas (las nuevas: sin escalón, sin buzón, el boletín de hoy en vez de ayer, el aljibe sin tocar, el perro que no le gana al banco). Previas vueltas a correr: las 49 que leen la arquitectura, las mecánicas y la aldea, y las 61 de la tabla de la E, en verde (se ajustó el texto del segundo trago para que siga diciendo «hoy ya», que es lo que mira `verificar-3-6-mecanicas`; no se tocó ninguna prueba vieja).
