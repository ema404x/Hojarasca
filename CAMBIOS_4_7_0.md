# Hojarasca 4.7.0 — la mochila con casillas (paquete 1b del mapa)

Rama `v47-integra` (sobre `main` = 4.6.1). Juntada de `v47-carga` (el núcleo y la conexión con el juego: `CAMBIOS_4_7_CARGA.md`) y
`v47-pantalla` (lo que se ve y se maneja: `CAMBIOS_4_7_PANTALLA.md`). Plan: `PLAN_MAPA_VALOR.md` (paquete 1b).

## Qué trae (sólo en el Relax; el Desafío queda como estaba)
- **La mochila tiene 24 casillas.** Materiales y comida ocupan casillas (una pila de un solo tipo por casilla); las herramientas no (siguen en
  la barra de 1 a 8). Pilas: troncos, piedras y piedra de cantera 10; tablas, arcilla, cuero, ponchos y cristales 20; junco, hierbas, lana,
  huevos, miel, truchas, pan y lo desconocido 30; plumas, piñones, frutas, habas, papas, semillas, yerba, harina y sal 50.
- **El caballo con alforjas suma 12 casillas (36)** mientras vas montado y si elegiste «Con alforjas» en Personalizar el caballo. El carro no
  existe todavía: `CASILLAS_CARRO = 0` queda como gancho.
- **Partidas viejas sin perder nada:** lo que pasa del límite queda como **sobrecarga** (989 troncos siguen siendo 989): no podés juntar más de
  eso hasta bajar del límite (gastando o guardando en un depósito).
- **Lo del mundo no se gasta si no entra:** talar, picar, esquilar, ordeñar, cosechar, pescar, recursos de zona, frutas y objetos del suelo avisan
  «Mochila llena: no te entra más X» y no consumen el árbol ni la roca.
- **Los tratos verifican antes de cobrar:** comprar, trueque, feria, comercio de las paradas y los puestos, gente del campo y dar una mano a un
  vecino rechazan con «No te entra: te faltan N lugares» sin cobrar. Sacar de un depósito, del acopio, de un puesto de ruta, de la consigna del
  banco o de los estantes del negocio entrega sólo lo que entra y deja el resto guardado.
- **Pantalla:** el panel de la mochila (I) es una grilla de casillas con «7/10», las vacías punteadas, el contador «Casillas 17/24», el aviso de
  sobrecarga (ícono, palabra y lo que sobra) y las herramientas aparte; el indicador «Mochila 17/24» junto a la barra (se resalta con «· llena» y
  «sobrecarga»); el cartel corto «Mochila llena»; y en los paneles de sacar de un depósito, « · En la mochila: 17/24 casillas».

## Decisiones
- Regalos y premios automáticos (compadre en la puerta, visitas, concursos, cartas, huevos de pascua, recompensas de eventos) y reintegros al
  desarmar **entran aunque pasen el límite** (quedan como sobrecarga): no se pueden rechazar sin perder el regalo.
- Alforjas sólo montado; al bajarte, lo que pasa queda como sobrecarga.
- Junta: el cartel corto `avisoMochilaLlena` (de la pantalla) se llama desde `cabeJuntar` y `cabeTrato` (del núcleo), además de la nota.

## Verificación
- `npm run verify` de corrido: **270 pasos OK** (4.6.1: 268 + `verificar-4-7-carga` 115 comprobaciones + `verificar-4-7-pantalla`).
  `verify:paralelo`: `verificar-construccion-premium-rc6` y `verificar-integridad-estructural-rc31` a veces dan tiempo agotado por la carga de la
  PC y pasan solas (la primera, repetida dos veces).
- Partidas reales (ocultas, una a la vez, en el monitor externo): `humo-4-7-carga`, `humo-4-7-pantalla`, `humo-4-6-gente`, `humo-4-6-puestos`,
  `humo-3-8-6-relax`, `humo-3-7-4-rueda`, `humo-3-0-asedio` y `humo-4-5-1-sin-carreras` **OK**. `humo-4-6-recursos` falla por tiempo («la veta vuelve en
  2 días»: el aviso del perro tapa el de la veta): falla igual en la 4.6.1.
- Capturas de la mochila (pocas cosas, sobrecarga) vistas a tamaño completo **con la ventana visible**: con la ventana oculta `capturePage` devuelve
  un cuadro viejo y las capturas `mochila-*` salían sin el panel (los agentes no lo notaron). Para capturas de paneles, usar `-Visible`.

## Pendiente
- El carro (más casillas) y la explicación en el juego de cómo conseguir lugar (depósitos, caballo con alforjas).
- Los regalos que pasan el límite podrían guardarse en espera, como la carne de Don Ramón.
- El texto de la H sobre un árbol («Talar el árbol») no dice «llena» (la nota aparece al apretar).
- Sin probar: montar de verdad el caballo para las alforjas (la prueba pone el estado a mano), fps en la 4600G, el panel en 1536×864 reales.
