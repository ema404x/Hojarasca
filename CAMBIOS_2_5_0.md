# Hojarasca 2.5.0 — El arsenal

Sobre la 2.4.1. Dieciocho cosas nuevas para pelear en el Desafío. Se fabrican en el
taller (K): las de siempre siguen en su lugar y hay dos categorías nuevas al final,
**Arrojadizas** y **Equipo**. Todo lo que se fabrica una vez se lleva a la otra vuelta.

## Armas

1. **Ballesta de mano** (Armas; 3 tablas, 1 tronco, 2 piedras, junto a un banco). Un
   virote de 70 que atraviesa al primero y sigue. Recarga lenta. Munición: seis virotes
   (tabla y dos piedras).
2. **Facón** (2 piedras, 1 tabla). Cuerpo a cuerpo rapidísimo (22); por la espalda, el doble.
3. **Maza con clavos** (2 troncos, 3 piedras). Lenta y pesada (55): aturde, y contra los
   grandes (bruto, jefe) pega la mitad más.
4. **Arpón de cristal** (3 cristales, tronco, tabla). Engancha al invasor y lo arrastra
   hasta tres metros tuyo (o hacia tus trampas). Al jefe no lo mueve nadie.
5. **Ballesta de repetición** (mejora; 4 cristales, 2 tablas): tres virotes seguidos.

## Arrojadizas (se tiran con clic)

6. **Hachas arrojadizas** (de a dos): derriban al que corre. Quedan en el suelo y se
   levantan al pasar.
7. **Jabalinas** (de a dos): llegan lejos y pegan fuerte (62). También se levantan.
8. **Granadas de cristal**: estallan al tocar algo (75 en el centro, radio 4). No la
   tires cerca tuyo. Cerca de la zanja la prenden; cerca de un barril, lo hacen estallar.
9. **Bombas de humo**: una nube de nueve segundos. Los que están adentro o cerca, o los
   que te buscan mientras vos estás adentro, te pierden el rastro: caminan para cualquier
   lado y no atacan.
10. **Bengalas**: se tiran para arriba, estallan y quedan colgadas medio minuto. Todo
    invasor a menos de 34 m queda a la vista (los ojos prendidos, y el jefe sombra también).

## Flechas y arco

11. **Flechas incendiarias** (4 por un tronco y dos ramitas): el invasor arde cuatro
    segundos. Clavadas cerca de la zanja la prenden; cerca de un barril, estalla.
12. **Flechas de cristal** (4 por un cristal y una tabla): atraviesan al primero y
    contra los grandes pegan un 60% más.
13. **Carcaj** (Equipo): con el arco en la mano, clic derecho cambia de flecha
    (comunes → incendiarias → de cristal). Si se acaba una clase, pasa sola a la otra.
14. **Arco tensado**: manteniendo el clic se tensa. Al soltar, hasta un 60% más de daño
    y un 35% más de alcance. Un clic corto es un tiro común.

## Equipo

15. **Escudo de tablas**: con un arma de una mano (facón, hacha, honda, pistola,
    martillo, lo que se tira), clic derecho sostenido bloquea: de frente pasa un 35%.
16. **Chaleco acolchado**: cada golpe te saca un quinto menos.
17. **Placas de cristal** (mejora del chaleco): el primer golpe de cada noche no te hace nada.
18. **Cuerno de guardia**: soplado, los compañeros vienen a tu lado y los invasores a
    menos de 16 m dudan un instante. Se vuelve a soplar a los cuarenta segundos.
    **Boleadoras de cristal** (mejora): además de enredar, dan una descarga a los de al lado.

## Cómo está hecho

- `desafio-arsenal.js`: los números y las reglas, puro (se prueba en Node).
- `desafio-arsenal-mundo.js`: lo que se ve y se mueve (proyectiles, lo que queda en el
  suelo, el humo, las bengalas, el fuego sobre los invasores, el arrastre, la ráfaga).
- `desafio.js` lo engancha en pocos lugares marcados con «2.5».
- Las armas nuevas van en la barra después de la linterna y el hacha, para no sacarlas.

## Arreglos que aparecieron en el camino

- Un nombre heredado del objeto («constructor») pasaba por tipo de flecha válido (el
  mismo tipo de bug que el de los tintes en la 2.4.1).

## Verificación

- `npm run verify`: 104 pasos en verde. Nueva: `verificar-2-5.mjs` (reglas, taller,
  guardado, barra y enganches). Ajustadas: la prueba de datos de las armas acepta las de
  apoyo (humo, bengala, cuerno), y la de Nueva partida+ ahora lleva el arsenal.
- Partidas reales en Electron: nueva `humo-2-5.cjs` (27 comprobaciones): se fabrica todo
  con K, Tab y los números; cada arma contra invasores quietos; lo que atraviesa, lo que
  se levanta, el escudo, la armadura, el carcaj, el arco tensado, el humo, la bengala,
  el cuerno, y que se guarde y vuelva al abrir. Las diez del Desafío, en verde (dos se
  ajustaron: el taller ahora tiene siete categorías).
