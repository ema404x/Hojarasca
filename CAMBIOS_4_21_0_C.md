# 4.21.0 · parte C — Luz y atmósfera

Rama `v4210-c` (sobre `main` = 4.20.0). Sólo valores, colores y geometría: **0 programas de shader nuevos** (18 construcciones de `ShaderMaterial` en el código, como en la 4.20.0), 0 capas de pantalla completa nuevas, ninguna pasada nueva del postproceso y ningún dibujo nuevo en la plaza (los vidrios de las casas van en el mismo `InstancedMesh` de siempre y sólo de noche).

Capturas antes y después (1920x1081 de lienzo, cámara fija, las mismas del informe de la 4.20.0): `C:\Users\Andres\AppData\Local\Temp\hx\c4210\` — `antes` y `antes-lluvia` (4.20.0), `d1`, `d2` y `d2-lluvia` (4.21.0). Mediciones: `med-base1`, `med-base2` (4.20.0) y `med-nuevo1`, `med-nuevo2` (4.21.0).

## 1. Noche de exterior (`cielo.js`)
| valor | antes | ahora |
|---|---|---|
| ambiente de la noche (`AMBIENTE_NOCHE`) | `#2c3752` | `#34426a` |
| luz de la luna (`LUZ_LUNA`) | `#8aa2d6` | `#9bb6f0` (más azul plateada y más clara) |
| intensidad de la luna | 0,70 | 0,98 (sigue multiplicada por la fase: la luna nueva sigue siendo noche cerrada, con la Vía Láctea) |
| `hemi.intensity` | `0,78 + 0,95·día` | `0,9 + 0,7·día` |

Efecto a ojo (`07`, `03`, `18`): el suelo, los techos y las copas se leen; las casas dejan de ser una mancha negra (siguen siendo oscuras del lado que no da a la luna, como corresponde). El cielo nocturno no se tocó (ya era lo mejor de la serie).

## 2. Ventanas encendidas en las obras del jugador (`casa-viva.js`, `main.js`, `ventanas-mundo.js`)
Hasta la 4.20.0 sólo se encendían las paredes modulares con una luz cerca. Ahora **toda casa armada y terminada** (la casilla, la cabaña de tablas y piedra, la casa con galería, la casona y las once ampliaciones con ventanas) enciende sus vidrios de noche, con el halo de las ventanas del valle (calidad Media y Alta, como el resto).
- `ventanasDeCasa(obra, plano, jugador)` (pura): saca la pose de cada vidrio de la misma cuenta con la que `planos-casas.js` lo arma (1,62 m del pie más `dy`, 0,95 × 0,90 m, la pared gruesa de piedra corre `t/2`); el vidrio encendido va 9 cm hacia afuera, detrás del marco y el travesaño (se lee como ventana, no como cartel). La casilla (que no usa la fábrica) tiene su ventana fija del lado +x.
- **Adentro de la casa no se encienden** (`dentroDeCasa`: huella ancho × fondo girada como la obra, +20 cm): si no, se vería un vidrio anaranjado tapando la noche. Se rehace cada 2 s como el resto de la casa viva.
- **Decisión:** las ventanas de una casa terminada se encienden siempre de noche, haya o no estufa o farol (una casa del jugador sin luz era el hallazgo). Las paredes modulares siguen igual (con luz cerca).
- `ventanas-mundo.js`: lugar para 128 ventanas (antes 64) y color `0xffc77c` (era `0xffb867`): el mismo calor que las ventanas de la aldea.
- Una sola llamada de dibujo para todos los vidrios (como antes); `main.js`: un import y una línea de bucle en `actualizarCasaViva`.

## 3. Luciérnagas (`clima.js`)
De 160 manchas de tamaño 0,9 (a 3 m, ~90 px: «un halo del tamaño de una cabeza») a **240 puntos de tamaño 0,3** (~30 px a 3 m, ~9 px a 10 m) y un amarillo más vivo (`#f0ffa8`). Más cantidad y variedad, no más tamaño. Mismo `Points`, un solo dibujo; la cuenta pasó de 160 a 240 vértices (costo nulo). El tamaño está en una constante (`TAM_LUCI`) que también se repone en cada cuadro.

## 4. Lluvia
**Hallazgo sobre la auditoría:** la 4.20.0 capturó la «lluvia» con el bucle de la herramienta, que corre los cuadros sin tiempo entre uno y otro; el clima real tarda ~25 s de juego en llegar y las capturas salían a medio camino (cielo con claros, suelo seco). Con lluvia plena de verdad (`AUD_LLUVIA=1`, nuevo en la herramienta) la 4.20.0 ya se veía mejor de lo que decía el informe (cielo gris, niebla, charcos, gotas). Igual se afinó:
- cielo cubierto: cenit y horizonte van más al gris (`nub · 0,86` y `nub · 0,78`; eran 0,75 y 0,65) y el sol se tapa más (`nub · 0,8`; era 0,72);
- niebla de lluvia: 0,0040 por unidad (era 0,0028);
- colores: el postproceso apaga la saturación hasta un 18 % con la humedad (`1,06 − uNoche·0,06 − uHumedad·0,18`; usa un uniforme que ya recibía: ni un uniforme nuevo);
- gotas: 0,9 m de largo (eran 0,55: con 1 px de ancho no se leían) y opacidad 0,5 (era 0,35), también en el reciclado y el corte bajo techo (`LARGO_GOTA`).
Calidades sin postproceso (Baja): no ganan el apagado de colores (el postproceso no existe ahí); sí el cielo, la niebla y las gotas.

## 5. Contraste de la plaza de día
Sol 3,4 → 3,6 y ambiente de día 1,73 → 1,6: **la luz total del mediodía queda igual** (±0,35 en la cuenta) y el cociente sol/ambiente sube ~14 %. En la plaza (`05`) se ven las sombras del follaje sobre la ladera y entre las copas; el mirador (`01`) queda idéntico a ojo. No se tocó la paleta del otoño ni de la nieve.

## Presupuesto (ms por captura, notebook, 1080p, lastre de la 4.20.0)
Dos tandas alternadas base / nueva, mediana por captura (CPU del cuadro sin lastre | placa con lastre):

| captura | CPU base | CPU nueva | placa base | placa nueva |
|---|---|---|---|---|
| 05 plaza día | 12,0 / 11,8 | 12,8 / 11,6 | 26,6 / 26,3 | 27,8 / 26,3 |
| 06 plaza ocaso | 10,2 / 9,7 | 10,1 / 8,8 | 27,1 / 26,6 | 28,3 / 26,5 |
| 07 aldea noche (1 tanda) | 9,0 | 9,7 | 23,7 | 24,1 |
| 18 casas noche (1 tanda) | 7,6 | 6,6 | 17,5 | 17,0 |

Media de las dos tandas en la plaza: placa +0,6 ms (día) y +0,5 ms (ocaso), CPU +0,3 y −0,5. La primera tanda de la versión nueva salió ~1,2 ms arriba y la segunda igual a la base: es el ruido de la PC (la base misma varió 0,3 a 0,5 entre tandas, y la cantidad de gente a la vista varía entre corridas: +13 llamadas en `05` salieron de los grupos de gente y animales, no de lo nuevo). Por construcción el cambio no puede costar en el día (valores de luz y color; las ventanas y las luciérnagas sólo existen de noche). **Queda dentro de los 0,5 ms por ruido, no por mejora medida: no se afirma que sea exactamente 0.**

## Lo que no se hizo
- **La cara de la luna más plateada en el cielo** (`caraLuna` en el shader del domo): es un número del shader del cielo; no cambia lo que se ve de la luz y se dejó.
- **Lluvia con «cortina» o mojado nuevo**: no hace falta (con lluvia plena el suelo ya se moja: charcos y oscurecido); cualquier capa de pantalla completa costaría ~0,85 ms.
- **Casas y obras con relieve en las paredes**, copas, personajes: son de la 4.22.0 en adelante (geometría).
- Medición en la 4600G: descartada por el usuario.

## Claves de guardado
Ninguna.

## Pruebas
- Nueva: `pruebas/verificar-4-21-0-c.mjs` (45 comprobaciones: pose de los vidrios contrastada con la geometría de `planos-casas.js`, adentro/afuera, los valores de luz y atmósfera, las reglas del presupuesto —18 shaders, mismos dibujos de clima y cielo, mismas pasadas del postproceso, un solo `InstancedMesh` de vidrios— y 6 mutaciones de la cuenta de las ventanas, una copia con otro nombre y un proceso por copia). Se suma a `verify:pasos`.
- Ajustada a propósito: `pruebas/verificar-3-6-2-visual.mjs` (la gota que llega a un techo se corta en `y - LARGO_GOTA`; antes `y - 0.55`).
- Previas que tocan lo cambiado y siguen en verde: `verificar-2-1`, `2-3`, `2-4`, `2-7-4-luces`, `3-5-distancia`, `3-6-mundo`, `3-8-6-relax`, `3-8-7-obras`, `4-12-0-bordes`, `4-12-1-agua`, `4-12-1-edificios`, `4-12-3-sombras`, `4-2-ampliar`, `4-8-ambiente`, `4-0-3-foto`, `4-8-1-sin-naves`, `4-12-2-visual-animales`, `2-9-vela`, `2-9-maquinas`, `ecosistema-atmosferico-rc18`, `hotfix-visual-rc30`, `microdetalle-material-rc28`, `profundidad-escenica-rc30`, `realismo-visual-rc27`, `relax-2`, `habitat-premium-rc11`, `musgo-40`, `lod-invasores`. Partida real: `pruebas/humo-2-4.cjs` (casa viva: estufa, ventana encendida de noche, horno, buzón, galería, invernadero, embarcadero, corral, adarve, torre) con 36 comprobaciones en verde y ninguna roja. No se corrió `npm run verify` completo.
- Herramienta: `herramientas/auditoria-visual-4-20-0.cjs` suma `AUD_LLUVIA=1` (lluvia plena de verdad) y rehace las ventanas de las casas antes de cada captura.

## Efectos que cruzan a otras zonas
- La noche más clara y el día con más contraste valen también en **La noche de los duendes** (mismo cielo): se ve un poco más (el Desafío se afina en la 4.22.0; la luna llena del Desafío suma encima, como antes).
- No se tocó nada de Historia, economía ni guardado.

## No visto a ojo
Las ventanas con una casa de verdad armada por el jugador (sólo las casas de la demostración de la herramienta, más el humo `humo-2-4` de la estufa y el vidrio); la casona y las ampliaciones con piso alto; el estado «entrar y salir de la casa» de noche; Calidad Baja y Media; la lluvia de noche; el Desafío de noche con los valores nuevos.
