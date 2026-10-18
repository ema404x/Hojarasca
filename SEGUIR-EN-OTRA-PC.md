# Hojarasca — cómo seguir en la otra PC (traspaso del 13-10-2026, 3.9.2)


> **SEGUÍ DESDE ACÁ (18-10-2026, sesión en la nube, rama `ccr-0f18b396-y8d0fm`):** esa rama = `v392-mejoras` (4.0.4) + 2 commits míos. Para seguir: `git fetch origin`, `git checkout ccr-0f18b396-y8d0fm`, `git pull`, `node armar.mjs`, `npm run verify` → «242 pasos OK». (Si preferís seguir en `v392-mejoras`, se une sin conflictos: es un avance simple.) **No se tocó `main`, `v392-mejoras` ni los tags.**
> - **Hecho:** (1) `pruebas/humo-3-7-5-rincones.cjs` arreglada y pasa completa (estaba vieja: desde la 3.8.8 el lote exige pagar la escritura, ahora la prueba le da los 8000). (2) **Bug real del juego, corregido** (`src/main.js`, `src/fiestas-juego.js` → `alAsiento`): con la mesa larga llena, quien comía del otro lado de la mesa quedaba en la línea de visión y E hablaba con él en vez de sentarte; igual con la clase de Pocha en la pista llena. Ahora, junto a un asiento (o con una acción de la fiesta a mano), sólo te tapa el vecino que está a menos de 1 m. Costo: sólo corre con un vecino adelante y dentro del predio en una fiesta (a ≤15 Hz): nada nuevo por cuadro, no se tocó sombras ni geometría (regla de los 60 fps en la 4600G).
> - **Pendiente / NO resuelto:** `pruebas/humo-3-7-5-fiestas.cjs` sigue **inestable**: falla en un lugar distinto en cada corrida (pista, truco, leñera, fogón…), según dónde caiga cada vecino; no está en el gate. Hay que hacerla determinista (fijar a los vecinos) o decidir si se descarta. En la sesión no se llegó a ver si el truco/jineteada tienen bugs propios. Después: **A3** (mando en las cartas de cantina y casa de té y en el banco), G8, los bajos de `CAMBIOS_4_0_3.md`, y medir fps en la 4600G.
> - **Correr las pruebas de humo en un contenedor sin pantalla:** `npm install` + `node node_modules/electron/install.js`, y `HUMO_PERFIL=$(mktemp -d) xvfb-run -a -s "-screen 0 1280x800x24" npx electron --no-sandbox --use-gl=swiftshader --enable-unsafe-swiftshader pruebas/<prueba>.cjs` (con render por software va lento: no sirve para medir fps).

> **ACTUALIZACIÓN (15-10-2026) — SEGUÍ DESDE ACÁ:** la rama de trabajo sigue siendo **`v392-mejoras`** (`git fetch origin`, `git checkout v392-mejoras`, `git pull`, `node armar.mjs`, `npm run verify` → «207 pasos OK»). Ya incluye:
> - **Creador de Bruno (4.1, F1 y F2)** unido a la 3.9.2 (rama `creador-bruno`; guía en `CREADOR_BRUNO_LEEME.md`). Falta F3 (efectos y guardarropa) y F4 (prólogo y textos, que escribe el usuario).
> - **Mujeres:** cada mujer adulta tiene busto propio (hash de la clave, `cuerpo.busto` lo fija) con forma de dos lóbulos; Dalia más busto (2,7) y escote más hondo; el collar sigue la piel; el chaleco de las mujeres sin triángulos en la cintura.
> - **4.0 en marcha** (`PLAN_4_0.md`): meta **60 fps en calidad alta en la 4600G**; tabla base medida con `herramientas/medir-vistas.cjs` (alta, aldea completa: plaza ~14,5 ms p50, noche ~14,5, loma ~14,9). Hecho (16-10): **aldea de noche** (`PROTO_4_0_ALDEA_NOCHE.md`: halos en ventanas y faroles, charcos de luz, cantina con resplandor; el reloj de la plaza quedó SIN halo porque lavaba la esfera; costo dentro del ruido). Hecho antes: prototipo de personajes (`PROTO_4_0_PERSONAJES.md`: mejora chica, el usuario lo aceptó; Anselmo conserva el delantal) y de la **casa de té** (`PROTO_4_0_CASA_TE.md`: faroles con halo, fuego, charcos de luz, ventanas con paisaje; se nota mucho). **Interior de la casa de té (16-10): costo ACEPTADO por el usuario** (p50 ~16 ms, igual que la plaza). Diagnóstico: la luz nueva suma ~0,3 ms; el costo es el de las sombras de todo el juego (sin sombras: 14,3 → 4,1 ms en el interior; sotobosque e impostores casi no pesan; terreno ~2 ms). Las sombras ya se rehacen 3-6 veces por segundo; bajarlas implica tocar su calidad (cambiaría el aspecto): revisar al final de la 4.0 sólo si hace falta, con capturas píxel por píxel. **Vegetación y suelo (16-10): prototipo hecho pero NO unido** (rama `proto-40-vegetacion`, `PROTO_4_0_VEGETACION.md`): casi no se nota; los cojines de musgo en las piedras se ven como manchas verdes de bordes duros (peor que la piedra lisa) y suma ~5 % en la plaza. Decisión tomada sin el usuario (estaba ausente): no unir; si él la quiere, revisar el musgo y mirar el aplastado de pasto caminando (no se probó en movimiento). Hecho (16-10): **agua y cielo** UNIDO (`PROTO_4_0_AGUA_CIELO.md`: rayos entre los árboles al atardecer, espuma de orilla y niebla de valle se ven mejor; el cielo dorado y el reflejo de orilla casi no aportan; costo +0 a +5 % p50, falta medir en la 4600G; sólo en calidad media/alta). **Con eso la 4.0 de ambiente queda completa salvo lo que el usuario quiera repasar:** ondas con lluvia, nubes con volumen y reflejos reales de agua no se tocaron. **Sigue el 4.1 (creador de Bruno, F3).** (Con las pasadas de ambiente terminadas, el resto de la 4.0 es repasar lo que el usuario quiera: preguntarle.)
> - **Reglas del usuario:** el inglés se hace AL FINAL (no traducir nada nuevo); si necesitás algo de él, pedíselo como pregunta con opciones; prefiere rapidez; capturas y ventanas de prueba al monitor externo; lo sensual, sugerido y nunca explícito. Las capturas antes/después están en `Documents\Hojarasca	rabajo\proto40\` (fuera del repo).
> - **4.1 F3 del creador de Bruno HECHA y UNIDA (16-10)**, gate ahora **216 pasos OK** (`CAMBIOS_4_1_F3.md`, módulo `src/creador-efectos.js`): abrigo (±1 punto al dormir en invierno), afecto con vecinos (hasta ±20 % en las ganancias), pesca (espera del pique ±20 %), cuaderno (mirada de constelaciones y luna ±20 %) y guardarropa (5 conjuntos con piezas existentes). Todo sólo en Relax y con Bruno creado; neutro si no. **Decisiones que el agente tomó SIN consultar y el usuario debe revisar** (detalle en `CAMBIOS_4_1_F3.md`): (1) el abrigo en ±1 punto cambia la dificultad en forma visible (un Friolero que templaba con 4 puntos ahora necesita los guantes; un Resistente templa con poncho y gorro); (2) el afecto solo escala ganancias, no lo que resta una discusión; (3) el romance de `amor.js` no se tocó; (4) la pesca solo cambia la espera; (5) el cuaderno solo cambia el cielo; (6) los textos de los conjuntos y el aviso «te falta el poncho» son provisorios. **Preguntas sin implementar:** ropa de fiesta de la peña (la pieza no existe), fauna en el cuaderno (obliga a tocar `mirando()` en fauna/vida/bichos), cambio automático de ropa por estación, si la personalidad debe tocar el romance. **No probado:** dormir con frío en Electron (invierno+noche), apuntar a una constelación, fps en la 4600G. (La F4 se hizo el 17-10: ver arriba.)

> - **4.1 F4 del creador de Bruno HECHA y UNIDA (17-10)**, gate **218 pasos OK** (`CAMBIOS_4_1_F4.md`): prólogo de 5 tarjetas al empezar una partida nueva del Relax tras crear a Bruno (`src/creador-prologo.js`; textos del usuario: mezcla de dos versiones; saltable), 32 tarjetas del carácter y 26 líneas de asado y lluvia, todo en `src/creador-textos.js` marcado como **propuesto por Claude, a revisar por el usuario**. **El creador de Bruno (4.1) queda completo.** A revisar: (1) Ahorrativo y Dormilón tienen efecto en el catálogo pero `RASGOS_BRUNO.md` los daba como «sabor» (el juego manda; corregir el doc o volverlos de sabor); (2) los 9 textos del cuaderno dicen «anota el cielo» (suena raro en Observar aves); (3) las líneas de asado y lluvia se repiten en cada «¿Cómo andás?» (se puede limitar a una por día); (4) el prólogo es sólo texto sobre un color por escena (sin música ni imagen: preguntar si quiere); (5) siguen provisorios los nombres de los conjuntos del guardarropa y el aviso «te falta el poncho». No probado: prólogo con mando, costo en la placa integrada, líneas de vecinos con E en una conversación real.

> - **4.0.1 PASE DE BUGS HECHO y UNIDO (17-10)**, gate **225 pasos OK** (`CAMBIOS_4_0_1.md`; informes de los 4 revisores en `Documents\Hojarasca	rabajougs\zona-A..D.md`: 50 hallazgos). Arreglados y probados: los 4 ALTOS (pedido de la cantina/casa de té cobrado y nunca servido + excepción por cuadro al alejarte; creador de Bruno que colgaba la capa si falla el 2.º WebGL; quedar encajonado al levantar un piso en ladera) y 17 de los otros 46 (sincronía con relojes desfasados, base de sync tras importar, álbum incompleto, retrato con escala de pantalla, molino sin tulipanes sobre el sendero y arroyo pegado a la loma, modo foto congelado, caer en el Desafío sobre kayak/velero/trochita, fauna tras la pausa, escudo con mando, espejo de Bruno, catapulta, victoria con el cuaderno abierto, casas grandes en ladera, Enter sostenido en el prólogo). **Pospuestos:** A3 (el mando no llega al banco ni a las cartas de cantina/casa de té: hay que definir la navegación de una carta de ~25 platos y probarla con un mando real), casi todos los BAJOS (A4–A6, B7–B11, B13–B14, C6–C11, D10–D19) y C10 (sombras, por la regla del usuario). **Preguntas para el usuario** (en `CAMBIOS_4_0_1.md`): B3 (el accesorio del creador se suma al gorro/bufanda en vez de pisarlos), D3 (casas en ladera: se rechaza el sitio con «girala (R)» en vez de poner rampa), C1/C2 (el molino pierde el 27 % de los tulipanes y el paredón de piedra del arroyo), B9 (el afecto de Bruno escala también la amistad del romance aunque `CAMBIOS_4_1_F3.md` dice que no), C11 (al bajar la calidad en vivo siguen los efectos de la 4.0). **No probado de verdad:** mando real, trochita/velero con caída real, espejo con el mouse bloqueado, escala de Windows 150/200 %, fps en la 4600G.

> - **18-10: 4.0.2 y EASTER EGGS UNIDOS** (gate **229 pasos OK**). 4.0.2 (`CAMBIOS_4_0_2.md`): zapatos y paso de baile de Dalia, borde de la blusa, 11 bugs bajos. Pulido de Greta (`PULIDO_GRETA_40.md`, modesto: ojos, mejillas, pelo). **Easter eggs** (`EASTER_EGGS_40.md`, sólo Relax, campo `progreso.huevos`): estrella fugaz con deseo, yerba al Coihue, huemul blanco al amanecer con niebla, hueso del perro, código ↑↑↓↓←→←→BA en la portada y radio de madrugada (tango/Morse sintetizados; no se escucharon a oído). **El corazón de tulipanes se SACÓ** (lavaba los colores del campo del molino y no se leía); sigue en la rama `easter-eggs-40` por si se quiere rehacer. **Sin unir (esperando medir fps con la PC libre):** `musgo-40` (piedras con musgo: se ve mejor de cerca, pero pasa de 80 a 720 caras por piedra) y `pasto-aplastado-40` (pasto aplastado al caminar, sutil). **En marcha:** `bugs-4-0-3` (segunda ronda de bugs: mando para empezar y para el taller, ritmo automático, trochita, escalera de la torre de vigía, dinero al deshacer una casa, etc.; informes en `Documents\Hojarasca	rabajougs2\zona-E..I.md`).

> - **18-10 NOCHE: VERSIÓN 4.0.4 (rama `v392-mejoras`, etiqueta `v4.0.4`, gate 242 pasos OK; zip `Hojarasca-4.0.4-completo.zip` en Descargas de la PC que lo armó).** Incluye la 4.0.3 (`CAMBIOS_4_0_3.md`: 31 hallazgos de la segunda ronda arreglados: **mando para poder jugar** — portada, creador, prólogo, pausa, cuaderno, ajustes, taller K y planos O —, ritmo automático que vuelve a 60, trochita `soltar` duplicada, escalera de la torre de vigía, pesos de casa al retirar la marca, molino que reserva lugar, modo foto, noche de estrellas, etc.) y el **musgo de las piedras** (medido: ~gratis). **NO entró el aplastado del pasto** (rama `pasto-aplastado-40`; medido: +~1 ms p50 en la plaza, p95 +1 ms: la plaza queda al borde de 60 fps; el efecto es sutil). Medición de fps en esta PC (alta, aldea completa, corridas alternadas): plaza ~14,6 (sin) vs ~15,5 (con musgo+pasto) vs ~14,9 (sólo musgo); campo/bosque sin cambio. **Pendientes conocidos:** A3 (cartas de cantina/casa de té y banco con mando), G8 (mando sin mapeo estándar), el resto de los bajos de las cinco zonas (cada uno con su motivo en `CAMBIOS_4_0_3.md`), `pruebas/humo-3-7-5-rincones.cjs` y `humo-3-7-5-fiestas.cjs` FALLAN también en 4.0.1 (error de consola «Cannot read properties of undefined (reading 'nombre')» y excepción en «el baile»: no son regresión, no están en el gate, hay que mirar si son bugs del juego o de la prueba), y los fps en la Ryzen 5 4600G del usuario con este paquete. **Preguntas abiertas para el usuario** (en `CAMBIOS_4_0_1.md`, `_0_2`, `_0_3`): accesorio de Bruno que se suma, casas en ladera que se rechazan con «girala (R)», pérdida del 27 % de tulipanes, afecto de Bruno y romance, efectos 4.0 al bajar calidad en vivo, escote de Dalia, diseño del mando en los menús. **Inglés: recién al final.**

> - **HOJA DE RUTA (lo que falta, en orden):**
>   1. **4.0 (visual y rendimiento, sin contenido nuevo):** recortar unos ms del interior de la casa de té (límite de 60 fps) → prototipos que faltan: aldea de noche (faroles con halo, ventanas encendidas, humo, luz de la cantina), agua y cielo (reflejos, espuma, rayos entre árboles, niebla), vegetación y suelo (pasto, flores, hojarasca, piedras con musgo) → integrar, medir de nuevo contra la tabla base y pase de bugs visuales con capturas a tamaño completo. El usuario elige el orden: preguntarle.
>   2. **4.1 creador de Bruno:** F3 (efectos y guardarropa: abrigo, afecto con vecinos, pesca y cuaderno, uno por vez con su prueba) y F4 (prólogo y textos; los textos los escribe el usuario con la plantilla de `TEXTOS_BRUNO.md`). Falta también el mando y medirlo en la placa integrada.
>   3. **Cierre antes de Steam:** congelar contenido, primera hora de juego, fluidez en la 4600G, pantallas, integración Steam, demo y página. **Inglés completo recién al final** (incluye economía, 3.9.x y todo lo nuevo; hoy sin traducir a propósito).
>   4. **DLC (después):** termas, cascada escondida con poza, islote del arrayanal, bichos del bosque, granja y aldea, etc. (lista en `PLAN_4_0.md`, sección 4).
>   - **Detalles chicos sueltos:** zapatos rojos de Dalia que parecen flotar; chamamé de Dalia con piernas abiertas (la falda puede abrirse como pantalón; no se vio con el cambio de busto); muesquita en el borde izquierdo de la V del escote de Dalia; poses `saludar` y `secar` de la moza sólo probadas por estado; peña con el pulido que haga falta tras jugarla; el zip completo de la 3.9.2 no se jugó entero; no se midieron fps en la peña ni en el Desafío con lo nuevo; en la maestra la blusa queda con un festoneado suave bajo el chaleco; la pelusa flotante del valle entra a los interiores.

> - **Remoto:** GitHub avisa que el repo se mudó a `https://github.com/ema404x/Hojarasca.git` (el viejo, en minúscula, redirige y funciona); falta cambiar el `origin` con `git remote set-url`.

> **SEGUÍ ACÁ (13-10-2026, 3.9.2):** el trabajo de hoy está en la rama **`v392-mejoras`** (cadena: 3.8.9 `claude/hojarasca-improvements-57k11e` → `v390-cantina` 3.9.0 → `v391-pena` 3.9.1 → `v392-mejoras` 3.9.2; cada una contiene a la anterior; **ninguna está unida a `main`** ni etiquetada; el PR #1 sigue abierto). Para seguir: `git fetch origin`, `git checkout v392-mejoras`, `git pull`, `npm install`, `node armar.mjs` y `npm run verify` (tiene que dar «207 pasos OK»). Zip completo: `powershell -NoProfile -File herramientas\empaquetar.ps1 . 3.9.2 herramientas\LEEME-3.9.2.txt` (deja `Hojarasca-3.9.2-completo.zip` en Descargas; la portada dice «Hojarasca · 3.9.2 · build fd73b49d»).
> - **Qué hay:** 3.9.0 la cantina (`CAMBIOS_3_9_0.md`); 3.9.1 la peña de los sábados, Dalia la bailarina, truco, borrachera, romance con Lucrecia y Dalia y chistes (`CAMBIOS_3_9_1.md`); 3.9.2 banco y cantina con más vida, la casa de té que viene a la mesa y la falda de Dalia (`CAMBIOS_3_9_2.md` y `CAMBIOS_3_9_2C.md`; plan en `PLAN_3_9_2.md`).
> - **Reglas que dijo el usuario:** (1) **NO escribir textos en inglés hasta que él avise**: los textos nuevos de 3.9.2 quedan sin inglés (listas al final de los dos `CAMBIOS_3_9_2*.md`); la prueba del inglés del gerente tiene la lista `SIN_INGLES_392`. (2) Las ventanas de prueba y capturas van **siempre al monitor externo** (`herramientas/lanzar-electron.ps1`, `al-monitor.cjs`), nunca a la notebook. (3) Lo sensual, sugerido y nunca explícito (calificación de Steam). (4) Rapidez: partir el trabajo en agentes en paralelo y juntar las ramas.
> - **Lo flojo / sin ver de la 3.9.2:** las capturas de la galesa y la moza caminando con la bandeja salieron con la cámara dentro de una pared; poses `saludar` y `secar` sólo por estado; el chamamé de Dalia de 3/4 con piernas muy abiertas aún abre la falda como pantalón; botas de Dalia que parecen flotar; cierre del banco del sábado con baile (16 h) sin ver; **no se midieron cuadros por segundo en la Ryzen 5 4600G**; el zip no se jugó entero todavía.
> - **Lo que sigue:** **4.0 = mejoras visuales y de rendimiento, sin contenido nuevo** (`PLAN_4_0.md`; referencias de arte en `referencias-4-0/`: 1–4 ambiente, 5–7 personajes; y en `referencias-4-0/simulaciones/` las dos simulaciones por filtro: cantina de noche y Dalia con luz dorada, sólo clima de color). Primero medir en la 4600G, después prototipos antes/después (el prototipo de 3 personajes con Fable), el usuario elige qué entra. Lugares y animales nuevos quedan para un DLC (lista en el plan). Después: inglés completo, congelar contenido y Steam. Pendiente chico: la peña con el pulido que haga falta tras jugarla, el inglés de la economía.

> **ATENCIÓN (08-10, notebook):** la 3.8.0 La noche de los duendes y su revisión de bugs 3.8.1 (`CAMBIOS_3_8_1.md`, etiqueta v3.8.1) quedaron cerradas en la notebook. Las 6 partidas pendientes de la 3.7.5 ya se repitieron: 4 eran de carga y las 2 reales (caos y la trochita) están arregladas. Decisiones del usuario en `PLAN_3_8.md`; lo que quedó para después, al final de `CAMBIOS_3_8_0.md`. **Para el usuario:** jugar una noche grande, la subida y el Rey en su PC (4600G) y escuchar los sonidos nuevos. Sigue el resto de `PLAN_3_8.md` (preguntarle antes de arrancar).

> **Lo que sigue (08-10, charlado con el usuario):**
> 000000. **3.9.0 (13-10), LA CANTINA, primera versión** (`CAMBIOS_3_9_0.md`): boliche al final de la calle de la Loma, Lucrecia la moza (18 a 2), sentarte y que venga caminando, la carta, pagar con pesos/trueque/cuenta, bandeja, sorbos. Gate 204 pasos. Rama `v390-cantina` (sale de la 3.8.9; sin unir, sin etiqueta, sin zip). **Pendiente para la 3.9.1:** peña de los sábados, bailarina, truco y vecinos que se arriman, borrachera, la casa de té con bandeja y el romance con Lucrecia; ver «Dudas para el usuario» de `CAMBIOS_3_9_0.md`. Las ventanas de prueba van al monitor externo con rutas ABSOLUTAS (`-r <ruta>herramientasal-monitor.cjs`); el lanzador es `salida-cantinalanzar.ps1` (fuera del repo).
> 00000. **3.8.9 (12-10), la auditoría de la entrega** (`CAMBIOS_3_8_9.md`): el usuario jugó el zip de la 3.8.8 y no veía el banco; la auditoría independiente dijo que el paquete estaba íntegro pero que **el juego no llevaba al banco** (nada lo nombraba). Ahora hay una pista al llegar a la aldea, un rótulo en el mapa, entradas en la guía (F1) y un cartel con el horario junto a la puerta; el gerente atiende de verdad de 8:30 a 12:30 y de 14:30 a 18 (el sábado con baile, hasta las 16); las banderas que faltaban (tu bandera, la locomotora, los postes de largada) flamean con el viento; la versión sube y el build lleva una **huella** del contenido, visible en la portada (para distinguir un paquete nuevo de uno viejo de la misma versión); la segunda copia del juego avisa en vez de cerrarse sola. Los guiones de Playwright pasaron a `herramientas/` (`partida-real-economia.cjs`, `recorrido-revision.cjs`): no son de la suite de Electron. **Pendiente: el inglés de la economía** (el usuario dijo que se saltee por ahora; ver «Lo que la auditoría propuso y no se hizo»).
> 0000. **3.8.8 (12-10), la economía del pueblo** (`CAMBIOS_3_8_8.md`, `PLAN_ECONOMIA.md`): pesos y billetera (la yerba deja de ser moneda), mercado con oferta y demanda, jornales, pedidos con reputación, la aldea viva (cajas de los locales y eventos), el **Banco del Pueblo** con su gerente **Amadeo Lezcano** (préstamos al 2 % por día, abastecimiento, venta de las casas por etapas, alquiler y puesto propio) y el precio de las casas ($36.000, $66.000 y $110.000). Sólo en el Relax; el estado vive en `progreso.economia` y `progreso.negocios` (`src/negocios.js`). Probada en Node y en una partida real automática (`herramientas/partida-real-economia.cjs`, 27 pasos); **falta ver las casas terminadas, el alquiler y el puesto propio**. Antes, el mismo día: **la escalera de casas** la escalera de casas (`CAMBIOS_3_8_8.md`): cabaña de tablas y piedra, casa con galería y casona de dos cuartos, en `src/planos-casas.js`. Se probó en Node y con una vista previa propia, **no en el juego**: falta recorrerlas en una partida real (cómo se ven con el terreno y la luz, el confort adentro) y ajustar los precios. También trae la cama de tablas como pieza suelta (el techo a dos aguas modular ya existía). Y el aviso del próximo vecino, el reloj de la plaza, el almanaque de la biblioteca y el reloj y el almanaque propios del almacén (`src/reloj-almanaque.js`; sin verlos en el juego todavía). **La Cueva de las Manos volvió** (`CAMBIOS_3_8_8.md`): gruta de roca en la estepa (x≈307), sin escalera, con las manos en negativo; se sacó la historia del abuelo de Martín. Falta verla en el juego. **Mobiliario: 31 piezas nuevas** en `src/planos-muebles.js` (17) y `src/planos-muebles-2.js` (14: cama doble, litera, tocador, bañera con biombo, mecedora, vitrina, mesa ratona, hogar con repisa, banco de carpintero, tonel y barricas, colgador de hierbas, guirnalda, telar y rueca, hamaca); sin verlas en el juego todavía.
> 000. **3.8.7 cerrada (11-10, etiqueta v3.8.7):** segundo pase de bugs (`CAMBIOS_3_8_7.md`) más las decisiones del usuario (fogatas, siesta, invitaciones, chinchón, viento). `npm run verify` ahora corre por pasos con `herramientas/verificar-todo.cjs` (los pasos están en `scripts["verify:pasos"]`; `sumar-prueba` sigue igual). Pendiente: construir con mando (para Steam), compilaciones al primer uso del cielo y las ventanas, y la lista del final de CAMBIOS_3_8_7.md. **Para ahorrar uso: pasadas con 2 o 3 equipos y modelo liviano; sesión nueva por versión.**
> 00. **3.8.6 cerrada (10-10, etiqueta v3.8.6):** pase de bugs completo (`CAMBIOS_3_8_6.md`), ~130 arreglos. Las decisiones se tomaron con lo recomendado (el usuario dijo «arreglá todo») y quedan listadas para revisar, con lo pendiente de diseño (chinchón, invitaciones de vecinos, siesta, fogatas, construir con mando, soak de memoria del Desafío).
> 0. **3.8.5 cerrada (10-10, etiqueta v3.8.5):** risas de duende y piano de misterio sintetizados (`CAMBIOS_3_8_5.md`). **Regla:** no meter audios grabados de terceros (licencias); sólo de referencia. **Lo que sigue: un pase de bugs de todo el juego (pedido del usuario el 10-10).**
> 1. **3.8.4 cerrada (10-10, etiqueta v3.8.4):** se hicieron las 36 decisiones de `DECISIONES_3_8_4.md` ("A hacer") en 4 equipos, `CAMBIOS_3_8_4.md`. Los menús ya son «Cuaderno de campo» para siempre (`src/menus/`; la rama `proto-menu` ya está adentro). **Para que mire el usuario:** las voces y silbatos nuevos (`pruebas/render-sonidos.cjs`), la estación y calidad en la tira de la portada, la E en vez de la P entre las 6 teclas, y si una noche perdida por caer de día le resulta justa. **Lo que sigue** (el usuario decide cuál, preguntarle): la versión de pulido visual, Steam, sus 3 o 4 versiones nuevas (la primera hora, más La noche de los duendes, «La aldea viva», 8 lugares nuevos), la mejora de gráficos (prototipo antes/después) y la cantina. Las ramas `v384` y `v384-*` ya están unidas en main: borrarlas si quedan.
> 1b. **3.8.3 cerrada (09-10, etiqueta v3.8.3):** pase de bugs completo, `CAMBIOS_3_8_3.md`.
> 2. **Rumbo:** el usuario quiere **algunas versiones más, pocas y acotadas** (él elige cuáles), después **congelar contenido** y preparar el **lanzamiento en Steam** (~3–5 semanas de trabajo: inglés completo, pase de bugs de punta a punta, primera hora de juego, fluidez en su 4600G, pantallas, integración Steam, demo, página), y más adelante un **DLC**. En Steamworks: el usuario crea la cuenta, se loguea, carga identidad/impuestos/banco, acepta el acuerdo y paga los 100 USD; Claude carga la página, sube builds con la sesión del usuario y configura logros/demo/precios pidiendo OK antes de enviar o publicar. Nunca manejar credenciales.


Sirve para vos y para Claude. En la otra PC, abrí Claude Code en la carpeta del proyecto y
decile: **"leé SEGUIR-EN-OTRA-PC.md y seguimos"**.

---

## 1. Para vos (pasos en la otra PC)

**Desde el 01-10-2026 el código vive en GitHub: `https://github.com/ema404x/Hojarasca`
(privado).** Ya no hacen falta zips para el código.

0. **El trabajo de la 3.8.x está en la rama `claude/hojarasca-improvements-57k11e` (el PR #1 sigue abierto, sin juntar con `main`).**
   Después de clonar (o si ya lo tenías): `git fetch origin` y `git checkout claude/hojarasca-improvements-57k11e` y `git pull`;
   si te quedás en `main` falta todo lo de la 3.8.x (economía, banco, auditoría). Al terminar: `npm install`, `node armar.mjs`
   (`index.html` no se sube a git: hay que armarlo) y `npm run verify` (204 pasos, tiene que dar «204 pasos OK»).
   **Para el zip completo de la 3.8.9** (como antes, en Descargas), desde Git Bash en la carpeta del proyecto:
   `bash herramientas/empaquetar.sh . 3.8.9 herramientas/LEEME-3.8.9.txt`. La portada del juego armado tiene que decir
   «Hojarasca · 3.8.9 · build c3d68ef5» (la huella sale del código: si dice otra, el código no es el de la rama).
1. Instalá Git si no está: `winget install --id Git.Git -e --source winget`.
2. Clonalo en `Documents\Hojarasca`:
   `git clone https://github.com/ema404x/Hojarasca.git hojarasca`
   (la primera vez se abre el navegador para iniciar sesión en GitHub).
3. En `Documents\Hojarasca\hojarasca` corré una vez `npm install`.
4. Abrí Claude Code en esa carpeta y pedile que siga.
5. Para pasar el trabajo entre PCs: al terminar en una, **subir** (`git push`); al empezar en
   la otra, **bajar** (`git pull`). No trabajar en las dos a la vez sin subir/bajar antes.
6. Las capturas de evidencia y los scripts de `herramientas-34` (punto 4.3) no están en el
   repositorio (pesan cientos de MB): vienen en `Hojarasca-traspaso-3.5.zip` (Descargas de la
   PC de origen). El instalador de la 3.4.0 está en `Hojarasca-3.4.0-completo.zip`.

---

## 2. Para Claude: el proyecto

**Hojarasca**: juego Electron + three.js (r186 local en `three-r186-inline.js`) en un valle
andino-patagónico procedural. Modos **Relax** (refugio, vecinos, huerta, perro, caballo,
kayak, velero, trochita, comercio, la Aldea de los Duendes, historia guiada) y **Desafío** (invasores de noche,
arsenal, fortín, asedio, jefe en la nave, sin fin). Todo por código: nada descargado (ni
texturas, ni modelos, ni audio).

- El usuario habla **castellano rioplatense**; juego, textos y comentarios en castellano.
- **Repositorio git** (desde el 01-10-2026): `https://github.com/ema404x/Hojarasca`, rama
  `main`, en `Documents\Hojarasca\hojarasca`. Cada versión cerrada lleva una etiqueta
  (`v3.4.0`). Antes de empezar: `git pull`; al cerrar algo: commit + `git push` (y etiqueta
  `v<ver>` al cerrar una versión). `index.html`, `node_modules`, `dist` y las salidas de
  pruebas no van al repositorio (`.gitignore`). `.gitattributes` fuerza LF.
- Las carpetas viejas `Documents\Hojarasca\src\hojarasca-<ver>` quedan como archivo; se
  trabaja en el repositorio. Confirmar la versión en `RELEASE_STATUS.md`.
- En la PC de origen git se instaló el 01-10 en `C:\Program Files\Git\cmd\git.exe` (si
  Claude no lo encuentra en el PATH, usar esa ruta). Si `git push` falla con "terminal
  prompts disabled", correrlo con `GCM_INTERACTIVE=always` y `GIT_TERMINAL_PROMPT=1` para
  que se abra la ventana de inicio de sesión (la credencial queda guardada).

### Versiones (lo último arriba)
- **3.9.2 (rama v392-mejoras, sin etiqueta todavía): Dalia y el banco del pueblo.** `CAMBIOS_3_9_2.md`. Gate 206/206. La parte de la cantina y la casa de té, en la rama `v392-cantina`.
- **3.9.1 (rama v391-pena, sin etiqueta todavía): la peña de los sábados** y el pulido de la cantina. `CAMBIOS_3_9_1.md`. Gate 205/205.
- **3.9.0 (rama v390-cantina, sin etiqueta todavía): la cantina**, primera versión. `CAMBIOS_3_9_0.md`. Gate 204/204.
- **3.8.7 (etiqueta v3.8.7):** segundo pase de bugs + decisiones del usuario. `CAMBIOS_3_8_7.md`. Gate 189/189.
- **3.8.6 (etiqueta v3.8.6):** pase de bugs completo (5 equipos, ~130 arreglos). `CAMBIOS_3_8_6.md`. Gate 184/184.
- **3.8.5 (etiqueta v3.8.5):** risas de duende y piano de misterio por síntesis. `CAMBIOS_3_8_5.md`. Gate 179/179.
- **3.8.4 (etiqueta v3.8.4):** las 36 decisiones de la 3.8.3 (4 equipos): menús Cuaderno de campo, calidad que pregunta, voces y silbato, alero del arriero, 21 arreglos del Relax y 6 del Desafío con pulido de duendes. `CAMBIOS_3_8_4.md`. Gate 178/178.
- **3.8.3 (etiqueta v3.8.3):** pase de bugs completo de todo el juego (5 equipos, ~80 arreglos). `CAMBIOS_3_8_3.md`; decisiones pendientes en `DECISIONES_3_8_4.md`. Gate 174/174.
- **3.8.2 (etiqueta v3.8.2):** cuatro arreglos de La noche de los duendes (espalda del Mandamás, cofre del alba, cristal del Relax). `CAMBIOS_3_8_2.md`. Gate 169/169.
- **3.8.1 (etiqueta v3.8.1): revisión de bugs** de la 3.8.0 en menos de una hora (3 equipos + integración), 13 arreglos. `CAMBIOS_3_8_1.md` (al final, lo visto y no arreglado). Gate 169/169.
- **3.8.0 (etiqueta v3.8.0): La noche de los duendes**, cerrada en la notebook el 08-10 (4 equipos: arreglos, duendes, coihue, textos + integración). `CAMBIOS_3_8_0.md`. El Desafío pasa a llamarse «La noche de los duendes» (interno sigue `desafio`). Gate 169/169; partidas reales 68/68 (3 repetidas solas).
- **3.7.5 (etiqueta v3.7.5): Tradiciones**, cerrada en la notebook el 07-10 (3 equipos + integración). `CAMBIOS_3_7_5.md`. El usuario aprobó todas las decisiones de detalle como las recomendaron los equipos. Gate 165/165; partidas reales 62/68 (6 sin repetir). Sigue: 3.8.0 (PLAN_3_8.md).
- **3.7.4 (etiqueta v3.7.4): Vida social tipo Sims**, cerrada en la PC de escritorio. `CAMBIOS_3_7_4.md`. Sigue: 3.7.5 Tradiciones; después 3.8.0 (PLAN_3_8.md).
- **3.7.3 (etiqueta v3.7.3): La trochita**, cerrada en la PC de escritorio. `CAMBIOS_3_7_3.md`.
- **3.7.2 (etiqueta v3.7.2): La cocina** (cerrada el 06-10 en la notebook). Cocina + granja, `CAMBIOS_3_7_2.md` (tiene preguntas para el usuario). Gate 154/154, 62 partidas reales. En curso: 3.7.3 La trochita (ramas v373-loco y v373-vagones) y un bug de cabezas/cuellos de la gente (rama v372-cabezas).
- **3.7.1 (etiqueta v3.7.1): Amor en la aldea** (cerrada el 06-10 en la notebook). `CAMBIOS_3_7_1.md`; decisiones del usuario en `PLAN_3_7.md` ("Decidido el 06-10"). Incluye los retoques de la 3.7.0 (`CAMBIOS_3_7_0.md`). Gate 152/152, 60 partidas reales. **Partidas reales en paralelo**: `node herramientas/suite-paralela.cjs <salida> 4` (cada una con su perfil vía `herramientas/perfil-propio.cjs`, ventanas al monitor; ~24 min en vez de ~60; repetir solas las que fallen). Sigue: 3.7.2 La cocina.
- **3.7.0 (etiqueta v3.7.0): La aldea crece.** Primera de las 5 versiones de `PLAN_3_7.md` (leelo: siguen 3.7.1 Amor, 3.7.2 Cocina, 3.7.3 La trochita, 3.7.4 Tradiciones). `CAMBIOS_3_7_0.md`. Quedaron sin unir unos retoques de poses: rama `v370-retoques-wip` en GitHub (sin probar). Prototipos aprobados por el usuario en las ramas `proto-personajes` (ya pasado al juego en la 3.7.0) y `proto-tren` (diseño de la 3.7.3, `?debug=1&tren=proto`). Sigue: retoques de la 3.7.0 y la 3.7.1 Amor.
- **3.6.2 (cerrada el 05-10, etiqueta v3.6.2):** lo pendiente de la 3.6 (obras viejas encimadas, clic y mando en el HUD, mapa de la aldea, lluvia bajo techo, etc.). Gate 146/146. `CAMBIOS_3_6_2.md`. **Hay un plan grande en charla con el usuario para la 3.7 (aldea que crece, romance, tradiciones): todavía no está escrito en el repo; preguntarle antes de empezar.**
- **3.6.1 (cerrada el 04-10, etiqueta v3.6.1):** caza de bugs de la 3.6 en 4 equipos, 33 arreglos (el sillón de la biblioteca que no te dejaba salir, etc.). Gate 144/144. Lo que quedó para después, al final de `CAMBIOS_3_6_1.md`.
- **3.6.0 (cerrada el 03-10, etiqueta v3.6.0): la Aldea de los Duendes.** Pueblo fijo en la
  parada sur (sólo Relax), planificado con el usuario en `PLAN_ALDEA.md` (leelo: tiene todas sus
  decisiones). Crece con 11 pobladores y obras del pueblo; biblioteca popular (NADA religioso:
  el usuario lo pidió); el almacén de Ercilia y la casa de té se mudaron a la aldea (en el
  Desafío siguen en el valle); vecinos con horarios, tiempo libre, menú de charla, amistad y
  memoria (`vecindad*.js`); mecánicas en cada lugar (`aldea-mecanicas*.js`); se sacó el
  «fundar el pueblo» de la 3.1. Gate 140/140, 53 partidas reales. `CAMBIOS_3_6_0.md`.
- **3.5.4 (cerrada el 02-10, etiqueta v3.5.4):** estabilidad — fuga grande del contexto 3D
  recuperado (candidata firme a las caídas en la Radeon integrada), ventana blindada, caos de
  ~5 h con 4 arreglos. Gate 133/133, 49 partidas reales. `CAMBIOS_3_5_4.md` (incluye cómo
  correr el soak largo en la PC de escritorio).
- **3.5.3 (etiqueta v3.5.3):** Ctrl+W (agacharse con Ctrl + caminar con W) cerraba el juego:
  sin el menú oculto de Electron. Las ventanas de prueba van al monitor externo con
  `npx electron --no-sandbox -r herramientas/al-monitor.cjs …`.
- **3.5.2 (cerrada el 02-10 en la notebook, etiqueta v3.5.2):** pulido de lo anotado en la
  3.5.0 (paisaje, animales, bosque) en tres ramas juntadas; gate 129/129 y las 46 partidas
  reales a la primera. Detalle y lo que quedó para después en `CAMBIOS_3_5_2.md` (reemplaza
  la lista "Lo visual que quedó anotado de la 3.5.0" del punto 3).
- **3.5.1 (cerrada, etiqueta v3.5.1):** crashes y revisión de todo el juego: cuadro de preguntas propio (no más `prompt`/`confirm`, que en Electron tiraban error), cada sistema del bucle aislado con `fallaSistema`, recuperación del contexto 3D perdido, reapertura sola si la ventana se cae o se cuelga (`recuperacion-main.cjs`), autoguardado cada 20 s reales; 25 arreglos de Relax, 25 de Desafío, dos fugas chicas de memoria. Detalle en `CAMBIOS_3_5_1.md`.
- **3.5.0 (cerrada, etiqueta v3.5.0):** distancia de dibujo configurable + caza de bugs visuales (vegetación, paisaje, gente y animales). Detalle en `CAMBIOS_3_5_0.md`.
- **3.4.0 (cerrada y verificada):** "tal cual HushWood, con la Patagonia de verdad".
  Gate 124/124, las 42 partidas reales en verde. Detalle en `CAMBIOS_3_4_0.md`:
  luz dorada y paleta sin lima, bruma con techo; copas de cartas de hojas pintadas (atlas por
  código) con ramas, troncos con vetas, cada especie real (arrayán canela con manchones,
  coihue en capas, pehuén en pisos, lenga, ñire, maitén, ciprés); helechos plumosos, pasto
  denso, flores reales (lupinos, margaritas, amancay); sotobosque en bloques; cordillera en
  cordones con nieve, lago pintado, nubes; gente y animales rehechos (`formas.js` nuevo, ropa
  de la zona, anatomía real).
- **3.3.0:** árboles lejanos pre-dibujados (impostores), bosque en bloques, luces fijas,
  modo fluido. **3.2.0:** primera vuelta HushWood + ritmo Auto + F3. Resto en `CAMBIOS_*.md`.

### Lo que quiere el usuario (dirección)
- **Gráficos "tal cual" HushWood** (OoyGames, Steam 4842880). Miradas sus capturas: NO es
  low-poly facetado; es pintado con pincelada amplia, corteza rojiza con vetas, coníferas de
  racimos colgantes, pasto denso, matas de flores, rocas grandes redondeadas, bruma fuerte,
  luz suave y cálida.
- **Lo real se respeta**: cada especie patagónica (arrayán, coihue, pehuén…), la gente
  (ropa de la zona) y los animales (pudú, huemul, caballo criollo…) como son en la realidad,
  con el acabado de HushWood.
- **Fluidez** en su PC: Ryzen 5 4600G con Radeon integrada, monitor a 120 Hz. Optimizar sin
  perder nada del juego. **Todavía nunca se midió en su PC** (pedirle que mire F3).
- **Inglés al final**: no traducir lo nuevo; las pruebas de idioma existentes siguen verdes.
- Le gusta ir **rápido con 2 o 3 subagentes en paralelo**, que le muestren **capturas** de
  cómo va quedando y el **porcentaje de avance honesto** (pregunta "¿por dónde vas?" seguido).
- Ideas **rechazadas** (no proponer): vida tranquila/conservas/huellas, trineo, globo,
  trincheras, zorra blindada, arenas, modo pueblo, represa, puerto, sabotaje, expediciones,
  invasores que roban. (La «economía del pueblo» estuvo aquí, pero el usuario la pidió después y se hizo en la 3.8.8.)

---

## 3. Para Claude: qué sigue (después de la 3.6.0)

La 3.6.0 se cerró el 03-10 en la PC de escritorio con 9 ramas en worktrees (núcleo,
arquitectura, gente, vecindad, vida, mundo, detalles, mecánicas, optimizar). Módulos nuevos:
`aldea.js` (plano, reglas, horarios, guardado, puro), `aldea-arquitectura.js` (edificios,
etapas de obra, shader de superficies `aSuperficie`), `aldea-mundo.js` (terreno emparejado
después de la vegetación, Worker, manzanas, luces), `aldea-gente.js`, `aldea-mecanicas*.js`,
`aldea-lecturas.js`, `vecindad.js`/`vecindad-voces.js`/`vecindad-juego.js`.

Pendiente o para ofrecerle al usuario:
- **Que la juegue y opine**: el tamaño de las piedras del ripio y el brillo de los charcos, la
  cantidad de gente, el ritmo de llegada de los pobladores (11 en ~64 días de juego).
- **Medir en su PC** (nunca se hizo): F3 en la plaza de la aldea, en el refugio y en el bosque.
- Detalles chicos anotados: las redes de la pescadería sin animación; los chicos sentados en
  los almohadones de la biblioteca quedan un poco altos; la invitación a tomar algo se pierde si
  se recarga a la mitad; la primera carga sin cachés tarda 0,8–0,9 s más (programas de la aldea).
- Lo de la 3.5.4 que sigue: probar con el teclado de verdad Alt+Espacio, F10 y una suspensión;
  el soak largo en la PC de escritorio.
- **Inglés**: todo lo nuevo de la 3.6 está sólo en castellano (se traduce al final).

Ojo con las pruebas: las ventanas ocultas de las pruebas **corren requestAnimationFrame a ~1
cuadro por segundo**. Lo que depende del tiempo de juego necesita esperas o reintentos (ver
`hablarCon` en `humo-3-6-aldea.cjs` y el pudú de `humo-relax-2.cjs`). La suite completa
(`bash herramientas/suite.sh . <salida>`) tarda más de 30 min: correrla en tandas.

## 4. Para Claude: cómo se trabaja

### 4.1 Construir y probar
- `node armar.mjs` arma `index.html` (un solo archivo). Correrlo antes de cualquier prueba.
- `npm run verify` es el gate (205 pasos en la 3.9.1, sólo Node).
- Partidas reales: `pruebas/humo-*.cjs` (80, con Electron; los guiones de Playwright viven en `herramientas/`). **Comparten el perfil de Electron: nunca dos a
  la vez.** Para capturas propias usar perfil propio (`app.setPath('userData', …)`).
- **Nunca** matar electron por nombre si hay otras pruebas o capturas corriendo; matar por PID
  o por línea de comandos.
- `window.__hojarasca` en `?debug=1`. `__bucle()` corre un cuadro (con `limiteFps='libre'`).
  `H.desafio.actualizar(0.05,{noche:1,dtReal:0.05})` simula el Desafío.

### 4.2 Reglas del código (cuestan caro si se olvidan)
- `armar.mjs` sólo entiende imports en una línea `import { x } from './y.js';` (no
  `import './x.js'` suelto, no `export ... from`, no `export async function`, no
  `export function*`).
- Módulos de reglas puros en `x.js`; lo visual en `x-mundo.js`.
- Identificadores exportados **sin ñ**; buscar por nombre con `Object.hasOwn`.
- Geometría de obras: material **tipo 0 o 4** (hay prueba).
- El three local **no trae** ShapeGeometry, Shape, OctahedronGeometry, Vector4 ni Frustum.
- El terreno tiene **huella fija** (`pruebas/verificar-2-2.mjs`): no cambiar geometría ni alturas.
- No mover árboles ni cambiar cuántos hay (`pruebas/verificar-3-3-bosque.mjs`).
- Invasores reciclados: todo campo nuevo por invasor se limpia en `bajarAlien`.
- La tecla **E** y el **aviso** comparten prioridad (comentario en main.js).
- Muchas pruebas verifican **texto exacto**: buscar en `pruebas/` antes de cambiar una línea;
  si una prueba describe algo cambiado a propósito, actualizarla lo mínimo y decirlo.
- Fines de línea **LF**; comentarios en castellano con la versión adelante (`3.5:`).
- Subir versión: sólo `package.json` y la raíz de `package-lock.json`
  (`"name": "hojarasca",\s*"version"`). **Nunca tocar package.json desde PowerShell** (usar node).
- robocopy: excluir sólo `<carpeta>\dist` (`/XD dist` sin ruta borra `node_modules\electron\dist`).
- Sin compilaciones de shaders a mitad de juego; no sumar dibujos por cuadro sin medir.

### 4.3 Herramientas (`herramientas-34\` en la PC sin Git Bash; en la otra PC hay Git Bash y se usan los `.sh` de `herramientas/`)
- `verify-todo.cjs <proy>`: corre cada paso del gate y junta las fallas.
- `<proy>\herramientas\suite.ps1 . <salida> [lista]`: todas las partidas reales, una por vez
  (PowerShell; en Git Bash está `suite.sh`). `empaquetar.ps1 <proy> <ver> <LEEME>`: instalador,
  portable, depot, código y `Hojarasca-<ver>-completo.zip` en Descargas (verifica el ASAR).
  Los `.ps1` necesitan **UTF-8 con BOM**.
- `bosque-medir\vistas-bosque.cjs . <salida> <calidad>`: capturas sin carteles con perfil
  propio, **fuerza la vegetación cercana** (la ventana oculta dibuja lento y si no, faltan
  árboles) y mide dibujos/triángulos/ms. Vistas con la variable `VISTAS` (JSON **hecho con
  node**: `ConvertTo-Json` de PowerShell aplana los arreglos y cuelga el script). Listas:
  `lejos-vistas.json`, `bosque-medir\vistas-*.json`.
- `gente-medir\vistas-gente.cjs`: primeros planos de cada vecino y animal (`SOLO=a,b`).
- `bugs-recorrido\recorrido.cjs`: camina de verdad con reloj virtual y dt fijo, detecta lo que
  aparece/desaparece en la vista y junta la consola.
- `subir-version.cjs`, `diferencias.cjs <base> <otra>` (qué archivos cambiaron),
  `estado-340.cjs` (ejemplo de cómo tocar RELEASE_STATUS con node).
- En PowerShell, `node -e "..."` rompe las comillas: escribir scripts en archivos.

### 4.4 Cómo se trabajó la 3.4 (funcionó bien)
- Un subagente por área, cada uno en **su copia** `src\trabajo-<x>` con unión a node_modules
  (`mklink /J`), archivos sin pisarse; juntar copiando sólo los archivos de cada dueño y correr
  el gate con todo junto. Pasarles capturas de HushWood descritas y las reglas de arriba.
- Mirar las capturas a tamaño completo antes de dar algo por bueno; mandarle al usuario
  antes/después con lo que todavía está mal dicho de frente.
- Una prueba que falla una vez y pasa sola dos veces es de tiempo, no un bug; decirlo igual.

---

## 5. Seguridad (pasó hoy)
AnyDesk de esta PC recibió un pedido de conexión (rechazado) desde la red local (192.168.1.21,
ID 576041582). El usuario lo resolvió. Nunca abrir ni configurar AnyDesk ni nada de acceso
remoto.

## 6. Espacio en común entre las dos PC
Elegido por el usuario: **repositorio privado en GitHub** (ver punto 1 y 2). Historial: `v3.4.0` y `v3.5.0` (cerradas). Para trabajar en paralelo con subagentes conviene
`git worktree add -b <rama> ../trabajo/<x> main` + unión a node_modules, y al final `git merge`.
