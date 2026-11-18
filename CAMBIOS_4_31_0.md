# Hojarasca 4.31.0 — Hojarasca detallista

Ramas v4310-a (adentro: el refugio y las casas), v4310-b (el pueblo y la gente) y v4310-c (la naturaleza y el andar), juntadas. Detalle en CAMBIOS_4_31_0_A.md, _B.md y _C.md. Todo con la E de siempre; 0 shaders y 0 luces nuevas.

- El refugio: la lámpara, el farol y las velas se prenden y apagan (la ventana encendida se ve desde afuera); el hogar con fuego (apagado, la chimenea no humea); la pava que silba y el mate; la bomba con chorro; las ventanas que se abren (entra el ruido de afuera) y las cortinas que cambian la luz; el baúl, la alacena con tus conservas y el cajón; la radio; cartas y el libro que se leen; el reloj con la hora del juego y campanadas; la silla y el sillón junto al fuego. En tus casas armadas: sillones y mecedora para sentarse, roperos y aparadores que se abren, el librero, la canilla y el barril.
- El pueblo: los vecinos saludan si los mirás, se quejan si los chocás o les apagás la luz, se tapan de la lluvia, se abrazan del frío y se sacuden la nieve al entrar; golpear puertas; la campanita de los locales y la campana de la escuela; carteles con lo del día; acariciar al perro (te sigue un rato); el escalón del mástil para sentarse; el aljibe; el boletín de ayer en el buzón de la estafeta; humo, ventanas y luz según quién está en casa.
- La naturaleza: sacudir arbustos y árboles chicos (hojas, nieve, pájaros, frutos del calafate); arrancar pasto y amancay; juntar leña suelta; tocar el agua; el sapito con récord; patear piedritas y piñas; el agua que salpica también sin Ultra; pisadas de ripio y ramitas que crujen; mojarse y gotear; matas que se mueven al pasar; ranas que saltan al agua y mariposas que se van.
- Lo que se cambia se guarda (`progreso.casa`, `progreso.puebloDetalles`, `naturaleza`); las partidas viejas cargan como estaban.
- Rendimiento: 0,04–0,08 ms en la plaza y el bosque; lejos del refugio, nada.
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-31-0-a (120; 23 mutaciones), -b (135; 26 mutaciones) y -c (171; 31 mutaciones); las tres partidas reales juntas, sin errores.

## Afuera
- El espejo que te refleja, acostarse sin dormir, los gatos, el paraguas de los vecinos, el aliento con frío sin Ultra y arrancar las flores pintadas del prado.
- Los sonidos nuevos se probaron contando que se piden: las corridas van sin audio.
