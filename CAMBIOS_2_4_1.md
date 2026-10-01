# Hojarasca 2.4.1 — Caza de bugs

Sobre la 2.4.0. Una pasada entera buscando errores: tres revisiones del código (lo nuevo
de la 2.4, el guardado y la carga, y el aviso contra lo que hace cada tecla), una prueba
de caos que juega sola y una que abre partidas rotas a propósito.

## Lo más grave

- **Importar o sincronizar una partida borraba las fotos del álbum.** `leerPartida`
  entrega las fotos como `{ id: imagen }` y `escribirPartida` las pasaba a
  `guardarFotos`, que espera `{ id: { img } }`: se escribía `{}`. Con la carpeta
  sincronizada, la PC que importaba perdía las fotos y en la siguiente copia se las
  borraba a la otra. Venía de antes de la 2.4 (se reprodujo con el guardado de la 2.3).
- **Una obra rota en la partida no dejaba arrancar el juego.** Una obra que no era un
  objeto (`null`), con más etapas que su plano, o en el Desafío con coordenadas NaN,
  tiraba al armar el bosque: «No se pudo armar el bosque» y no se llegaba al menú.
  Ahora el guardado sanea cada obra (plano, lugar, giro, etapas, tinte) y el armado
  saltea las que igual vengan mal.
- **La escalera de la torre** ya estaba arreglada en la 2.4.0.

## El aviso y la tecla (lo que dice abajo y lo que hace la tecla)

El aviso ahora sigue el mismo orden que la tecla E, paso a paso, y las otras teclas
(F, H, Y, B, T) se ofrecen después de todo lo que hace E. Casos que fallaban:

- En el almacén, parado en el mostrador, el aviso decía «Abrir la puerta» y E abría el
  almacén.
- «B Plantar», «T Armar la carpa», «Y Aserrar» y «H Talar» tapaban lo que hacía E: junto
  al tendal decía «B Plantar» (y B gastaba un calafate) mientras E colgaba; en otoño, al
  lado de un coihue, decía «H Talar el árbol» en vez de «Juntar semilla».
- El caballo al lado del tren o del kayak: el aviso decía «Subir a la trochita» y E te
  subía al zaino. El kayak cerca de un cantero, el acopio o una puerta: lo mismo.
- En el andén, mirando el banco, el aviso decía «Sentarte» y E te subía al tren.
- Con los planos abiertos se ofrecía «Y Aserrar» (Y levanta la obra), «T Armar la carpa»
  (T tiñe) y «H Talar» (H no hace nada ahí).
- La antorcha apagada del Desafío se prendía con F sin ningún aviso: ahora lo tiene.
- Nadando, mirando al perro, decía «Pedirle al perro que rastree» y E no hacía nada.
- El tendal vacío: E lo usa (te dice qué se cuelga); ahora el aviso dice «Mirar el tendal».
- Hablando arriba del caballo, el aviso decía «Bajarte del zaino» y E seguía la charla.
- Arriba del tren o del kayak ya no aparecen «Mirar las huellas» ni «Encender el fogón».

## Lo nuevo de la 2.4, pulido

- El embarcadero podía quedar sin lugar para el kayak (la punta honda, los costados
  playos): ahora pide agua honda donde se amarra. Tampoco atraviesa lo que armaste en la
  orilla ni el muelle del valle.
- La pared con hogar no sumaba su confort a la casa (quedaba en el borde del módulo).
- Dormir en la carpa al lado de tu casa contaba como dormir adentro.
- Con una oveja tuya al lado del bebedero, E miraba el corral en vez de esquilarla.
- El humo de tu chimenea y las ventanas seguían un minuto después de apagarse el fuego.
- Una siesta te sacaba el descanso de la noche.
- El pan casero y las empanadas tenían en la mochila la acción de cocinar (que hacía
  otra cosa): ahora se comen. Cada uno te saca el frío y te deja una hora más liviano.
- Un tinte que no existe (o un nombre como «constructor» en una partida retocada) ya no
  deja una pared negra, y la pieza que estás moviendo no se tiñe.

## El guardado, más firme

- Las obras de un plano que esta versión no conoce (una partida de la otra PC con una
  versión más nueva) no se arman, pero se conservan y vuelven al guardar.
- Las cosas (yerba, harina, ponchos) se sanean como los materiales: `"5" + 1` daba `"51"`.
- Las entradas del cuaderno que no son objetos se descartan, y las cantidades raras
  vuelven a cero. Lo mismo con los peces, el diario, los renovales y la carpa sin lugar.
- En el Relax ya no viaja un desafío dentro de la partida.

## Pendiente, anotado

- La comparación de «cuál copia es más nueva» en la carpeta sincronizada usa la hora de
  cada PC. Si un reloj adelanta varios minutos, en un caso raro una copia puede pisar a
  otra más nueva. Para arreglarlo bien hace falta un contador de guardados en la partida.
- Las piezas de un plano de una versión más nueva se conservan, pero lo sembrado de un
  cultivo que esta versión no conoce todavía se descarta.

## Verificación

- `npm run verify`: 103 pasos, todos en verde. Nueva: `verificar-2-4-1.mjs` (las fotos
  de ida y vuelta entre ranuras, una partida llena de basura, el orden del aviso). Cuatro
  pruebas viejas que fijaban el texto exacto de líneas que cambiaron se ajustaron sin
  cambiar lo que comprueban.
- Partidas reales en Electron: dos nuevas.
  - `humo-caos.cjs`: juega sola con una semilla (se repite igual), aprieta teclas al
    azar con keydown de verdad, hace clics, salta a lugares al azar (el lago, techos,
    obras), cambia la hora y la lluvia, simula noches del Desafío, guarda y recarga; en
    cada paso revisa errores, posiciones NaN, el jugador bajo el suelo y contadores
    negativos. Tres corridas largas (unos 930 pasos) sobre la 2.4.0 no encontraron
    errores del juego.
  - `humo-guardado-roto.cjs`: 26 partidas rotas a propósito. Sobre la 2.4.0 tres no
    dejaban arrancar el juego; sobre la 2.4.1 arrancan todas y conservan lo sano.
- Las 26 partidas reales en Electron, todas en verde. `humo-1-11` esperaba cualquier aviso
  con «perro» y a veces leía el del perro que marca: ahora espera el de rastrear.
