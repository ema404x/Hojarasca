# Hojarasca 3.9.2 (parte C) — La casa de té igual que la cantina y la cantina más viva

Rama `v392-cantina` (sale de `v391-pena`, la 3.9.1). Sólo en el Relax. **Sin inglés** (el usuario lo pidió): todo lo nuevo está en castellano y la lista de lo que
queda sin traducir está al final. La versión **no** se subió (`package.json` sigue en 3.9.1) y no hay zip: eso lo hace quien junta las dos ramas de la 3.9.2.
Las capturas están en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\mejoras-casa-te\` (fuera del repositorio).

## 1. La casa de té, igual que la cantina
Ceinwen Evans (`galesa`) ya no «hace aparecer» el té: **se atiende como en la cantina**, con el mismo flujo y las mismas reglas (en vez de duplicar el código, la cantina
se generalizó con un *lugar*: `crearCantinaJuego(ctx, lugar)`).

- **Te sentás** en una de las **seis sillas de verdad** (dos en la galería, una por mesa, y las cuatro del salón; son los asientos de `estructuras.js`: la prueba de la
  partida real compara cada silla con el asiento del juego, a 0,00 m). Ceinwen te ve y **viene caminando** desde su cocina: por el salón, entre las mesas, por la puerta del
  frente y, para la galería, por afuera hasta tu mesa. Te saluda con lo del momento (hora, tiempo, estación, lo que pasó en el valle, tu apodo) y se abre **la carta de la
  casa de té**.
- **La carta** (15 cosas, que cambian con la estación, el tiempo y lo que produce la aldea y tu granja): té galés en tetera, té de hierbas del valle (con la herboristería o en
  verano), té especiado de invierno, té con miel de la sala (con la sala de miel abierta), té helado con limón (verano), café con leche, chocolate caliente, unos mates con
  bizcochitos, **torta negra galesa**, **scones** con crema y dulce, **bara brith**, **pan de jengibre**, **welsh cakes** (con la panadería abierta o fuera del verano), tarta de
  manzana galesa (con tu fruta u otoño) y **el té completo** (tetera, taza y la torre de tres platos). Una **torta del día** (diez por ciento menos), distinta cada día.
  Precios de $140 a $650. La carta está agrupada («Para tomar», «Para comer»).
- **Se paga por los mismos medios**: pesos de la billetera (figura «Casa de té: …» con Ceinwen), trueque o «anotalo en la cuenta» (con su mandado). **La cuenta es propia**:
  la de la casa de té no se mezcla con la de la cantina (`progreso.casaTe`, misma forma que `progreso.cantina`).
- **La bandeja**: va a su cocina (apoyada, prepara), levanta la bandeja con **lo que pediste puesto encima** (la tetera con su taza, el plato, la torre), camina con ella en alto,
  se inclina, la apoya y se va. Tomás de a sorbos (**E**): en la tetera **sube sólo la taza** (la tetera se queda; la taza vuelve a su platito), y lo caliente echa vapor.
  Te levantás y ella **levanta la mesa** unos segundos después, con lo mismo en la bandeja.
- **Lo que daba el viejo «pedir algo»** (anotar en el cuaderno «un té con torta galesa», los mates y el chocolate) se conserva: las cosas de la carta llevan `registra` y se anota al servirte.
- **Horario**: atiende de 9 a 20 siempre que Ceinwen esté en la casa (la cocina o la galería). Si anda lejos (la fiesta, su siesta) el aviso dice que no hay nadie atendiendo. De pie
  y de noche no pasa nada; el viejo `servir()` sigue sólo en el valle del Desafío (donde no hay aldea ni galesa) y como respaldo si la casa de té no se pudo armar.
- **Hablarle sentado** a Ceinwen (E) te ofrece la carta, como a Lucrecia; el menú de charla trae «Pedirle algo a Ceinwen». De pie junto al mostrador, el aviso dice «Sentate a una mesa y Ceinwen viene a atenderte».
- Sentado a su mesa **el reloj no corre ×40** mientras atiende (como en la cantina): te sentás a esperar de verdad.

## 2. La cantina más rica y más viva
- **Carta y comida**: 15 platos y bebidas más (`CARTA_EXTRA`): fernet con cola, licor de calafate, cerveza negra, sidra de manzana, vino caliente con canela, café, limonada, milanesa con papas,
  choripán, locro, costillar de cordero, sopa de la huerta, tarta de fruta, flan con dulce de leche y pan con queso y dulce. Salen según la **estación** (locro y vino caliente en
  invierno, limonada en verano), el **clima** (lluvia, nieve) y **lo que produce la aldea y tu campo**: la panadería (pan con queso, tortitas), la pescadería (trucha), tu vaca (flan), tus
  corderos (cordero), tu fruta (tarta, sidra) y tus chanchos (choripán). Un **plato del día** distinto cada día (con la rebaja y marcado en la carta), que prefiere lo que produce la aldea.
  Se ve **en la bandeja y en la mesa**: cada plato y bebida tiene su forma (`cantina-formas.js`) y la bandeja de Lucrecia lleva lo que pediste (ya no vasos genéricos).
  La carta de siempre (10 cosas) no cambió.
- **Ambiente** (`cantina-ambiente.js`, todo por código, sin luces ni sombras nuevas): cuadros pintados con un lienzo (el lago con la cordillera, el atardecer en la meseta con su ranchito, un
  retrato de sombrero), **herraduras** de la suerte en las paredes (con la punta para arriba), el cartel «HOY NO SE FÍA / mañana sí», un **reloj de pared** con péndulo y agujas en la hora del
  juego, **vasos y platos usados** en las mesas (de las 20:30 a las 10, según el día; se esconden en la mesa donde te están sirviendo) y la pila de vasos sucios en la barra, y **música de
  fondo** sintetizada por código: una guitarra sencilla, bajita (La menor, Sol, Fa, Mi), sólo adentro, que calla en la peña (ahí toca el Cholo) y baja cuando hablás con alguien. Vapor de
  lo caliente sobre las mesas. El humo de la salamandra sale por la chimenea de afuera (lo dibuja el humo de la aldea).
  La luz de lo que hay en la mesa (un resplandor propio chico en los materiales): de noche, adentro, el guiso ya no se ve negro.
- **Lucrecia, Dalia y Ceinwen más vivas** (`cantina-vida.js`; sólo texto y comportamiento):
  - **Te saludan al llegar con la mano en alto** (pose nueva `saludar`) **y por tu nombre** (tu apodo en la aldea; si no, «forastero»), Lucrecia y Ceinwen cuando te acercás a su lugar; Dalia, desde la pista, cuando llegás a la peña.
  - **Lucrecia seca un vaso** en la barra (pose nueva `secar`) cuando está sola.
  - **Comentarios sin que se los pidas** mientras estás sentado (cada 40 a 75 segundos): el tiempo, la hora, el reloj, los cuadros, el cartel, la música, la salamandra, **los parroquianos por su nombre**,
    lo último que pediste y, con confianza (amigo, romance), algo más cercano y picante (sólo sugerido). Con memoria: no repiten la misma frase seguido.
  - **Reaccionan a lo que pedís**: una frase para cada plato y bebida nuevos (y si es el del día, lo suyo).
  - **«Charlar un rato»** (botón en la carta): te cuenta algo de lo suyo (8 historias de Lucrecia, 6 de Ceinwen); la primera vez por visita suma un punto de amistad.
  - **Recuerdan lo último que pediste** (en el saludo, y «siempre lo mismo» si lo pediste 3 veces o más) y **Dalia, lo que bailaste**: cuenta tangos y chamamés y, a veces, en la invitación te
    propone lo otro. Lucrecia comenta desde la barra que bailaste con Dalia. Dalia comenta desde la pista (el compás, su tierra, el descanso, a Lucrecia, el ensayo de la tarde).
  - Los parroquianos de la peña también toman lo nuevo (fernet, cerveza negra, licor de calafate, café, sidra).

## Archivos
Nuevos: `src/casa-te.js` (reglas y carta de la casa de té), `src/cantina-formas.js` (los platos y bebidas nuevos), `src/cantina-ambiente.js` (cuadros, reloj, lo usado, música), `src/cantina-vida.js`
(frases y poses), `pruebas/verificar-3-9-2-cantina.mjs` (223 verificaciones, en el gate), `pruebas/humo-3-9-2-cantina.cjs` (partida real), este archivo.
Tocados de la cantina: `src/cantina.js` (carta extra, plato del día, `LUGARES`, libretas, lo último que pediste), `src/cantina-juego.js` (el lugar, la vida), `src/cantina-mundo.js` (bandeja con lo de verdad, taza que sube, vapor, altura de cada mesa),
`src/pena.js` (la cerveza negra y la sidra suben como la cerveza), `src/pena-juego.js` (Dalia más viva).
**Compartidos con la otra rama** (cambios chicos, en bloques aparte): `src/main.js` (la casa de té, el ambiente, el menú de charla), `src/guardado.js` (`casaTe`), `src/aldea-gente.js` (la carta con Ceinwen sentado: un bloque junto al de Lucrecia),
`src/gente-ropa.js` (una palabra: `bandeja: true` en `aldea-galesa`), `src/plantilla.html` (estilos de la carta), `pruebas/verificar-3-9-0-cantina.mjs` (los campos nuevos de la libreta en una comparación exacta), `package.json` (sólo `verify:pasos`, por `sumar-prueba`).
No se tocó nada de `gente-cuerpo.js` (las poses nuevas se agregan desde `cantina-vida.js` a `POSES_BAILE`), ni el banco, ni el cuerpo y la ropa de Dalia.

## Decisiones mías
1. **Una sola máquina para los dos lugares** (parámetro `lugar`) en vez de copiar `cantina-juego.js`: la cantina sigue pasando sus 241 verificaciones de la 3.9.0 y sus 146 de la peña.
2. **Libreta aparte** para la casa de té (cuenta propia): lo de la cantina no se mezcla con lo de Ceinwen.
3. **Seis sillas** (las de verdad): en la galería sólo hay un asiento por mesa (la otra silla es de adorno, como estaba) y el salón tiene cuatro. En el salón las mesas ya traían puesto el servicio de adorno: lo nuestro se pone del lado de tu silla, un poco más cerca que en la cantina.
4. **El reloj no corre ×40** sentado en la casa de té mientras Ceinwen atiende (consistente con la cantina). Antes, sentarte a esperar en la galería aceleraba el tiempo; ahora no.
5. **Horario de 9 a 20** (cuando ella está): la carta de la tarde («desde las tres te espero») sigue siendo lo más lindo, pero a la mañana, mientras hornea, también te sirve.
6. **Música de fondo** sólo adentro y sólo si no hay peña; si el usuario la apaga en Ajustes (música), calla.
7. **Lo picante**: sólo con confianza, siempre sugerido (calor, miradas, «lo que no tengo en la carta lo invento»); la prueba revisa que no haya nada explícito.

## Lo que se vio de verdad y lo que no
Ver al final de este archivo la sección «Verificación».

## Textos nuevos sin inglés (pendiente, a pedido del usuario)
- Todo `src/casa-te.js` (carta, saludos, dichos), la parte nueva de `src/cantina.js` (`CARTA_EXTRA`: nombres y textos de 15 platos y bebidas) y todo `src/cantina-vida.js` (comentarios, reacciones, charlas, saludos de entrada, Dalia).
- Rótulos nuevos de la interfaz: «Charlar un rato», «Para tomar», «Para comer», «La carta de la casa de té», «Llamar a Ceinwen», «Pedirle algo a Ceinwen», «· del día», «Sentate a una mesa»,
  «Ceinwen viene a atenderte: las sillas están en la galería y en el salón», «Sentate a una mesa y Ceinwen viene a atenderte», «Casa de té: …» (billetera).
- Ninguna prueba existente exigió el par en inglés de lo nuevo: los textos nuevos viven en archivos aparte (no en `textosCantina()` ni en `vecindad-voces.js`), así que la prueba del inglés de la 3.9.0 no los ve. Cuando se traduzca, hay que sumarlos a `idioma-en-*.js`
  y a esa prueba (hoy `verificar-3-9-2-cantina.mjs` sólo revisa que no haya nada religioso ni explícito).
