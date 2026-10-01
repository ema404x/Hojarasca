# Hojarasca

Un bosque andino patagónico para recorrer despacio, en primera persona. Todo se genera por código: el terreno, los árboles, el agua, el cielo, los animales y el sonido. No hay modelos ni audios descargados.



## 2.6.0 — El fortín

Dieciocho cosas para la base del Desafío: pirca con troneras (tus tiros pasan, los de ellos no), puente levadizo, embudo de empalizada, contrafuerte, muro de hielo, tejado de lajas contra los voladores, pasarela colgante, resina hirviendo desde el adarve, catapulta, troncos colgantes, cerco de cristal, rampa de troncos, trampa de lazo, abrojos, señuelo, espejo del faro, puesto de tirador para Ema y armero. Detalles: `CAMBIOS_2_6_0.md`.

## 2.5.0 — El arsenal

Dieciocho cosas nuevas para pelear en el Desafío: ballesta de mano, facón, maza, arpón, hachas y jabalinas que se levantan del suelo, granadas, bombas de humo, bengalas, flechas incendiarias y de cristal con carcaj, el arco que se tensa, escudo de tablas, chaleco con placas de cristal y el cuerno que llama a los compañeros. Detalles: `CAMBIOS_2_5_0.md`.

## 2.4.1 — Caza de bugs

Importar o sincronizar una partida ya no borra las fotos del álbum, una partida con una obra rota ya no deja el juego sin arrancar, y el aviso de abajo dice siempre lo que va a hacer la tecla. Detalles: `CAMBIOS_2_4_1.md`.

## 2.4.0 — Las estructuras

Lo que construís ahora cuenta: la casa cerrada abriga de noche (con la estufa o el hogar prendidos el calor llega a todos los cuartos) y una casa con buen confort te deja descansado; tu chimenea echa humo y tus ventanas se encienden de noche; las paredes, los pisos y los techos se tiñen (T con los planos abiertos: calafate, ocre o cal). Piezas nuevas: la galería (abajo no llueve), la pared con hogar de piedra, el horno de barro (pan y empanadas para la feria), el invernadero (la huerta no se hiela), el embarcadero (el kayak amarrado y la pesca desde la punta), el buzón (las cartas te llegan a casa), el bebedero (con cuatro cercos es un corral y Don Ramón te trae dos ovejas) y, en el Desafío, el adarve. Arreglo: la escalera de la torre de vigía, que no se podía subir. Detalles: `CAMBIOS_2_4_0.md`.

## 2.3.0 — Diez ideas nuevas

Cinco para el Relax: una colmena que hace rendir la huerta y da miel, un ahumadero para las dos truchas por día que ahora te podés quedar, un vivero para criar plantines de las semillas que se juntan en otoño, la leña del invierno (cada fuego pide un tronco seco; la leñera la guarda) y el fogón, donde el vecino que vino de visita se queda y cuenta un cuento, y alguna noche asoma algo en el lago. Cinco para el Desafío: capullos que hay que quemar de día, la trochita varada que hay que escoltar, el volador que apaga las antorchas (y la ballesta al cielo), la zanja de fuego y el código de partida para que las noches salgan siempre iguales. Detalles: `CAMBIOS_2_3_0.md`.

## 2.2.0 — Las dos ramas, juntas

La 1.10/1.11 y la 2.0/2.1, hechas en dos computadoras, en una sola versión, más liviana. Detalles: `CAMBIOS_2_2_0.md`.

## 2.1.0 — Diez mejoras más

Cinco para el Relax: un grabador de cantos (grabás un ave anotada y, al hacerla sonar, la más cercana contesta; algunas se acercan), rastros de huemul, pudú, guanaco, zorro y liebre que se pueden seguir hasta el animal, la lluvia que se ve venir sobre la cordillera y que los vecinos anuncian, el almanaque de lo que llega y lo que se va (con la V de cauquenes en otoño) y las conservas: dulce de frutilla, calafates y llao llao secados en el tendal, que se cambian en el almacén por el grabador y unas botas de goma. Cinco para el Desafío: noches de rescate en lo de un vecino, el excavador que pasa por debajo de la empalizada (y la losa de piedra que lo frena), un jefe distinto cada vez, los restos de nave que se recorren por dentro y la forja de cristal. Detalles: `CAMBIOS_2_1_0.md`.

## 2.0.0 — Veinte mejoras

Diez para el Relax: los animales tímidos se acercan si esperás quieto; agachado se escucha de qué lado canta lo que falta anotar; el perro te guía hasta eso; encargos que sólo se pueden hacer en su estación; una huerta; la escarcha de las mañanas frías; la lluvia que suena distinto en la chapa, las tablas y la lona; adentro suena a adentro; la luna con sus fases (vista desde el sur) y noches de lluvia de estrellas; y el cuaderno guardado como lámina de naturalista. Diez para el Desafío: los ojos que reflejan la linterna, invasores que acechan, el perro que gruñe hacia lo que no ves, el asedio del refugio, la noche en que se apagan las antorchas, los sonidos escritos con su dirección, la mezcla que se agacha cuando algo chilla al lado, el bestiario, cinco noches optativas de mutados después del nido y la vibración del mando. Detalles: `CAMBIOS_2_0_0.md`.

## 1.9.1 — Calidad y optimización

La medición de rendimiento estaba rota: medía desde donde hubiera quedado el jugador al cargar, y dos corridas del mismo código daban 471 y 841 llamadas de dibujo. Ahora la cámara se planta en un punto fijo del valle y dos builds miran exactamente lo mismo. Con eso ya medible: los 3.923 pedazos de vegetación instanciada salieron del repaso de matrices de cada cuadro —no se mueven nunca— y eso bajó el repaso de 1,219 ms a 0,468 ms dibujando lo mismo; y las mallas que no se mueven y comparten material se fusionan al armar el valle, que saca 28 llamadas de dibujo sin perder un triángulo. Detalles: `CAMBIOS_1_9_1.md`.

## 1.9.0 — El sonido y los invasores

Un motor de golpes con las tres capas que tiene un golpe real —el contacto, los modos propios del material y la cola—, con diez materiales cuyas frecuencias no caen en la serie armónica: una piedra suena a piedra y no a campana. Los invasores tienen garganta: subarmónico, modulación en anillo para el grano del gruñido y tres formantes que le dan tamaño al cuerpo, con siete voces por ocho estados. De lejos el aire se come los agudos y el grito llega más tarde. De noche el valle habla solo: el acecho del que está lejos, la respiración del que se te puso al lado y el latido del nido enterrado. Y los invasores son mucho más oscuros: de noche lo primero que se ve no es el invasor, son los ojos, que se prenden cuando te tiene de frente. Detalles: `CAMBIOS_1_9_0.md`.

## 1.8.0 — Diez mejoras: el banco, el inglés y lo que faltaba

Banco de pruebas que mide cuadros por segundo de verdad y arma un informe; la partida se exporta a un archivo y se importa en otra computadora; deshacer la última etapa de una obra y repetir la pieza de enfrente; modo foto (F2) con hora, encuadre y luz que se ven en la foto; el parte de la partida al terminar el Desafío; la guía y las pistas del segundo acto; los animales huyen de la nave, de los invasores y del nido; el juego entero en inglés; cuatro paletas de piano por cinco momentos del día y tres volúmenes separados; y los invasores lejanos con la mitad de triángulos. Detalles: `CAMBIOS_1_8_0.md`.

## 1.7.0 — El hilo y el nido

Los encargos dejan de ser una lista suelta: once quedaron encadenados, así que cada vecino te enseña en el orden que sus propios textos dicen, y un encargo nuevo cierra la tanda. El Desafío gana un segundo acto: la nave nodriza deja un nido enterrado en el valle, que se ubica con las señales de los restos de nave y sólo se puede romper de día, cuando el caparazón se abre. Detalles: `CAMBIOS_HILO_Y_NIDO_1_7_0.md`.

## 1.6.0 — Diez mejoras

Los árboles se vienen abajo de verdad y los tocones rebrotan solos; el acopio de materiales paga las obras cercanas; el mapa acepta chinches propias y la brújula te lleva hasta ellas; el Relax tiene un primer día guiado y seis encargos nuevos; el Desafío suma invasores nuevos, un jefe cada cinco noches, foso con estacas, portón con tranca y un parte de la base (N); hay mando, remapeo de teclas, letra grande, paletas para daltonismo y subtítulos; tres partidas guardadas por modo; y la calidad gráfica se acomoda sola según los cuadros por segundo. Detalles: `CAMBIOS_1_6_0.md`.

## 1.5.0 — Guía del juego y recursos más accesibles

F1 abre una guía completa (también desde la pausa y la portada): primeros pasos, de dónde sale cada recurso, construcción, armas y defensas, teclas; filtrada por modo. Los árboles en pie se talan con tres hachazos (4 troncos; el pehuén está protegido), las tablas se aserran a mano en cualquier lado (1 tronco → 2 tablas; 4 en un banco), el banco de carpintero ya no pide tablas y el Desafío arranca con 6 troncos, 6 tablas y 6 piedras. Detalles: `CAMBIOS_GUIA_RECURSOS_1_5_0.md`.

## 1.4.0 — Optimización y nuevos invasores

La escena en calidad media pasó de 2,27 a 0,80 millones de triángulos y el dibujo de 17,4 a 11,1 ms de CPU (objetos del mapa y LOD cercano de los árboles sólo cerca de la cámara, colisiones sin basura). Los invasores se rehicieron desde cero: anatomía inquietante, piel con venas y brillo húmedo, esqueleto de 14 huesos resuelto en el shader (una malla por invasor: de 260 a 36 llamadas de dibujo para 18), carga en cuatro patas, tics de cabeza y disolución al morir. Detalles: `CAMBIOS_OPTIMIZACION_VISUAL_1_4_0.md`. Medir: `npm run medir`.

## 1.3.0 — Desafío premium

Antorchas con luz real, campana de alarma, torre de vigía, pozo, red de cristal y barril de resina; honda, boleadoras y martillo; mejoras de armas con cristales; bloquear y esquivar; efectos de golpe, cámara lenta y música de tensión; el perro y los vecinos defienden la base; restos de naves con tecnología alienígena; noches especiales; clima que cambia el combate; nave nodriza en la noche 20; tutorial, 18 logros y récords por dificultad. Detalles: `CAMBIOS_DESAFIO_PREMIUM_1_3_0.md`.

## 1.2.0 — Desafío, segunda ronda

Portón de empalizada que se abre con E, dificultad elegible (Tranquila / Normal / Implacable), aviso una hora antes del ataque, caja de suministros en paracaídas al amanecer, marca de impacto, barras de vida de los invasores, indicador de dirección del daño e invasores en la brújula. Detalles: `CAMBIOS_DESAFIO_1_2_0.md`.

## 1.1.0 — Modo Desafío

En la portada se elige el modo. **Relax** es el recorrido tranquilo de siempre. **Desafío**: cada noche baja una nave con invasores; hay que levantar la cabaña, rodearla de empalizadas, pircas, estacas y ballestas, fabricar armas (lanza, arco, flechas) o encontrar la pistola de plasma en la cápsula estrellada, y resistir hasta el amanecer. Cada modo guarda su propia partida. Clic izquierdo ataca, K fabrica. Detalles: `CAMBIOS_MODO_DESAFIO_1_1_0.md`.

## 1.0.0 — Versión final

Cierra la línea de release candidates sobre la base de RC31.2: brújula sin etiquetas superpuestas, créditos finales con la versión inyectada al armar, `npm run verify` que arma el bundle antes de probar y una prueba de humo de partida real (`npm run verify:smoke`). Detalles: `CAMBIOS_RELEASE_1_0_0.md`.

## RC31 — Integridad Estructural

RC31 convierte cada edificio importante en un complejo visual atómico: cuerpo, mecanismos, puertas, accesorios y luces comparten visibilidad y LOD. Corrige las piezas estructurales aisladas vistas en RC30, restaura shadow LOD sobre mallas descendientes, liga puertas/postigos a sus edificios, ancla los props del refugio a su raíz y refuerza continuidad de vidrio/chimeneas/carteles.

Detalles técnicos: `CAMBIOS_INTEGRIDAD_ESTRUCTURAL_RC31.md`.

## RC30 — Profundidad escénica

RC30 refuerza la separación entre primer plano, bosque medio y cordillera sin sumar geometría. La perspectiva aérea ahora depende de distancia, altura y humedad, la luz rasante recorta crestas y follaje al amanecer/atardecer, y terreno/vegetación pierden contraste de forma diferenciada a media distancia.

Detalles técnicos: `CAMBIOS_PROFUNDIDAD_ESCENICA_RC30.md`.

## RC29 — Composición del paisaje

RC29 reorganiza visualmente el valle para que se sienta menos procedural a media distancia: rodales y claros de escala grande, bordes de bosque/ecotono mejor definidos, agrupaciones naturales de roca y madera muerta y una apertura escénica controlada desde el Mirador del Pehuén hacia el lago. Todo se calcula al generar el mundo y reutiliza instancing existente.

Detalles técnicos: `CAMBIOS_COMPOSICION_PAISAJE_RC29.md`.

## RC28 — Microdetalle material y humedad persistente

RC28 refina el mundo a corta distancia sin sumar geometría pesada: suelo, madera, piedra y techos conservan humedad después de la lluvia, aparecen charcos procedurales en bajos/senderos compactados y los materiales ganan veta o micrograno únicamente donde el ojo puede percibirlo. El detalle fino se desvanece antes de distancia media para proteger estabilidad y evitar shimmer.

Detalles técnicos: `CAMBIOS_MICRODETALLE_MATERIAL_RC28.md`.

## RC27 — Agua, vegetación y luz premium

RC27 profundiza el realismo de RC26 en tres superficies que dominan la percepción del mundo: agua, vegetación e interiores. El lago y el arroyo incorporan absorción por profundidad, turbidez de orilla y destellos solares más naturales; las copas ganan volumen por relleno de cielo/sol sin luces adicionales; y los interiores ajustan su luz y exposición según hora, nubosidad y transición exterior–interior.

Detalles técnicos: `CAMBIOS_AGUA_VEGETACION_LUZ_RC27.md`.

## RC26 — Realismo visual patagónico

RC26 toma la rama estable RC25 y le suma una pasada de realismo visual sin tocar la arquitectura central del juego ni reabrir el frente de bugs resueltos. El foco está en la lectura del paisaje: cielo más natural, mejor separación atmosférica en el horizonte, cordillera con más riqueza cromática, terreno con más variación entre pasto seco, suelo húmedo y pedregullo, y una corrección de color final más fotográfica.

Detalles técnicos: `CAMBIOS_REALISMO_VISUAL_RC26.md`.

## RC22 — Optimización Adaptativa

RC22 mantiene intactos construcción/hábitat RC12 y naturaleza RC19. Sobre RC20/RC21 añade un presupuesto adaptativo por frametime real: cuando existe presión sostenida, el juego espacia primero tareas secundarias, baja la frecuencia de actualización de sombras y acorta únicamente el anillo lejano de microdetalle; al recuperar margen vuelve gradualmente a nivel completo. Estructuras, chunks de vía, árboles y matas pasan además por índices espaciales locales para evitar recorridos globales innecesarios.

Detalles técnicos: `CAMBIOS_OPTIMIZACION_ADAPTATIVA_RC22.md`.

## RC21 — Optimización Profunda

RC21 mantiene intactos construcción/hábitat RC12 y naturaleza RC19, y profundiza el trabajo de RC20: índice espacial 2D reutilizable para consultas locales, doble buffer ecológico sin `Map` nuevo por frame, LOD de decisiones de IA según distancia y telemetría F3 para cuadros >33 ms y heap JS. Movimiento/animación cercanos no se reducen; sólo se espacian cálculos caros cuando el actor está lejos y fuera de peligro.

Detalles técnicos: `CAMBIOS_OPTIMIZACION_PROFUNDA_RC21.md`.

## RC20 — Optimización Sistémica

RC20 congela el contenido de construcción/hábitat RC12 y naturaleza RC19 para reducir stutter y coste por frame sin bajar densidad ni fidelidad. Se incorporan pools posicionales sin GC para fauna/rastros, contextos reutilizados, caches temporales para consultas de interior/hábitat/interacción, scan del perro a baja frecuencia y shadow LOD dinámico para fauna/NPCs. El panel F3 deja de perfilar cuando está oculto.

Detalles técnicos: `CAMBIOS_OPTIMIZACION_SISTEMICA_RC20.md`.

## RC19 — Microconductas Patagónicas

La fauna cercana ya no depende sólo de los estados grandes de locomoción. Huemul, guanaco, zorro y liebre alternan gestos breves de alimentación, rumia, olfateo, acicalado y vigilancia cuando el contexto es seguro. Orejas, cabeza y cola reaccionan de forma independiente sin sustituir la IA de amenaza/huida. Zorzales combinan suelo y posaderos bajos derivados de árboles reales; bandurrias sondean el terreno en sus pausas. El material premium de fauna incorpora una segunda escala procedural de fibra para mejorar la lectura del pelaje sin texturas externas.

## Ecosistema Atmosférico RC18

Esta etapa se conserva íntegra dentro de la rama maestra RC21. Conserva íntegra la arquitectura de construcción/hábitat RC12 y toda la evolución natural RC13–RC17, manteniendo a la **Patagonia argentina** como regla ecológica y visual del proyecto.

RC18 añade un reloj ecológico compartido por especie y clima: huemul, zorro colorado, guanaco, liebre, zorzal y bandurria ya no dependen sólo de booleanos día/noche. El huemul puede descansar fuera de su pico de actividad, los herbívoros modulan desplazamiento tranquilo, las alarmas de zorzales se propagan localmente y las rutas de huida distinguen bosque denso de bordes/matorrales seguros.

La atmósfera también gana escala local: las ráfagas son más fuertes en estepa y exposición abierta, el bosque amortigua parte del viento y la bruma baja persiste especialmente alrededor del mallín y la ribera. En invierno, guanacos y liebres se suman a los rastros cercanos sin crear un sistema nuevo de decals.

El sistema de construcción RC12 continúa **congelado y preservado** debajo de esta rama; no se descartó ninguna de sus capacidades.

Detalles técnicos: `CAMBIOS_ECOSISTEMA_ATMOSFERICO_RC18.md`. La evolución inmediatamente anterior sigue documentada en `CAMBIOS_ECOSISTEMA_DINAMICO_RC17.md`.

Validación rápida:

```bash
npm run verify
```

Auditorías con Electron instalado:

```bash
npm run verify:geometry
npm run verify:physics
```

La lista previa a una publicación comercial está en `STEAM_RELEASE_CHECKLIST.md`.

## Arrancar

Necesitás Node.js 20 o superior.

```bash
npm install
npm start
```

Crear el ejecutable:

```bash
npm run dist:steam:win # carpeta Windows para un depot de Steam
npm run dist:win       # instalador y versión portable en dist/
npm run dist:linux   # AppImage en dist/
```

La primera carga tarda unos segundos: el bosque se arma cada vez que abrís el juego.

## Controles

| Tecla | Acción |
|---|---|
| W A S D | caminar |
| Shift | correr |
| C | agacharte (los animales se asustan menos) |
| Espacio | saltar (funciona aunque lo apretes un instante antes de tocar el suelo) |
| E | anotar una planta, juntar algo, sentarte, subir o bajar del kayak, dormir |
| Q | sacar o guardar la caña de mosca |
| Clic izquierdo o X | lanzar, clavar cuando pica y mantener para recoger |
| L | linterna |
| Clic derecho o Z | prismáticos |
| R | descansar: el tiempo pasa más rápido |
| F | hacer una fogata (con 3 ramitas) o encender fogones/estufas construidas |
| J | cuaderno de campo |
| M | mapa |
| P | sacar una foto (se guardan en Imágenes/Hojarasca) |
| G | cocinar en el fuego |
| E | subir y bajar de la trochita en cualquiera de sus cuatro paradas |
| W A S D | arriba del tren, cambiar de asiento o salir a la plataforma |
| O | abrir/cerrar planos de construcción |
| Y | construir/avanzar una obra; fuera del modo obra, aserrar junto a un banco válido |
| Tab | cambiar categoría de planos mientras construís |
| R o rueda | girar el plano 45° mientras construís |
| Supr | cancelar una marca de obra que todavía no empezó |
| V | dejar en el suelo el objeto seleccionado |
| F3 | panel de rendimiento |
| F11 | pantalla completa |
| Esc | pausa y ajustes |

## Qué hay

- **El mundo:** un kilómetro por un kilómetro. Tiene un lago, un arroyo que baja de la cordillera y un sendero que da la vuelta. En el recorrido están el Refugio del Arroyo, el Muelle del Lago, el Puente de Troncos, el Mallín, el Mirador del Pehuén y el Bosque de Arrayanes.
- **La trochita:** una vía de trocha angosta de 75 centímetros da la vuelta completa al valle: más de dos kilómetros de terraplén, durmientes y balasto, con un puente de caballetes sobre el arroyo y pasos a nivel con cruz de San Andrés donde el sendero cruza los rieles. El tren a vapor —locomotora, ténder y dos coches— recorre el anillo siempre en el mismo sentido y para en cuatro paradas: la Estación del Valle —galpón de tablas verticales con zócalo de piedra, reloj sobre el frontón, puerta con marco, ventanas con postigos, chimenea de ladrillo, alero sostenido por postes con ménsulas, carro de equipaje y tanque de agua— y tres apeaderos más chicos con el mismo andén de tablones, banco y farol. Silba al acercarse a cada parada. Subís con E cuando está detenido y viajás adentro de un coche de verdad: piso de tablas, ventanillas abiertas entre pilares, asientos de madera enfrentados y farol en el techo. Con W A S D cambiás de asiento, pasás al otro coche o salís a la plataforma abierta de la cola. En pantalla ves la próxima parada y cuántos metros faltan; parado en un andén, cuánto falta para que llegue el próximo tren. De noche se encienden el faro de la locomotora y los faroles de los coches. El tren toca la campana al llegar, chirrían los frenos en la frenada y, sobre el puente de caballetes, el traqueteo suena hueco.
- **Almacén de Ramos Generales:** junto al sendero, con vereda de tablas, cornisa alta, vidrieras y el mostrador con balanza y libreta de fiado. Lo que juntás en el bosque se cambia por cuatro cosas útiles: una mosca de pescar atada a mano (los piques llegan en la mitad de tiempo), un farol de kerosene (alumbra mucho más lejos que la linterna), una manta de lana (podés dormir en cualquier lado, sin fuego) y un kilo de yerba (para cebar mates en cualquier fuego). El almacén de ramos generales era el centro del pueblo rural: vendía de todo, compraba lana y cueros, y hacía de correo y de banco.
- **Galpón de Esquila:** un galpón largo de tablas y techo de chapa, con la última hoja oxidada, portón corredizo, rampa y ventiluz en el frontón. Adentro están las tablas de esquila, la prensa de lana con su palanca y los fardos atados apilados. Afuera, corrales de palo a pique, la manga que lleva a la rampa, los restos de una pirca de piedra, el molino australiano girando con el viento y el tanque que llena. Entre 1880 y 1950 la lana movió la Patagonia: las comparsas de esquiladores iban de estancia en estancia y en un galpón así trabajaban veinte personas de sol a sol.
- **Detalles compartidos:** todas las construcciones hablan el mismo idioma: zócalo de piedra, ventanas con marco y postigos, aleros sobre las puertas sostenidos por ménsulas en diagonal, escalones de entrada y leña apilada. El muelle tiene bitas con argollas, una soga enrollada y un cajón de pesca; la casa de té, faroles, jardineras con flores y cartel colgante; el molino, bolsas de harina y una carretilla; el faro, puerta con marco y escalón de piedra; la torre, la mesa del vigía con el mapa y los prismáticos, y un banderín de viento en el techo.
- **Las cabañas:** de troncos con las puntas asomando en las esquinas, techo empinado de dos aguas con buen alero y cumbrera de tronco, el **ventanal del hastial** con sus dos hojas siguiendo la pendiente, y al frente una **galería** con piso de tablas, baranda de troncos con balaustres, escalera con pasamanos y celosía tapando el bajo. Al costado, la **chimenea de piedra bola** —de esas que se juntan en el río— subiendo hasta pasar el techo, con su remate de chapa sobre cuatro patas.
- **Faro del Lago:** dieciséis metros de torre a franjas rojas y blancas sobre zócalo de piedra, con ventanitas de marco blanco cada tantos anillos. Se entra por la puerta del lado de tierra y **se sube de verdad**: cincuenta y ocho peldaños de hierro que dan tres vueltas y media pegados a la pared, con su eje central y el pasamanos. Arriba, la sala de la linterna con la mesa del farero, su bitácora —que se puede leer— y el bidón de kerosene; afuera, la galería con baranda de hierro, desde donde se ve el lago entero. La lente de diez prismas gira toda la noche junto con el haz, y remata en el techo cónico con su pararrayos.
- **Construcciones:** hay un molino de viento a la holandesa en campo abierto, con base de piedra, balcón y cuatro aspas que giran más rápido cuanto más sopla. Junto al sendero está la Casa de Té, con galería, mesas afuera y la pava al fuego: se puede pedir té con torta galesa, unos mates o un chocolate caliente, y cada cosa queda anotada en el cuaderno. En lo alto hay una Torre de Guardaparques de madera: se sube por la escalera de dos tramos y desde arriba se ve el bosque entero.
- **Refugios:** el refugio tiene hogar de piedra, estantería, cama, leña apilada, un hacha clavada en el tronco de partir y un farol junto a la puerta. Lejos del sendero hay dos cabañas más, la Cabaña del Pescador a orillas del lago y el Puesto Alto en la parte más alta del valle: las dos con chimenea humeante, catre para dormir y banco afuera. En la punta más lejana del lago está el Faro del Lago, que de noche gira su haz sobre el agua.
- **La estepa:** hacia el este el bosque ralea hasta que se termina. El límite no es una línea recta: lo dibuja el ruido, con manchones de árboles sueltos que se van espaciando. Del otro lado está la estepa patagónica de verdad: matas de **coirón** amarillento separadas por suelo ocre desnudo, **neneos** en cojín contra el viento, y una **tropilla de guanacos** que anda pastando con la cabeza baja. Si te acercás levantan el cuello, se quedan mirándote y a los veinte metros salen todos al trote.
- **Flora:** coihues, lengas, cipreses de la cordillera, arrayanes y pehuenes, y ahora también ñires achaparrados en los mallines y en la altura, maitenes de ramas colgantes en los claros y junto al agua, matas de maqui en los bordes del bosque y chauras entre las piedras de arriba. Cada especie crece donde le corresponde por altura, humedad y densidad del bosque.
- **Fauna nativa:** zorzales patagónicos que picotean el suelo y salen volando, lagartijas al sol sobre las piedras al mediodía, pudúes, huemules al amanecer y al atardecer, zorros colorados en el sendero, coipos en la orilla, carpinteros gigantes, chucaos, cachañas, cisnes de cuello negro, cauquenes, patos de los torrentes, martines pescadores, picaflores rubí, bandurrias, un cóndor, el concón de noche, murciélagos justo cuando se va la luz, mangangás en las flores y truchas que saltan con poca luz.
- **Especies introducidas:** ciervos colorados que braman en otoño, jabalíes que hozan el suelo en piara y liebres europeas que salen en zigzag. También hay un panal de abejas asilvestradas en un tronco hueco; mejor mirarlo de lejos.
- **Cuaderno de campo:** 124 entradas con textos sobre cada especie y cada lugar. Algunas se anotan acercándote, otras juntando cosas, viendo a un animal o escuchándolo.
- **Pesca con mosca:** en el lago y en el arroyo hay cinco especies, y todas se devuelven al agua. Cuando pica tenés un segundo para clavar. Después hay que recoger aflojando cada vez que el pez tira, o se corta la línea. El amanecer y el atardecer son los mejores momentos.
- **Kayak:** está amarrado al costado del muelle. Se rema con W, S, A y D, y se puede pescar desde adentro.
- **Cocinar:** junto a un fuego encendido, con G, si juntaste ingredientes. Hay tres recetas: piñones tostados, dulce de calafate y frutillas al rescoldo. Cada una queda anotada en el cuaderno.
- **Dormir:** en la cama del refugio o junto a una fogata. De noche pasás directo a la mañana; de día es una siesta de dos horas.
- **Encargos:** cuando terminan de contarte sus historias, los tres personajes empiezan a pedirte cosas: anotar los cinco árboles grandes, fotografiar un carpintero, pisar las cuatro puntas del valle, tostar piñones al fuego, pescar las tres truchas o viajar una vez en la trochita. El cuaderno lleva la cuenta y, cuando cumplís, se lo contás a quien te lo pidió.
- **Brújula:** los lugares principales aparecen sobre la brújula con su distancia, así podés orientarte sin abrir el mapa.
- **La guarda del tren:** Elsa viaja parada en el pasillo del primer coche. Canta las paradas al llegar y, si le hablás, cuenta cuatro historias del ramal: cómo la gente salió a la vía para que no lo cerraran, las nevadas que dejaban el tren parado con la salamandra prendida, los pasajeros que bajaban a empujar en las cuestas y las paradas para cargar agua. También te propone dar la vuelta completa al anillo sin bajarte.
- **Rutinas:** los personajes no esperan parados. Don Ramón da vueltas por su puesto tomando mate, Ema recorre un tramo del sendero y se detiene a anotar en su planilla, y Nicanor baja a la orilla y se queda pescando un rato largo. Si te acercás dejan lo que están haciendo y se dan vuelta a mirarte. Y saludan distinto según la hora, la lluvia y la estación.
- **El salto del arroyo:** casi seis metros de caída donde el arroyo encuentra su tramo más empinado, con la cortina de agua cayendo en hilos, la espuma girando en la poza y el rocío saltando al pie. Se escucha desde lejos, antes de verse.
- **La carpa:** con la manta del almacén se arma en cualquier lugar llano y seco con la tecla T. De noche se duerme adentro y a la mañana se levanta con la misma tecla. Queda guardada donde la dejaste.
- **El perro:** un ovejero de campo te espera en el refugio y te acompaña a todos lados. Va y viene, se adelanta a olfatear, se sienta cuando parás y mueve la cola. Cuando se queda duro mirando fijo hacia un lado y ladra corto, hay un animal cerca: es la mejor forma de encontrar los que cuesta ver.
- **Cueva de las Manos:** un alero de piedra escondido en una ladera empinada, con la pared pintada de manos en negativo y una tropilla de guanacos, y las piedras de un fogón viejo en el piso de arena. Se pintaban soplando pigmento sobre la mano apoyada, y por eso casi todas son izquierdas. Las del cañadón del río Pinturas, en Santa Cruz, tienen más de 9.000 años.
- **Gente del bosque:** tres personajes con los que se habla con E. Don Ramón, el puestero del Puesto Alto; Ema, la guardaparque, cerca del Mirador del Pehuén; y Nicanor, el pescador, junto a su cabaña. Entre los tres cuentan doce historias de la Patagonia (la leyenda del calafate, los piñones del pehuén, las truchas que llegaron en tren, el bicho del lago) y cada una queda anotada en el cuaderno.
- **Álbum de fotos:** 30 desafíos, como un pudú de cerca, el atardecer desde el muelle o la luna sobre el lago. Cada foto que cumple uno queda pegada en el cuaderno.
- **Tiempo:** los días son largos, como en el verano patagónico. El clima cambia entre despejado, nublado y lluvia.
- **Estaciones:** verano, otoño con lengas rojas y hojas que caen, e invierno con nieve. En los ajustes podés fijar una o elegir *Que pasen solas*: entonces el año dura doce días de juego y el valle va cambiando mientras lo recorrés.
- **El cielo del sur:** en las noches despejadas se dibujan cuatro constelaciones sobre el cielo estrellado: la Cruz del Sur, las Tres Marías, las Nubes de Magallanes y Escorpio. Se marcan con un signo de pregunta hasta que te quedás un rato mirándolas; ahí se anotan en el cuaderno, con para qué sirven y qué son. Con los prismáticos se reconocen más rápido.
- **Orientación:** los lugares importantes aparecen sobre la brújula con su distancia, el mapa muestra la vía y dónde anda el tren, y los encargos en curso quedan anotados abajo a la izquierda.

El progreso se guarda solo cada 20 segundos y al pausar.

## La imagen

En las calidades Media y Alta la escena se dibuja a una textura y después pasa por una cadena de post-procesado escrita a mano:

- **Brillo (bloom):** lo que pasa cierto umbral florece, con dos desenfoques encadenados. El sol, el fuego, las ventanas encendidas y las luciérnagas se encienden como corresponde. De noche el umbral cambia.
- **Rayos de sol:** cuando el sol está en cuadro y por encima del horizonte, se estiran las zonas brillantes desde su posición, y los troncos los cortan. En el bosque al amanecer es la mejor imagen del juego.
- **Curva filmica y paleta propia:** sombras frías, luces cálidas, verdes un poco más profundos y, de noche, menos saturación, como ve el ojo con poca luz.
- **Viñeta y grano fino,** un poco más marcado de noche.

Al amanecer y en el último rato de la tarde se acuesta una **bruma de valle** sobre el lago, el arroyo y el mallín: jirones que se desplazan despacio, más densos con el aire quieto y el cielo cargado, y que se queman cuando sube el sol. Y cuando hay nubes, sus **sombras corren por el valle** con el viento, oscureciendo el suelo de a manchones.

Además, el follaje se enciende **a contraluz** cuando el sol queda detrás de las hojas, y todo lo que está cerca del suelo recibe algo menos de luz, lo que le da a los troncos y a las matas una sombra de contacto que antes no tenían.

## Materiales

El agua tiene **cáusticas**: donde el fondo está cerca, la luz que atraviesa las ondas dibuja la red de líneas movedizas sobre el lecho, con la intensidad del sol y desapareciendo con la profundidad. Y lo que refleja rasante ya no es el cielo sino la **costa**: verdoso y oscuro cerca del horizonte, celeste hacia arriba.

Los árboles dejaron de ser bloques planos: el follaje y la corteza tienen **relieve** calculado con ruido del mundo, en dos escalas, así que cada copa se sombrea distinto según dónde esté, y los troncos tienen veta corriendo a lo largo.

El **cielo** tiene disco solar con borde difuso y dos coronas superpuestas, una cerrada y otra amplia, y las **nubes se iluminan desde el sol**: comparando la densidad un paso hacia el astro, el borde que lo enfrenta se enciende, más fuerte al atardecer. Los **animales y la gente** llevan luz de contorno: el borde se recorta del fondo, y bastante más cuando el sol viene de atrás.

El **pasto** ya no es un verde parejo: cada mata sale con su tono, unas más amarillas y otras más oscuras, con las puntas apenas secas y el brillo variando de una a otra. Y la madera y la piedra de las construcciones tienen **desgaste**: lo que mira al cielo se destiñe con el sol y la lluvia, y lo que está cerca del suelo junta musgo y verdín en manchones.

El **suelo** tiene relieve: la normal se perturba con tres escalas de ruido, así que la tierra, la piedra y el pasto corto dejan de verse pintados sobre una superficie lisa. Y en invierno la **nieve se acumula donde corresponde**: sobre la cara superior de cada tronco, cada tabla y cada techo, en proporción a cuánto miran al cielo.

Cuando **llueve, el suelo se moja**: se oscurece y satura, devuelve un brillo tendido en la dirección del sol y toma algo del color del cielo. El efecto es más fuerte en los bajos y donde ya hay humedad, que es donde se junta el agua, y más leve en las laderas, por donde escurre. La **madera y la piedra** de las construcciones hacen lo mismo: se oscurecen y sacan brillo, sobre todo en las caras de arriba, que es donde se moja primero; y el **follaje** se oscurece un poco, como las hojas empapadas.

En el aire flotan cosas: en **otoño bajan hojas** girando, ocres y rojizas, con su bamboleo y arrastradas por el viento; y todo el año, con luz, se ve la **pelusa** suspendida que brilla a contraluz. Todo en una sola malla de puntos que sigue al jugador, así que cuesta un único dibujo.

El **viento llega en rachas**: ondas largas que cruzan el valle en su dirección, una lenta y ancha y otra más corta encima, que van doblando el pastizal a su paso y siguen de largo por las copas de los árboles. Es lo que se ve en un pastizal patagónico cuando viene una racha, y lo que el sonido del viento ya hacía en el oído.

Bajo el bosque el sol se cuela entre las hojas y dibuja **luz moteada** en el suelo: manchas claras y oscuras que se corren con el viento y se desplazan según el ángulo del sol. Solo aparece donde el bosque es cerrado, con sol y sin nubes tapando.

Las **ventanas** devuelven el cielo: de día el vidrio refleja el color del horizonte, apenas azulado, y de noche se llena del calor de adentro. Y del **fogón saltan chispas**: una de cada seis partículas sube tres veces más alto que la llama, se apaga antes de llegar arriba y la lleva el viento.

Cuando estás metido en el agua, **salen ondas de vos**: anillos concéntricos que se alejan y se apagan a los tres metros y medio, con un poco de espuma agitada alrededor del cuerpo.

Alto sobre el valle **planean aves**: tres bandadas girando en círculos de distinto radio, altura y velocidad, cada una con su aleteo lento y su lugar dentro del grupo. Se ven con luz y buen tiempo; con tormenta se guardan. Son puntos con forma de silueta, así que cuestan un solo dibujo.

## El sonido

Todo el audio se sintetiza en vivo, sin archivos. La salida pasa por corte de retumbe, un realce de aire, compresión suave y limitador, así que nada satura por más que se junten sonidos. Hay **tres espacios** con su propia respuesta al impulso, calculada por código: el bosque abierto (cola media, agudos comidos por el aire), el interior de las construcciones (corta y seca, con las reflexiones cercanas de las paredes de tabla) y la cueva (larga, grave y con eco marcado). El juego cambia de espacio según dónde estés parado, y desde adentro los sonidos de afuera llegan apagados. Cada sonido con posición pierde agudos con la distancia, como pasa en el aire de verdad. Los pasos tienen tres capas —el golpe del pie, el roce y lo que se remueve— con variación en volumen, tono y cantidad, así que nunca se escuchan dos iguales. El viento llega en rachas de dos escalas superpuestas.

## El refugio se va llenando

El refugio no queda igual que el primer día. A medida que juntás, aparecen tus cosas adentro: la leña apilada contra la pared, una hilera por cada seis ramitas; los frascos de lo que cocinaste en el estante; la caña en el rincón si conseguiste la mosca; la manta doblada a los pies de la cama. Y las últimas cuatro fotos que sacaste quedan colgadas en la pared, con su marco, un poco torcidas.

## Renovales

Con un piñón o un fruto de calafate podés plantar un renoval con la tecla **B**. Solo prende en los claros llanos y secos, lejos del sendero, de la vía y de los árboles grandes, que no lo dejarían crecer. Tarda catorce días de juego en pasar de brote a arbolito, y crece cada vez que dormís.

## Construcción propia — sistema Multi-Level Structural RC9

Con el **hacha** del almacén hacés **troncos** de los árboles caídos y juntás **piedra** de los pedreros. Un tronco llevado al banco del galpón de esquila rinde cuatro **tablas**. Cuando construís tu propio **cobertizo rural** o **banco de carpintero**, también podés aserrar allí: la construcción deja de ser decorativa y crea nuevas bases de trabajo en el mapa.

Con **O** se abre el catálogo. Los planos están separados en cuatro categorías —**Refugios, Trabajo, Exterior y Mobiliario**— y se recorren con **Tab**. Las teclas **1–8** eligen los planos visibles de la categoría actual; **[** y **]** cambian de página cuando una categoría supera ocho planos. El fantasma se gira en pasos precisos de 45° con **R** o con la **rueda**, y muestra en vivo si el sitio es válido y por qué no lo es.

La colocación ya no usa un cuadrado genérico: cada plano valida su **huella real**, pendiente, agua, vía, sendero, vegetación, otras obras y, cuando corresponde, el piso construido que tiene debajo. Muebles y bancos pueden colocarse dentro de tus refugios sin enterrarse en el terreno. Una marca recién fundada se ve mediante estacas y cordel, pero **no despeja el bosque hasta que gastás materiales en la primera etapa**. Si te arrepentís antes de empezar, **Supr** retira la marca sin gastar nada ni dejar una obra huérfana.

RC9 conserva el **encastre inteligente** de RC8 y lo extiende a niveles estructurales. Con **N** activás o desactivás el snap; pisos, paredes, techos, escaleras, barandas, cercos y pasarelas sólo se atraen a familias compatibles. Las paredes se enderezan al eje válido del piso, el techo se centra y eleva sobre el módulo, y escaleras/barandas buscan bordes de soporte en vez de depender de una grilla global. La validación combina huellas OBB/SAT con intervalos verticales, de modo que dos piezas pueden compartir planta si realmente están en cotas distintas.

Con **Shift+Y** podés tomar una pieza terminada cercana y recolocarla: durante la edición se retiran su física y sus interacciones hijas, y al confirmar o cancelar se reconstruyen exactamente una vez. La selección prioriza el tipo de plano activo para poder editar correctamente elementos apilados. **Supr** cancela una recolocación activa y **Shift+Supr** desmonta una pieza, recuperando parte de los materiales. Los pisos con elementos apoyados encima no pueden moverse ni desmontarse hasta liberar esas dependencias.

### 25 planos en cuatro familias

**Refugios**
- **Puesto de troncos** — cuatro etapas, habitable y apto para dormir.
- **Casilla de tablas** — basas, piso elevado, entramado con puerta/ventana y techo con estufa/chimenea; también habitable.
- **Piso modular 3×3** — base encastrable y caminable para levantar espacios propios.
- **Pared modular** — paño sólido de tres metros.
- **Pared con puerta** — vano transitable con **puerta funcional**, interacción con E y colisión dinámica ligada a la hoja.
- **Pared con ventana** — antepecho, dintel, laterales y **postigos funcionales**.
- **Techo modular 3×3** — cubierta elevada que se centra automáticamente sobre un piso modular y exige soporte real.
- **Pilar de esquina** — poste estructural encastrable; cuatro pilares pueden sostener un entrepiso.
- **Entrepiso modular 3×3** — segundo nivel caminable que exige soporte vertical válido.
- **Entrepiso con hueco** — segundo nivel con abertura visual y física real para la escalera interior.

**Trabajo**
- **Galpón de herramientas** — refugio abierto de tres etapas.
- **Cobertizo rural** — seis apoyos, piso, reparo, cubierta y banco integrado; habilita aserrado.
- **Banco de carpintero** — pieza funcional que habilita aserrado lejos del galpón original.
- **Pila de leña** — almacenamiento visual de campo.

**Exterior**
- **Mirador de tablas** — plataforma elevada con escalera y baranda física.
- **Fogón de piedra** — se integra con las mecánicas de fuego.
- **Tendal** — horquetas, alambre y ropa.
- **Pasarela de tablas** — piso caminable con apoyos profundos para barro y desniveles chicos.
- **Cerco de campo** — tramo físico que se puede encadenar para delimitar patios y corrales.
- **Escalera de acceso** — cuatro peldaños caminables, dimensionados para el vano de puerta modular y encastrados al borde del piso.
- **Escalera interior de nivel** — once peldaños físicos que sólo encastran con un entrepiso con hueco.
- **Baranda modular** — protección física de borde, encastrable y dependiente de una plataforma construida.

**Mobiliario**
- **Banco de tronco**.
- **Mesa de campo**.
- **Estante de tablas**.

Las construcciones grandes se levantan **por etapas**: cada etapa descuenta sus propios materiales, rehace la geometría y activa la física que ya corresponde. Las piezas chicas se pagan antes de colocarse, así nunca queda un marcador imposible de terminar por falta de recursos.

Al terminar una construcción grande podés ponerle nombre y queda registrada en el mapa. La física también está integrada: pisos caminables, paredes, barandas, cercos, mesas, estantes, bancos y talleres ocupan el mismo volumen que muestran visualmente.

## Entrar a los lugares

El refugio, las dos cabañas y el almacén tienen **puerta de verdad**: hoja de tablas alternadas con sus dos travesaños y la diagonal de refuerzo, bisagras y picaporte de hierro. Se abren y se cierran con **E**, girando sobre la bisagra, con el chirrido de la bisagra al abrir y el golpe seco al cerrar. Mientras están cerradas no se pasa: hay que abrirlas.

El **galpón de esquila** tiene su portón corredizo, que se desliza sobre el riel con el ruido de las ruedas y el golpe al llegar al tope. Y las cabañas tienen **postigos** en la ventana, que se abren de par en par con el mismo chirrido de bisagra.

## La mochila

Abajo hay ocho casillas con lo que llevás encima, siempre las ocho, vacías o no. Se elige con las teclas **1 a 8**, con la **rueda del mouse** o tocando la casilla, y lo elegido **se ve en la mano**: la cámara, el farol que se enciende, el atado de ramitas, el paquete de yerba. El objeto se balancea al caminar, aparece desde abajo al cambiar y hace un gesto cuando lo usás.

Se usa con **clic derecho** o con **U**: la cámara saca la foto, la caña se saca y se guarda, el farol se prende, la carpa se arma, las ramitas encienden el fogón, los piñones y el calafate plantan un renoval. Con **I** se abre la mochila entera; tocando cualquier cosa la mandás a la casilla elegida, y tanto ese orden como la casilla en la que estabas se guardan con la partida.

**Caminar y correr suenan distinto**: corriendo el pie cae un 55 por ciento más fuerte y se suma el golpe grave del peso del cuerpo, que al caminar no está; y la ropa y la mochila hacen su roce, el doble de fuerte al correr. La **nieve cruje** con su capa de partículas apretándose y el chirrido agudo de la nieve seca.

La **trochita** suena a locomotora de vapor: dos bufidos por vuelta de rueda con el golpe de la biela, el vapor escapando por los costados, los cuatro ejes pisando las juntas del riel de a pares y desfasados, el chirrido de las pestañas en las curvas y el balanceo de los enganches entre coches. Sobre el puente de madera todo eso se vuelve hueco.

Caminar en el agua **chapotea**: el pie entrando, la salpicadura que se abre y las gotas cayendo después, más gotas si vas corriendo. Y hay un **tope de sonidos por cuadro**: si se amontonan pasos, fuego, tren y bichos al mismo tiempo, los últimos se saltean en vez de saturar la placa de audio.

El **arroyo** suena en tres bandas que respiran a distinto ritmo —el caudal grave, el roce sobre las piedras y el chispeo de la superficie—, con los filtros corriéndose despacio y borboteos sueltos donde el agua salta una piedra. El **viento** suma un silbido resonante entre las ramas que aparece con las rachas y se corre de tono. Y el **fuego** tiene tres capas: el retumbe grave, el cuerpo medio que ondula y los chasquidos de la leña, irregulares, con su chispa aguda de vez en cuando.

Lo que juntaste se puede **dejar de vuelta en el suelo** con la tecla V: cae a un metro de donde estás, queda ahí y se puede volver a levantar. Y cuando entra algo a la mochila, **su casilla destella** y salta un poco, así ves qué fue lo que juntaste sin tener que mirar los números.

## Los primeros pasos

El juego no explica nada de entrada, pero tampoco te deja a ciegas: hay seis **pistas que aparecen una sola vez**, cuando corresponde. Cuando juntás dos ramitas te cuenta que con tres se hace fuego; cuando llevás tres anotaciones te dice que el cuaderno se abre con J; cuando se hace de noche, lo de la linterna y el dormir junto al fuego; cuando se larga a llover, que los peces pican mejor pero los animales se guardan; y cuando encontrás la estación, cómo se viaja en la trochita. Nunca dos juntas, y quedan guardadas para no repetirse.

## El diario

Cada noche que dormís, el juego escribe solo la página del día en el cuaderno, en la pestaña **Diario**: el tiempo que hizo, dónde anduviste, qué anotaste, qué pescaste, qué te contaron y qué cambiaste en el almacén. Guarda las últimas cuarenta páginas.

## El clima cambia las cosas

Cuando la lluvia arrecia y el cielo se cierra se arma **tormenta**: los relámpagos encienden el valle entero por un instante y el trueno llega después, más grave y más largo cuanto más lejos cayó. Con mal tiempo la fauna se guarda y se ve menos de la mitad de los animales; en cambio el pique mejora, porque los peces comen con la presión baja. Al mediodía despejado, en cambio, cuesta que piquen.

## Cómo se mueve

Las laderas de más de cincuenta grados no se pueden subir: se resbala hacia abajo, y la cámara se inclina un poco mientras dura. Sobre tablones, escalones y andenes no hay resbalón, por empinado que esté el terreno debajo. Al caer desde alto las rodillas amortiguan y la cámara se hunde un instante. Las cuestas se bajan sin temblequeo, y el ritmo de los pasos depende de cuánto avanzás, así que agachado o cuesta arriba suena distinto.

## Calidad y rendimiento

**Bajo techo no se junta nieve**: el piso de adentro de cada construcción está marcado en la textura del terreno, así que en invierno queda la madera y la tierra a la vista mientras afuera está todo blanco; lo mismo con las tablas y los troncos del interior.

**Bajo techo no llueve ni nieva**: dentro del refugio, las cabañas, el almacén, el galpón, el molino, el faro, la cueva o el tren, las partículas de precipitación se apagan, y con ellas la bruma, las aves, las hojas y los rayos de sol del post-procesado.

Los efectos por píxel están **atados a la calidad y a la distancia**: el relieve del suelo se apaga a partir de los cuarenta metros, la luz moteada a los ochenta y cinco, y en Mínima y Baja no se calculan en absoluto.

La **cámara libre de desarrollo** ya no está expuesta en una partida normal. Para QA interno se habilita iniciando el juego con `?debug=1`; recién entonces F4 alterna el vuelo libre.

## Una sola fuente de verdad

Las construcciones se describían dos veces —una para dibujarlas y otra para la física— y cuando los números no coincidían aparecían paredes que no frenan, pisos que no sostienen y suelo invisible en el aire. `src/piezas.js` resuelve eso: cada pieza estructural (piso redondo, piso rectangular, escalón, pared curva, baranda) **se declara una vez y emite la geometría y su colisión en la misma llamada**, con el mismo radio, la misma huella y el mismo hueco de puerta. El faro, el molino, el refugio y las dos cabañas ya están migrados: torres, pisos, escaleras, paredes rectas y muebles salen de ahí, y cada uno tiene su prueba en `pruebas/`.

Las **puertas se abren al empujarlas**: si caminás de frente contra una puerta cerrada, se abre sola con su chirrido, sin tener que apretar E. Y los **muebles frenan**: la mesa, el hogar de piedra y la cama del refugio, y las mesas de la casa de té, ya no se atraviesan. La pieza `mueble` de `piezas.js` dibuja la caja y registra sus cuatro lados como bloqueo hasta la altura del mueble, así que una mesa baja se rodea y una cama baja se puede pisar.

En `pruebas/verificar-fisica.cjs` está el verificador cruzado que compara lo dibujado contra lo que la física sostiene, y en `pruebas/verificar-geometria.cjs` hay un **verificador de geometría**: voxeliza cada malla de construcción, busca sus partes conexas y avisa si alguna quedó flotando sin tocar el resto ni el suelo, con sus coordenadas locales para ir directo a la línea del código. Ignora lo que está sobre el agua, donde flotar es lo correcto. Hoy da limpio.

El panel **F3** muestra, además de los cuadros por segundo, el **peor cuadro de los últimos cinco segundos** y si ese pico vino de la lógica o del dibujo: sirve para saber de dónde viene un tirón en vez de adivinar.


- **Mínima:** para equipos muy justos. Sin sombras, poco pasto y menos distancia de dibujo.
- **Baja:** para notebooks y placas integradas.
- **Media:** el valor por defecto.
- **Alta:** más pasto, sombras más definidas y más distancia de dibujo.

El **virado de color** del atardecer y la noche es apenas un matiz y se puede apagar del todo en los ajustes. En la pausa también podés limitar los cuadros por segundo a 30, 60 o 120, o dejarlo sin límite. Con el límite en 60 la placa trabaja menos y el juego se siente igual.

**F3** abre el panel de rendimiento: cuadros por segundo, el peor 1%, milisegundos de lógica y de dibujo, llamadas de dibujo y triángulos. Si algo va lento, ese panel dice dónde está el problema. Mucho tiempo de dibujo significa que sobra trabajo para la placa (bajá la calidad); mucho tiempo de lógica significa que el cuello está en el procesador.

Por dentro, para que rinda: los árboles lejanos usan una versión simple, las sombras se calculan con siluetas livianas y solo doce veces por segundo, el terreno se dibuja con menos detalle en las calidades bajas y los animales lejos de vos piensan más despacio. Las construcciones se ubican en claros de verdad: buscan terreno llano, lejos de la vía, y al asentarse despejan los árboles y matas que hayan quedado encima (también se apaga su colisión, para que no queden paredes invisibles). Lo mismo hacen los carteles. La vía se dibuja en tramos que se descartan solos cuando quedan fuera de la vista, las plataformas donde se camina (andén, escalones, muelles) están indexadas en una grilla en vez de recorrerse enteras, y lo que tenés delante se revisa quince veces por segundo en lugar de en cada cuadro. El cielo se dibuja al final, así no pinta lo que ya tapan los árboles; el pasto descarta en la placa las hojas que quedan fuera de la vista; cada animal lleva sus partes fijas unidas en una sola malla; el agua simplifica sus ondas con la distancia; y las luces de las casas y del faro solo se encienden si estás cerca.

La calidad se cambia desde la portada o desde la pausa. En la pausa se aplica al volver a la portada.

## Estructura

```
main.cjs, preload.cjs   ventana de Electron y guardado de fotos
armar.mjs               empaqueta todo en index.html (npm run armar)
index.html              el juego completo, listo para abrir
src/
  config.js             tamaño del mundo, lugares y calidades
  terreno.js            cerros, lago, arroyo, sendero y consultas de altura
  materiales.js         viento, estaciones y shader del suelo
  vegetacion.js         especies, sotobosque y distribución por zonas
  pasto.js              pasto en GPU que se aparta al pasar
  agua.js               lago y arroyo
  cielo.js              ciclo del día, nubes, estrellas, cordillera y luces
  estructuras.js        refugio, muelle, puente, mirador y carteles
  objetos.js            cosas para anotar y juntar
  fauna.js              pudúes, carpinteros, chucaos, cachañas y cóndor
  percepcion.js          firma sonora, cobertura y percepción animal
  naturaleza-reactiva.js sombras de contacto económicas para fauna
  ecosistema.js          red liviana entre especies y rutas de escape
  vida.js               huemules, zorros, cisnes, patos, martines, picaflores, bandurrias y truchas
  bichos.js             ciervos, jabalíes, liebres, coipos, cauquenes, panal, mangangás,
                        mariposas y murciélagos
  pesca.js              caña, lance, pique y tensión de la línea
  kayak.js              kayak y remo
  fotos.js              desafíos del álbum
  gente.js              los tres personajes y sus historias
  encargos.js           lo que te piden y cómo se comprueba
  trochita.js           vía, estación y el tren a vapor
  clima.js              lluvia, nieve, hojas, luciérnagas, humo y fogata
  jugador.js            movimiento, colisiones, agua y cámara
  sonido.js             sonido sintetizado del bosque
  cuaderno.js           contenido del cuaderno de campo
  mapa.js               mapa completo, sin niebla de descubrimiento
  main.js               carga, bucle, interfaz y guardado
  plantilla.html        interfaz y estilos
```

Si tocás algo en `src/`, corré `npm run armar` antes de `npm start`.

Las fuentes Spectral y Caveat tienen licencia SIL Open Font License.

**Huellas en nieve:** en invierno, los pasos quedan marcados alrededor del jugador y se van cubriendo cuando vuelve a nevar.



## Cambios clave de RC7

- Catálogo ampliado de 14 a **18 planos** sin cambiar las cuatro categorías existentes.
- Nuevo kit modular: piso 3×3, pared sólida, pared con puerta y pared con ventana.
- Snap geométrico por familias para pisos, muros, cercos y pasarelas; se puede alternar con **N**.
- Recolocación de piezas con **Shift+Y** y confirmación con **Y**.
- La física de cada obra tiene propietario y puede retirarse/reconstruirse de forma determinista; mover o desmontar ya no deja colisiones fantasma.
- Desmontaje seguro con **Shift+Supr**, recuperación parcial de materiales y bloqueo de pisos con dependencias apoyadas.
- Validación OBB para las nuevas huellas precisas, evitando superposiciones de módulos distintos.
- Nueva regresión `verificar-construccion-senior-rc7.mjs`: snap, edición, desmontaje, dependencias y remoción real de colisiones/plataformas por propietario.


## Cambios clave de RC10

- Catálogo ampliado a **30 planos** manteniendo la arquitectura de cuatro categorías y paginación de ocho planos.
- Nuevos **Pared con marco abierto**, **Media pared modular**, **Pared con ventanal**, **Techo a una agua** y **Cubierta plana transitable**.
- Nueva lectura semántica `estadoModulo()`: cada módulo reconoce lados cerrados, accesos, ventanas, cubierta, protección y habitabilidad.
- Las habitaciones modulares completas pasan a responder en `dentro()`, integrándose con mecánicas de refugio existentes sin hardcodear una casa prefabricada.
- El diagnóstico es multinivel y orientado: exige posición, cota, rotación, pieza terminada y borde correcto.
- Una pieza en edición deja de contar como cerramiento hasta confirmar/cancelar, evitando estados lógicos fantasma.
- La media pared no aporta soporte vertical a entrepisos; el marco abierto aporta estructura/acceso pero no finge cierre climático.
- El ventanal ancho registra postigos funcionales; la cubierta plana registra una plataforma física transitable.
- Panel de obra ampliado con diagnóstico en vivo del módulo cercano.
- Nueva regresión `verificar-construccion-ultra-rc10.mjs`, integrada al pipeline principal.


## Cambios clave de RC15

- Copas cercanas con lóbulos secundarios fusionados: más profundidad y silueta sin draw calls adicionales.
- Transición LOD de árboles mediante crossfade dither por distancia, reduciendo el popping al caminar.
- Viento con base del tronco anclada, respuesta progresiva por altura y torsión de copa en ráfagas.
- Nueva locomoción `marchaMamifero()`: quieto, paso, trote y galope con cadencias y rebotes propios.
- Huemul, zorro colorado, pudú y guanaco migrados a la nueva gramática de locomoción.
- Nueva regresión `verificar-naturaleza-cinematica-rc15.mjs`, integrada al pipeline completo.


## Cambios clave de RC16

- Nueva firma sonora del jugador según velocidad, carrera, sigilo, superficie y clima.
- La cobertura del bosque reduce sobre todo la detección visual, manteniendo audición plausible.
- Pudú, huemul, zorro colorado y guanaco comparten una capa única de percepción; aves de suelo también reaccionan a aproximaciones ruidosas.
- Estados de escucha/alerta con escaneo de cabeza antes de la huida.
- Sombras de contacto ligeras para mamíferos nativos principales.
- Mancha de contacto raíz/suelo de árboles mediante instancing y presupuesto cercano de 46 m.
- Nueva regresión `verificar-naturaleza-reactiva-rc16.mjs`, integrada al pipeline completo.


## Cambios clave de RC17

- Nueva red ecológica `ecosistema.js` con doble buffer de un frame para comunicar fauna entre módulos sin acoplar `vida.js` y `bichos.js`.
- Interacción local zorro–liebre: el zorro puede iniciar una persecución breve si el jugador no representa una amenaza mayor; la liebre detecta al zorro y huye en zigzag.
- Huemules en huida muestrean rutas cortas que favorecen cobertura, evitan agua y penalizan pendientes fuertes en vez de correr siempre en línea recta.
- Zorzales y bandurrias reaccionan también a perturbaciones ecológicas/sonoras, no sólo a una distancia fija del jugador.
- Rastros cercanos de huemul y zorro quedan impresos en nieve usando la textura de huellas existente, sin decals ni draw calls nuevos.
- Partículas ambientales de estepa: briznas/semillas secas impulsadas por viento, activadas por la intensidad local de estepa y con presupuesto de corta distancia.
- Nueva regresión `verificar-ecosistema-dinamico-rc17.mjs`, integrada al pipeline completo.

## RC23 · Optimización autodiagnóstica

La RC23 agrega profiling por subsistema en F3, presupuesto continuo de partículas/aves, LOD de pose para NPCs lejanos, consultas de coleccionables sin basura temporal e índice espacial de construcciones dinámicas. Todo conserva las líneas de construcción/hábitat y naturaleza previas.


## RC24 · Optimización anti-tirones

RC24 corrige frame pacing en monitores de alta frecuencia, distribuye tareas pesadas periódicas entre cuadros, difiere autosaves a tiempo ocioso y reduce trabajo redundante del guardado transaccional. El objetivo es mejorar 1% lows y eliminar picos, sin reducir contenido ni calidad visual.

## RC24 Hotfix Runtime

Se corrigió un error crítico de ejecución en fauna (`ReferenceError: m is not defined`) que podía bloquear el juego al iniciar. El hotfix conserva todas las optimizaciones anti-tirones de RC24 y fue validado además con una ejecución real del bundle: arranque, entrada al bosque y varios segundos de gameplay sin excepciones JavaScript.

## RC25 · Bug Hunt integral

RC25 corrige fallos de gameplay/runtime descubiertos después de la optimización RC24: el guardado conserva la altura del jugador, refugios prefabricados validan su volumen vertical, puertas/catres/talleres/estufas apilados respetan la planta correcta, fuego y fogones exigen proximidad vertical y los cambios de preset climático invalidan inmediatamente el temporizador anterior. Saves antiguos sin `pos.y` siguen siendo compatibles. La build mantiene todas las optimizaciones RC20–RC24 y el hotfix de fauna.

