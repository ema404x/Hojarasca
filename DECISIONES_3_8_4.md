# Decisiones del usuario para la 3.8.4 (09-10-2026), sin hacer todavía

Salen del pase de bugs de la 3.8.3. El usuario pidió **dejarlas para después**: no trabajarlas hasta que lo diga.
La rama `v384` (worktree `trabajo/t384`) tiene un arranque parcial de las primeras, cortado a mitad: revisar antes de
seguir (puede convenir empezar de nuevo desde main).

## A hacer
1. **Caballo con su nombre:** los ~60 textos que dicen «el zaino» usan su nombre; sin nombre, «el zaino» si es zaino o
   «tu caballo». Una sola función para nombre y artículo.
2. **Acopio:** al desarmar el último acopio, lo guardado vuelve a tus cosas (con nota).
3. **Kayak:** guarda su lugar sólo si quedó amarrado; si no, vuelve al muelle.
4. **Sulky:** mantener S frena hasta parar.
5. **Récords del sin fin:** top 10 por dificultad; la dificultad no se cambia a mitad de corrida; migrar los viejos.
6. **Caballo y puentes colgantes:** no cruza, pero al llegar se puede amarrar ahí o mandarlo solo al refugio
   (E y aviso en el mismo orden; se guarda).
7. **Siestas en la cucheta del tren:** una por viaje.
8. **Portada compacta en pantallas bajas** (≤ ~820 px de alto): título más chico y teclas detrás de un botón «Teclas»;
   todo entra sin desplazar a 1366×768 y 1280×720.
9. **Truco:** irse al mazo con el truco querido da lo querido (2/3/4), no +1.
10. **Rehacer la vida:** pasada una estación de la separación, se puede enamorar de otra persona; el anillo deja de
    figurar como «dado». La reconquista sigue.
11. **Clase de baile:** una por día aunque salgas con Escape.
12. **Locomotora:** un solo nombre en el taller y en Personalizar; gana el último.
13. **Noche 20:** si caés con el Coihue en pie, el asedio arranca al alba, no en el momento.
14. **Caer de día:** la noche que se saltea cuenta como perdida.
15. **«El puente cedió»:** si el tobillo de Nicanor ya pasó, el seguimiento cuenta otra cosa.
16. **Panel de la historia:** muestra las teclas configuradas, no las de fábrica.
17. **Dos pantallas de escala distinta:** la resolución se ajusta sola al pasar de una a otra.
18. **Chinchón como se juega en casa:** no se puede tirar la misma carta que levantaste del pozo; al cortar, el otro
    acomoda sus sueltas en tus juegos.
19. **Batea:** las sobras nunca usan fruta fina (calafates, frutillas ni lo que vale más).
20. **Frutales:** tope de 24 (antes 16).
21. **Vagones:** si no elegiste ninguno, sale sólo la locomotora (Martín avisa que vas sin carga).
22. **Estación fijada en Ajustes:** los frutales siguen la estación fijada.
23. **Rueda de la charla:** lo de los rincones va a una sección propia «Hacer juntos».
24. **Tren varado en la nieve sin quitanieves:** te podés bajar y seguir a pie (el tren espera a la cuadrilla).
25. **Visitante que guiás:** se queda hasta terminar el recorrido aunque pase la medianoche.
26. **Amor apagado:** las habilidades de la pareja siguen subiendo mientras está apagado (sin saltos raros al prenderlo).
27. **Ladrón trabado:** pasado su tiempo de huida suelta lo robado aunque esté trabado.
28. **Tope de 4 robos por noche:** se guarda en la partida (no se reinicia al recargar).
29. **Caer y cerrar durante el fundido:** la caída se anota en el momento; cerrar no la evita.
30. **Fotos del álbum en archivos aparte** (carpeta de la partida), preparando el guardado en la nube de Steam.
31. **Bugs chicos sin preguntar:** soltar con V que se pierde al recargar; la página del diario del día que no se
    guarda; el panel de cocina con el dato de techito viejo; clic en el puesto de cargas que no mueve la marca del mando;
    el cantero que toma el primero y no el más cercano; el concurso sin fallo si el día cambia sin pasar por las 17;
    la cita que vence como «plantada» si ella está ocupada; el nido de hongos que se quemaba al guardar vuelve entero.

32. **La Cueva de las Manos se reemplaza por «El alero del arriero»:** alero con pirca baja, fogón renegrido y la
    pared con nombres y fechas tallados por los arrieros y colonos que pasaban («J. Miranda 1911», «Los Sepúlveda
    pasaron acá»); una herradura vieja. Cuaderno: ahí hacían noche los arrieros que cruzaban la hacienda a Chile. El
    pedido del vecino en la aldea (`aldea-vida.js` ~230, hoy «Me contaron de una cueva con manos pintadas…») pasa a
    algo como «Mi abuelo dice que su nombre está tallado en una cueva. ¿Me lo buscás?». Tocar: `estructuras.js`
    ~2533 (lugar y cartel), `cuaderno.js` ~311, `aldea-vida.js`, los textos en inglés (`idioma-en-*.js`) y las
    pruebas que nombren la cueva. Partidas viejas: la entrada del cuaderno ya anotada pasa a la nueva.
    **Sí (usuario):** uno de los nombres tallados es del abuelo de un vecino de la aldea (p. ej. el de Martín
    Sepúlveda, el del taller del tren), y eso arma una historia chica: el vecino te pide buscarlo y, al encontrarlo,
    te cuenta de su abuelo arriero.

33. **Las voces de los vecinos dan miedo** (el usuario no las quiere así). Quiere un **murmullo humano más cálido**:
    voces más suaves y cortas («mm», «ah», una risita), que nunca den miedo. Revisar primero si la 3.8.0 lo empeoró:
    el equipo textos cambió `sonido.js` («el motor corta la voz en sílabas») para los duendes; comparar contra la
    3.7.5 (`git show v3.7.5:src/sonido.js`). Que los duendes conserven su voz propia. Escucharlo renderizado
    (`render-sonidos.cjs`) y pedirle al usuario que lo escuche antes de cerrar.

34. **El silbato de la trochita suena a código genérico.** El usuario quiere que suene igual a un ferrocarril antiguo
    real: **silbato de vapor, por código** (sin grabaciones): varias campanas afinadas en acorde, soplido de vapor,
    arranque que sube de tono con la presión, corte con el vapor que se escapa y eco en el valle. Los silbatos que
    se eligen en Personalizar/taller (simple, doble, etc.) se rehacen todos con esa base. Renderizarlo y que el
    usuario lo escuche antes de cerrar; si no convence, recién ahí hablar de una grabación (rompe «todo por código»).

35. **La calidad gráfica nunca cambia sola durante el juego.** Si va lento, aparece un cartelito «El juego va lento:
    ¿bajar la calidad?» con «Bajar» y «No, gracias»; si dice que no, no vuelve a preguntar en esa sesión. La primera
    vez que se abre el juego sí elige según la placa (como hoy) y avisa cuál eligió. Revisar todo lo que hoy baja la
    calidad o la distancia de dibujo sola (modo Auto, `calidad*.js`, la recuperación del contexto 3D) y dejarlo como
    aviso. Ojo: si se pierde el contexto 3D y hace falta bajar para que el juego no se caiga, avisar igual.

35. **La calidad gráfica nunca cambia sola durante el juego:** si va lento, cartelito «El juego va lento: ¿bajar
    la calidad?» con «Bajar» / «No, gracias» (no vuelve a preguntar en la sesión). La primera vez elige según la placa
    y avisa cuál. Si se pierde el contexto 3D, baja sola y avisa (el usuario lo aprobó).
36. **Menús más prolijos: el usuario eligió el estilo A · Cuaderno de campo** para todos los menús (portada, pausa,
    Ajustes/Personalizar y paneles): papel crema, letra de pluma, trazos de pincel, sobre el sistema común de la rama
    `proto-menu` (src/proto-menu/base.css + menu-A.css: escala de letra y espacios, un solo botón, un panel en 3
    anchos, todo entra a 1366×768). En la portada, sólo las 6 teclas básicas; las 33 en «Controles». Falta: la versión
    abajo a la derecha, capturas del almacén, la cocina, el taller y la rueda.

## Lugares nuevos en el valle (elegidos por el usuario, 09-10) — para sus versiones nuevas
- **Termas en el bosque:** pozones de agua caliente entre coihues, con vapor; en invierno, con nieve, te metés,
  descansás y se te va el frío.
- **Cascada escondida con poza:** detrás de un cañadón, poza turquesa; arcoíris en la bruma a la mañana; en verano
  te bañás.
- **Islote del arrayanal:** en el lago, bosquecito de arrayanes canela con pasarela de madera; se llega en kayak o
  velero.
- **El puesto abandonado:** casa y corral de un colono que se fue, con cosas que cuentan su historia; se puede
  arreglar y usar de refugio.
- **Ventisquero y laguna de deshielo:** hacerlo **visible** arriba del cordón (glaciar colgante, laguna turquesa),
  pero **sin poder subir por ahora**: queda para un **futuro DLC**.
- **El mirador del cóndor:** una piedra alta sobre el cañadón donde planean cóndores a media mañana; si te sentás a
  esperar, pasan cerca. Lugar de fotos.
- **La pasarela del humedal:** sendero de tablones sobre un turbal con musgos rojos y drosera (la plantita que come
  insectos); cambia con cada estación.
- **El bosque de pehuenes:** ladera de pehuenes centenarios; en otoño se juntan piñones (para cocinar o regalar).
- **El árbol viejo del valle:** un alerce o coihue de mil años con una placa de la aldea; los vecinos van de picnic y
  en las fiestas lo adornan.
- No mover árboles ni cambiar la huella del terreno sin avisar.

## «La aldea viva» — una versión entera (elegida por el usuario, 09-10)
Todo marcado por el usuario:
- **Diálogos:** que hablen de lo que pasa (tiempo, estación, fiestas, lo que construiste, lo de ayer, la noche de los
  duendes); la historia propia de cada vecino en varias partes que se abre con la amistad (pasado, secreto, sueño);
  charlas entre ellos que escuchás al pasar (chismes, discusiones, chistes), a veces te meten; que recuerden lo que
  hiciste (regalos, favores, peleas, faltar a la fiesta) y lo mencionen días después.
- **Interacciones:** hacer cosas juntos (pescar, leña, cocinar, ayudar en su trabajo, caminar); pedir y dar consejos
  con decisiones que cambian cómo sigue; enseñar y aprender (oficios, recetas); bromas, abrazos y gestos (consolar,
  festejar).
- **Libre albedrío:** necesidades como en Los Sims (hambre, sueño, charla, diversión) que deciden qué hacen en vez de
  un horario rígido; amistades y roces entre ellos que se visitan; iniciativa con vos (te buscan, te visitan en el
  refugio); que usen el mundo (lago, mirador, termas, cascada, huerta comunitaria).
- Ojo: ya existen la rueda social de la 3.7.4 (30 interacciones, humor y deseos, iniciativa) y los horarios de la
  3.6: construir sobre eso, no de cero. Cuidar el rendimiento con 20+ vecinos y que la E y el aviso sigan alineados.

## La primera hora de juego (elegida por el usuario, 09-10)
- **Llegada con escena:** llegás en la trochita y en la estación **te recibe la abuela Herminia**, que te acompaña al
  refugio (queda armado el lazo con la leyenda de los duendes).
- **Primeros días guiados:** 3–4 días en los que un vecino te pide cosas simples (leña, fuego, huerta, ir a la aldea)
  que enseñan el juego sin carteles de tutorial.
- **Menos carteles juntos:** teclas y avisos de a uno, cuando hacen falta.
- **Regalo temprano: el perro** (cachorro que te sigue desde el primer día).

## La noche de los duendes, más (elegida por el usuario, 09-10)
- **Más tipos de noche:** niebla, luna llena con los viejos, la de los ladrones (sólo traviesos que roban), tormenta.
- **Duendes nuevos:** p. ej. uno que se esconde en los árboles, uno que apaga las antorchas, uno que cura a los demás.
- **Defensas nuevas del bosque:** trampas de miel, espantajos con campanitas, faroles que encandilan.
- **Aliados de la aldea en las noches grandes:** Anselmo arregla defensas rotas; la abuela Herminia prende faroles y
  fogones que espantan a los viejos; Martín pasa con la trochita tocando el silbato y dispersa a los traviesos; los
  chicos tiran piedras con hondas desde la empalizada (sin correr peligro).
- **La primera noche tiene que dar miedo desde el principio:** mucho clima y tensión aunque sean pocos.

## Versión de pulido visual «pronto» (el usuario: «en una versión pronta»)
- La lechuza (tosca), las raíces del cofre del alba (parecen patas), el Rey Duende con piel por huesos (hoy rígido),
  la corteza del Coihue de noche de lejos.

## Quedan como están (decidido)
- Comercio entre paradas (comprar en una y vender en otra deja ganancia).
- Deshacer y rehacer una etapa de obra.
- Amistad de la taba con «Otra vez».
- Campamento desde las 19:30.
- La granada propia gasta las placas doradas.
- Los refuerzos de madrugada no respetan la noche especial.
- Damas a la española (comen sólo para adelante).
- **Menús con joystick (Steam Deck): no por ahora.**

## Steam (decidido 09-10)
- **Acceso anticipado** (Early Access).
- Título **«Hojarasca»** sin traducir, con una bajada en inglés (p. ej. «A cozy Patagonian life»).
- **Demo:** la primera estación del Relax + las primeras **5 noches** de La noche de los duendes; la partida pasa al
  juego completo.
- **Precio:** 12–15 USD, con precios regionales.
- **Hoja de ruta del acceso anticipado:** las versiones nuevas del usuario (no prometer idiomas, joystick ni otros).
- **Duración hasta la 1.0:** sin fecha.
- **Logros y nube de Steam desde el lanzamiento.**
- **Idiomas al salir:** castellano e inglés completos.

## Versiones nuevas antes de congelar (09-10)
- **3 o 4 versiones.** Quiere que crezcan las cuatro áreas: **la primera hora de juego**, **La noche de los duendes**,
  **la vida en la aldea** y **el paisaje y los animales**. El detalle de cada una lo decide él (preguntarle, con
  opciones; no proponer ideas rechazadas).

## Para antes de Steam
- Inglés completo al final, después de las versiones nuevas (≈400 textos de la 3.1 + lo de la 3.7).
