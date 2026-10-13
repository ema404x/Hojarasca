# Hojarasca 3.9.0 — La cantina

Primera versión, acotada, de la cantina (la pedida en `DECISIONES_3_8_4.md`): **el lugar y sentarse a pedir de verdad**. Sólo en el Relax.
Las capturas de lo que sigue están en `salida-cantina\` (fuera del repositorio): `partida\` (la partida real), `moza-juego\` (los primeros
planos de Lucrecia en el juego) y `moza\` (el visor).

## Dónde está y por qué ahí
«En la aldea pero al final de todo»: **al final de la calle de la Loma, pasando el observatorio**. Es el edificio al que más hay que
caminar desde la estación por las calles y las puertas (219 m; el observatorio, 202; el refugio andinista, 190: la prueba lo mide).

- Plano de la aldea: centro `(-153,5; 38,5)`, giro 0 (la puerta mira al sur, a la calle), 10,4 × 8 m; en el mundo, `(197,85; -354,45)`, piso a `y = 29,36`.
- Medido con el terreno real (`pruebas/verificar-3-9-0-cantina.mjs`): **1,24 m de desnivel**, ni una muestra en agua, a más de 22 m de la vía,
  a 6,8 m del observatorio (el vecino más cercano; el mínimo es 3), con calle al frente.
- **La calle de la Loma se prolonga** hasta la puerta: dobla al norte en `x = -153,5` y termina en `z = 48,5`. Para eso se ensancharon las zonas de la
  aldea hacia el oeste (el ripio, el despeje del bosque, el rango de la gente, los álamos que estaban justo ahí pasaron a `x = -169`).
- Más al oeste y al sur el terreno cae 3 o 4 m en 10 m: era el único tramo del final de la calle con menos de 1,5 m de desnivel para 10 × 8 m.

## Qué hay
- **El edificio** (`aldea-arquitectura.js`, `cantina`): tablas verticales, galería con farolito, cartel «La Cantina» y, junto a la puerta, el horario
  («Abre de 18 a 2»); palenque para los caballos y banco afuera. Adentro: la **barra** con tapa, la canilla de cerveza, vasos y el cuaderno de la
  cuenta; el **estante de botellas** (cuatro estantes, unas 40 botellas y damajuanas, de colores y alturas distintos), una pizarra con la carta,
  barricas, **cuatro mesas de dos sillas** con su vela, la **mesa de truco** de adorno (paño verde y cartas), la **guitarra colgada**, la
  **salamandra** con su caño y su luz cálida, la leña, banderines y el cuarto de Lucrecia atrás (cama, mesa, cocina). 3.8 mil triángulos afuera, 6 mil adentro
  (el tope de las «grandes»), 4 dibujos, 7 luces en total (las de la noche pesan más: `fuerza` en `aldea-mundo.js`).
- **Lucrecia Aguirre, «la Lucre»** (34 años, de Jacobacci, hija del buffet de la estación): vecina nueva de la aldea, con su casa en el cuarto de atrás, su
  cumpleaños (día 6), su perfil de gustos (calafate, dulce, empanadas), su truco, su historia («El buffet de Jacobacci»), sus charlas, regalos, ayudas,
  deseos e interacciones sociales: **coqueta y segura, con humor picante de doble sentido liviano**, te carga, te guiña y pone en su lugar a los
  borrachos. Todo lo que dice está en `vecindad-voces.js` y `vecindad-social-voces.js`, en el estilo de las otras vecinas.
- **Su cuerpo y su ropa** (`gente-ropa.js`, `gente-cuerpo.js`): vestido bordó ceñido a la cintura con faja ancha y falda de campana a media pantorrilla,
  escote en V con ribete, media oscura y botines, pañuelo rojo al cuello con nudo al costado, delantal crudo corto atado con moño, melena suelta con
  raya al costado, labios rojos, aros chicos y una flor roja sobre la oreja. Sensual sin nada explícito. Poses nuevas que valen también caminando:
  `bandeja` (el brazo derecho en alto con la bandeja de vasos, siempre horizontal), `barra` (apoyada de costado) y `dejar` (se inclina a apoyar).
- **Su horario**: de 18 a 2 atiende detrás de la barra (sin corrimiento de vecino: es el del cartel); de 2 a 11 duerme; a la tarde acomoda la barra.
  No va al baile del sábado, ni al club de lectura, ni a la noche de estrellas (atiende); sí a las fiestas del predio y a la plaza en su cumpleaños.

## Cómo se pide (el flujo de verdad)
1. Entrás, elegís una de las **8 sillas** y te sentás (E). Ahí el reloj ya **no corre ×40** (sentado en la cantina, la noche no se te escapa).
2. **Lucrecia te ve y viene caminando desde la barra** (unos segundos; más si la cantina está llena: viernes y sábados a la noche), sin aparecer. Se
   abre **la carta** con su saludo: te conoce por tu apodo de la aldea (si ya viniste), habla de la hora, del tiempo, de la estación, de lo que pasó en
   el valle (la trucha grande, los árboles, una obra tuya, el tren) o de tu cuenta.
3. **La carta**: ginebra ($300), vino patero ($250), cerveza artesanal ($350), mate cocido ($120; con miel si la sala de miel está abierta), chocolate
   caliente ($300; en otoño, invierno y con lluvia), empanadas ($350, de a dos), picada de fiambre y queso ($900), guiso de lentejas ($650; salvo
   en verano sin lluvia), tortas fritas ($250; con lluvia o la panadería abierta) y trucha a la parrilla ($800; con la pescadería abierta).
4. **Se paga** con pesos de la billetera, con **trueque** (hasta tres cosas que llevás, a su valor de mercado: truchas, troncos, frascos de dulce o
   de miel, panes, calafate seco, huevos, yerba) o **«anotalo en la cuenta»** (tope $1.500, con un mandado fijado por el monto —troncos, truchas,
   huevos, pan o harina—: se salda después con pesos o llevando el mandado).
5. Ella va a la barra, **apoyada, prepara** (unos segundos), **levanta la bandeja con tu pedido y camina con ella en alto hasta tu mesa**, se inclina,
   la apoya y se va a atender a otro.
6. **E toma un trago o come un bocado**: se ve subir el vaso (o el tenedor) hacia la cara, de a sorbos (3 a 6 por pedido). Un trago fuerte o algo
   caliente te saca el frío (el entumecido); la comida te deja **descansado** un rato (de 0,8 a 2 horas) y se gasta como siempre. Tres tragos fuertes
   por noche: al cuarto te trae un mate cocido por la casa.
7. Cuando terminás, ella te ve y viene a ver si querés otra («pedir otra»). Te levantás (caminando o con R) y **ella levanta la mesa** unos segundos después.
   Si te vas con un pedido pagado en camino, igual te lo trae a la mesa vacía.
- De día (la cantina cerrada) no viene nadie; sin la moza armada, tampoco; lejos, no se calcula nada.
- **Mientras estás sentado se oyen charlas lejanas** de otras mesas (hay una función para eso en `cantina-mundo.js`: `murmullo`, con las voces de siempre) — ver «Lo que no se hizo».

## Cómo se paga (y la decisión de «sin economía nueva»)
La decisión original de la 3.8.4 («pagás con trueque o un favor, sin economía nueva») es anterior a los pesos. Se resolvió así: **los tres medios**.
- *Pesos*: `economia.js` (`pagar`), con motivo «Cantina: …» y de «Lucrecia» en la billetera; los precios van de $120 a $900, entre medio huevo y
  un tronco y medio del mercado (un lote de seis huevos son $500, un poncho $2.000).
- *Trueque*: lo de siempre del trueque, al valor de mercado de `comercio.js`; nada de plata de por medio.
- *Cuenta con mandado*: el «favor». No hay deuda con interés: es un tope y un recordatorio en el saludo.

## Guardado
`progreso.cantina = { visitas, ultima, pedidos, gastado, cuenta: { monto, k, n, dia } | null, fuertes: { dia, n } }`, saneado en `guardado.js` (partidas de
antes: arrancan vacías; el Desafío no la tiene; basura, negativos y días del futuro se corrigen: lo prueba `verificar-3-9-0-cantina.mjs`).

## Cómo verlo
`node armar.mjs` y jugar en **Relax**: la trochita hasta la aldea (te sale una pista), la calle de la Loma hasta el final (también en el mapa, M y en la
guía, F1) y entrar después de las 18 (en el modo de pruebas: `?debug=1`, `__hojarasca.__cantina()`). Partida real automática, con capturas, en el
monitor externo: `salida-cantina\lanzar.ps1 -Script pruebas\humo-3-9-0-cantina.cjs`; los primeros planos de la moza, con una vecina al lado para
comparar: `pruebas\fotos-moza-390.cjs`.

## Lo que se arregló de paso (importante)
- **Pierna acumulada de la moza**: una pierna quedaba de costado, cada vez más, mientras se apoyaba en la barra (la `z` de las piernas no la repone
  `gente.js` y la pose la sumaba cuadro a cuadro), y se quedaba así al caminar. Se asigna en vez de sumarse y se limpia al terminar; la prueba de la moza
  ahora imita a `gente.js` (antes reponía todo y no lo veía).
- El tajo de la pollera quedaba como una cola oscura colgando de un costado (en el visor no se notaba): se sacó; la falda va a media pantorrilla.
- Las sillas de las mesas no tienen círculo que choque: el cuerpo del jugador, con radio 0,35, te sacaba de la silla y te dejaba arriba de la mesa.
- `herramientas/al-monitor.cjs` pedía `screen` antes de que la app esté lista (error en el proceso principal: el diálogo dejaba todo colgado en esta
  versión de Electron); ahora lo pide al usarlo. Con `npx electron -r herramientas/…` por ruta relativa tampoco arrancaba acá: ver `salida-cantina\lanzar.ps1` (rutas absolutas).
- La noche de las estrellas y el club de lectura no se llevan a la moza de la barra (`main.js`: `noticiasDestino`).

## Pruebas
`npm run verify`: **204 pasos OK** (202 + `verificar-3-9-0-cantina.mjs`, 241 verificaciones, y `verificar-3-9-moza.mjs`, 57). Tocadas a propósito, lo mínimo:
`verificar-3-6-aldea`, `-3-6-arquitectura`, `-3-6-gente`, `-3-6-mundo`, `-3-6-vida`, `-3-6-2-juego`, `-3-7-0-aldea` (cumpleaños: hasta 4 el mismo día),
`-3-7-0-personajes`, `-3-7-3-taller`, `-3-7-5-fiestas`, `-3-7-5-noticias`, `-3-8-6-aldea`, `-3-8-8-banco`, `-3-8-9-auditoria` (listas de edificios y vecinos, y los
textos que ahora llevan la cantina). Partida real: 40 verificaciones en el juego, sin errores en la consola.

## Lo que NO se hizo (queda para la 3.9.1, como se decidió)
Peña de los sábados, bailarina, truco y vecinos que se arriman a la mesa, borrachera, la casa de té con moza que trae la bandeja, y el romance con
Lucrecia (la especificación original la decía «con opción de romance como las otras candidatas»: no entró). Las charlas lejanas de las otras mesas
están hechas (`murmullo`) pero **no enganchadas** al bucle: no hay otros parroquianos todavía, y se prefirió no inventar ruido sin gente.

## Dudas para el usuario
1. ¿Le gusta el **horario 18 a 2**? (está en `HORARIO_CANTINA`, `aldea.js`; el cartel de la puerta y la moza lo toman de ahí).
2. **Levantarse**: con **R** o caminando (como siempre). E queda para tomar/comer o llamar a la moza; la especificación decía «E o moviéndote».
3. El **saludo «por tu nombre»**: el juego no tiene nombre del jugador; usa tu apodo de la aldea (si ya lo ganaste) y si no, «forastero».
4. Lucrecia **sólo atiende** a la noche; de día está detrás de la barra, sin servir. ¿Querés que de día atienda un mate?
5. El ojo sentado queda **bajo** (a 0,95 m: es el del juego para todos los asientos); de cerca la mesa llena la vista. Lo bajo y la mesa grande son como en
   la casa de té; si no gusta, se puede subir sólo para la cantina.
6. La noche es **más oscura** adentro que en otros locales: se le dio más fuerza a las lámparas y a la salamandra, pero conviene verla en tu pantalla.

## Qué se vio de verdad y qué no
- **Visto en el juego real (Electron, monitor externo, alta calidad):** por fuera de día y de noche, por dentro (barra, mesas, guitarra), la moza
  de frente, de 3/4 y de perfil quieta, caminando, con la bandeja, apoyada y dejando, comparada con Gladys; la visita entera (sentarse, que venga
  caminando, la carta, pagar con pesos y con trueque, la bandeja, el sorbo y el bocado, el frío que se va, levantarse y que levante la mesa).
- **Sólo en Node o razonado:** la cuenta y el mandado (en el juego se vio la carta con las tres formas de pagar, no saldar), los precios (razonados
  contra `ECONOMIA_NUMEROS.md`), el Desafío (no tiene nada de esto), el rendimiento en la Ryzen 5 4600G (no medido: se cuidaron triángulos, luces y
  materiales compartidos), el inglés (completo por prueba, pero sin releerlo en pantalla) y las partidas viejas (por prueba, no con un guardado real).
