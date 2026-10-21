# Hojarasca 4.6 · La gente fuera del pueblo y el tablón de encargos (rama `v46-gente`)

Paquete 1a del mapa (`PLAN_MAPA_VALOR.md`, «Decisiones tras la auditoría»), la parte de la gente. Sale de `235b9eb`. Sólo Relax,
sólo teclado y ratón, sin inglés. **La versión no se subió** (sigue 4.5.1).

## Qué hay

### El tablón de encargos de la plaza (`src/tablon.js`, `src/tablon-mundo.js`)
- **Dónde**: en la esquina del frente de la plaza de la aldea, del lado de la calle de la Vía, opuesta al cartel «Plaza de los
  Duendes» (marco de la plaza: `lx −5,4`, `lz 7,7`). Un tablón con techito y tres papeles clavados: **una sola malla**, sin
  sombra propia y con el mismo material que el puesto de la feria (ningún programa nuevo de sombreado). Frena (un segmento de
  colisión entre los postes).
- **Cómo**: delante del tablón el aviso dice «E Leer el tablón de encargos»; E abre el panel. Los números (o un clic) **toman**
  un encargo o **entregan** uno tomado; E o Escape lo cierran; se cierra solo si te alejás.
- **Reglas** (las de la auditoría):
  - **3 encargos a la vista por día** (salen de la fecha; tomar uno no trae otro);
  - **hasta 2 tomados** a la vez, **2 días de plazo** (el día que lo tomaste y el siguiente; vencido, se borra sin castigo y avisa);
  - **1 entrega por día**, aparte del tope de 2 pedidos de los vecinos;
  - **pago**: `n × valor de la unidad × 1,10 (lo de un pedido del pueblo) × distancia`, redondo a $50, entre **$700 y $2.200**.
    La distancia es la del lugar **de donde sale la cosa** a la plaza (40, −379): hasta 350 m **×1,5**, hasta 550 m **×2**, más
    lejos **×2,5**.
  - Se entrega en el tablón (lo junta la estafeta), con lo pedido encima; el pago entra por la puerta de la economía
    (`cobrar`, queda en el libro de la billetera).

| Lugar (fijo) | Distancia a la plaza | × |
|---|---|---|
| Mallín (−260, −240) | 331 m | 1,5 |
| Galpón de esquila (228, −110) | 328 m | 1,5 |
| Desembocadura del arroyo (66, 44) | 424 m | 2 |
| Cabaña de Nicanor (185, 15) | 420 m | 2 |
| Cantera (−405, −305) | 451 m | 2 |
| Pehuenal del mirador (−292, 36) | 532 m | 2 |
| Bosque de arrayanes (266, 150) | 575 m | 2,5 |
| Puesto Alto (−276, 84) | 561 m | 2,5 |

Los encargos (11; firma el vecino si ya llegó a la aldea, si no, el de respaldo):

| Encargo | Lugar | Paga |
|---|---|---|
| 7 atados de junco, «para tejer canastas» (Elvira) | mallín | $700 |
| 5 manojos de hierbas, «para tés y un ungüento» (Inés) | mallín | $750 |
| 6 terrones de arcilla, «para el horno» (Malena) | desembocadura | $1.050 |
| 2 cueros, «para el fuelle de la fragua» (Anselmo) | galpón | $1.000 |
| 3 vellones de lana (Pocha) | galpón | $1.500 |
| 4 piedras de cantera, «para el borde del andén» (Ernesto) | cantera | $1.400 |
| 8 piñones, sólo en otoño (la abuela Herminia) | pehuenal | $900 |
| 3 truchas frescas, de lo de Nicanor (Lucrecia) | cabaña | $1.650 |
| 1 trucha ahumada (Marta) | cabaña | $1.300 |
| 1 puñado de calafates secos del arrayanal (Gladys) | arrayanes | $1.400 |
| 10 frutillas del lado de los arrayanes (Delia) | arrayanes | $2.200 |

**Lo que suma** (simulado, 360 días, entregando cada día el mejor de los tres): **~$1.650/día** con los materiales nuevos de
«recursos» y ~$1.880/día antes de juntar (sin los materiales nuevos quedan los encargos caros). El papel promedio paga ~$1.270
(~$1.540 antes). Todo dentro de los ~$1.000–2.000 por día que pidió el plan, sobre los ~$3.200 de hoy, y el tope del día
($2.200) no llega a lo que dan los jornales.

### La gente del campo (`src/gente-campo.js`, `gente-campo-juego.js`, `gente-campo-mundo.js`)
Tres personas nuevas (pocas, con historia corta) y economía para Nicanor y Josefina:

| Quién | Dónde | Pedidos (uno por vez, cambia cada 2 días) | Tiendita |
|---|---|---|---|
| **Fermín Catrileo**, pastor (57) | Galpón de esquila (el de `T.lugares.galpon`, que se sortea con la calidad): al costado del portón mirando el corral, y la vuelta del corral; con el mate | 4 de harina ($650), 4 de yerba ($500), 3 panes caseros ($750) | 2 vellones de lana $850 (3 por día), 1 cuero $450 (2 por día; cuando exista), tijera de esquilar $600 (una vez), **esquiladora** $1.600 |
| **Belisario Paredes**, arriero (46) | Unos metros al este del puesto del paso (B, −340, −20); va y viene por el oeste, hacia la parada del Mallín y hacia el mirador | **6 piñones** ($400), 4 empanadas ($900), 1 trucha ahumada ($750) | 4 de yerba $500, sal gruesa ×6 $400, maíz pisado ×4 $450 |
| **Tobías Hughes**, cantero galés (51) | A un costado de la veta de la cantera (−405, −305), del lado del puesto A; pica (pose de hachar) y camina unos pasos hacia el puesto | 3 panes caseros ($750), 4 empanadas ($900), 4 troncos para los rodillos ($750) | 4 piedras $600 (3 por día), 2 piedras de cantera $450 (cuando existan), **pico de cantero** $2.500 (pide picapedrero nivel 2) |
| **Nicanor** (ya existía) | Cabaña del Pescador | 3 panes caseros ($750), 4 de yerba ($500), 4 troncos ($750) | carnada y una mosca atada por él $700 (una vez: es la mosca de siempre), 2 truchas frescas $750, 1 ahumada $900, botas de goma $1.200 (una vez), **pala de arcilla** $1.500 |
| **Josefina** (ya existía) | Mirador | 4 tablas para la baranda ($500), 4 empanadas para el recorrido largo ($900), 1 frasco de miel para la garganta ($750) | semillas de habas ×3 $400, papa para semilla ×2 $450, **un dato del valle** $150 (uno por día), **la hoz** del mallín $1.300 |

Ejemplos de pedidos, con su voz:
- Fermín: «Si subís de la aldea, traeme cuatro medidas de harina. Tortas fritas con este frío, eso pido.»
- Belisario: «Del otro lado del paso me pagan bien los piñones. Seis, y te doy lo justo y un poco más.»
- Tobías: «Necesito cuatro troncos para los rodillos: las piedras grandes se mueven rodando, no a lomo.»
- Nicanor: «La estufa de la cabaña come leña como un chancho. Cuatro troncos y paso el frío tranquilo.»
- Josefina: «La baranda del mirador tiene dos tablas flojas. Si me traés cuatro, la arreglo antes de que alguien se apoye mal.»

**La charla**: a Nicanor y a Josefina se les suma en la rueda la categoría nueva **«Pedidos y compras»** (ícono de canasta) con
«Su pedido · …» (o «Entregarle … · $…» si lo llevás encima) y «Comprarle algo…» (un submenú con precio, lo que queda hoy o por
qué no se puede). Los tres nuevos tienen un menú corto: «Charlar» → «Contame algo · …» (dos historias de tres renglones cada uno,
en orden), «Pedidos y compras» y «Nada más, chau». Saludo según la hora y la lluvia, despedida propia. Ropa y cara propias
(`ASPECTO` de `gente-ropa.js`), de abrigo en invierno.

**Los pedidos del campo cuentan en el mismo tope de 2 entregas por día que los pedidos de los vecinos** (`negocios.hoy.pedidos`,
el de `pedidos.js`): son otra manera de usar ese cupo, no plata de más. Pagan `n × valor × 1,25` (un poco más que uno del pueblo:
están lejos), $400–$900.

**Las tienditas** venden a ~1,35–1,5 veces lo que vale la cosa: por encima de lo que paga cualquier puesto del tren el día más
caro (`caro 1,5 × 1,12 × 0,88 ≈ 1,48`), así no se compra para revender; un poco por día; lo que no se gasta, una vez.

## Decisiones (tomadas por el agente; a revisar)
1. **El cupo de los pedidos del campo es el de los vecinos** (2 por día entre todos), para no romper el equilibrio. El tablón va
   aparte (1 por día), como dice el plan.
2. **El tablón se entrega en el tablón** (la estafeta lo junta), no a quien firma: así el viaje es ida al lugar y vuelta a la
   plaza. El que firma cambia según quién ya llegó a la aldea.
3. **El multiplicador sale de un lugar fijo por encargo**, no de dónde conseguiste la cosa (las frutillas «del arrayanal» pagan
   ×2,5 aunque las juntes en otro lado): el juego no sabe de dónde salió cada frutilla. El tope de 1 entrega por día lo acota.
4. **La carnada** no existe en el juego: Nicanor vende «carnada y una mosca atada por él», que es la mosca de siempre (`cosas.mosca`,
   los piques llegan antes). No se tocó la pesca.
5. **Josefina vende datos del valle** (uno por día, $150, siete en rueda: dónde está la veta, el junco, la arcilla, el pastor, el
   arriero, los piñones, el tablón) en vez de un mapa: el mapa del valle ya existe.
6. **La pala de arcilla la vende Nicanor** (vive junto al lago, cerca de la desembocadura) y **la hoz, Josefina** (la
   guardaparque del valle); **la esquiladora, Fermín**; **el pico de cantero, Tobías** (con picapedrero nivel 2, como dice el plan).
7. **Las historias de los tres nuevos no van al cuaderno** (se anotan en `progreso.genteCampo.historias`): el cuaderno de
   historias es una lista fija de `cuaderno.js`; sumarlas era tocar más archivos compartidos.
8. **Las figuras nuevas se arman al acercarse** (a 220 m, de a poco, una por vez) y gente.js las apaga a más de 130 m: la carga y
   la plaza no cambian.
9. **Sus recorridos se buscan en el lugar** con las colisiones de verdad (árboles, rocas, edificios, pirca, corral), lejos de la
   vía y del agua y sin cuesta fuerte: no atraviesan nada aunque el bosque cambie con la calidad. Si no hubiera lugar libre, la
   persona no aparece (mejor que atravesada).

## Enganches para la junta (pendientes de conectar)
- **Herramientas de zona** («recursos»): `function darHerramientaDeZona(id)` en `main.js` (bloque `// 4.6 gente`). Hoy deja
  `progreso.cosas[id] = 1` (se guarda; no hace nada). **Al juntar: que llame a la función de «recursos»** (p. ej.
  `darHerramientaZona(id)` de su `HERRAMIENTAS_ZONA`). Los ids que se venden están en `HERRAMIENTAS_CAMPO` de `gente-campo.js`:
  `hoz`, `pala-arcilla`, `esquiladora`, `pico-cantero` — **ajustarlos a los de «recursos»** si son otros. «Ya la tenés» se mira
  en `progreso.cosas[id]` (`tiene` en el contexto de `crearGenteCampoJuego`): si «recursos» las guarda en otro lado, cambiar ahí.
- **Materiales nuevos** («recursos»): `junco`, `hierbas`, `arcilla`, `cuero`, `piedra-cantera` van como texto. `existeEnJuego`
  (`tablon.js`) los da por existentes recién cuando están en `MATERIALES` o en `BIENES`: antes de juntar, el tablón y las
  tienditas no los ofrecen. Si «recursos» los guarda en otro lado que `progreso.materiales` (o con otro `donde` en `BIENES`),
  revisar `dondeDe` (`tablon.js`). Los valores de respaldo (`VALOR_RESPALDO`) se usan sólo si no son bienes del mercado.
- **Puesto B** («puestos»): `PUESTO_PASO` en `gente-campo.js` es (−340, −20) (el del plan, corrido 10 m al este). Belisario se
  para unos 8 m más al este y busca lugar libre con las colisiones; **al juntar, cambiarlo por `PUESTOS_RUTA.B.pos`** (o lo que
  exporte «puestos») y mirar la captura de Belisario con el puesto armado. Lo mismo `PUESTO_CANTERA` (−320, −288) y `CANTERA`
  (−405, −305) con lo de «recursos» y «puestos».

## Archivos
- Nuevos: `src/tablon.js` (reglas del tablón, puro), `src/tablon-mundo.js` (la malla y el panel), `src/gente-campo.js` (personas,
  pedidos, tienditas, historias y guardado, puro), `src/gente-campo-juego.js` (la charla, puro), `src/gente-campo-mundo.js` (las
  figuras), `pruebas/verificar-4-6-gente.mjs`, `pruebas/humo-4-6-gente.cjs`, este archivo.
- **Compartidos** (cambios mínimos, en bloques `// 4.6 gente`): `src/main.js` (imports, armado, cada cuadro, la E y el aviso en el
  mismo lugar —el tablón va justo antes de lo de cada lugar de la aldea—, las teclas con el panel abierto, el enganche de las
  herramientas y tres ganchos de depuración), `src/guardado.js` (`genteCampo` en la partida nueva y saneado), `package.json`
  (la prueba nueva en el gate).
- Otros tocados: `src/vecindad-juego.js` (la sesión y el menú corto de los nuevos, lo del campo en el menú de Nicanor y Josefina,
  la ruta `campo:`), `src/social-rueda.js` (la categoría «Pedidos y compras» y sus íconos), `src/gente-ropa.js` (la ropa de los tres).
- No se tocaron `MATERIALES`, `BIENES`, `pedidos.js`, `comercio.js` ni `plantilla.html` (el panel del tablón se arma por código).

## Verificación
- `npm run verify` **de corrido: «262 pasos OK»** (eran 261; el nuevo es `verificar-4-6-gente.mjs`, 1.613 comprobaciones: tablón,
  pedidos, tienditas, charla con contexto de mentira y con `vecindad-juego` y las reglas sociales de verdad, guardado nuevo / viejo /
  roto / Desafío, enganches de `main.js` y `guardado.js`, ropa, castellano, LF).
- **Pruebas viejas ajustadas (a propósito, lo mínimo):** `verificar-3-7-4-social.mjs` líneas 43 y 44: el orden y los nombres de
  `CATEGORIAS_RUEDA` ahora terminan con `'trato'` / «Pedidos y compras» (la categoría nueva de `vecindad-social.js`: sin ella, lo
  del campo de Nicanor y Josefina caía en «Charlar»).
- **Partida real** `pruebas/humo-4-6-gente.cjs` (Electron oculto, perfil propio, calidad media, otoño): **OK, 68 comprobaciones**,
  sin errores de consola. Lee el tablón (aviso y E), toma un encargo con 1 (3 truchas frescas, $1.650), no deja entregar sin lo
  pedido, entrega y cobra $1.650, no deja una segunda entrega, Escape cierra sin abrir la pausa, se cierra solo al alejarse; habla
  con Fermín (historia + compra de lana $850), Belisario (yerba $500), Tobías (piedras $600; el pico de cantero aparece «pide
  picapedrero nivel 2»), Nicanor (truchas $750 y entrega de su pedido de troncos, $750) y Josefina (semillas de habas $400).
- **Capturas mirada a tamaño completo**: el tablón en la plaza (se integra junto a la vereda de tablas, de cara a la calle, nada
  flotando), de cerca y con el panel; Fermín con poncho y mate entre la pared del galpón y el corral; Belisario en el bosque del
  oeste junto a la vía; Tobías en el pastizal al pie de la cantera; Josefina en el sendero del mirador. Todos con los pies en el
  suelo (medido: 0,00 m) y sin atravesar nada. **La de Nicanor no sirve** (él está arriba, en el deck de la cabaña sobre el agua, y
  la cámara de la prueba queda contra la pared): no se lo movió, es el de siempre.
- Lo encontrado y arreglado con las capturas: «De el pehuenal» → «Del pehuenal»; la cámara de la prueba detrás de árboles (ahora
  busca un lugar despejado).

## No verificado
- **Fps**: no se midió (la ventana oculta no sirve). Lo nuevo en la plaza es una malla de una llamada sin sombra; las tres
  personas viven a más de 300 m de la plaza y se arman al acercarse. Medir con `npm run medir:caminata` en la 4600G.
- Con los materiales, herramientas y puestos de «recursos» y «puestos» juntados: que Belisario no quede dentro del puesto B ni
  Tobías dentro del frente de roca (buscan lugar libre con las colisiones, si esos agentes las cargan), y el pico de cantero de
  verdad.
- La calidad alta y muy baja (el galpón cambia de lugar: Fermín lo sigue por `T.lugares.galpon`, no se miró).
- Las tres personas de noche, en invierno y con lluvia (saludos escritos; no se vieron).
- Un día jugado a mano con el tablón (el equilibrio está simulado en Node).
