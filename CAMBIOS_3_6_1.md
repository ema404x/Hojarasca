# Hojarasca 3.6.1 — Caza de bugs de la Aldea de los Duendes (y del resto)

El usuario pidió "analizá bugs y solucioná", y encontró uno él: después de sentarse en el
sillón de la biblioteca no se podía salir. Cuatro equipos en paralelo: reglas de la aldea,
vecinos y mecánicas, mundo y visual, y el resto del juego con caos.

## Reglas de la aldea y guardado
- Una etapa de obra completada de madrugada quedaba trabada un día entero: ahora, antes de las
  7, queda lista esa misma mañana.
- La experiencia de constructor se podía exprimir aportando de a poco: ahora da lo mismo en
  cualquier orden.
- Una fecha del futuro en un guardado roto trababa la aldea para siempre: ahora se acota al cargar.
- El Desafío guardaba datos de la aldea: ya no.
- Podía bajar un poblador "en el andén" con el tren lejos: ahora hace falta el tren en el andén.
- "Faltan 1 piedra", "faltan 1 anotaciones": ahora en singular.

## Vecinos, charla y mecánicas
- **El sillón de la biblioteca** (encontrado por el usuario): el asiento caía dentro del mueble
  y al levantarte quedabas encerrado. Ahora volvés a donde estabas parado, también al cargar. R,
  estando sentado, siempre te levanta. Probado en los 80 asientos del juego.
- Chicos altos en los almohadones y gente hundida en las sillas: cuenta la altura real.
- Gente afuera de noche con lluvia o nieve; vecinos que llegaban tarde al trabajo y a la escuela.
- Te sentabas encima de un vecino y un vecino en tu silla; las mesas de una invitación quedaban
  a merced de cualquiera; el invitado se frenaba con vos al lado o se sentaba en el aire.
- La invitación se perdía al recargar; el compadre salteaba la visita de siempre; la visita se
  llevaba al vecino que te estaba hablando; novedades y chismes repetidos.
- El menú: lo del lugar desaparecía al volver de un submenú. Además, el clic y el mando no
  andaban: B te agachaba y la cruceta abría la mochila.
- E y el aviso: más de 7.300 pruebas por toda la aldea a distintas horas; siempre coinciden.

## Mundo y visual
- La puerta de la escuela y la de la sala de miel tapaban el paso al abrirse.
- Rendija bajo las ventanas de tablas (se veía el pasto desde adentro).
- Carteles con el texto cortado ("AMOS GENERALE") y postes que tapaban la última letra.
- El suelo de la aldea se movía hasta 1,1 m al alejarse; la malla gruesa asomaba en el borde.
- Nombres encimados en el mapa.
- Las luces de noche cambiaban de golpe y el charco de luz de los faroles parpadeaba: ahora se
  apagan y prenden de a poco (`luces.js`).

## Resto del juego
- Árboles talados en partidas viejas que rebrotaban dentro de la aldea.
- Se podía construir y plantar renovales en la plaza, las calles y adentro de los edificios.
- Alt+Tab en el modo foto dejaba la pausa encima con el modo foto prendido debajo.
- Caos de 25 min con 5 semillas (Relax y Desafío), 198 guardados viejos (incluida la 3.1 con su
  pueblo) y el Desafío hasta la noche 20: sin más fallas. La memoria se mantiene plana yendo y
  viniendo de la aldea en tren.

## Pruebas
- 4 pruebas nuevas al gate: `verificar-3-6-1-aldea/vecinos/mundo/juego`. Gate 144/144.
- 2 partidas reales nuevas: `humo-3-6-1-asientos` y `humo-3-6-1-vecinos`.

## Queda para después
- Obras, renovales o carpas que el jugador ya tenía donde ahora está la aldea quedan encimadas
  (ya no se pueden poner nuevas).
- La lluvia cae debajo de las galerías cuando estás afuera.
- En el mapa, la aldea no tiene calles dibujadas.
- Medir el rendimiento con la máquina tranquila: las mediciones de esta vuelta salieron con
  otros equipos corriendo.
