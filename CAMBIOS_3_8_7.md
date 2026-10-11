# Hojarasca 3.8.7 — Segundo pase de bugs

Cinco equipos con zonas nuevas (ramas `v387-q1` a `q5`), más la integración `v387-junta`:
- progreso del Relax;
- construcción y obras;
- la aldea, segunda mirada;
- La noche de los duendes y la memoria;
- el mundo, el movimiento y la interfaz.

El usuario resolvió las decisiones de diseño que quedaban del pase anterior.

## Decisiones del usuario
- **Chinchón:** el comodín suelto del que no cortó no se acomoda: cuenta 25 en contra.
- **Viento:** al voltear una obra devuelve lo mismo que desarmarla (lo que costaba 1 no vuelve).
- **Fuegos:** hasta 4 a la vez, cada uno se consume por su cuenta y se guardan con su obra.
  - Con 4 prendidos, el nuevo apaga el de menos leña.
- **Siesta junto al fuego:** lo baja según lo dormido.
- **Invitaciones de los vecinos** («¿Un mate?»): se puede decir «Dale» o «Ahora no», sin ofensa.
- **Construir con el mando:** queda para la preparación de Steam.

## Lo más grave
- **Duendes trabados** toda la noche en la orilla del río: de 1 a 9 por noche. Ahora esperan y vadean el río, y el
  lago se rodea.
- **Portada:** volver a la portada y entrar de nuevo repetía el arranque (rehacía el mapa del Desafío y te llevaba a
  la base).
  - La música de tensión del Desafío y el ambiente «de adentro» quedaban sonando.
- **Capítulo 8:** el temporal volvía a salir cada medio segundo y cobraba cada vez, y el final se tildaba a
  medianoche en plena tormenta.
- **La gente de las fiestas** se trababa contra la mesa larga, el fogón y la leñera, y aparecía de golpe a los 12 s
  (unos 40 saltos por día). El vecino que te viene a buscar cruzaba las paredes.
- **Plaza:** la gente se sentaba en el aire, en bancos que no existen.
- **Obras:**
  - lo apoyado sobre otra obra quedaba flotando al deshacerla;
  - el fuego de una obra desmontada seguía ardiendo;
  - lo que movías con Shift+Y seguía funcionando invisible en el lugar viejo (molino, catapulta, tirolesa);
  - lo reforzado se fundaba de cero.
- **Mando:**
  - el stick seguía caminando con un menú abierto;
  - el modo foto no tenía salida;
  - no se podía elegir «Amarrarlo acá» en el puente.
- **Pronóstico:** no contaba la gran nevada ni la noche del temporal. La nevada además hacía crecer el arroyo.
- **Tirón de 250-350 ms** al primer golpe a un duende de cada partida (un programa de dibujo que se compilaba en el
  momento).

## Además
- **Notas y subtítulos:** las notas se apilaban repetidas y se perdían las importantes. Los subtítulos tapaban el
  aviso de la E para siempre (ahora duran 12 s). Con letra grande, la mochila, el almacén y la charla se salían.
- **Sonido:**
  - los pasos sonaban a tablón en piedra y césped;
  - el alero sonaba como una cueva honda;
  - las ranitas croaban en invierno.
- **El árbol seco** ofrecía «Anotar undefined» en 142 puntos del valle.
- **164 objetos** (ramitas, llao llao, calafates) quedaban a la vista pero fuera del borde, imposibles de juntar.
- **Barra de armas:** al guardar y abrir quedaba elegida otra casilla. Hachuela y jabalina en el aire al guardar se
  perdían.
- **Aldea:**
  - la taba daba amistad sin tope;
  - el visitante que ya llevaste volvía como recién llegado;
  - el caballo herrado perdía el bono pasada la medianoche;
  - se podía leer el libro prestado en tu casa de la Loma;
  - el telescopio decía «De día no» con la cúpula abierta;
  - plurales del taller.
- **Obras:**
  - la escalera del adarve y el puente levadizo cuentan en la huella;
  - los portones guardan si están abiertos;
  - teñir no atraviesa un entrepiso;
  - el aviso del chiquero desaparece en el momento;
  - el cuadro del nombre se cierra si la obra se deshace.

## Memoria
No hay fuga. El soak largo (`herramientas/soak-duendes.cjs`: 15 noches de campaña, 6 de asedio con guardar y
recargar, 6 de sin fin) mostró que las geometrías suben hasta unas 960 en las primeras noches y se aplanan: era
creación perezosa de modelos, no una pérdida. Memoria, texturas, programas y audio, planos.

## Recorrido del valle
96.721 puntos más el sendero con la física real: nadie bajo el suelo, flotando, ni atrapado en agua; sólo tres
puntos pegados al refugio, que son muebles. Barrido de la tecla E: 219.024 consultas de aviso y unas 330.000 pruebas
con E de verdad, sin ningún caso de E sin aviso.

## Herramienta del gate
`npm run verify` ya no cabía en el límite de 8191 caracteres de cmd.exe («La línea de comandos es demasiado larga»).
Ahora corre `herramientas/verificar-todo.cjs`, que ejecuta los pasos de `scripts["verify:pasos"]` de a uno.
`sumar-prueba.cjs` sigue funcionando igual. Las pruebas que leían `scripts.verify` leen `verify:pasos`.

## Pendiente para el usuario
- **Construir con el mando** (Steam Deck): para la preparación de Steam.
- **Casa de té:** sirve a cualquier hora y a través de paredes.
- **Semillas doradas en el suelo:** el tope de 80 hace que quien nunca las junta pierda silenciosamente las nuevas.
  Se podría reciclar la más vieja.
- **Cielo y ventanas:** la primera estrella fugaz (unos 245 ms) y las ventanas encendidas (unos 83 ms) compilan su
  programa al primer uso. Se arregla igual que el tirón del punto de los duendes.
- **Dos programas de dibujo** se compilan la primera vez que se pasa por (288,-57) y por (-304,8). No se sabe qué
  objeto los usa.
- **Piedra:** si querés que los peldaños de la torre y del faro suenen a piedra, hay que marcarlos.
- **Dificultades:** el juego tiene tres (tranquila, normal, implacable), no cuatro.

## Pruebas
- Gate: 189 pasos, con `verificar-3-8-7-progreso`, `-obras`, `-aldea`, `-duendes` y `-mundo`.
- Humo nuevas: `humo-3-8-7-progreso`, `-obras`, `-aldea`, `-mundo`, `-duendes` y `-fortin`.
- Intermitentes conocidos: `verificar-3-7-2-granja` (tiempo con la PC cargada) y `humo-3-7-4-rueda` (captura).
