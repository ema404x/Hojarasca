// Tanda H: los moldes. Son los mensajes que el juego arma con variables —lo que cambia
// va entre {0}, {1}…— y el extractor los había perdido en las dos primeras pasadas.
// Son casi todos avisos del HUD, del banco de pruebas y del Desafío.
export const EN_H = {
  // ---- juntar, construir y gastar
  'Llevás {0}': 'You have {0}',
  'Llevás {0} tablas': 'You have {0} planks',
  'Llevás {0} troncos · {1} tablas · {2} piedras': '{0} logs · {1} planks · {2} stones',
  'Hachazo {0} de {1}': 'Axe blow {0} of {1}',
  'Pusiste {0}': 'You placed {0}',
  'Sacaste {0}': 'You took out {0}',
  'Recuperaste {0}': 'You got back {0}',
  'Plantar {0}': 'Plant {0}',
  'Repetir: {0}': 'Repeat: {0}',
  'Deshecha: {0}': 'Undone: {0}',
  'Moviendo {0}': 'Moving {0}',
  'Reparando {0}': 'Repairing {0}',
  'Quedó alineado: {0}': 'Snapped into line: {0}',
  'Cayó: {0}': 'Down: {0}',
  'Arrastró {0} {1} más': 'It took {0} more {1} with it',
  'Tu {0} está terminado': 'Your {0} is finished',
  'Costo total · {0}': 'Total cost · {0}',
  'Resistencia {0}': 'Strength {0}',
  'Resistencia {0}%': 'Strength {0}%',
  'Hace falta {0}': 'You need {0}',
  'Faltan {0}': 'Still missing {0}',
  'faltan {0}': 'missing {0}',
  'faltan {0} {1}': 'missing {0} {1}',
  'Quedan {0}': '{0} left',
  'Se puede hacer algo con {0}': 'You can make something with {0}',
  'encastre {0}': 'snap {0}',
  'Módulo cercano · {0} · {1} · {2} · {3}{4}': 'Nearby module · {0} · {1} · {2} · {3}{4}',
  'Tu refugio · confort {0}/10 · protección {1}%{2}{3}{4}': 'Your shelter · comfort {0}/10 · protection {1}%{2}{3}{4}',

  // ---- el mapa, la brújula y el tiempo
  'Rumbo a {0}': 'Heading for {0}',
  'El mapa aguanta {0}: sacá alguna con el clic derecho': 'The map holds {0}: right-click to remove one',
  'Día {0}': 'Day {0}',
  'Son las {0}': "It's {0}",
  'hace {0} días': '{0} days ago',
  'hace {0} {1}': '{0} {1} ago',
  'Sacada el día {0} a las {1}': 'Taken on day {0} at {1}',
  'Próxima parada: {0} · {1} m · {2}': 'Next stop: {0} · {1} m · {2}',
  'Parado en {0} · E para bajar · W A S D para cambiar de lugar': 'Stopped at {0} · E to get off · W A S D to move around',

  // ---- encargos y cuaderno
  'Encargo de {0}': 'Errand from {0}',
  'Encargo cumplido: contale a {0}': 'Errand done: go tell {0}',
  'Hablar con {0}': 'Talk to {0}',
  'Una pista: {0}': 'A hint: {0}',
  'Logro: {0}': 'Achievement: {0}',
  'Plano recuperado: {0}': 'Blueprint recovered: {0}',

  // ---- Desafío
  'Salud {0}/{1}': 'Health {0}/{1}',
  'Noche {0} · calma · amanece en {1}': 'Night {0} · quiet · sunrise in {1}',
  'Noche {0}{1} · resistiendo': 'Night {0}{1} · holding out',
  'Resististe la noche {0}': 'You held out through night {0}',
  'El disparo cargado usa {0} cargas': 'The charged shot uses {0} charges',
  'Flechas {0} · boleadoras {1} · cargas {2} · emplastos {3} · cristales {4} · piedras {5}':
    'Arrows {0} · bolas {1} · charges {2} · poultices {3} · crystals {4} · stones {5}',
  'Mejor racha {0} {1} · Más noches {2} · Abatidos {3} · Victorias {4}':
    'Best streak {0} {1} · Most nights {2} · Killed {3} · Wins {4}',
  'Récords · {0}{1}': 'Records · {0}{1}',
  'Nido abierto · {0} {1} en pie': 'Nest open · {0} {1} still standing',

  // ---- partidas y archivos
  'Quedó en la partida {0}': 'Saved into game {0}',
  'Es del modo {0}: cambiá de modo en la portada y volvé a importarla':
    "It's from {0} mode: switch modes on the title screen and import it again",
  'hecha con la versión {0}': 'made with version {0}',
  'hojarasca-{0}.png': 'hojarasca-{0}.png',
  'hojarasca-{0}{1}{2}-{3}{4}{5}.png': 'hojarasca-{0}{1}{2}-{3}{4}{5}.png',
  'ranura{0}{1}{2}': 'slot{0}{1}{2}',
  'obra-{0}-{1}': 'obra-{0}-{1}',
  'velo-especial {0}': 'velo-especial {0}',

  // ---- banco de pruebas y medidor
  'Versión {0} · calidad {1} · modo {2}': 'Version {0} · quality {1} · mode {2}',
  'Placa de video: {0}': 'Graphics card: {0}',
  'Límite de cuadros: {0}': 'Frame cap: {0}',
  'Medido el {0}': 'Measured on {0}',
  'Escena: {0}': 'Scene: {0}',
  'calidad {0} {1}×{2}': 'quality {0} {1}×{2}',
  'lógica {0} ms dibujo {1} ms': 'logic {0} ms draw {1} ms',
  'presupuesto L{0} frame EMA {1} ms': 'budget L{0} frame EMA {1} ms',
  'heap {0} MB Δ {1}{2} MB': 'heap {0} MB Δ {1}{2} MB',
  'perfil {0}': 'profile {0}',
};
