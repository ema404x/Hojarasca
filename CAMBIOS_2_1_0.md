# Hojarasca 2.1.0 — Diez mejoras más

Cinco para el Relax y cinco para el Desafío. Como siempre, todo generado por código: los
cantos del grabador son los mismos sintetizadores del juego, sin grabaciones de afuera.

## Relax

1. **El grabador de cantos.** Un grabador de casete que se consigue en el almacén (dos
   frascos de dulce de frutilla y dos plumas). Clic justo después de que cante un ave que
   ya anotaste: queda grabada. Clic cuando no canta nada: suena lo grabado y contesta la
   más cercana, diciendo de qué lado. El carpintero se muda a un árbol cerca tuyo y la
   bandada de cachañas te pasa por arriba; el concón contesta sólo de noche. Nueve aves se
   pueden grabar, y la ficha del cuaderno avisa «Tenés su canto en el grabador».
   (`grabador.js`)
2. **Rastros que se pueden seguir.** Cada tanto aparece cerca una hilera de huellas de
   huemul, pudú, guanaco, zorro o liebre, dibujadas en el suelo con su forma (pezuña
   partida, almohadilla y dedos, las cuatro marcas de la liebre). Parado encima, E las
   mira: la primera vez se anotan en una sección nueva del cuaderno, «Rastros», y siempre
   dicen para dónde van. Al final está el animal; si se movió, el rastro se alarga. La
   lluvia las borra más rápido. (`rastros.js`, `rastros-malla.js`)
3. **El tiempo que se ve venir.** El clima decide su próximo cambio con anticipación: la
   lluvia entra del oeste y las nubes se ven cargar sobre la cordillera un par de horas
   antes. Los vecinos lo anuncian al saludar, cada uno a su manera (a Ercilia le duelen
   las rodillas; Elsa mira el humo de la máquina). Si acertaron, queda en el diario.
   (`pronostico.js`, `clima.js`, `cielo.js`)
4. **Lo que llega y lo que se va.** Cada ficha de fauna dice cuándo se la ve («De
   primavera a otoño. En invierno se va al norte»). En otoño pasa alta una V de trece
   cauquenes rumbo al norte; al llegar el invierno el juego avisa quiénes se fueron, y cuando
   termina, quiénes volvieron. (`almanaque.js`, `fauna.js`)
5. **De la huerta a la mesa.** Cuatro frutillas al fuego hacen un frasco de dulce; cinco
   calafates o tres llao llao se secan en el tendal en medio día de sol (la lluvia lo
   frena). El llao llao, una vez anotado, se puede juntar. Las conservas se cambian en el
   almacén —por el grabador y por unas botas de goma que cruzan el arroyo sin chapotear—
   y en invierno se abren junto al fuego. (`conservas.js`, `trueque.js`)

## Desafío

6. **Rescates.** Desde la noche 3, algunas noches atacan el lugar de un vecino: el puesto
   de Don Ramón, la cabaña de Nicanor, el almacén de Ercilia o la estación de Elsa. El
   juego avisa hacia dónde. Si vas y aguanta hasta el amanecer, el vecino agradece con
   materiales y algo suyo (Don Ramón se suma a tu base, Nicanor deja flechas, Ercilia
   emplastos, Elsa cristales). Si cae, no te habla por dos días. Una oleada entera tira el
   lugar en unos dos minutos, así que llegar corriendo desde la base alcanza.
   (`desafio-valle.js`)
7. **El excavador.** Un invasor nuevo desde la noche 7: bajo, color de tierra, con brazos
   como palas. No rompe la empalizada: se mete bajo tierra y sale adentro, cerca tuyo, y
   al salir queda aturdido un momento. Se lo oye cavar. Contra él hay una defensa nueva,
   la losa de piedra (O → Defensa): donde hay losa, no puede asomar.
8. **Un jefe distinto cada vez.** El de la noche 5 es el de siempre; el de la 10 llama
   refuerzos; el de la 15 es una sombra que sólo se ve con la linterna (o al pegarle); el
   de la 20 se queda lejos y tira piedras a las defensas y a vos. Después, vuelven a
   rotar.
9. **Los restos se recorren.** La nave caída ahora es un casco con un pasillo de tres
   cámaras: placas en el piso que dan descargas (se pasan cuando están apagadas),
   invasores dormidos (agachado no se despiertan) y el premio al fondo.
10. **La forja de cristal.** Una pestaña nueva en el taller (K): lanza de hielo (congela a
    los rápidos), flechas de rayo (el rayo salta a los dos más cercanos; se hacen junto
    al banco de trabajo) y honda de empuje (derriba a tiradores y escupidores).

## Arreglos que aparecieron en el camino

- **El juego armado no arrancaba.** Una constante con eñe en el nombre (`TODO_EL_AÑO`)
  pasaba todas las pruebas en Node, pero el armador reconoce los nombres con `\w` y en el
  `index.html` quedaba cortada en `TODO_EL_A`. Se renombró y la verificación ahora revisa
  que nada que se exporte o se importe lleve acentos ni eñes.
- El carpintero llamado con el grabador a veces «venía» alejándose: sólo se posaba en
  18 árboles separados 45 m entre sí. Ahora elige el árbol adecuado más cercano, y nunca
  uno más lejos que donde estaba.
- Al grabador sólo le contestaban los carpinteros que se estaban dibujando (los lejanos
  se ocultan para ahorrar), y las cachañas sólo si la bandada justo pasaba. Ahora
  contesta cualquiera que esté al alcance del oído, y las cachañas desde algún lado del
  valle, antes de venir.
- Las pruebas en Electron llevan `--no-sandbox` también cuando se corren sueltas (la
  suite ya lo pasaba): lanzadas desde las herramientas, con el sandbox no cargaban.
- En la primera versión de los rescates, trece invasores tiraban el puesto en diez
  segundos. Ahora el daño corre por tiempo y crece con la raíz de cuántos atacan.
- Si morías en una noche de rescate, el rescate quedaba abierto hasta la noche
  siguiente. Ahora se cierra (sin premio, y sin enojo si el lugar no había caído).
- La piedra del jefe artillero no hacía ruido ni polvo cuando te pegaba de lleno.
- En el almacén sólo se podían elegir los cuatro primeros cambios con el teclado, y no
  se podía hacer clic: la yerba nunca se pudo conseguir. Ahora van del 1 al 8 y se puede
  hacer clic.
- Las fichas del cuaderno de las cosas cambiadas en el almacén decían «undefined».
- El aviso de restos de nave salía mal en inglés («Wreck of a to the north ship»), y
  tres fichas largas del cuaderno (la Cueva de las Manos, el galpón de esquila y el
  molino) seguían sin traducir.

## Inglés

Tanda L del diccionario: todo lo nuevo de la 2.1, incluidos los pedazos que caen en los
huecos de los moldes (nombres de aves y de huellas, lugares del valle, los jefes, las
combinaciones del almanaque). Los textos con paréntesis de la guía se cargaron a mano,
porque el extractor los descarta.
