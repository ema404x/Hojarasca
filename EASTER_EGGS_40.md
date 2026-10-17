# Easter eggs 4.2 (rama `easter-eggs-40`)

Seis cosas chicas para descubrir, **sólo en castellano** (el inglés se hace al final), **sólo en el Relax** (el Desafío no las tiene: ni el campo guardado ni la lógica), sin costo de fps medible (todo por evento; lo único por cuadro es el huemul mientras está afuera).

Lo que se guarda vive en un solo campo, `progreso.huevos`, saneado en `src/huevos.js` (`sanearHuevos`, lo llama `guardado.js`). Una partida vieja sin el campo carga bien y arranca en cero. Reglas puras en `src/huevos.js`; mallas en `src/huevos-mundo.js`; enganche con el juego en `src/huevos-juego.js` (y `huevos-portada.js`, `radio-madrugada.js`). Pruebas: `pruebas/verificar-huevos.mjs` (enganchada al `verify`) y `pruebas/humo-huevos.cjs` (Electron).

## 1. Estrella fugaz con deseo
- **Cómo se descubre:** de noche, mirando el cielo (con las fugaces que ya había) una de cada tanto trae un cartelito: «Una estrella fugaz. Podés pedir un deseo» con tres opciones (teclas **1**, **2**, **3**, o clic; Esc o 14 s lo cierran).
- **Condiciones:** 20 % de las fugaces que de verdad viste (a cielo abierto, mirando para ese lado); una vez por noche; al menos 6 noches entre una y otra; sin otro deseo esperando. Sorteo determinista (`azarDe`).
- **Qué pasa:** a los 2 a 4 días, de 7 a 19 h: «Que no falte leña» → 3 troncos; «Que la tierra dé» → 4 calafates; «Buena compañía» → un vecino del valle (Ramón, Nicanor, Ema o el guarda) pasa a tomar mate (+1 punto de amistad). Nota en pantalla y en el diario.
- **Se guarda:** `estrella: { ultimaNoche, deseo: { id, pedido, cumple }, cumplidos }`.

## 2. Los duendes del Coihue
- **Cómo se descubre:** en el Relax no está el Coihue Viejo (es del Desafío), así que se usa **el coihue más grande a una caminata del refugio** (35 a 150 m; en este valle: cerca de x −93, z 85). Tiene una **rueda de nueve hongos** al pie. Con yerba en la mochila, al lado del árbol, aparece «Dejar un poco de yerba al pie del coihue» (E).
- **Condiciones:** un convite por vez y al menos 7 días entre convites. A la mañana siguiente (6 a 21 h) la pilita se vuelve un bulto atado con hilo rojo: E lo levanta.
- **Qué pasa:** siempre una nota del duende (6 notas, castellano) y, en el 45 % de los casos, un regalito chico (2 a 3 de calafates, frutillas, piedras o troncos).
- **Se guarda:** `duendes: { ofrenda, ultima, recibidos }`.

## 3. Corazón en los tulipanes del molino
- **Cómo se descubre:** mirando el campo del molino desde arriba (el techo del molino, la loma, una altura cercana): las seis franjas son las seis filas de un corazón blanco de siete columnas (la punta mira al sendero y los dos lóbulos al arroyo).
- **Qué cambia:** **sólo el color** de algunas plantas (`DIBUJO_CAMPO` en `molino-paisaje-plano.js`): los mismos 1926 tulipanes en el mismo lugar y las mismas cinco mallas. El 4 % de cada parche conserva el color de la franja y el borde se mezcla (a 30 cm del límite ya no hay raya). Hoy el 62 % del campo es blanco.
- **Límite honesto:** con seis franjas finas y plantas sueltas el dibujo se lee como «corazón blanco entre franjas de colores», no como un trazo fino; de cerca parece un campo mezclado. Costo: el rosa casi desaparece (su franja queda adentro del corazón). No se guarda nada.

## 4. Huemul blanco
- **Cómo se descubre:** al amanecer (5:30 a 8:48) con niebla de valle (la opacidad de `niebla.js` ≥ 0,2, o sea una mañana calma y húmeda), muy de vez en cuando hay un huemul de pelaje claro parado en el **mallín** (lugar fijo: el primer claro de tierra firme junto al mallín, de cara al agua).
- **Condiciones:** 7 % por mañana con niebla (sorteo fijo por día) y al menos 5 días entre apariciones. No es de la fauna del juego: no se caza, no se lastima, no lo rastrea el perro. Si te acercás a menos de 24 m se va caminando (después al trote, 46 m) y se pierde en la niebla; al terminar la mañana se va solo.
- **Cuaderno:** mirarlo (a menos de 80 m, de frente) anota **«Un huemul blanco» — avistaje raro** (sección Fauna; la pista es vaga: «Hay que tener suerte…»). Suma una entrada al total del cuaderno.
- **Se guarda:** `huemul: { ultimo, ido, avistajes }` (si recargás esa mañana no vuelve a aparecer después de irse).

## 5. El hueso del perro
- **Cómo se descubre:** un día sorteado (16 % de los días, de 6:30 a 19 h, al menos 6 días entre uno y otro) aparece un **montículo de tierra** con un claro de pasto pelado a 24 a 80 m del refugio (lugar determinista por día, parejo y sin árboles encima). Si te acercás a 14 m, el perro ladra una vez.
- **Qué pasa:** E junto al montículo («Excavar el montículo de tierra»): 40 % una moneda vieja (te la cambian por $120), 40 % una de cobre ($90), 20 % una cuenta de vidrio (sin pesos). El perro ladra y mueve la cola (nota con su nombre); el montículo desaparece y el pasto vuelve.
- **Se guarda:** `hueso: { dia, ultimo, cavados }` (un hueso por vez).

## 6. Código en la portada y radio de madrugada
- **(a) Portada:** ↑ ↑ ↓ ↓ ← → ← → B A (no cuenta si escribís en un campo de texto): caen 44 hojas de colores por 10 s (una capa con animación de CSS; con «reducir movimiento», 14 hojas que sólo se apagan). Suenan tres notas suaves (cuerda pulsada) **sólo si el audio ya estaba andando** (en la portada no se arranca). No se guarda nada.
- **(b) Radio:** entre las 2 y las 4 de la mañana, en el 40 % de las noches (fijas por noche), al usar la radio (o la estación meteorológica) en vez de «sólo estática» hay una emisora que de día no está: un **tango viejo** (frase propia de cuatro compases, la menor, 66 por minuto; bajo marcado, acordes a contratiempo, melodía en lengüeta; se pierde antes del final) o un **mensaje en Morse** (6 mensajes cortos: «HOLA VALLE», «NO ESTAS SOLO»…, se muestra lo que «anotás»). Una vez por noche. Todo sintetizado con `sonido-sintesis.js` (cuerda pulsada, filtros, azar repetible) y pasado por una «radio vieja» (pasabanda, saturación, soplido, chasquidos, silbido de sintonía): nada grabado.
- **Límite:** la radio del juego no tiene dial, así que «una frecuencia especial» es una condición de hora y noche, no una perilla. El audio no se pudo escuchar en esta sesión: está probado en niveles, duración y estructura, **hay que escucharlo**.
- **Se guarda:** `radio: { ultima, oidos }`.
