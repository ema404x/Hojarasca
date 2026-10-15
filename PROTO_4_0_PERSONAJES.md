# Prototipo 4.0 — tres personajes antes/después (15-10-2026, rama `proto-40-personajes`)

Prototipo de las mejoras visuales de la gente (PLAN_4_0.md, 1b) sobre Greta (`aldea-anfitriona`, referencia 6), Dalia
(`aldea-bailarina`) y Anselmo (`poblador-herrero`, referencia 5). Todo va en el sistema común (`src/gente-cuerpo.js`,
`src/gente-ropa.js`), así que se propaga a todos los vecinos. Sin contenido nuevo, sin textos nuevos, sin tocar `main` ni
`v392-mejoras`. La rama NO está unida a nada; el usuario elige qué entra.

Capturas (cuerpo, tres cuartos, espalda, cerca, rostro y delantal, con `pruebas/visor-anfitriona.cjs` en la plaza a las 17:12):
`Documents\Hojarasca\trabajo\proto40\antes\<Nombre>\` y `...\despues\<Nombre>\`.

## Qué cambió (para todos)
- **Caras:** el brillo principal del ojo más grande y el chico abajo a la izquierda (el reflejo de la ventana de las referencias); el iris con más
  luz abajo; cejas más gruesas, con la cola menos afinada y un tono más oscuras que el pelo (se leen en los rubios); el rubor de las mejillas
  un 20 % más presente.
- **Pelo:** 2 mm más de masa (sólo sin gorro), los mechones grandes más marcados más unos mechones finos cruzados (deja de leerse como casco
  liso), el brillo más fuerte; la melena suelta con relieve de mechones ondulados y brillo (antes era un torno liso con el color pintado).
- **Ropa:** botones con forma en todas las prendas (borde en sombra, disco y puntito de luz; de hueso, de bronce o del color de `R.botones`);
  chaleco con el ribete cosido a lo largo de la abertura y el dobladillo en sombra, y en los varones dos bolsillos con tapa; pantalón con la
  raya adelante y la costura del costado; pañuelo al cuello con el nudo chico y las puntas como tela que cae (no conos de papel).
- **Botas:** puntera con su costura, pespunte donde la caña se cose al empeine, taco atrás y la costura de la caña en sombra.

## Cada personaje
- **Anselmo (referencia 5):** boina, chaleco oscuro de lana con tres botones de hueso y bolsillos, camisa clara arremangada, pañuelo colorado,
  cinturón con hebilla y la bolsita, pantalón pardo con raya, botas altas con vuelta clara; la cara con más sonrisa, cejas arqueadas y rubor.
  **Decisión a confirmar:** el delantal de cuero repujado quedó afuera (la referencia va sin delantal); se vuelve con `delantal: '#6c4a2c',
  telaDelantal: 'cuero'` y la guarda 7 en su ficha. La ficha nueva tiene la guarda tejida del cuello (la prueba 3.7.0 pide alguna guarda).
- **Greta (referencia 6):** lo de todos (pelo con mechones y brillo, ojos, cejas, rubor). El vestido, la faja con moño, el delantal con la
  hoja y las rayas, y los mocasines ya estaban de la 3.9.2 y no se tocaron.
- **Dalia:** lo de todos; la melena con relieve. No se tocó el busto propio por persona (cambio reciente) ni el vestido.

## Costo medido (esta PC, `herramientas/medir-vistas.cjs`, calidad alta, aldea completa con 20 vecinos, 200 cuadros)
| vista | antes p50 / p95 | después p50 / p95 | triángulos antes → después |
|---|---|---|---|
| aldea-plaza-dia | 14,9 / 16,1 ms | 14,9 / 16,0 ms | 1.325.182 → 1.325.060 |
| aldea-noche | 14,4 / 16,2 ms | 14,4 / 15,8 ms | 1.449.962 → 1.444.852 |
| aldea-loma-tarde | 14,6 / 15,7 ms | 14,9 / 15,7 ms | 1.304.482 → 1.308.554 |

Diferencia de 0 a +2 % en p50 (dentro del ruido entre corridas; los triángulos cambian menos del 0,5 % porque las piezas nuevas son «finas»:
de lejos no se dibujan). Mismos dibujos. Armar la gente de la aldea: 9,7 s → 9,5 s. Gate: `npm run verify` 207 pasos OK.
Mediciones crudas en `trabajo\proto40\medir\antes.json` y `despues.json`.

## Lo que no se logró (límites del motor y del tiempo)
- La piel y la tela suaves tipo arcilla de las referencias (iluminación global y desenfoque): no.
- La nariz y los pómulos con volumen de las referencias: la forma de la cara no se tocó (cambiarla cambia las 35 caras a la vez).
- Los bolsillos del chaleco se leen poco de cerca (dos tapas chatas); si no gustan, se sacan con una línea.
- La melena de Dalia mejora poco de frente: los mechones de los costados siguen siendo husos lisos; necesitaría mechones sueltos nuevos.
- Las puntas del pañuelo siguen rígidas (sin caída de tela de verdad).
- Las manos y las poses a ese nivel: no (fuera del alcance de este prototipo).
- La maceta naranja que aparece delante en alguna toma de tres cuartos es un objeto de la plaza al azar por partida, no del personaje.

## Recomendación
Entran todas las mejoras del sistema común (ojos, cejas, rubor, pelo, botones, ribetes, costuras, botas): cuestan nada medible y
mejoran a todos. Anselmo con la ropa de la referencia: que el usuario decida si el herrero pierde el delantal o lo lleva sólo en la fragua.
