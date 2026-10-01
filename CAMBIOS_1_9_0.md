# 1.9.0 — El sonido y los invasores

Dos cosas: que el juego suene como un juego y no como un sintetizador, y que los
invasores den miedo.

## Antes: por qué sonaba a poco

Todo el audio de Hojarasca se genera por código —no hay un solo archivo de sonido en el
juego, y no lo va a haber—, pero hasta la 1.8 cada golpe era **una sola cosa**: un ruido
blanco pasado por un filtro, o un oscilador que bajaba de tono. Eso alcanza para que se
entienda qué pasó y no alcanza para nada más, porque a un golpe real le faltan las tres
capas que el oído usa para reconocer materiales:

1. **El transitorio.** Los dos o tres milisegundos del contacto. No tiene tono: es un
   chasquido ancho. Es lo que te dice con qué le pegaron.
2. **El cuerpo.** El objeto vibra en sus modos propios, que **no son armónicos**: un
   tronco no suena como una cuerda. Cada modo tiene su frecuencia, su nivel y su tiempo
   de caída, y los agudos se apagan mucho antes que los graves.
3. **La cola.** El aire, la fibra que trabaja, la tierra que se asienta.

## 1. Un motor de golpes con las tres capas

`src/impactos.js` tiene **diez materiales** —tronco, tabla, hueco, piedra, tierra, carne,
quitina, hueso, metal y cristal— y cada uno son sus modos propios, su transitorio y su
cola. Las razones entre modos no salen de la serie armónica: son las que hacen que una
piedra suene a piedra y no a campana. La piedra casi no resuena (75 ms); el metal zumba
un segundo y medio.

El motor (`sonido.impacto`) arma las tres capas y agrega la física que faltaba:

- **El tamaño manda.** Un cuerpo más grande suena más grave y le dura más: la frecuencia
  va con 1/tamaño y el tiempo de caída con la raíz. El mismo material sirve para una
  tabla y para el tronco que se viene abajo.
- **La fuerza del golpe cambia el timbre, no sólo el volumen.** Un golpe fuerte despierta
  los modos de arriba; uno flojo deja sólo el fundamental. Por eso un hachazo suave suena
  sordo y uno fuerte chasquea.
- **Dos golpes nunca son el mismo golpe.** Cada uno corre un poco las frecuencias, y para
  lo que se repite mucho hay una **ronda** que no repite hasta agotar la vuelta. Es lo que
  saca el efecto de ametralladora.

Con eso se rehicieron el hachazo (el filo de acero, el tronco resonando, la fibra
abriéndose y el cabo devolviendo el golpe a la mano), el árbol que cae (los crujidos que
se aceleran, el arrastre entre las ramas, y el impacto en tres tiempos: copa, tronco y
tierra, con milisegundos entre sí), y el banco entero del Desafío: arco, ballesta, honda,
pistola de plasma, disparo cargado, martillo, murallas golpeadas, derrumbes.

## 2. La voz de los invasores

`src/voz-alien.js`. Un gruñido no es un oscilador bajando de tono. Lo que da miedo son
cuatro cosas que hace cualquier garganta grande y ninguna hacía el juego:

- **El subarmónico.** Los animales grandes meten un segundo tono una octava abajo que
  late contra el primero. El oído escucha dos voces en un cuerpo y no sabe cuántos son.
  Es el truco más viejo y el que más funciona. El jefe del nido es casi todo subarmónico.
- **La aspereza.** Una modulación en anillo de 17 a 72 Hz rompe el tono en granos: eso es
  el gruñido. Más arriba de 90 Hz deja de ser gruñido y pasa a ser zumbido.
- **Los formantes.** Tres filtros resonantes en las frecuencias de una garganta y una
  boca. Sin esto el ruido es ruido; con esto el ruido tiene cuerpo, y el cuerpo tiene
  tamaño. El primer formante del jefe está en 124 Hz y el del saltador en 720: por eso
  uno suena enorme y el otro suena a insecto.
- **El desorden.** Un temblor irregular y una saturación que dobla en vez de recortar,
  como una garganta forzada.

Hay **siete gargantas** (rastreador, tirador, saltador, escupidor, bruto, jefe y el nido)
por **ocho estados** (acecho, alerta, ataque, dolor, muerte, llamado, respiración y
latido). El estado cambia el tono, la duración, la aspereza y la saturación a la vez: la
muerte, además, **desarma** la voz antes de apagarla.

Y la distancia no es bajarle el volumen: de lejos el aire se come los agudos, la cola
crece, lo grave se agranda y el sonido **llega más tarde** (340 metros por segundo). A
noventa metros el grito del jefe es un temblor en el pecho. Están los dos archivos para
comparar en `pruebas/salidas/sonidos/`.

## 3. El valle de noche

Lo que asusta no es el invasor que tenés adelante: es saber que hay otros y no saber
dónde. De noche, y sólo de noche, suenan solas tres cosas, ninguna en un ritmo parejo
—la espera es la mitad del asunto—:

- **el acecho** de alguno que está a más de 38 metros, que llega como un temblor y no
  como un grito;
- **la respiración** del que se te puso a menos de siete metros y todavía no viste;
- **el latido del nido**, si andás a menos de setenta metros del lugar donde está
  enterrado. Se escucha aunque no lo hayas marcado en el mapa todavía: lo sentís antes
  de saberlo.

## 4. Los ojos que te encuentran

Los invasores tienen ahora **la piel casi la mitad de oscura** que antes, y de noche el
cuerpo se apaga con la distancia hasta quedar en sombra. Lo primero que se ve de un
invasor ya no es el invasor: son los ojos.

Y los ojos no brillan todo el tiempo —eso sería una linterna—: **se prenden cuando te
tiene de frente y cerca**, dentro de un cono de unos 43 grados y hasta 46 metros, y se
apagan cuando gira la cabeza. Suben rápido y bajan despacio, como una brasa, porque un
parpadeo no da miedo. Cada tipo tiene su color: el jefe los tiene rojos.
La cuenta vive en `src/mirada.js`, que es puro y se prueba exacto.

## Lo que no se hizo

Pediste que copiara sonidos de otros juegos o de internet. Eso no lo hago: son de alguien
y usarlos sin permiso te deja un juego que no podés publicar. Además rompería lo que hace
raro a Hojarasca —que el bosque entero, el sonido incluido, se genere por código— y el
`index.html` de un solo archivo que funciona sin conexión. Todo lo de arriba es síntesis,
y para mí suena mejor que una biblioteca de efectos comprada.

## Cacería de bugs sobre lo recién hecho

Antes de cerrar la versión revisé lo nuevo buscando lo que se rompe. Aparecieron seis
cosas, todas arregladas y todas con su prueba para que no vuelvan:

1. **El juego se caía si un invasor moría antes del primer clic.** El motor de audio
   recién existe cuando el jugador toca algo, y `fuente()` —que arma la posición de un
   sonido en el espacio— no lo controlaba: `Cannot read properties of null`. Ahora
   devuelve nulo y todo el banco lo aguanta.
2. **Un árbol cayéndose armaba 397 nodos de audio en un solo cuadro**, que es un tirón
   justo en el momento más lindo del juego. Los golpes de relleno —los crujidos de la
   fibra, las tablas de un derrumbe— van ahora con dos modos y sin cola, y con tope:
   **397 → 145**, y el derrumbe **157 → 73**. Se mide en la prueba.
3. **El tope de voces contaba por llamada y no por momento**, así que un sonido largo
   pedía veinte golpes en un cuadro y el tope se comía la mitad: el árbol sonaba mocho.
   Ahora cada ventana de 50 ms lleva su propia cuenta y no se pierde ninguna capa.
4. **Los ojos del jefe le pintaban el punto débil.** Sus ojos son rojos y los sacos de la
   espalda son lo que hay que reventar: tienen que leerse verdes. El color de los ojos ya
   no se le suma al punto débil.
5. **Los invasores se reciclan entre oleadas** y `reiniciar()` no apagaba la mirada: el
   que bajaba de nuevo a sesenta metros aparecía con los ojos prendidos porque el
   anterior te estaba mirando.
6. **El parámetro de hondura del hachazo estaba muerto.** Ahora sí: cada hachazo suena
   más hondo que el anterior, porque la muesca se abre y el tronco responde más grave.

Y una de paso: el coro del valle filtraba la lista de invasores en cada cuadro. Ahora
arma listas sólo cuando toca sonar, que es cada varios segundos.

## Pruebas

- `pruebas/verificar-sonido.mjs`: los diez materiales (que los modos no caigan en
  armónicos, que los agudos se apaguen antes, que nada se vaya del rango audible), las
  siete gargantas, la distancia y el cono de la mirada. **Entra al gate.**
- `pruebas/render-sonidos.cjs`: **renderiza los 32 sonidos a archivos .wav** para poder
  escucharlos, y mide pico, RMS, arranque y cuánta energía hay abajo de 120 Hz. No es una
  maqueta: le pasa un OfflineAudioContext al motor del juego y dispara los mismos métodos
  que dispara el juego. Falla si algo quedó mudo o pegado al tope. `npm run sonidos`.
- `pruebas/humo-invasores.cjs`: partida real. Los ojos se prenden cuando el bicho te mira,
  el cuerpo se apaga de lejos, las seis gargantas arman su cadena de audio, el banco
  entero se dispara sin romperse, y el valle habla de noche y se calla de día.
- `pruebas/render-invasores.cjs`: fotos de los seis tipos, de día y de noche.

## Lo que sigue sin probarse

**Cómo suena y cómo se ve.** Las pruebas corren en una ventana oculta, sin placa de video
y sin parlantes: puedo medir que un sonido tiene la energía y la forma que corresponde,
no que sea lindo. Y las fotos de los invasores salen mal —el renderizador por software
dibuja blanco el shader del esqueleto—, así que del aspecto nuevo lo único que verifiqué
son los números.

Escuchá los .wav y decime. Lo más probable que haya que tocar: **si la piel quedó
demasiado oscura de día**, que es lo que no puedo ver.
