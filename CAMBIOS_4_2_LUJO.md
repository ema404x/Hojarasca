# 4.2 · Muebles y decoración de lujo

Dieciséis piezas nuevas de mobiliario, decoración y patio, con costo en pesos además de materiales (la escala y la receta están en `PRECIOS_CONSTRUCCION.md`), más una gramola que toca música suave sintetizada al apretar E. Todo sólo en el Relax. Se suman a las cinco de `src/planos-lujo.js` (vitrina de roble, reloj de pie, alfombra tejida grande, araña de velas y fuente de piedra), que no se tocaron.

## Las piezas

| Pieza | Dónde | Materiales | Pesos | Qué es / qué hace |
|---|---|---|---|---|
| Aplique de bronce con velas | Mobiliario | 1 tabla, 2 piedras | **$900** | De pared, tres velas de adorno. No choca. |
| Jarrón con flores | Mobiliario | 3 piedras, 1 tabla | **$1.000** | Loza blanca con cinta azul y un ramo de siete flores. |
| Retrato al óleo | Mobiliario | 4 tablas | **$1.200** | De pared. Un señor de levita, marco dorado y plaquita de bronce. |
| Paisaje del valle | Mobiliario | 5 tablas | **$1.800** | De pared. Lago, montañas con nieve, casita y pinos. |
| Candelabro de pie | Mobiliario | 2 tablas, 4 piedras, 1 tronco | **$2.200** | Hierro forjado, cinco velas de adorno. |
| Farol de hierro forjado | Exterior | 4 piedras, 2 tablas, 1 tronco | **$2.600** | Poste con base de piedra y farol de cuatro vidrios (de adorno: sin luz propia). |
| Biombo tallado | Mobiliario | 10 tablas, 2 vellones | **$2.800** | Tres hojas en zigzag, rejilla arriba y lana bordada abajo. Choca (se rodea). |
| Sillón de cuero | Mobiliario | 8 tablas, 3 vellones | **$3.000** | Sillón de club con tachuelas de bronce. Confort 4. |
| Estantería de roble con libros | Mobiliario | 16 tablas, 2 troncos | **$4.200** | Armario abajo, tres estantes de libros, globo terráqueo, candelero. |
| Armario tallado de roble | Mobiliario | 16 tablas, 3 troncos | **$5.500** | Columnas, medallones, cajones, cornisa con frontón. |
| Gramola de roble | Mobiliario | 12 tablas, 4 piedras, 1 tronco | **$6.000** | **Con E suena un tema** (ver abajo). |
| Mesa de banquete | Mobiliario | 22 tablas, 3 troncos | **$7.000** | Seis lugares puestos (4 sillas y 2 sillones de cabecera), camino de mesa, candeleros. |
| Cama con dosel | Mobiliario | 18 tablas, 4 troncos, 6 vellones | **$8.500** | **Se duerme** (`funciones: ['dormir']`, confort 5, igual que la cama doble). |
| Pérgola con enredadera | Exterior | 10 troncos, 8 tablas, 4 piedras | **$9.000** | Postes sobre piedra, vigas, listones, hojas y glicinas. |
| Estatua del baqueano | Exterior | 30 piedras | **$11.000** | Figura con poncho y sombrero sobre pedestal con placa. **Piedra: le da uso al pico.** |
| Chimenea de salón | Mobiliario | 30 piedras, 4 tablas | **$12.000** | Piedra tallada con repisa de roble y cuadro. El fuego es pintado: **no calienta** (para eso está el hogar con repisa). |

De $900 a $12.000: hay para ahorrar un día y para ahorrar tres semanas. Nada pasa de la fuente de piedra ($14.000) y todo está dentro de la escala (mueble bueno $800–3.000, lujo $4.000–20.000, pesos de 1 a 4 veces los materiales). Ninguna repite una pieza que ya existía: el sillón, la mesa larga, el librero, el ropero, la vitrina, el hogar con repisa, las cortinas y los cuadros comunes siguen como estaban; éstas son las versiones finas, con otro nombre y otra silueta.

## La gramola (`src/gramola.js`)

- Tres temas propios (un vals, una polca y una habanera, todos en re) escritos como notas y **sintetizados en el momento**: osciladores triángulo + octava, filtro grave de caja vieja y un crujido de púa muy bajito. Nada de audios, nada de descargas.
- E la pone (aviso «Darle cuerda a la gramola»), E otra vez la para («Parar la gramola»), y la próxima vez toca el tema que sigue. Se calla sola si te alejás a más de 18 m o si la desmontás.
- Mientras suena baja un poco la música de fondo (usa `sonido.bajaMusica`, como el piano) y la devuelve al parar. Sale por el bus de efectos.
- Costo: nada si no suena. Si suena, un temporizador cada 0,5 s programa 1,5 s de notas por adelantado (decenas de osciladores a lo sumo, no el tema entero) y lo apaga al terminar. No toca el bucle de cuadros.
- No se guarda nada nuevo: no hay campos nuevos en la partida.

## Decisiones mías (cambian fácil)

- **Dieciséis** (el pedido decía 14 a 16). Sin categorías nuevas: Mobiliario y Exterior.
- Los precios salen de la receta (1 a 4 veces los materiales). El **sillón de cuero** está en el techo del «mueble bueno» ($3.000) y la **chimenea** ($12.000) casi iguala a la estatua; la fuente de piedra ($14.000) sigue siendo lo más caro.
- **Cama con dosel: confort 5**, igual a la cama doble, a propósito: el confort de la casa suma y el equilibrio de descanso (`abrigo.js`: desde 6 amanecés descansado) está calibrado. Si querés que el dosel valga más, es un número.
- **Chimenea y farol son de adorno** (sin luz ni calor): la regla era nada de luces dinámicas nuevas. El texto de cada plano lo dice.
- **Cuadros pintados con cajas de color** (franjas, pirámides aplastadas), sin texturas: el sistema de geometría sólo admite color por vértice.
- Los materiales son los cuatro del juego; el «hierro», el «bronce» y el «cuero» se pagan con tablas, piedras y lana (no hay otros materiales).
- La gramola usa su propio módulo y sus propios temas en vez de agregar discos al tocadiscos del refugio (`personal-musica.js`), para no tocar «Tu música» ni el guardado.

## Archivos

Nuevos: `src/planos-lujo-2.js`, `src/gramola.js`, `pruebas/verificar-4-2-lujo.mjs`, `pruebas/humo-4-2-lujo.cjs`, este archivo.

**Compartidos (los que otros agentes también tocan):**
- `src/construccion.js`: un import de `planos-lujo-2.js` y `PIEZAS.push(...PIEZAS_LUJO_2);` justo debajo del de `PIEZAS_LUJO`.
- `src/main.js` (cuatro lugares chicos): los dos imports (`planos-lujo-2.js` y `gramola.js`) debajo del de `planos-lujo.js`; `OBRAS_QUE_TRABAJAN.push(...Object.keys(LUJO2_QUE_SE_USA))`; el aviso de la gramola en `avisoObra24`; y `case 'gramola'` en `usarObra24`.
- `package.json`: sólo el gate (`sumar-prueba.cjs`) con `verificar-4-2-lujo.mjs`.
- No se tocó `guardado.js`, `sonido.js`, `personal-musica.js` ni `PRECIOS_CONSTRUCCION.md`.

## Verificación

**Verificado:**
- `pruebas/verificar-4-2-lujo.mjs` (524 verificaciones, en el gate): las 16 piezas están, ids y nombres sin repetir, categorías que ya existían, materiales que existen; precio dentro de la escala, redondo, de 1 a 4 veces los materiales y con variedad (de $900 a $12.000); geometría sin números rotos, sólo tipo 0 y 4, dentro de su ancho/alto/fondo, sin hundirse y con tope de 1.000 triángulos (van de 368 a 904); física (lo colgado no choca, lo demás sí y el choque cabe); la cama se duerme; la gramola se usa con E; las de piedra piden piedra; cobro, falta de plata y reintegro del 50 %; el Desafío y la partida sin economía no cobran; `pagadas` sobrevive al guardado; los tres temas encajan en sus compases y sus eventos son sanos; el motor de la gramola con un audio de mentira (arranca, programa sólo lo próximo, E la para, rota los temas, se calla sola si te alejás o la desmontan); `main.js` y `construccion.js` las usan; imports en una línea, sin `export { }`, sin audios, sin inglés.
- **En el juego real** (`pruebas/humo-4-2-lujo.cjs`, Electron en el monitor externo, con las teclas de verdad): las 16 se construyen con Y, cobran su precio exacto, la lista del menú muestra el precio de cada una, y sin errores en la consola; E en la gramola da cuerda («Vals de la gramola»), el aviso cambia a «Parar la gramola», E la para, la siguiente toca la «Polca del domingo», y Mayús + Supr la desmonta y el aviso desaparece.
- `npm run verify` completo, una vez al final: **247 pasos OK** (incluye `verificar-4-2-lujo.mjs`; `verificar-4-2-pesos.mjs` y las demás pasan sin cambios).
- Capturas a tamaño completo (1366×768) en `C:\Users\Andres\Documents\Hojarasca\salida-cantina\lujo\`: `01` a `16` una por pieza, `17` la gramola con E, y cuatro escenas juntas sobre pisos modulares para ver cómo combinan entre sí y con las cinco de ejemplo: `18` la sala (chimenea, sillón de cuero y sillón de lana, alfombra, candelabros, estantería, jarrón, gramola y la araña), `19` la chimenea de cerca, `20` y `21` el dormitorio (cama con dosel, armario, biombo, retrato), `22` el comedor (mesa de banquete con el paisaje del valle) y `23` y `24` el patio (pérgola, fuente, estatua, faroles).

**Mirando las capturas corregí:** el armario y el sillón de cuero se veían casi negros (colores más claros), la boca del cuerno de la gramola era un círculo negro (ahora de bronce oscuro y más chica), el farol era chico y apenas se veía el vidrio (más grande), las hojas de la pérgola eran rectángulos planos (ahora bolas de hojas), y el aplique y el candelabro de pared quedaban a otra altura que los cuadros.

**Razonado, no probado:**
- Cómo suenan los tres temas: sólo verifiqué que los eventos son sanos y que el motor programa y apaga bien, **no los escuché**. El oído es del usuario: si algo suena feo, está todo en `TEMAS` de `src/gramola.js` (notas como texto) y en los números de `sonarNota`.
- Que bajar la música de fondo con `bajaMusica` no pelee con el piano: los dos tocan esa misma ganancia (el piano la baja en sus propios tiempos); no pasó nada en la prueba, pero no la forcé con los dos a la vez.
- Dormir en la cama con dosel (funciona igual que la cama doble: `funciones: ['dormir']`); no la probé durmiendo de noche.

**No verificado:** fps en la 4600G (las piezas son geometría estática de hasta ~900 triángulos y la gramola no hace nada por cuadro), y el confort total de una casa amoblada con todo esto (suma: se pasa con facilidad de 8; no revisé el equilibrio del descanso).

## Lo que quedó flojo o no se hizo

- **La pérgola es la más floja**: el follaje son bolas facetadas y la enredadera de los postes es un zigzag oscuro; de lejos se lee bien, de cerca es tosca. El jarrón y el aplique son simples.
- **El pasto alto tapa lo bajo**: sobre el campo abierto, la cama, la mesa de banquete y el sillón se ven a medias (por eso las capturas de escena sobre piso modular). Es del juego, no de las piezas: se usan sobre piso, como las demás.
- **El marco con una foto del álbum no se hizo**: las piezas son geometría de color por vértice, sin texturas; poner una foto del álbum pediría un mesh con textura por pieza (costo por obra y cambio del sistema de obras). Los cuadros están «pintados por código» con cajas de color.
- No hay cortinas, ropero ni escritorio nuevos: ya estaban en 3.8.8 (cortinas, ropero, escritorio) y no los dupliqué; la «cama con dosel», el «armario tallado» y la «estantería de roble» son las versiones de lujo.
- La gramola no se guarda (no recuerda qué tema iba) y se calla sola al cargar una partida: a propósito, para no tocar el guardado.
- El pedido hablaba de «candelabros de pie y de pared», «estatuas» y «farol de hierro forjado»: están (candelabro de pie, aplique de pared, una estatua, farol). Una segunda estatua o un busto en pedestal serían fáciles de sumar con la misma plantilla.
