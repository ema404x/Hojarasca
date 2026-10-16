# Prototipo 4.0 — casa de té (interior) antes/después (15-10-2026, rama `proto-40-casa-te`)

Prototipo de la referencia 2 (interior con faroles colgados y luz cálida) sobre la casa de té. Sin contenido nuevo, sin textos, sin luces dinámicas
nuevas (el motor sigue con sus luces fijas). Rama sin unir a nada y sin push. Capturas (entrada, barra, mesa, mesa de cerca, fondo con ventanas,
hogar, techo y exterior; de día 14:30, tarde 18:12 y noche 22): `Documents\Hojarasca\trabajo\proto40\casa-te\antes\` y `...\despues\`
(se sacan con `pruebas/fotos-casa-te-40.cjs`).

## Qué cambió (`src/casa-te-luz.js`, enganchado en `estructuras.js` y `main.js`)
- **Faroles colgados y de mesa** de verdad (sombrerete, aro, montantes, base) con vidrio emisivo encendido todo el día (más fuerte de noche) y **halo**
  aditivo que mira a la cámara (un solo dibujo para todos, también los de la galería y la luz que sale por los ventanales, vistos desde afuera).
- **Fuego del hogar** con llamas y brasas emisivas que titilan, y velas en la repisa.
- **Charcos de luz** aditivos en el piso, sobre las mesas bajo cada farol y frente al hogar.
- **Ventanales con el paisaje de afuera** (montañas con nieve, pinos, pradera con lupinos, cerca; pintado por código) que se tiñe con el color del horizonte
  y se oscurece a azul de noche; de día, **rectángulos de sol** en el piso y dos haces tenues.
- **Calidez:** la luz de relleno del interior (la que ya existía) se mezcla con ámbar (48 % de día, hasta 88 % de noche) y sube 16 % de intensidad.
- Todo con calidad: halos, charcos, sol y haces sólo con `calidad.post` (media y alta); en baja quedan faroles emisivos, fuego, paisaje y relleno cálido.

## Costo medido (esta PC, `herramientas/medir-vistas.cjs`, alta, aldea completa, 200 cuadros; una corrida de antes y dos de después)
| vista | antes p50 / p95 | después p50 / p95 |
|---|---|---|
| casa-te-antes (afuera, 12 h) | 12,0 / 12,8 | 12,5 / 14,0 y 12,2 / 13,6 |
| casa-te-fuera-noche | 11,6 / 12,8 | 12,1 / 13,2 y 12,1 / 13,1 |
| casa-te-dentro-dia (nueva) | 15,8 / 16,8 | 16,1 / 17,2 y 16,4 / 18,2 |
| casa-te-dentro-noche (nueva) | 15,8 / 16,6 | 16,0 / 16,9 y 16,2 / 17,9 |
| aldea-plaza-dia (control, sin cambios) | 14,9 / 16,0 | 15,0 / 16,2 y 15,4 / 17,0 |

Conclusión: +2 a +4 % en p50 (el control sin cambios se movió +1 a +3 %: casi todo es ruido entre corridas), p95 hasta +8 % en la peor corrida. Dentro
de lo pedido (~5 %) en p50, justo en p95. Los dibujos de la última cuadro varían de corrida a corrida (±60), no se pueden atribuir. Dentro de la casa
la base ya está en ~16 ms en esta PC: **falta medir en la 4600G**. Gate: `npm run verify` 207 pasos OK.

## Límites
- Los halos y charcos son «pegatinas» de luz: no iluminan personas ni muebles de verdad; el piso y las mesas se ven lavados si se sube la intensidad.
- El paisaje de la ventana es plano (sin paralaje) y la casa sólo tiene ventanales al frente; la referencia tiene uno grande al costado.
- La madera no cambió de color: la calidez viene de la luz. Faltan flores y plantas colgadas, estantes con frascos y la pizarra de la referencia.
- El sol del piso y los haces tienen dirección fija (no siguen al sol real). Las ventanas vistas desde afuera siguen siendo paños lisos.
- Al armar las capturas se vio que la pelusa flotante del valle entra a los interiores (existente; en las capturas se oculta).
