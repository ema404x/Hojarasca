# Hojarasca 3.3.0 — El bosque en bloques y más fluidez

Sigue la 3.2: lo que faltaba para que Hojarasca corra parejo en una placa integrada, y la
segunda vuelta del estilo HushWood. Detalle técnico de luces y modo fluido en
`CAMBIOS_3_3_0_FLUIDEZ.md`.

## El bosque en bloques
- Los árboles lejanos (más allá de ~120 m) son **imágenes pre-dibujadas** de cada especie
  desde 8 ángulos, hechas al cargar en 48 ms con la misma luz y estilo: **los ~7000 se
  dibujan en un solo pedido a la placa**. Otoño, invierno, nieve y bruma, igual.
- El bosque cercano va en bloques que entran y salen de la escena según la distancia: la
  escena pasó de 4226 objetos sueltos a 359.
- Talar, rayos, rebrotes y partidas guardadas siguen igual (el árbol cambia en los dos).
- Dibujos por cuadro caminando: 255 → 163 (-36%). Cuadros disparejos: 5,2% → 1,6%.

## Sin tirones al aparecer luces
- Las luces del juego son las mismas; la placa ve siempre **4 luces y un foco fijos** que se
  reparten entre las más cercanas. Así todo se prepara al cargar y no se arma nada a mitad
  de juego: en un recorrido del valle, de 7–9 compilaciones con trabas de 1,2–2 s a **0**.
  La placa trabaja 5–17% menos de noche. Diferencia de imagen: un nivel de color en 6
  píxeles de 25 vistas.
- **Modo fluido** (Ajustes → video, apagado de entrada): baja la resolución de a 10% (hasta
  70%) sólo si hace falta para no perder el ritmo, y la vuelve a subir.
- Carga: sólo se generan las texturas que el estilo nuevo usa (de 1,9 a 1,6 s con lo
  guardado).

## Estilo (segunda vuelta)
- **Montañas** azules, por capas, con bruma al pie de cada cordón.
- **Rayos de sol** que se filtran por los huecos del follaje.
- **Helechos** plumosos (frondas arqueadas con hojitas), en el piso del bosque y en los
  bajos.
- **Coihue** en capas planas; **pehuén** con su copa de paraguas.
- **Luz dorada** en troncos y suelo donde entra el sol.

## Queda para después
- El sotobosque (helechos, arbustos, piedras) todavía se dibuja por bloque y tipo: es el
  próximo gran recorte de dibujos.
- Rayos todavía tenues si no hay un hueco cerca del sol; coihue lejano algo "en platos".
- Cuadros sueltos de más de 50 ms que no son compilaciones (causa a investigar).

## Cierre en la otra PC (01-10-2026)
- `npm run verify`: 124 de 124. Partidas reales: las 42 en verde.
- `humo-1-11` fallaba de a ratos (3 de 5): la prueba corre a Don Ramón cuando pasa pegado,
  pero apretaba E antes de que el juego recalculara a quién estás mirando, y E le hablaba a
  él en vez de a Ercilia. Era la prueba, no el juego (en una partida nadie se teletransporta):
  ahora espera medio segundo. También deja marcado que ese día ya pasó el correo, para que no
  llegue otra carta en medio. Después: 4 de 4.
- Para la PC sin Git Bash: `herramientas/suite.ps1` y `herramientas/empaquetar.ps1`, iguales a
  los `.sh` (el de empaquetar además confirma que el `index.html` del ejecutable es el probado).
