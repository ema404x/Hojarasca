# Hojarasca 4.31.1 — Mega cacería de bugs

Ramas v4311-a (personajes, la Historia y el pueblo), v4311-b (el refugio, las casas, los objetos y la economía) y v4311-c (el mundo, la física y la naturaleza), juntadas. Detalle en CAMBIOS_4_31_1_A.md, _B.md y _C.md. 0 shaders nuevos.

- Personajes y la Historia (26 arreglos): la E del refugio ya no se la quedan la nota de Eusebio ni el frasco; a caballo, la E en la puerta del galpón te baja; en el Desafío el martillo de Anselmo y el arco de Josefina no se meten en el cuerpo y el golpe dura lo que tiene que durar; los que duermen se acuestan en su cama y no te saludan ni te hablan («está durmiendo»); la escena «En la cabina» sale; el arreo guardado a mitad sigue donde iba; la fiesta de la plaza se junta al pie del duende (no adentro del tronco); avisos de espera y objetivos que dicen lo que pasa; los carteles de la estación se leen; mientras saludan, guardan el mate.
- El refugio y las casas: sentado en sillones y mecedoras ya no quedás detrás del respaldo; la alacena armada muestra lo que hay; el fuego del hogar queda adentro de una boca de piedra; la E de las puertas sale sólo mirándolas (el marco de la ventana ya no abre la puerta). Mochila, colmena, gallinero, pesca y venta jugadas sin pérdidas ni duplicados.
- El mundo y la naturaleza (13 arreglos): el piso de la cordillera que asomaba en las esquinas del valle, 1.679 troncos con el pie en el aire en las laderas, el suelo que se ve y el que se pisa más juntos (28,5 → 12,9 cm), leña y piñas fuera de los troncos, el sapito que picaba en tierra, patear desde un puente, tocar el agua desde un muelle, sacudir a través de paredes, ranas en troncos, gotas que atravesaban el piso; el aviso de la naturaleza ya no tapa la H de talar ni las otras teclas; con Ultra, 0 avisos del compilador.
- En la junta: un comentario se había comido la acción de las puertas (ninguna abría); arreglado, con una prueba que lo vigila.
- Partida larga de 45 min con Alta y Ultra: 0 errores, memoria estable; 289 lugares sin caídas del mapa.
- Verificación: npm run verify de corrido; pruebas nuevas verificar-4-31-1-a (75; 25 mutaciones), -b (24; 14 mutaciones), -c (66; 21 mutaciones) y -junta; las partidas reales de la 4.31.0 y la 4.31.1, juntas.

## Anotado
- No vistos a ojo: la caña de verdad, la granja grande, vender en el almacén o la feria, los sonidos (las corridas van mudas), la gente de una fiesta de cumpleaños de verdad, el mate que vuelve a la mano después del saludo.
- La sombra de contacto de los árboles en laderas fuertes; el pasto arrancado sobre el claro de los huevos de pascua.
