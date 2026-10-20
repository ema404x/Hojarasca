# 4.4.2 · Arreglo de bugs de la ronda de revisión de la 4.4.1 · frente CONSTRUCCIÓN 4.2 y teclas con Mayús

Rama `v442-construccion` (sale de `v44-integra` = 4.4.1). No sube la versión. Informes de los revisores: `trabajo\bugs44\zona-C.md` y `zona-D.md`.

## Las teclas nuevas (y por qué)

Mayús es **correr**. Tres atajos de `main.js` la usaban y por eso, corriendo y tocando E junto a un depósito, la segunda E **pagaba una ampliación** (hasta $11.000 y materiales), junto al local abría el panel en vez de atender, y Mayús + Supr desmontaba la pieza más cercana sin preguntar. Todas las letras del teclado ya tienen un uso, así que se eligió, según la acción:

| Antes | Ahora | Por qué |
|---|---|---|
| **Mayús + E** junto a un depósito: ampliarlo | **Mantener E** ~0,7 s junto al depósito. La primera vez muestra qué sube y cuánto cuesta; **volver a mantener E** (entre 0,6 y 12 s después, sobre el mismo depósito) lo paga | Mantener es deliberado: tocar E o correr no lo dispara. No usa tecla nueva (no queda ninguna libre) y no depende del teclado |
| **Mayús + E** junto a tu local: panel de estantes y precios (aunque haya un cliente) | **Mantener E** junto al local | Lo mismo: E tocada sigue siendo atender o abrir el panel |
| **Mayús + Supr**: desmontar la pieza más cercana | **Supr** con los planos abiertos, **sin marca para retirar cerca**: el primer Supr avisa «Desmontar X: recuperás … y $… (la mitad de lo que costó). Supr otra vez para confirmar» y el segundo (≥ 0,6 s y ≤ 12 s después, sobre la misma pieza) desmonta | Con marca cerca Supr sigue retirándola. Sin Mayús y con el aviso del reintegro por delante, no se desmonta nada por accidente |
| **Mayús + Y**: mover una pieza | **M** con los planos abiertos (M de «mover»; con los planos cerrados sigue siendo el mapa) | Mover es gratis, no necesita confirmación; Y vuelve a ser sólo construir/confirmar |
| (nuevo, C7) | **Supr** fuera de los planos, junto a un depósito: saca todo lo guardado | Con cualquier material a mano que el depósito guarda, E **guarda**: no había forma de sacar sin vaciar la mochila de todo |

Textos actualizados: avisos y notas de la E (`almacen-juego.js`, `almacen.js`, `planos-almacen.js`, `negocio-propio-juego.js`, `negocio-propio.js`), guía F1 (`guia.js`), pie de los planos y lista de **Controles** (con la tecla mantenida, M y Supr) en `plantilla.html`, `README.md`, `PRECIOS_CONSTRUCCION.md`, `STEAM_RELEASE_CHECKLIST.md`. El mando (que no se amplía) sigue andando: X mueve con M; R2 hace lo de Supr (retirar marca o, sin marca, el desmontaje en dos pasos); L2 + R3 pasó a ser lo mismo que R2.

## Hallazgos

| Id | Estado | Qué se hizo |
|---|---|---|
| C1 / D1 / D5 | arreglado | Lo de arriba. Mantener E no hace nada con un panel abierto (la E lo cierra y soltar no lo reabre), ni durmiendo, ni en el modo foto, ni en el tren, el kayak o a caballo |
| C2 | arreglado | `cubreArea: true` en las 8 construcciones de oficio, los 2 locales (en `lleno()` de `planos-oficios.js` / `planos-negocio.js`), depósito de piedra techado, barraca, cobertizo de heno y establo. El silo (cónico, sin interior), la pila y el herramientero siguen sin cubrir |
| C3 | arreglado | El desalojo al cargar (no hay lugar para la obra) devuelve los **pesos pagados** (etapas hechas y pagadas, enteros) y las **ampliaciones** (pesos y materiales, enteros); la nota del valle lo cuenta («te devolvimos $…»). `almacenJuego.devolucionTotal` |
| C4 | arreglado | Los pedreros y troncos caídos que picás se guardan en `progreso.picados` (posiciones planas, 1 decimal, tope 1.500, sin repetir) y al cargar se vuelven a sacar con la misma `veg.despejar` con la que se sacaron. Partidas viejas (sin el campo): lista vacía, nada cambia. No rebrotan (una roca no crece) |
| C5 | arreglado | La gramola descarta las notas atrasadas más de 0,25 s (tras un tirón largo ya no suenan todas juntas). Una sola global: E en la segunda la pasa a ella y avisa «la otra gramola se quedó callada»; el aviso de la E de cada gramola sabe cuál es la que suena (`gramolaSuenaEn(obra)`) |
| C6 | arreglado | El herrero ofrece el pico **después** de la tijera y del afilado: con el afilado pendiente, éste va primero (avisa «hablame de nuevo» por el pico) y el pico se ofrece cuando el afilado ya está hecho hoy o vigente |
| C7 | arreglado | Supr junto al depósito saca todo (ver arriba); el aviso del depósito lleno lo dice |
| C8 | arreglado | El de Mobiliario pasó a «Banco de taller» (`banco-carpintero`); «Banco de carpintero» (Trabajo, el que aserra) queda con su nombre |
| C9 | arreglado | `ocupaSuelo: true` en lo grande de la 4.2 (oficios, locales, los 5 depósitos, establo, cobertizo, corral grande, fuente, estatua): `revisarSitio` rechaza «Se superpone con otra pieza» si dos se solapan, incluso si la chica quedaba «arriba» del piso de la grande (un depósito entraba sobre el piso de la barraca). Muebles y lo de adentro de una casa, igual que antes |
| C10 | arreglado | Con hacha y sin pico, una roca que no se puede picar ya no tapa al árbol: H elige el árbol; sin árbol sigue diciendo «Te falta el pico» |
| D2 | arreglado (conservador) | El tope del acopio (40) sigue valiendo en el Desafío (no se cambia el equilibrio); el aviso del acopio lleno **no manda a un depósito** que ahí no existe: dice que lo que sobra se queda en la mochila |
| D9 (pruebas frágiles) | endurecido | Márgenes de los tiempos: `verificar-4-4-empleados` 500 → 5000 ms, `verificar-3-5-4-caos` 1000 → 10000 ms, `verificar-3-6-2-visual` 0,1 → 0,3 ms por cuadro y 3 → 10 ms al rehacer (siguen midiendo 10× menos). No hay versiones fijas dentro de las pruebas (se revisó) |
| Laderas | **sólo analizado, no tocado** | Ver abajo |

### Laderas (no se tocó)
El piso de las ampliaciones y casas grandes se apoya a **una sola altura** (`baseColocacion`: el terreno en el centro) y es plano. En una pendiente de 0,2 el borde alto queda hasta ~0,9 m bajo el terreno y el bajo ~1,9 m sobre él en una casa de 9 m de lado (medido por el revisor con la plataforma de colisión; la malla no se midió). No hay arreglo barato y seguro: bajar `pendienteMax` / `desnivelMax` impide construir en lugares hoy válidos, y un zócalo es geometría nueva por pieza. Queda anotado para una pasada de aspecto (capturas en cuesta).

## Archivos tocados
Compartidos: **`src/main.js`**, **`src/construccion.js`**, **`src/guardado.js`**, **`package.json`**. Con riesgo de choque con los otros frentes: `src/negocio-propio-juego.js` y `src/negocio-propio.js` (sólo los 5 textos que decían «Mayús + E»), `src/aldea.js` (el herrero), `src/plantilla.html`, `src/guia.js`.
Además: `almacen-juego.js`, `almacen.js`, `aldea-desalojo.js`, `bosque.js`, `gramola.js`, `obra-pesos.js`, `planos-almacen.js`, `planos-exteriores.js`, `planos-lujo.js`, `planos-lujo-2.js`, `planos-muebles-2.js`, `planos-negocio.js`, `planos-oficios.js`.

## Pruebas
- `pruebas/verificar-4-4-2-construccion.mjs` (en el gate): 185 comprobaciones, un grupo por hallazgo; **sin los arreglos fallan 94**.
- Ajustadas al diseño nuevo (texto o comportamiento): `verificar-4-2-almacen`, `4-2-lujo`, `4-2-pesos`, `4-2-pico`, `4-3-negocio`, `4-4-1-gastos`, `construccion-senior-rc7`, `saneo-1-6-1`.
- `pruebas/humo-4-4-2-construccion.cjs` (Electron, oculto; fuera del gate): correr + E no cobra; E mantenida muestra el precio y a la segunda amplía; Supr saca todo; desmontar en dos pasos con el reintegro exacto; M mueve; el panel del local con E mantenida; lluvia dentro de la herrería, la barraca y el cobertizo; picar dos rocas, guardar, **recargar la página** y siguen picadas. Se corre por tramos con `HUMO_SOLO=deposito|mover|local|lluvia|picar` (el juego se pausa si otra ventana le saca el foco y otro proceso puede cerrar el Electron: el tramo se repite). Las capturas necesitan que la ventana exista para el compositor: se muestra invisible (opacidad 0, fuera de las pantallas, sin foco).
- Capturas (tamaño completo): `C:\Users\Andres\Documents\Hojarasca\salida-cantina\bugs442-construccion\`.

## Lo que NO quedó
- Los `humo-*.cjs` viejos que usan `shiftKey` (`humo-4-2-almacen`, `4-2-ampliar`, `4-2-lujo`, `4-2-pesos`, `3-8-7-obras`, y los de negocio/gastos/empleados, de otros frentes) siguen con las teclas de antes: son manuales (no están en el gate) y fallarán donde pulsen Mayús + E/Supr/Y.
- Las laderas (arriba).
- Atenuación de la gramola por distancia o paredes (pregunta de diseño de C5, sin decidir).
- «¿6 golpes de pico en el Desafío?» (pregunta de diseño 3 del informe C): sin tocar.
