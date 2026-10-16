# Prototipo 4.0 — aldea de noche antes/después (16-10-2026, rama `proto-40-aldea-noche`)

Sin contenido nuevo, sin textos, sin luces dinámicas nuevas (siguen las fijas 4+1 de `luces.js`). Rama sin unir a nada y sin push.
Capturas (plaza con el reloj, calle de la Loma, fachada e interior de la cantina, una casa con ventanas, vista general; noche 22 h y atardecer 18:12):
`Documents\Hojarasca\trabajo\proto40\aldea-noche\antes\` y `...\despues\` (se sacan con `pruebas/fotos-aldea-noche-40.cjs`).

## Qué cambió (`src/aldea-noche-luz.js`, enganchado en `aldea-mundo.js`; reutiliza el halo y el charco de `casa-te-luz.js`, que ahora los exporta)
- **Halos aditivos** (un solo dibujo) en cada ventana de los edificios terminados, en cada farol (calle, plaza, estación, faroles de pared de las puertas),
  en la puerta abierta de la cantina y en sus tres farolitos de adentro, y delante de las dos esferas del reloj de la plaza.
- **Charcos de luz cálida en el suelo** (otro dibujo) bajo cada farol y frente a la puerta de la cantina; se suman a la mancha de las ventanas que ya existía.
- Las listas salen de lo que ya está armado (ventanas, luces de clase farol); se rehacen junto con las manchas de las ventanas.
- Calidad: halos y charcos sólo con `calidad.post` (media y alta); en baja quedan los vidrios emisivos de siempre. Se prenden con el mismo alumbrado de la noche.

## Costo medido (esta PC, `herramientas/medir-vistas.cjs`, alta, aldea completa, 200 cuadros; 2 corridas de antes, 2 de después y 1 de control)
| vista | antes p50 / p95 | después p50 / p95 |
|---|---|---|
| aldea-noche | 18,9 / 20,8 y 19,1 / 21,8 | 19,7 / 21,7 y 18,8 / 20,5 (control 18,4 / 20,2) |
| aldea-loma-noche | 18,5 / 20,5 y 18,2 / 20,2 | 18,3 / 20,6 y 18,2 / 20,1 (control 18,3 / 20,3) |
| aldea-plaza-dia (control, sin cambios de noche) | 20,4 / 24,2 y 19,8 / 22,0 | 19,8 / 22,8 y 19,7 / 21,4 (control 18,9 / 20,9) |

Conclusión: sin diferencia medible (dentro del ruido de ±3 %); +5 a +7 dibujos en la noche (294 contra 288). Ojo: hoy esta PC midió 18-20 ms en todo (la
base anotada era ~14,5): lo que importa es la comparación entre corridas del mismo día. Falta medir en la 4600G. Gate: `npm run verify` 207 pasos OK.

## Límites
- Los halos y charcos son «pegatinas» de luz: no iluminan a la gente ni a los muebles de verdad.
- Al atardecer (18:12) no se nota casi nada: el alumbrado del juego todavía no prendió; el cambio es de noche cerrada.
- El humo de las chimeneas ya existía y se ve de noche (hasta 8 chimeneas cercanas); no se tocó: de día pesa mucho y no hace falta sumarle.
- El reloj de la plaza se ve encendido por el halo que tiene adelante; la esfera misma sigue siendo la de siempre (no brilla sola).
- El interior de la cantina ya estaba bastante iluminado por dentro; lo nuevo son los halos de los farolitos y el resplandor de la puerta hacia afuera.
- Las ventanas lejanas tienen halo aunque el edificio se apague por distancia (se ve como un punto cálido; es lo esperado de noche).
- No hay rayos de luz, niebla baja ni reflejos en el agua: eso sería otro prototipo.
