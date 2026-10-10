# Hojarasca 3.8.4 — Las decisiones de la 3.8.3

Las 36 decisiones que tomó el usuario sobre lo que dejaron los equipos de la 3.8.3 (`DECISIONES_3_8_4.md`, "A hacer").
Cuatro equipos en paralelo (ramas `v384-relax`, `v384-desafio`, `v384-sonido`, `v384-pantalla`) y la integración
`v384-junta`.

## Relax
- **Tu caballo** usa su nombre («el zaino» o «tu caballo») en todos lados donde ya es tuyo.
- **Acopio:** al desarmar el último, lo guardado vuelve a tus cosas (también en el desalojo de la aldea).
- **Kayak:** queda amarrado en su embarcadero; suelto en una orilla, vuelve al muelle.
- **Sulky:** mantener S frena hasta parar.
- **Caballo y puentes colgantes:** se planta en el estribo; la E ofrece mandarlo al refugio o amarrarlo ahí.
- **Siesta en el tren:** una por viaje.
- **Truco:** irse al mazo con el truco querido cobra lo querido, sin el +1.
- **Rehacer la vida:** pasada una estación desde la separación te podés enamorar de otra.
- **Clase de baile:** una por día, aunque salgas con Escape.
- **Locomotora:** un solo nombre entre el taller y Personalizar.
- **«El puente cedió»:** si el tobillo de Nicanor ya pasó, la tarjeta cuenta otra cosa.
- **Teclas:** el panel de la historia y el aviso muestran las teclas que configuraste.
- **Chinchón:** la carta del pozo no se tira en la misma vuelta; al cortar, el otro acomoda sus sueltas.
- **Batea:** sólo papas, habas, manzanas, peras y ciruelas.
- **Frutales:** tope de 24; siguen la estación fijada en Ajustes.
- **Vagones:** sin vagones enganchados sale sólo la locomotora y Martín avisa.
- **Rueda de la charla:** sección propia «Hacer juntos».
- **Tren varado en la nieve:** «Bajarte y seguir a pie», con tu caballo.
- **Visitante que guiás:** se queda hasta el día siguiente y se guarda.
- **Amor apagado:** las habilidades suben una por estación, sin avisos.
- **Fotos del álbum** en archivos aparte (`partidas/<partida>/fotos/`), ya no en el guardado del navegador.
- **Bugs chicos:**
  - lo soltado con V vuelve al cargar;
  - la página del diario de hoy se guarda;
  - el panel de cocina mira el techito;
  - el clic en las listas mueve la marca del mando;
  - la huerta comunitaria toma el cantero más cercano;
  - el concurso sin fallo se falla;
  - la cita con ella ocupada se cae sin «plantada»;
  - el nido de hongos a medio quemar sigue quemándose.

## La noche de los duendes
- **Récords del sin fin:** 10 por dificultad; la dificultad queda fija durante la corrida; los récords viejos se migran solos.
- **Noche 20:** si caés con el Coihue en pie, el asedio arranca al alba.
- **Caer de día:** la noche que se saltea cuenta como perdida («Se te pasó la noche N»).
- **Ladrón trabado:** suelta lo robado cuando se le acaba el tiempo de huida.
- **Tope de 4 robos por noche:** se guarda en la partida.
- **Caer y cerrar durante el fundido:** la caída se anota en el momento.
- **Pulido visual:**
  - lechuza rehecha como un concón;
  - el cofre del alba brota de un montículo con raíces que se van por el suelo;
  - el Rey Duende con piel por huesos (codos que se doblan);
  - la corteza del Coihue de lejos y de noche.

## Contenido y sonido
- **El alero del arriero** reemplaza a la Cueva de las Manos, en el mismo lugar: pirca baja, fogón renegrido,
  nombres y fechas tallados y una herradura. Martín te pide buscar el nombre de su abuelo Fermín, arriero, y
  cuando lo encontrás te cuenta su historia. Las partidas viejas pasan lo anotado al alero.
- **Voces de los vecinos:** murmullos cortos y cálidos («mm-hm», «a-há», una risita) en vez del balbuceo hueco con
  temblor que daba miedo (venía de la 3.7.4). El murmullo de la plaza usa la misma voz. Los duendes conservan la suya.
- **Silbato de vapor:** campanas afinadas en acorde, soplido al abrir, tono que sube con la presión, corte con el
  vapor escapándose y eco del valle; rehechos todos los silbatos de Personalizar y del taller.

## Pantalla y menús
- **La calidad nunca cambia sola:** si va lento pregunta «El juego va lento: ¿bajar la calidad?» («Bajar» / «No,
  gracias»); la primera vez elige según la placa y avisa; si se pierde el contexto 3D baja un escalón y avisa. El
  presupuesto adaptativo ya no acorta pasto ni sotobosque.
- **Portada compacta** en pantallas de 820 px de alto o menos (título más chico, las teclas detrás de «Teclas»).
- **Dos pantallas de escala distinta:** la resolución se acomoda sola.
- **Menús «Cuaderno de campo»** para todo: portada, pausa, Ajustes, Personalizar, modales y paneles del HUD. Todo
  entra a 1366×768; en la portada las 6 teclas básicas y en Controles todas.

## Pruebas
- Nuevas: `verificar-3-8-4-relax`, `-desafio`, `-alero-sonido` y `-pantalla`.
- Pruebas viejas ajustadas por cambios a propósito; cada equipo lo detalla en su commit.
- Partidas reales de cada equipo en verde, de a una.
- `humo-3-7-4-rueda` falla de vez en cuando por tiempo (captura `UnknownVizError`) y pasa sola.

## Queda para después
- **Para que mire el usuario:**
  - escuchar las voces y los silbatos (`pruebas/render-sonidos.cjs`);
  - confirmar la estación y la calidad en la tira de la portada;
  - confirmar la E en lugar de la P entre las 6 teclas;
  - decidir si una noche perdida por caer de día es justa.
- **Sin probar de punta a punta en partida real:** la historia de Martín y el cambio de pantalla con dos monitores.
- **Inglés:** de los textos nuevos, para el final.
